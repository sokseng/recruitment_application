from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.candidate_model import Candidate
from app.models.candidate_profile import CandidateProfile
from app.schemas.candidate_schema import CandidateCreate, CandidateOut

def create_or_update_candidate(db: Session, candidate_data: CandidateCreate, user_id: int) -> CandidateOut:
    """
    Create candidate profile if doesn't exist, otherwise update it
    """
    db_candidate = db.query(Candidate).filter(Candidate.user_id == user_id).first()

    data_dict = candidate_data.model_dump(exclude_none=True)

    if db_candidate:
        # Update existing
        for key, value in data_dict.items():
            setattr(db_candidate, key, value)
        db.commit()
        db.refresh(db_candidate)
        return db_candidate
    else:
        # Create new
        new_candidate = Candidate(user_id=user_id, **data_dict)
        db.add(new_candidate)
        db.commit()
        db.refresh(new_candidate)
        return new_candidate

def get_candidate_by_user_id(db: Session, user_id: int) -> Candidate | None:
    return db.query(Candidate).filter(Candidate.user_id == user_id).first()

def get_candidate_profile_by_candidate_id(db: Session, candidate_id: int) -> CandidateProfile | None:
    return db.query(CandidateProfile).filter(CandidateProfile.candidate_id == candidate_id).first()

def get_candidate(db: Session, candidate_id: int) -> Candidate | None:
    return db.get(Candidate, candidate_id)

def delete_candidate(db: Session, candidate_id: int, user_id: int) -> bool:
    db_candidate = db.get(Candidate, candidate_id)
    if not db_candidate:
        return False
    if db_candidate.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own candidate profile"
        )
    db.delete(db_candidate)
    db.commit()
    return True