from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form
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
from app.dependencies.chat import get_current_active_user
from app.websockets.chat_manager import manager
from app.controllers.chat_controller import (
    get_or_create_chat_room,
    send_text_message,
    send_file_message,
    mark_conversation_read
)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/messages/text", response_model=ChatMessageOut)
async def send_text(payload: SendTextMessage, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    return await send_text_message(db, current_user, payload.to_user_id, payload.content)


@router.post("/messages/file", response_model=ChatMessageOut)
async def send_file(
    to_user_id: Annotated[int, Form()],
    type: Annotated[str, Form()],  # "image" or "voice"
    content: Annotated[str | None, Form()] = None,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    return await send_file_message(db, current_user, to_user_id, type, content, file)


@router.post("/conversations/{other_user_id}/read")
async def mark_read(
    other_user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    await mark_conversation_read(db, current_user, other_user_id)
    return {"status": "read"}


@router.get("/conversations", response_model=List[ConversationSummary])
def get_my_conversations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    rooms = db.query(ChatRoom).filter(
        or_(
            ChatRoom.candidate_id == current_user.candidate.pk_id if current_user.candidate else None,
            ChatRoom.employer_id == current_user.employer.pk_id if current_user.employer else None
        )
    ).all()

    result = []
    for room in rooms:
        other_id = (
            room.employer.user.pk_id if current_user.candidate else
            room.candidate.user.pk_id
        )
        other_user = db.query(User).get(other_id)

        unread = db.query(func.count(ChatMessage.id)).filter(
            ChatMessage.room_id == room.id,
            ChatMessage.sender_id != current_user.pk_id,
            ChatMessage.is_read == False
        ).scalar() or 0

        last_msg = None
        if room.last_message_id:
            last_msg = db.query(ChatMessage).get(room.last_message_id)

        result.append({
            "other_user_id": other_id,
            "other_user_name": other_user.user_name,
            "other_user_type": other_user.user_type,
            "last_message": ChatMessageOut.from_orm(last_msg) if last_msg else None,
            "unread_count": unread,
            "last_message_at": room.last_message_at
        })

    return sorted(result, key=lambda x: x["last_message_at"] or datetime.min, reverse=True)


@router.get("/messages/{other_user_id}", response_model=List[ChatMessageOut])
def get_messages(
    other_user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    other = db.query(User).get(other_user_id)
    if not other:
        raise HTTPException(404, "User not found")

    room = get_or_create_chat_room(db, current_user, other)

    msgs = db.query(ChatMessage).filter(
        ChatMessage.room_id == room.id
    ).order_by(ChatMessage.created_at.desc()).offset(offset).limit(limit).all()

    # Mark unread as read
    unread = db.query(ChatMessage).filter(
        ChatMessage.room_id == room.id,
        ChatMessage.sender_id != current_user.pk_id,
        ChatMessage.is_read == False
    ).all()

    if unread:
        now = func.now()
        for m in unread:
            m.is_read = True
            m.read_at = now
        db.commit()

        # Notify via WS
        manager.broadcast_to_room(
            room.id,
            {"type": "read", "byUserId": current_user.pk_id, "timestamp": str(now)},
            exclude_user_id=current_user.pk_id
        )

    return reversed(msgs)  # oldest first


@router.websocket("/ws/{other_user_id}")
async def websocket_chat(
websocket: WebSocket,
    other_user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    room = get_or_create_chat_room(db, current_user.pk_id, other_user_id)
    await manager.connect(websocket, current_user.pk_id, room.id)

    await manager.broadcast_to_room(room.id, {
        "type": "presence",
        "userId": current_user.pk_id,
        "online": True
    }, exclude_user_id=current_user.pk_id)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            if msg_type in ("typing", "call_offer", "call_answer", "ice_candidate", "call_reject", "call_end"):
                data["fromUserId"] = current_user.pk_id
                await manager.broadcast_to_room(room.id, data, exclude_user_id=current_user.pk_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, current_user.pk_id, room.id)
        await manager.broadcast_to_room(room.id, {
            "type": "presence",
            "userId": current_user.pk_id,
            "online": False
        }, exclude_user_id=current_user.pk_id)