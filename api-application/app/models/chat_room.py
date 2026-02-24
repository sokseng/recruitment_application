from sqlalchemy import Column, Integer, ForeignKey, DateTime, func, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base


class ChatRoom(Base):
    __tablename__ = "t_chat_room"

    id = Column(Integer, primary_key=True, autoincrement=True)

    candidate_user_id = Column(
        Integer,
        ForeignKey("t_user.pk_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    employer_user_id = Column(
        Integer,
        ForeignKey("t_user.pk_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    application_id = Column(
        Integer,
        ForeignKey("t_job_application.pk_id", ondelete="SET NULL"),
        nullable=True
    )

    created_at      = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    last_message_id = Column(Integer, ForeignKey("t_chat_message.id", ondelete="SET NULL"), nullable=True)
    last_message_at = Column(DateTime(timezone=True), nullable=True)
    
    pinned_message_id = Column(Integer, ForeignKey("t_chat_message.id", ondelete="SET NULL"), nullable=True)
    pinned_by_user_id = Column(Integer, ForeignKey("t_user.pk_id", ondelete="SET NULL"), nullable=True)
    pinned_at = Column(DateTime(timezone=True), nullable=True)
    
    is_blocked = Column(Boolean, default=False, nullable=False)
    blocked_by_user_id = Column(Integer, ForeignKey("t_user.pk_id", ondelete="SET NULL"), nullable=True)
    blocked_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    candidate_user = relationship(
        "User",
        foreign_keys=[candidate_user_id],
        back_populates="chat_rooms_as_candidate"
    )
    employer_user = relationship(
        "User",
        foreign_keys=[employer_user_id],
        back_populates="chat_rooms_as_employer"
    )

    # Specify foreign_keys to resolve the ambiguity
    messages = relationship(
        "ChatMessage",
        back_populates="room",
        cascade="all, delete-orphan",
        foreign_keys="[ChatMessage.room_id]",  # Explicitly specify which foreign key to use
        passive_deletes=True
    )
    
    # Add relationship for last_message
    last_message = relationship(
        "ChatMessage",
        foreign_keys=[last_message_id],
        post_update=True  # This helps with circular dependencies
    )
    
    pinned_message = relationship(
        "ChatMessage",
        foreign_keys=[pinned_message_id],
        post_update=True
    )

    pinned_by_user = relationship(
        "User",
        foreign_keys=[pinned_by_user_id]
    )
    
    blocked_by_user = relationship("User", foreign_keys=[blocked_by_user_id])

    __table_args__ = (
        UniqueConstraint("candidate_user_id", "employer_user_id", name="uix_chat_cand_emp"),
    )