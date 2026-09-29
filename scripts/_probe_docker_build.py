"""Inspect hung docker build on production."""
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
    "sudo docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}' | head -20",
    "sudo ls -la /var/lib/docker/buildkit/executor/ 2>/dev/null | head",
    "sudo cat /var/lib/docker/buildkit/executor/runc-log.json 2>/dev/null | tail -c 3000 || true",
    "ps -ef | grep -E 'apt|npm|node|ffmpeg' | grep -v grep | head -20",
    "sudo timeout 20 docker buildx du 2>/dev/null | head || true",
    # peek into the stuck build container processes if any
    "sudo ls /proc/2146255/fd 2>/dev/null | head || true",
    "sudo tr '\\0' ' ' < /proc/2146255/cmdline 2>/dev/null; echo",
    "sudo docker compose -f /opt/starwalk/current/deploy/docker-compose.production.yml --env-file /opt/starwalk/current/deploy/.env.production images 2>/dev/null | head",
]
for cmd in cmds:
    print("====", cmd[:120])
    _, o, e = c.exec_command(cmd, timeout=90)
    print(o.read().decode("utf-8", "replace")[-3500:])
    err = e.read().decode("utf-8", "replace").strip()
    if err:
        print("ERR", err[-800:])
c.close()
