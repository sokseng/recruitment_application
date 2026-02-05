from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Annotated, List
from sqlalchemy import or_, func
from app.database.deps import get_db
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
    mark_conversation_read
)
from app.dependencies.auth import verify_access_token
from starlette.websockets import WebSocketClose
from app.controllers.websocket_controller import send_text_message_ws, serialize_message

router = APIRouter(prefix="/ws/chat", tags=["chat"])

@router.websocket("/room/{room_id}")
async def websocket_chat(
    websocket: WebSocket,
    room_id: int,
    db: Session = Depends(get_db)
):
    try:
        current_user = await get_current_user_ws(websocket, db)
        if not current_user:
            return
    except Exception as e:
        print("WS auth error:", e)
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        return

    current_user_id = current_user.pk_id

    # validate room
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

    await websocket.accept()

    # connect socket
    await manager.connect(websocket, current_user_id, room.id)

    # notify presence
    await manager.broadcast_to_room(
        room.id,
        {
            "type": "presence",
            "userId": current_user_id,
            "online": True
        },
        exclude_user_id=current_user_id
    )

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            # typing indicator
            if msg_type == "typing":
                await manager.broadcast_typing(
                    room.id,
                    current_user_id,
                    data.get("is_typing", False)
                )

            # text message
            elif msg_type == MessageType.TEXT.value:
                message = await send_text_message_ws(
                    db=db,
                    room_id=room.id,
                    sender_id=current_user_id,
                    content=data.get("content", "")
                )

                if not message:
                    continue

                serialized = serialize_message(
                    ChatMessageOut.from_orm(message)
                )

                # send message to room
                await manager.broadcast_to_room(
                    room.id,
                    {
                        "type": "message",
                        "message": serialized
                    },
                    exclude_user_id=None
                    )
                

                # update chat list for both users
                for uid in (
                    room.candidate_user_id,
                    room.employer_user_id,
                ):
                    await manager.broadcast_to_user(uid, {
                        "type": "chat_list_update",
                        "room_id": room.id,
                        "last_message": serialized
                    })

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

def serialize_message(message: ChatMessageOut):
    msg_dict = message.dict()
    if isinstance(msg_dict.get("created_at"), datetime):
        msg_dict["created_at"] = msg_dict["created_at"].isoformat()
    if isinstance(msg_dict.get("read_at"), datetime) and msg_dict["read_at"] is not None:
        msg_dict["read_at"] = msg_dict["read_at"].isoformat()
    # include file_url, type, sender_id, etc.
    return msg_dict
