from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

class EmployerCreate(BaseModel):
    pk_id: Optional[int]
    user_id: int
    company_name: str
    company_email: Optional[EmailStr] = None
    company_logo: Optional[str] = None
    company_contact: Optional[str] = None
    company_address: Optional[str] = None
    company_description: Optional[str] = None
    company_website: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

