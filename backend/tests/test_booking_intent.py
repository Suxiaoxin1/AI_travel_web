from app.booking_links import (
    default_booking_title,
    detect_platform,
    is_allowed_booking_url,
    normalize_booking_url,
    normalize_platform,
)


def test_normalize_and_allowlist():
    raw = "https://vacations.ctrip.com/list/whole/sc.html?sv=%E7%94%98%E8%82%83&keyword=x#frag"
    assert is_allowed_booking_url(raw)
    normalized = normalize_booking_url(raw)
    assert normalized.startswith("https://vacations.ctrip.com/list/whole/sc.html?")
    assert "#" not in normalized
    assert not is_allowed_booking_url("https://example.com/foo")
    assert not is_allowed_booking_url("javascript:alert(1)")


def test_platform_normalization():
    assert normalize_platform("携程", "https://www.example.com") == "ctrip"
    assert normalize_platform("飞猪", "") == "fliggy"
    assert normalize_platform(None, "https://www.fliggy.com/item.htm?id=1") == "fliggy"
    assert detect_platform("https://m.ctrip.com/webapp/") == "ctrip"
    assert default_booking_title("甘肃", "ctrip") == "甘肃 · 携程"


def test_create_list_dedupe_patch_and_reject(client, auth_headers):
    search_url = "https://vacations.ctrip.com/list/whole/sc.html?keyword=%E7%94%98%E8%82%83%E8%B7%9F%E5%9B%A2%E6%B8%B8&sv=%E7%94%98%E8%82%83"
    created = client.post(
        "/api/bookings",
        headers=auth_headers,
        json={
            "url": search_url,
            "kind": "intent",
            "platform": "携程",
            "source_type": "province",
            "source_name": "甘肃",
            "link_type": "search",
            "keyword": "甘肃跟团游",
        },
    )
    assert created.status_code == 200, created.text
    body = created.json()["data"]
    assert body["kind"] == "intent"
    assert body["platform"] == "ctrip"
    assert body["title"] == "甘肃 · 携程"
    assert body["source_type"] == "province"
    booking_id = body["id"]

    # Dedupe: same URL (with fragment / different query order) updates instead of inserting
    shuffled = "https://vacations.ctrip.com/list/whole/sc.html?sv=%E7%94%98%E8%82%83&keyword=%E7%94%98%E8%82%83%E8%B7%9F%E5%9B%A2%E6%B8%B8#top"
    again = client.post(
        "/api/bookings",
        headers=auth_headers,
        json={
            "url": shuffled,
            "platform": "ctrip",
            "source_name": "甘肃",
            "title": "甘肃跟团游收藏",
            "note": "想春天去",
            "link_type": "search",
        },
    )
    assert again.status_code == 200
    assert again.json()["data"]["id"] == booking_id
    assert again.json()["data"]["title"] == "甘肃跟团游收藏"
    assert again.json()["data"]["note"] == "想春天去"
    assert "已在收藏中" in again.json().get("message", "")

    listed = client.get("/api/bookings?kind=intent", headers=auth_headers)
    assert listed.status_code == 200
    items = listed.json()["data"]
    assert len([i for i in items if i["id"] == booking_id]) == 1

    product_url = "https://www.fliggy.com/item.htm?id=123456"
    patched = client.patch(
        f"/api/bookings/{booking_id}",
        headers=auth_headers,
        json={"url": product_url, "link_type": "product", "title": "莫高窟门票"},
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["data"]["platform"] == "fliggy"
    assert patched.json()["data"]["link_type"] == "product"
    assert patched.json()["data"]["title"] == "莫高窟门票"

    rejected = client.post(
        "/api/bookings",
        headers=auth_headers,
        json={"url": "https://evil.example/phish", "source_name": "x"},
    )
    assert rejected.status_code == 400

    deleted = client.delete(f"/api/bookings/{booking_id}", headers=auth_headers)
    assert deleted.status_code == 200
