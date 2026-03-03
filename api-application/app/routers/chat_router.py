from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import Annotated, List
from sqlalchemy import or_, func
from app.database.deps import get_db
from app.models.user_model import User
from app.models.chat_room import ChatRoom
from app.models.chat_message import ChatMessage, MessageType
from app.models.message_react_model import MessageReaction, ReactionType
from app.schemas.chat import (
    SendTextMessage, SendFileMessage,
    ChatMessageOut, ConversationSummary, EditTextMessage,
    ForwardMessageRequest, PinnedMessageOut, ReactionRequest
)
from fastapi import Body
from app.dependencies.chat import get_current_active_user
from app.websockets.chat_manager import manager
from app.controllers.chat_controller import (
    get_or_create_chat_room,
    send_file_message,
    mark_conversation_read,
    send_text_message,
    get_total_unread_count,
    edit_message,
    delete_message,
    forward_message,
    pin_message,
    unpin_message,
    toggle_reaction,
    get_message_reactions,
    remove_reaction,
    get_unread_counts_for_user,
    block_user_in_room
)
from app.schemas.chat import ChatRoomOut, CreateChatIn, UserSearchOut, GetOrCreateRoomRequest, ChatBlockResponse, UserPreview
from app.dependencies.auth import verify_access_token
from typing import Optional

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/find-users", response_model=list[UserSearchOut])
def search_users(
    q: str,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token),
):
    current_user = (
        db.query(User)
        .filter(User.pk_id == current_user_id)
        .first()
    )

    query = db.query(User).filter(
        User.pk_id != current_user_id,
        or_(
            User.user_name.ilike(f"%{q}%"),
            User.email.ilike(f"%{q}%"),
            User.phone.ilike(f"%{q}%"),
        )
    )

    if current_user.user_type != 1:
        query = query.filter(User.user_type != 1)

    users = query.limit(10).all()
    return users

@router.get("/", response_model=List[ConversationSummary])
def get_my_conversations(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    current_user = db.query(User).filter(User.pk_id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")

    rooms = (
        db.query(ChatRoom)
        .filter(
            or_(
                ChatRoom.candidate_user_id == current_user.pk_id,
                ChatRoom.employer_user_id == current_user.pk_id
            )
        )
        .order_by(ChatRoom.last_message_id.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    result = []
    for room in rooms:
        other_user = (
            room.employer_user
            if room.candidate_user_id == current_user.pk_id
            else room.candidate_user
        )

        last_msg = None
        if room.last_message_id:
            last_msg = (
                db.query(ChatMessage)
                .options(
                    joinedload(ChatMessage.sender),

                    joinedload(ChatMessage.reply_to)
                        .joinedload(ChatMessage.sender),

                    joinedload(ChatMessage.forward_from)
                        .joinedload(ChatMessage.sender),
                )
                .filter(ChatMessage.id == room.last_message_id)
                .first()
            )

        unread_count = (
            db.query(func.count(ChatMessage.id))
            .filter(
                ChatMessage.room_id == room.id,
                ChatMessage.sender_id != current_user.pk_id,
                ChatMessage.is_read == False
            )
            .scalar()
            or 0
        )

        result.append({
            "room_id": room.id,
            "user_id": other_user.pk_id,
            "profile_image": other_user.profile_image,
            "username": other_user.user_name,
            "last_message": ChatMessageOut.from_orm(last_msg) if last_msg else None,
            "last_message_at": last_msg.created_at if last_msg else None,
            "unread_count": unread_count,
        })

    return sorted(
        result,
        key=lambda x: x["last_message_at"] or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True
    )
    
@router.post("/get-or-create-room")
def get_or_create_room(
    request: GetOrCreateRoomRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token),
):
    room = get_or_create_chat_room(db, current_user_id, request.other_user_id)
    
    if not room:
        return None

    other_user = (
        room.employer_user
        if room.candidate_user_id == current_user_id
        else room.candidate_user
    )

    return {
        "room_id": room.id,
        "user_id": other_user.pk_id,
        "username": other_user.user_name,
        "profile_image": other_user.profile_image,
        "last_message": None,
        "last_message_at": None,
        "unread_count": 0,
    }
    
@router.get("/recent-rooms")
def list_recent_rooms(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token),
):
    rooms = (
        db.query(ChatRoom)
        .filter(
            (ChatRoom.candidate_user_id == current_user_id)
            | (ChatRoom.employer_user_id == current_user_id)
        )
        .order_by(ChatRoom.created_at.desc())
        .all()
    )

    results = []

    for room in rooms:
        other_user = (
            room.employer_user
            if room.candidate_user_id == current_user_id
            else room.candidate_user
        )

        results.append(
            {
                "room_id": room.id,
                "user_id": other_user.pk_id,
                "username": other_user.user_name,
                "profile_image": other_user.profile_image,
                "last_message": None,
                "last_message_at": None,
                "unread_count": 0,
                "created_at": room.created_at,
            }
        )

    return results
    
@router.post("/messages")
async def send_text(
    request: SendTextMessage = Body(...),
    current_user_id: int = Depends(verify_access_token),
    db: Session = Depends(get_db),
):
    current_user = db.query(User).filter(User.pk_id == current_user_id).first()
    if not current_user:
        raise HTTPException(404, "User not found")

    room = db.query(ChatRoom).filter(ChatRoom.id == request.room_id).first()
    if not room:
        raise HTTPException(404, "Chat room not found")

    if current_user_id not in (room.candidate_user_id, room.employer_user_id):
        raise HTTPException(403, "Not allowed")
    
    if room.is_blocked:
        raise HTTPException(403, "Cannot sent message because this chat is blocked.")

    payload = await send_text_message(
        db=db,
        current_user=current_user,
        room=room,
        content=request.content,
        reply_to_id=request.reply_to_id,
    )
    
    return payload

@router.post("/messages/file", response_model=ChatMessageOut)
async def send_file(
    room_id: Annotated[int, Form()],
    type: Annotated[str, Form()],  # image | voice | video
    content: Annotated[str | None, Form()] = None,
    reply_to_id: Annotated[int | None, Form()] = None,
    file: UploadFile = File(...),
    current_user_id: int = Depends(verify_access_token),
    db: Session = Depends(get_db),
):
    current_user = db.query(User).filter(User.pk_id == current_user_id).first()
    if not current_user:
        raise HTTPException(404, "User not found")
    
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(404, "Chat room not found")

    if current_user_id not in (
        room.candidate_user_id,
        room.employer_user_id,
    ):
        raise HTTPException(403, "Not allowed")
    
    if room.is_blocked:
        raise HTTPException(403, "Cannot sent message because this chat is blocked.")

    return await send_file_message(
        db=db,
        room=room,
        current_user=current_user,
        file_type=type,
        caption=content,
        file=file,
        reply_to_id=reply_to_id
    )
    
@router.post("/messages/forward")
async def forward_message_to_rooms(
    request: ForwardMessageRequest,
    current_user_id: int = Depends(verify_access_token),
    db: Session = Depends(get_db)
):
    current_user = db.query(User).filter(User.pk_id == current_user_id).first()
    if not current_user:
        raise HTTPException(404, "User not found")

    original_msg = db.query(ChatMessage).filter(ChatMessage.id == request.message_id).first()
    if not original_msg:
        raise HTTPException(404, "Message not found")

    rooms = db.query(ChatRoom).filter(ChatRoom.id.in_(request.target_room_ids)).all()
    if not rooms:
        raise HTTPException(404, "No target room found")

    blocked_rooms = [room.id for room in rooms if room.is_blocked]
    if blocked_rooms:
        raise HTTPException(
            403,
            f"Cannot send message because the following rooms are blocked: {blocked_rooms}"
        )

    payloads = await forward_message(
        db=db,
        current_user=current_user,
        original_msg=original_msg,
        target_rooms=rooms
    )

    return {"forwarded_messages": payloads}
    
@router.get("/{current_room_id}")
def get_chat_list_without_current(
    current_room_id: int,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user_id: int = Depends(verify_access_token),
    db: Session = Depends(get_db),
):
    base_query = (
        db.query(ChatRoom)
        .filter(
            ChatRoom.id != current_room_id,
            ChatRoom.is_blocked == False,
            (
                (ChatRoom.candidate_user_id == current_user_id) |
                (ChatRoom.employer_user_id == current_user_id)
            )
        )
    )

    total = base_query.count()

    rooms = (
        base_query
        .order_by(ChatRoom.last_message_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    items = [
        {
            "room_id": room.id,
            "username": (
                room.employer_user.user_name
                if room.candidate_user_id == current_user_id
                else room.candidate_user.user_name
            ),
            "last_message_at": room.last_message_at,
        }
        for room in rooms
    ]

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": offset + limit < total,
    }

@router.get("/room/{room_id}/messages", response_model=List[ChatMessageOut])
async def get_messages(
    room_id: int,
    current_user_id: int = Depends(verify_access_token),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(404, "Chat room not found")

    if current_user_id not in (
        room.candidate_user_id,
        room.employer_user_id,
    ):
        raise HTTPException(403, "Not allowed")

    msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.room_id == room.id)
        .order_by(ChatMessage.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    unread = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.room_id == room.id,
            ChatMessage.sender_id != current_user_id,
            ChatMessage.is_read == False
        )
        .all()
    )

    if unread:
        now = datetime.utcnow()
        for m in unread:
            m.is_read = True
            m.read_at = now
        db.commit()

        await manager.broadcast_to_room(
            room.id,
            {
                "type": "read",
                "byUserId": current_user_id,
                "timestamp": now.isoformat()
            },
            exclude_user_id=current_user_id
        )

    return list(reversed(msgs))  # oldest → newest

@router.post("/{other_user_id}/messages/read")
async def mark_read(
    other_user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    await mark_conversation_read(db, current_user, other_user_id)
    
    counts = get_unread_counts_for_user(db, current_user.pk_id)

    await manager.broadcast_to_user(
        current_user.pk_id,
        {
            "type": "unread_update",
            "counts": counts
        }
    )
    
    return {"status": "read"}

@router.get("/messages/unread/counts")
def unread_counts(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    rows = (
        db.query(
            ChatMessage.room_id,
            func.count(ChatMessage.id)
        )
        .join(ChatRoom, ChatRoom.id == ChatMessage.room_id)
        .filter(
            ChatMessage.is_read == False,
            ChatMessage.sender_id != current_user_id,
            (ChatRoom.candidate_user_id == current_user_id) |
            (ChatRoom.employer_user_id == current_user_id)
        )
        .group_by(ChatMessage.room_id)
        .all()
    )

    return {room_id: count for room_id, count in rows}

@router.put("/room/{room_id}/messages/{message_id}/text")
async def edit_text_message(
    room_id: int,
    message_id: int,
    payload: EditTextMessage,
    current_user_id: int = Depends(verify_access_token),
    db: Session = Depends(get_db),
):
    content = payload.content
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(404, "Chat room not found")

    if current_user_id not in (room.candidate_user_id, room.employer_user_id):
        raise HTTPException(403, "Not allowed")
    
    if room.is_blocked:
        raise HTTPException(403, "Cannot edit message because this chat is blocked.")

    return await edit_message(
        db=db,
        room=room,
        message_id=message_id,
        requester_id=current_user_id,
        new_content=content
    )
    
@router.put("/room/{room_id}/messages/{message_id}/file")
async def edit_file_message(
    room_id: int,
    message_id: int,
    file_type: Annotated[str, Form()],
    file: UploadFile = File(...),
    caption: str | None = Form(None),
    current_user_id: int = Depends(verify_access_token),
    db: Session = Depends(get_db),
):
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(404, "Chat room not found")

    if current_user_id not in (room.candidate_user_id, room.employer_user_id):
        raise HTTPException(403, "Not allowed")
    
    if room.is_blocked:
        raise HTTPException(403, "Cannot edit message because this chat is blocked.")

    return await edit_message(
        db=db,
        room=room,
        message_id=message_id,
        requester_id=current_user_id,
        new_content=caption,
        new_file=file,
        new_file_type=file_type
    )
    
@router.delete("/room/{room_id}/messages/{message_id}")
async def delete_message_by_id(
    message_id: int,
    room_id: int,
    current_user_id: int = Depends(verify_access_token),
    db: Session = Depends(get_db),
):
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(404, "Chat room not found")

    if current_user_id not in (
        room.candidate_user_id,
        room.employer_user_id,
    ):
        raise HTTPException(403, "Not allowed")
    
    if room.is_blocked:
        raise HTTPException(403, "Cannot delete message because this chat is blocked.")

    return await delete_message(
        db=db,
        room=room,
        message_id=message_id,
        requester_id=current_user_id,
    )
    
@router.post("/rooms/{room_id}/messages/{message_id}/pin")
async def pin_message_route(
    room_id: int,
    message_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(404, "Room not found")
    
    if current_user_id not in (room.candidate_user_id, room.employer_user_id):
        raise HTTPException(403, "Not allowed in this room")
    
    if room.is_blocked:
        raise HTTPException(403, "Cannot pin message because this chat is blocked.")

    result = await pin_message(
        db=db,
        room=room,
        message_id=message_id,
        requester_id=current_user_id
    )

    return result

@router.delete("/rooms/{room_id}/pin")
async def unpin_message_route(
    room_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(404, "Room not found")
    
    if current_user_id not in (room.candidate_user_id, room.employer_user_id):
        raise HTTPException(403, "Not allowed in this room")
    
    if room.is_blocked:
        raise HTTPException(403, "Cannot unpin message because this chat is blocked.")

    result = await unpin_message(
        db=db,
        room=room,
        requester_id=current_user_id
    )

    return result

@router.get("/rooms/{room_id}/pin", response_model=Optional[PinnedMessageOut])
async def get_pinned_message(
    room_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    room = db.query(ChatRoom).options(joinedload(ChatRoom.pinned_message)).filter(ChatRoom.id == room_id).first()

    if not room:
        raise HTTPException(404, "Room not found")

    if current_user_id not in (room.candidate_user_id, room.employer_user_id):
        raise HTTPException(403, "Not allowed in this room")

    if not room.pinned_message:
        return None

    return PinnedMessageOut(
        message=ChatMessageOut.model_validate(room.pinned_message).model_dump(),
        pinned_by_user=room.pinned_by_user,
        pinned_at=room.pinned_at
    )

@router.post("/rooms/{room_id}/messages/{message_id}/react")
async def react_by_id(
    room_id: int,
    message_id: int,
    payload: ReactionRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token),
):
    room = (
        db.query(ChatRoom)
        .filter(ChatRoom.id == room_id)
        .first()
    )

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if current_user_id not in (room.candidate_user_id, room.employer_user_id):
        raise HTTPException(status_code=403, detail="Not allowed in this room")

    return await toggle_reaction(
        db=db,
        room=room,
        message_id=message_id,
        user_id=current_user_id,
        reaction=payload.reaction
    )
    
@router.get("/rooms/{room_id}/messages/{message_id}/reactions")
def get_reactions(
    room_id: int,
    message_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token),
):
    message = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.id == message_id,
            ChatMessage.room_id == room_id
        )
        .first()
    )

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    return get_message_reactions(
        db=db,
        message_id=message_id,
        current_user_id=current_user_id
    )

@router.delete("/rooms/{room_id}/messages/{message_id}/react")
async def remove_reaction_by_id(
    room_id: int,
    message_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    # Check if the message exists
    message = db.query(ChatMessage).filter(
        ChatMessage.id == message_id,
        ChatMessage.room_id == room_id
    ).first()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Assuming you have a ChatRoom object
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Call the remove_reaction function
    return await remove_reaction(
        db=db,
        room=room,
        message_id=message_id,
        user_id=current_user_id
    )

@router.get("/rooms/{room_id}/shared-media")
def get_user_shared_media(
    room_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token),
    limit: int = Query(50, ge=1, le=200),
    cursor: Optional[datetime] = Query(None),
    type: Optional[str] = Query(None)  # 'media', 'voice', 'file'
):
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not existing")

    if current_user_id not in [room.candidate_user_id, room.employer_user_id]:
        raise HTTPException(status_code=403, detail="Not authorized to access this room")

    query = db.query(ChatMessage).filter(ChatMessage.room_id == room_id)

    # Filter by type
    if type == "media":
        query = query.filter(ChatMessage.type.in_([MessageType.IMAGE, MessageType.VIDEO]))
    elif type == "voice":
        query = query.filter(ChatMessage.type == MessageType.VOICE)
    elif type == "file":
        query = query.filter(ChatMessage.type == MessageType.FILE)

    if cursor:
        query = query.filter(ChatMessage.created_at < cursor)

    messages = query.order_by(ChatMessage.created_at.desc()).limit(limit + 1).all()

    has_more = len(messages) > limit
    if has_more:
        messages = messages[:limit]

    next_cursor = messages[-1].created_at if messages else None

    return {
        "data": [ChatMessageOut.from_orm(msg) for msg in messages],
        "nextCursor": next_cursor,
        "hasMore": has_more
    }
    
@router.post("/rooms/{room_id}/block", response_model=ChatBlockResponse)
async def block_user(room_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not existing")

    if current_user_id not in [room.candidate_user_id, room.employer_user_id]:
        raise HTTPException(status_code=403, detail="Not authorized to access this room")

    room = await block_user_in_room(db, room, blocker_id=current_user_id, block=True)

    blocked_user_info = None
    if room.blocked_by_user:
        blocked_user_info = UserPreview(
            pk_id=room.blocked_by_user.pk_id,
            user_name=room.blocked_by_user.user_name,
            # avatar_url=room.blocked_by_user.avatar_url
        )

    return ChatBlockResponse(
        room_id=room.id,
        is_blocked=room.is_blocked,
        blocked_by_user=blocked_user_info,
        blocked_at=room.blocked_at.isoformat() if room.blocked_at else None
    )
    
@router.post("/rooms/{room_id}/unblock", response_model=ChatBlockResponse)
async def unblock_user(
    room_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not existing")

    if current_user_id not in [room.candidate_user_id, room.employer_user_id]:
        raise HTTPException(status_code=403, detail="Not authorized to access this room")

    room = await block_user_in_room(db, room, blocker_id=current_user_id, block=False)

    blocked_user_info = None
    if room.blocked_by_user:
        blocked_user_info = UserPreview(
            pk_id=room.blocked_by_user.pk_id,
            user_name=room.blocked_by_user.user_name
        )

    return ChatBlockResponse(
        room_id=room.id,
        is_blocked=room.is_blocked,
        blocked_by_user=blocked_user_info,
        blocked_at=room.blocked_at.isoformat() if room.blocked_at else None
    )
    
@router.get("/rooms/{room_id}/block-status", response_model=ChatBlockResponse)
def check_block_status(
    room_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not existing")
    
    if current_user_id not in [room.candidate_user_id, room.employer_user_id]:
        raise HTTPException(status_code=403, detail="Not authorized to access this room")

    blocked_user_info = None
    if room.blocked_by_user:
        blocked_user_info = UserPreview(
            pk_id=room.blocked_by_user.pk_id,
            user_name=room.blocked_by_user.user_name,
            # avatar_url=room.blocked_by_user.avatar_url
        )

    return ChatBlockResponse(
        room_id=room.id,
        is_blocked=room.is_blocked,
        blocked_by_user=blocked_user_info,
        blocked_at=room.blocked_at.isoformat() if room.blocked_at else None
    )

