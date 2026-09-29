import json
import re
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.runtime_secrets import get_secret

router = APIRouter()

MAX_MESSAGE_BYTES = 3 * 1024 * 1024
SAFE_TASK_ID = re.compile(r"^[A-Za-z0-9_-]{1,128}$")


def _require_key(key: str, provider: str) -> str:
    if not key:
        raise HTTPException(status_code=503, detail=f"{provider} 服务尚未配置")
    return key


def _validate_messages(messages: list[dict[str, Any]]) -> None:
    try:
        message_bytes = len(json.dumps(messages, ensure_ascii=False).encode("utf-8"))
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="AI 消息格式无效") from exc
    if message_bytes > MAX_MESSAGE_BYTES:
        raise HTTPException(status_code=413, detail="AI 请求内容过大，请减少图片数量或压缩图片")
    for message in messages:
        if message.get("role") not in {"system", "user", "assistant"}:
            raise HTTPException(status_code=422, detail="AI 消息角色无效")
        if "content" not in message:
            raise HTTPException(status_code=422, detail="AI 消息缺少内容")


def _normalize_vision_messages(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Ensure vision parts keep OpenAI-compatible image_url objects.

    Agnes / KabuAI expect full data URLs (data:image/...;base64,...), so do not strip the prefix.
    """
    normalized: list[dict[str, Any]] = []
    for message in messages:
        current = dict(message)
        content = current.get("content")
        if not isinstance(content, list):
            normalized.append(current)
            continue
        parts: list[Any] = []
        for part in content:
            if not isinstance(part, dict) or part.get("type") != "image_url":
                parts.append(part)
                continue
            image_url = part.get("image_url")
            if isinstance(image_url, str):
                parts.append({**part, "image_url": {"url": image_url}})
                continue
            if not isinstance(image_url, dict):
                parts.append(part)
                continue
            url = image_url.get("url")
            if not isinstance(url, str) or not url.strip():
                raise HTTPException(status_code=422, detail="视觉消息缺少有效图片")
            parts.append({**part, "image_url": {**image_url, "url": url}})
        current["content"] = parts
        normalized.append(current)
    return normalized


async def _upstream_request(
    method: str,
    url: str,
    *,
    headers: dict[str, str],
    json_body: dict[str, Any] | None = None,
    timeout_seconds: float = 60,
) -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(timeout_seconds, connect=8.0)) as client:
            response = await client.request(method, url, headers=headers, json=json_body)
            if response.is_error:
                detail = "AI 服务暂时不可用，请稍后重试"
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
                raise HTTPException(status_code=502, detail=detail)
            return response.json()
    except HTTPException:
        raise
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="AI 服务请求超时，请稍后重试") from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="AI 服务暂时不可用，请稍后重试") from exc


def _content_to_text(content: Any) -> str:
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        pieces: list[str] = []
        for item in content:
            if isinstance(item, str):
                pieces.append(item)
            elif isinstance(item, dict):
                text = item.get("text") or item.get("content")
                if isinstance(text, str):
                    pieces.append(text)
        return "\n".join(piece.strip() for piece in pieces if piece.strip())
    return ""


def _is_forced_thinking_model(model: str) -> bool:
    name = (model or "").strip().lower()
    return name in {"glm-5.3", "glm-5.3-flash"} or name.startswith("glm-5.3-flash")


def _looks_like_json_payload(text: str) -> bool:
    s = (text or "").strip()
    if not s:
        return False
    if s.startswith("{") and ("destination" in s or "daysList" in s or '"title"' in s):
        return True
    if "```json" in s.lower():
        return True
    return s.startswith("{") and s.endswith("}")


def _normalize_chat_response(payload: dict[str, Any]) -> dict[str, Any]:
    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices or not isinstance(choices[0], dict):
        raise HTTPException(status_code=502, detail="AI 服务响应格式异常")

    choice = dict(choices[0])
    message = choice.get("message")
    if not isinstance(message, dict):
        message = {}
    else:
        message = dict(message)

    content = _content_to_text(message.get("content"))
    reasoning = _content_to_text(message.get("reasoning_content"))

    # 强制思考模型偶发把推理塞进 content：若 content 不像 JSON 而 reasoning 更像答案，互换
    if content and reasoning:
        if (not _looks_like_json_payload(content)) and _looks_like_json_payload(reasoning):
            content, reasoning = reasoning, content
    if not content:
        content = reasoning
    if not content:
        content = _content_to_text(payload.get("output_text") or payload.get("content"))
    if not content:
        raise HTTPException(status_code=502, detail="AI 服务响应中未包含可用文本内容")

    message["content"] = content
    if reasoning and reasoning != content:
        message["reasoning_content"] = reasoning
    choice["message"] = message
    normalized = dict(payload)
    normalized["choices"] = [choice, *choices[1:]]
    return normalized


def _chat_target(mode: str) -> tuple[str, str, str]:
    if mode == "vision":
        return (
            settings.ZHIPU_API_BASE.rstrip("/"),
            _require_key(get_secret("ZHIPU_API_KEY"), "智谱视觉 AI"),
            (settings.ZHIPU_VISION_MODEL or "glm-5.3-flash").strip() or "glm-5.3-flash",
        )
    return (
        settings.DEEPSEEK_API_BASE.rstrip("/"),
        _require_key(get_secret("DEEPSEEK_API_KEY"), "文本 AI"),
        settings.DEEPSEEK_MODEL,
    )


def _build_chat_json_body(
    *,
    model: str,
    messages: list[dict[str, Any]],
    temperature: float,
    max_tokens: int,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }
    # GLM-5.3 / Flash：不可 disabled；必须 enabled，否则推理会泄漏进 content
    if _is_forced_thinking_model(model):
        body["thinking"] = {"type": "enabled"}
        body["reasoning_effort"] = "low"
    return body


# GLM-Image 官方推荐尺寸（竖版手账默认 3:4 → 1056x1568）
_ZHIPU_RATIO_SIZES = {
    "1:1": "1280x1280",
    "3:4": "1056x1568",
    "4:3": "1568x1056",
    "16:9": "1728x960",
    "9:16": "960x1728",
    "3:2": "1472x1088",
    "2:3": "1088x1472",
}


def _resolve_zhipu_image_size(size: str | None, ratio: str | None) -> str:
    text = (size or "").strip()
    if re.fullmatch(r"\d{3,4}x\d{3,4}", text, flags=re.IGNORECASE):
        return text.lower()
    mapped = _ZHIPU_RATIO_SIZES.get((ratio or "").strip())
    if mapped:
        return mapped
    return "1056x1568"


@router.post("/chat", response_model=schemas.CommonResponse)
async def chat(
    payload: schemas.AIChatRequest,
    _: models.User = Depends(get_current_user),
):
    _validate_messages(payload.messages)
    base_url, api_key, model = _chat_target(payload.mode)
    messages = (
        _normalize_vision_messages(payload.messages)
        if payload.mode == "vision"
        else payload.messages
    )
    response = await _upstream_request(
        "POST",
        f"{base_url}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json_body=_build_chat_json_body(
            model=model,
            messages=messages,
            temperature=payload.options.temperature,
            max_tokens=payload.options.max_tokens,
        ),
        timeout_seconds=payload.options.timeout_ms / 1000,
    )
    return schemas.CommonResponse(data=_normalize_chat_response(response))


@router.post("/images", response_model=schemas.CommonResponse)
async def generate_image(
    payload: schemas.AIImageRequest,
    _: models.User = Depends(get_current_user),
):
    """Proxy Zhipu GLM-Image text-to-image.

    Official API: https://docs.bigmodel.cn/cn/guide/models/image-generation/glm-image
    GLM-Image is text-to-image only; reference images from the client are ignored.
    """
    api_key = _require_key(get_secret("ZHIPU_API_KEY"), "智谱图片生成")
    model = (
        (payload.model or settings.ZHIPU_IMAGE_MODEL or "glm-image").strip()
        or "glm-image"
    )
    # GLM-Image 文档：最大输入约 1000 字符
    prompt = (payload.prompt or "").strip()[:1000]
    if not prompt:
        raise HTTPException(status_code=422, detail="图片提示词不能为空")

    request_body: dict[str, Any] = {
        "model": model,
        "prompt": prompt,
        "size": _resolve_zhipu_image_size(payload.size, payload.ratio),
    }
    if model.startswith("glm-image"):
        request_body["quality"] = "hd"

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(360.0, connect=8.0)) as client:
            response = await client.post(
                f"{settings.ZHIPU_API_BASE.rstrip('/')}/images/generations",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=request_body,
            )
            if response.is_error:
                detail = "图片生成失败，请稍后重试"
                try:
                    err = response.json()
                    message = (
                        (err.get("error") or {}).get("message")
                        if isinstance(err.get("error"), dict)
                        else err.get("message") or err.get("detail")
                    )
                    if isinstance(message, str) and message.strip():
                        detail = message.strip()[:240]
                        lowered = detail.lower()
                        if "api" in lowered and ("key" in lowered or "token" in lowered):
                            detail = (
                                "智谱图片服务鉴权失败。"
                                "请在 backend/.env 配置有效的 ZHIPU_API_KEY，"
                                "并将 ZHIPU_API_BASE 设为 https://open.bigmodel.cn/api/paas/v4 后重启后端。"
                            )
                except (ValueError, TypeError):
                    pass
                raise HTTPException(status_code=502, detail=detail)
            data = response.json()
    except HTTPException:
        raise
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="图片生成超时，请稍后重试") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="图片生成服务暂时不可用，请稍后重试") from exc

    return schemas.CommonResponse(data=data)


@router.post("/videos", response_model=schemas.CommonResponse)
async def generate_video(
    payload: schemas.AIVideoRequest,
    _: models.User = Depends(get_current_user),
):
    api_key = _require_key(get_secret("AGNES_API_KEY"), "视频生成 AI")
    if payload.num_frames is not None and (payload.num_frames - 1) % 8 != 0:
        raise HTTPException(status_code=422, detail="视频帧数必须符合 8n+1 规则")
    request_body: dict[str, Any] = {"model": "agnes-video-v2.0", "prompt": payload.prompt}
    if payload.image:
        request_body["image"] = payload.image
        request_body["mode"] = payload.mode
    for field in ("width", "height", "num_frames", "frame_rate"):
        value = getattr(payload, field)
        if value is not None:
            request_body[field] = value
    response = await _upstream_request(
        "POST",
        f"{settings.AGNES_API_BASE.rstrip('/')}/videos",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json_body=request_body,
        timeout_seconds=30,
    )
    return schemas.CommonResponse(data=response)


@router.get("/videos/{task_id}", response_model=schemas.CommonResponse)
async def get_video_status(
    task_id: str,
    _: models.User = Depends(get_current_user),
):
    if not SAFE_TASK_ID.fullmatch(task_id):
        raise HTTPException(status_code=422, detail="视频任务标识无效")
    api_key = _require_key(get_secret("AGNES_API_KEY"), "视频生成 AI")
    provider_root = settings.AGNES_API_BASE.rstrip("/").removesuffix("/v1")
    response = await _upstream_request(
        "GET",
        f"{provider_root}/agnesapi?video_id={task_id}&model_name=agnes-video-v2.0",
        headers={"Authorization": f"Bearer {api_key}"},
        timeout_seconds=30,
    )
    return schemas.CommonResponse(data=response)


def _extract_json_object(text: str) -> dict[str, Any]:
    cleaned = re.sub(r"```json|```", "", text or "", flags=re.IGNORECASE).strip()
    try:
        data = json.loads(cleaned)
        if isinstance(data, dict):
            return data
    except (TypeError, ValueError):
        pass
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        data = json.loads(cleaned[start : end + 1])
        if isinstance(data, dict):
            return data
    raise HTTPException(status_code=502, detail="故事生成结果格式异常")


def _fallback_album_story(
    *,
    photo_count: int,
    location: str | None,
    date: str | None,
    mood: str | None,
) -> str:
    place = (location or "").strip() or "旅途中"
    when = (date or "").strip()
    feeling = (mood or "").strip()
    parts = [f"这次在{place}拍下了 {photo_count} 个瞬间。"]
    if when:
        parts.append(f"那天是 {when}。")
    if feeling:
        parts.append(feeling if feeling.endswith(("。", "！", "?", "？")) else feeling + "。")
    else:
        parts.append("镜头慢慢掠过风景与笑脸，把这一段路重新拼成可回看的小电影。")
    return "".join(parts)


@router.post("/album-video/story", response_model=schemas.CommonResponse)
async def create_album_video_story(
    payload: schemas.AlbumVideoStoryRequest,
    _: models.User = Depends(get_current_user),
):
    """Generate an editable travel narration from album photos (no TTS yet)."""
    location = (payload.location or "").strip()
    date = (payload.date or "").strip()
    mood = (payload.mood or "").strip()
    photo_count = len(payload.images)

    prompt = (
        f"你是旅行短视频旁白编剧。根据这 {photo_count} 张旅途照片，写一段适合相册成片的中文旁白。\n"
        f"已知信息：地点={location or '未填写'}；日期={date or '未填写'}；"
        f"心情={mood or '未填写'}。\n"
        "要求：\n"
        "1. 口语化、第一人称，像朋友聊天。\n"
        "2. 总长度约 120-220 字，可按照片数量略增减。\n"
        "3. 尽量点到画面里看得见的细节，结合地点/日期/心情。\n"
        "4. 只返回 JSON：{\"story\":\"完整旁白\"}，不要其它说明。"
    )
    content: list[dict[str, Any]] = [{"type": "text", "text": prompt}]
    for image in payload.images:
        content.append({"type": "image_url", "image_url": {"url": image}})

    messages = _normalize_vision_messages([{"role": "user", "content": content}])
    _validate_messages(messages)
    base_url, api_key, model = _chat_target("vision")
    try:
        response = await _upstream_request(
            "POST",
            f"{base_url}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json_body=_build_chat_json_body(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=1200,
            ),
            timeout_seconds=120,
        )
        response = _normalize_chat_response(response)
        text = _content_to_text(response["choices"][0]["message"].get("content"))
        data = _extract_json_object(text)
        story = str(data.get("story") or "").strip()
        if not story:
            raise ValueError("empty story")
    except HTTPException:
        story = _fallback_album_story(
            photo_count=photo_count,
            location=location,
            date=date,
            mood=mood,
        )
    except Exception:
        story = _fallback_album_story(
            photo_count=photo_count,
            location=location,
            date=date,
            mood=mood,
        )

    return schemas.CommonResponse(
        data={
            "story": story,
            "photo_count": photo_count,
            "has_narration_audio": False,
        }
    )


@router.post("/album-video/render", response_model=schemas.CommonResponse)
async def render_album_video(
    payload: schemas.AlbumVideoRenderRequest,
    _: models.User = Depends(get_current_user),
):
    """Render a silent Ken Burns slideshow from album photos."""
    from pathlib import Path
    import tempfile

    from app.album_video import AlbumVideoError, render_from_data_urls
    from app.storage import generate_key, upload_file

    # story is accepted for forward compatibility (captions/TTS); silent for now.
    _ = (payload.story or "").strip()

    try:
        with tempfile.TemporaryDirectory(prefix="album_render_") as tmp:
            output = Path(tmp) / "album.mp4"
            render_from_data_urls(
                payload.images,
                output,
                seconds_per_image=payload.seconds_per_image,
            )
            video_bytes = output.read_bytes()
    except AlbumVideoError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail="相册视频合成失败，请稍后重试") from exc

    key = generate_key("videos", "album.mp4")
    url = upload_file(video_bytes, "video/mp4", key)
    duration = round(len(payload.images) * payload.seconds_per_image, 1)
    return schemas.CommonResponse(
        data={
            "video_url": url,
            "duration_estimate_sec": duration,
            "has_narration_audio": False,
        }
    )


@router.post("/film/tasks", response_model=schemas.CommonResponse)
async def proxy_film_task(payload: dict, db: Session = Depends(get_db)):
    """把成片任务转给 odyssee，并注入管理后台保存的万相密钥。"""
    _ = db
    body = {
        key: value
        for key, value in (payload or {}).items()
        if key not in {"apiKey", "dashscopeApiKey", "workspaceId", "bailianWorkspaceId"}
    }
    api_key = get_secret("DASHSCOPE_API_KEY")
    workspace_id = get_secret("BAILIAN_WORKSPACE_ID")
    if not api_key or not workspace_id:
        raise HTTPException(
            status_code=503,
            detail="万相密钥未配置。请到管理后台「模型密钥」填写 API Key 与 Workspace ID。",
        )
    body["apiKey"] = api_key
    body["workspaceId"] = workspace_id
    base = str(settings.FILM_API_BASE or "http://127.0.0.1:3000").rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=8.0)) as client:
            response = await client.post(f"{base}/api/video-engine/tasks", json=body)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="视频服务暂时不可用") from exc
    try:
        data = response.json()
    except ValueError:
        data = {"error": response.text[:300]}
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=data.get("error") or "创建成片任务失败")
    return schemas.CommonResponse(data=data)
