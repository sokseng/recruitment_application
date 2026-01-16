
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from typing import Optional


# ===== UserSession =====
class UserSessionBase(BaseModel):
    access_token: str
    token_expired: datetime
    session_creation_date: datetime
    

class UserSessionCreate(UserSessionBase):
    user_id: int

class UserSessionResponse(UserSessionBase):
    pk_id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)

# ===== User =====
class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    pk_id: Optional[int] = None
    user_name: str
    email: str
    password: str
    user_type: int
    gender: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None

    model_config = ConfigDict(exclude_none=False)

class UpdateUserProfile(BaseModel):
    pk_id: Optional[int] = None
    user_name: str
    email: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None

    model_config = ConfigDict(exclude_none=False)

class UserResponse(BaseModel):
    pk_id: int
    user_name: str
    email: str
    user_type: int
    gender: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    is_active: bool
    created_date: datetime
    updated_date: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

class UserResponseData(BaseModel):
    pk_id: int
    user_name: str
    email: str
    model_config = ConfigDict(from_attributes=True)

class AccessToken(BaseModel):
    access_token: str
    user_type: int
    pk_id: int
    user_name: str
    email: str
    address: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    user_data: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class DeleteUser(BaseModel):
    ids: List[int]

class SelectClinic(BaseModel):
    access_token: str
    clinic_id: int


class ChangePassword(BaseModel):
    old_password: str
    new_password: str


class ResponseUserProfile(BaseModel):
    pk_id: int
    user_name: str
    email: str
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None

class UpdateHospital(BaseModel):
    id: int
    code: str
    clinic_type_id: int
    name: str
    address: str
    phone: str
    email: str
    opening_hours: str
    description: Optional[str] = None


class UpdateProfile(BaseModel):
    id: int
    user_name: str
    email: str
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    
    