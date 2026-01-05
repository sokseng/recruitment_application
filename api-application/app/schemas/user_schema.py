
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from typing import Optional

# ===== UserRole =====
class UserRoleBase(BaseModel):
    name: str
    description: Optional[str]

class UserRoleCreate(UserRoleBase):
    pass

class UserRoleResponse(UserRoleBase):
    pk_id: int
    model_config = ConfigDict(from_attributes=True)

# ===== UserRight =====
class UserRightBase(BaseModel):
    name: str
    description: Optional[str]
    rights: Dict[str, Any]  # JSONB field as dict

class UserRightCreate(UserRightBase):
    pk_id: Optional[int] = None

class DeleteUserRight(BaseModel):
    ids: List[int]
    
class UserRightResponse(UserRightBase):
    pk_id: int
    model_config = ConfigDict(from_attributes=True)

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
class UserBase(BaseModel):
    email: str

class UserLogin(UserBase):
    password: str
    access_token: Optional[str]

class UserCreate(BaseModel):
    pk_id: Optional[int] = None
    name: str
    email: str
    password: str
    role_id: Optional[int] = 0
    right_id: Optional[int] = 0

class UserResponseData(BaseModel):
    pk_id: int
    name: str
    email: str
    role_id: Optional[int]
    role_name: Optional[str]
    right_id: Optional[int]
    user_right: Optional[str]
    status: bool
    
class UserResponse(UserBase):
    pk_id: int
    role_id: Optional[int]
    right_id: Optional[int]
    model_config = ConfigDict(from_attributes=True)

class AccessToken(BaseModel):
    access_token: str
    rights: Optional[Dict] = None


class DeleteUser(BaseModel):
    ids: List[int]
    