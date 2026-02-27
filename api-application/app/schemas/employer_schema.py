from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date

class EmployerCreate(BaseModel):
    user_id: int
    company_name: str
    company_email: Optional[str] = None
    company_contact: Optional[str] = None
    company_address: Optional[str] = None
    company_description: Optional[str] = None
    company_website: Optional[str] = None

class EmployerUpdate(BaseModel):
    company_name: Optional[str] = None
    company_email: Optional[str] = None
    company_contact: Optional[str] = None
    company_address: Optional[str] = None
    company_description: Optional[str] = None
    company_website: Optional[str] = None
    is_active: Optional[bool] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    
class EmployerOut(BaseModel):
    pk_id: int
    company_name: str
    company_logo: Optional[str] = None
    company_email: Optional[str] = None
    company_contact: Optional[str] = None
    company_address: Optional[str] = None
    company_description: Optional[str] = None
    company_website: Optional[str] = None
    company_description: Optional[str] = None
    status: str
    created_date: datetime
    job_count: int
    categories: list[CategoryOut] = []
    user_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)



class UserProfileEmployer(BaseModel):
    user_name: Optional[str] = None
    profile_image:  Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    company_name: Optional[str] = None
    company_email: Optional[str] = None
    company_contact: Optional[str] = None
    company_address: Optional[str] = None
    company_description: Optional[str] = None
    company_website: Optional[str] = None
    company_logo: Optional[str] = None
    categories: list[CategoryOut] = []

    model_config = ConfigDict(from_attributes=True)

class UserUpdateProfile(BaseModel):
    user_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None

