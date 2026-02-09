from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum
from typing import Literal

class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    VOICE = "voice"
    VIDEO = "video"
    FILE = "file"


class SendTextMessage(BaseModel):
    room_id: int
    content: str
    type: Literal['text'] = 'text'

class SendFileMessage(BaseModel):
    to_user_id: int
    type: str           # "image" | "voice"
    content: Optional[str] = None  # caption
    
class EditTextMessage(BaseModel):
    content: str
    type: Literal['text'] = 'text'

class ChatMessageOut(BaseModel):
    id: int
    room_id: int
    sender_id: int
    type: MessageType
    content: Optional[str]
    file_url: Optional[str]
    file_size: Optional[int]
    mime_type: Optional[str]
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
    avatar_url: str | None = None

    class Config:
        from_attributes = True

class GetOrCreateRoomRequest(BaseModel):
    other_user_id: int