from sqlalchemy import Column, Integer, ForeignKey, String, Text, Boolean, DateTime, func, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database.session import Base
import enum

class MessageType(str, enum.Enum):
    TEXT  = "text"
    IMAGE = "image"
    VOICE = "voice"
    VIDEO = "video"
    FILE = "file"
    SYSTEM = "system"
    CALL = "call"

class ChatMessage(Base):
    __tablename__ = "t_chat_message"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("t_chat_room.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("t_user.pk_id", ondelete="CASCADE"), nullable=False, index=True)

    type = Column(SQLEnum(MessageType), nullable=False, default=MessageType.TEXT)
    content = Column(Text, nullable=True)           # text or caption
    file_url = Column(String(512), nullable=True)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(120), nullable=True)

    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    reply_to_id = Column(Integer, ForeignKey("t_chat_message.id", ondelete="SET NULL"), nullable=True, index=True)
    forwarded_from_id = Column(Integer, ForeignKey("t_chat_message.id", ondelete="SET NULL"), nullable=True, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    edited_at = Column(DateTime(timezone=True), nullable=True)

    # Make relationships more explicit
    room = relationship(
        "ChatRoom", 
        back_populates="messages",
        foreign_keys=[room_id]  # Explicitly specify foreign key
    )
    
    sender = relationship(
        "User",
        foreign_keys=[sender_id]  # Explicitly specify foreign key
    )
    
    reply_to = relationship("ChatMessage", remote_side=[id], foreign_keys=[reply_to_id], backref="replies")
    forward_from  = relationship("ChatMessage", remote_side=[id], foreign_keys=[forwarded_from_id], backref="forwards")

    
    def __repr__(self):
        return f"<ChatMessage #{self.id} | Room #{self.room_id} | Sender #{self.sender_id}>"