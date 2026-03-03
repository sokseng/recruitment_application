import os
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from app.models.employer_model import Employer
from app.schemas.employer_schema import EmployerCreate, EmployerUpdate, UserProfileEmployer, UserUpdateProfile
from shutil import copyfileobj
from app.models.user_model import User
from datetime import datetime
from app.models.audit_trace_model import AuditTrace
from sqlalchemy import func
from app.models.job_model import Job
from app.models.category_model import Category

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
            Employer.company_address,
            Employer.company_description,
            Employer.company_website,
            Employer.is_active,
            Employer.created_date,
            func.count(Job.pk_id).label("job_count"),
            User.approved.label("approved"),
            User.is_active.label("is_active"),
            User.pk_id.label("user_id"),
        )
        .outerjoin(Job, Job.employer_id == Employer.pk_id)
        .join(User, Employer.user_id == User.pk_id)
        .group_by(
            Employer.pk_id,
            Employer.company_name,
            Employer.company_logo,
            Employer.company_email,
            Employer.company_contact,
            Employer.company_address,
            Employer.company_description,
            Employer.company_website,
            Employer.created_date,
            User.approved,
            User.is_active,
            User.pk_id
        )
        .order_by(Employer.created_date.desc())
        .all()
    )

    result = []
    for r in rows:
        # Fetch categories for this employer
        employer_obj = db.query(Employer).filter(Employer.pk_id == r.pk_id).first()
        categories = [
            {"id": c.pk_id, "name": c.name}
            for c in employer_obj.categories
        ]

        if r.approved is False:
            status = "Pending"
        else:
            status = "Approved"

        result.append({
            "pk_id": r.pk_id,
            "company_name": r.company_name,
            "company_logo": r.company_logo,
            "company_email": r.company_email,
            "company_contact": r.company_contact,
            "company_address": r.company_address,
            "company_description": r.company_description,
            "company_website": r.company_website,
            "created_date": r.created_date,
            "job_count": r.job_count,
            "categories": categories,  # <-- added categories
            "status": status,
            "user_id": r.user_id
        })

    return result


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
    
    category_ids = [c.pk_id for c in db_employer.categories]

    return {
        "company_contact": db_employer.company_contact,
        "company_name": db_employer.company_name,
        "company_email": db_employer.company_email,
        "company_address": db_employer.company_address,
        "company_description": db_employer.company_description,
        "company_website": db_employer.company_website,
        "company_logo": db_employer.company_logo,
        "user_name": db_user.user_name,
        "profile_image": db_user.profile_image,
        "email": db_user.email,
        "gender": db_user.gender,
        "phone": db_user.phone,
        "date_of_birth": db_user.date_of_birth,
        "address": db_user.address,

        "categories": [
            {"id": c.pk_id, "name": c.name}
            for c in db_employer.categories
        ],
    }


def update_profile_employer(
    db: Session,
    user_data: UserUpdateProfile,
    employer_data: UserProfileEmployer,
    logo_file: UploadFile = None,
    remove_logo: bool = False,
    category_ids: list[int] | None = None,
    user_id: int = None,
    ip_address: str = None
):
    db_user = db.query(User).filter(User.pk_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    #------------------- AUDIT LOG ----------------------
    detail_info = None
    action_type = None
    changes = []
    
    if db_user.user_name != user_data.user_name:
        changes.append(f"user_name: '{db_user.user_name}' → '{user_data.user_name}'")

    if db_user.gender != user_data.gender:
        changes.append(f"gender: '{db_user.gender if db_user.gender else 'NULL'}' → '{user_data.gender if user_data.gender else 'NULL'}'")

    if db_user.phone != user_data.phone:
        changes.append(f"phone: '{db_user.phone if db_user.phone else 'NULL'}' → '{user_data.phone if user_data.phone else 'NULL'}'")
    
    if db_user.date_of_birth != user_data.date_of_birth:
        changes.append(f"date_of_birth: '{db_user.date_of_birth if db_user.date_of_birth else 'NULL'}' → '{user_data.date_of_birth if user_data.date_of_birth else 'NULL'}'")

    if db_user.address != user_data.address:
        changes.append(f"address: '{db_user.address if db_user.address else 'NULL'}' → '{user_data.address if user_data.address else 'NULL'}'")

    
    if changes:
        detail_info = "UPDATED: " + " | ".join(changes)
        action_type = "Update User"

    if detail_info and changes:
        audit = AuditTrace(
            user_action=db_user.user_name,# who did it
            action_datetime=datetime.now().replace(microsecond=0),
            action=action_type,
            ip=ip_address,
            detail_information=detail_info
        )
        db.add(audit)

    db_user.user_name = user_data.user_name
    db_user.gender = user_data.gender
    db_user.phone = user_data.phone
    db_user.date_of_birth = user_data.date_of_birth
    db_user.address = user_data.address


    db_employer = db.query(Employer).filter(
        Employer.user_id == db_user.pk_id
    ).first()

    if not db_employer:
        raise HTTPException(status_code=404, detail="Employer profile not found")


    detail_info_emp = None
    action_type_emp = None
    changes_emp = []

    if db_employer.company_name != employer_data.company_name:
        changes_emp.append(f"company_name: '{db_employer.company_name}' → '{employer_data.company_name}'")

    if db_employer.company_email != employer_data.company_email:
        changes_emp.append(f"company_email: '{db_employer.company_email}' → '{employer_data.company_email}'")

    if db_employer.company_contact != employer_data.company_contact:
        changes_emp.append(f"company_contact: '{db_employer.company_contact if db_employer.company_contact else 'NULL'}' → '{employer_data.company_contact if employer_data.company_contact else 'NULL'}'")

    if db_employer.company_address != employer_data.company_address:
        changes_emp.append(f"company_address: '{db_employer.company_address if db_employer.company_address else 'NULL'}' → '{employer_data.company_address if employer_data.company_address else 'NULL'}'")

    if db_employer.company_description != employer_data.company_description:
        changes_emp.append(f"company_description: '{db_employer.company_description if db_employer.company_description else 'NULL'}' → '{employer_data.company_description if employer_data.company_description else 'NULL'}'")

    if db_employer.company_website != employer_data.company_website:
        changes_emp.append(f"company_website: '{db_employer.company_website if db_employer.company_website else 'NULL'}' → '{employer_data.company_website if employer_data.company_website else 'NULL'}'")

    if changes_emp:
        detail_info_emp = "UPDATED: " + " | ".join(changes_emp)
        action_type_emp = "Update Employer"

    if detail_info_emp and changes_emp:
        audit = AuditTrace(
            user_action=db_user.user_name,# who did it
            action_datetime=datetime.now().replace(microsecond=0),
            action=action_type_emp,
            ip=ip_address,
            detail_information=detail_info_emp
        )
        db.add(audit)

    db_employer.company_contact = employer_data.company_contact
    db_employer.company_name = employer_data.company_name
    db_employer.company_email = employer_data.company_email
    db_employer.company_address = employer_data.company_address
    db_employer.company_description = employer_data.company_description
    db_employer.company_website = employer_data.company_website

    if category_ids is not None:
        categories = db.query(Category).filter(Category.pk_id.in_(category_ids)).all()
        db_employer.categories = categories

    if remove_logo and db_employer.company_logo:
        old_path = os.path.join(UPLOAD_DIR, db_employer.company_logo)

        if os.path.exists(old_path):
            os.remove(old_path)

        db_employer.company_logo = None


    elif logo_file:
        if db_employer.company_logo:
            old_path = os.path.join(UPLOAD_DIR, db_employer.company_logo)
            if os.path.exists(old_path):
                os.remove(old_path)

        logo_filename = f"{user_id}_{logo_file.filename}"
        file_path = os.path.join(UPLOAD_DIR, logo_filename)

        with open(file_path, "wb") as f:
            copyfileobj(logo_file.file, f)

        db_employer.company_logo = logo_filename

    db.commit()
    db.refresh(db_employer)
    
    
    return db_user

def delete_company_logo(db: Session, current_user_id: int):
    db_employer = db.query(Employer).filter(Employer.user_id == current_user_id).first()
    if not db_employer:
        raise HTTPException(status_code=404, detail="Employer profile not found")
    
    if not db_employer.company_logo:
        raise HTTPException(status_code=400, detail="No logo to delete")
    
    logo_path = os.path.join(UPLOAD_DIR, db_employer.company_logo)
    if os.path.exists(logo_path):
        os.remove(logo_path)
    
    db_employer.company_logo = None
    db.commit()
    db.refresh(db_employer)
    
    return {"detail": "Company logo deleted successfully"}