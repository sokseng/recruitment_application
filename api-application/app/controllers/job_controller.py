#job_controller.py
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.job_model import Job
from app.schemas.job_schema import JobCreate, JobUpdate, JobOut
from app.models.employer_model import Employer
from sqlalchemy.orm import joinedload
from app.models.category_model import Category
from datetime import date, datetime
from sqlalchemy import select, update
from sqlalchemy.sql import func


def ensure_jobs_not_expired(db: Session, employer_id: int | None = None):
    stmt = (
        update(Job)
        .where(Job.status == "Open")
        .where(Job.closing_date.is_not(None))
        .where(Job.closing_date < func.current_date())  
        .values(status="Closed")
    )

    if employer_id is not None:
        stmt = stmt.where(Job.employer_id == employer_id)

    db.execute(stmt)
    db.commit()


def create_job(db: Session, job_data: JobCreate, user_id: int) -> JobOut:
    db_user = db.query(Employer).filter(Employer.user_id == user_id).first()

    category_ids = job_data.category_ids or []

    categories = []
    if category_ids:
        categories = db.query(Category).filter(Category.pk_id.in_(category_ids)).all()
        if len(categories) != len(category_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more category IDs are invalid"
            )

    db_job = Job(
        employer_id=db_user.pk_id,
        **job_data.model_dump(exclude={"category_ids"}, exclude_none=True)
    )

    db_job.categories = categories

    db.add(db_job)
    db.commit()
    db.refresh(db_job)

    return db_job


def get_job(db: Session, job_id: int) -> Job | None:
    return db.get(Job, job_id)

def get_jobs_by_employer(db: Session, employer_id: int, skip: int = 0, limit: int = 20) -> list[Job]:
    ensure_jobs_not_expired(db, employer_id=employer_id)

    jobs = (
        db.query(Job)
        .options(joinedload(Job.categories))
        .filter(Job.employer_id == employer_id)
        .order_by(Job.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    db.commit() 
    return jobs


def get_all_active_jobs(db: Session, skip: int = 0, limit: int = 50) -> list[Job]:
    today = date.today()
    stmt = (
        select(Job)
        .options(joinedload(Job.employer))
        .where(Job.status == "Open")
        .where(
            (Job.closing_date.is_(None)) |
            (Job.closing_date >= today)
        )
        .offset(skip)
        .limit(limit)
        .order_by(Job.created_at.desc())
    )

    return db.scalars(stmt).all()


def update_job(db: Session, job_id: int, job_data: JobUpdate, employer_id: int) -> Job | None:
    db_job = (
        db.query(Job)
        .options(joinedload(Job.categories))
        .filter(Job.pk_id == job_id, Job.employer_id == employer_id)
        .first()
    )
    if not db_job:
        return None

    update_data = job_data.model_dump(exclude_unset=True, exclude={"category_ids"})

    for key, value in update_data.items():
        setattr(db_job, key, value)

    if job_data.category_ids is not None:
        if job_data.category_ids:
            categories = db.query(Category).filter(Category.pk_id.in_(job_data.category_ids)).all()
            if len(categories) != len(job_data.category_ids):
                raise HTTPException(400, "One or more category IDs invalid")
            db_job.categories = categories
        else:
            db_job.categories = []

    today = date.today()

    if db_job.closing_date:
        closing_date_as_date = (
            db_job.closing_date.date()
            if isinstance(db_job.closing_date, datetime)
            else db_job.closing_date
        )

        if closing_date_as_date < today:
            db_job.status = "Closed"
        elif db_job.status == "Closed" and job_data.status is None:
            db_job.status = "Open"

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