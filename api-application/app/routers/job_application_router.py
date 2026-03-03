#job_application_router.py
from datetime import datetime
import os
import aiofiles
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

import urllib.parse
from app.dependencies.auth import verify_access_token, get_db
from app.dependencies.candidate import get_current_candidate_id
from app.models.application_attachment_model import ApplicationAttachment
from app.models.employer_model import Employer
from app.models.job_application_model import JobApplication
from app.models.candidate_resume_model import CandidateResume
from app.models.chat_message import MessageType
from app.models.user_model import User
from app.controllers.chat_controller import get_or_create_chat_room

from app.schemas.job_application_schema import (
    ApplicationStatusUpdate,
    JobApplicationOut,
    ApplicationOutForEmployer
)
from app.controllers.job_application_controller import (
    apply_to_job,
    get_applications_for_job,
    update_application_status
)
import os
import mimetypes
from app.controllers.chat_controller import send_text_message

class ApplicationAttachmentOut(BaseModel):
    id: int
    filename: str
    original_name: str | None
    file_type: str | None
    size_bytes: int | None
    uploaded_at: datetime
    sort_order: int

    class Config:
        from_attributes = True


router = APIRouter(prefix="/applications", tags=["Applications"])
UPLOAD_FOLDER = "uploads/resumes"
UPLOAD_FOLDER_ATTACHMENTS  = "uploads/attachments"
UPLOAD_FOLDER_COVER_LETTER  = "uploads/cover_letter"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(UPLOAD_FOLDER_ATTACHMENTS, exist_ok=True)
os.makedirs(UPLOAD_FOLDER_COVER_LETTER, exist_ok=True)

ALLOWED_ATTACHMENT_EXT = {".jpg", ".jpeg", ".png", ".pdf"}

@router.get("/{application_id}/attachments", response_model=List[ApplicationAttachmentOut])
def get_application_attachments(
    application_id: int,
    db: Session = Depends(get_db),
    candidate_id: int = Depends(get_current_candidate_id)
):
    attachments = (
        db.query(ApplicationAttachment)
        .filter(ApplicationAttachment.application_id == application_id)
        .order_by(ApplicationAttachment.sort_order)
        .all()
    )
    return attachments

@router.get("/attach-file/{application_id}/attachments", response_model=List[ApplicationAttachmentOut])
def get_application_attachments_for_employer(
    application_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    app = (
        db.query(JobApplication)
        .options(joinedload(JobApplication.job))
        .filter(JobApplication.pk_id == application_id)
        .first()
    )
    if not app:
        raise HTTPException(404, "Application not found")

    employer = db.query(Employer).filter(Employer.user_id == current_user_id).first()
    if not employer or app.job.employer_id != employer.pk_id:
        raise HTTPException(403, "You can only view attachments for applications to your own jobs")

    attachments = (
        db.query(ApplicationAttachment)
        .filter(ApplicationAttachment.application_id == application_id)
        .order_by(ApplicationAttachment.sort_order)
        .all()
    )
    return attachments

@router.post("/{application_id}/attachments", response_model=List[ApplicationAttachmentOut])
async def upload_application_attachments(
    application_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    candidate_id: int = Depends(get_current_candidate_id)
):
    app = db.query(JobApplication).filter(
        JobApplication.pk_id == application_id,
        JobApplication.candidate_id == candidate_id
    ).first()
    if not app:
        raise HTTPException(404, "Application not found or not owned by you")

    uploaded = []

    for file in files:
        if not file.filename:
            continue
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_ATTACHMENT_EXT:
            continue

        filename = await save_uploaded_file(file, UPLOAD_FOLDER_ATTACHMENTS)

        max_order = (
            db.query(func.max(ApplicationAttachment.sort_order))
            .filter(ApplicationAttachment.application_id == application_id)
            .scalar() or -1
        )

        new_att = ApplicationAttachment(
            application_id=application_id,
            filename=filename,
            original_name=file.filename,
            file_type="image" if ext in {".jpg", ".jpeg", ".png"} else "pdf",
            size_bytes=file.size,
            sort_order=max_order + 1
        )
        db.add(new_att)
        uploaded.append(new_att)

    db.commit()
    return uploaded

async def save_uploaded_file(file: UploadFile, folder: str) -> str:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    original_filename = file.filename.strip()
    
    safe_filename = "".join(c for c in original_filename if c.isalnum() or c in "._- ")
    safe_filename = safe_filename.strip("_- .").replace(" ", "_")
    
    if len(safe_filename) > 200:
        safe_filename = safe_filename[:195] + "..."
    
    if not safe_filename:
        raise HTTPException(status_code=400, detail="Invalid filename after sanitization")

    full_path = os.path.join(folder, safe_filename)

    counter = 1
    base, ext = os.path.splitext(safe_filename)
    while os.path.exists(full_path):
        safe_filename = f"{base}_{counter}{ext}"
        full_path = os.path.join(folder, safe_filename)
        counter += 1

    async with aiofiles.open(full_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    return safe_filename

@router.get("/my-applied-job-ids")
def get_my_applied_job_ids(
    db: Session = Depends(get_db),
    candidate_id: int = Depends(get_current_candidate_id)
):
    job_ids = [
        row[0]
        for row in db.query(JobApplication.job_id)
            .filter(JobApplication.candidate_id == candidate_id)
            .all()
    ]
    return {"job_ids": job_ids}

@router.get("/my-jobs/counts", response_model=List[dict])
def get_application_counts_per_my_jobs(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    employer = db.query(Employer).filter(Employer.user_id == current_user_id).first()
    if not employer:
        raise HTTPException(status_code=403, detail="Employer profile required")

    from sqlalchemy import func
    from app.models.job_application_model import JobApplication
    from app.models.job_model import Job

    counts = (
        db.query(
            JobApplication.job_id,
            func.count(JobApplication.pk_id).label("count")
        )
        .join(Job, Job.pk_id == JobApplication.job_id)
        .filter(Job.employer_id == employer.pk_id)
        .group_by(JobApplication.job_id)
        .all()
    )

    return [{"job_id": row.job_id, "count": row.count} for row in counts]

@router.post("/", response_model=JobApplicationOut, status_code=201)
async def apply_to_job_endpoint(
    job_id: int = Form(...),
    request: Request = None,
    candidate_resume_id: int = Form(...),
    cover_letter_file: Optional[UploadFile] = File(None),
    attachments: List[UploadFile] = File(default=[]),
    delete_cover_letter: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    candidate_id: int = Depends(get_current_candidate_id)
):
    cover_filename = cover_original = cover_size = None

    if cover_letter_file:
        ext = os.path.splitext(cover_letter_file.filename)[1].lower()
        if ext not in [".pdf", ".docx"]:
            raise HTTPException(400, "Cover letter must be PDF or DOCX")
        cover_filename = await save_uploaded_file(cover_letter_file, UPLOAD_FOLDER_COVER_LETTER)
        cover_original = cover_letter_file.filename
        cover_size = cover_letter_file.size

    delete_cover = delete_cover_letter == "true"

    if delete_cover and cover_letter_file:
        raise HTTPException(400, "Cannot both upload new cover letter and delete existing one")

    new_attachments = []
    for file in attachments:
        if not file.filename:
            continue
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_ATTACHMENT_EXT:
            continue
        fname = await save_uploaded_file(file, UPLOAD_FOLDER_ATTACHMENTS)
        new_attachments.append({
            "filename": fname,
            "original_name": file.filename,
            "size_bytes": file.size,
            "file_type": "image" if ext in {".jpg",".jpeg",".png"} else "pdf"
        })
    
    ip_address = request.client.host,

    application = apply_to_job(
        db=db,
        job_id=job_id,
        candidate_id=candidate_id,
        resume_id=candidate_resume_id,
        cover_letter_filename=cover_filename,
        cover_letter_original=cover_original,
        cover_letter_size=cover_size,
        new_attachments=new_attachments,           # ← updated parameter name
        delete_cover_letter=delete_cover,
        ip_address=ip_address
    )

    return application

@router.get("/job/{job_id}", response_model=List[ApplicationOutForEmployer])
def list_job_applications(
    job_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    employer = db.query(Employer).filter(Employer.user_id == current_user_id).first()
    if not employer:
        raise HTTPException(403, "Employer profile required")

    return get_applications_for_job(db, job_id, employer.pk_id, skip, limit)

@router.patch("/{application_id}/status", response_model=dict)
async def update_status(
    application_id: int,
    request: Request,
    data: ApplicationStatusUpdate,               
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    employer = db.query(Employer).filter(Employer.user_id == current_user_id).first()
    if not employer:
        raise HTTPException(403, "Employer profile required")
    
    ip_address = request.client.host

    updated = update_application_status(
        db=db, 
        application_id=application_id, 
        new_status=data.new_status, 
        employer_id=employer.pk_id, 
        ip_address=ip_address,
        current_user_id=current_user_id
    )
    
    room = get_or_create_chat_room(
        db=db,
        user_a_id=updated.candidate.user.pk_id,
        user_b_id=current_user_id,
    )
    
    if room:
        current_user = db.query(User).filter(User.pk_id == current_user_id).first()
        
        job_link = f"/applied_candidates?job={updated.job_id}"
        status_text = updated.application_status.value.lower()

        message = (
            f"📌 Application Status Update\n"
            f"Your application has been "
            f"{status_text}.\n"
            # f"View details: {job_link}"
        )
        
        await send_text_message(
            db=db,
            current_user=current_user,
            room=room,
            content=message,
            message_type=MessageType.SYSTEM,
        )
        
    return {"message": f"Application status updated to {updated.application_status}"}

@router.get("/job/{job_id}/my-status")
def get_my_application_status(
    job_id: int,
    db: Session = Depends(get_db),
    candidate_id: int = Depends(get_current_candidate_id)
):
    app = db.query(JobApplication).filter(
        JobApplication.job_id == job_id,
        JobApplication.candidate_id == candidate_id
    ).order_by(JobApplication.applied_date.desc()).first()

    if not app:
        return {
            "applied": False,
            "application_id": None,
            "status": None,
            "resume_id": None,
            "applied_date": None,
            "cover_letter_filename": None,
            "has_attachments": False,
            "close_date": None,
            "job_status": None,
            "cancelled": False,
        }

    resume = None
    if app.candidate_resume_id:
        resume = db.query(CandidateResume).filter(
            CandidateResume.pk_id == app.candidate_resume_id
        ).first()

    return {
        "applied": True,
        "application_id": app.pk_id,
        "status": app.application_status.value,
        "resume_id": app.candidate_resume_id,
        "applied_date": app.applied_date,
        "cover_letter_filename": app.cover_letter_original or app.cover_letter_file,
        "has_attachments": len(app.attachments) > 0,           # ← changed
        "close_date": app.job.closing_date if app.job else None,
        "job_status": app.job.status if app.job else None,
        "cancelled": app.cancelled,
    }

@router.get("/resumes/{resume_id}/file")
def download_resume(resume_id: int, db: Session = Depends(get_db)):
    resume = db.query(CandidateResume).filter(CandidateResume.pk_id == resume_id).first()
    if not resume or not resume.resume_file:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Full path
    file_path = os.path.join(UPLOAD_FOLDER, resume.resume_file)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File {resume.resume_file} not found on server")

    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = "application/octet-stream"

    return FileResponse(
        path=file_path,
        filename=resume.resume_file,  
        media_type=mime_type
    )

@router.get("/{application_id}/cover-letter")
def download_cover_letter(
    application_id: int,
    db: Session = Depends(get_db)
):
    application = db.query(JobApplication).filter(JobApplication.pk_id == application_id).first()
    if not application:
        raise HTTPException(404, "Application not found")

    if not application.cover_letter_file:
        raise HTTPException(404, "No cover letter available for this application")

    file_path = os.path.join(UPLOAD_FOLDER_COVER_LETTER, application.cover_letter_file)
    if not os.path.exists(file_path):
        raise HTTPException(404, "Cover letter file not found on server")

    mime_type, _ = mimetypes.guess_type(file_path)
    return FileResponse(
        path=file_path,
        filename=application.cover_letter_original or application.cover_letter_file,
        media_type=mime_type or "application/octet-stream"
    )

@router.get("/attachments/{filename}")
def get_attachment_file(
    filename: str,
    disposition: str = "inline",
    db: Session = Depends(get_db),
):
    file_path = os.path.join(UPLOAD_FOLDER_ATTACHMENTS, filename)
    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found")
    
    attachment = db.query(ApplicationAttachment).filter(
        ApplicationAttachment.filename == filename
    ).first()

    display_name = attachment.original_name if attachment and attachment.original_name else filename
    
    mime_type, _ = mimetypes.guess_type(file_path)
    mime_type = mime_type or "application/octet-stream"

    cd_value = "inline" if disposition == "inline" else "attachment"

    return FileResponse(
        path=file_path,
        filename=display_name,               
        media_type=mime_type,
        headers={
            "Content-Disposition": safe_content_disposition(display_name, cd_value)
        }
    )

@router.delete("/{application_id}/attachments/{attachment_id}")
def delete_application_attachment(
    application_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    candidate_id: int = Depends(get_current_candidate_id)
):
    attachment = (
        db.query(ApplicationAttachment)
        .filter(
            ApplicationAttachment.id == attachment_id,
            ApplicationAttachment.application_id == application_id
        )
        .first()
    )

    if not attachment:
        raise HTTPException(404, "Attachment not found")

    app = db.query(JobApplication).filter(
        JobApplication.pk_id == application_id,
        JobApplication.candidate_id == candidate_id
    ).first()

    if not app:
        raise HTTPException(403, "Not authorized")

    db.delete(attachment)
    db.commit()

    try:
        os.remove(os.path.join(UPLOAD_FOLDER_ATTACHMENTS, attachment.filename))
    except OSError:
        pass  

    return {"message": "Attachment deleted"}

def safe_content_disposition(filename: str, disposition: str = "attachment") -> str:

    encoded = urllib.parse.quote(filename, safe="")
    value = f"{disposition}; filename*=UTF-8''{encoded}"
    
    return value



