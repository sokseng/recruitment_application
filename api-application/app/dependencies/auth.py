
from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.utils.token import verify_token
from app.database.session import SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_token_from_header(authorization: str | None = Header(None)) -> str:
    if authorization is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Expected: Bearer <token>"
        )
    return token

def verify_access_token(token: str = Depends(get_token_from_header), db: Session = Depends(get_db)) -> int:
    return verify_token(token, db)
