import os
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from app.models.employer_model import Employer
from app.schemas.employer_schema import EmployerCreate, EmployerUpdate, UserProfileEmployer, UserUpdateProfile
from shutil import copyfileobj
from app.models.user_model import User
from sqlalchemy import func
from app.models.job_model import Job

UPLOAD_DIR = "uploads/employers"  # folder to store logos
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_employer(db: Session, employer_id: int):
    return db.query(Employer).filter(Employer.pk_id == employer_id).first()

def get_employers(db: Session):
    rows = (
        db.query(
            Employer.pk_id,
            Employer.company_name,
            Employer.company_logo,
            Employer.company_email,
            Employer.company_contact,
            Employer.is_active,
            Employer.created_date,
            func.count(Job.pk_id).label("job_count"),
        )
        .outerjoin(Job, Job.employer_id == Employer.pk_id)
        .group_by(Employer.pk_id)
        .order_by(Employer.created_date.desc())
        .all()
    )

    return [
        {
            "pk_id": r.pk_id,
            "company_name": r.company_name,
            "company_logo": r.company_logo,
            "company_email": r.company_email,
            "company_contact": r.company_contact,
            "is_active": r.is_active,
            "created_date": r.created_date,
            "job_count": r.job_count,
        }
        for r in rows
    ]

def create_employer(db: Session, employer: EmployerCreate, logo_file: UploadFile = None):
    logo_filename = None
    if logo_file:
        # save file
        logo_filename = logo_file.filename
        file_path = os.path.join(UPLOAD_DIR, logo_filename)
        with open(file_path, "wb") as f:
            copyfileobj(logo_file.file, f)

    db_employer = Employer(
        user_id=employer.user_id,
        company_name=employer.company_name,
        company_email=employer.company_email,
        company_contact=employer.company_contact,
        company_address=employer.company_address,
        company_description=employer.company_description,
        company_website=employer.company_website,
        company_logo=logo_filename,
    )
    db.add(db_employer)
    db.commit()
    db.refresh(db_employer)
    return db_employer

def update_employer(db: Session, employer_id: int, employer: EmployerUpdate, logo_file: UploadFile = None):
    db_employer = get_employer(db, employer_id)
    if not db_employer:
        return None

    #apply updates
    for key, value in employer.model_dump(exclude_unset=True).items():
        setattr(db_employer, key, value)

    #handle logo update
    if logo_file:
        logo_filename = logo_file.filename
        file_path = os.path.join(UPLOAD_DIR, logo_filename)
        with open(file_path, "wb") as f:
            copyfileobj(logo_file.file, f)
        db_employer.company_logo = logo_filename

    #commit & return
    db.commit()
    db.refresh(db_employer)
    return db_employer


def delete_employer(db: Session, employer_id: int):
    db_employer = get_employer(db, employer_id)
    if not db_employer:
        return None
    db_employer.is_active = False
    db.commit()
    return db_employer


#get user profile employer
def get_employer_profiles(db: Session, user_id: int):
    db_user = db.query(User).filter(User.pk_id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    db_employer = db.query(Employer).filter(Employer.user_id == user_id).first()
    if not db_employer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employer profile not found"
        )

    return {
        "company_contact": db_employer.company_contact,
        "company_name": db_employer.company_name,
        "company_email": db_employer.company_email,
        "company_address": db_employer.company_address,
        "company_description": db_employer.company_description,
        "company_website": db_employer.company_website,
        "company_logo": db_employer.company_logo,
        "user_name": db_user.user_name,
        "email": db_user.email,
        "gender": db_user.gender,
        "phone": db_user.phone,
        "date_of_birth": db_user.date_of_birth,
        "address": db_user.address
    }


def update_profile_employer(db: Session, user_data: UserUpdateProfile, employer_data: UserProfileEmployer, logo_file: UploadFile = None, user_id: int = None):
    db_user = db.query(User).filter(User.pk_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="User not found")
    if db_user:
        db_user.user_name = user_data.user_name
        db_user.gender = user_data.gender
        db_user.phone = user_data.phone
        db_user.date_of_birth = user_data.date_of_birth
        db_user.address = user_data.address

        db.commit()

    db_employer = db.query(Employer).filter(Employer.user_id == db_user.pk_id).first()
    if not db_employer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employer profile not found")
    if db_employer:
    
        logo_filename = None

        if logo_file:
            logo_filename = logo_file.filename
            file_path = os.path.join(UPLOAD_DIR, logo_filename)
            with open(file_path, "wb") as f:
                copyfileobj(logo_file.file, f)
            db_employer.company_logo = logo_filename

        db_employer.company_contact = employer_data.company_contact
        db_employer.company_name = employer_data.company_name
        db_employer.company_email = employer_data.company_email
        db_employer.company_address = employer_data.company_address
        db_employer.company_description = employer_data.company_description
        db_employer.company_website = employer_data.company_website
        db_employer.company_logo = logo_filename
        db.commit()
        return db_employer
