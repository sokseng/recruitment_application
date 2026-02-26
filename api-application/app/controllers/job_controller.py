#job_controller.py
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, select
from fastapi import HTTPException, status
from app.models.audit_trace_model import AuditTrace
from app.models.job_model import Job
from app.models.user_model import User
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


def create_job(db: Session, job_data: JobCreate, user_id: int, ip_address: str) -> JobOut:
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

   # ── AUDIT LOG ────────────────────────────────────────
    user = db.query(User).filter(User.pk_id == user_id).first()
    if user:
        changes = [
            f"job_title: '{job_data.job_title}'",
            f"job_type: {job_data.job_type.value if hasattr(job_data.job_type, 'value') else job_data.job_type}",
            f"level: {job_data.level.value if hasattr(job_data.level, 'value') else job_data.level}",
        ]

        # Position number
        if job_data.position_number is not None:
            changes.append(f"position_number: {job_data.position_number}")

        # Salary range
        if job_data.salary_range:
            changes.append(f"salary_range: '{job_data.salary_range}'")

        # Location
        if job_data.location:
            changes.append(f"location: '{job_data.location}'")

        # Closing date
        if job_data.closing_date:
            changes.append(f"closing_date: {job_data.closing_date.strftime('%Y-%m-%d')}")

        # Categories - show names
        if categories:
            cat_names = ", ".join(sorted(c.name for c in categories))
            changes.append(f"categories: {cat_names} ({len(categories)})")
        elif category_ids:
            changes.append("categories: none (invalid IDs were filtered)")

        audit = AuditTrace(
            user_action=user.user_name,
            action_datetime=datetime.now().replace(microsecond=0),
            action="Create Job",
            ip=ip_address,
            detail_information="CREATED: " + " | ".join(changes)
        )
        db.add(audit)

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
    return [{
        "pk_id": job.pk_id,
        "employer_id": job.employer_id,
        "employer": job.employer,
        "job_title": job.job_title,
        "job_type": job.job_type,
        "categories": job.categories,
        "level": job.level,
        "position_number": job.position_number,
        "salary_range": job.salary_range,
        "location": job.location,
        "job_description": job.job_description,
        "experience_required": job.experience_required,
        "posting_date": job.posting_date,
        "closing_date": job.closing_date,
        "status": job.status,
        "created_at": job.created_at
    } for job in jobs]
        
    

def get_all_active_jobs(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
    job_types: list[str] | None = None,
    levels: list[str] | None = None,
    category_ids: list[int] | None = None,
    posted_after: date | None = None,
    posted_before: date | None = None,
    job_id: Optional[int] = None,
) -> list[Job]:
    today = date.today()

    stmt = (
        select(Job)
        .options(
            joinedload(Job.employer),
            joinedload(Job.categories)
        )
        # modif by rathana
        # .where(Job.status == "Open")
        # .where(
        #     (Job.closing_date.is_(None)) | (Job.closing_date >= today)
        # )
    )

    if job_id is not None:
        stmt = stmt.where(Job.pk_id == job_id)
    else:
        stmt = stmt.where(Job.status == "Open")
        stmt = stmt.where((Job.closing_date.is_(None)) | (Job.closing_date >= today))

    # === Filters ===
    if search:
        search_term = f"%{search.strip().lower()}%"
        stmt = stmt.join(Employer) 
        stmt = stmt.where(
            or_(
                Job.job_title.ilike(search_term),
                Job.location.ilike(search_term),
                Employer.company_name.ilike(search_term),
            )
        )
    if job_types:
        stmt = stmt.where(Job.job_type.in_(job_types))

    if levels:
        stmt = stmt.where(Job.level.in_(levels))

    if category_ids:
        stmt = stmt.join(Job.categories).where(Category.pk_id.in_(category_ids))

    if posted_after:
        stmt = stmt.where(Job.posting_date >= posted_after)
    if posted_before:
        stmt = stmt.where(Job.posting_date <= posted_before)

    # === Ordering & Pagination ===
    stmt = stmt.order_by(Job.posting_date.desc()).offset(skip).limit(limit)

    result = db.execute(stmt)
    jobs = result.unique().scalars().all()

    return jobs


def update_job(
    db: Session,
    job_id: int,
    job_data: JobUpdate,
    employer_id: int,
    ip_address: str,
    current_user_id: int
) -> Job | None:
    db_job = (
        db.query(Job)
        .options(joinedload(Job.categories))
        .filter(Job.pk_id == job_id, Job.employer_id == employer_id)
        .first()
    )
    if not db_job:
        return None

    changes = []

    old_job_title     = db_job.job_title
    old_job_type      = db_job.job_type
    old_level         = db_job.level
    old_position_num  = db_job.position_number
    old_salary_range  = db_job.salary_range
    old_location      = db_job.location
    old_closing_date  = db_job.closing_date
    old_status = db_job.status.name 
    new_status = job_data.status.name

    old_category_names = sorted(c.name for c in db_job.categories) if db_job.categories else []

    company_name = db_job.employer.company_name if db_job.employer else ""


    update_data = job_data.model_dump(exclude_unset=True, exclude={"category_ids"})

    for key, value in update_data.items():
        setattr(db_job, key, value)

    # Categories
    categories_were_updated = job_data.category_ids is not None
    new_category_names = []

    if categories_were_updated:
        if job_data.category_ids:
            new_cats = db.query(Category).filter(Category.pk_id.in_(job_data.category_ids)).all()
            if len(new_cats) != len(job_data.category_ids):
                raise HTTPException(400, "One or more category IDs invalid")
            db_job.categories = new_cats
            new_category_names = sorted(c.name for c in new_cats)
        else:
            db_job.categories = []
            new_category_names = []


    auto_closed = False
    today = date.today()

    if db_job.closing_date:
        closing_as_date = (
            db_job.closing_date.date()
            if isinstance(db_job.closing_date, datetime)
            else db_job.closing_date
        )
        if closing_as_date < today and db_job.status != "Closed":
            db_job.status = "Closed"
            auto_closed = True

    if old_job_title != db_job.job_title:
        changes.append(f"job_title: '{old_job_title}' → '{db_job.job_title}'")

    if old_job_type != db_job.job_type:
        changes.append(f"job_type: {old_job_type} → {db_job.job_type}")

    if old_level != db_job.level:
        changes.append(f"level: {old_level} → {db_job.level}")

    if old_position_num != db_job.position_number:
        changes.append(f"position_number: {old_position_num or 'empty'} → {db_job.position_number or 'empty'}")

    if old_salary_range != db_job.salary_range:
        changes.append(f"salary_range: '{old_salary_range or 'empty'}' → '{db_job.salary_range or 'empty'}'")

    if old_location != db_job.location:
        changes.append(f"location: '{old_location or 'empty'}' → '{db_job.location or 'empty'}'")

    old_date_str = old_closing_date.strftime('%Y-%m-%d') if old_closing_date else "None"
    new_date_str = db_job.closing_date.strftime('%Y-%m-%d') if db_job.closing_date else "None"
    if old_date_str != new_date_str:
        changes.append(f"closing_date: '{old_date_str}' → '{new_date_str}'")

    if old_status != new_status:
        reason = " (auto expired)" if auto_closed else ""
        status_line = (
            f"status: {old_status} → {new_status}{reason} | "
            f"job_title: '{db_job.job_title}' | "
            f"company_name: '{company_name}'"
        )
        changes.append(status_line)

    if categories_were_updated and old_category_names != new_category_names:
        old_str = ", ".join(old_category_names) or "None"
        new_str = ", ".join(new_category_names) or "None"
        changes.append(f"categories: '{old_str}' → '{new_str}'")


    if changes:
        user = db.query(User).filter(User.pk_id == current_user_id).first()
        if user:
            audit = AuditTrace(
                user_action=user.user_name,
                action_datetime=datetime.now().replace(microsecond=0),
                action="Update Job",
                ip=ip_address,
                detail_information="UPDATED: " + " | ".join(changes)
            )
            db.add(audit)

    db.commit()
    db.refresh(db_job)

    return db_job


def delete_job(db: Session, job_id: int, employer_id: int, ip_address: str) -> Job | None:
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

    user = db.query(User).filter(User.pk_id == employer_id).first()
    if user:
        changes = [
            f"pk_id: {job_id}",
            f"job_title: '{db_job.job_title}'",
            f"company: '{db_job.employer.company_name}'"
        ]
        audit = AuditTrace(
            user_action=user.user_name,
            action_datetime=datetime.now().replace(microsecond=0),
            action="Delete Job",
            ip=ip_address,  # ← real IP
            detail_information="DELETED: " + " | ".join(changes)
        )
        db.add(audit)
        db.commit()
    return db_job