import os
from pathlib import Path
from datetime import datetime
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from shutil import copyfileobj
from app.models.candidate_resume_model import CandidateResume
from app.schemas.candidate_resume_schema import ResumeCreate, ResumeUpdate

UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {'.pdf', '.docx'}


def allowed_resume_file(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


def get_resume(db: Session, resume_id: int) -> CandidateResume | None:
    return db.query(CandidateResume).filter(CandidateResume.pk_id == resume_id).first()


def get_resumes_by_candidate(db: Session, candidate_id: int) -> list[CandidateResume]:
    return (
        db.query(CandidateResume)
        .filter(CandidateResume.candidate_id == candidate_id)
        .order_by(CandidateResume.is_primary.desc(), CandidateResume.created_date.desc())
        .all()
    )


def create_resume(
    db: Session,
    resume_data: ResumeCreate,
    candidate_id: int,
    resume_file: UploadFile | None = None
) -> CandidateResume:
    filename = None

    if resume_file:
        if not allowed_resume_file(resume_file.filename):
            raise HTTPException(400, "Only PDF and DOCX files are allowed")

        ext = Path(resume_file.filename).suffix.lower()
        filename = f"candidate_{candidate_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        with open(file_path, "wb") as f:
            copyfileobj(resume_file.file, f)

    db_resume = CandidateResume(
        candidate_id=candidate_id,
        resume_type=resume_data.resume_type,
        resume_file=filename,
        resume_content=resume_data.resume_content,
        recommendation_letter=resume_data.recommendation_letter,
        is_primary=resume_data.is_primary,
    )
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)
    return db_resume


def update_resume(
    db: Session,
    resume_id: int,
    resume_update: ResumeUpdate,
    candidate_id: int,
    resume_file: UploadFile | None = None
) -> CandidateResume | None:
    db_resume = db.query(CandidateResume).filter(
        CandidateResume.pk_id == resume_id,
        CandidateResume.candidate_id == candidate_id
    ).first()

    if not db_resume:
        return None

    # Apply partial updates
    update_dict = resume_update.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(db_resume, key, value)

    # Handle file replacement
    if resume_file:
        if not allowed_resume_file(resume_file.filename):
            raise HTTPException(400, "Only PDF and DOCX files are allowed")

        # Delete old file if exists
        if db_resume.resume_file:
            old_path = os.path.join(UPLOAD_DIR, db_resume.resume_file)
            if os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except Exception as e:
                    print(f"Warning: failed to delete old resume file {old_path}: {e}")

        # Save new file
        ext = Path(resume_file.filename).suffix.lower()
        new_filename = f"candidate_{candidate_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{ext}"
        file_path = os.path.join(UPLOAD_DIR, new_filename)

        with open(file_path, "wb") as f:
            copyfileobj(resume_file.file, f)

        db_resume.resume_file = new_filename

    db.commit()
    db.refresh(db_resume)
    return db_resume


def delete_resume(db: Session, resume_id: int, candidate_id: int) -> bool:
    db_resume = db.query(CandidateResume).filter(
        CandidateResume.pk_id == resume_id,
        CandidateResume.candidate_id == candidate_id
    ).first()

    if not db_resume:
        return False

    # Delete file if exists
    if db_resume.resume_file:
        file_path = os.path.join(UPLOAD_DIR, db_resume.resume_file)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Warning: failed to delete resume file {file_path}: {e}")

    db.delete(db_resume)
    db.commit()
    return True


def set_primary_resume(db: Session, resume_id: int, candidate_id: int) -> bool:
    db_resume = db.query(CandidateResume).filter(
        CandidateResume.pk_id == resume_id,
        CandidateResume.candidate_id == candidate_id
    ).first()

    if not db_resume:
        return False

    # Reset all other resumes to non-primary
    db.query(CandidateResume).filter(
        CandidateResume.candidate_id == candidate_id,
        CandidateResume.pk_id != resume_id
    ).update({"is_primary": False})

    db_resume.is_primary = True
    db.commit()
    return True