
from sqlalchemy import Column, Integer, DateTime, func, String, Date
from app.database.session import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "t_user"
    pk_id = Column(Integer, primary_key=True, autoincrement=True)
    user_name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)
    user_type = Column(Integer, nullable=False)
    gender = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    address = Column(String, nullable=True)
    created_date = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    sessions = relationship("UserSession", back_populates="user")