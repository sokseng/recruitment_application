from pydantic import BaseModel, ConfigDict
from datetime import datetime

class AuditTraceBase(BaseModel):
    user_action: str
    action: str
    ip: str
    detail_information: str

class AuditTraceCreate(AuditTraceBase):
    action_datetime: datetime

class AuditTraceRead(AuditTraceBase):
    pk_id: int
    action_datetime: str
    model_config = ConfigDict(from_attributes=True)

