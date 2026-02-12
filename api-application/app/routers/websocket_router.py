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
import time
from fastapi.encoders import jsonable_encoder


router = APIRouter(prefix="/ws/chat", tags=["chat"])

@router.websocket("/room/{room_id}")
async def websocket_chat(
    websocket: WebSocket,
    room_id: int,
    db: Session = Depends(get_db)
):
    
    await websocket.accept()
    
    try:
        current_user = await get_current_user_ws(websocket, db)
        if not current_user:
            await websocket.close(code=1008)
            return
    except Exception as e:
        print("WS auth error:", e)
        await websocket.close(code=1011)
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
        
@router.websocket("/ws")
async def websocket_global(ws: WebSocket, db: Session = Depends(get_db)):
    await ws.accept()

    user = await get_current_user_ws(ws, db)
    if not user:
        await ws.close(code=1008)
        return

    user_id = user.pk_id
    await manager.connect(ws, user_id)

    try:
        while True:
            data = await ws.receive_json()
            event_type = data["type"]
            payload = data.get("payload", {})

            if event_type == "chat.join":
                manager.join_room(user_id, payload["room_id"])

            elif event_type == "chat.leave":
                manager.leave_room(user_id, payload["room_id"])
                
            else:
                await ws.send_json({
                        "type": "error",
                        "message": "Invalid event type"
                    })

    except WebSocketDisconnect:
        manager.disconnect(ws, user_id)
