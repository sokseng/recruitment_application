from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.forgot_password_schema import ForgotPasswordRequest, VerifyCodeRequest, ResetPasswordRequest
from app.controllers import forgot_password_controller
from passlib.context import CryptContext
from app.database.deps import get_db


router = APIRouter(prefix="/forgot_password", tags=["Forgot Password"])
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated = 'auto')


#forogot password
@router.post("/")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return forgot_password_controller.forgot_password(db, data)

#verify code
@router.post("/verify_code")
def verify_code(data: VerifyCodeRequest, db: Session = Depends(get_db)):
    return forgot_password_controller.verify_code(db, data)


#reset password
@router.post("/reset_password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    return forgot_password_controller.reset_password(db, data)
