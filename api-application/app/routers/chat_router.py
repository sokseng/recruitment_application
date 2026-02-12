from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import Annotated, List
from sqlalchemy import or_, func
from app.database.deps import get_db
from app.models.user_model import User
from app.models.chat_room import ChatRoom
from app.models.chat_message import ChatMessage
from app.schemas.chat import (
    SendTextMessage, SendFileMessage,
    ChatMessageOut, ConversationSummary, EditTextMessage,
    ForwardMessageRequest, PinnedMessageOut
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
    unpin_message
)
from app.schemas.chat import ChatRoomOut, CreateChatIn, UserSearchOut, GetOrCreateRoomRequest
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
):
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
        "avatar_url": None,
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
                "avatar_url": None,
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
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(404, "Chat room not found")

    if current_user_id not in (
        room.candidate_user_id,
        room.employer_user_id,
    ):
        raise HTTPException(403, "Not allowed")

    return await send_file_message(
        db=db,
        room=room,
        sender_id=current_user_id,
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
    current_user = db.query(User).filter(
        User.pk_id == current_user_id
    ).first()
    if not current_user:
        raise HTTPException(404, "User not found")

    original_msg = db.query(ChatMessage).filter(
        ChatMessage.id == request.message_id
    ).first()
    if not original_msg:
        raise HTTPException(404, "Message not found")

    rooms = db.query(ChatRoom).filter(
        ChatRoom.id.in_(request.target_room_ids)
    ).all()
    if not rooms:
        raise HTTPException(404, "No target room found")

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
                room.employer.username
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
def get_messages(
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
        now = func.now()
        for m in unread:
            m.is_read = True
            m.read_at = now
        db.commit()

        manager.broadcast_to_room(
            room.id,
            {
                "type": "read",
                "byUserId": current_user_id,
                "timestamp": str(now)
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
    return {"status": "read"}

@router.get("/messages/unread/count")
def unread_count(db: Session = Depends(get_db),  current_user_id: int = Depends(verify_access_token)):
    return {
        "count": get_total_unread_count(db, current_user_id)
    }


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
    print("Room not found")
    if not room:
        raise HTTPException(404, "Room not found")

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



