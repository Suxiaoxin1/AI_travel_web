"""手帐排版代理：POST /layout-next → DeepSeek 生成扁平排版 JSON。"""
from __future__ import annotations

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool

from app import models, schemas
from app.config import settings
from app.dependencies import get_current_user
from app.diary_cutout import cutout_images
from app.diary_layout_next import request_diary_layout_next
from app.runtime_secrets import get_secret

router = APIRouter()


def _require_key(key: str, provider: str) -> str:
    if not key:
        raise HTTPException(status_code=503, detail=f"{provider} 服务尚未配置")
    return key


@router.post("/layout-next")
async def diary_layout_next(
    payload: schemas.DiaryLayoutNextRequest,
    current_user: models.User = Depends(get_current_user),
):
    del current_user  # auth gate only
    api_key = _require_key(get_secret("DEEPSEEK_API_KEY"), "文本 AI")

    aspects = None
    if payload.aspects:
        aspects = [{"index": a.index, "aspect": a.aspect} for a in payload.aspects]

    try:
        result = await request_diary_layout_next(
            api_key=api_key,
            base_url=settings.DEEPSEEK_API_BASE.rstrip("/"),
            model=settings.DEEPSEEK_MODEL,
            style=payload.style,
            description=payload.description or "",
            context=payload.context or "",
            photo_count=payload.photoCount,
            aspects=aspects,
        )
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="AI 服务请求超时，请稍后重试") from exc
    except httpx.HTTPError as exc:
        detail = "AI 服务暂时不可用，请稍后重试"
        response = getattr(exc, "response", None)
        if response is not None:
            try:
                err = response.json()
                message = (
                    (err.get("error") or {}).get("message")
                    if isinstance(err.get("error"), dict)
                    else err.get("message") or err.get("detail")
                )
                if isinstance(message, str) and message.strip():
                    detail = message.strip()[:240]
            except (ValueError, TypeError):
                pass
        raise HTTPException(status_code=502, detail=detail) from exc

    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("error") or "排版失败",
        )
    return {"success": True, "layout": result["layout"]}


@router.post("/cutout")
async def diary_cutout(
    payload: schemas.DiaryCutoutRequest,
    current_user: models.User = Depends(get_current_user),
):
    """主体抠图：dataUrl 进 → 透明 PNG dataUrl 出；单张失败不影响其余。"""
    del current_user  # auth gate only
    # rembg 是 CPU 密集型同步推理：单张 800px 约 2-10s，6 张最坏约 1 分钟；
    # 用 to_thread 避免阻塞事件循环，网关超时（HTTP 413 那次修的是上传体，这里是推理耗时）需 ≥120s。
    result = await run_in_threadpool(cutout_images, payload.images)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error") or "抠图失败")
    return {"success": True, "results": result["results"]}
