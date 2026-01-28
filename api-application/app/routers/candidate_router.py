from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies.auth import verify_access_token, get_db
from app.schemas.candidate_schema import CandidateCreate, CandidateOut
from app.controllers.candidate_controller import (
    create_or_update_candidate,
    get_candidate_by_user_id,
    get_candidate,
    delete_candidate,
    get_candidate_profile_by_candidate_id
)

router = APIRouter(prefix="/candidate", tags=["Candidates"])

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