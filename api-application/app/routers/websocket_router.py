from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Annotated, List
from sqlalchemy import or_, func
from app.database.deps import get_db
from app.models.user_model import User
from app.models.chat_room import ChatRoom
from app.models.chat_message import ChatMessage
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

router = APIRouter(prefix="/ws/chat", tags=["chat"])

@router.websocket("/{other_user_id}")
async def websocket_chat(
    websocket: WebSocket,
    other_user_id: int,
    db: Session = Depends(get_db)
):
    try:
        current_user = await get_current_user_ws(websocket, db)
        if not current_user:
            return  # connection already closed
    except Exception as e:
        print("Unexpected WS auth error:", e)
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        return

    current_user_id = current_user.pk_id

    await websocket.accept()
    
    room = get_or_create_chat_room(db, current_user_id, other_user_id)

    await manager.connect(websocket, current_user_id, room.id)

    await manager.broadcast_to_room(room.id, {
        "type": "presence",
        "userId": current_user_id,
        "online": True
    }, exclude_user_id=current_user_id)

    try:
        while True:
            data = await websocket.receive_json()
            type = data.get("type")
            
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, current_user_id, room.id)

        await manager.broadcast_to_room(room.id, {
            "type": "presence",
            "userId": current_user_id,
            "online": False
        }, exclude_user_id=current_user_id)

