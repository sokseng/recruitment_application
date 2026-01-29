from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.job_application_model import JobApplication, ApplicationStatus
from app.models.job_model import Job, JobStatus
from app.models.candidate_resume_model import CandidateResume
from typing import List, Optional

def apply_to_job(
    db: Session,
    job_id: int,
    candidate_id: int,
    resume_id: Optional[int] = None
) -> JobApplication:
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != JobStatus.OPEN:
        raise HTTPException(400, "This job is no longer accepting applications")

    # Prevent duplicate applications
    existing = db.query(JobApplication).filter(
        JobApplication.job_id == job_id,
        JobApplication.candidate_id == candidate_id
    ).first()
    if existing:
        raise HTTPException(400, "You have already applied to this job")

    # Validate or fallback to primary resume
    if resume_id:
        resume = db.get(CandidateResume, resume_id)
        if not resume or resume.candidate_id != candidate_id:
            raise HTTPException(400, "Invalid or unauthorized resume")
    else:
        primary = db.query(CandidateResume).filter(
            CandidateResume.candidate_id == candidate_id,
            CandidateResume.is_primary == True
        ).first()
        if not primary:
            raise HTTPException(400, "No primary resume found. Please set one or select a resume.")
        resume_id = primary.pk_id

    application = JobApplication(
        job_id=job_id,
        candidate_id=candidate_id,
        candidate_resume_id=resume_id,
        application_status=ApplicationStatus.PENDING
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application

def get_applications_for_job(
    db: Session,
    job_id: int,
    employer_id: int,
    skip: int = 0,
    limit: int = 20
) -> List[JobApplication]:
    job = db.query(Job).filter(Job.pk_id == job_id, Job.employer_id == employer_id).first()
    if not job:
        raise HTTPException(404, "Job not found or you do not own this job")

    return (
        db.query(JobApplication)
        .options(
            joinedload(JobApplication.candidate),
            joinedload(JobApplication.resume)
        )
        .filter(JobApplication.job_id == job_id)
        .offset(skip)
        .limit(limit)
        .order_by(JobApplication.applied_date.desc())
        .all()
    )

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