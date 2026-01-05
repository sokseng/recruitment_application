from sqlalchemy import Column, Integer, Text, DateTime, func, String, Date
from app.database.session import Base

class Employer(Base):
    __tablename__ = "t_employer"
    pk_id = Column(Integer, primary_key=True, autoincrement=True)
    position = Column(String, nullable=False)
    position_number = Column(String, nullable=False)
    posting_date = Column(Date, nullable=False)
    closing_date = Column(Date, nullable=False)
    status = Column(String, nullable=False)
    salary_ring = Column(Integer, nullable=True)
    working_from = Column(String, nullable=True)
    job_description = Column(Text, nullable=False)
    created_date = Column(DateTime(timezone=True), default=func.now(), nullable=False)