from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.dependencies.auth import verify_access_token, get_db
from app.dependencies.candidate import get_current_candidate_id
from app.models.employer_model import Employer
from app.schemas.job_application_schema import (
    JobApplicationCreate,
    JobApplicationOut,
    ApplicationOutForEmployer
)
from app.controllers.job_application_controller import (
    apply_to_job,
    get_applications_for_job,
    update_application_status
)

router = APIRouter(prefix="/applications", tags=["Applications"])

# ─── Candidate side ──────────────────────────────────────────────────────────

@router.post("/", response_model=JobApplicationOut, status_code=201)
def apply_to_job_endpoint(
    data: JobApplicationCreate,
    db: Session = Depends(get_db),
    candidate_id: int = Depends(get_current_candidate_id)
):
    return apply_to_job(db, data.job_id, candidate_id, data.candidate_resume_id)

# ─── Employer side ───────────────────────────────────────────────────────────

@router.get("/job/{job_id}", response_model=List[ApplicationOutForEmployer])
def list_job_applications(
    job_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    employer = db.query(Employer).filter(Employer.user_id == current_user_id).first()
    if not employer:
        raise HTTPException(403, "Employer profile required")

    return get_applications_for_job(db, job_id, employer.pk_id, skip, limit)

@router.patch("/{application_id}/status")
def update_status(
    application_id: int,
    new_status: str,  # You can also use Body(embed=True) + a small schema
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    employer = db.query(Employer).filter(Employer.user_id == current_user_id).first()
    if not employer:
        raise HTTPException(403, "Employer profile required")

    updated = update_application_status(db, application_id, new_status, employer.pk_id)
    return {"message": f"Application status updated to {updated.application_status}"}