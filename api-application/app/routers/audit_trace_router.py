from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.schemas.audit_trace_schema import AuditTraceRead
from app.controllers import audit_trace_controller
from app.database.session import SessionLocal
from passlib.context import CryptContext
from app.dependencies.auth import verify_access_token
from app.database.deps import get_db


router = APIRouter(prefix="/audit-trace", tags=["Audit Trace"])
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated = 'auto')


#get all Audit Trace
@router.get("/", response_model=list[AuditTraceRead])
def get_all_audit_trace(db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    # Now the token is verified, and you can access current_user_id
    return audit_trace_controller.get_all_audit_trace(db)