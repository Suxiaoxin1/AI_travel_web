"""Probe hung VOLO deploy state."""
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
    "ps aux | grep -E 'tar|rsync|docker|volo' | grep -v grep | head -30",
    "ls -la /tmp/volo_film_* 2>/dev/null | head",
    "ls -la /opt/starwalk/releases/20260920-volo-film-v1/services/film 2>/dev/null | head",
    "readlink -f /opt/starwalk/current",
    "test -f /opt/starwalk/releases/20260920-volo-film-v1/backend/app/runtime_secrets.py && echo HAS_SECRETS || echo NO_SECRETS",
    "test -f /opt/starwalk/releases/20260920-volo-film-v1/services/film/server.js && echo HAS_FILM || echo NO_FILM",
]
for cmd in cmds:
    print("====", cmd)
    _, o, e = c.exec_command(cmd, timeout=60)
    print(o.read().decode("utf-8", "replace")[-2000:])
    err = e.read().decode("utf-8", "replace").strip()
    if err:
        print("ERR", err[-500:])
c.close()
