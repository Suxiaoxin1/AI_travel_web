# Ubuntu temporary-IP deployment

This directory contains the production-shaped Docker Compose configuration for
the full Starwalk feature set. It runs the web frontend, FastAPI backend and
PostgreSQL on one host. Uploaded files are stored in the `uploads_data` Docker
volume while `S3_ENABLED=false`.

## First deployment

1. Copy `.env.production.example` to `.env.production` and supply real secrets.
2. Run the database migration once:

   ```bash
   docker compose --env-file deploy/.env.production -f deploy/docker-compose.production.yml --profile migrate run --rm migrate
   ```

3. Start the application:

   ```bash
   docker compose --env-file deploy/.env.production -f deploy/docker-compose.production.yml up -d --build
   ```

4. Verify `http://SERVER_IP:8001/health` and `http://SERVER_IP:8001/`.

## Rollback

Before a future release, back up the database:

```bash
docker compose --env-file deploy/.env.production -f deploy/docker-compose.production.yml exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup.sql
```

Deploy by release directory or Git commit, keep the prior release available,
and run the same Compose file from the prior release if a rollback is needed.

The current server already has another site on port 80. This application is
therefore isolated on port 8001; open TCP 8001 in the cloud security group.
An IP address cannot receive a trusted public TLS certificate. Use HTTP only
for this temporary access stage; migrate to a domain and HTTPS before public
production use.
