from datetime import datetime

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config.settings import settings
import os
import traceback
from app.core.logger import logger
from fastapi.responses import JSONResponse

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
    call_router,
    audit_trace_router
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
from app.models.audit_trace_model import AuditTrace

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

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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
app.include_router(audit_trace_router.router)




# ===============================
# GLOBAL EXCEPTION HANDLER
# ===============================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    endpoint = request.scope.get("endpoint")
    tb = traceback.extract_tb(exc.__traceback__) if exc.__traceback__ else None

    file = tb[-1].filename if tb else "Unknown"
    line = tb[-1].lineno if tb else "Unknown"
    function_name = endpoint.__name__ if endpoint else "Unknown"
    client_ip = request.client.host if request.client else "Unknown"
    detail = str(exc)

    logger.error(
        f"Function={function_name} --> "
        f"File={file} --> "
        f"Line={line} --> "
        f"Client={client_ip} --> "
        f"Detail={detail}"
    )

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"}
    )


# ===============================
# HTTP EXCEPTION HANDLER
# ===============================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    endpoint = request.scope.get("endpoint")
    tb = traceback.extract_tb(exc.__traceback__) if exc.__traceback__ else None

    file = tb[-1].filename if tb else "Unknown"
    line = tb[-1].lineno if tb else "Unknown"
    function_name = endpoint.__name__ if endpoint else "Unknown"
    client_ip = request.client.host if request.client else "Unknown"
    detail = exc.detail

    logger.error(
        f"Function={function_name} --> "
        f"File={file} --> "
        f"Line={line} --> "
        f"Client={client_ip} --> "
        f"Detail={detail}"
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": detail}
    )