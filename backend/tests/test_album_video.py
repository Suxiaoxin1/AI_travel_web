from pathlib import Path

import pytest

from app.album_video import AlbumVideoError, decode_data_url, ensure_ffmpeg, render_silent_slideshow
from app.config import settings
from app.routers import ai

# Minimal valid 1x1 JPEG
_TINY_JPEG_B64 = (
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a"
    "HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIy"
    "MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIA"
    "AhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEB"
    "AQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/E"
    "ABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAI"
    "AQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z"
)


def _tiny_jpeg_data_url() -> str:
    return f"data:image/jpeg;base64,{_TINY_JPEG_B64}"


def test_decode_data_url_accepts_jpeg():
    raw, mime = decode_data_url(_tiny_jpeg_data_url())
    assert mime == "jpeg"
    assert len(raw) > 20


def test_album_story_fallback_text():
    text = ai._fallback_album_story(
        photo_count=4,
        location="厦门",
        date="2026-09-10",
        mood="海风很咸",
    )
    assert "厦门" in text
    assert "4" in text


def test_album_story_endpoint(client, auth_headers, monkeypatch):
    monkeypatch.setattr(settings, "ZHIPU_API_KEY", "test-zhipu-key")
    monkeypatch.setattr(settings, "ZHIPU_API_BASE", "https://open.bigmodel.cn/api/paas/v4")
    monkeypatch.setattr(settings, "ZHIPU_VISION_MODEL", "glm-5.3-flash")

    async def fake_upstream_request(method, url, *, headers, json_body=None, timeout_seconds=60):
        return {
            "choices": [{"message": {"role": "assistant", "content": '{"story":"海边的傍晚很安静。"}'}}]
        }

    monkeypatch.setattr(ai, "_upstream_request", fake_upstream_request)
    images = [_tiny_jpeg_data_url()] * 3
    response = client.post(
        "/api/ai/album-video/story",
        headers=auth_headers,
        json={"images": images, "location": "鼓浪屿", "mood": "轻松"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["story"] == "海边的傍晚很安静。"
    assert response.json()["data"]["has_narration_audio"] is False


def test_album_render_endpoint(client, auth_headers, monkeypatch, tmp_path):
    try:
        ensure_ffmpeg()
    except AlbumVideoError:
        pytest.skip("ffmpeg not installed")

    from app import storage

    def fake_upload(file_bytes, content_type, key):
        assert content_type == "video/mp4"
        assert len(file_bytes) > 500
        return f"/uploads/{key}"

    monkeypatch.setattr(storage, "upload_file", fake_upload)
    monkeypatch.setattr(storage, "generate_key", lambda folder, filename: f"{folder}/test.mp4")

    images = [_tiny_jpeg_data_url()] * 3
    response = client.post(
        "/api/ai/album-video/render",
        headers=auth_headers,
        json={"images": images, "story": "测试旁白", "seconds_per_image": 1.5},
    )
    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["video_url"].startswith("/uploads/")
    assert data["has_narration_audio"] is False


def test_render_silent_slideshow_direct(tmp_path):
    try:
        ensure_ffmpeg()
    except AlbumVideoError:
        pytest.skip("ffmpeg not installed")

    import base64

    paths = []
    raw = base64.b64decode(_TINY_JPEG_B64)
    for i in range(3):
        path = tmp_path / f"f{i}.jpg"
        path.write_bytes(raw)
        paths.append(path)
    out = tmp_path / "out.mp4"
    render_silent_slideshow(paths, out, seconds_per_image=1.5, transition=0.5)
    assert out.exists() and out.stat().st_size > 500
