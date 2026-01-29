import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.auth import verify_access_token
from app.database.deps import get_db
from app.schemas.candidate_resume_schema import ResumeCreate, ResumeUpdate, ResumeOut
from app.dependencies.candidate import get_current_candidate_id
from app.models.candidate_resume_model import ResumeType
from app.models.candidate_resume_model import CandidateResume
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

@router.get("/{resume_id}/file")
def download_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token),
    candidate_id: int = Depends(get_current_candidate_id)
):
    resume = db.query(CandidateResume).filter(
        CandidateResume.pk_id == resume_id,
        CandidateResume.candidate_id == candidate_id
    ).first()

    if not resume or not resume.resume_file:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Path on your server where files are stored
    file_path = os.path.join("uploads/resumes", resume.resume_file) 

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    # Return the file for download
    return FileResponse(
        path=file_path,
        filename=resume.resume_file,
        media_type="application/octet-stream"
    )

@router.get("/generate-cv/{template_id}/{candidate_id}")
def generate_cv(template_id: str, candidate_id: int = Depends(get_current_candidate_id), db: Session = Depends(get_db)):
    env = Environment(loader=FileSystemLoader("cv_template"))
    TEMPLATE_MAP = {
        "modern-minimal": "modern_minimal.html",
        "creative-designer": "creative_designer.html",
        "corporate-professional": "corporate_professional.html",
        "tech-startup": "tech_startup.html",
        "academic-research": "academic_research.html",
    }

    if not os.path.exists("temp_files"):
        os.makedirs("temp_files")

    if template_id not in TEMPLATE_MAP:
        raise HTTPException(status_code=404, detail="Template not found")

    user_data = {
        "name": f"Candidate{candidate_id}",
        "email": f"candidate{candidate_id}@example.com",
        "phone": "123-456-7890",
        "skills": ["Python", "React", "FastAPI", "SQL"],
        "experience": [
            {"title": "Software Engineer", "company": "ABC Corp", "years": "2021-2023"},
            {"title": "Frontend Developer", "company": "XYZ Inc", "years": "2019-2021"},
        ],
        "education": [
            {"degree": "BSc Computer Science", "school": "University A", "years": "2015-2019"}
        ]
    }

    # Load HTML template
    env = Environment(loader=FileSystemLoader("cv_template"))
    template_file = TEMPLATE_MAP[template_id]
    template = env.get_template(template_file)
    html_content = template.render(user=user_data)

    # Generate PDF
    pdf_filename = f"temp_files/Candidate{candidate_id}_{template_id}.pdf"
    from weasyprint import HTML
    HTML(string=html_content).write_pdf(pdf_filename)

    # Return PDF
    return FileResponse(
        pdf_filename,
        filename=f"Candidate{candidate_id}_{template_id}.pdf",
        media_type="application/pdf"
    )