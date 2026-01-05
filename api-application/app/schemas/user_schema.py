
from pydantic import BaseModel

# ===== User =====

class UserLogin(BaseModel):
    password: str
    email: str

class AccessToken(BaseModel):
    access_token: str

    