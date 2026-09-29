"""管理员覆盖的模型密钥。数据库有值时优先于环境变量。"""

from app.config import settings
from app.database import SessionLocal
from app import models

MODEL_SECRET_FIELDS = (
    {
        "key": "DASHSCOPE_API_KEY",
        "label": "万相 DashScope API Key",
        "hint": "VOLO 成片调用万相时使用，需与 Workspace ID 成对填写。",
    },
    {
        "key": "BAILIAN_WORKSPACE_ID",
        "label": "百炼 Workspace ID",
        "hint": "万相业务空间 ID。后台保存后立即生效，无需改 .env。",
    },
    {
        "key": "ZHIPU_API_KEY",
        "label": "智谱 API Key",
        "hint": "手账看图与生图。",
    },
    {
        "key": "DEEPSEEK_API_KEY",
        "label": "DeepSeek API Key",
        "hint": "文本对话与手账排版。",
    },
    {
        "key": "AGNES_API_KEY",
        "label": "Agnes / KabuAI API Key",
        "hint": "旧视频生成代理。",
    },
)

_ALLOWED = {item["key"] for item in MODEL_SECRET_FIELDS}
_cache = None


def _load(db) -> dict:
    rows = db.query(models.AppSetting).filter(models.AppSetting.key.in_(_ALLOWED)).all()
    return {row.key: row.value or "" for row in rows}


def refresh_cache(db=None) -> None:
    global _cache
    own = db is None
    session = db or SessionLocal()
    try:
        _cache = _load(session)
    finally:
        if own:
            session.close()


def _overrides() -> dict:
    global _cache
    if _cache is None:
        try:
            refresh_cache()
        except Exception:
            _cache = {}
    return _cache or {}


def get_secret(name: str) -> str:
    override = str(_overrides().get(name) or "").strip()
    if override:
        return override
    return str(getattr(settings, name, "") or "").strip()


def secret_source(name: str) -> str:
    if str(_overrides().get(name) or "").strip():
        return "admin"
    if str(getattr(settings, name, "") or "").strip():
        return "env"
    return "none"


def mask_secret(value: str) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""
    if len(raw) <= 8:
        return "••••••••"
    return f"{raw[:4]}…{raw[-4:]}"


def describe_secrets() -> list[dict]:
    items = []
    for field in MODEL_SECRET_FIELDS:
        value = get_secret(field["key"])
        items.append({
            **field,
            "configured": bool(value),
            "source": secret_source(field["key"]),
            "masked": mask_secret(value),
        })
    return items


def apply_secret_updates(db, updates: dict, clears: list[str]) -> None:
    for key in clears or []:
        if key not in _ALLOWED:
            continue
        row = db.query(models.AppSetting).filter(models.AppSetting.key == key).first()
        if row:
            db.delete(row)
    for key, value in (updates or {}).items():
        if key not in _ALLOWED:
            continue
        text = str(value or "").strip()
        if not text:
            continue
        row = db.query(models.AppSetting).filter(models.AppSetting.key == key).first()
        if row:
            row.value = text
        else:
            db.add(models.AppSetting(key=key, value=text))
    db.flush()
    refresh_cache(db)
