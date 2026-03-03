#job_application_schema.py
from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional
from app.models.job_application_model import ApplicationStatus
from app.schemas.user_schema import JobOut

class JobApplicationCreate(BaseModel):
    job_id: int
    candidate_resume_id: Optional[int] = None

class JobApplicationOut(BaseModel):
    pk_id: int
    job_id: int
    candidate_id: int
    candidate_resume_id: Optional[int]
    applied_date: datetime
    application_status: ApplicationStatus
    model_config = {"from_attributes": True}

# ────────────────────────────────────────────────
# For EMPLOYER view (includes candidate & resume details)
# ────────────────────────────────────────────────
class UserBasicOut(BaseModel):
    pk_id: int
    user_name: str
    email: str
    phone: Optional[str] = None
    gender: Optional[str] = None          
    date_of_birth: Optional[date] = None  
    address: Optional[str] = None
    profile_image: Optional[str] = None
    model_config = {"from_attributes": True}

class CandidateBasicOut(BaseModel):
    pk_id: int
    user_id: int
    description: Optional[str] = None
    user: Optional[UserBasicOut] = None
    model_config = {"from_attributes": True}

class ResumeBasicOut(BaseModel):
    pk_id: int
    resume_type: str
    resume_file: Optional[str] = None
    resume_content: Optional[str] = None
    is_primary: bool
    download_url: Optional[str] = None
    model_config = {"from_attributes": True}

class ApplicationOutForEmployer(BaseModel):
    pk_id: int
    job_id: int
    candidate_id: int
    candidate: CandidateBasicOut
    candidate_resume_id: Optional[int]
    resume: Optional[ResumeBasicOut] = None
    applied_date: datetime
    application_status: ApplicationStatus
    cancelled: bool
    has_cover_letter: bool
    cover_letter_filename: Optional[str] = None
    attachments: List[dict] = []
    reason: Optional[str] = None
    
    model_config = {"from_attributes": True}

class ApplicationStatusUpdate(BaseModel):
    new_status: str

class ApplicationWithJobOut(BaseModel):
    pk_id: int
    job_id: int
    candidate_id: int
    candidate_resume_id: Optional[int]
    applied_date: datetime
    application_status: ApplicationStatus
    job: Optional['JobOut'] = None  # Forward reference
    model_config = {"from_attributes": True}