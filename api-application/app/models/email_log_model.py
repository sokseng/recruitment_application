from sqlalchemy import Column, Integer, String, Date, func
from app.database.session import Base

class EmailLog(Base):
    __tablename__ = "t_email_log"
    pk_id = Column(Integer, primary_key=True, autoincrement=True)
    to_email = Column(String, nullable=False)
    date_sent = Column(Date, nullable=False, server_default=func.current_date())