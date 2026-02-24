from sqlalchemy.orm import Session
from app.models.audit_trace_model import AuditTrace
from passlib.context import CryptContext
from app.config.settings import settings  # secret + algorithm from env/config


SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated = 'auto')


#get all audit trace
def get_all_audit_trace(db: Session):
    audit = db.query(AuditTrace).order_by(AuditTrace.action_datetime.desc()).all()
    return [
        {
            "pk_id": audit.pk_id,
            "user_action": audit.user_action,
            "action_datetime": audit.action_datetime.strftime("%Y-%m-%d %H:%M:%S"),
            "action": audit.action,
            "ip": audit.ip,
            "detail_information": audit.detail_information
        } for audit in audit
    ]