import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies.auth import verify_access_token, get_db
from app.models.candidate_model import Candidate
from app.models.candidate_profile import CandidateProfile
from app.schemas.candidate_schema import CandidateCreate, CandidateOut, CandidateProfileUpdate
from app.controllers.candidate_controller import (
    create_or_update_candidate,
    get_candidate_by_user_id,
    get_candidate,
    delete_candidate,
    get_candidate_profile_by_candidate_id
)

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