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