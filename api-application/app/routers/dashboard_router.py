from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.deps import get_db
from app.models.user_model import User
from app.models.job_model import Job, JobStatus
from app.models.employer_model import Employer
from app.models.candidate_model import Candidate
from app.models.job_application_model import JobApplication, ApplicationStatus

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):

    # ===== USERS =====
    total_users = db.query(func.count(User.pk_id)).scalar()
    active_users = (
        db.query(func.count(User.pk_id))
        .filter(User.is_active == True)
        .scalar()
    )
    inactive_users = total_users - active_users

    # ===== EMPLOYERS =====
    total_employers = db.query(func.count(Employer.pk_id)).scalar()

    # ===== JOBS =====
    total_jobs = db.query(func.count(Job.pk_id)).scalar()
    open_jobs = (
        db.query(func.count(Job.pk_id))
        .filter(Job.status == JobStatus.OPEN)
        .scalar()
    )
    closed_jobs = (
        db.query(func.count(Job.pk_id))
        .filter(Job.status == JobStatus.CLOSED)
        .scalar()
    )

    # ===== CANDIDATES =====
    total_candidates = db.query(func.count(Candidate.pk_id)).scalar()

    # ===== JOB APPLICATIONS =====
    total_applications = db.query(func.count(JobApplication.pk_id)).scalar()

    pending_applications = (
        db.query(func.count(JobApplication.pk_id))
        .filter(JobApplication.application_status == ApplicationStatus.PENDING)
        .scalar()
    )

    shortlisted_applications = (
        db.query(func.count(JobApplication.pk_id))
        .filter(JobApplication.application_status == ApplicationStatus.SHORTLISTED)
        .scalar()
    )

    rejected_applications = (
        db.query(func.count(JobApplication.pk_id))
        .filter(JobApplication.application_status == ApplicationStatus.REJECTED)
        .scalar()
    )

    accepted_applications = (
        db.query(func.count(JobApplication.pk_id))
        .filter(JobApplication.application_status == ApplicationStatus.ACCEPTED)
        .scalar()
    )

    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "inactive": inactive_users,
        },
        "employers": {
            "total": total_employers,
        },
        "jobs": {
            "total": total_jobs,
            "open": open_jobs,
            "closed": closed_jobs,
        },
        "candidates": {
            "total": total_candidates,
        },
        "applications": {
            "total": total_applications,
            "pending": pending_applications,
            "shortlisted": shortlisted_applications,
            "rejected": rejected_applications,
            "accepted": accepted_applications,
        }
    }
