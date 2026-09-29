"""Check whether compose build finished and resume deploy if needed."""
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
    "ps aux | grep 'docker compose' | grep -v grep || echo NO_COMPOSE_BUILD",
    "sudo docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedSince}}' | head -20",
    "cd /opt/starwalk/current/deploy && sudo docker compose -f docker-compose.production.yml --env-file .env.production ps",
    "curl -sS -m 8 http://127.0.0.1:8001/health || true",
    "curl -sS -m 8 http://127.0.0.1:8001/film-api/api/health || echo NO_FILM_PROXY",
]
for cmd in cmds:
    print("====", cmd[:140])
    _, o, e = c.exec_command(cmd, timeout=90)
    print(o.read().decode("utf-8", "replace")[-4000:])
    err = e.read().decode("utf-8", "replace").strip()
    if err:
        print("ERR", err[-1000:])
c.close()
