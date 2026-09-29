from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4
import hashlib

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    return bool(hashed_password) and pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def new_session_id() -> str:
    return str(uuid4())


def new_token_id() -> str:
    return str(uuid4())


def hash_token_id(token_id: str) -> str:
    return hashlib.sha256(f"session:{token_id}:{settings.SECRET_KEY}".encode()).hexdigest()


def refresh_token_expiry() -> datetime:
    # 数据库列为 timestamp without time zone，使用 UTC 的 naive datetime 与现有模型保持一致。
    return datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
