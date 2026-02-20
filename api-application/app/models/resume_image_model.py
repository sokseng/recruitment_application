#resume_image_model.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, BigInteger
from sqlalchemy.orm import relationship
from app.database.session import Base
from datetime import datetime


class ResumeImage(Base):
    __tablename__ = "t_resume_image"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resume_id = Column(
        Integer,
        ForeignKey("t_candidate_resume.pk_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    filename = Column(String(255), nullable=False)          
    original_name = Column(String(255), nullable=True)      
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    size_bytes = Column(BigInteger, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)

    resume = relationship("CandidateResume", back_populates="images")