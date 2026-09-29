"""Resume VOLO deploy: migrate + recreate film/backend/web."""
from pathlib import Path
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(
    "111.230.144.219",
    username="ubuntu",
    key_filename=str(Path.home() / ".ssh" / "starwalk_deploy_20260829"),
    timeout=25,
    allow_agent=False,
    look_for_keys=False,
)


def run(cmd: str, timeout: int = 3600) -> str:
    print("====", cmd[:220])
    _, o, e = c.exec_command(cmd, timeout=timeout, get_pty=True)
    out = o.read().decode("utf-8", "replace")
    err = e.read().decode("utf-8", "replace")
    if out:
        print(out[-14000:])
    if err.strip():
        print("ERR:", err[-2500:])
    return out


run("readlink -f /opt/starwalk/current; test -f /opt/starwalk/current/services/film/server.js; test -f /opt/starwalk/current/Dockerfile.web")
run(
    """
set -e
cd /opt/starwalk/current/deploy
# ensure web rebuild picks new Dockerfile.web + nginx + VITE_FILM_API_BASE
sudo docker compose -f docker-compose.production.yml --env-file .env.production build --no-cache web
sudo docker compose -f docker-compose.production.yml --env-file .env.production --profile migrate run --rm migrate
sudo docker compose -f docker-compose.production.yml --env-file .env.production up -d film backend web
""",
    timeout=5400,
)
run(
    r"""
set -e
cd /opt/starwalk/current/deploy
sudo docker compose -f docker-compose.production.yml --env-file .env.production ps
sudo docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.CreatedSince}}' | head -10
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
sudo docker exec deploy-web-1 sh -c 'grep -l film-api /usr/share/nginx/html/assets/*.js 2>/dev/null | head -3 || true'
sudo docker exec deploy-web-1 sh -c 'grep -n film-api /etc/nginx/conf.d/default.conf | head'
""",
    timeout=240,
)
c.close()
print("RESUME_DEPLOY_DONE")
