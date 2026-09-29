"""Finish VOLO prod: migrate + up film/backend/web. Password via STARWALK_SSH_PASS."""
from __future__ import annotations

import os
import time
from pathlib import Path

import paramiko

HOST = "111.230.144.219"
USER = "ubuntu"
PASSWORD = os.environ["STARWALK_SSH_PASS"]
REMOTE = "/opt/starwalk/releases/20260920-volo-film-v1"
LOCAL = Path(r"d:\ai-travel-homepage")

# Ensure missing build deps are present before web recreate
EXTRA_FILES = [
    "src/router/prototypeRoutes.js",
    "src/views/prototype/HomePrototype.vue",
]


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 3600) -> str:
    print("====", cmd[:260])
    _, o, e = client.exec_command(cmd, timeout=timeout, get_pty=True)
    out = o.read().decode("utf-8", errors="replace")
    err = e.read().decode("utf-8", errors="replace")
    if out:
        print(out[-16000:])
    if err.strip():
        print("ERR:", err[-2500:])
    return out


def upload(client: paramiko.SSHClient, rel: str) -> None:
    local = LOCAL / rel
    remote = f"{REMOTE}/{rel}"
    tmp = f"/tmp/volo_fin_{int(time.time() * 1000)}_{local.name}"
    sftp = client.open_sftp()
    try:
        sftp.put(str(local), tmp)
    finally:
        sftp.close()
    parent = str(Path(remote).as_posix().rsplit("/", 1)[0])
    run(
        client,
        f"sudo mkdir -p '{parent}' && sudo cp '{tmp}' '{remote}' && sudo chmod a+r '{remote}' && rm -f '{tmp}'",
        timeout=120,
    )
    print("uploaded", rel)


def main() -> None:
    missing = [f for f in EXTRA_FILES if not (LOCAL / f).exists()]
    if missing:
        raise SystemExit(f"missing local files: {missing}")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        HOST,
        username=USER,
        password=PASSWORD,
        timeout=30,
        allow_agent=False,
        look_for_keys=False,
        banner_timeout=40,
    )

    run(client, "echo SSH_OK; uptime; readlink -f /opt/starwalk/current")
    for rel in EXTRA_FILES:
        upload(client, rel)

    run(
        client,
        f"""
set -e
test -f {REMOTE}/src/router/prototypeRoutes.js
test -f {REMOTE}/services/film/server.js
test -f {REMOTE}/backend/alembic/versions/h2i3j4k5l6m7_add_app_settings.py
cd {REMOTE}/deploy
# rebuild web if needed (includes /film-api nginx + VITE_FILM_API_BASE)
sudo docker compose -f docker-compose.production.yml --env-file .env.production build web
sudo docker compose -f docker-compose.production.yml --env-file .env.production --profile migrate run --rm migrate
sudo docker compose -f docker-compose.production.yml --env-file .env.production up -d film backend web
""",
        timeout=5400,
    )

    time.sleep(10)
    run(
        client,
        r"""
set -e
cd /opt/starwalk/current/deploy
sudo docker compose -f docker-compose.production.yml --env-file .env.production ps
sudo docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.CreatedSince}}' | head -12
sudo docker exec deploy-backend-1 alembic current
sudo docker exec deploy-backend-1 python -c "from app.models import AppSetting; from app import runtime_secrets; print(AppSetting.__tablename__); print([i['key'] for i in runtime_secrets.MODEL_SECRET_FIELDS])"
curl -sS http://127.0.0.1:8001/health; echo
curl -sS -o /dev/null -w 'home:%{http_code}\n' http://127.0.0.1:8001/
curl -sS -o /dev/null -w 'journal:%{http_code}\n' http://127.0.0.1:8001/journal
curl -sS -o /dev/null -w 'admin_keys:%{http_code}\n' http://127.0.0.1:8001/admin/model-keys
echo FILM_HEALTH:
curl -sS -m 20 http://127.0.0.1:8001/film-api/api/health; echo
sudo docker exec deploy-web-1 sh -c 'grep -n film-api /etc/nginx/conf.d/default.conf | head'
sudo docker exec deploy-web-1 sh -c 'grep -l film-api /usr/share/nginx/html/assets/*.js 2>/dev/null | head -3 || echo NO_FILM_IN_JS'
""",
        timeout=240,
    )
    client.close()
    print("FINISH_DEPLOY_DONE")


if __name__ == "__main__":
    main()
