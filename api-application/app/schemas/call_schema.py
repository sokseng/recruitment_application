from pydantic import BaseModel

class TokenReq(BaseModel):
    user_id: int
    room_name: str