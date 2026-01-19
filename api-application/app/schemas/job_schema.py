from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
from app.models.job_model import JobLevel, JobType, JobStatus


class JobCreate(BaseModel):
    job_title: str = Field(..., min_length=3, max_length=255)
    job_type: JobType
    level: JobLevel = JobLevel.MID_LEVEL
    position_number: Optional[int] = None
    salary_range: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    job_description: str
    closing_date: Optional[datetime] = None
    status: Optional[JobStatus] = JobStatus.DRAFT


class JobUpdate(BaseModel):
    job_title: Optional[str] = Field(None, min_length=3, max_length=255)
    job_type: Optional[JobType] = None
    level: Optional[JobLevel] = None
    position_number: Optional[int] = None
    salary_range: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    job_description: Optional[str] = None
    closing_date: Optional[datetime] = None
    status: Optional[JobStatus] = None

class EmployerBasic(BaseModel):
    pk_id: int
    company_name: str
    company_logo: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class JobOut(BaseModel):
    pk_id: int
    employer_id: int
    employer: EmployerBasic
    job_title: str
    job_type: JobType
    level: JobLevel
    position_number: Optional[int]
    salary_range: Optional[str]
    location: Optional[str]
    job_description: str
    posting_date: datetime
    closing_date: Optional[datetime]
    status: JobStatus
    created_at: datetime

    model_config = {"from_attributes": True}