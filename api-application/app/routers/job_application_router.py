from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.dependencies.auth import verify_access_token, get_db
from app.dependencies.candidate import get_current_candidate_id
from app.models.employer_model import Employer
from app.models.job_application_model import JobApplication
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
    return apply_to_job(
        db, 
        data.job_id, 
        candidate_id, 
        data.candidate_resume_id,
        reset_status_on_reapply=True,
    )

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

@router.get("/job/{job_id}/my-status")
def get_my_application_status(
    job_id: int,
    db: Session = Depends(get_db),
    candidate_id: int = Depends(get_current_candidate_id)
):
    app = db.query(JobApplication).filter(
        JobApplication.job_id == job_id,
        JobApplication.candidate_id == candidate_id
    ).first()
    
    if not app:
        return {"applied": False}
    
    return {
        "applied": True,
        "application_id": app.pk_id,
        "status": app.application_status,
        "resume_id": app.candidate_resume_id,
        "applied_date": app.applied_date
    }
