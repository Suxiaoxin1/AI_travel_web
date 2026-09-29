from app import models


def _make_admin(db_session, auth_headers):
    admin = db_session.query(models.User).filter(models.User.account == "tester_01").first()
    role = db_session.query(models.Role).filter(models.Role.key == "admin").first()
    if role is None:
        role = models.Role(key="admin", name="管理员")
        db_session.add(role)
        db_session.flush()
    if role not in admin.roles:
        admin.roles.append(role)
        db_session.commit()
    return auth_headers


def _register(client, account, nickname):
    response = client.post("/api/auth/register", json={
        "account": account,
        "password": "new-password",
        "nickname": nickname,
    })
    assert response.status_code == 200
    body = response.json()
    return body["user"], {"Authorization": f"Bearer {body['access_token']}"}


def test_admin_manages_attractions_and_public_hot_list(client, auth_headers, db_session):
    headers = _make_admin(db_session, auth_headers)

    created = client.post("/api/admin/attractions", headers=headers, json={
        "name": "测试运营景点",
        "province": "测试省",
        "city": "测试市",
        "short_desc": "用于验证后台景点管理与前台联动。",
        "rating": 4.8,
        "best_season": "春季",
        "recommended_duration": "半天",
        "sort_order": 1,
        "tags": ["测试", "运营"],
        "status": "published",
    })
    assert created.status_code == 200
    attraction = created.json()["data"]

    admin_list = client.get("/api/admin/attractions?keyword=测试运营景点", headers=headers)
    assert admin_list.status_code == 200
    assert admin_list.json()["data"]["total"] == 1

    public_list = client.get("/api/attractions/hot?limit=60")
    assert public_list.status_code == 200
    assert any(item["id"] == attraction["id"] for item in public_list.json()["data"])

    archived = client.delete(f"/api/admin/attractions/{attraction['id']}", headers=headers)
    assert archived.status_code == 200
    public_list = client.get("/api/attractions/hot?limit=60")
    assert not any(item["id"] == attraction["id"] for item in public_list.json()["data"])

    logs = client.get("/api/admin/audit-logs?target_type=attraction", headers=headers)
    assert logs.status_code == 200
    actions = {item["action"] for item in logs.json()["data"]["items"]}
    assert {"attraction_created", "attraction_archived"}.issubset(actions)


def test_admin_moderates_shares_comments_and_user_detail(client, auth_headers, db_session):
    headers = _make_admin(db_session, auth_headers)
    user, user_headers = _register(client, "content_owner", "内容作者")

    created_post = client.post("/api/posts", headers=user_headers, json={
        "title": "待审核旅行分享",
        "content": "这是一篇需要由管理员审核展示状态的旅行分享。",
        "location": "测试城市",
        "tags": ["测试"],
    })
    assert created_post.status_code == 200
    post = created_post.json()["data"]

    created_comment = client.post(f"/api/posts/{post['id']}/comments", headers=user_headers, json={"content": "待审核评论"})
    assert created_comment.status_code == 200
    comment = created_comment.json()["data"]

    detail = client.get(f"/api/admin/users/{user['id']}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["data"]["posts_count"] == 1
    assert detail.json()["data"]["comments_count"] == 1

    hidden_post = client.patch(f"/api/admin/posts/{post['id']}/status", headers=headers, json={"status": "hidden", "reason": "测试隐藏"})
    assert hidden_post.status_code == 200
    assert client.get(f"/api/posts/{post['id']}").status_code == 404

    restored_post = client.patch(f"/api/admin/posts/{post['id']}/status", headers=headers, json={"status": "published"})
    assert restored_post.status_code == 200
    hidden_comment = client.patch(f"/api/admin/comments/{comment['id']}/status", headers=headers, json={"status": "hidden", "reason": "测试评论隐藏"})
    assert hidden_comment.status_code == 200

    public_detail = client.get(f"/api/posts/{post['id']}")
    assert public_detail.status_code == 200
    assert public_detail.json()["data"]["comments"] == []

    logs = client.get("/api/admin/audit-logs", headers=headers)
    assert logs.status_code == 200
    actions = {item["action"] for item in logs.json()["data"]["items"]}
    assert {"post_status_updated", "comment_status_updated"}.issubset(actions)

    # 当前测试套件共用测试数据库，收尾归档本测试创建的公开游记，避免影响既有社区列表断言。
    cleanup = client.patch(f"/api/admin/posts/{post['id']}/status", headers=headers, json={"status": "deleted", "reason": "测试清理"})
    assert cleanup.status_code == 200
