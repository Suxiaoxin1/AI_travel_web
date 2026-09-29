"""Read-only production readiness check for VOLO deploy."""
from __future__ import annotations

from pathlib import Path

import paramiko

HOST = "111.230.144.219"
USER = "ubuntu"
KEY = str(Path.home() / ".ssh" / "starwalk_deploy_20260829")

CMDS = [
    "readlink -f /opt/starwalk/current || true",
    "ls -la /opt/starwalk/releases | tail -15",
    "cd /opt/starwalk/current/deploy && sudo docker compose -f docker-compose.production.yml ps",
    "curl -sS -m 8 http://127.0.0.1:8001/health || true",
    "curl -sS -m 5 -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ || echo NO_PORT_3000",
    "sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | sed -n '1,40p'",
    "test -f /opt/starwalk/current/src/utils/filmCompose.js && echo HAS_FILM_COMPOSE || echo NO_FILM_COMPOSE",
    "test -f /opt/starwalk/current/src/components/VoloFilmWorkspace.vue && echo HAS_VOLO_UI || echo NO_VOLO_UI",
    "test -f /opt/starwalk/current/backend/app/runtime_secrets.py && echo HAS_RUNTIME_SECRETS || echo NO_RUNTIME_SECRETS",
    "test -f /opt/starwalk/current/src/views/admin/AdminModelKeys.vue && echo HAS_ADMIN_KEYS || echo NO_ADMIN_KEYS",
    "grep -E '^(FILM_|DASHSCOPE_|BAILIAN_|VITE_FILM)' /opt/starwalk/current/deploy/.env.production 2>/dev/null | sed 's/=.*/=***/' || echo NO_FILM_ENV_KEYS",
    "grep -n 'VITE_FILM\\|film-api\\|odyssee' /opt/starwalk/current/Dockerfile.web /opt/starwalk/current/deploy/docker-compose.production.yml /opt/starwalk/current/deploy/nginx/default.conf 2>/dev/null || echo NO_FILM_IN_DEPLOY_FILES",
    "cd /opt/starwalk/current/backend && sudo docker compose -f ../deploy/docker-compose.production.yml exec -T backend alembic current 2>/dev/null || sudo docker exec $(sudo docker ps -qf name=backend) alembic current 2>/dev/null || echo ALEMBIC_CHECK_FAILED",
]


def main() -> None:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        HOST,
        username=USER,
        key_filename=KEY,
        timeout=25,
        allow_agent=False,
        look_for_keys=False,
    )
    try:
        for cmd in CMDS:
            print("====", cmd[:160])
            _stdin, stdout, stderr = client.exec_command(cmd, timeout=90)
            out = stdout.read().decode("utf-8", errors="replace")
            err = stderr.read().decode("utf-8", errors="replace")
            if out.strip():
                print(out[-5000:])
            if err.strip():
                print("ERR:", err[-1500:])
    finally:
        client.close()


if __name__ == "__main__":
    main()
