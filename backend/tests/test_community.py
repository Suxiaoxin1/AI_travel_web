def test_create_and_list_post(client, auth_headers):
    resp = client.post("/api/posts", headers=auth_headers, json={
        "title": "测试游记",
        "content": "游记内容",
        "location": "杭州",
        "rating": 5,
        "tags": ["测试"],
        "images": ["http://example.com/a.jpg"]
    })
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["title"] == "测试游记"
    assert data["author"] == "tester"
    post_id = data["id"]

    resp = client.get("/api/posts", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()["data"]) == 1

    resp = client.get(f"/api/posts/{post_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["content"] == "游记内容"


def test_like_toggle(client, auth_headers):
    resp = client.post("/api/posts", headers=auth_headers, json={
        "title": "点赞测试", "content": "内容"
    })
    post_id = resp.json()["data"]["id"]

    resp = client.post(f"/api/posts/{post_id}/likes", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["liked"] is True
    assert resp.json()["data"]["likes_count"] == 1

    resp = client.post(f"/api/posts/{post_id}/likes", headers=auth_headers)
    assert resp.json()["data"]["liked"] is False
    assert resp.json()["data"]["likes_count"] == 0


def test_comment(client, auth_headers):
    resp = client.post("/api/posts", headers=auth_headers, json={
        "title": "评论测试", "content": "内容"
    })
    post_id = resp.json()["data"]["id"]

    resp = client.post(f"/api/posts/{post_id}/comments", headers=auth_headers, json={
        "content": "写得不错"
    })
    assert resp.status_code == 200
    comment_id = resp.json()["data"]["id"]

    resp = client.get(f"/api/posts/{post_id}", headers=auth_headers)
    assert resp.json()["data"]["comments_count"] == 1

    resp = client.delete(f"/api/posts/{post_id}/comments/{comment_id}", headers=auth_headers)
    assert resp.status_code == 200

    resp = client.get(f"/api/posts/{post_id}", headers=auth_headers)
    assert resp.json()["data"]["comments_count"] == 0
