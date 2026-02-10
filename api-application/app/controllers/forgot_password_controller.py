from sqlalchemy.orm import Session
from app.models.user_model import User
from app.models.forgot_password_model import ForgotPassword
from app.schemas.forgot_password_schema import ForgotPasswordRequest, VerifyCodeRequest, ResetPasswordRequest
from app.config.settings import settings
from datetime import date
from sqlalchemy import func
from app.models.email_log_model import EmailLog

from fastapi import HTTPException
from datetime import datetime, timedelta
import random, smtplib
from email.mime.text import MIMEText
from passlib.context import CryptContext

SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated = 'auto')

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "sokseng3997@gmail.com"
SMTP_PASS = "vfyh yrud ubnc vtjs"  # App password (not Gmail login password)

MAX_EMAIL_PER_DAY = 2

def send_email(to_email: str, code: str):
    subject = "Your Password Reset Code"
    body = f"Your 6-digit verification code is: {code}\nThis code will expire in 10 minutes."

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = SMTP_USER
    msg["To"] = to_email

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email send failed: {str(e)}")

def generate_code():
    return str(random.randint(100000, 999999))

def get_total_emails_sent_today(db: Session) -> int:
    today = date.today()

    return (
        db.query(func.count(EmailLog.pk_id))
        .filter(EmailLog.date_sent == today)
        .scalar()
    )

def save_email_log(db: Session, email: str):
    log = EmailLog(to_email=email)
    db.add(log)
    db.commit()


# forgot password
def forgot_password(db: Session, data: ForgotPasswordRequest):
    # Check user in DB
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    #GLOBAL daily limit
    total_sent_today = get_total_emails_sent_today(db)

    if total_sent_today >= MAX_EMAIL_PER_DAY:
        raise HTTPException(
            status_code=429,
            detail="System email limit reached for today. Please try again tomorrow."
        )
    
    # Generate code and expiration
    code = generate_code()
    now = datetime.now().replace(microsecond=0)
    expires = now + timedelta(minutes=10)


    # Send email
    send_email(data.email, code)

    # Save to DB
    save_forgot_password(db, data.email, code, expires)
    save_email_log(db, data.email)

    return {"message": "Verification code sent"}

# verify code example
def verify_code(db: Session, data: VerifyCodeRequest):
    if not data.code or not data.email:
        raise HTTPException(status_code=400, detail="code and email not provided")
    
    records = db.query(ForgotPassword).filter(
            ForgotPassword.email == data.email,
            ForgotPassword.code == data.code
        ).first()
    
    if not records:
        raise HTTPException(status_code=400, detail="Invalid email or code")
    
    now = datetime.now().replace(microsecond=0)
    if now > records.expired:
        raise HTTPException(status_code=400, detail="Code has expired")
   
    return True

#save forgot password to db
def save_forgot_password(db: Session, email: str, code: str, expires: datetime):
    forgot_password = ForgotPassword(email=email, code=code, expired=expires)
    db.add(forgot_password)
    db.commit()
    return {"message": "Password saved successfully"}

#reset password
def reset_password(db: Session, data: ResetPasswordRequest):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    
    user.password =  bcrypt_context.hash(data.new_password)
    db.commit()
    return True
