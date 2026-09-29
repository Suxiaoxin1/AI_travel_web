from datetime import datetime
import hashlib
import random
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    hash_token_id,
    new_session_id,
    new_token_id,
    refresh_token_expiry,
    verify_password,
)
from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()
security = HTTPBearer(auto_error=False)


def _request_meta(request: Request | None) -> tuple[str, Optional[str], Optional[str]]:
    if not request:
        return "", None, None
    forwarded = request.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "")
    return ip, request.headers.get("x-device-id"), request.headers.get("user-agent")


def _account_subject_hash(account: str) -> str:
    return hashlib.sha256(f"account:{account}:{settings.SECRET_KEY}".encode()).hexdigest()


def _record_event(
    db: Session,
    event_type: str,
    *,
    account: Optional[str] = None,
    user: Optional[models.User] = None,
    request: Request | None = None,
    metadata: Optional[dict] = None,
) -> None:
    ip = _request_meta(request)[0]
    db.add(models.AuthEvent(
        user_id=user.id if user else None,
        event_type=event_type,
        subject_hash=_account_subject_hash(account) if account else None,
        ip_address=ip or None,
        metadata_json=metadata,
    ))


def _grant_bootstrap_admin_if_needed(user: models.User, db: Session, request: Request | None) -> None:
    """通过一次性部署变量初始化首个管理员，避免把管理员账号写死在代码或迁移中。"""
    bootstrap_account = settings.ADMIN_BOOTSTRAP_ACCOUNT.strip()
    if not bootstrap_account or user.account != bootstrap_account or user.is_admin:
        return
    role = db.query(models.Role).filter(models.Role.key == "admin").first()
    if not role:
        role = models.Role(key="admin", name="管理员")
        db.add(role)
        db.flush()
    user.roles.append(role)
    _record_event(db, "bootstrap_admin_granted", account=user.account, user=user, request=request)


def _issue_tokens(user: models.User, db: Session, request: Request | None) -> schemas.TokenResponse:
    ip, device_id, user_agent = _request_meta(request)
    session_id = new_session_id()
    refresh_jti = new_token_id()
    db.add(models.AuthSession(
        id=session_id,
        user_id=user.id,
        refresh_jti_hash=hash_token_id(refresh_jti),
        device_id=(device_id or "")[:128] or None,
        user_agent=(user_agent or "")[:512] or None,
        ip_address=(ip or "")[:64] or None,
        expires_at=refresh_token_expiry(),
    ))
    user.last_login_at = datetime.utcnow()
    _grant_bootstrap_admin_if_needed(user, db, request)
    _record_event(db, "login_success", account=user.account, user=user, request=request)
    db.commit()
    db.refresh(user)
    token_data = {"sub": str(user.id), "sid": session_id}
    return schemas.TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token({**token_data, "jti": refresh_jti}),
        user=schemas.UserResponse.model_validate(user),
    )


def _rotate_tokens(user: models.User, session: models.AuthSession, db: Session) -> schemas.TokenResponse:
    refresh_jti = new_token_id()
    session.refresh_jti_hash = hash_token_id(refresh_jti)
    session.expires_at = refresh_token_expiry()
    session.last_seen_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    token_data = {"sub": str(user.id), "sid": session.id}
    return schemas.TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token({**token_data, "jti": refresh_jti}),
        user=schemas.UserResponse.model_validate(user),
    )


def _random_avatar_bg() -> str:
    return random.choice([
        "linear-gradient(135deg, #0D6B5C, #1A8A7A)",
        "linear-gradient(135deg, #7BA4D4, #5A8ABF)",
        "linear-gradient(135deg, #D4A84B, #C2960C)",
        "linear-gradient(135deg, #C23B22, #D48A7B)",
        "linear-gradient(135deg, #9B7BD4, #7B5FBF)",
    ])


@router.post("/register", response_model=schemas.TokenResponse)
def register(payload: schemas.UserCreate, request: Request, db: Session = Depends(get_db)):
    account = payload.account
    if db.query(models.User.id).filter(models.User.account == account).first():
        raise HTTPException(status_code=400, detail="该账号已被注册")
    user = models.User(
        account=account,
        nickname=payload.nickname or account,
        hashed_password=get_password_hash(payload.password),
        avatar_bg=_random_avatar_bg(),
    )
    db.add(user)
    db.flush()
    _record_event(db, "account_register_success", account=account, user=user, request=request)
    return _issue_tokens(user, db, request)


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.account == payload.account).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        _record_event(db, "password_login_failed", account=payload.account, request=request)
        db.commit()
        raise HTTPException(status_code=401, detail="账号或密码错误")
    if user.status != "active":
        raise HTTPException(status_code=403, detail="账号已被停用")
    return _issue_tokens(user, db, request)


@router.post("/refresh", response_model=schemas.TokenResponse)
def refresh(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    if not credentials:
        raise HTTPException(status_code=401, detail="刷新令牌无效")
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="刷新令牌无效")
    user_id, session_id, token_id = payload.get("sub"), payload.get("sid"), payload.get("jti")
    if not (user_id and session_id and token_id):
        raise HTTPException(status_code=401, detail="刷新令牌已失效，请重新登录")
    user = db.query(models.User).filter(models.User.id == int(user_id), models.User.status == "active").first()
    session = db.query(models.AuthSession).filter(
        models.AuthSession.id == session_id,
        models.AuthSession.user_id == int(user_id),
        models.AuthSession.revoked_at.is_(None),
    ).first()
    if not user or not session or session.expires_at < datetime.utcnow() or session.refresh_jti_hash != hash_token_id(token_id):
        raise HTTPException(status_code=401, detail="刷新令牌已失效，请重新登录")
    return _rotate_tokens(user, session, db)


@router.post("/logout", response_model=schemas.CommonResponse)
def logout(credentials: HTTPAuthorizationCredentials = Depends(security), current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    payload = decode_token(credentials.credentials) if credentials else None
    session_id = payload.get("sid") if payload else None
    if session_id:
        session = db.query(models.AuthSession).filter(models.AuthSession.id == session_id, models.AuthSession.user_id == current_user.id).first()
        if session and not session.revoked_at:
            session.revoked_at = datetime.utcnow()
            _record_event(db, "logout", account=current_user.account, user=current_user)
            db.commit()
    return schemas.CommonResponse(message="已退出登录")


@router.post("/logout-all", response_model=schemas.CommonResponse)
def logout_all(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.AuthSession).filter(models.AuthSession.user_id == current_user.id, models.AuthSession.revoked_at.is_(None)).update(
        {models.AuthSession.revoked_at: datetime.utcnow()}, synchronize_session=False
    )
    _record_event(db, "logout_all", account=current_user.account, user=current_user)
    db.commit()
    return schemas.CommonResponse(message="已退出所有设备")
