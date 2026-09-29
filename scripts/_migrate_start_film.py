"""Migrate app_settings + ensure film/backend up. Auth: key then STARWALK_SSH_PASS."""
from __future__ import annotations

import os
import sys
import time
from pathlib import Path

import paramiko

HOST = "111.230.144.219"
USER = "ubuntu"
REMOTE = "/opt/starwalk/releases/20260920-volo-film-v1"
KEY = str(Path.home() / ".ssh" / "starwalk_deploy_20260829")
PASSWORD = os.environ.get("STARWALK_SSH_PASS", "")


def connect(retries: int = 12) -> paramiko.SSHClient:
    last: Exception | None = None
    for i in range(retries):
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            print(f"connect try {i + 1}/{retries}", flush=True)
            kwargs = dict(
                hostname=HOST,
                username=USER,
                timeout=35,
                allow_agent=False,
                look_for_keys=False,
                banner_timeout=90,
                auth_timeout=40,
            )
            if i % 2 == 0 and Path(KEY).exists():
                print("auth=key", flush=True)
                client.connect(key_filename=KEY, **kwargs)
            elif PASSWORD:
                print("auth=password", flush=True)
                client.connect(password=PASSWORD, **kwargs)
            else:
                print("auth=key-fallback", flush=True)
                client.connect(key_filename=KEY, **kwargs)
            print("SSH_OK", flush=True)
            return client
        except Exception as exc:  # noqa: BLE001
            last = exc
            print(f"fail: {type(exc).__name__}: {exc}", flush=True)
            try:
                client.close()
            except Exception:  # noqa: BLE001
                pass
            time.sleep(8 + i * 3)
    raise SystemExit(f"SSH failed after retries: {last}")


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 1800) -> str:
    print("====", cmd[:240], flush=True)
    _, out_ch, err_ch = client.exec_command(cmd, timeout=timeout, get_pty=True)
    out = out_ch.read().decode("utf-8", "replace")
    err = err_ch.read().decode("utf-8", "replace")
    if out:
        print(out[-14000:], flush=True)
    if err.strip():
        print("ERR:", err[-2000:], flush=True)
    return out


def main() -> None:
    client = connect()
    run(
        client,
        "uptime; free -h | head -2; readlink -f /opt/starwalk/current; "
        "test -f /opt/starwalk/current/backend/alembic/versions/h2i3j4k5l6m7_add_app_settings.py && echo MIG_OK; "
        "test -f /opt/starwalk/current/services/film/server.js && echo FILM_SRC_OK; "
        "sudo docker ps -a --format 'table {{.Names}}\t{{.Status}}' | head -20",
        timeout=120,
    )
    run(
        client,
        f"""
set -e
cd {REMOTE}/deploy
sudo docker compose -f docker-compose.production.yml --env-file .env.production --profile migrate run --rm migrate
sudo docker compose -f docker-compose.production.yml --env-file .env.production up -d film backend web
sleep 12
sudo docker compose -f docker-compose.production.yml --env-file .env.production ps
sudo docker exec deploy-backend-1 alembic current
echo BACKEND_HEALTH:
curl -sS -m 15 http://127.0.0.1:8000/health || curl -sS -m 15 http://127.0.0.1:8001/health || true
echo
echo FILM_HEALTH:
curl -sS -m 20 http://127.0.0.1:8001/film-api/api/health || true
echo
sudo docker logs --tail 30 deploy-film-1 2>&1 || true
sudo docker logs --tail 30 deploy-backend-1 2>&1 || true
""",
        timeout=2400,
    )
    client.close()
    print("MIGRATE_FILM_DONE", flush=True)


if __name__ == "__main__":
    main()
