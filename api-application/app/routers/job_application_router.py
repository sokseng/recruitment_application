#job_application_router.py
from datetime import datetime
import os
import aiofiles
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, logger
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.auth import verify_access_token, get_db
from app.dependencies.candidate import get_current_candidate_id
from app.models.employer_model import Employer
from app.models.job_application_model import JobApplication
from app.models.candidate_resume_model import CandidateResume
from app.models.job_model import Job
from app.models.resume_image_model import ResumeImage
from app.models.chat_room import ChatRoom
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
from fastapi.responses import StreamingResponse
from io import BytesIO
import os
from PyPDF2 import PdfReader, PdfWriter
from PIL import Image
import mimetypes
from app.controllers.chat_controller import send_text_message

class ResumeImageOut(BaseModel):
    id: int
    filename: str
    original_name: str | None
    uploaded_at: datetime
    size_bytes: int | None
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

@router.get("/resumes/{resume_id}/images", response_model=List[ResumeImageOut])
def get_resume_images(
    resume_id: int,
    db: Session = Depends(get_db),
    candidate_id: int = Depends(get_current_candidate_id)
):
    resume = db.query(CandidateResume).filter(
        CandidateResume.pk_id == resume_id,
        CandidateResume.candidate_id == candidate_id
    ).first()
    if not resume:
        raise HTTPException(404, "Resume not found or not owned by you")

    images = (
        db.query(ResumeImage)
        .filter(ResumeImage.resume_id == resume_id)
        .order_by(ResumeImage.sort_order)
        .all()
    )
    return images

@router.post("/resumes/{resume_id}/images", response_model=List[ResumeImageOut])
async def upload_resume_images(
    resume_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    candidate_id: int = Depends(get_current_candidate_id)
):
    resume = db.query(CandidateResume).filter(
        CandidateResume.pk_id == resume_id,
        CandidateResume.candidate_id == candidate_id
    ).first()
    if not resume:
        raise HTTPException(404, "Resume not found or not owned by you")

    uploaded = []

    for file in files:
        if not file.filename:
            continue
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png"]:
            continue

        filename = await save_uploaded_file(file, UPLOAD_FOLDER_ATTACHMENTS)

        max_order = (
            db.query(func.max(ResumeImage.sort_order))
            .filter(ResumeImage.resume_id == resume_id)
            .scalar() or -1
        )

        new_img = ResumeImage(
            resume_id=resume_id,
            filename=filename,
            original_name=file.filename,
            size_bytes=None,
            sort_order=max_order + 1
        )
        db.add(new_img)
        uploaded.append(new_img)

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
    candidate_resume_id: int = Form(...),              
    cover_letter_file: Optional[UploadFile] = File(None, description="Cover letter (PDF or DOCX)"),
    images: List[UploadFile] = File(default=[]),
    delete_cover_letter: Optional[str] = Form(
        None,
        description="Set to 'true' to remove existing cover letter"
    ),
    db: Session = Depends(get_db),
    candidate_id: int = Depends(get_current_candidate_id)
):
    cover_filename = None
    new_image_filenames = []

    if cover_letter_file:
        ext = os.path.splitext(cover_letter_file.filename)[1].lower()
        allowed = [".pdf", ".docx"]
        if ext not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Cover letter must be PDF or DOCX. Got: {ext}"
            )
        cover_filename = await save_uploaded_file(cover_letter_file, UPLOAD_FOLDER_COVER_LETTER)
    delete_cover = delete_cover_letter == "true"

    if delete_cover and cover_letter_file:
        raise HTTPException(
            status_code=400,
            detail="Cannot both upload new cover letter and delete existing one"
        )

    if images:
        for file in images:
            if not file.filename:
                continue
            ext = os.path.splitext(file.filename)[1].lower()
            if ext not in [".jpg", ".jpeg", ".png"]:
                continue
            filename = await save_uploaded_file(file, UPLOAD_FOLDER_ATTACHMENTS)
            new_image_filenames.append(filename)

    application = apply_to_job(
        db=db,
        job_id=job_id,
        candidate_id=candidate_id,
        resume_id=candidate_resume_id,
        cover_letter_filename=cover_filename,   
        delete_cover_letter=delete_cover,       
        new_image_filenames=new_image_filenames,       
        reset_status_on_reapply=True,
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
    data: ApplicationStatusUpdate,               
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    employer = db.query(Employer).filter(Employer.user_id == current_user_id).first()
    if not employer:
        raise HTTPException(403, "Employer profile required")

    updated = update_application_status(db, application_id, data.new_status, employer.pk_id)
    
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
    ).first()
    
    if not app:
        return {"applied": False}
    
    resume = None
    cover_letter_filename = None
    has_images = False
    
    if app.candidate_resume_id:
        resume = db.query(CandidateResume).filter(
            CandidateResume.pk_id == app.candidate_resume_id
        ).first()
        if resume:
            cover_letter_filename = resume.cover_letter_file
            has_images = len(resume.images) > 0  

    return {
        "applied": True,
        "application_id": app.pk_id,
        "status": app.application_status.value,
        "resume_id": app.candidate_resume_id,
        "applied_date": app.applied_date,
        "cover_letter_filename": cover_letter_filename,     
        "has_images": has_images,
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
    application = (
        db.query(JobApplication)
        .filter(JobApplication.pk_id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    resume = db.query(CandidateResume).filter(
        CandidateResume.pk_id == application.candidate_resume_id
    ).first()

    if not resume or not resume.cover_letter_file:
        raise HTTPException(status_code=404, detail="No cover letter available for this application")

    file_path = os.path.join(UPLOAD_FOLDER_COVER_LETTER, resume.cover_letter_file)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"Cover letter file {resume.cover_letter_file} not found on server"
        )

    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = "application/octet-stream"

    return FileResponse(
        path=file_path,
        filename=resume.cover_letter_file,
        media_type=mime_type
    )

@router.get("/{application_id}/combined-pdf")
async def get_combined_application_pdf(
    application_id: int,
    db: Session = Depends(get_db)
):
    application = (
        db.query(JobApplication)
        .filter(JobApplication.pk_id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(Job).filter(Job.pk_id == application.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Related job not found")

    buffers = []

    resume = None
    if application.candidate_resume_id:
        resume = db.query(CandidateResume).filter(
            CandidateResume.pk_id == application.candidate_resume_id
        ).first()

    if resume and resume.resume_file:
        resume_path = os.path.join(UPLOAD_FOLDER, resume.resume_file)
        if os.path.exists(resume_path) and resume_path.lower().endswith(".pdf"):
            with open(resume_path, "rb") as f:
                buffers.append((BytesIO(f.read()), True))

    if resume and resume.cover_letter_file:
        cl_path = os.path.join(UPLOAD_FOLDER_COVER_LETTER, resume.cover_letter_file)
        if os.path.exists(cl_path) and cl_path.lower().endswith(".pdf"):
            with open(cl_path, "rb") as f:
                buffers.append((BytesIO(f.read()), True))

    if resume:
        images = db.query(ResumeImage).filter(
            ResumeImage.resume_id == resume.pk_id
        ).order_by(ResumeImage.sort_order).all()

        for img in images:
            img_path = os.path.join(UPLOAD_FOLDER_ATTACHMENTS, img.filename)
            if os.path.exists(img_path):
                try:
                    img_buffer = BytesIO()
                    with Image.open(img_path) as img_pil:
                        img_pil.save(img_buffer, format="PDF", resolution=100.0)
                    img_buffer.seek(0)
                    buffers.append((img_buffer, True))
                except Exception as e:
                    print(f"Image to PDF failed for {img.filename}: {e}")

    if not buffers:
        raise HTTPException(
            status_code=404,
            detail="No combinable files (PDF resume, cover letter, or images) available"
        )

    output = PdfWriter()
    try:
        for buf, _ in buffers:
            buf.seek(0)
            reader = PdfReader(buf)
            for page in reader.pages:
                output.add_page(page)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF merge failed: {str(e)}")

    pdf_bytes = BytesIO()
    output.write(pdf_bytes)
    pdf_bytes.seek(0)

    filename = f"application_{application_id}_combined.pdf"
    return StreamingResponse(
        pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )


@router.delete("/resumes/{resume_id}/images/{image_id}")
def delete_resume_image(
    resume_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    candidate_id: int = Depends(get_current_candidate_id)
):
    image = (
        db.query(ResumeImage)
        .filter(
            ResumeImage.id == image_id,
            ResumeImage.resume_id == resume_id
        )
        .first()
    )

    if not image:
        raise HTTPException(404, "Image not found")

    resume = db.query(CandidateResume).filter(
        CandidateResume.pk_id == resume_id,
        CandidateResume.candidate_id == candidate_id
    ).first()

    if not resume:
        raise HTTPException(403, "Not authorized")

    db.delete(image)
    db.commit()

    try:
        os.remove(os.path.join(UPLOAD_FOLDER_ATTACHMENTS, image.filename))
    except OSError:
        pass  

    return {"message": "Image deleted"}

@router.delete("/resumes/{resume_id}/cover-letter")
def delete_cover_letter(
    resume_id: int,
    db: Session = Depends(get_db),
    candidate_id: int = Depends(get_current_candidate_id)
):
    resume = db.query(CandidateResume).filter(
        CandidateResume.pk_id == resume_id,
        CandidateResume.candidate_id == candidate_id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found or not yours")

    if not resume.cover_letter_file:
        raise HTTPException(status_code=400, detail="No cover letter to delete")

    file_path = os.path.join(UPLOAD_FOLDER_COVER_LETTER, resume.cover_letter_file)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            print(f"Deleted cover letter file: {file_path}") 
        except Exception as e:
            print(f"Failed to delete file {file_path}: {e}")

    resume.cover_letter_file = None
    db.add(resume)
    db.commit()

    return {"message": "Cover letter deleted successfully"}


