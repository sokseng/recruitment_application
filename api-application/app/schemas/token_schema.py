
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class TokenBase(BaseModel):
    user_id: int
    user_name: str
    access_token: str
    refresh_token: str
    expiration_date: datetime

class TokenLogout(BaseModel):
    token: str

class Token(TokenBase):
    user_id: int
    model_config = ConfigDict(from_attributes=True)