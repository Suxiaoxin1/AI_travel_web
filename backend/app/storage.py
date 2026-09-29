import uuid
import mimetypes
import logging
from datetime import datetime
from pathlib import Path, PurePosixPath
from time import monotonic

import boto3
from botocore.exceptions import ClientError

from app.config import settings

logger = logging.getLogger(__name__)
_s3_retry_after = 0.0


def _get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        region_name=settings.S3_REGION,
        config=boto3.session.Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
            connect_timeout=2,
            read_timeout=5,
            retries={"total_max_attempts": 1, "mode": "standard"},
        ),
    )


def _ensure_bucket():
    client = _get_s3_client()
    try:
        client.head_bucket(Bucket=settings.S3_BUCKET)
    except ClientError as exc:
        error_code = exc.response["Error"]["Code"]
        if error_code in ("404", "NoSuchBucket"):
            client.create_bucket(Bucket=settings.S3_BUCKET)
            _set_public_policy(client)
        elif error_code == "409":
            pass
        else:
            raise


def _set_public_policy(client):
    policy = (
        '{"Version":"2012-10-17",'
        '"Statement":[{"Effect":"Allow","Principal":"*",'
        '"Action":["s3:GetObject"],'
        '"Resource":["arn:aws:s3:::%s/*"]}]}' % settings.S3_BUCKET
    )
    try:
        client.put_bucket_policy(Bucket=settings.S3_BUCKET, Policy=policy)
    except ClientError:
        pass


def generate_key(folder: str, filename: str) -> str:
    ext = PurePosixPath(filename).suffix or ".bin"
    date_path = datetime.utcnow().strftime("%Y/%m")
    name = uuid.uuid4().hex[:16]
    return f"{folder}/{date_path}/{name}{ext}"


def upload_file(file_bytes: bytes, content_type: str, key: str) -> str:
    """上传文件到 S3 兼容对象存储，返回可公开访问的 URL。"""
    global _s3_retry_after

    # 单机生产部署或对象存储尚未配置时，直接写入持久化 uploads 卷。
    # 避免首次上传等待不可用的 S3/MinIO 连接超时。
    if not settings.S3_ENABLED:
        return _upload_local(file_bytes, key)

    # S3 连续不可用时，避免每张图片都重复等待连接超时。
    if monotonic() < _s3_retry_after:
        return _upload_local(file_bytes, key)

    try:
        _ensure_bucket()
        client = _get_s3_client()
        extra_args = {"ContentType": content_type or "application/octet-stream"}
        client.put_object(Bucket=settings.S3_BUCKET, Key=key, Body=file_bytes, **extra_args)
        return public_url(key)
    except Exception as exc:
        # 本地开发时 MinIO 可能未启动，回退到 FastAPI 挂载的 uploads 目录，
        # 避免对象存储连接异常被浏览器误报为 CORS 错误。
        logger.warning("S3 upload failed, falling back to local storage: %s", exc)
        _s3_retry_after = monotonic() + settings.S3_FALLBACK_COOLDOWN_SECONDS
        return _upload_local(file_bytes, key)


def _upload_local(file_bytes: bytes, key: str) -> str:
    local_root = Path(__file__).resolve().parents[1] / "uploads"
    local_path = local_root.joinpath(*PurePosixPath(key).parts)
    local_path.parent.mkdir(parents=True, exist_ok=True)
    local_path.write_bytes(file_bytes)
    # 返回相对路径，避免 HTTPS 站点混入 http://host:port 导致 Mixed Content。
    return f"/uploads/{key}"


def public_url(key: str) -> str:
    if settings.S3_PUBLIC_URL:
        base = settings.S3_PUBLIC_URL.rstrip("/")
        return f"{base}/{key}"
    endpoint = settings.S3_ENDPOINT.rstrip("/")
    return f"{endpoint}/{settings.S3_BUCKET}/{key}"
