#job_router.py
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.dependencies.auth import verify_access_token, get_db
from app.models.user_model import User
from app.schemas.job_schema import Approved, JobCreate, JobUpdate, JobOut
from app.controllers.job_controller import (
    create_job, get_job, get_jobs_by_employer,
    update_job, delete_job, get_all_active_jobs
)
from app.models.employer_model import Employer

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("/", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_new_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    return create_job(db, job_data, current_user_id)


@router.get("/my-jobs", response_model=List[JobOut])
def get_my_jobs(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    employer = db.query(Employer).filter(Employer.user_id == current_user_id).first()
    if not employer:
        return [] 
    return get_jobs_by_employer(db, employer.pk_id, skip, limit)

@router.get("/approve", response_model=Approved)
def get_approved(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
  approve = db.query(User.approved).filter(User.pk_id == current_user_id).scalar()  
  
  return {"approved": approve}


@router.get("/{job_id}", response_model=JobOut)
def get_single_job(job_id: int, db: Session = Depends(get_db)):
    job = get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/", response_model=List[JobOut])
def get_public_active_jobs(
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
    job_types: str | None = None,         
    levels: str | None = None,
    category_ids: str | None = None,       
    posted_after: date | None = None,
    posted_before: date | None = None,
    db: Session = Depends(get_db),
    job_id: int | None = None
):
    return get_all_active_jobs(
        db, 
        skip=skip, 
        limit=limit,
        search=search,
        job_types=job_types.split(",") if job_types else None,
        levels=levels.split(",") if levels else None,
        category_ids=[int(i) for i in category_ids.split(",")] if category_ids else None,
        posted_after=posted_after,
        posted_before=posted_before,
        job_id=job_id
    )


@router.put("/{job_id}", response_model=JobOut)
def update_existing_job(
    job_id: int,
    job_data: JobUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    employer = db.query(Employer).filter(Employer.user_id == current_user_id).first()
    if not employer:
        raise HTTPException(403, "You don't have an employer profile")

    updated_job = update_job(db, job_id, job_data, employer.pk_id)  
    if not updated_job:
        raise HTTPException(404, "Job not found or not yours")
    return updated_job

@router.delete("/{job_id}", response_model=JobOut)
def delete_existing_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    deleted_job = delete_job(db, job_id, current_user_id)
    if not deleted_job:
        raise HTTPException(status_code=404, detail="Job not found or not yours")
    return deleted_job