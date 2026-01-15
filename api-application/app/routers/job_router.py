from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.dependencies.auth import verify_access_token, get_db
from app.schemas.job_schema import JobCreate, JobUpdate, JobOut
from app.controllers.job_controller import (
    create_job, get_job, get_jobs_by_employer,
    update_job, delete_job, get_all_active_jobs
)

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("/", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_new_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    # In real project → check if user has employer profile
    # For now we assume current_user_id is employer_id
    return create_job(db, job_data)


@router.get("/my-jobs", response_model=List[JobOut])
def get_my_jobs(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    return get_jobs_by_employer(db, current_user_id, skip, limit)


@router.get("/{job_id}", response_model=JobOut)
def get_single_job(job_id: int, db: Session = Depends(get_db)):
    job = get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/", response_model=List[JobOut])
def get_public_active_jobs(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Public endpoint - shows only Open jobs"""
    return get_all_active_jobs(db, skip, limit)


@router.put("/{job_id}", response_model=JobOut)
def update_existing_job(
    job_id: int,
    job_data: JobUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    updated_job = update_job(db, job_id, job_data, current_user_id)
    if not updated_job:
        raise HTTPException(status_code=404, detail="Job not found or not yours")
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