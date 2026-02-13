from sqlalchemy import Column, Integer, ForeignKey, String, Text, Boolean, DateTime, func, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.session import Base
import enum

class ReactionType(str, enum.Enum):
    LIKE = "like"
    LOVE = "love"
    LAUGH = "laugh"
    WOW = "wow"
    SAD = "sad"
    ANGRY = "angry"

class MessageReaction(Base):
    __tablename__ = 't_chat_message_reaction'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    message_id = Column(Integer, ForeignKey("t_chat_message.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("t_user.pk_id", ondelete="CASCADE"), nullable=True, index=True)

    reaction = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("message_id", "user_id", name="uix_message_user_reaction"),
    )
    
    message = relationship("ChatMessage", backref="reactions")
    user = relationship("User")