from pydantic import BaseModel, Field, computed_field
from typing import Optional
from datetime import datetime
from app.models.candidate_resume_model import ResumeType


class ResumeCreate(BaseModel):
    resume_type: ResumeType
    resume_content: Optional[str] = None
    recommendation_letter: Optional[str] = None
    is_primary: bool = False


class ResumeUpdate(BaseModel):
    resume_type: Optional[ResumeType] = None
    resume_content: Optional[str] = None
    recommendation_letter: Optional[str] = None
    is_primary: Optional[bool] = None


class ResumeOut(BaseModel):
    pk_id: int
    candidate_id: int
    resume_type: ResumeType
    resume_file: Optional[str] = None
    resume_content: Optional[str] = None
    recommendation_letter: Optional[str] = None
    is_primary: bool
    created_date: datetime
    updated_date: Optional[datetime] = None

    @computed_field
    @property
    def download_url(self) -> Optional[str]:
        if self.resume_file and self.resume_type == ResumeType.UPLOAD:
            return f"/candidate/resumes/{self.pk_id}/file"
        return None

    model_config = {"from_attributes": True}