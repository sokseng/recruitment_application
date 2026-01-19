from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config.settings import settings

from app.routers import (
    user_router,
    employer_router,
    job_router,
    candidate_router,
    candidate_resume_router,
)

from app.database.session import Base, engine
from app.models.user_model import User
from app.models.user_session_model import UserSession
from app.models.employer_model import Employer
from app.models.job_model import Job
from app.models.candidate_model import Candidate
from app.models.candidate_resume_model import CandidateResume

from app.script.init_user import run as init_user


def create_tables():
    """Create all tables if they don't exist"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")


# Run once on startup
create_tables()
init_user()

app = FastAPI(title=settings.APP_NAME)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(user_router.router)
app.include_router(employer_router.router)
app.include_router(job_router.router)
app.include_router(candidate_router.router)
app.include_router(candidate_resume_router.router)
