from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
import shutil
import uuid
import os

from app.models.chat_room import ChatRoom
from app.models.chat_message import ChatMessage, MessageType
from app.models.user_model import User
from app.schemas.chat import ChatMessageOut, ChatMessageUpdateOut
from app.websockets.chat_manager import manager
from datetime import datetime
from fastapi.encoders import jsonable_encoder

FILE_RULES = {
    "image": {
        "folder": "images",
        "extensions": {"jpg", "jpeg", "png", "gif", "webp"},
    },
    "voice": {
        "folder": "voice",
        "extensions": {"webm", "ogg", "m4a", "mp3", "wav"},
    },
    "video": {
        "folder": "videos",
        "extensions": {"mp4", "webm", "mov", "mkv", "avi"},
    },
    "file": {
        "folder": "files",
        "extensions": {"pdf", "doc", "docx", "xls", "xlsx", "txt", "zip"},
    },
}

def serialize_message(message: ChatMessageOut):
    msg_dict = message.dict()
    if isinstance(msg_dict.get("created_at"), datetime):
        msg_dict["created_at"] = msg_dict["created_at"].isoformat()
    if isinstance(msg_dict.get("read_at"), datetime) and msg_dict["read_at"] is not None:
        msg_dict["read_at"] = msg_dict["read_at"].isoformat()
    return msg_dict

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

async def send_text_message(db: Session, current_user: User, room: ChatRoom, content: str):
    msg = ChatMessage(
        room_id=room.id,
        sender_id=current_user.pk_id,
        type=MessageType.TEXT,
        content=content
    )
    db.add(msg)
    db.flush()

    room.last_message_id = msg.id
    room.last_message_at = msg.created_at

    db.commit()
    db.refresh(msg)

    payload = jsonable_encoder(ChatMessageOut.from_orm(msg))

    await manager.broadcast_to_room(
        room.id,
        {
            "type": "message",
            "message": payload,
        },
        exclude_user_id=None,
    )

    for uid in (room.candidate_user_id, room.employer_user_id):
        await manager.broadcast_to_user(uid, {
            "type": "chat_list_update",
            "room_id": room.id,
            "last_message": payload,
        })

    return payload 

async def send_file_message(
    db: Session,
    room: ChatRoom,
    sender_id: int,
    file_type: str,
    caption: str | None,
    file: UploadFile,
):
    print(f"file type {file_type}")

    rule = FILE_RULES.get(file_type)
    if not rule:
        raise HTTPException(400, "Unsupported file type")

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in rule["extensions"]:
        raise HTTPException(
            400,
            f"Invalid file extension for {file_type}"
        )

    folder = rule["folder"]

    filename = f"{uuid.uuid4()}.{ext}"
    path = f"uploads/chat/{folder}/{filename}"
    os.makedirs(os.path.dirname(path), exist_ok=True)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    msg = ChatMessage(
        room_id=room.id,
        sender_id=sender_id,
        type=MessageType(file_type),
        content=caption,
        file_url=f"/{path}",
        file_size=file.size,
        mime_type=file.content_type,
    )

    db.add(msg)
    db.flush()

    room.last_message_id = msg.id
    room.last_message_at = msg.created_at

    db.commit()
    db.refresh(msg)

    serialized = serialize_message(ChatMessageOut.from_orm(msg))

    await manager.broadcast_to_room(
        room.id,
        {
            "type": "message",
            "message": serialized,
        }
    )

    for uid in (room.candidate_user_id, room.employer_user_id):
        await manager.broadcast_to_user(uid, {
            "type": "chat_list_update",
            "room_id": room.id,
            "last_message": serialized,
        })

    return jsonable_encoder(serialized)

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
        
def get_total_unread_count(db, user_id: int) -> int:
    return (
        db.query(func.count(ChatMessage.id))
        .join(ChatRoom, ChatRoom.id == ChatMessage.room_id)
        .filter(
            ChatMessage.is_read == False,
            ChatMessage.sender_id != user_id,
            (ChatRoom.candidate_user_id == user_id) |
            (ChatRoom.employer_user_id == user_id)
        )
        .scalar()
    )
    
async def edit_message(
    db: Session,
    room: ChatRoom,
    message_id: int,
    requester_id: int,
    new_content: str | None = None,
    new_file: UploadFile | None = None,
    new_file_type: str | None = None,
):
    msg: ChatMessage | None = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.id == message_id,
            ChatMessage.room_id == room.id,
        )
        .first()
    )

    if not msg:
        raise HTTPException(404, "Message not found")

    if msg.sender_id != requester_id:
        raise HTTPException(403, "Only sender can edit this message")

    if new_content is not None:
        msg.content = new_content

    if new_file:
        if not new_file_type:
            raise HTTPException(400, "File type is required")

        rule = FILE_RULES.get(new_file_type)
        if not rule:
            raise HTTPException(400, "Unsupported file type")

        if "." not in new_file.filename:
            raise HTTPException(400, "File has no extension")

        ext = new_file.filename.rsplit(".", 1)[-1].lower()
        if ext not in rule["extensions"]:
            raise HTTPException(400, "Invalid file extension")

        # delete old file
        if msg.file_url:
            old_path = msg.file_url.lstrip("/")
            if os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except Exception:
                    pass

        folder = rule["folder"]
        filename = f"{uuid.uuid4()}.{ext}"
        path = f"uploads/chat/{folder}/{filename}"
        os.makedirs(os.path.dirname(path), exist_ok=True)

        with open(path, "wb") as f:
            shutil.copyfileobj(new_file.file, f)

        msg.type = MessageType(new_file_type)  # fix: set type not file
        msg.file_url = f"/{path}"
        msg.file_size = new_file.size
        msg.mime_type = new_file.content_type

    msg.edited_at = datetime.utcnow()

    db.commit()
    db.refresh(msg)

    # Convert Pydantic model to JSON-serializable dict
    serialized = ChatMessageUpdateOut.from_orm(msg).model_dump(mode="json")

    # ---- broadcast ----
    await manager.broadcast_to_room(
        room.id,
        {
            "type": "message_updated",
            "message": serialized,
        },
    )

    for uid in (room.candidate_user_id, room.employer_user_id):
        await manager.broadcast_to_user(
            uid,
            {
                "type": "chat_list_update",
                "room_id": room.id,
                "last_message": serialized,
            },
        )

    return serialized

async def delete_message(
    db: Session,
    room: ChatRoom,
    message_id: int,
    requester_id: int
):
    msg: ChatMessage | None =(
        db.query(ChatMessage)
        .filter(
            ChatMessage.id == message_id,
            ChatMessage.room_id == room.id
        ).first()
    )
    
    if not msg:
        raise HTTPException(404, "Message not found")
    
    if msg.file_url:
        file_path = msg.file_url.lstrip("/")
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
            
    db.delete(msg)
    db.flush()

    last_msg = (
        db.query(ChatMessage)
        .filter(ChatMessage.room_id == room.id)
        .order_by(ChatMessage.created_at.desc())
        .first()
    )
    
    room.last_message_id = last_msg.id if last_msg else None
    room.last_message_at = last_msg.created_at if last_msg else None
    
    db.commit()

    await manager.broadcast_to_room(
        room.id,
        {
            "type": "message_deleted",
            "message_id": message_id,
            "room_id": room.id
        }
    )
    
    for uid in (room.candidate_user_id, room.employer_user_id):
        await manager.broadcast_to_user(
            uid,
            {
                "type": "chat_list_update",
                "room_id": room.id,
                "last_message": (
                    serialize_message(ChatMessageOut.from_out(last_msg))
                    if last_msg
                    else None
                )
            }
        )
        
    return {"status": "ok", "deleted_message_id": message_id}