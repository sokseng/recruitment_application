# job_application_model.py
from sqlalchemy import BigInteger, Column, Integer, ForeignKey, DateTime, Enum as SQLEnum, String, func, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base
import enum

class ApplicationStatus(str, enum.Enum):
    PENDING = "Pending"
    SHORTLISTED = "Shortlisted"
    REJECTED = "Rejected"
    ACCEPTED = "Accepted"

class JobApplication(Base):
    __tablename__ = "t_job_application"
    pk_id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey("t_job.pk_id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("t_candidate.pk_id", ondelete="CASCADE"), nullable=False)
    candidate_resume_id = Column(Integer, ForeignKey("t_candidate_resume.pk_id", ondelete="SET NULL"), nullable=True)
    cover_letter_file     = Column(String(255), nullable=True)
    cover_letter_original = Column(String(255), nullable=True)   
    cover_letter_size     = Column(BigInteger, nullable=True)
    applied_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    application_status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.PENDING, nullable=False)
    cancelled = Column(Boolean, default=False, nullable=False)
    reason = Column(String(255), nullable=True)  

    # Relationships
    job = relationship("Job", back_populates="applications")
    candidate = relationship("Candidate", back_populates="applications")
    resume = relationship("CandidateResume", foreign_keys=[candidate_resume_id])
    attachments = relationship(
        "ApplicationAttachment",
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="ApplicationAttachment.sort_order"
    )