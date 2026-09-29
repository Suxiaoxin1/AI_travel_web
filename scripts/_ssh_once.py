"""One-off prod status. Password from STARWALK_SSH_PASS, not stored."""
import os
import paramiko

password = os.environ["STARWALK_SSH_PASS"]
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(
    "111.230.144.219",
    username="ubuntu",
    password=password,
    timeout=25,
    allow_agent=False,
    look_for_keys=False,
    banner_timeout=25,
)
cmds = [
    "ps -eo pid,pcpu,pmem,comm --sort=-pcpu | head -15",
    "sudo docker ps --format 'table {{.Names}}\t{{.Status}}'",
    "sudo docker exec deploy-backend-1 alembic current",
    "curl -sS -m 8 http://127.0.0.1:8001/health; echo",
    "curl -sS -m 12 http://127.0.0.1:8001/film-api/api/health; echo",
]
for cmd in cmds:
    print("====", cmd[:120])
    _, o, e = c.exec_command(cmd, timeout=45)
    print(o.read().decode("utf-8", "replace")[-2500:])
    err = e.read().decode("utf-8", "replace").strip()
    if err:
        print("ERR", err[-500:])
c.close()
