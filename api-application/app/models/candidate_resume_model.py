from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.orm import relationship
from app.database.session import Base
import enum
from app.models.resume_image_model import ResumeImage


class ResumeType(str, enum.Enum):
    TEXT = "Text"
    UPLOAD = "Upload"


class CandidateResume(Base):
    __tablename__ = "t_candidate_resume"

    pk_id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(
        Integer,
        ForeignKey("t_candidate.pk_id", ondelete="CASCADE"),
        nullable=False
    )

    resume_type = Column(SQLEnum(ResumeType), nullable=False)
    resume_file = Column(String(255), nullable=True)  
    resume_content = Column(Text, nullable=True)
    recommendation_letter = Column(Text, nullable=True)  

    is_primary = Column(Boolean, nullable=False, default=False)

    created_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_date = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    candidate = relationship("Candidate", back_populates="resumes")
    images = relationship(
        "ResumeImage",
        back_populates="resume",
        cascade="all, delete-orphan",   
        order_by="ResumeImage.sort_order"
    )