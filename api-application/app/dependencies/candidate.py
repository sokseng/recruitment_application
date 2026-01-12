# app/dependencies/candidate.py
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.candidate_model import Candidate
from app.dependencies.auth import verify_access_token, get_db


def get_current_candidate(
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_access_token)
) -> Candidate:
    """
    Returns the candidate profile of the currently authenticated user.
    Raises 403 if no candidate profile exists.
    """
    candidate = (
        db.query(Candidate)
        .filter(Candidate.user_id == user_id)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You need to create a candidate profile first"
        )

    return candidate


def get_current_candidate_id(
    candidate: Candidate = Depends(get_current_candidate)
) -> int:
    """Just returns the pk_id for simpler usage"""
    return candidate.pk_id