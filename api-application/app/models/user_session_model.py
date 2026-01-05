
from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime, func
from app.database.session import Base
from sqlalchemy.orm import relationship


class UserSession(Base):
    __tablename__ = "t_user_session"
    pk_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("t_user.pk_id", ondelete="CASCADE"), nullable=False)
    access_token = Column(Text, nullable=False)
    token_expired = Column(DateTime, nullable=True)
    session_creation_date = Column(DateTime, default=func.now(), nullable=False)

    user = relationship("User", back_populates="sessions")