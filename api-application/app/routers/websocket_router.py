from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Annotated, List
from sqlalchemy import or_, func
from app.models.user_model import User
from app.models.chat_room import ChatRoom
from app.models.chat_message import ChatMessage, MessageType
from app.schemas.chat import (
    SendTextMessage, SendFileMessage,
    ChatMessageOut, ConversationSummary
)
from app.dependencies.chat import get_current_active_user, get_current_user_ws
from app.websockets.chat_manager import manager
from app.controllers.chat_controller import (
    get_or_create_chat_room,
    send_file_message,
    mark_conversation_read,
    get_unread_counts_for_user,
    send_text_message,
)
from app.dependencies.auth import verify_access_token
from starlette.websockets import WebSocketClose
import time
from fastapi.encoders import jsonable_encoder
import asyncio
from app.controllers.chat_controller import handle_call_timeout, _persist_disconnect_call
from app.database.db_for_ws import get_db_ws

router = APIRouter(prefix="/ws", tags=["chat"])

@router.websocket("/")
async def websocket_global(ws: WebSocket):
    await ws.accept()

    with get_db_ws() as db:
        user = await get_current_user_ws(ws, db)
        if not user:
            await ws.close(code=1008)
            return

        unread_counts = get_unread_counts_for_user(db, user.pk_id)

    user_id = user.pk_id
    username = user.user_name
    profile_image = user.profile_image

    await manager.connect(ws, user_id, room_id=None)

    await ws.send_json({
        "type": "unread_snapshot",
        "counts": unread_counts
    })
    
    restore = manager.get_restore_data(user_id)

    if restore:
        with get_db_ws() as db:
            other_user = db.query(User).filter(
                User.pk_id == restore["otherUserId"]
            ).first()

        await ws.send_json({
            "type": "call.restore",
            "roomId": restore["roomId"],
            "mode": restore["mode"],
            "status": restore["status"],
            "fromUserId": restore["otherUserId"],
            "fromUsername": other_user.user_name if other_user else None,
            "fromProfileImage": other_user.profile_image if other_user else None,
        })

    try:
        while True:
            data = await ws.receive_json()
            event_type = data.get("type")
            payload = data.get("payload", {})

            if event_type in ("ping", "pong"):
                continue

            elif event_type == "call.join":
                manager.join_room(user_id, payload["room_id"])
            elif event_type == "call.leave":
                manager.leave_room(user_id, payload["room_id"])

            elif event_type == "call.initiate":
                async with manager.call_lock:
                    room_id = payload["room_id"]
                    mode = payload.get("mode", "video")

                    with get_db_ws() as db:
                        room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
                        if not room:
                            await manager.broadcast_to_user(user_id, {
                                "type": "error",
                                "message": "Room not found"
                            })
                            continue
                        
                        if user_id not in (room.candidate_user_id, room.employer_user_id):
                            await manager.broadcast_to_user(user_id, {
                                "type": "error",
                                "message": "Unauthorized call attempt"
                            })
                            continue
                        
                        if room.is_blocked:
                            await manager.broadcast_to_user(user_id,{
                                "type": "error",
                                "message": "Cannot start call. This chat is blocked"
                            })
                            continue
                        
                        receiver_id = room.employer_user_id if user_id == room.candidate_user_id else room.candidate_user_id

                        receiver = db.query(User).filter(User.pk_id == receiver_id).first()
                        if not receiver:
                            await manager.broadcast_to_user(user_id, {
                                "type": "error",
                                "message": "Invalid receiver"
                            })
                            continue
                        
                        sender = db.query(User).filter(User.pk_id == user_id).first()
                        if not sender:
                            continue

                        caller_busy = any(
                            user_id in call["participants"] and call["status"] in ("ringing", "active")
                            for call in manager.active_calls.values()
                        )
                        receiver_busy = any(
                            receiver_id in call["participants"] and call["status"] in ("ringing", "active")
                            for call in manager.active_calls.values()
                        )

                        if caller_busy:
                            await manager.broadcast_to_user(user_id, {
                                "type": "call.busy",
                                "message": "You are already in another call"
                            })
                            
                            await send_text_message(
                                db=db,
                                current_user=sender,
                                room=room,
                                content="📞 Call not started (user is busy)",
                                message_type=MessageType.CALL
                            )
                            continue

                        if receiver_busy:
                            await manager.broadcast_to_user(user_id, {
                                "type": "call.busy",
                                "message": "User is busy"
                            })
                            
                            await send_text_message(
                                db=db,
                                current_user=sender,
                                room=room,
                                content="📞 Call not started (user is busy))",
                                message_type=MessageType.CALL
                            )
                            continue

                    manager.active_calls[room_id] = {
                        "mode": mode,
                        "participants": [user_id, receiver_id],
                        "caller_id": user_id,
                        "status": "ringing",
                        "started_at": datetime.utcnow()
                    }

                    # Auto end after 30s if not accepted
                    manager.call_timeouts[room_id] = asyncio.create_task(
                        handle_call_timeout(room_id, user_id)
                    )

                    await manager.broadcast_call_event(
                        [receiver_id],
                        "call.incoming",
                        {
                            "fromUserId": user_id,
                            "fromUsername": username,
                            "fromProfileImage": profile_image,
                            "roomId": room_id,
                            "mode": mode
                        }
                    )

            elif event_type == "call.accept":
                room_id = payload["room_id"]
                call_data = manager.active_calls.get(room_id)
                if not call_data or call_data.get("status") != "ringing":
                    continue
                
                with get_db_ws() as db:
                    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()

                if not room:
                    continue
                
                if room.is_blocked:
                        await manager.broadcast_to_user(user_id,{
                            "type": "error",
                            "message": "Cannot start call. This chat is blocked"
                        })
                        continue

                # Cancel timeout
                timeout_task = manager.call_timeouts.pop(room_id, None)
                if timeout_task:
                    timeout_task.cancel()

                call_data["status"] = "active"
                participants = call_data["participants"]
                other_user = next(uid for uid in participants if uid != user_id)

                await manager.broadcast_call_event(
                    [other_user],
                    "call.accepted",
                    {
                        "fromUserId": user_id,
                        "fromUsername": username,
                        "fromProfileImage": profile_image,
                        "roomId": room_id,
                        "mode": call_data["mode"]
                    }
                )

            elif event_type == "call.decline":
                room_id = payload["room_id"]
                call_data = manager.active_calls.pop(room_id, None)
                timeout_task = manager.call_timeouts.pop(room_id, None)
                if timeout_task:
                    timeout_task.cancel()

                if not call_data:
                    continue

                participants = call_data["participants"]
                caller_id = call_data["caller_id"]
                other_user_id = next(uid for uid in participants if uid != user_id)

                await manager.broadcast_call_event(
                    participants,
                    "call.declined",
                    {"fromUserId": user_id, "roomId": room_id}
                )

                with get_db_ws() as db:
                    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
                    if room:
                        sender = db.query(User).filter(User.pk_id == caller_id).first()
                        if sender:
                            await send_text_message(
                                db=db,
                                current_user=sender,
                                room=room,
                                content="📵 Call declined",
                                message_type=MessageType.CALL
                            )

            elif event_type == "call.end":
                room_id = payload["room_id"]
                call_data = manager.active_calls.pop(room_id, None)
                timeout_task = manager.call_timeouts.pop(room_id, None)
                if timeout_task:
                    timeout_task.cancel()

                if not call_data:
                    continue

                participants = call_data["participants"]
                caller_id = call_data["caller_id"]

                await manager.broadcast_call_event(
                    participants,
                    "call.ended",
                    {"roomId": room_id}
                )

                with get_db_ws() as db:
                    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
                    if room:
                        sender = db.query(User).filter(User.pk_id == caller_id).first()
                        if sender:
                            await send_text_message(
                                db=db,
                                current_user=sender,
                                room=room,
                                content="📞 Call ended",
                                message_type=MessageType.CALL
                            )
                            
            elif event_type == "call.toggle":
                room_id = payload.get("room_id")
                mic = payload.get("mic")
                cam = payload.get("cam")

                call_data = manager.active_calls.get(room_id)
                if not call_data or user_id not in call_data["participants"]:
                    continue

                other_participants = [uid for uid in call_data["participants"] if uid != user_id]
                await manager.broadcast_call_event(
                    other_participants,
                    "call.toggle",
                    {
                        "fromUserId": user_id,
                        "mic": mic,
                        "cam": cam
                    }
                )

            else:
                if not event_type.startswith("chat.") and not event_type.startswith("call."):
                    await ws.send_json({
                        "type": "error",
                        "message": "Invalid event type"
                    })

    except WebSocketDisconnect:
        # Disconnect and get affected calls
        ended_calls = manager.disconnect(ws, user_id)

        # Save system messages for ended calls
        with get_db_ws() as db:
            for room_id_, sender_id in ended_calls:
                room = db.query(ChatRoom).filter(ChatRoom.id == room_id_).first()
                sender = db.query(User).filter(User.pk_id == sender_id).first()
                if room and sender:
                    await send_text_message(
                        db=db,
                        current_user=sender,
                        room=room,
                        content="📞 Call ended (disconnect)",
                        message_type=MessageType.CALL
                    )
                    
@router.websocket("/chat/room/{room_id}")
async def websocket_chat(
    websocket: WebSocket,
    room_id: int,
):
    
    await websocket.accept()
    
    with get_db_ws() as db:
        current_user = await get_current_user_ws(websocket, db)
        if not current_user:
            await websocket.close(code=1008)
            return
    
    current_user_id = current_user.pk_id

    await websocket.send_json({
        "type": "connected",
        "room_id": room_id,
        "user_id": current_user_id
    })

    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if current_user_id not in (
        room.candidate_user_id,
        room.employer_user_id,
    ):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    await manager.connect(websocket, current_user_id, room.id)
    
    online_users = manager.get_online_users(room.id) - {current_user_id}
    for uid in online_users:
        await websocket.send_json({"type": "presence", "userId": uid, "online": True})

    try:
        while True:
            data = await websocket.receive_json()
            
            msg_type = data.get("type")
            
            if msg_type in ("ping", "pong"):
                continue

            elif msg_type == "typing":
                await manager.broadcast_typing(
                    room.id,
                    current_user_id,
                    data.get("is_typing", False)
                )

            else:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid message type"
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket, current_user_id, room.id)

        await manager.broadcast_to_room(
            room.id,
            {
                "type": "presence",
                "userId": current_user_id,
                "online": False
            },
            exclude_user_id=current_user_id
        )