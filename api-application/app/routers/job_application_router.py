import os
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.auth import verify_access_token, get_db
from app.dependencies.candidate import get_current_candidate_id
from app.models.employer_model import Employer
from app.models.job_application_model import JobApplication
from app.models.job_model import Job
from app.models.candidate_resume_model import CandidateResume
from app.schemas.job_application_schema import (
    ApplicationStatusUpdate,
    JobApplicationCreate,
    JobApplicationOut,
    ApplicationOutForEmployer
)
from app.controllers.job_application_controller import (
    apply_to_job,
    get_applications_for_job,
    update_application_status
)
import mimetypes


router = APIRouter(prefix="/applications", tags=["Applications"])
UPLOAD_FOLDER = "uploads/resumes"


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

# ─── Employer side ────────────────────────────────────a───────────────────────

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

@router.patch("/{application_id}/status", response_model=dict)
def update_status(
    application_id: int,
    data: ApplicationStatusUpdate,               
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    employer = db.query(Employer).filter(Employer.user_id == current_user_id).first()
    if not employer:
        raise HTTPException(403, "Employer profile required")

    updated = update_application_status(db, application_id, data.new_status, employer.pk_id)
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

@router.get("/resumes/{resume_id}/file")
def download_resume(resume_id: int, db: Session = Depends(get_db)):
    resume = db.query(CandidateResume).filter(CandidateResume.pk_id == resume_id).first()
    if not resume or not resume.resume_file:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Full path
    file_path = os.path.join(UPLOAD_FOLDER, resume.resume_file)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File {resume.resume_file} not found on server")

    # Detect MIME type
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = "application/octet-stream"

    return FileResponse(
        path=file_path,
        filename=resume.resume_file,  # browser download filename
        media_type=mime_type
    )
