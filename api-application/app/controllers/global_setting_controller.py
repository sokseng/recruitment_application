
from sqlalchemy.orm import Session
from app.models.global_setting_model import GlobalSetting
from app.schemas.system_parameter_schema import SystemParameterUpdate
from passlib.context import CryptContext
from app.config.settings import settings  # secret + algorithm from env/config
from fastapi import HTTPException


SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated = 'auto')

def get_all_global_setting(db: Session):
    return db.query(GlobalSetting).all()


#update system parameter
def update_system_parameter(db: Session, data: SystemParameterUpdate):
    for item in data.changedRows:
        db.query(GlobalSetting).filter(GlobalSetting.pk_id == item.pk_id).update({GlobalSetting.value: str(item.value)}, synchronize_session=False)
    db.commit()
    return True