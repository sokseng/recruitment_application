from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from app.database.session import Base

class CandidateProfile(Base):
    __tablename__ = "t_candidate_profile"

    pk_id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("t_candidate.pk_id", ondelete="CASCADE"), unique=True, nullable=False)
    job_category_id = Column(Integer, nullable=True)

    experience_level = Column(String(50), nullable=True)
    expected_salary = Column(String(50), nullable=True)

    about_me = Column(Text, nullable=True)
    career_objective = Column(Text, nullable=True)
    experience = Column(Text, nullable=True)
    education = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)
    languages = Column(Text, nullable=True)
    reference_text = Column(Text, nullable=True)

    created_date = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_date = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
