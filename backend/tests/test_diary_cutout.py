"""主体抠图：纯函数单测（只测解码/限额/失败路径，不跑真实模型）。"""
import base64
import io

import pytest

from app import diary_cutout


def _data_url(payload: bytes = b"not-an-image", mime: str = "image/jpeg") -> str:
    return f"data:{mime};base64," + base64.b64encode(payload).decode("ascii")


def test_decode_rejects_garbage():
    assert diary_cutout._decode_data_url("hello") is None
    assert diary_cutout._decode_data_url("") is None
    ok = diary_cutout._decode_data_url(_data_url(b"abc"))
    assert ok is not None and ok[0] == b"abc" and ok[1] == "image/jpeg"


def test_cutout_images_empty_and_non_list():
    assert diary_cutout.cutout_images([])["success"] is False
    assert diary_cutout.cutout_images(None)["success"] is False
    assert diary_cutout.cutout_images("x")["success"] is False


def test_cutout_one_bad_image_no_model_needed():
    # 解码失败在进模型前就返回，不需要 rembg 已安装
    r = diary_cutout._cutout_one("not-a-data-url", session=None)
    assert r == {"ok": False, "error": "图像数据解析失败"}


def test_cutout_images_caps_at_six(monkeypatch):
    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (8, 8), (10, 20, 30)).save(buf, format="PNG")
    one = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

    calls = []

    class FakeSession:
        pass

    def fake_remove(img, session=None):
        calls.append(1)
        return img.convert("RGBA")

    monkeypatch.setattr(diary_cutout, "_get_session", lambda: FakeSession())
    monkeypatch.setattr("rembg.remove", fake_remove)

    result = diary_cutout.cutout_images([one] * 8)
    assert result["success"] is True
    assert len(result["results"]) == 6
    assert len(calls) == 6
    assert result["results"][0]["ok"] is True
    assert result["results"][0]["dataUrl"].startswith("data:image/png;base64,")


def test_session_init_failure_surfaces_cleanly(monkeypatch):
    def _boom():
        raise RuntimeError("boom")

    monkeypatch.setattr(diary_cutout, "_get_session", _boom)
    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (4, 4)).save(buf, format="PNG")
    one = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")
    result = diary_cutout.cutout_images([one])
    assert result == {"success": False, "error": "boom"}
