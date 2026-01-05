from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings

from app.routers import (
    user_router,
)

from app.database.session import Base, engine
from app.models.user_model import User
from app.models.user_session_model import UserSession
from app.models.employer_model import Employer
from app.models.candidate_model import Candidate

# from app.script.init_global_settings import run as init_global_settings
# from app.script.init_user_role import run as init_user_role
# from app.script.init_user_rights import run as init_user_rights
# from app.script.init_user import run as init_user


def create_tables():
    """Create all tables if they don't exist"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")


# Run once on startup
create_tables()
# init_global_settings()
# init_user_role()
# init_user_rights()
# init_user()

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(user_router.router)
# app.include_router(user_role_router.router)
# app.include_router(user_right_router.router)
# app.include_router(forgot_password_router.router)
# app.include_router(global_setting_router.router)
# app.include_router(audit_trace_router.router)
