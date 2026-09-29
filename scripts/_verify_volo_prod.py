"""Verify VOLO production cutover state after SSH drop."""
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
cmds = [
    "readlink -f /opt/starwalk/current",
    "cd /opt/starwalk/current/deploy && sudo docker compose -f docker-compose.production.yml --env-file .env.production ps",
    "sudo docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.CreatedSince}}' | head -12",
    "sudo docker exec deploy-backend-1 alembic current || true",
    "sudo docker exec deploy-backend-1 python -c \"from app.models import AppSetting; from app import runtime_secrets; print(AppSetting.__tablename__); print([i['key'] for i in runtime_secrets.MODEL_SECRET_FIELDS])\" || true",
    "curl -sS http://127.0.0.1:8001/health; echo",
    "curl -sS -m 20 http://127.0.0.1:8001/film-api/api/health; echo",
    "sudo docker exec deploy-web-1 sh -c 'grep -n film-api /etc/nginx/conf.d/default.conf | head'",
    "sudo docker exec deploy-web-1 sh -c 'grep -l film-api /usr/share/nginx/html/assets/*.js 2>/dev/null | head -3 || echo NO_FILM_API_IN_JS'",
]
for cmd in cmds:
    print("====", cmd[:140])
    _, o, e = c.exec_command(cmd, timeout=90)
    print(o.read().decode("utf-8", "replace")[-4000:])
    err = e.read().decode("utf-8", "replace").strip()
    if err:
        print("ERR", err[-1000:])
c.close()
