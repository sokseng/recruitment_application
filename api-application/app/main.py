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
    admin_candidate_router,
    job_application_router,
    chat_router,
    websocket_router,
    global_setting_router,
    dashboard_router,
    forgot_password_router,
    call_router
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
from app.models.job_application_model import JobApplication
from app.models.employer_category_model import employer_category
from app.models.global_setting_model import GlobalSetting
from app.models.forgot_password_model import ForgotPassword
from app.models.email_log_model import EmailLog
from app.models.message_react_model import MessageReaction

from app.script.init_user import run as init_user
from app.script.init_category import run as init_category
from app.script.init_global_settings import run as init_global_settings

from fastapi.staticfiles import StaticFiles


def create_tables():
    """Create all tables if they don't exist"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")


# Run once on startup
create_tables()
init_user()
init_category()
init_global_settings()

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
os.makedirs("uploads/chat/images", exist_ok=True)
os.makedirs("uploads/chat/voice", exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads/employers", StaticFiles(directory=UPLOAD_DIR), name="employer-uploads")
app.mount("/uploads/chat", StaticFiles(directory="uploads/chat"), name="chat-files")

# Register routers
app.include_router(user_router.router)
app.include_router(employer_router.router)
app.include_router(job_router.router)
app.include_router(candidate_router.router)
app.include_router(candidate_resume_router.router)
app.include_router(category_router.router)
app.include_router(admin_candidate_router.router)
app.include_router(job_application_router.router)
app.include_router(chat_router.router)
app.include_router(websocket_router.router)
app.include_router(global_setting_router.router)
app.include_router(dashboard_router.router)
app.include_router(forgot_password_router.router)
app.include_router(call_router.router)