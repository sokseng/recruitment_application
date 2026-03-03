from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
import shutil
import uuid
import os
import asyncio

from app.models.chat_room import ChatRoom
from app.models.chat_message import ChatMessage, MessageType
from app.models.user_model import User
from app.schemas.chat import ChatMessageOut, ChatMessageUpdateOut
from app.websockets.chat_manager import manager
from datetime import datetime
from fastapi.encoders import jsonable_encoder
from typing import Optional
from zoneinfo import ZoneInfo
import pytz
from app.models.message_react_model import MessageReaction, ReactionType
from collections import defaultdict

# Cambodia timezone
cambodia_tz = pytz.timezone("Asia/Phnom_Penh")

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
    
    for key in ("created_at", "edited_at", "read_at"):
        dt = msg_dict.get(key)
        if isinstance(dt, datetime):
            msg_dict[key] = dt.isoformat()
    
    return msg_dict

def get_or_create_chat_room(db: Session, user_a_id: int, user_b_id: int) -> ChatRoom | None:
    # Fetch users
    user_a = db.query(User).filter(User.pk_id == user_a_id).first()
    user_b = db.query(User).filter(User.pk_id == user_b_id).first()

    if not user_a or not user_b:
        return None

    # Keep your deterministic ordering
    if user_a_id < user_b_id:
        candidate_id, employer_id = user_a_id, user_b_id
        initiator, target = user_a, user_b
    else:
        candidate_id, employer_id = user_b_id, user_a_id
        initiator, target = user_b, user_a

    # Try to find existing room first
    room = (
        db.query(ChatRoom)
        .filter(
            ChatRoom.candidate_user_id == candidate_id,
            ChatRoom.employer_user_id == employer_id
        )
        .first()
    )

    # Non–user_type=3 cannot CREATE a room with user_type=3
    if not room and initiator.user_type != 1 and target.user_type == 1:
        return None  # silent block

    # Create room if allowed
    if not room:
        room = ChatRoom(
            candidate_user_id=candidate_id,
            employer_user_id=employer_id
        )
        db.add(room)
        db.commit()
        db.refresh(room)

    return room

async def send_text_message(
    db: Session,
    current_user: User,
    room: ChatRoom,
    content: str,
    reply_to_id: Optional[int] = None,
    message_type: MessageType = MessageType.TEXT,
):
    reply_to = None
    if reply_to_id:
        reply_to = (
            db.query(ChatMessage)
            .filter(ChatMessage.id == reply_to_id, ChatMessage.room_id == room.id)
            .first()
        )
        if not reply_to:
            raise HTTPException(400, "Invalid reply_to_id")

    msg = ChatMessage(
        room_id=room.id,
        sender_id=current_user.pk_id,
        type=message_type,
        content=content,
        reply_to_id=reply_to.id if reply_to else None,
    )
    db.add(msg)
    db.flush()

    receiver_id = (
        room.employer_user_id
        if current_user.pk_id == room.candidate_user_id
        else room.candidate_user_id
    )

    online_users = manager.get_online_users(room.id)
    if receiver_id in online_users:
        msg.is_read = True
        msg.read_at = datetime.utcnow()

    room.last_message_id = msg.id
    room.last_message_at = msg.created_at

    db.commit()
    db.refresh(msg)

    counts = get_unread_counts_for_user(db, receiver_id)

    await manager.broadcast_to_user(
        receiver_id,
        {"type": "unread_update", "counts": counts},
    )

    payload = jsonable_encoder(ChatMessageOut.from_orm(msg))

    await manager.broadcast_to_room(
        room.id,
        {"type": "message", "message": payload},
        exclude_user_id=None  # everyone sees it
    )

    if msg.is_read:
        await manager.broadcast_to_room(
            room.id,
            {
                "type": "read",
                "byUserId": receiver_id,
                "timestamp": msg.read_at.isoformat()
            },
            exclude_user_id=None
        )

    for uid in (room.candidate_user_id, room.employer_user_id):
        other_user_id = (
            room.candidate_user_id if uid != room.candidate_user_id else room.employer_user_id
        )
        other_user = db.query(User).filter(User.pk_id == other_user_id).first()
        await manager.broadcast_to_user(uid, {
            "type": "chat_list_update",
            "room_id": room.id,
            "last_message": payload,
            "username": other_user.user_name,
            "profile_image": other_user.profile_image
        })

    return payload

async def send_file_message(
    db: Session,
    room: ChatRoom,
    current_user: User,
    file_type: str,
    caption: str | None,
    file: UploadFile,
    reply_to_id: int | None = None,
):
    rule = FILE_RULES.get(file_type)
    if not rule:
        raise HTTPException(400, "Unsupported file type")

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in rule["extensions"]:
        raise HTTPException(400, f"Invalid file extension for {file_type}")

    reply_to = None
    if reply_to_id:
        reply_to = (
            db.query(ChatMessage)
            .filter(ChatMessage.id == reply_to_id, ChatMessage.room_id == room.id)
            .first()
        )
        if not reply_to:
            raise HTTPException(400, "Invalid reply to id")

    folder = rule["folder"]
    filename = f"{uuid.uuid4()}.{ext}"
    path = f"uploads/chat/{folder}/{filename}"
    os.makedirs(os.path.dirname(path), exist_ok=True)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    msg = ChatMessage(
        room_id=room.id,
        sender_id=current_user.pk_id,
        type=MessageType(file_type),
        content=caption,
        file_url=f"/{path}",
        file_size=file.size,
        mime_type=file.content_type,
        reply_to_id=reply_to.id if reply_to else None,
    )
    db.add(msg)
    db.flush()

    receiver_id = (
        room.employer_user_id
        if current_user.pk_id == room.candidate_user_id
        else room.candidate_user_id
    )

    online_users = manager.get_online_users(room.id)
    if receiver_id in online_users:
        msg.is_read = True
        msg.read_at = datetime.utcnow()

    room.last_message_id = msg.id
    room.last_message_at = msg.created_at

    db.commit()
    db.refresh(msg)

    counts = get_unread_counts_for_user(db, receiver_id)
    await manager.broadcast_to_user(
        receiver_id,
        {"type": "unread_update", "counts": counts}
    )

    payload = ChatMessageOut.from_orm(msg).model_dump(mode="json")

    await manager.broadcast_to_room(
        room.id,
        {"type": "message", "message": payload}
    )
    
    if msg.is_read:
        await manager.broadcast_to_room(
            room.id,
            {
                "type": "read",
                "byUserId": receiver_id,
                "timestamp": msg.read_at.isoformat(),
            }
        )

    for uid in (room.candidate_user_id, room.employer_user_id):
        other_user_id = (
            room.candidate_user_id if uid != room.candidate_user_id else room.employer_user_id
        )
        other_user = db.query(User).filter(User.pk_id == other_user_id).first()
        await manager.broadcast_to_user(uid, {
            "type": "chat_list_update",
            "room_id": room.id,
            "last_message": payload,
            "username": other_user.user_name,
            "profile_image": other_user.profile_image
        })

    return payload

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
        
def get_total_unread_count(db, room_id: int, user_id: int) -> int:
    return (
        db.query(func.count(ChatMessage.id))
        .join(ChatRoom, ChatRoom.id == ChatMessage.room_id)
        .filter(
            ChatMessage.room_id == room_id,
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

async def remove_file_async(file_path: str):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, lambda: os.remove(file_path) if os.path.exists(file_path) else None)

async def delete_message(
    db: Session,
    room: ChatRoom,
    message_id: int,
    requester_id: int
):
    msg: ChatMessage | None = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.id == message_id,
            ChatMessage.room_id == room.id
        )
        .first()
    )
    
    if not msg:
        raise HTTPException(404, "Message not found")
    
    if msg.sender_id != requester_id:
        raise HTTPException(403, "Only sender can delete this message")

    db.query(MessageReaction).filter(
        MessageReaction.message_id == message_id
    ).delete(synchronize_session=False)
    
    db.delete(msg)

    db.commit()
    
    last_msg = (
        db.query(ChatMessage)
        .options(joinedload(ChatMessage.reply_to))
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
    
    last_message_payload = serialize_message(ChatMessageOut.from_orm(last_msg)) if last_msg else None
    
    for uid in (room.candidate_user_id, room.employer_user_id):
        await manager.broadcast_to_user(
            uid,
            {
                "type": "chat_list_update",
                "room_id": room.id,
                "last_message": last_message_payload 
            }
        )
        
    return {"status": "ok", "deleted_message_id": message_id}

async def forward_message(
    db: Session,
    current_user: User,
    original_msg: ChatMessage,
    target_rooms: list[ChatRoom]
):
    if not original_msg or not target_rooms:
        raise HTTPException(400, "Invalid message or room")

    payloads = []

    for room in target_rooms:
        if current_user.pk_id not in (
            room.candidate_user_id,
            room.employer_user_id
        ):
            continue

        new_msg = ChatMessage(
            room_id=room.id,
            sender_id=current_user.pk_id,
            type=original_msg.type,
            content=original_msg.content,
            file_url=original_msg.file_url,
            file_size=original_msg.file_size,
            mime_type=original_msg.mime_type,
            forwarded_from_id=original_msg.id,
        )

        db.add(new_msg)
        db.flush()

        room.last_message_id = new_msg.id
        room.last_message_at = new_msg.created_at

        payload = jsonable_encoder(
            ChatMessageOut.from_orm(new_msg)
        )

        payloads.append((room, payload))

    db.commit()

    # Broadcast after commit
    for room, payload in payloads:
        await manager.broadcast_to_room(
            room.id,
            {
                "type": "message",
                "message": payload
            }
        )

        for uid in (room.candidate_user_id, room.employer_user_id):
            await manager.broadcast_to_user(
                uid,
                {
                    "type": "chat_list_update",
                    "room_id": room.id,
                    "last_message": payload
                }
            )

    return [payload for _, payload in payloads]

async def pin_message(
    db: Session,
    room: ChatRoom,
    message_id: int,
    requester_id: int
):
    if requester_id not in (room.candidate_user_id, room.employer_user_id):
        raise HTTPException(403, "Not allowed in this room")

    # Get message
    msg: ChatMessage | None = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.id == message_id,
            ChatMessage.room_id == room.id
        )
        .first()
    )

    if not msg:
        raise HTTPException(404, "Message not found")
    
    requester = db.query(User).filter(User.pk_id == requester_id).first()

    # Update pin fields
    room.pinned_message_id = msg.id
    room.pinned_by_user_id = requester_id
    room.pinned_at = datetime.now(cambodia_tz)

    db.commit()
    db.refresh(room)

    payload = jsonable_encoder(
        ChatMessageOut.from_orm(msg)
    )

    # Broadcast to room
    await manager.broadcast_to_room(
        room.id,
        {
            "type": "message_pinned",
            "room_id": room.id,
            "message": payload,
            "pinned_by_user": {
                'pk_id': requester.pk_id,
                'user_name': requester.user_name
                },
            "pinned_at": room.pinned_at.isoformat()
        }
    )

    # Update chat list for both users
    for uid in (room.candidate_user_id, room.employer_user_id):
        await manager.broadcast_to_user(
            uid,
            {
                "type": "chat_list_update",
                "room_id": room.id,
                "pinned_message": payload
            }
        )

    return {
        "status": "ok",
        "pinned_message_id": msg.id
    }
    
async def unpin_message(
    db: Session,
    room: ChatRoom,
    requester_id: int
):
    if requester_id not in (room.candidate_user_id, room.employer_user_id):
        raise HTTPException(403, "Not allowed in this room")

    if not room.pinned_message_id:
        raise HTTPException(400, "No pinned message")

    room.pinned_message_id = None
    room.pinned_by_user_id = None
    room.pinned_at = None

    db.commit()

    await manager.broadcast_to_room(
        room.id,
        {
            "type": "message_unpinned",
            "room_id": room.id,
            "message": None
        }
    )

    for uid in (room.candidate_user_id, room.employer_user_id):
        await manager.broadcast_to_user(
            uid,
            {
                "type": "chat_list_update",
                "room_id": room.id,
                "pinned_message": None
            }
        )

    return {"status": "ok"}

async def toggle_reaction(
    db: Session,
    room: ChatRoom,
    message_id: int,
    user_id: int,
    reaction: ReactionType
):
    existing = db.query(MessageReaction).filter_by(
        message_id=message_id,
        user_id=user_id
    ).first()

    action = None

    if existing:
        if existing.reaction != reaction.value:
            existing.reaction = reaction.value
            action = "updated"
        else:
            # same emoji clicked → do nothing
            action = "unchanged"
    else:
        new_reaction = MessageReaction(
            message_id=message_id,
            user_id=user_id,
            reaction=reaction.value
        )
        db.add(new_reaction)
        action = "added"

    db.commit()

    reaction_data = get_message_reactions(
        db=db,
        message_id=message_id,
        current_user_id=user_id
    )

    room_payload = {
        "type": "message_reaction",
        "room_id": room.id,
        "message_id": reaction_data["message_id"],
        "reactions": reaction_data["reactions"],
    }

    await manager.broadcast_to_room(room.id, room_payload)

    personal_payload = {
        "type": "message_reaction_personal",
        "message_id": reaction_data["message_id"],
        "my_reaction": reaction_data["my_reaction"],
    }

    await manager.broadcast_to_user(user_id, personal_payload)

    for uid in (room.candidate_user_id, room.employer_user_id):
        await manager.broadcast_to_user(
            uid,
            {
                "type": "chat_list_update",
                "room_id": room.id,
                "last_message": "Reacted to a message"
            }
        )

    return {
        "message_id": reaction_data["message_id"],
        "reactions": reaction_data["reactions"],
        "my_reaction": reaction_data["my_reaction"],
    }

async def remove_reaction(
    db: Session,
    room: ChatRoom,
    message_id: int,
    user_id: int
):
    # Check if reaction exists
    existing = db.query(MessageReaction).filter_by(
        message_id=message_id,
        user_id=user_id
    ).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Reaction not found")

    # Delete the reaction
    db.delete(existing)
    db.commit()

    # Fix typo: message_id (was messge_id)
    reactions_summary = (
        db.query(
            MessageReaction.reaction,
            func.count(MessageReaction.id)
        )
        .filter(MessageReaction.message_id == message_id)
        .group_by(MessageReaction.reaction)
        .all()
    )

    # Fix dictionary comprehension syntax
    reactions_dict = {r: {"count": c} for r, c in reactions_summary}

    payload = {
        "type": "message_reaction_removed",
        "room_id": room.id,
        "message_id": message_id,
        "user_id": user_id,
        "reactions": reactions_dict,
        "my_reaction": None
    }

    # Broadcast the removal
    await manager.broadcast_to_room(room.id, payload)

    # Notify participants
    for uid in (room.candidate_user_id, room.employer_user_id):
        await manager.broadcast_to_user(
            uid,
            {
                "type": "chat_list_update",
                "room_id": room.id,
                "last_message": "Removed a reaction"
            }
        )

    return payload

def get_message_reactions(
    db: Session,
    message_id: int,
    current_user_id: int
):
    results = (
        db.query(
            MessageReaction.reaction,
            User.pk_id,
            User.user_name
        )
        .join(User, User.pk_id == MessageReaction.user_id)
        .filter(MessageReaction.message_id == message_id)
        .all()
    )

    reactions_data = defaultdict(lambda: {"count": 0, "users": []})
    my_reaction = None

    for reaction, user_id, user_name in results:
        reaction_value = (
            reaction.value if hasattr(reaction, "value") else reaction
        )

        reactions_data[reaction_value]["count"] += 1
        reactions_data[reaction_value]["users"].append({
            "id": user_id,
            "user_name": user_name
        })

        if user_id == current_user_id:
            my_reaction = reaction_value

    return {
        "message_id": message_id,
        "reactions": reactions_data,
        "my_reaction": my_reaction
    }

def get_unread_counts_for_user(db: Session, user_id: int) -> dict[int, int]:
    rows = (
        db.query(
            ChatMessage.room_id,
            func.count(ChatMessage.id)
        )
        .join(ChatRoom, ChatRoom.id == ChatMessage.room_id)
        .filter(
            ChatMessage.is_read == False,
            ChatMessage.sender_id != user_id,
            (ChatRoom.candidate_user_id == user_id) |
            (ChatRoom.employer_user_id == user_id)
        )
        .group_by(ChatMessage.room_id)
        .all()
    )

    return {room_id: count for room_id, count in rows}

async def handle_call_timeout(room_id: int, caller_id: int, timeout: int = 30):
    try:
        await asyncio.sleep(timeout)

        call_data = manager.active_calls.pop(room_id, None)

        if not call_data or call_data.get("status") != "ringing":
            return

        participants = call_data["participants"]

        await manager.broadcast_call_event(
            [caller_id],
            "call.missed",
            {"roomId": room_id}
        )

        with get_db_ws() as db:
            room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
            caller = db.query(User).filter(User.pk_id == caller_id).first()

            if room and caller:
                await send_text_message(
                    db=db,
                    current_user=caller,
                    room=room,
                    content="📵 Call missed",
                    message_type=MessageType.CALL
                )

    except asyncio.CancelledError:
        pass

    finally:
        manager.call_timeouts.pop(room_id, None)
        
async def _persist_disconnect_call(room_id: int, user_id: int):
        from app.database.db_for_ws import get_db_ws

        with get_db_ws() as db:
            room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
            user = db.query(User).filter(User.pk_id == user_id).first()

            if room and user:
                await send_text_message(
                    db=db,
                    current_user=user,
                    room=room,
                    content="📞 Call ended (disconnect)",
                    message_type=MessageType.CALL
                )

async def block_user_in_room(
    db: Session,
    room: ChatRoom,
    blocker_id: int,
    block: bool = True
):
    blocker_user = db.query(User).filter(User.pk_id == blocker_id).first()
    if not blocker_user:
        raise HTTPException(404, "Blocker user not found")

    if block:
        room.is_blocked = True
        room.blocked_by_user = blocker_user
        room.blocked_at = datetime.utcnow()
    else:
        room.is_blocked = False
        room.blocked_by_user = None
        room.blocked_at = None

    db.commit()
    db.refresh(room)

    blocked_user_info = None
    if room.blocked_by_user:
        blocked_user_info = {
            "pk_id": room.blocked_by_user.pk_id,
            "user_name": room.blocked_by_user.user_name,
            # "avatar_url": room.blocked_by_user.avatar_url
        }

    for uid in (room.candidate_user_id, room.employer_user_id):
        await manager.broadcast_to_user(uid, {
            "type": "chat_room_block_update",
            "room_id": room.id,
            "is_blocked": room.is_blocked,
            "blocked_by_user": blocked_user_info,
            "blocked_at": room.blocked_at.isoformat() if room.blocked_at else None
        })

    return room