"""Find a working vision model on the configured Agnes/KabuAI gateway."""
from __future__ import annotations

import base64
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

BASE = os.environ["AGNES_API_BASE"].rstrip("/")
KEY = os.environ["AGNES_API_KEY"]
SAMPLE = Path("/tmp/sample.jpg")
MODELS = [
    os.environ.get("AGNES_VISION_MODEL") or "glm-5.3-flash",
    "glm-5.3-flash",
    "glm-5.3",
    "gpt-5.5",
    "glm-5.2",
]


def data_url() -> str:
    raw = SAMPLE.read_bytes()
    if len(raw) > 450_000:
        raw = raw[:450_000]
    return "data:image/jpeg;base64," + base64.b64encode(raw).decode("ascii")


def call(model: str, image: str, timeout: int = 75) -> tuple[int, str]:
    body = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": '只返回JSON: {"title":"不超过8字","scene":"不超过8字"}',
                    },
                    {"type": "image_url", "image_url": {"url": image}},
                ],
            }
        ],
        "max_tokens": 120,
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
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="replace"))
            message = ((data.get("choices") or [{}])[0].get("message") or {})
            content = message.get("content") or message.get("reasoning_content") or ""
            return resp.status, str(content)
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", errors="replace")[:200]
    except Exception as exc:  # noqa: BLE001
        return 0, f"{type(exc).__name__}: {exc}"


def main() -> int:
    if not SAMPLE.exists():
        print("missing sample", SAMPLE)
        return 2
    image = data_url()
    print("base", BASE, "sample_bytes", SAMPLE.stat().st_size)
    seen: set[str] = set()
    for model in MODELS:
        if model in seen:
            continue
        seen.add(model)
        status, result = call(model, image)
        print(f"model={model} status={status} result={result[:180]!r}")
        if status == 200 and result.strip() and "{" in result:
            print("SELECTED", model)
            return 0
        if status == 200 and result.strip():
            print("SELECTED_TEXT", model)
            return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
