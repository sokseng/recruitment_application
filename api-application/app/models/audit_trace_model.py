from sqlalchemy import Column, Integer,Text, DateTime, String
from app.database.session import Base

class AuditTrace(Base):
    __tablename__ = "t_audit_trace"
    pk_id = Column(Integer, primary_key=True, autoincrement=True)
    user_action = Column(String(100))
    action_datetime = Column(DateTime)
    action = Column(String(150))
    ip = Column(String(50), nullable=True)
    detail_information = Column(Text, nullable=True)