from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app import schemas, models
from app.database import get_db
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)

router = APIRouter()
security = HTTPBearer()


def _normalize_account(phone: str = None, email: str = None):
    if phone:
        return phone.strip()
    if email:
        return email.strip().lower()
    return None


@router.post("/register", response_model=schemas.CommonResponse)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    phone = payload.phone.strip() if payload.phone else None
    email = payload.email.strip().lower() if payload.email else None

    if not phone and not email:
        raise HTTPException(status_code=400, detail="请输入手机号或邮箱")
    if phone and not _is_valid_phone(phone):
        raise HTTPException(status_code=400, detail="手机号格式不正确")
    if email and not _is_valid_email(email):
        raise HTTPException(status_code=400, detail="邮箱格式不正确")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="密码至少6位")
    if not payload.nickname or not payload.nickname.strip():
        raise HTTPException(status_code=400, detail="请输入昵称")

    # 检查重复
    query = db.query(models.User)
    if phone and query.filter(models.User.phone == phone).first():
        raise HTTPException(status_code=400, detail="该手机号已被注册")
    if email and query.filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="该邮箱已被注册")

    user = models.User(
        phone=phone,
        email=email,
        nickname=payload.nickname.strip(),
        hashed_password=get_password_hash(payload.password),
        avatar_bg=_random_avatar_bg(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return schemas.CommonResponse(
        data=schemas.UserResponse.model_validate(user).model_dump()
    )


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    phone = payload.phone.strip() if payload.phone else None
    email = payload.email.strip().lower() if payload.email else None
    target_field = "phone" if phone else "email"
    target_value = phone or email

    if not target_value:
        raise HTTPException(status_code=400, detail="请输入手机号或邮箱")

    user = db.query(models.User).filter(
        getattr(models.User, target_field) == target_value
    ).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="账号或密码错误")

    token_data = {"sub": str(user.id)}
    return schemas.TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=schemas.UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=schemas.TokenResponse)
def refresh(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="刷新令牌无效")

    user_id = payload.get("sub")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")

    token_data = {"sub": str(user.id)}
    return schemas.TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=schemas.UserResponse.model_validate(user),
    )


# ==================== 工具函数 ====================

import re
import random


def _is_valid_phone(phone: str) -> bool:
    return bool(re.match(r"^1\d{10}$", phone))


def _is_valid_email(email: str) -> bool:
    return bool(re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email))


def _random_avatar_bg() -> str:
    colors = [
        "linear-gradient(135deg, #0D6B5C, #1A8A7A)",
        "linear-gradient(135deg, #7BA4D4, #5A8ABF)",
        "linear-gradient(135deg, #D4A84B, #C2960C)",
        "linear-gradient(135deg, #C23B22, #D48A7B)",
        "linear-gradient(135deg, #9B7BD4, #7B5FBF)",
    ]
    return colors[random.randint(0, len(colors) - 1)]
