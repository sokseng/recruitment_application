
from sqlalchemy.orm import Session
from app.models.candidate_profile import CandidateProfile
from app.models.category_model import Category
from app.models.user_model import User
from app.models.user_session_model import UserSession
from app.schemas.user_schema import DeleteUser, UserCreate, ChangePassword, UpdateUserProfile, UserResponse
from passlib.context import CryptContext
from app.models.job_model import Job
from jose import jwt
from datetime import timedelta, datetime, timezone
from app.config.settings import settings
from fastapi import HTTPException, Request, UploadFile
from app.enums.global_enum import UserType, UserTypeName
from app.models.employer_model import Employer
from app.models.candidate_model import Candidate
from app.models.global_setting_model import GlobalSetting
from app.models.audit_trace_model import AuditTrace
from app.utils.audit import audit_log
import os
import uuid
import shutil

SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated = 'auto')

#get in global setting
def get_password_settings(db: Session):
    codes = [
        "MINIMUM_NUMBER_OF_CHARACTERS_IN_PASSWORD",
        "MAXIMUM_NUMBER_OF_CHARACTERS_IN_PASSWORD",
        "PASSWORD_SET_LIST_SPECIAL_CHARACTERS",
        "AT_LEAST_ONE_NUMBER_REQUIRED_IN_PASSWORD",
        "AT_LEAST_ONE_UPPERCASE_CHARACTER_REQUIRED_IN_PASSWORD",
        "AT_LEAST_ONE_LOWERCASE_CHARACTER_REQUIRED_IN_PASSWORD",
    ]

    settings = (
        db.query(GlobalSetting)
        .filter(GlobalSetting.code.in_(codes))
        .all()
    )

    result = {}
    for s in settings:
        if s.type == "Number":
            # Convert to int if value exists, else None
            if s.value and s.value.strip().isdigit():
                result[s.code] = int(s.value.strip())
            else:
                result[s.code] = None

        elif s.type == "Boolean":
            if s.value is None:
                result[s.code] = False
            else:
                val = s.value.strip().lower()
                result[s.code] = val in ("true", "1", "yes")

        else:
            # Store stripped string if exists, else empty string
            result[s.code] = s.value.strip() if s.value else ""

    return result

#create or update user
def create_or_update_user(user: UserCreate, db: Session, request: Request):
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
        
        ip_address = request.client.host if request else "Unknown"
        audit_log(
            db=db,
            db_obj=db_user,
            action="Updated User",
            user_name=db_user.user_name,
            ip_address=ip_address,
            exclude_fields=["updated_date"]
        )

        if user.user_type == int(UserType.CANDIDATE.value):
            db_candidate = db.query(Candidate).filter(Candidate.user_id == db_user.pk_id).first()
            
            job_category_id = int(user.jobCategoryId) if user.jobCategoryId not in (None, "") else None
            experience_level = user.experience_level if user.experience_level not in (None, "") else None
            expected_salary = user.min_monthly_salary if user.min_monthly_salary not in (None, "") else None

            profile_fields = [job_category_id, experience_level, expected_salary]
            has_profile_data = any(field is not None for field in profile_fields)

            if has_profile_data:
                db_profile = db.query(CandidateProfile).filter(CandidateProfile.candidate_id == db_candidate.pk_id).first()
                if not db_profile:
                    db_profile = CandidateProfile(candidate_id=db_candidate.pk_id)
                    db.add(db_profile)

                db_profile.job_category_id = job_category_id
                db_profile.experience_level = experience_level
                db_profile.expected_salary = expected_salary

            else:
                db_profile = db.query(CandidateProfile).filter(CandidateProfile.candidate_id == db_candidate.pk_id).first()
                if db_profile:
                    db_profile.job_category_id = None
                    db_profile.experience_level = None
                    db_profile.expected_salary = None

            def format_job_category(db, value):
                if not value:
                    return None

                job_category = db.query(Category).filter(
                    Category.pk_id == value
                ).first()

                return job_category.name if job_category else None
            
            # 🔥 AUDIT PROFILE
            if db_profile:
                audit_log(
                    db=db,
                    db_obj=db_profile,
                    action="Updated Candidate Profile",
                    user_name=db_user.user_name,
                    ip_address=ip_address,
                    value_formatters={
                        "job_category_id": lambda db, value: format_job_category(db, value)
                    },
                    field_rename={
                        "job_category_id": "category"   
                    }
                )
            
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
            updated_date=db_user.updated_date,
            approved=db_user.approved
        )
    
    #----------------Create new user----------------#

    # Get password condition in global settings
    settings = get_password_settings(db)
    min_len = settings["MINIMUM_NUMBER_OF_CHARACTERS_IN_PASSWORD"]  # int
    max_len = settings["MAXIMUM_NUMBER_OF_CHARACTERS_IN_PASSWORD"]  # int
    special_chars = settings["PASSWORD_SET_LIST_SPECIAL_CHARACTERS"] # str
    require_number = settings["AT_LEAST_ONE_NUMBER_REQUIRED_IN_PASSWORD"]       # bool
    require_upper = settings["AT_LEAST_ONE_UPPERCASE_CHARACTER_REQUIRED_IN_PASSWORD"]  # bool
    require_lower = settings["AT_LEAST_ONE_LOWERCASE_CHARACTER_REQUIRED_IN_PASSWORD"]  # bool

    passwords = user.password

    # Only validate if setting is not empty
    if min_len is not None and len(passwords) < min_len:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "PASSWORD_MUST_BE_AT_LEAST_X_CHARACTERS",
                "message": f"Password must be at least {min_len} characters"
            }
        )
    
    if max_len is not None and len(passwords) > max_len:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "PASSWORD_MUST_BE_AT_MOST_X_CHARACTERS",
                "message": f"Password must be at most {max_len} characters"
            }
        )
    
    if special_chars and not any(char in special_chars for char in passwords):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "PASSWORD_MUST_CONTAIN_AT_LEAST_ONE_OF_THE_FOLLOWING_SPECIAL_CHARACTERS",
                "message": f"Password must contain at least one of the following special characters: {special_chars}"
            }
        )
    
    if require_number and not any(char.isdigit() for char in passwords):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "PASSWORD_MUST_CONTAIN_AT_LEAST_ONE_NUMBER",
                "message": f"Password must contain at least one number"
            }
        )

    if require_upper and not any(char.isupper() for char in passwords):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "PASSWORD_MUST_CONTAIN_AT_LEAST_ONE_UPPERCASE_LETTER",
                "message": f"Password must contain at least one uppercase letter"
            }
        )

    if require_lower and not any(char.islower() for char in passwords):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "PASSWORD_MUST_CONTAIN_AT_LEAST_ONE_LOWERCASE_LETTER",
                "message": f"Password must contain at least one lowercase letter"
            }
        )
    
    exist_email = db.query(User).filter(User.email == user.email).first()
    if exist_email:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "EMAIL_EXISTS",
                "message": "Email already exists"
            }
        )
    
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


# update user
def update_user(db: Session, current_user_id: int, pk_id: int, ip_address: str):
    user_connection = db.query(User).filter(User.pk_id == current_user_id).first()
    if not user_connection:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user = db.query(User).filter(User.pk_id == pk_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    #------------------- AUDIT LOG ----------------------
    detail_info = None
    action_type = None
    
    changes = [
        f"pk_id: '{db_user.pk_id}'",
        f"user_name: '{db_user.user_name}'",
        f"email: '{db_user.email}'"
    ]

    detail_info = "Approved: " + " | ".join(changes)
    action_type = "Approved User"

    if detail_info and changes:
        audit = AuditTrace(
            user_action=user_connection.user_name,# who did it
            action_datetime=datetime.now().replace(microsecond=0),
            action=action_type,
            ip=ip_address,
            detail_information=detail_info
        )
        db.add(audit)
    
    db_user.approved = True
    db.commit()
    return db_user

#get all users
def get_all_users(db: Session):
    return db.query(User).order_by(User.user_name).all()

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
def create_token(user_name: str, email: str, ip_address: str, user_id: int, access_token: str, expiration_date: datetime, db: Session):
    token = UserSession(
        user_id = user_id,  
        access_token = access_token,
        token_expired=expiration_date,
        ip_address=ip_address,
    )
    db.add(token)

    #------------------- AUDIT LOG ----------------------
    detail_info = None
    action_type = None
    changes = [
        f"user_name: '{user_name}'",
        f"email: '{email}'"
    ]

    detail_info = "Login: " + " | ".join(changes)
    action_type = "Login User"

    if detail_info and changes:
        audit = AuditTrace(
            user_action=user_name,# who did it
            action_datetime=datetime.now().replace(microsecond=0),
            action=action_type,
            ip=ip_address,
            detail_information=detail_info
        )
        db.add(audit)
    #-------------------End AUDIT LOG ----------------------

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
def check_token_when_logout(access_token: str, db: Session, ip_address: str) -> bool:
    try:
        session_token = db.query(UserSession).filter(UserSession.access_token == access_token).first()
        if not session_token:
            return False
        
        user_db = db.query(User).filter(User.pk_id == session_token.user_id).first()
        if not user_db:
            return False

        #------------------- AUDIT LOG ----------------------
        detail_info = None
        action_type = None
        changes = [
            f"user_name: '{user_db.user_name}'",
            f"email: '{user_db.email}'"
        ]

        detail_info = "Logout: " + " | ".join(changes)
        action_type = "Logout User"

        if detail_info and changes:
            audit = AuditTrace(
                user_action=user_db.user_name,# who did it
                action_datetime=datetime.now().replace(microsecond=0),
                action=action_type,
                ip=ip_address,
                detail_information=detail_info
            )
            db.add(audit)
        #-------------------End AUDIT LOG ----------------------
    
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
def delete_users(db: Session, data: DeleteUser, ip_address: str, current_user_id: int):

    user_connection = db.query(User).filter(User.pk_id == current_user_id).first()
    if not user_connection:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not data.ids or len(data.ids) == 0:
        raise HTTPException(status_code=400, detail="No IDs provided for deletion")
    
    users = db.query(User).filter(User.pk_id.in_(data.ids)).all()
    if not users:
        raise HTTPException(status_code=404, detail="User not found")

    
    detail_info = None
    action_type = None
        
    # Delete all users
    for user in users:

        #------------------- AUDIT LOG ----------------------
        changes = [
            f"pk_id: '{user.pk_id}'",
            f"user_name: '{user.user_name}'",
            f"email: '{user.email}'"
        ]

        detail_info = "Disabled: " + " | ".join(changes)
        action_type = "Disabled User"

        if detail_info and changes:
            audit = AuditTrace(
                user_action=user_connection.user_name,# who did it
                action_datetime=datetime.now().replace(microsecond=0),
                action=action_type,
                ip=ip_address,
                detail_information=detail_info
            )
            db.add(audit)

        user.is_active = False
    db.commit()
    return {"message": "Users deleted successfully"}

#Enable user
def enable_users(db: Session, data: DeleteUser, ip_address: str, current_user_id: int):

    user_connection = db.query(User).filter(User.pk_id == current_user_id).first()
    if not user_connection:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not data.ids or len(data.ids) == 0:
        raise HTTPException(status_code=400, detail="No IDs provided for deletion")
    
    users = db.query(User).filter(User.pk_id.in_(data.ids)).all()
    if not users:
        raise HTTPException(status_code=404, detail="User not found")

    
    detail_info = None
    action_type = None

    # Delete all users
    for user in users:

        #------------------- AUDIT LOG ----------------------
        changes = [
            f"pk_id: '{user.pk_id}'",
            f"user_name: '{user.user_name}'",
            f"email: '{user.email}'"
        ]

        detail_info = "Enabled: " + " | ".join(changes)
        action_type = "Enabled User"

        if detail_info and changes:
            audit = AuditTrace(
                user_action=user_connection.user_name,# who did it
                action_datetime=datetime.now().replace(microsecond=0),
                action=action_type,
                ip=ip_address,
                detail_information=detail_info
            )
            db.add(audit)

        user.is_active = True
    db.commit()
    return {"message": "Users enabled successfully"}

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
def update_user_profile(db: Session, user_id: int, user_data: UpdateUserProfile, ip_address: str):
    user = db.query(User).filter(User.pk_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # ----------------- AUDIT LOG -----------------
    detail_info = None
    action_type = None
    changes = []
    
    if user.user_name != user_data.user_name:
        changes.append(f"user_name: '{user.user_name}' → '{user_data.user_name}'")

    if user.gender != user_data.gender:
        changes.append(f"gender: '{user.gender if user.gender else 'NULL'}' → '{user_data.gender if user_data.gender else 'NULL'}'")

    if user.phone != user_data.phone:
        changes.append(f"phone: '{user.phone if user.phone else 'NULL'}' → '{user_data.phone if user_data.phone else 'NULL'}'")
    
    if user.date_of_birth != user_data.date_of_birth:
        changes.append(f"date_of_birth: '{user.date_of_birth if user.date_of_birth else 'NULL'}' → '{user_data.date_of_birth if user_data.date_of_birth else 'NULL'}'")

    if user.address != user_data.address:
        changes.append(f"address: '{user.address if user.address else 'NULL'}' → '{user_data.address if user_data.address else 'NULL'}'")

    
    if changes:
        detail_info = "UPDATED: " + " | ".join(changes)
        action_type = "Update User"

    if detail_info and changes:
        audit = AuditTrace(
            user_action=user.user_name,# who did it
            action_datetime=datetime.now().replace(microsecond=0),
            action=action_type,
            ip=ip_address,
            detail_information=detail_info
        )
        db.add(audit)

    # ----------------- END AUDIT LOG -----------------

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

def get_user_type_name(user_type_number: int) -> str:
    mapping = {
        int(UserType.ADMIN.value): UserTypeName.ADMIN.value,
        int(UserType.EMPLOYER.value): UserTypeName.EMPLOYER.value,
        int(UserType.CANDIDATE.value): UserTypeName.CANDIDATE.value,
    }
    return mapping.get(user_type_number, "Unknown")

def create_or_update_user_admin(user: UserCreate, db: Session, ip_address: str, current_user_id: int):
    user_connection = db.query(User).filter(User.pk_id == current_user_id).first()
    if not user_connection:
        raise HTTPException(status_code=404, detail="User not found")

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
        
        # ----------------- AUDIT LOG -----------------
        detail_info = None
        action_type = None

        changes = []

        if db_user.user_name != user.user_name:
            changes.append(f"user_name: '{db_user.user_name}' → '{user.user_name}'")

        if db_user.email != user.email:
            changes.append(f"email: '{db_user.email}' → '{user.email}'")

        if db_user.gender != user.gender:
            changes.append(f"gender: '{db_user.gender if db_user.gender else 'NULL'}' → '{user.gender if user.gender else 'NULL'}'")

        if db_user.phone != user.phone:
            changes.append(f"phone: '{db_user.phone if db_user.phone else 'NULL'}' → '{user.phone if user.phone else 'NULL'}'")
        
        if db_user.date_of_birth != user.date_of_birth:
            changes.append(f"date_of_birth: '{db_user.date_of_birth if db_user.date_of_birth else 'NULL'}' → '{user.date_of_birth if user.date_of_birth else 'NULL'}'")

        if db_user.address != user.address:
            changes.append(f"address: '{db_user.address if db_user.address else 'NULL'}' → '{user.address if user.address else 'NULL'}'")

        if db_user.user_type != user.user_type:
            old_type = get_user_type_name(db_user.user_type)
            new_type = get_user_type_name(user.user_type)

            changes.append(f"user_type: '{old_type}' → '{new_type}'")
            

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
        
        if changes:
            detail_info = "UPDATED: " + " | ".join(changes)
            action_type = "Update User"

        if detail_info and changes:
            audit = AuditTrace(
                user_action=user_connection.user_name,# who did it
                action_datetime=datetime.now().replace(microsecond=0),
                action=action_type,
                ip=ip_address,
                detail_information=detail_info
            )
            db.add(audit)

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

    #----------------Create new user----------------#

    # Get password condition in global settings
    settings = get_password_settings(db)
    min_len = settings["MINIMUM_NUMBER_OF_CHARACTERS_IN_PASSWORD"]  # int
    max_len = settings["MAXIMUM_NUMBER_OF_CHARACTERS_IN_PASSWORD"]  # int
    special_chars = settings["PASSWORD_SET_LIST_SPECIAL_CHARACTERS"] # str
    require_number = settings["AT_LEAST_ONE_NUMBER_REQUIRED_IN_PASSWORD"]       # bool
    require_upper = settings["AT_LEAST_ONE_UPPERCASE_CHARACTER_REQUIRED_IN_PASSWORD"]  # bool
    require_lower = settings["AT_LEAST_ONE_LOWERCASE_CHARACTER_REQUIRED_IN_PASSWORD"]  # bool

    passwords = user.password

    # Only validate if setting is not empty
    if min_len is not None and len(passwords) < min_len:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "PASSWORD_MUST_BE_AT_LEAST_X_CHARACTERS",
                "message": f"Password must be at least {min_len} characters"
            }
        )
    
    if max_len is not None and len(passwords) > max_len:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "PASSWORD_MUST_BE_AT_MOST_X_CHARACTERS",
                "message": f"Password must be at most {max_len} characters"
            }
        )
    
    if special_chars and not any(char in special_chars for char in passwords):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "PASSWORD_MUST_CONTAIN_AT_LEAST_ONE_OF_THE_FOLLOWING_SPECIAL_CHARACTERS",
                "message": f"Password must contain at least one of the following special characters: {special_chars}"
            }
        )
    
    if require_number and not any(char.isdigit() for char in passwords):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "PASSWORD_MUST_CONTAIN_AT_LEAST_ONE_NUMBER",
                "message": f"Password must contain at least one number"
            }
        )

    if require_upper and not any(char.isupper() for char in passwords):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "PASSWORD_MUST_CONTAIN_AT_LEAST_ONE_UPPERCASE_LETTER",
                "message": f"Password must contain at least one uppercase letter"
            }
        )

    if require_lower and not any(char.islower() for char in passwords):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "PASSWORD_MUST_CONTAIN_AT_LEAST_ONE_LOWERCASE_LETTER",
                "message": f"Password must contain at least one lowercase letter"
            }
        )
    

    exist_email = db.query(User).filter(User.email == user.email).first()
    if exist_email:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "EMAIL_EXISTS",
                "message": "Email already exists"
            }
        )

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

    # ----------------- AUDIT LOG -----------------
    detail_info = None
    action_type = None

    changes = [
        f"user_name: {user.user_name}",
        f"email: {user.email}",
    ]

    # Optional fields
    optional_fields = {
        "gender": user.gender,
        "phone": user.phone,
        "date_of_birth": user.date_of_birth,
        "address": user.address,
    }

    for key, value in optional_fields.items():
        if value:  # skips None, "", etc.
            changes.append(f"{key}: {value}")

    if db_user.user_type == int(UserType.ADMIN.value):
        changes.append(f"user_type: '{UserTypeName.ADMIN.value}'")
    elif db_user.user_type == int(UserType.EMPLOYER.value):
        changes.append(f"user_type: '{UserTypeName.EMPLOYER.value}'")
    elif db_user.user_type == int(UserType.CANDIDATE.value):
        changes.append(f"user_type: '{UserTypeName.CANDIDATE.value}'")

    detail_info = "CREATED: " + " | ".join(changes)
    action_type = "Create User"

    if detail_info and changes:
        audit = AuditTrace(
            user_action=user_connection.user_name,# who did it
            action_datetime=datetime.now().replace(microsecond=0),
            action=action_type,
            ip=ip_address,
            detail_information=detail_info
        )
        db.add(audit)
    #--------------------End Audit Log----------------------

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

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}

def upload_profile(
    db: Session,
    file: UploadFile,
    current_user_id: int
):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type")

    user = db.query(User).filter(User.pk_id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    upload_dir = "uploads/user/profile"
    os.makedirs(upload_dir, exist_ok=True)

    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(upload_dir, filename)

    if user.profile_image:
        old_path = os.path.join(upload_dir, user.profile_image)
        if os.path.exists(old_path):
            os.remove(old_path)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    user.profile_image = filename
    db.commit()
    db.refresh(user)

    return {
        "message": "Profile image uploaded successfully",
        "profile_image": f"{filename}"
    }
    
def delete_user_profile(db: Session, current_user_id: int):
    upload_dir = "uploads/user/profile"

    user = db.query(User).filter(User.pk_id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Authentication failed")
    
    if not user.profile_image:
        raise HTTPException(status_code=400, detail="No profile image to delete")
    
    file_path = os.path.join(upload_dir, user.profile_image)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    user.profile_image = None
    db.commit()
    db.refresh(user)
    
    return {"detail": "User profile image deleted successfully"}