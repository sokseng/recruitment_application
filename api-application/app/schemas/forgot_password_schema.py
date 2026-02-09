from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date


class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyCodeRequest(ForgotPasswordRequest):
    code: str

class ResetPasswordRequest(ForgotPasswordRequest):
    new_password: str

    model_config = ConfigDict(from_attributes=True)