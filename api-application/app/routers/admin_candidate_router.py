from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.deps import get_db
from app.dependencies.auth import verify_access_token
from app.models.candidate_model import Candidate
from app.models.candidate_resume_model import CandidateResume
from app.models.user_model import User
from fastapi.responses import FileResponse
import os
import mimetypes

router = APIRouter(prefix="/admin", tags=["Admin Candidates"])

UPLOAD_FOLDER = "uploads/resumes" 

@router.get("/candidates")
def get_all_candidates(db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):

    candidates = (
        db.query(
            Candidate.pk_id.label("candidate_id"),
            User.user_name,
            User.email,
            Candidate.status,
        )
        .join(User, User.pk_id == Candidate.user_id)
        .join(CandidateResume, CandidateResume.candidate_id == Candidate.pk_id)
        .group_by(Candidate.pk_id, User.user_name, User.email, Candidate.status)
        .all()
    )

    result = []
    for c in candidates:
        # Get primary resume for created_date and file info
        primary_resume = (
            db.query(CandidateResume)
            .filter(
                CandidateResume.candidate_id == c.candidate_id,
                CandidateResume.is_primary == True
            )
            .first()
        )

        # Format the datetime to "YYYY-MM-DD HH:MM"
        formatted_date = (
            primary_resume.created_date.strftime("%Y-%m-%d %H:%M")
            if primary_resume and primary_resume.created_date else None
        )

        result.append({
            "pk_id": c.candidate_id,
            "user_name": c.user_name,
            "email": c.email,
            "is_active": c.status == "Active",
            "created_date": formatted_date,
            "primary_resume": {
                "pk_id": primary_resume.pk_id,
                "file_name": primary_resume.resume_file,
                "type": primary_resume.resume_type,
                "created_date": formatted_date
            } if primary_resume else None
        })

    return result


@router.get("/candidate/resumes/{resume_id}/file")
def download_resume(resume_id: int, db: Session = Depends(get_db)):
    resume = db.query(CandidateResume).filter(CandidateResume.pk_id == resume_id).first()
    if not resume or not resume.resume_file:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Full path
    file_path = os.path.join(UPLOAD_FOLDER, resume.resume_file)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File {resume.resume_file} not found on server")

    # Detect MIME type
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = "application/octet-stream"

    return FileResponse(
        path=file_path,
        filename=resume.resume_file,  # browser download filename
        media_type=mime_type
    )
