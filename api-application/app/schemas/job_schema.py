from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.job_model import JobType, JobStatus


class JobCreate(BaseModel):
    job_title: str = Field(..., min_length=3, max_length=255)
    job_type: JobType
    position_number: Optional[int] = None
    salary_range: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    job_description: str
    closing_date: Optional[datetime] = None
    status: Optional[JobStatus] = JobStatus.DRAFT
    employer_id: int


class JobUpdate(BaseModel):
    job_title: Optional[str] = Field(None, min_length=3, max_length=255)
    job_type: Optional[JobType] = None
    position_number: Optional[int] = None
    salary_range: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    job_description: Optional[str] = None
    closing_date: Optional[datetime] = None
    status: Optional[JobStatus] = None


class JobOut(BaseModel):
    pk_id: int
    employer_id: int
    job_title: str
    job_type: JobType
    position_number: Optional[int]
    salary_range: Optional[str]
    location: Optional[str]
    job_description: str
    posting_date: datetime
    closing_date: Optional[datetime]
    status: JobStatus
    created_at: datetime

    model_config = {"from_attributes": True}