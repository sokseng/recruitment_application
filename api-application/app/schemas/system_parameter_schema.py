
from pydantic import BaseModel, ConfigDict
from typing import  List, Any

class SystemParameterBase(BaseModel):
    code: str
    name: str
    value: str
    type: str

class SystemParameterCreate(BaseModel):
    pk_id: int
    name: str
    value: Any
    type: str

class SystemParameterUpdate(BaseModel):
    changedRows: List[SystemParameterCreate]

class SystemParameterRead(BaseModel):
    pk_id: int
    name: str
    value: str
    type: str
    model_config = ConfigDict(from_attributes=True)