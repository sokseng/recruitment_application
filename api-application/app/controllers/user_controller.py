
from sqlalchemy.orm import Session
from app.models.user_model import User
from app.models.user_session_model import UserSession
from app.schemas.user_schema import DeleteUser, ChangePassword, UpdateHospital, UpdateProfile
from passlib.context import CryptContext
from jose import jwt
from datetime import timedelta, datetime, timezone
from app.config.settings import settings  # secret + algorithm from env/config
from fastapi import HTTPException
from typing import Optional


SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated = 'auto')

# # create access token
def create_access_token(user_id: int, expires_delta: timedelta):
    now = datetime.now(timezone.utc)
    expires = now + expires_delta
    payload = {
        "user_id": user_id,
        "exp": expires
    }
    encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# # insert data into table token
def create_token(ip_address: str, user_id: int, access_token: str, expiration_date: datetime, db: Session):
    token = UserSession(
        user_id = user_id,  
        access_token = access_token,
        token_expired=expiration_date,
        ip_address=ip_address,
    )
    db.add(token)
    db.commit()
    db.refresh(token)
    return token


# get user by email
def get_by_email(email: str, db: Session):
    return db.query(User).filter(User.email == email).first()

# # check password encript
def verify_password(password: str, hashed_password: str):
    isMatch = bcrypt_context.verify(password, hashed_password)
    return isMatch


# # check token when logout
def check_token_when_logout(access_token: str, db: Session) -> bool:
    try:
        session_token = db.query(UserSession).filter(UserSession.access_token == access_token).first()
    
        if session_token:
            db.delete(session_token)
            db.commit()
            return True
    
        return False

    except Exception:
        db.rollback()
        return False


# # verify refresh token
def verify_refresh_token(token: str, db: Session) -> bool:
    now = datetime.now().replace(microsecond=0)
    refresh_session = db.query(UserSession).filter(
        UserSession.access_token == token,
        UserSession.token_expired > now
    ).first()

    if refresh_session:
        # ✅ Extend expiration correctly
        refresh_session.token_expired = now + timedelta(days=30)
        db.commit()
        db.refresh(refresh_session)
        return True  # Token is valid

    return False  # Token invalid or expired

# # verify access token
def verify_access_token(access_token: str, db: Session):
    now = datetime.now().replace(microsecond=0)
    access_token_data = db.query(UserSession).filter(
        UserSession.access_token == access_token,
        UserSession.token_expired > now
    ).first()

    if not access_token_data:
        return None

    return access_token_data



#delete user
def delete_users(db: Session, data: DeleteUser):
    if not data.ids or len(data.ids) == 0:
        raise HTTPException(status_code=400, detail="No IDs provided for deletion")
    
    users = db.query(User).filter(User.id.in_(data.ids)).all()
    if not users:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete all users
    for user in users:
        user.status="inactive"
    db.commit()
    return {"message": "Users deleted successfully"}
