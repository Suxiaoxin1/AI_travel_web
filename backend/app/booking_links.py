"""Booking URL helpers: normalize, allowlist, platform detection."""
from __future__ import annotations

from typing import Optional
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

ALLOWED_HOST_SUFFIXES = (
    "ctrip.com",
    "trip.com",
    "fliggy.com",
    "taobao.com",
    "tmall.com",
)

PLATFORM_ALIASES = {
    "ctrip": "ctrip",
    "携程": "ctrip",
    "fliggy": "fliggy",
    "飞猪": "fliggy",
    "other": "other",
    "第三方": "other",
}


def normalize_platform(value: Optional[str], url: str = "") -> str:
    text = (value or "").strip()
    if text:
        key = text.lower() if text.isascii() else text
        mapped = PLATFORM_ALIASES.get(key) or PLATFORM_ALIASES.get(text)
        if mapped:
            return mapped
    return detect_platform(url)


def detect_platform(url: str) -> str:
    host = (urlparse(url).hostname or "").lower()
    if host.endswith("ctrip.com") or host.endswith("trip.com") or "携程" in url:
        return "ctrip"
    if (
        host.endswith("fliggy.com")
        or host.endswith("taobao.com")
        or host.endswith("tmall.com")
        or "飞猪" in url
    ):
        return "fliggy"
    return "other"


def is_allowed_booking_url(url: str) -> bool:
    try:
        parsed = urlparse((url or "").strip())
    except Exception:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    host = (parsed.hostname or "").lower()
    if not host:
        return False
    return any(host == suffix or host.endswith("." + suffix) for suffix in ALLOWED_HOST_SUFFIXES)


def normalize_booking_url(url: str) -> str:
    """Canonicalize URL for storage and dedupe (strip fragment, sort query)."""
    text = (url or "").strip()
    parsed = urlparse(text)
    scheme = (parsed.scheme or "https").lower()
    netloc = (parsed.netloc or "").lower()
    path = parsed.path or "/"
    # Drop trailing slash except root
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")
    query_items = parse_qsl(parsed.query, keep_blank_values=True)
    query_items.sort(key=lambda item: (item[0], item[1]))
    query = urlencode(query_items, doseq=True)
    return urlunparse((scheme, netloc, path, "", query, ""))


def default_booking_title(source_name: Optional[str], platform: str) -> str:
    platform_label = {"ctrip": "携程", "fliggy": "飞猪"}.get(platform, "第三方")
    name = (source_name or "").strip() or "旅行商品"
    return f"{name} · {platform_label}"
