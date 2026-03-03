from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from enum import Enum
from typing import Literal

class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    VOICE = "voice"
    VIDEO = "video"
    FILE = "file"
    SYSTEM = "system"
    CALL = "call"
    
class ReactionType(str, Enum):
    LIKE = "like"
    LOVE = "love"
    LAUGH = "laugh"
    WOW = "wow"
    SAD = "sad"
    ANGRY = "angry"

class SendTextMessage(BaseModel):
    room_id: int
    content: str
    type: Literal['text'] = 'text'
    reply_to_id: Optional[int] = None

class SendFileMessage(BaseModel):
    to_user_id: int
    type: str           # "image" | "voice"
    content: Optional[str] = None  # caption
    
class EditTextMessage(BaseModel):
    content: str
    type: Literal['text'] = 'text'
    
class MessagePreview(BaseModel):
    id: int
    sender_id: int
    type: MessageType
    content: Optional[str]
    file_url: Optional[str]
    created_at: datetime

    model_config = {
        "from_attributes": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }

class UserPreview(BaseModel):
    pk_id: int
    user_name: str
    # avatar_url: Optional[str] = None
    
    class Config:
        from_attributes = True
    
class MessagePreview(BaseModel):
    id: int
    sender: UserPreview
    type: MessageType
    content: Optional[str]
    file_url: Optional[str]
    created_at: datetime

    model_config = {
        "from_attributes": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }

class ChatMessageOut(BaseModel):
    id: int
    room_id: int
    sender_id: int
    type: MessageType
    content: Optional[str]
    file_url: Optional[str]
    file_size: Optional[int]
    mime_type: Optional[str]
    
    reply_to: Optional[MessagePreview] = None
    forward_from: Optional[MessagePreview] = None
    
    is_read: bool
    created_at: datetime
    edited_at: Optional[datetime] = None
    read_at: Optional[datetime]

    model_config = {
        "from_attributes": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }
    
class ChatMessageUpdateOut(BaseModel):
    id: int
    room_id: int
    sender_id: int
    type: MessageType
    content: Optional[str]
    file_url: Optional[str]
    file_size: Optional[int]
    mime_type: Optional[str]
    
    reply_to: Optional[MessagePreview] = None
    forward_from: Optional[MessagePreview] = None
    
    is_read: bool
    created_at: datetime
    edited_at: Optional[datetime] = None
    read_at: Optional[datetime]

    model_config = {
        "from_attributes": True,
        "json_encoders": {datetime: lambda v: v.isoformat()}
    }

class ConversationSummary(BaseModel):
    user_id: int
    profile_image: Optional[str] = None
    username: str
    last_message: Optional[ChatMessageOut]
    unread_count: int
    last_message_at: Optional[datetime]
    room_id: Optional[int] = None
    
class CreateChatIn(BaseModel):
    user_id: int
    
class UserResponse(BaseModel):
    pk_id: int
    username: str
    
class ChatRoomOut(BaseModel):
    id: int
    candidate: UserResponse
    employer: UserResponse

    class Config:
        from_attributes = True
        
class UserSearchOut(BaseModel):
    pk_id: int
    user_name: str
    profile_image: str | None = None
    email: str

    class Config:
        from_attributes = True

class GetOrCreateRoomRequest(BaseModel):
    other_user_id: int
    
class ForwardMessageRequest(BaseModel):
    message_id: int
    target_room_ids: List[int]
    
class PinnedMessageOut(BaseModel):
    message: ChatMessageOut
    pinned_by_user: UserPreview
    pinned_at: datetime

class ReactionRequest(BaseModel):
    reaction: ReactionType
    
class  ChatBlockResponse(BaseModel):
    room_id: int
    is_blocked: bool
    blocked_by_user: Optional[UserPreview] = None
    blocked_at: Optional[str]