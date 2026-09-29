"""Inspect vision chat response shape for current AGNES_VISION_MODEL."""
from __future__ import annotations

import base64
import json
import os
import urllib.request

BASE = os.environ["AGNES_API_BASE"].rstrip("/")
KEY = os.environ["AGNES_API_KEY"]
MODEL = (os.environ.get("AGNES_VISION_MODEL") or "glm-5.3-flash").strip()
SAMPLE = os.environ.get("VISION_SAMPLE_PATH", "/tmp/vision_sample.jpg")


def main() -> None:
    raw = open(SAMPLE, "rb").read()
    data_url = "data:image/jpeg;base64," + base64.b64encode(raw).decode()
    body = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "你是旅行手帐编辑。只返回一个 JSON 对象，不要 Markdown，"
                            '不要解释。格式：{"title":"不超过8字中文","scene":"不超过6字中文"}'
                        ),
                    },
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
        "max_tokens": 160,
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
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8", errors="replace"))
    choice = (data.get("choices") or [{}])[0]
    msg = choice.get("message") or {}
    print("model", MODEL)
    print("finish", choice.get("finish_reason"))
    print("msg_keys", sorted(msg.keys()))
    print("content", repr((msg.get("content") or "")[:240]))
    print("reasoning", repr((msg.get("reasoning_content") or "")[:240]))


if __name__ == "__main__":
    main()
