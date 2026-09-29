"""Deploy VOLO film + app_settings to production (SSH key)."""
from __future__ import annotations

import os
import tarfile
import time
from pathlib import Path

import paramiko

HOST = "111.230.144.219"
USER = "ubuntu"
KEY_PATH = Path(os.path.expanduser(r"~\.ssh\starwalk_deploy_20260829"))
RELEASE = "20260920-volo-film-v1"
REMOTE = f"/opt/starwalk/releases/{RELEASE}"
LOCAL_ROOT = Path(r"d:\ai-travel-homepage")

FILES = [
    "backend/alembic/versions/h2i3j4k5l6m7_add_app_settings.py",
    "backend/app/models.py",
    "backend/app/config.py",
    "backend/app/runtime_secrets.py",
    "backend/app/routers/ai.py",
    "backend/app/routers/admin.py",
    "backend/.env.example",
    "src/utils/filmCompose.js",
    "src/components/VoloFilmWorkspace.vue",
    "src/views/TravelJournal.vue",
    "src/views/admin/AdminModelKeys.vue",
    "src/views/admin/AdminLayout.vue",
    "src/router/index.js",
    "deploy/docker-compose.production.yml",
    "deploy/nginx/default.conf",
    "deploy/FILM.md",
    "Dockerfile.web",
    ".env.example",
]

FILM_DIR = LOCAL_ROOT / "services" / "film"


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 3600) -> str:
    print("====", cmd[:280])
    _stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out:
        print(out[-12000:])
    if err.strip():
        print("ERR:", err[-2500:])
    return out


def upload(client: paramiko.SSHClient, local: Path, remote: str) -> None:
    tmp = f"/tmp/volo_deploy_{int(time.time() * 1000)}_{local.name}"
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
    print("uploaded", local.as_posix(), "->", remote)


def upload_film_tree(client: paramiko.SSHClient) -> None:
    archive = LOCAL_ROOT / "scripts" / "_film_bundle.tgz"
    if archive.exists():
        archive.unlink()
    with tarfile.open(archive, "w:gz") as tar:
        for path in FILM_DIR.rglob("*"):
            if not path.is_file():
                continue
            rel = path.relative_to(FILM_DIR).as_posix()
            if rel.startswith("node_modules/") or rel.startswith("uploads/"):
                continue
            if rel.endswith(".log") or rel == ".env":
                continue
            tar.add(path, arcname=f"film/{rel}")
    tmp = f"/tmp/volo_film_{int(time.time() * 1000)}.tgz"
    sftp = client.open_sftp()
    try:
        sftp.put(str(archive), tmp)
    finally:
        sftp.close()
    run(
        client,
        f"""
set -e
sudo mkdir -p {REMOTE}/services
sudo rm -rf {REMOTE}/services/film
sudo mkdir -p /tmp/volo_film_extract
sudo tar -xzf {tmp} -C /tmp/volo_film_extract
sudo mv /tmp/volo_film_extract/film {REMOTE}/services/film
sudo chown -R ubuntu:ubuntu {REMOTE}/services/film
rm -f {tmp}
sudo test -f {REMOTE}/services/film/server.js
sudo test -f {REMOTE}/services/film/package-lock.json
ls {REMOTE}/services/film | head
""",
        timeout=300,
    )
    archive.unlink(missing_ok=True)
    print("uploaded services/film tree")


def main() -> None:
    missing = [f for f in FILES if not (LOCAL_ROOT / f).exists()]
    if missing:
        raise SystemExit(f"missing local files: {missing}")
    if not FILM_DIR.is_dir() or not (FILM_DIR / "server.js").exists():
        raise SystemExit("missing services/film")
    if not KEY_PATH.exists():
        raise SystemExit(f"missing deploy key: {KEY_PATH}")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        HOST,
        port=22,
        username=USER,
        key_filename=str(KEY_PATH),
        timeout=30,
        allow_agent=False,
        look_for_keys=False,
    )

    run(
        client,
        f"""
set -e
SRC=$(readlink -f /opt/starwalk/current)
echo SRC=$SRC
sudo rm -rf {REMOTE}
sudo mkdir -p {REMOTE}
sudo rsync -a --delete "$SRC"/ {REMOTE}/
if [ -L {REMOTE} ]; then echo 'RELEASE_IS_SYMLINK'; exit 1; fi
sudo test -f {REMOTE}/deploy/.env.production || sudo cp "$SRC"/deploy/.env.production {REMOTE}/deploy/.env.production
sudo chown -R ubuntu:ubuntu {REMOTE}
ls -ld {REMOTE}
""",
        timeout=600,
    )

    for rel in FILES:
        upload(client, LOCAL_ROOT / rel, f"{REMOTE}/{rel}")
    upload_film_tree(client)

    run(
        client,
        f"""
set -e
sudo ln -sfn {REMOTE} /opt/starwalk/current
echo CURRENT=$(readlink /opt/starwalk/current)
echo RESOLVED=$(readlink -f /opt/starwalk/current)
test "$(readlink -f /opt/starwalk/current)" = "{REMOTE}"
test -f {REMOTE}/backend/app/runtime_secrets.py
test -f {REMOTE}/backend/alembic/versions/h2i3j4k5l6m7_add_app_settings.py
test -f {REMOTE}/src/utils/filmCompose.js
test -f {REMOTE}/src/components/VoloFilmWorkspace.vue
test -f {REMOTE}/src/views/admin/AdminModelKeys.vue
test -f {REMOTE}/services/film/server.js
grep -n 'film:' {REMOTE}/deploy/docker-compose.production.yml | head
grep -n 'film-api' {REMOTE}/deploy/nginx/default.conf | head
grep -n 'VITE_FILM_API_BASE' {REMOTE}/Dockerfile.web | head
""",
        timeout=120,
    )

    run(
        client,
        """
set -e
cd /opt/starwalk/current/deploy
sudo docker compose -f docker-compose.production.yml --env-file .env.production --profile migrate build film backend migrate web
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
sudo docker exec deploy-backend-1 alembic current
sudo docker exec deploy-backend-1 python - <<'PY'
from app.models import AppSetting
from app import runtime_secrets
print('AppSetting_table', AppSetting.__tablename__)
print('secret_fields', [i['key'] for i in runtime_secrets.MODEL_SECRET_FIELDS])
PY
curl -sS http://127.0.0.1:8001/health; echo
curl -sS -o /dev/null -w 'home:%{http_code}\n' http://127.0.0.1:8001/
curl -sS -o /dev/null -w 'journal:%{http_code}\n' http://127.0.0.1:8001/journal
curl -sS -o /dev/null -w 'admin_keys:%{http_code}\n' http://127.0.0.1:8001/admin/model-keys
echo 'FILM_HEALTH:'
curl -sS -m 20 http://127.0.0.1:8001/film-api/api/health || true
echo
sudo docker exec deploy-web-1 sh -c 'grep -l film-api /usr/share/nginx/html/assets/*.js 2>/dev/null | head -3 || true'
sudo docker exec deploy-web-1 sh -c 'grep -l VoloFilmWorkspace /usr/share/nginx/html/assets/*.js 2>/dev/null | head -2 || ls /usr/share/nginx/html/assets/*.js | head -3'
""",
        timeout=240,
    )
    client.close()
    print("DEPLOY_DONE", RELEASE)


if __name__ == "__main__":
    main()
