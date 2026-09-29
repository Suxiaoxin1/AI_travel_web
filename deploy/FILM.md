# VOLO 成片（film / odyssee）生产接入说明

## 架构

```
浏览器
  ├─ /api/*              → web(nginx) → backend:8000
  │     └─ POST /api/ai/film/tasks   （注入管理后台万相密钥后转发）
  └─ /film-api/*         → web(nginx) → film:3000
        ├─ /api/upload
        ├─ /api/analyze
        ├─ /api/video-engine/tasks
        └─ /uploads/*.mp4
```

- 前端构建参数：`VITE_FILM_API_BASE=/film-api`（见 `Dockerfile.web`）
- 后端容器内：`FILM_API_BASE=http://film:3000`（见 `docker-compose.production.yml`）
- 万相密钥：优先管理后台「模型密钥」；也可在 `.env.production` 兜底 `DASHSCOPE_API_KEY` + `BAILIAN_WORKSPACE_ID`

## 必做步骤（发版前）

1. 代码包含 `services/film/`、`backend/alembic/versions/h2i3j4k5l6m7_add_app_settings.py`
2. 生产 env 可选写入万相兜底密钥（不提交 Git）
3. 迁移：
   ```bash
   cd /opt/starwalk/current/deploy
   sudo docker compose -f docker-compose.production.yml --profile migrate run --rm migrate
   ```
4. 重建并启动 `film` / `backend` / `web`：
   ```bash
   sudo docker compose -f docker-compose.production.yml up -d --build film backend web
   ```
5. 验收：
   - `curl -sS http://127.0.0.1:8001/film-api/api/health`
   - 管理员登录 → `/admin/model-keys` 保存万相 Key + Workspace
   - `/journal?mode=volo` 上传 3 张图并合成

## 本地联调对照

| 角色 | 地址 |
|------|------|
| 前端 Vite | http://localhost:5173 ，`VITE_FILM_API_BASE=http://localhost:3000` |
| 主站 API | http://127.0.0.1:8081 |
| film / odyssee | http://localhost:3000（`services/film` 或原 odyssee 目录 `npm start`） |

## 注意

- film 任务状态在内存中，**重启 film 容器会丢失进行中的任务**
- 成片文件在 volume `film_uploads_data`
- Nginx 对 `/film-api/` 已放宽到 30 分钟读写超时、80MB 上传
