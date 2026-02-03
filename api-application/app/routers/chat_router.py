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
    send_file_message,
    mark_conversation_read
)
from app.schemas.chat import ChatRoomOut, CreateChatIn, UserSearchOut
from app.dependencies.auth import verify_access_token

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/find-users", response_model=list[UserSearchOut])
def search_users(
    q: str,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token),
):
    users = (
        db.query(User)
        .filter(
            User.pk_id != current_user_id,
            or_(
                User.user_name.ilike(f"%{q}%"),
                User.email.ilike(f"%{q}%"),
                User.phone.ilike(f"%{q}%"),
            )
        )
        .limit(10)
        .all()
    )
    return users

@router.get("/", response_model=List[ConversationSummary])
def get_my_conversations(db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token),):
    current_user = db.query(User).filter(User.pk_id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")

    rooms = db.query(ChatRoom).filter(
        or_(
            ChatRoom.candidate_user_id == current_user.pk_id,
            ChatRoom.employer_user_id == current_user.pk_id
        )
    ).all()

    result = []
    for room in rooms:
        if room.candidate_user_id == current_user.pk_id:
            other_user = room.employer_user
        else:
            other_user = room.candidate_user

        unread_count = db.query(func.count(ChatMessage.id)).filter(
            ChatMessage.room_id == room.id,
            ChatMessage.sender_id != current_user.pk_id,
            ChatMessage.is_read == False
        ).scalar() or 0

        last_msg = room.last_message

        result.append({
            "id": other_user.pk_id,
            "username": other_user.user_name,
            "last_message": ChatMessageOut.from_orm(last_msg) if last_msg else None,
            "unread_count": unread_count,
            "last_message_at": room.last_message_at
        })

    return sorted(result, key=lambda x: x["last_message_at"] or datetime.min, reverse=True)

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

@router.get("/{other_user_id}/messages", response_model=List[ChatMessageOut])
def get_messages(
    other_user_id: int,
    current_user_id: int = Depends(verify_access_token),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    other = db.query(User).get(other_user_id)
    if not other:
        raise HTTPException(404, "User not found")

    room = get_or_create_chat_room(
        db,
        current_user_id ,
        other.pk_id
    )

    msgs = db.query(ChatMessage).filter(
        ChatMessage.room_id == room.id
    ).order_by(ChatMessage.created_at.desc()).offset(offset).limit(limit).all()

    unread = db.query(ChatMessage).filter(
        ChatMessage.room_id == room.id,
        ChatMessage.sender_id != current_user_id,
        ChatMessage.is_read == False
    ).all()

    if unread:
        now = func.now()
        for m in unread:
            m.is_read = True
            m.read_at = now
        db.commit()

        manager.broadcast_to_room(
            room.id,
            {"type": "read", "byUserId": current_user_id, "timestamp": str(now)},
            exclude_user_id=current_user_id
        )

    return reversed(msgs)  # oldest first

@router.post("/{other_user_id}/messages/read")
async def mark_read(
    other_user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    await mark_conversation_read(db, current_user, other_user_id)
    return {"status": "read"}