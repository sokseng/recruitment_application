import re
from fastapi import APIRouter, Depends, HTTPException, Request, status
from typing import Optional
from pydantic import BaseModel
from sqlalchemy import desc, update
from sqlalchemy.orm import Session, joinedload
from app.dependencies.auth import verify_access_token, get_db
from app.models.candidate_model import Candidate
from app.models.candidate_profile import CandidateProfile
from app.models.employer_model import Employer
from app.models.job_application_model import JobApplication
from app.models.job_model import Job
from app.schemas.candidate_schema import CandidateCreate, CandidateOut, CandidateProfileUpdate
from app.controllers.candidate_controller import (
    create_or_update_candidate,
    get_candidate_by_user_id,
    get_candidate,
    delete_candidate,
    get_candidate_profile_by_candidate_id
)
from app.utils.audit import audit_log

router = APIRouter(prefix="/candidate", tags=["Candidates"])

def has_meaningful_html(value: str | None) -> bool:
    if not value:
        return False

    # Remove <br>, &nbsp;, and all HTML tags
    text = re.sub(r'(<br\s*/?>|&nbsp;|<[^>]*>)', '', value).strip()

    # If after removal, any text remains, return True
    return bool(text)

@router.post("/", response_model=CandidateOut, status_code=status.HTTP_201_CREATED)
@router.put("/", response_model=CandidateOut)
def upsert_candidate_profile(
    data: CandidateCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    """Create or update current user's candidate profile"""
    return create_or_update_candidate(db, data, current_user_id)

@router.get("/me")
def get_my_candidate_profile(db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    candidate = get_candidate_by_user_id(db, current_user_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    profile = get_candidate_profile_by_candidate_id(db, candidate.pk_id)

    return {
        **candidate.__dict__,
        "profile": profile
    }

@router.get("/{candidate_id}", response_model=CandidateOut)
def get_candidate_by_id(candidate_id: int, db: Session = Depends(get_db)):
    """Admin / public endpoint - might need permission check later"""
    candidate = get_candidate(db, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate

@router.delete("/{candidate_id}")
def delete_candidate_profile(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    success = delete_candidate(db, candidate_id, current_user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    return {"message": "Candidate profile deleted successfully"}

@router.post("/profile")
def create_or_update_candidate_profile(profile_in: CandidateProfileUpdate, db: Session = Depends(get_db), current_user = Depends(verify_access_token)):
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    profile = db.query(CandidateProfile).filter(CandidateProfile.candidate_id == candidate.pk_id).first()
    if not profile:
        profile_fields = [
            profile_in.about_me,
            profile_in.career_objective,
            profile_in.experience,
            profile_in.education,
            profile_in.skills,
            profile_in.languages,
            profile_in.reference_text
        ]
        if not any(has_meaningful_html(field) for field in profile_fields):
            raise HTTPException(status_code=400, detail="No profile data provided")

        profile = CandidateProfile(candidate_id=candidate.pk_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    for field, value in profile_in.dict(exclude_unset=True).items():
        if isinstance(value, str):
            # If string is empty or has only empty HTML, set None
            setattr(profile, field, value if has_meaningful_html(value) else None)
        else:
            # Keep non-string values as is (int, float, bool)
            setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return profile

@router.get("/me/applications")
def get_my_job_applications(db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    candidate = (db.query(Candidate).filter(Candidate.user_id == current_user_id).first())

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found. Please complete your profile first."
        )

    applications = (
        db.query(JobApplication)
        .filter(JobApplication.candidate_id == candidate.pk_id)
        .join(Job, JobApplication.job_id == Job.pk_id)
        .join(Employer, Job.employer_id == Employer.pk_id)
        .options(
            joinedload(JobApplication.job).joinedload(Job.employer)
        )
        .order_by(desc(JobApplication.applied_date))  # newest first
        .all()
    )

    return applications

class CancelApplicationRequest(BaseModel):
    reason: Optional[str] = None

@router.put("/me/applications/{application_id}/cancel")
def cancel_my_application(request: Request, application_id: int = None, payload: CancelApplicationRequest = None, db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found. Please complete your profile first."
        )

    application = (db.query(JobApplication).filter(JobApplication.pk_id == application_id, JobApplication.candidate_id == candidate.pk_id).first())

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found or does not belong to you."
        )

    if application.cancelled == True:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This application is already cancelled."
        )

    db.execute(
        update(JobApplication)
        .where(JobApplication.pk_id == application_id)
        .values(cancelled=True,reason=payload.reason)
    )
    db.commit()

    client_ip = request.client.host if request else "Unknown"
    audit_log(
        db=db,
        db_obj=application,
        action="Cancel Job Application",
        user_name=candidate.user.user_name if candidate.user else "Unknown",
        ip_address=client_ip
    )

    return {"message": "Application cancelled successfully"}