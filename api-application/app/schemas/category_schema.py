from typing import Optional
from pydantic import BaseModel, ConfigDict


class CategoryOut(BaseModel):
    pk_id: int
    name: Optional[str]

    model_config = ConfigDict(from_attributes=True)