from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.auth import verify_access_token

from app.database.deps import get_db
from app.schemas.employer_schema import EmployerCreate, EmployerUpdate, EmployerOut, UserProfileEmployer
from app.controllers.employer_controller import create_employer, get_employer, get_employers, update_employer, delete_employer, get_employer_profiles

router = APIRouter(prefix="/employer", tags=["Employers"])

@router.post("/", response_model=EmployerOut)
def api_create_employer(
    company_name: str = Form(...),
    company_email: Optional[str] = Form(None),
    company_contact: Optional[str] = Form(None),
    company_address: Optional[str] = Form(None),
    company_description: Optional[str] = Form(None),
    company_website: Optional[str] = Form(None),
    company_logo: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    employer_data = EmployerCreate(
        user_id=current_user_id,
        company_name=company_name,
        company_email=company_email,
        company_contact=company_contact,
        company_address=company_address,
        company_description=company_description,
        company_website=company_website,
    )
    return create_employer(db, employer_data, company_logo)

@router.get("/", response_model=List[EmployerOut])
def api_get_employers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    return get_employers(db, skip, limit)

@router.get("/{employer_id}", response_model=EmployerOut)
def api_get_employer(employer_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    db_employer = get_employer(db, employer_id)
    if not db_employer:
        raise HTTPException(status_code=404, detail="Employer not found")
    return db_employer

@router.put("/{employer_id}", response_model=EmployerOut)
def api_update_employer(
    employer_id: int,
    company_name: str = Form(...),
    company_email: Optional[str] = Form(None),
    company_contact: Optional[str] = Form(None),
    company_address: Optional[str] = Form(None),
    company_description: Optional[str] = Form(None),
    company_website: Optional[str] = Form(None),
    company_logo: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token),
):
    employer = EmployerUpdate(
        company_name=company_name,
        company_email=company_email,
        company_contact=company_contact,
        company_address=company_address,
        company_description=company_description,
        company_website=company_website,
    )
    db_employer = update_employer(db, employer_id, employer, company_logo)
    if not db_employer:
        raise HTTPException(status_code=404, detail="Employer not found")
    return db_employer

@router.delete("/{employer_id}", response_model=EmployerOut)
def api_delete_employer(employer_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    db_employer = delete_employer(db, employer_id)
    if not db_employer:
        raise HTTPException(status_code=404, detail="Employer not found")
    return db_employer


#get user profile employer by id
@router.get("/profile", response_model=UserProfileEmployer)
def get_employer_profile(db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    try:
        db_employer = get_employer_profiles(db, current_user_id)
    
        if not db_employer:
            raise HTTPException(status_code=404, detail="Employer not found")
        return db_employer
    except Exception as e:
        raise HTTPException(status_code=404, detail="Employer not found")
    
    
