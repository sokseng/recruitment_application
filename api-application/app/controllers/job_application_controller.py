#job_application_controller.py
import os
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models.job_application_model import JobApplication, ApplicationStatus
from app.models.job_model import Job, JobStatus
from app.models.candidate_resume_model import CandidateResume
from typing import List, Optional
from datetime import datetime
from sqlalchemy import func, select
from app.models.candidate_model import Candidate
from app.models.resume_image_model import ResumeImage
from app.routers import job_application_router
from app.schemas.job_application_schema import ApplicationOutForEmployer

def apply_to_job(
    db: Session,
    job_id: int,
    candidate_id: int,
    resume_id: int,                           
    cover_letter_filename: Optional[str] = None,  
    new_image_filenames: Optional[List[str]] = None,
    delete_cover_letter: bool = False,
    reset_status_on_reapply: bool = True,
) -> JobApplication:
    
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status != JobStatus.OPEN:
        raise HTTPException(400, "This job is no longer accepting applications")

    resume = db.get(CandidateResume, resume_id)
    if not resume or resume.candidate_id != candidate_id:
        raise HTTPException(400, "Invalid or unauthorized resume")

    update_needed = False

    if cover_letter_filename is not None:
        resume.cover_letter_file = cover_letter_filename
        update_needed = True
    
    elif delete_cover_letter:
        if resume.cover_letter_file:
            file_path = os.path.join(job_application_router.UPLOAD_FOLDER_COVER_LETTER, resume.cover_letter_file)
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                pass

            resume.cover_letter_file = None
            update_needed = True

    if new_image_filenames and len(new_image_filenames) > 0:
        current_max_order = (
            db.query(func.max(ResumeImage.sort_order))
            .filter(ResumeImage.resume_id == resume.pk_id)
            .scalar() or -1
        )
        for fname in new_image_filenames:
            new_img = ResumeImage(
                resume_id=resume.pk_id,
                filename=fname,
                original_name=fname,  # you can improve this later
                size_bytes=None,
                sort_order=current_max_order + 1
            )
            db.add(new_img)
        update_needed = True

    if update_needed:
        db.add(resume)
        db.commit()
        db.refresh(resume)

    # ─── Look for existing application ───────────────────────────
    existing = db.query(JobApplication).filter(
        JobApplication.job_id == job_id,
        JobApplication.candidate_id == candidate_id
    ).first()

    if existing:
        # Only update resume_id if it actually changed
        if existing.candidate_resume_id != resume_id:
            existing.candidate_resume_id = resume_id
            if reset_status_on_reapply:
                existing.application_status = ApplicationStatus.PENDING
            db.add(existing)
            db.commit()
            db.refresh(existing)
        return existing

    else:
        # ─── CREATE new application ──────────────────────────────
        new_application = JobApplication(
            job_id=job_id,
            candidate_id=candidate_id,
            candidate_resume_id=resume_id,
            application_status=ApplicationStatus.PENDING,
            applied_date=datetime.utcnow(),
        )
        db.add(new_application)
        db.commit()
        db.refresh(new_application)
        return new_application


def get_applications_for_job(
    db: Session,
    job_id: int,
    employer_id: int,
    skip: int = 0,
    limit: int = 20
):
    job = db.query(Job).filter(Job.pk_id == job_id, Job.employer_id == employer_id).first()
    if not job:
        raise HTTPException(404, "Job not found or you do not own this job")
    stmt = (
        select(JobApplication)
        .options(
            joinedload(JobApplication.candidate).joinedload(Candidate.user),
            joinedload(JobApplication.resume).joinedload(CandidateResume.images),
        )
        .where(JobApplication.job_id == job_id)
        .order_by(JobApplication.applied_date.desc())
        .offset(skip)
        .limit(limit)
    )

    applications = db.scalars(stmt).unique().all()

    result = []

    for app in applications:
        resume_images = []
        if app.resume:
            resume_images = [
                {
                    "id": img.id,
                    "filename": img.filename,
                    "original_name": img.original_name,
                    "sort_order": img.sort_order,
                }
                for img in app.resume.images
            ]
            resume_images.sort(key=lambda x: x["sort_order"])
        else:
            resume_images = []

        app_data = ApplicationOutForEmployer.model_validate({
            "pk_id": app.pk_id,
            "job_id": app.job_id,
            "candidate_id": app.candidate_id,
            "candidate_resume_id": app.candidate_resume_id,
            "applied_date": app.applied_date,
            "application_status": app.application_status.value
                if hasattr(app.application_status, "value")
                else str(app.application_status),
            "cancelled": getattr(app, "cancelled", False),
            "candidate": {
                "pk_id": app.candidate.pk_id,
                "user_id": app.candidate.user_id,
                "user": {
                    "pk_id": app.candidate.user.pk_id,
                    "user_name": app.candidate.user.user_name,
                    "email": app.candidate.user.email,
                    "phone": app.candidate.user.phone,
                    "gender": app.candidate.user.gender,
                    "date_of_birth": app.candidate.user.date_of_birth,
                    "address": app.candidate.user.address,
                } if app.candidate.user else None
            } if app.candidate else None,
            "has_cover_letter": app.resume.cover_letter_file is not None if app.resume else False,
            "reason": getattr(app, "reason", None),
            "resume_images": resume_images,
        }).model_dump()   

        result.append(app_data)

    return result


def update_application_status(
    db: Session,
    application_id: int,
    new_status: str,
    employer_id: int
) -> JobApplication:
    app = (
        db.query(JobApplication)
        .options(joinedload(JobApplication.job))
        .filter(JobApplication.pk_id == application_id)
        .first()
    )
    if not app:
        raise HTTPException(404, "Application not found")

    if app.job.employer_id != employer_id:
        raise HTTPException(403, "You can only manage applications for your own jobs")

    if new_status not in [s.value for s in ApplicationStatus]:
        raise HTTPException(400, f"Invalid status. Allowed: {', '.join([s.value for s in ApplicationStatus])}")

    app.application_status = new_status
    db.commit()
    db.refresh(app)
    return app