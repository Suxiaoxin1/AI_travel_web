"""Deploy booking-intent feature to production (SSH key)."""
from __future__ import annotations

import os
import time
from pathlib import Path

import paramiko

HOST = "111.230.144.219"
USER = "ubuntu"
KEY_PATH = Path(os.path.expanduser(r"~\.ssh\starwalk_deploy_20260829"))
RELEASE = "20260910-booking-intent-v1"
REMOTE = f"/opt/starwalk/releases/{RELEASE}"
LOCAL_ROOT = Path(r"d:\ai-travel-homepage")

FILES = [
    "backend/app/booking_links.py",
    "backend/app/routers/bookings.py",
    "backend/app/models.py",
    "backend/app/schemas.py",
    "backend/alembic/versions/g1h2i3j4k5l6_add_booking_intent_fields.py",
    "src/utils/bookingLinks.js",
    "src/stores/bookingStore.js",
    "src/stores/uiStore.js",
    "src/components/BookingConfirmModal.vue",
    "src/components/ProvincePanel.vue",
    "src/components/MyDrawer.vue",
    "src/components/AppToast.vue",
    "src/views/Bookings.vue",
    "src/App.vue",
]


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 3600) -> str:
    print("====", cmd[:240])
    _stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out:
        print(out[-9000:])
    if err.strip():
        print("ERR:", err[-2000:])
    return out


def upload(client: paramiko.SSHClient, local: Path, remote: str) -> None:
    tmp = f"/tmp/booking_deploy_{int(time.time() * 1000)}_{local.name}"
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


def main() -> None:
    missing = [f for f in FILES if not (LOCAL_ROOT / f).exists()]
    if missing:
        raise SystemExit(f"missing local files: {missing}")

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

    # Materialize a real directory release (never copy a symlink as a symlink)
    run(
        client,
        f"""
set -e
SRC=$(readlink -f /opt/starwalk/current)
echo SRC=$SRC
sudo rm -rf {REMOTE}
sudo mkdir -p {REMOTE}
sudo rsync -a --delete "$SRC"/ {REMOTE}/
# Ensure not a nested symlink release
if [ -L {REMOTE} ]; then echo 'RELEASE_IS_SYMLINK'; exit 1; fi
sudo test -f {REMOTE}/deploy/.env.production || sudo cp "$SRC"/deploy/.env.production {REMOTE}/deploy/.env.production
sudo chown -R ubuntu:ubuntu {REMOTE}
ls -ld {REMOTE}
""",
        timeout=600,
    )

    for rel in FILES:
        upload(client, LOCAL_ROOT / rel, f"{REMOTE}/{rel}")

    run(
        client,
        f"""
set -e
sudo ln -sfn {REMOTE} /opt/starwalk/current
echo CURRENT=$(readlink /opt/starwalk/current)
echo RESOLVED=$(readlink -f /opt/starwalk/current)
test "$(readlink -f /opt/starwalk/current)" = "{REMOTE}"
test -f {REMOTE}/backend/app/booking_links.py
grep -n 'router.patch\\|kind' {REMOTE}/backend/app/routers/bookings.py | head
grep -n "kind = Column" {REMOTE}/backend/app/models.py | head
test -f {REMOTE}/src/components/AppToast.vue
""",
        timeout=120,
    )

    # Rebuild images first (migrate is a separate image from backend), then upgrade DB
    run(
        client,
        """
set -e
cd /opt/starwalk/current/deploy
sudo docker compose -f docker-compose.production.yml --env-file .env.production --profile migrate build --no-cache backend migrate web
sudo docker compose -f docker-compose.production.yml --env-file .env.production --profile migrate run --rm migrate
sudo docker compose -f docker-compose.production.yml --env-file .env.production up -d backend web
""",
        timeout=3600,
    )

    time.sleep(8)
    run(
        client,
        r"""
set -e
sudo docker compose -f /opt/starwalk/current/deploy/docker-compose.production.yml --env-file /opt/starwalk/current/deploy/.env.production ps
sudo docker exec deploy-backend-1 alembic current
sudo docker exec deploy-backend-1 grep -n 'router.patch\|def update_booking' /app/app/routers/bookings.py
sudo docker exec deploy-backend-1 python - <<'PY'
from app.models import Booking
print('has_kind', hasattr(Booking, 'kind'))
print('has_title', hasattr(Booking, 'title'))
print('has_link_type', hasattr(Booking, 'link_type'))
PY
curl -sS -o /dev/null -w 'home:%{http_code}\n' http://127.0.0.1:8001/
curl -sS -o /dev/null -w 'bookings_page:%{http_code}\n' http://127.0.0.1:8001/bookings
curl -sS http://127.0.0.1:8001/health; echo
# PATCH should be 401/422, not 405
code=$(curl -sS -o /tmp/patch_out.txt -w '%{http_code}' -X PATCH http://127.0.0.1:8001/api/bookings/1 -H 'Content-Type: application/json' -d '{"title":"x"}')
echo PATCH_HTTP:$code
head -c 200 /tmp/patch_out.txt; echo
sudo docker exec deploy-web-1 sh -c 'grep -l 升级为商品链接 /usr/share/nginx/html/assets/*.js 2>/dev/null | head -2 || true'
""",
        timeout=180,
    )
    client.close()
    print("DEPLOY_DONE", RELEASE)


if __name__ == "__main__":
    main()
