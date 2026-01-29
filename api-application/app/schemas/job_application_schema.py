from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.job_application_model import ApplicationStatus

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
class CandidateBasicOut(BaseModel):
    pk_id: int
    user_id: int
    description: Optional[str] = None
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
    resume: Optional[ResumeBasicOut]
    applied_date: datetime
    application_status: ApplicationStatus
    model_config = {"from_attributes": True}