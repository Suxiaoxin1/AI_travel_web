"""旅行手帐抠图服务（移植自旧项目 server/services/diary-cutout.js）。

用 rembg（u2net）在服务端把照片主体（人/动物/一般前景）抠成透明 PNG，
供手帐主体贴纸使用。模型首次运行需下载（已在部署时预热到 ~/.u2net）。

旧实现是 @imgly/background-removal-node（Node 专属），此处换 rembg 实现，
接口保持一致：{images:[dataUrl]} → {results:[{ok,dataUrl}|{ok,error}]}。
"""
from __future__ import annotations

import base64
import binascii
import io
import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

_DATA_URL_RE = re.compile(r"^data:([^;,]+)?(;base64)?,(.*)$", re.DOTALL)
MAX_IMAGES = 6
MAX_SIDE = 800  # 超过则等比缩小，与旧前端"已压缩到 ≤800px"约定一致

_session = None
_session_error: str | None = None


def _get_session():
    """懒加载 rembg session：第 1 次调用时才初始化，避免拖慢服务冷启动。"""
    global _session, _session_error
    if _session is not None:
        return _session
    if _session_error is not None:
        raise RuntimeError(_session_error)
    try:
        from rembg import new_session
        _session = new_session("u2net")
        return _session
    except Exception as exc:  # noqa: BLE001 — 初始化失败转为可读错误
        _session_error = (
            "服务端抠图模块初始化失败，请确认已安装："
            "cd backend && .\\.venv\\Scripts\\python.exe -m pip install rembg onnxruntime。"
            f"原因: {exc}"
        )
        raise RuntimeError(_session_error)


def _decode_data_url(data_url: str) -> tuple[bytes, str] | None:
    m = _DATA_URL_RE.match(str(data_url or ""))
    if not m:
        return None
    mime = m.group(1) or "image/png"
    try:
        buf = base64.b64decode(m.group(3) or "", validate=True)
    except (binascii.Error, ValueError):
        return None
    if not buf:
        return None
    return buf, mime


def _cutout_one(data_url: str, session) -> dict[str, Any]:
    from rembg import remove
    from PIL import Image

    decoded = _decode_data_url(data_url)
    if not decoded:
        return {"ok": False, "error": "图像数据解析失败"}
    raw, _mime = decoded
    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        return {"ok": False, "error": "图像解码失败"}
    try:
        if max(img.size) > MAX_SIDE:
            ratio = MAX_SIDE / max(img.size)
            img = img.resize(
                (max(1, int(img.width * ratio)), max(1, int(img.height * ratio))),
                Image.LANCZOS,
            )
        out = remove(img, session=session)
        buf = io.BytesIO()
        out.save(buf, format="PNG")
        data = buf.getvalue()
        if not data:
            return {"ok": False, "error": "抠图结果为空"}
        return {"ok": True, "dataUrl": "data:image/png;base64," + base64.b64encode(data).decode("ascii")}
    except Exception as exc:  # noqa: BLE001 — 单张失败不影响后续
        return {"ok": False, "error": str(exc) or "抠图失败"}


def cutout_images(images: Any) -> dict[str, Any]:
    """批量抠图：最多 6 张，顺序处理，单张独立失败不影响后续。"""
    items = list(images[:MAX_IMAGES]) if isinstance(images, list) else []
    if not items:
        return {"success": False, "error": "未提供图片"}
    try:
        session = _get_session()
    except RuntimeError as exc:
        return {"success": False, "error": str(exc)}
    results = [_cutout_one(u, session) for u in items]
    ok_count = sum(1 for r in results if r.get("ok"))
    logger.info("[Diary Cutout] OK %d/%d 张抠图成功", ok_count, len(results))
    return {"success": True, "results": results}
