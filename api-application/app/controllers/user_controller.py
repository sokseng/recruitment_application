
from sqlalchemy.orm import Session
from app.models.user_model import User
from app.models.user_session_model import UserSession
from app.schemas.user_schema import DeleteUser, UserCreate, ChangePassword, UpdateUserProfile, UserResponse
from passlib.context import CryptContext
from app.models.job_model import Job
from jose import jwt
from sqlalchemy import select
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
    if user.pk_id:
        db_user = db.query(User).filter(User.pk_id == user.pk_id).first()
        db_user.user_name = user.user_name
        db_user.email = user.email
        # db_user.password = user.password
        # db_user.user_type = user.user_type
        db_user.gender = user.gender
        db_user.phone = user.phone
        db_user.date_of_birth = user.date_of_birth
        db_user.address = user.address
        db_user.is_active = user.is_active
        db_user.updated_date = datetime.now().replace(microsecond=0)
        db.commit()
        db.refresh(db_user)
        
        return UserResponse(
            user_type=db_user.user_type,
            pk_id=db_user.pk_id,
            user_name=db_user.user_name,
            email=db_user.email,
            gender=db_user.gender,
            phone=db_user.phone,
            date_of_birth=db_user.date_of_birth,
            address=db_user.address,
            is_active=db_user.is_active,
            created_date=db_user.created_date,
            updated_date=db_user.updated_date
        )
    
    exist_email = db.query(User).filter(User.email == user.email).first()
    if exist_email:
        raise HTTPException(status_code=400, detail="Email already exists")
    
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
            company_email = user.email
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


#get user by id
def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.pk_id == user_id).first()


#update user profile
def update_user_profile(db: Session, user_id: int, user_data: UpdateUserProfile):
    user = db.query(User).filter(User.pk_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.user_name = user_data.user_name
    user.phone = user_data.phone
    user.date_of_birth = user_data.date_of_birth
    user.gender = user_data.gender
    user.address = user_data.address
    db.commit()
    db.refresh(user)
    return user


def get_jobs_by_employer(db: Session, user_id: int):
    db_user = db.query(User).filter(User.pk_id == user_id).first()
    if not db_user:
        return []

    # ADMIN → get ALL jobs
    if db_user.user_type == int(UserType.ADMIN.value):
        stmt = (
            db.query(
                Job.pk_id,
                Job.job_title,
                Job.job_type,
                Job.level,
                Job.position_number,
                Job.salary_range,
                Job.location,
                Job.job_description,
                Job.posting_date,
                Job.closing_date,
                Job.status,
                Job.created_at,
                Employer.company_name,
                Employer.company_logo,
            )
            .join(Employer, Employer.pk_id == Job.employer_id)
            .order_by(Job.created_at.desc())
        )

        rows = stmt.all()

        result = []
        for row in rows:
            result.append({
                "pk_id": row.pk_id,
                "job_title": row.job_title,
                "job_type": row.job_type,
                "level": row.level,
                "position_number": row.position_number,
                "salary_range": row.salary_range,
                "location": row.location,
                "job_description": row.job_description,
                "posting_date": row.posting_date,
                "closing_date": row.closing_date,
                "status": row.status.value if hasattr(row.status, "value") else row.status,
                "created_at": row.created_at,
                "company_name": row.company_name,
                "company_logo": row.company_logo,
            })

        return result

    return []


from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session

def create_or_update_user_admin(user: UserCreate, db: Session):

    # ==========================
    # UPDATE USER
    # ==========================
    if user.pk_id:
        db_user = db.query(User).filter(User.pk_id == user.pk_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        existing_email = db.query(User).filter(User.email == user.email).first()
        if existing_email and existing_email.pk_id != user.pk_id:
            raise HTTPException(status_code=400, detail="Email already exists")

        # ---- Update user fields ----
        db_user.user_name = user.user_name
        db_user.email = user.email
        db_user.user_type = user.user_type
        db_user.gender = user.gender
        db_user.phone = user.phone
        db_user.date_of_birth = user.date_of_birth
        db_user.address = user.address
        db_user.is_active = user.is_active
        db_user.updated_date = datetime.now().replace(microsecond=0)

        # ==========================
        # UPDATE EMPLOYER
        # ==========================
        if db_user.user_type == int(UserType.EMPLOYER.value):
            db_employer = (
                db.query(Employer)
                .filter(Employer.user_id == db_user.pk_id)
                .first()
            )

            if db_employer:
                db_employer.company_name = user.user_name
                db_employer.company_email = user.email
            else:
                db_employer = Employer(
                    user_id=db_user.pk_id,
                    company_name=user.user_name,
                    company_email=user.email,
                )
                db.add(db_employer)

        # ==========================
        # UPDATE CANDIDATE
        # ==========================
        if db_user.user_type == int(UserType.CANDIDATE.value):
            db_candidate = (
                db.query(Candidate)
                .filter(Candidate.user_id == db_user.pk_id)
                .first()
            )

            if not db_candidate:
                db_candidate = Candidate(user_id=db_user.pk_id)
                db.add(db_candidate)

        db.commit()
        db.refresh(db_user)

        return UserResponse(
            pk_id=db_user.pk_id,
            user_type=db_user.user_type,
            user_name=db_user.user_name,
            email=db_user.email,
            gender=db_user.gender,
            phone=db_user.phone,
            date_of_birth=db_user.date_of_birth,
            address=db_user.address,
            is_active=db_user.is_active,
            created_date=db_user.created_date,
            updated_date=db_user.updated_date,
        )

    # ==========================
    # CREATE USER
    # ==========================
    exist_email = db.query(User).filter(User.email == user.email).first()
    if exist_email:
        raise HTTPException(status_code=400, detail="Email already exists")

    db_user = User(
        user_name=user.user_name,
        email=user.email,
        password=bcrypt_context.hash(user.password),
        user_type=user.user_type,
        gender=user.gender,
        phone=user.phone,
        date_of_birth=user.date_of_birth,
        address=user.address,
        is_active=True,
        created_date=datetime.now().replace(microsecond=0),
        updated_date=datetime.now().replace(microsecond=0),
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # ==========================
    # CREATE EMPLOYER
    # ==========================
    if db_user.user_type == int(UserType.EMPLOYER.value):
        db_employer = Employer(
            user_id=db_user.pk_id,
            company_name=db_user.user_name,
            company_email=db_user.email,
        )
        db.add(db_employer)

    # ==========================
    # CREATE CANDIDATE
    # ==========================
    if db_user.user_type == int(UserType.CANDIDATE.value):
        db_candidate = Candidate(user_id=db_user.pk_id)
        db.add(db_candidate)

    db.commit()
    db.refresh(db_user)

    return db_user
