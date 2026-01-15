from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.job_model import Job
from app.schemas.job_schema import JobCreate, JobUpdate, JobOut
from app.models.employer_model import Employer


def create_job(db: Session, job_data: JobCreate, user_id: int) -> JobOut:
    db_user = db.query(Employer).filter(Employer.user_id == user_id).first()
    db_job = Job(
        employer_id=db_user.pk_id,
        **job_data.model_dump(exclude_none=True)
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


def get_job(db: Session, job_id: int) -> Job | None:
    return db.get(Job, job_id)


def get_jobs_by_employer(db: Session, employer_id: int, skip: int = 0, limit: int = 20) -> list[Job]:
    stmt = (
        select(Job)
        .where(Job.employer_id == employer_id)
        .offset(skip)
        .limit(limit)
        .order_by(Job.created_at.desc())
    )
    return db.scalars(stmt).all()


def get_all_active_jobs(db: Session, skip: int = 0, limit: int = 50) -> list[Job]:
    stmt = (
        select(Job)
        .where(Job.status == "Open")
        .offset(skip)
        .limit(limit)
        .order_by(Job.created_at.desc())
    )
    return db.scalars(stmt).all()


def update_job(db: Session, job_id: int, job_data: JobUpdate, employer_id: int) -> Job | None:
    db_job = db.get(Job, job_id)
    if not db_job:
        return None
    if db_job.employer_id != employer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own jobs"
        )

    update_data = job_data.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(db_job, key, value)

    db.commit()
    db.refresh(db_job)
    return db_job


def delete_job(db: Session, job_id: int, employer_id: int) -> Job | None:
    db_job = db.get(Job, job_id)
    if not db_job:
        return None
    if db_job.employer_id != employer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own jobs"
        )

    db.delete(db_job)
    db.commit()
    return db_job