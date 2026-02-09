from sqlalchemy import Column, Integer, String, DateTime
from app.database.session import Base

class ForgotPassword(Base):
    __tablename__ = "t_forgot_password"
    pk_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, nullable=False)
    code = Column(String, nullable=False)
    expired = Column(DateTime(timezone=False), nullable=False)