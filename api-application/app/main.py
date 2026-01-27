from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config.settings import settings
import os

from app.routers import (
    user_router,
    employer_router,
    job_router,
    candidate_router,
    candidate_resume_router,
    category_router,
    admin_candidate_router
)

from app.database.session import Base, engine
from app.models.user_model import User
from app.models.user_session_model import UserSession
from app.models.employer_model import Employer
from app.models.job_model import Job
from app.models.candidate_model import Candidate
from app.models.candidate_resume_model import CandidateResume
from app.models.category_model import Category
from app.models.candidate_profile import CandidateProfile

from app.script.init_user import run as init_user
from app.script.init_category import run as init_category


def create_tables():
    """Create all tables if they don't exist"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")


# Run once on startup
create_tables()
init_user()
init_category()

app = FastAPI(title=settings.APP_NAME)

# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure static file serving
UPLOAD_DIR = "uploads/employers"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads/employers", StaticFiles(directory=UPLOAD_DIR), name="employer-uploads")

# Register routers
app.include_router(user_router.router)
app.include_router(employer_router.router)
app.include_router(job_router.router)
app.include_router(candidate_router.router)
app.include_router(candidate_resume_router.router)
app.include_router(category_router.router)
app.include_router(admin_candidate_router.router)
