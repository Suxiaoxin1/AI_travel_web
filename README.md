# 星际行者 · AI 旅行向导

星际行者是一个基于 Vue 3、Vite、Pinia、FastAPI 与 PostgreSQL 的旅行 Web 平台，覆盖地图探索、旅行偏好、AI 行程规划、真实路线规划、旅行记忆（手账）、旅行分享与后台内容运营。

> 当前基线：`v0.11.0-test`（提交 `d7bcbf3`，2026-09-29；分支 `master`，远端 `master` 已一致；标签 `v0.11.0-test` 已推送）。旅行记忆已部署到临时 IP HTTPS 环境并完成人工点验；账号、景点库与内容审核此前已在测试链路验证。正式域名、对象存储生产策略、监控告警与生产验收仍未完成。
>
> 临时访问入口：`https://111.230.144.219/`（主机 Nginx → 应用 `:8001`；手账页 `/journal`）。

## 核心能力

### 用户与权限

- 账号 + 密码注册、登录、刷新令牌、退出登录和 JWT 会话管理。
- 用户状态、角色与管理员权限控制；管理后台路由 `/admin` 仅管理员可进入。
- 收藏、预定、行程、路线、游记、评论、点赞和手账均通过 `user_id` 归属到账号。

### 旅行体验

- 高德地图、中国省份探索与热门景点展示；路线服务通过后端代理调用，避免暴露 Web 服务 Key。
- AI 行程支持文字、图片、语音输入，生成多日、多景点、位置和图片信息；支持保存、复制与重新生成。
- 路线规划支持时间/路程/顺利/费用偏好、按天真实道路轨迹、点位排序、缓存和路线保存。
- 旅行记忆（手账）：选择风格、上传 3–9 张照片并补充旅途信息，经 `POST /api/diary/layout-next` 模板排版生成 3:4 预览图，支持导出 PNG 与保存；另提供 FILM VOLO 相册成片入口（依赖 film 服务与万相密钥）。
- 旅行分享支持多图游记、点赞、评论分页、公共详情、二维码、复制链接和系统分享。

### 内容运营

- 后台用户查询、状态管理、管理员角色管理和管理审计日志。
- 热门景点库：新增、编辑、发布、热门控制、排序和归档；首页只读取已发布且热门的景点。
- 游记、评论审核：隐藏、恢复、删除；前台只展示公开且未删除的内容。

## 技术架构

```text
Vue 3 + Vite + Pinia
        │ HTTP / JWT（同源 /api、/film-api）
        ▼
Nginx（web 容器）
   ├─ /api/*      → FastAPI + SQLAlchemy + Alembic
   └─ /film-api/* → film（VOLO / odyssee）
        │                 │
        ▼                 ▼
 PostgreSQL             Redis
        │
        ├─ 高德地图 Web 服务 / JS API
        ├─ 文本模型（手账排版等）/ 视觉模型
        └─ S3 / MinIO 兼容对象存储（异常时可回退本地）
```

## 目录结构

```text
.
├─ src/                    # Vue 前端
│  ├─ components/           # 导航、热门景点、VOLO 工作区等组件
│  ├─ stores/               # Pinia 状态管理
│  ├─ utils/                # 手账生成、DiaryNext 桥接等
│  └─ views/                # 规划、路线、分享、手账、后台页面
├─ public/
│  ├─ journal/              # DiaryNext 渲染器与贴纸等静态资源
│  └─ images/journal-styles/ # 手账风格样例图
├─ backend/                 # FastAPI 服务
│  ├─ app/routers/          # 认证、管理、景点、手账、diary 排版等接口
│  ├─ alembic/versions/     # 数据库迁移
│  └─ tests/                # 后端测试
├─ services/film/           # VOLO 成片服务
├─ deploy/                  # 生产形态 Compose、Nginx、发版说明
├─ README.md
├─ CHANGELOG.md
└─ Project Progress.md
```

## 本地运行

### 前置条件

- Node.js 18+
- Python 3.10+
- Docker Desktop（推荐，用于 PostgreSQL、Redis 与 MinIO）

### 1. 启动基础服务

```powershell
cd backend
docker compose up -d db redis minio minio-init
```

### 2. 配置后端并执行迁移

```powershell
cd backend
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -m alembic upgrade head
```

请在 `.env` 中按实际环境配置数据库、JWT、AI、地图和对象存储相关变量；不要提交真实密码、Token、API Key 或测试服务器地址。

### 3. 启动后端

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8081 --log-level info
```

健康检查：`http://127.0.0.1:8081/health`

### 4. 启动前端

```powershell
npm install
npm run dev
```

默认访问：`http://127.0.0.1:5173`

## 环境变量说明

以 [`backend/.env.example`](backend/.env.example) 为准。生产或测试服务器应通过部署平台/私有 `.env` 注入，仓库只保留变量名和脱敏示例。

| 类别 | 代表变量 | 用途 |
| --- | --- | --- |
| 数据库 | `DATABASE_URL` | PostgreSQL 连接串 |
| 认证 | `SECRET_KEY`、`ACCESS_TOKEN_EXPIRE_MINUTES` | JWT 签名与有效期 |
| 初始化 | `AUTO_CREATE_TABLES`、管理员初始化变量 | 仅按部署策略启用，避免覆盖真实数据 |
| 跨域 | `CORS_ORIGINS` | 限制可调用前端来源 |
| 地图 | `VITE_AMAP_KEY`、后端高德 Web 服务 Key | 前端地图和后端路线/地理服务 |
| AI | 模型服务 Key 与模型名 | 文本/视觉行程与手账排版（如 DeepSeek） |
| 存储 | S3/MinIO Endpoint、Bucket、Access Key | 上传图片与手账素材 |
| VOLO | 万相/百炼相关密钥（env 或管理后台） | FILM 成片；未配置时 film 健康检查可显示 `bailianConfigured: false` |

## 数据库设计

> 结构来源：`backend/app/models.py` 与 Alembic 迁移（核对时间 2026-09-29）。临时环境迁移头已确认到 `h2i3j4k5l6m7`；**本次未做线上全表 `\d` 扫库**。工作区另有预定意图、订单明细等迁移，完整字段以迁移文件与 ORM 为准。数据库变更核对：较 2026-09-27 版新增 `media_gallery_items`（标签悬停图库缓存，迁移 `b1c2d3e4f5a6`）、`app_settings`（运行时配置，迁移 `h2i3j4k5l6m7`）两表；`bookings` 扩展预定意图/订单字段（迁移 `g1h2i3j4k5l6`、`a5a5ce9cd3f8`）；手账表仍以 `journals.layout_json` 承载排版（可含 `diaryNextLayout`），无新增手账专用表。

标记：`PK` 主键、`UQ` 唯一、`IDX` 索引、`FK` 外键；未标“必填”的字段允许为空；时间默认值为应用侧 UTC 当前时间。

| 表 | 字段（类型、约束/默认） | 用途 |
| --- | --- | --- |
| `roles` | `id` Integer PK；`key` String(50) 必填 UQ；`name` String(100) 必填；`created_at` DateTime 默认当前时间 | 系统角色 |
| `users` | `id` Integer PK IDX；`account` String(24) 必填 UQ IDX；`nickname` String(100) 必填；`hashed_password` String(255)；`avatar_bg` String(255)；`avatar_url` Text；`bio` String(300)；`home_city` String(100)；`last_login_at` DateTime；`status` String(20) 必填 默认 `active`；`created_at`/`updated_at` DateTime 默认当前时间（后者更新时刷新） | 用户账号主体 |
| `user_roles` | `user_id` Integer PK FK→`users.id` CASCADE；`role_id` Integer PK FK→`roles.id` CASCADE | 用户与角色多对多 |
| `auth_sessions` | `id` String(36) PK；`user_id` Integer 必填 IDX FK→`users.id` CASCADE；`refresh_jti_hash` String(64) 必填 UQ；`device_id` String(128)；`user_agent` String(512)；`ip_address` String(64)；`expires_at` DateTime 必填；`revoked_at` DateTime；`created_at`/`last_seen_at` DateTime 默认当前时间 | 刷新会话与失效控制 |
| `auth_events` | `id` Integer PK IDX；`user_id` Integer IDX FK→`users.id` SET NULL；`event_type` String(64) 必填；`subject_hash` String(64) IDX；`ip_address` String(64)；`metadata_json` JSON；`created_at` DateTime 默认当前时间 | 认证事件记录 |
| `admin_audit_logs` | `id` Integer PK IDX；`actor_id`/`target_user_id` Integer IDX FK→`users.id` SET NULL；`target_type` String(50) IDX；`target_id` Integer IDX；`action` String(100) 必填；`metadata_json` JSON；`ip_address` String(64)；`created_at` DateTime 默认当前时间 | 管理操作审计 |
| `attractions` | `id` Integer PK IDX；`name` String(160) 必填 IDX；`province` String(80) 必填 IDX；`city` String(80) IDX；`short_desc`/`description` Text；`cover_image_url` Text；`images` Text[]；`tags` String(100)[]；`rating` Float；`best_season` String(120)；`recommended_duration` String(60)；`opening_hours`/`ticket_hint` String(255)；`longitude`/`latitude` Float；`amap_poi_id` String(120) UQ；`sort_order` Integer 必填 默认 0；`is_hot` Boolean 必填 默认 true；`status` String(20) 必填 IDX 默认 `draft`；`created_by`/`updated_by` Integer FK→`users.id` SET NULL；`created_at`/`updated_at` DateTime 默认当前时间 | 景点运营库 |
| `favorites` | `id` Integer PK IDX；`user_id` Integer 必填 FK→`users.id` CASCADE；`type` String(50) 必填；`name` String(255) 必填；`description`/`image_url`/`external_url` Text；`plan_json` JSON；`created_at` DateTime 默认当前时间 | 用户收藏 |
| `bookings` | `id` Integer PK IDX；`user_id` Integer 必填 FK→`users.id` CASCADE；`kind` String(20) 必填 IDX 默认 `intent`（intent 收藏链接 / order 正式订单）；`title` String(255)；`note` Text；`source_type` String(20)（province/spot）；`source_name` String(100)；`link_type` String(20)（search/product）；`province` String(100)；`keyword` String(255)；`platform` String(50)；`url` Text 必填；`order_no` String(100)；`travel_date` DateTime；`amount` Integer；`created_at`/`updated_at` DateTime 默认当前时间 | 用户预定意图收藏与订单记录 |
| `travel_plans` | `id` Integer PK IDX；`user_id` Integer 必填 FK→`users.id` CASCADE；`title` String(255)；`preference_text`/`input_text` Text；`content_json` JSON 必填；`input_images` Text[]；`style`/`people`/`budget` String(50)；`days` Integer；`start_date` Date；`created_at`/`updated_at` DateTime 默认当前时间 | AI 行程 |
| `routes` | `id` Integer PK IDX；`user_id` Integer 必填 FK→`users.id` CASCADE；`plan_id` Integer FK→`travel_plans.id` SET NULL；`title` String(255)；`strategy` String(50)；`days_json` JSON 必填；`created_at`/`updated_at` DateTime 默认当前时间 | 行程路线 |
| `posts` | `id` Integer PK IDX；`user_id` Integer 必填 FK→`users.id` CASCADE；`title` String(255)；`content` Text 必填；`images` Text[]；`rating` Integer；`tags` String(100)[]；`location` String(255)；`likes_count`/`comments_count` Integer 默认 0；`status` String(20) 必填 IDX 默认 `published`；`moderated_by` Integer FK→`users.id` SET NULL；`moderated_at`/`deleted_at` DateTime；`moderation_reason` String(300)；`created_at`/`updated_at` DateTime 默认当前时间 | 旅行分享与审核 |
| `comments` | `id` Integer PK IDX；`post_id` Integer 必填 FK→`posts.id` CASCADE；`user_id` Integer 必填 FK→`users.id` CASCADE；`content` Text 必填；`status` String(20) 必填 IDX 默认 `published`；`moderated_by` Integer FK→`users.id` SET NULL；`moderated_at`/`deleted_at` DateTime；`moderation_reason` String(300)；`created_at` DateTime 默认当前时间 | 分享评论与审核 |
| `likes` | `id` Integer PK IDX；`post_id` Integer 必填 FK→`posts.id` CASCADE；`user_id` Integer 必填 FK→`users.id` CASCADE；`created_at` DateTime 默认当前时间；联合唯一约束 `post_id + user_id` | 游记点赞 |
| `journals` | `id` Integer PK IDX；`user_id` Integer 必填 FK→`users.id` CASCADE；`title` String(255)；`style` String(50)；`location` String(255)；`travel_date` Date；`mood` Text；`photos` Text[]；`layout_json` JSON（可含 `diaryNextLayout`）；`content_html`/`video_url` Text；`created_at`/`updated_at` DateTime 默认当前时间 | 旅行记忆（手账）存取 |
| `media_gallery_items` | `id` Integer PK IDX；`cache_key` String(255) 必填 UQ IDX；`label` String(160) 必填；`tag_type` String(40) 必填 默认 `experience`；`city` String(80)；`image_url` Text 必填；`source` String(40) 必填 默认 `remote`；`source_page` Text；`attribution` String(255)；`hit_count` Integer 必填 默认 0；`created_at`/`updated_at` DateTime 默认当前时间 | 标签悬停图库缓存（本地优先，缺失时远端拉取落地） |
| `app_settings` | `key` String(80) PK；`value` Text 必填 默认空串；`updated_at` DateTime 默认当前时间（更新时刷新） | 管理员可改的运行时配置（密钥类字段优先于 `.env`） |

## 迁移与部署

### 数据库迁移

```powershell
cd backend
.\.venv\Scripts\python.exe -m alembic upgrade head
```

任何生产或临时环境迁移前应先创建可恢复备份，并确认当前数据库版本、环境变量和上传文件存储策略。临时环境当前迁移头：`h2i3j4k5l6m7`。

### 临时环境基线

- Compose 服务：`web`、`backend`、`film`、`db`、`redis`；主机 Nginx 提供临时 IP HTTPS，反代到 `:8001`。
- 采用版本化发布目录（`/opt/starwalk/releases/<name>`）、`current` 符号链接、数据库备份、迁移、容器重建与健康检查。
- 当前 release：`20260927-journal-memory-v1`；入口：`https://111.230.144.219/`。
- 已验证旅行记忆页可访问与人工主流程点验；VOLO 成片需另行配置万相密钥。

### 正式发布前必做

1. 配置正式域名、DNS、HTTPS 和反向代理，限制 `CORS_ORIGINS`。
2. 配置生产 PostgreSQL、对象存储、备份/恢复演练、日志监控和告警。
3. 使用独立生产密钥；严禁把 `.env`、数据库备份、上传文件或真实 Key 推送到 Git。
4. 完成账号权限、内容审核、AI/高德、上传、旅行记忆与（可选）VOLO 的人工验收后，再创建 Git 标签和生产发布记录。

## 当前验证

| 项目 | 结果 |
| --- | --- |
| 临时环境 HTTPS `/health`、`/journal` | 通过（2026-09-27） |
| 旅行记忆人工点验 | 通过（Master 确认） |
| film `/film-api/api/health` | 通过；万相未配置时 `bailianConfigured: false` |
| 前端构建 / 后端 pytest | 以本地/历史基线为准；本轮文档更新未重跑全量自动化 |

## 下一步

1. 配置 VOLO 万相密钥并验收成片；明确旧手账（无 `diaryNextLayout`）的兼容策略。
2. 认证与稳定性收敛：登录限流、密码规则、端到端测试、弃用警告、前端分包和移动端体验。
3. 正式生产发布：正式域名、对象存储、备份恢复、监控、CI/CD 和版本标签。

详细状态请参阅 [Project Progress.md](Project%20Progress.md)，版本变更请参阅 [CHANGELOG.md](CHANGELOG.md)。
