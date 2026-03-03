#job_application_controller.py
import os
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models.application_attachment_model import ApplicationAttachment
from app.models.audit_trace_model import AuditTrace
from app.models.job_application_model import JobApplication, ApplicationStatus
from app.models.job_model import Job, JobStatus
from app.models.candidate_resume_model import CandidateResume
from typing import List, Optional
from datetime import datetime
from sqlalchemy import func, select
from app.models.candidate_model import Candidate
from app.models.user_model import User
from app.routers import job_application_router
from app.schemas.job_application_schema import ApplicationOutForEmployer

def apply_to_job(
    db: Session,
    job_id: int,
    candidate_id: int,
    resume_id: int,
    cover_letter_filename: Optional[str] = None,
    cover_letter_original: Optional[str] = None,
    cover_letter_size: Optional[int] = None,
    new_attachments: Optional[List[dict]] = None, 
    delete_cover_letter: bool = False,
    reset_status_on_reapply: bool = True,
    ip_address: str = ""
) -> JobApplication:
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if job.status != JobStatus.OPEN:
        raise HTTPException(400, "This job is no longer accepting applications")

    resume = db.get(CandidateResume, resume_id)
    if not resume or resume.candidate_id != candidate_id:
        raise HTTPException(400, "Invalid or unauthorized resume")

    # Find or create application
    application = db.query(JobApplication).filter(
        JobApplication.job_id == job_id,
        JobApplication.candidate_id == candidate_id
    ).first()

    if not application:
        application = JobApplication(
            job_id=job_id,
            candidate_id=candidate_id,
            candidate_resume_id=resume_id,
            application_status=ApplicationStatus.PENDING,
            applied_date=datetime.utcnow(),
        )
        db.add(application)
        db.flush()  # get pk_id before adding attachments
    else:
        if application.candidate_resume_id != resume_id:
            application.candidate_resume_id = resume_id
        if reset_status_on_reapply:
            application.application_status = ApplicationStatus.PENDING
            application.cancelled = False

    # Cover letter logic
    if cover_letter_filename:
        application.cover_letter_file     = cover_letter_filename
        application.cover_letter_original = cover_letter_original or cover_letter_filename
        application.cover_letter_size     = cover_letter_size
    elif delete_cover_letter:
        if application.cover_letter_file:
            file_path = os.path.join(
                job_application_router.UPLOAD_FOLDER_COVER_LETTER,
                application.cover_letter_file
            )
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass

        application.cover_letter_file     = None
        application.cover_letter_original = None
        application.cover_letter_size     = None

    # NEW: Application-specific attachments
    if new_attachments:
        max_order = (
            db.query(func.max(ApplicationAttachment.sort_order))
            .filter(ApplicationAttachment.application_id == application.pk_id)
            .scalar() or -1
        )
        for item in new_attachments:
            att = ApplicationAttachment(
                application_id=application.pk_id,
                filename=item["filename"],
                original_name=item.get("original_name", item["filename"]),
                file_type=item.get("file_type", "other"),
                size_bytes=item.get("size_bytes"),
                sort_order=max_order + 1
            )
            db.add(att)

    db.commit()
    db.refresh(application)

    # ── ADD AUDIT LOGGING HERE ────────────────────────────────────────
    candidate = db.query(Candidate).filter(Candidate.pk_id == candidate_id).first()
    user = candidate.user if candidate else None
    username = user.user_name if user else f"candidate_{candidate_id}"

    job = db.get(Job, job_id) 

    is_reapply = application.pk_id is not None 

    action = "Re-apply to Job" if is_reapply else "Apply to Job"

    detail = (
        f"job_title: '{job.job_title}' | "
        f"company: '{job.employer.company_name if job.employer else '—'}'"
    )

    audit = AuditTrace(
        user_action = username,
        action_datetime = datetime.now().replace(microsecond=0),
        action = action,
        ip = ip_address,                
        detail_information = detail
    )
    db.add(audit)
    db.commit()

    return application


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
            joinedload(JobApplication.attachments)
        )
        .where(JobApplication.job_id == job_id)
        .order_by(JobApplication.applied_date.desc())
        .offset(skip)
        .limit(limit)
    )

    applications = db.scalars(stmt).unique().all()

    result = []
    for app in applications:
        attachments_list = [
            {
                "id": att.id,
                "filename": att.filename,
                "original_name": att.original_name,
                "file_type": att.file_type,
                "size_bytes": att.size_bytes,
                "sort_order": att.sort_order,
            }
            for att in app.attachments
        ]
        attachments_list.sort(key=lambda x: x["sort_order"])

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
                    "profile_image": app.candidate.user.profile_image,
                } if app.candidate.user else None
            } if app.candidate else None,
            "has_cover_letter": app.cover_letter_file is not None,
            "cover_letter_filename": app.cover_letter_original or app.cover_letter_file,
            "attachments": attachments_list,           # ← new field
            "reason": getattr(app, "reason", None),
            "resume_images": [],
        }).model_dump()   

        result.append(app_data)

    return result


def update_application_status(
    db: Session,
    application_id: int,
    new_status: str,
    employer_id: int,
    ip_address: str,
    current_user_id: int
) -> JobApplication:
    app = (
        db.query(JobApplication)
        .options(
            joinedload(JobApplication.job),
            joinedload(JobApplication.candidate).joinedload(Candidate.user),
        )
        .filter(JobApplication.pk_id == application_id)
        .first()
    )
    if not app:
        raise HTTPException(404, "Application not found")

    if app.job.employer_id != employer_id:
        raise HTTPException(403, "You can only manage applications for your own jobs")

    allowed_statuses = [s.value for s in ApplicationStatus]
    if new_status not in allowed_statuses:
        raise HTTPException(400, f"Invalid status. Allowed: {', '.join(allowed_statuses)}")
    
    old_status = app.application_status.value if hasattr(app.application_status, "value") else str(app.application_status)
    new_status = new_status

    if old_status == new_status:
        return app

    app.application_status = new_status
    db.commit()
    db.refresh(app)

    # ── Audit only if status actually changed ────────────────────
    user = db.query(User).filter(User.pk_id == current_user_id).first()
    if user:
        job_title = app.job.job_title if app.job else ""
        company_name = app.job.employer.company_name if app.job and app.job.employer else ""

        detail = (
            f"status: {old_status} → {new_status} | "
            f"job_title: '{job_title}' | "
            f"company_name: '{company_name}'"
        )

        audit = AuditTrace(
            user_action=user.user_name,
            action_datetime=datetime.now().replace(microsecond=0),
            action="Update Application Status",
            ip=ip_address,
            detail_information="UPDATED: " + detail
        )
        db.add(audit)
        db.commit()
    return app