"""Confirm vision models return parseable Chinese JSON."""
from __future__ import annotations

import base64
import json
import os
import re
import sys
import urllib.error
import urllib.request

BASE = os.environ["AGNES_API_BASE"].rstrip("/")
KEY = os.environ["AGNES_API_KEY"]
SAMPLE = os.environ.get("VISION_SAMPLE_PATH", "/tmp/vision_sample.jpg")
MODELS = [
    os.environ.get("AGNES_VISION_MODEL") or "glm-5.3-flash",
    "glm-5.3",
    "gpt-5.5",
    "glm-5.2",
]


def extract_text(msg: dict) -> str:
    content = msg.get("content")
    if isinstance(content, str) and content.strip():
        return content.strip()
    reasoning = msg.get("reasoning_content")
    if isinstance(reasoning, str) and reasoning.strip():
        return reasoning.strip()
    return ""


def call(model: str, data_url: str, max_tokens: int = 1200) -> tuple[int, str, str]:
    body = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "你是旅行手帐视觉编辑。只返回 JSON，不要 Markdown，不要解释。"
                            '格式：{"title":"不超过8字中文","scene":"不超过6字中文"}'
                        ),
                    },
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        "max_tokens": max_tokens,
        "temperature": 0.2,
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
        with urllib.request.urlopen(req, timeout=150) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="replace"))
            choice = (data.get("choices") or [{}])[0]
            msg = choice.get("message") or {}
            text = extract_text(msg)
            finish = str(choice.get("finish_reason") or "")
            return resp.status, finish, text
    except urllib.error.HTTPError as exc:
        return exc.code, "http", exc.read().decode("utf-8", errors="replace")[:160]
    except Exception as exc:  # noqa: BLE001
        return 0, type(exc).__name__, str(exc)[:160]


def main() -> int:
    raw = open(SAMPLE, "rb").read()
    data_url = "data:image/jpeg;base64," + base64.b64encode(raw).decode()
    picked = None
    for model in MODELS:
        status, finish, text = call(model, data_url)
        has_json = bool(re.search(r"\{[\s\S]*\}", text or ""))
        print(f"{model}\tstatus={status}\tfinish={finish}\thas_json={has_json}")
        print("text", repr((text or "")[:220]))
        if status == 200 and has_json:
            picked = model
            break
    print("PICK", picked or "none")
    return 0 if picked else 1


if __name__ == "__main__":
    sys.exit(main())
