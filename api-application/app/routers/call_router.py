import os
from fastapi import HTTPException, APIRouter
from livekit.api.access_token import AccessToken, VideoGrants
from app.schemas.call_schema import TokenReq
from app.config.settings import settings

router = APIRouter(prefix="/call", tags=["Chat room call"])

@router.post("/token")
def call_token(req: TokenReq):
    if not (settings.LIVEKIT_API_KEY and settings.LIVEKIT_API_SECRET and settings.LIVEKIT_URL):
        raise HTTPException(500, "LiveKit credentials not set")

    token = (
        AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
        .with_identity(str(req.user_id))
        .with_grants(
            VideoGrants(
                room_join=True,
                room=req.room_name
            )
        )
        .to_jwt()
    )

    return {"token": token, "url": settings.LIVEKIT_URL}
