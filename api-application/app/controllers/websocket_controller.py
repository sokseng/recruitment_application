from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.chat_message import ChatMessage, MessageType
from app.schemas.chat import ChatMessageOut
from app.controllers.chat_controller import (
    get_or_create_chat_room,
    send_file_message,
    mark_conversation_read
)
from app.models.chat_room import ChatRoom

from datetime import datetime

def serialize_message(message: ChatMessageOut):
    msg_dict = message.dict()
    if isinstance(msg_dict.get("created_at"), datetime):
        msg_dict["created_at"] = msg_dict["created_at"].isoformat()
    if isinstance(msg_dict.get("read_at"), datetime) and msg_dict["read_at"] is not None:
        msg_dict["read_at"] = msg_dict["read_at"].isoformat()
    return msg_dict

async def send_text_message_ws(
    *,
    db: Session,
    room_id: int,
    sender_id: int,
    content: str,
):
    content = content.strip()
    if not content:
        return None

    msg = ChatMessage(
        room_id=room_id,
        sender_id=sender_id,
        type=MessageType.TEXT,
        content=content,
    )

    db.add(msg)
    db.flush()

    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        return None

    room.last_message_id = msg.id
    room.last_message_at = msg.created_at

    db.commit()
    db.refresh(msg)
    
    msg_out = ChatMessageOut.from_orm(msg).dict()
    msg_out["created_at"] = msg_out["created_at"].isoformat()
    if msg_out["read_at"]:
        msg_out["read_at"] = msg_out["read_at"].isoformat()

    print("Saved message:", msg.content, "id:", msg.id)

    return msg_out
