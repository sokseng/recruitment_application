from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.candidate_model import CandidateStatus


class CandidateCreate(BaseModel):
    description: Optional[str] = Field(None, description="Professional summary or career objective")
    status: Optional[CandidateStatus] = CandidateStatus.ACTIVE


class CandidateUpdate(BaseModel):
    description: Optional[str] = None
    status: Optional[CandidateStatus] = None


class CandidateOut(BaseModel):
    pk_id: int
    user_id: int
    status: CandidateStatus
    description: Optional[str]
    created_date: datetime
    updated_date: Optional[datetime]

    model_config = {"from_attributes": True}

class CandidateProfileBase(BaseModel):
    candidate_id: int
    job_category_id: Optional[int] = None
    experience_level: Optional[str] = None
    expected_salary: Optional[str] = None
    about_me: Optional[str] = None
    career_objective: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    skills: Optional[str] = None
    languages: Optional[str] = None
    reference_text: Optional[str] = None

class CandidateProfileCreate(CandidateProfileBase):
    pass

class CandidateProfileUpdate(CandidateProfileBase):
    pass

class CandidateProfileOut(CandidateProfileBase):
    pk_id: int
    created_date: datetime
    updated_date: datetime

    class Config:
        orm_mode = True