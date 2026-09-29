"""Probe image generation models on the configured gateway."""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.environ["AGNES_API_BASE"].rstrip("/")
KEY = os.environ["AGNES_API_KEY"]
MODELS = [
    "gpt-image-2",
    "agnes-image-2.1-flash",
    "agnes-image-2.0",
]


def call(model: str, with_refs: bool = False) -> tuple[int, str]:
    body: dict = {
        "model": model,
        "prompt": "A simple warm travel scrapbook page collage, vertical 3:4, no text",
        "size": "2K",
        "n": 1,
        "ratio": "3:4",
        "extra_body": {"response_format": "url"},
    }
    if with_refs:
        # tiny 1x1 jpeg data url as reference shape check
        body["extra_body"]["image"] = [
            "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//Z"
        ]
    req = urllib.request.Request(
        f"{BASE}/images/generations",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="replace"))
            url = ""
            if isinstance(data.get("data"), list) and data["data"]:
                url = str(data["data"][0].get("url") or data["data"][0].get("b64_json") or "")[:80]
            return resp.status, url or json.dumps(data)[:160]
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", errors="replace")[:180]
    except Exception as exc:  # noqa: BLE001
        return 0, f"{type(exc).__name__}: {exc}"


def main() -> int:
    picked = None
    for model in MODELS:
        status, result = call(model, with_refs=False)
        print(f"{model}\tnoref\t{status}\t{result}")
        if status == 200:
            status2, result2 = call(model, with_refs=True)
            print(f"{model}\trefs\t{status2}\t{result2}")
            if status2 == 200:
                picked = model
                break
            # still usable without refs? keep as candidate
            picked = picked or model
            break
    print("PICK", picked or "none")
    return 0 if picked else 1


if __name__ == "__main__":
    sys.exit(main())
