
from fastapi import APIRouter, Depends, Request, HTTPException, Body, Header, File, UploadFile
from sqlalchemy.orm import Session
from app.schemas.user_schema import JobOut
from app.schemas.user_schema import UserCreate, DeleteUser, AccessToken, UserLogin, UserResponse, ChangePassword, ResponseSingleUserProfile, UpdateUserProfile
from app.controllers import user_controller
from typing import List
from passlib.context import CryptContext
from datetime import timedelta, datetime
from app.dependencies.auth import verify_access_token
from app.database.deps import get_db
from app.models.global_setting_model import GlobalSetting


router = APIRouter(prefix="/user", tags=["Users"])
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated = 'auto')


# user login for get token
@router.post("/login", response_model=AccessToken)
def create_login(request: Request,data: UserLogin, db: Session = Depends(get_db)):
    access_token_expires = timedelta(days=30)
    now = datetime.now().replace(microsecond=0)

    #Get user
    user = user_controller.get_by_email(data.email, db)
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User is currently disabled!")

    #Verify password
    isMatch = user_controller.verify_password(data.password, user.password)

    setting = (
        db.query(GlobalSetting)
        .filter(GlobalSetting.code == "PASSWORD_MAX_LOGIN_TRY")
        .first()
    )

    max_login_try = (
        int(setting.value)
        if setting and setting.value not in (None, "")
        else None
    )
    
    # WRONG PASSWORD
    if not isMatch:
        user.wrong_password += 1
        db.commit()

        #TOO MANY FAILED ATTEMPTS → robot check
        if max_login_try is not None and user.wrong_password >= max_login_try:
            raise HTTPException(
                status_code=429,
                detail="Too many failed attempts. Please verify you are not a robot."
            )

        raise HTTPException(
            status_code=400,
            detail="Invalid password"
        )

    #CORRECT PASSWORD → RESET COUNTER
    user.wrong_password = 0
    db.commit()

    
    #create access token
    access_token = user_controller.create_access_token(user.pk_id, expires_delta=access_token_expires)
    
    ip_address = request.client.host

    # Save token into database
    user_controller.create_token(
        user_name=user.user_name,
        email=user.email,
        ip_address=ip_address,
        user_id=user.pk_id,
        access_token=access_token,
        expiration_date=(now + access_token_expires).strftime("%Y-%m-%d %H:%M:%S"),
        db=db
    )

    return AccessToken(
        access_token=access_token,
        user_type=user.user_type,
        pk_id=user.pk_id,
        user_name=user.user_name,
        profile_image=user.profile_image,
        email=user.email,
        gender=user.gender,
        phone=user.phone,
        date_of_birth=user.date_of_birth,
        address=user.address,
        user_data=user,
        wrong_password=user.wrong_password
    )


#get all users
@router.get("", response_model=list[UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    return user_controller.get_all_users(db)

#create or update user
@router.post("", response_model=UserResponse)
def create_or_update_user(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    return user_controller.create_or_update_user(user, db, request)

#update user
@router.put("/approve/{pk_id}", response_model=UserResponse)
def update_user(request: Request, pk_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    ip_address = request.client.host
    return user_controller.update_user(db, current_user_id, pk_id, ip_address)

#delete mutiple users = disable
@router.delete("/delete")
def delete_users(request: Request, data: DeleteUser, db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    ip_address = request.client.host
    return user_controller.delete_users(db, data, ip_address, current_user_id)

#enable users
@router.delete("/enable")
def enable_users(request: Request, data: DeleteUser, db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    ip_address = request.client.host
    return user_controller.enable_users(db, data, ip_address, current_user_id)


# verify token
@router.post("/verify_token", response_model=bool)
def verify_token(authorization: str = Header(None),db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    access_token = authorization.replace("Bearer ", "")

    token = user_controller.verify_refresh_token(access_token, db)
    return token


#user logout
@router.post("/logout", response_model=bool)
def logout(
    request: Request,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    access_token = authorization.replace("Bearer ", "")

    ip_address = request.client.host
    return user_controller.check_token_when_logout(access_token, db, ip_address)


#change password
@router.post("/change-password")
def change_password(data: ChangePassword, db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    return user_controller.change_password(db, current_user_id, data)


#get user by id
@router.get("/profile", response_model=ResponseSingleUserProfile)
def get_user_by_id(db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    return user_controller.get_user_by_id(db, current_user_id)


#update user profile
@router.put("/profile", response_model=ResponseSingleUserProfile)
def update_user_profile(request: Request, data: UpdateUserProfile, db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    ip_address = request.client.host
    return user_controller.update_user_profile(db, current_user_id, data, ip_address)


@router.get("/my-jobs", response_model=List[JobOut])
def get_my_jobs(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    
    return user_controller.get_jobs_by_employer(db, current_user_id)


#create or update user by admin
@router.post("/create-or-update")
def create_or_update_user_admin(request: Request, user: UserCreate, db: Session = Depends(get_db), current_user_id: int = Depends(verify_access_token)):
    ip_address = request.client.host
    return user_controller.create_or_update_user_admin(user, db, ip_address, current_user_id)

@router.post("/upload-profile")
def upload_profile_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    return user_controller.upload_profile(db, file, current_user_id)

@router.delete("/delete-profile")
def delete_user_profile_(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(verify_access_token)
):
    return user_controller.delete_user_profile(db, current_user_id)









