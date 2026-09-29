from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import decode_token
from app import models

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="认证令牌无效或已过期",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="认证令牌缺少用户信息",
        )
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user or user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
        )
    session_id = payload.get("sid")
    if session_id:
        active_session = db.query(models.AuthSession).filter(
            models.AuthSession.id == session_id,
            models.AuthSession.user_id == user.id,
            models.AuthSession.revoked_at.is_(None),
        ).first()
        if not active_session:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录会话已失效")
    return user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    user = db.query(models.User).filter(models.User.id == int(user_id), models.User.status == "active").first()
    if not user:
        return None
    session_id = payload.get("sid")
    if session_id:
        valid = db.query(models.AuthSession.id).filter(
            models.AuthSession.id == session_id,
            models.AuthSession.user_id == user.id,
            models.AuthSession.revoked_at.is_(None),
        ).first()
        if not valid:
            return None
    return user


def get_current_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="需要管理员权限")
    return current_user
