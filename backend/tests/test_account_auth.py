from app import models
from app.config import settings


def test_account_register_login_refresh_and_logout(client):
    response = client.post("/api/auth/register", json={
        "account": "travel_user_01",
        "password": "new-password",
        "nickname": "旅行测试用户",
    })
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["account"] == "travel_user_01"
    assert body["user"]["nickname"] == "旅行测试用户"
    access = body["access_token"]
    refresh = body["refresh_token"]

    response = client.get("/api/users/me", headers={"Authorization": f"Bearer {access}"})
    assert response.status_code == 200
    assert response.json()["data"]["account"] == "travel_user_01"

    response = client.post("/api/auth/refresh", headers={"Authorization": f"Bearer {refresh}"})
    assert response.status_code == 200
    refreshed_access = response.json()["access_token"]

    response = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {refreshed_access}"})
    assert response.status_code == 200
    response = client.get("/api/users/me", headers={"Authorization": f"Bearer {refreshed_access}"})
    assert response.status_code == 401


def test_account_validation_duplicate_and_wrong_password(client):
    invalid = client.post("/api/auth/register", json={"account": "bad-name", "password": "new-password"})
    assert invalid.status_code == 422

    first = client.post("/api/auth/register", json={"account": "travel_user_02", "password": "new-password"})
    assert first.status_code == 200
    assert first.json()["user"]["nickname"] == "travel_user_02"

    duplicate = client.post("/api/auth/register", json={"account": "travel_user_02", "password": "other-password"})
    assert duplicate.status_code == 400

    wrong_password = client.post("/api/auth/login", json={"account": "travel_user_02", "password": "wrong-password"})
    assert wrong_password.status_code == 401


def test_bootstrap_account_receives_admin_role_on_registration(client, monkeypatch, db_session):
    monkeypatch.setattr(settings, "ADMIN_BOOTSTRAP_ACCOUNT", "bootstrap_admin")

    response = client.post("/api/auth/register", json={
        "account": "bootstrap_admin",
        "password": "new-password",
        "nickname": "引导管理员",
    })

    assert response.status_code == 200
    assert response.json()["user"]["is_admin"] is True
    user = db_session.query(models.User).filter(models.User.account == "bootstrap_admin").first()
    assert user is not None
    assert user.is_admin is True
    assert any(role.key == "admin" for role in user.roles)


def test_admin_routes_enforce_roles_and_revoke_suspended_sessions(client, auth_headers, db_session):
    denied = client.get("/api/admin/dashboard", headers=auth_headers)
    assert denied.status_code == 403

    admin = db_session.query(models.User).filter(models.User.account == "tester_01").first()
    role = db_session.query(models.Role).filter(models.Role.key == "admin").first()
    if role is None:
        role = models.Role(key="admin", name="管理员")
        db_session.add(role)
        db_session.flush()
    if role not in admin.roles:
        admin.roles.append(role)
    db_session.commit()

    dashboard = client.get("/api/admin/dashboard", headers=auth_headers)
    assert dashboard.status_code == 200
    dashboard_data = dashboard.json()["data"]
    assert "todos" in dashboard_data
    assert {item["key"] for item in dashboard_data["todos"]} >= {
        "hidden_posts",
        "hidden_comments",
        "draft_attractions",
        "recent_suspended",
    }
    assert "content_mix" in dashboard_data
    assert "user_status_mix" in dashboard_data

    target_register = client.post("/api/auth/register", json={
        "account": "admin_target",
        "password": "new-password",
        "nickname": "后台目标用户",
    })
    assert target_register.status_code == 200
    target_id = target_register.json()["user"]["id"]
    target_headers = {"Authorization": f"Bearer {target_register.json()['access_token']}"}

    users = client.get("/api/admin/users?keyword=admin_target", headers=auth_headers)
    assert users.status_code == 200
    assert users.json()["data"]["total"] == 1

    grant_admin = client.patch(f"/api/admin/users/{target_id}/admin", json={"is_admin": True}, headers=auth_headers)
    assert grant_admin.status_code == 200
    assert grant_admin.json()["data"]["is_admin"] is True

    created_admin = client.post("/api/admin/users", headers=auth_headers, json={
        "account": "ops_admin_01",
        "password": "admin-pass",
        "nickname": "运营管理员",
        "is_admin": True,
    })
    assert created_admin.status_code == 200
    assert created_admin.json()["data"]["account"] == "ops_admin_01"
    assert created_admin.json()["data"]["is_admin"] is True

    duplicate_admin = client.post("/api/admin/users", headers=auth_headers, json={
        "account": "ops_admin_01",
        "password": "admin-pass",
        "is_admin": True,
    })
    assert duplicate_admin.status_code == 400

    update = client.patch(f"/api/admin/users/{target_id}/status", json={"status": "suspended"}, headers=auth_headers)
    assert update.status_code == 200
    assert update.json()["data"]["status"] == "suspended"

    suspended_session = client.get("/api/users/me", headers=target_headers)
    assert suspended_session.status_code == 401

    self_suspend = client.patch(f"/api/admin/users/{admin.id}/status", json={"status": "suspended"}, headers=auth_headers)
    assert self_suspend.status_code == 400
    self_demotion = client.patch(f"/api/admin/users/{admin.id}/admin", json={"is_admin": False}, headers=auth_headers)
    assert self_demotion.status_code == 400

    audit_logs = client.get("/api/admin/audit-logs", headers=auth_headers)
    assert audit_logs.status_code == 200
    actions = {entry["action"] for entry in audit_logs.json()["data"]["items"]}
    assert {"user_admin_role_updated", "user_status_updated"}.issubset(actions)
