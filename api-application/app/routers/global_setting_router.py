from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.system_parameter_schema import SystemParameterRead, SystemParameterUpdate
from app.controllers import global_setting_controller
from app.database.session import SessionLocal
from passlib.context import CryptContext
from app.dependencies.auth import verify_access_token



router = APIRouter(prefix="/global", tags=["Global Setting"])
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated = 'auto')

# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#get all global setting
@router.get("/parameter", response_model=list[SystemParameterRead])
def get_all_global_setting(db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    # Now the token is verified, and you can access current_user_id
    return global_setting_controller.get_all_global_setting(db)

#update system parameter
@router.post("/parameter")
def update_system_parameter(data: SystemParameterUpdate, db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    return global_setting_controller.update_system_parameter(db, data)