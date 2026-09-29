"""Smoke-test Agnes vision chat via container env (no Pillow)."""
from __future__ import annotations

import base64
import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.environ["AGNES_API_BASE"].rstrip("/")
MODEL = (os.environ.get("AGNES_VISION_MODEL") or "glm-5.3-flash").strip()
SAMPLE_PATH = os.environ.get("VISION_SAMPLE_PATH", "/tmp/vision_sample.jpg")


def load_data_url(path: str) -> str:
    with open(path, "rb") as fh:
        raw = fh.read()
    if len(raw) < 1024:
        raise SystemExit(f"sample too small: {len(raw)} bytes")
    return "data:image/jpeg;base64," + base64.b64encode(raw).decode()


def call(model: str, data_url: str, timeout: int = 120) -> tuple[int, str]:
    body = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": '只返回 JSON：{"title":"不超过8字中文","scene":"不超过6字"}',
                    },
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        "max_tokens": 1200,
        "temperature": 0.2,
    }
    req = urllib.request.Request(
        f"{BASE}/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {os.environ['AGNES_API_KEY']}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="replace"))
            msg = ((data.get("choices") or [{}])[0].get("message") or {})
            content = msg.get("content") or msg.get("reasoning_content") or ""
            return resp.status, content or "empty"
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:200]
        return exc.code, detail
    except Exception as exc:  # noqa: BLE001
        return 0, f"{type(exc).__name__}: {exc}"


def main() -> int:
    print("model", MODEL)
    host = BASE.replace("https://", "").replace("http://", "").split("/")[0]
    print("base_host", host)
    data_url = load_data_url(SAMPLE_PATH)
    print("sample_kb", round(len(data_url) / 1024, 1))
    status, result = call(MODEL, data_url)
    print("status", status)
    print("result", str(result)[:180])
    return 0 if status == 200 and str(result).strip() else 1


if __name__ == "__main__":
    sys.exit(main())
