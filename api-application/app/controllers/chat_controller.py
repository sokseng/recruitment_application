from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
import shutil
import uuid
import os

from app.models.chat_room import ChatRoom
from app.models.chat_message import ChatMessage, MessageType
from app.models.user_model import User
from app.schemas.chat import ChatMessageOut
from app.websockets.chat_manager import manager


def get_or_create_chat_room(db: Session, user_a_id: int, user_b_id: int) -> ChatRoom:
    u1, u2 = (min(user_a_id, user_b_id), max(user_a_id, user_b_id))
    if user_a_id < user_b_id:
        candidate_id, employer_id = user_a_id, user_b_id
    else:
        candidate_id, employer_id = user_b_id, user_a_id

    room = db.query(ChatRoom).filter(
        ChatRoom.candidate_user_id == candidate_id,
        ChatRoom.employer_user_id == employer_id
    ).first()

    if not room:
        room = ChatRoom(candidate_user_id=candidate_id, employer_user_id=employer_id)
        db.add(room)
        db.commit()
        db.refresh(room)
    return room

async def send_file_message(db: Session, current_user: User, to_user_id: int, file_type: str, caption: str | None, file: UploadFile):
    room = get_or_create_chat_room(db, current_user.pk_id, to_user_id)

    ext = file.filename.rsplit(".", 1)[-1].lower()
    folder = "images" if file_type == "image" else "voice"
    allowed = {"jpg", "jpeg", "png", "gif", "webp"} if file_type == "image" else {"webm", "ogg", "m4a", "mp3", "wav"}
    if ext not in allowed:
        raise HTTPException(400, f"Invalid file type for {file_type}")

    filename = f"{uuid.uuid4()}.{ext}"
    path = f"uploads/chat/{folder}/{filename}"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    msg = ChatMessage(
        room_id=room.id,
        sender_id=current_user.pk_id,
        type=MessageType.IMAGE if file_type == "image" else MessageType.VOICE,
        content=caption,
        file_url=f"/{path}",
        file_size=file.size,
        mime_type=file.content_type
    )
    db.add(msg)
    db.flush()
    room.last_message_id = msg.id
    room.last_message_at = msg.created_at
    db.commit()
    db.refresh(msg)

    await manager.broadcast_to_room(
        room.id,
        {"type": "message", "message": ChatMessageOut.from_orm(msg).dict()},
        exclude_user_id=current_user.pk_id
    )
    return ChatMessageOut.from_orm(msg)


async def mark_conversation_read(
    db: Session,
    current_user: User,
    other_user_id: int
):
    other = db.query(User).get(other_user_id)
    if not other:
        raise HTTPException(404, "User not found")

    room = get_or_create_chat_room(db, current_user, other)

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

        await manager.broadcast_to_room(
            room.id,
            {
                "type": "read",
                "byUserId": current_user.pk_id,
                "timestamp": str(now)
            },
            exclude_user_id=current_user.pk_id
        )