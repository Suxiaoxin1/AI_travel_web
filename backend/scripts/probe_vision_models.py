"""Probe which KabuAI chat models accept vision inputs."""
from __future__ import annotations

import base64
import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.environ["AGNES_API_BASE"].rstrip("/")
KEY = os.environ["AGNES_API_KEY"]
SAMPLE_PATH = os.environ.get("VISION_SAMPLE_PATH", "/tmp/vision_sample.jpg")
CANDIDATES = [
    "glm-5.3-flash",
    "glm-5.3",
    "gpt-5.5",
    "glm-5.2",
    "MiniMax-M2.7-highspeed",
    "kimi-k3",
    "deepseek-v4-flash",
]


def call(model: str, data_url: str, timeout: int = 100) -> tuple[int, str]:
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
        "max_tokens": 80,
    }
    req = urllib.request.Request(
        f"{BASE}/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="replace"))
            msg = ((data.get("choices") or [{}])[0].get("message") or {})
            content = msg.get("content") or msg.get("reasoning_content") or ""
            return resp.status, str(content)[:160] or "empty"
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", errors="replace")[:160]
    except Exception as exc:  # noqa: BLE001
        return 0, f"{type(exc).__name__}: {exc}"


def main() -> int:
    raw = open(SAMPLE_PATH, "rb").read()
    data_url = "data:image/jpeg;base64," + base64.b64encode(raw).decode()
    print("sample_kb", round(len(raw) / 1024, 1))
    picked = None
    for model in CANDIDATES:
        status, result = call(model, data_url)
        print(f"{model}\t{status}\t{result}")
        if status == 200 and result.strip() and result != "empty":
            picked = model
            break
    print("PICK", picked or "none")
    return 0 if picked else 1


if __name__ == "__main__":
    sys.exit(main())
