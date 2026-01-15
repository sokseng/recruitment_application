
from sqlalchemy.orm import Session
from app.models.user_model import User
from app.models.user_session_model import UserSession
from app.schemas.user_schema import DeleteUser, UserCreate, ChangePassword
from passlib.context import CryptContext
from jose import jwt
from datetime import timedelta, datetime, timezone
from app.config.settings import settings  # secret + algorithm from env/config
from fastapi import HTTPException
from app.enums.global_enum import UserType
from app.models.employer_model import Employer
from app.models.candidate_model import Candidate


SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated = 'auto')


#create or update user
def create_or_update_user(user: UserCreate, db: Session):
    exist_email = db.query(User).filter(User.email == user.email).first()
    if exist_email:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    if user.pk_id:
        db_user = db.query(User).filter(User.pk_id == user.pk_id).first()
        db_user.user_name = user.user_name
        db_user.email = user.email
        db_user.password = user.password
        db_user.user_type = user.user_type
        db_user.gender = user.gender
        db_user.phone = user.phone
        db_user.date_of_birth = user.date_of_birth
        db_user.address = user.address
        db_user.updated_date = datetime.now().replace(microsecond=0)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    db_user = User(
        user_name = user.user_name,
        email = user.email,
        password = bcrypt_context.hash(user.password),
        user_type = user.user_type,
        gender = user.gender,
        phone = user.phone,
        date_of_birth = user.date_of_birth,
        address = user.address,
        created_date = datetime.now().replace(microsecond=0),
        updated_date = datetime.now().replace(microsecond=0)
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if db_user.user_type ==  int(UserType.EMPLOYER.value):
        db_employer = Employer( 
            user_id = db_user.pk_id,
            company_name = user.user_name,
        )
        db.add(db_employer)
        db.commit()
        db.refresh(db_employer)

    if db_user.user_type == int(UserType.CANDIDATE.value):
        db_candidate = Candidate( 
            user_id = db_user.pk_id,
        )
        db.add(db_candidate)
        db.commit()
        db.refresh(db_candidate)
    
    return db_user


#get all users
def get_all_users(db: Session):
    return db.query(User).all()

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
    
    users = db.query(User).filter(User.pk_id.in_(data.ids)).all()
    if not users:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete all users
    for user in users:
        user.is_active = False
    db.commit()
    return {"message": "Users deleted successfully"}


#change password
def change_password(db: Session, user_id: int, data: ChangePassword):
    user = db.query(User).filter(User.pk_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(data.old_password, user.password):
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    user.password = bcrypt_context.hash(data.new_password)
    db.commit()
    return True
