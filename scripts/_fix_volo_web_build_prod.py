"""Fix missing prototype routes and finish VOLO prod cutover."""
from __future__ import annotations

import time
from pathlib import Path

import paramiko

HOST = "111.230.144.219"
USER = "ubuntu"
KEY = str(Path.home() / ".ssh" / "starwalk_deploy_20260829")
REMOTE = "/opt/starwalk/releases/20260920-volo-film-v1"
LOCAL = Path(r"d:\ai-travel-homepage")

FILES = [
    "src/router/prototypeRoutes.js",
    "src/views/prototype/HomePrototype.vue",
]


def run(client, cmd: str, timeout: int = 3600) -> str:
    print("====", cmd[:240])
    _, o, e = client.exec_command(cmd, timeout=timeout, get_pty=True)
    out = o.read().decode("utf-8", "replace")
    err = e.read().decode("utf-8", "replace")
    if out:
        print(out[-14000:])
    if err.strip():
        print("ERR:", err[-2000:])
    return out


def upload(client, rel: str) -> None:
    local = LOCAL / rel
    remote = f"{REMOTE}/{rel}"
    tmp = f"/tmp/volo_fix_{int(time.time() * 1000)}_{local.name}"
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
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, key_filename=KEY, timeout=30, allow_agent=False, look_for_keys=False)
    for rel in FILES:
        upload(client, rel)

    run(
        client,
        f"""
set -e
test -f {REMOTE}/src/router/prototypeRoutes.js
test -f {REMOTE}/src/views/prototype/HomePrototype.vue
cd {REMOTE}/deploy
sudo docker compose -f docker-compose.production.yml --env-file .env.production build web
sudo docker compose -f docker-compose.production.yml --env-file .env.production --profile migrate run --rm migrate
sudo docker compose -f docker-compose.production.yml --env-file .env.production up -d film backend web
""",
        timeout=5400,
    )

    time.sleep(8)
    run(
        client,
        r"""
set -e
cd /opt/starwalk/current/deploy
sudo docker compose -f docker-compose.production.yml --env-file .env.production ps
sudo docker exec deploy-backend-1 alembic current
sudo docker exec deploy-backend-1 python - <<'PY'
from app.models import AppSetting
from app import runtime_secrets
print('table', AppSetting.__tablename__)
print('keys', [i['key'] for i in runtime_secrets.MODEL_SECRET_FIELDS])
PY
curl -sS http://127.0.0.1:8001/health; echo
curl -sS -o /dev/null -w 'home:%{http_code}\n' http://127.0.0.1:8001/
curl -sS -o /dev/null -w 'journal:%{http_code}\n' http://127.0.0.1:8001/journal
curl -sS -o /dev/null -w 'admin_keys:%{http_code}\n' http://127.0.0.1:8001/admin/model-keys
echo FILM_HEALTH:
curl -sS -m 20 http://127.0.0.1:8001/film-api/api/health; echo
sudo docker exec deploy-web-1 sh -c 'grep -n film-api /etc/nginx/conf.d/default.conf | head'
sudo docker exec deploy-web-1 sh -c 'grep -l film-api /usr/share/nginx/html/assets/*.js 2>/dev/null | head -3 || true'
""",
        timeout=240,
    )
    client.close()
    print("FIX_DEPLOY_DONE")


if __name__ == "__main__":
    main()
