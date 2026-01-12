from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.auth import verify_access_token
from app.database.deps import get_db
from app.schemas.candidate_resume_schema import ResumeCreate, ResumeUpdate, ResumeOut
from app.dependencies.candidate import get_current_candidate_id
from app.models.candidate_resume_model import ResumeType
from app.controllers.candidate_resume_controller import (
    create_resume,
    update_resume,
    get_resumes_by_candidate,
    delete_resume,
    set_primary_resume
)

router = APIRouter(prefix="/candidate/resumes", tags=["Candidate Resumes"])


@router.post("/", response_model=ResumeOut)
def create_candidate_resume(
    resume_type: str = Form(...),
    resume_content: Optional[str] = Form(None),
    recommendation_letter: Optional[str] = Form(None),
    is_primary: bool = Form(False),
    resume_file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token),
    candidate_id: int = Depends(get_current_candidate_id)
):
    try:
        resume_type_enum = ResumeType(resume_type)
    except ValueError:
        raise HTTPException(status_code=422, detail="resume_type must be 'Text' or 'Upload'")

    resume_data = ResumeCreate(
        resume_type=resume_type_enum,
        resume_content=resume_content,
        recommendation_letter=recommendation_letter,
        is_primary=is_primary
    )

    return create_resume(db, resume_data, candidate_id, resume_file)


@router.put("/{resume_id}", response_model=ResumeOut)
def update_candidate_resume(
    resume_id: int,
    resume_type: Optional[str] = Form(None),
    resume_content: Optional[str] = Form(None),
    recommendation_letter: Optional[str] = Form(None),
    is_primary: Optional[bool] = Form(None),
    resume_file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token),
    candidate_id: int = Depends(get_current_candidate_id)
):
    # Allow empty string to mean "don't change"
    if resume_type == "":
        resume_type = None

    resume_update = ResumeUpdate(
        resume_type=resume_type,
        resume_content=resume_content,
        recommendation_letter=recommendation_letter,
        is_primary=is_primary
    )

    updated = update_resume(db, resume_id, resume_update, candidate_id, resume_file)
    if not updated:
        raise HTTPException(status_code=404, detail="Resume not found or not yours")
    return updated


@router.get("/", response_model=List[ResumeOut])
def get_my_resumes(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token),
    candidate_id: int = Depends(get_current_candidate_id)
):
    return get_resumes_by_candidate(db, candidate_id)


@router.delete("/{resume_id}")
def delete_candidate_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token),
    candidate_id: int = Depends(get_current_candidate_id)
):
    success = delete_resume(db, resume_id, candidate_id)
    if not success:
        raise HTTPException(status_code=404, detail="Resume not found or not yours")
    return {"message": "Resume deleted successfully"}


@router.post("/{resume_id}/set-primary")
def make_primary_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token),
    candidate_id: int = Depends(get_current_candidate_id)
):
    success = set_primary_resume(db, resume_id, candidate_id)
    if not success:
        raise HTTPException(status_code=404, detail="Resume not found or not yours")
    return {"message": "Set as primary successfully"}