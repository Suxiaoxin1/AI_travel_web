# 星际行者 · AI 旅行向导

> 一个基于 Vue 3 + Vite + FastAPI + PostgreSQL + S3 兼容对象存储的交互式中国旅行探索与 AI 行程规划平台。

“星际行者”让用户在可视化中国地图上浏览 34 个省级行政区，发现热门景点，并通过 AI 生成个性化旅行规划、路线、手账与游记分享。当前已实现前后端分离架构，核心数据持久化到 PostgreSQL，图片等媒体资源存储在 S3 兼容对象存储。

---

## 功能特性

### 已上线

- **首页互动地图**：基于高德 JS API 的中国地图，点击省份标记可弹出省份详情与推荐景点。
- **省份景点弹窗**：展示省份简介、评分、推荐景点列表，并提供携程 / 飞猪旅行团快捷入口。
- **热门目的地轮播**：精选景点卡片横向滚动展示。
- **功能入口导航**：6 大核心模块的快速入口（规划、偏好、路线、分享、手账、地图）。
- **用户登录/注册**（`/auth`）：支持手机号/邮箱登录，JWT 鉴权，登录态持久化。
- **AI 旅行规划**（`/plan`）：支持文字、图片、语音输入，调用 DeepSeek / 智谱 AI 生成结构化行程并保存到后端。
- **出行偏好测试**（`/destinations`）：60 道情景题生成 MBTI 与旅行画像，并用于后续规划。
- **行程路线**（`/routes`）：导入已保存行程，在高德地图上查看/编辑每日游玩路线，保存到后端。
- **旅途分享**（`/share`）：旅行社区 UI，支持发布游记、点赞、评论（当前为内存数据）。
- **旅游手账**（`/journal`）：上传照片，通过 AI 生成手账文案或视频，并保存到后端。
- **旅途分享**（`/share`）：社区发布游记、点赞、评论，数据持久化到后端。
- **文件上传**：图片等媒体资源通过后端上传到 S3 兼容对象存储（本地 MinIO / 阿里云 OSS / AWS S3）。
- **我的收藏 / 我的预定 / 我的日记**：右侧抽屉统一管理，数据均来自后端 API。

### 待完善

- 手账/社区中的大图片/视频目前走服务端上传，后续可优化为前端直传对象存储。
- 部分 AI 生成任务（图片/视频）依赖外部 Agnes API 额度与可用性。
- API Key 已迁移到后端 `.env`，但高德地图 Key 仍在前端硬编码，生产环境需要进一步处理。

---

## 技术栈

### 前端

- **框架**：Vue 3（Composition API）
- **构建工具**：Vite 5
- **状态管理**：Pinia
- **路由**：Vue Router 4
- **地图**：高德地图 JS API 2.0（`@amap/amap-jsapi-loader`）
- **样式**：原生 CSS / Scoped CSS

### 后端

- **框架**：FastAPI（Python 3.11+）
- **数据库**：PostgreSQL 14+
- **ORM**：SQLAlchemy 2.0
- **迁移**：Alembic
- **鉴权**：JWT（`python-jose` + `passlib`）
- **运行**：Uvicorn
- **对象存储**：S3 兼容存储（MinIO / 阿里云 OSS / AWS S3）

### AI 服务

- DeepSeek `deepseek-v4-flash`（文本对话 / 行程规划）
- 智谱 `glm-4.6v`（图片 + 文本多模态输入）
- Agnes AI（图片/视频生成）

### 语音输入

- 浏览器 Web Speech API

---

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9
- Python >= 3.11
- PostgreSQL >= 14

### 1. 克隆与安装前端依赖

```bash
npm install
```

### 2. 安装并配置后端

```bash
cd backend
python -m venv .venv
# Windows
.venv/Scripts/pip install -r requirements.txt
# macOS / Linux
# .venv/bin/pip install -r requirements.txt

cp .env.example .env
# 编辑 .env，填写 DATABASE_URL 与 AI Keys
```

### 3. 初始化数据库

```bash
cd backend
.venv/Scripts/alembic upgrade head
```

### 4. 启动开发服务器

启动后端：

```bash
cd backend
.venv/Scripts/uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload
```

启动前端：

```bash
npm run dev
```

默认访问地址：

- 前端：http://localhost:5173
- 后端 API：http://localhost:8081
- 后端 API 文档：http://localhost:8081/docs
- MinIO 控制台：http://localhost:9001（默认账号 `minioadmin` / `minioadmin`）

### 5. 对象存储配置

复制 `backend/.env.example` 为 `backend/.env` 后，根据环境配置：

```env
# 本地 MinIO（开发默认）
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=starwalk
S3_REGION=us-east-1

# 阿里云 OSS 示例
# S3_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
# S3_ACCESS_KEY=your-access-key
# S3_SECRET_KEY=your-secret-key
# S3_BUCKET=your-bucket
# S3_REGION=oss-cn-hangzhou
```

> 生产环境建议通过 `S3_PUBLIC_URL` 配置 CDN 域名。

### 6. 构建生产包

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

---

## 项目结构

```
├── backend/                # FastAPI 后端
│   ├── alembic/            # 数据库迁移
│   ├── app/
│   │   ├── main.py         # FastAPI 应用入口
│   │   ├── models.py       # SQLAlchemy 数据模型
│   │   ├── schemas.py      # Pydantic 请求/响应模型
│   │   ├── routers/        # API 路由
│   │   │   ├── auth.py
│   │   │   ├── bookings.py
│   │   │   ├── favorites.py
│   │   │   ├── journals.py
│   │   │   ├── plans.py
│   │   │   ├── posts.py
│   │   │   ├── routes.py
│   │   │   ├── uploads.py
│   │   │   └── users.py
│   │   ├── database.py     # 数据库连接
│   │   ├── config.py       # 配置读取
│   │   ├── dependencies.py # JWT 依赖
│   │   └── storage.py      # S3 兼容对象存储封装
│   ├── requirements.txt
│   └── .env.example
├── public/                 # 静态资源
│   └── images/
├── src/
│   ├── components/         # 公共组件
│   │   ├── AMapChina.vue           # 中国地图组件
│   │   ├── AppFooter.vue           # 页脚
│   │   ├── FeatureEntries.vue      # 首页功能入口
│   │   ├── HotDestinations.vue     # 热门目的地轮播
│   │   ├── MyDrawer.vue            # 右侧抽屉（收藏/预定/日记）
│   │   ├── NavBar.vue              # 顶部导航
│   │   ├── ProvinceDetail.vue      # 省份详情（备用）
│   │   ├── ProvincePanel.vue       # 省份景点弹窗
│   │   └── SimpleMap.vue           # 简化地图组件
│   ├── composables/        # 组合式函数
│   │   └── useChinaMap.js          # 地图相关逻辑
│   ├── data/               # 静态数据
│   │   ├── province-centers.js     # 省份中心坐标
│   │   ├── provinces.js            # 省份与景点数据
│   │   └── provinces-updated.json  # 省份数据 JSON
│   ├── router/             # 路由配置
│   │   └── index.js
│   ├── stores/             # Pinia 状态管理
│   │   ├── authStore.js            # 用户登录态
│   │   ├── bookingStore.js         # 预定记录
│   │   ├── favoriteStore.js        # 收藏记录
│   │   ├── journalStore.js         # 手账记录
│   │   ├── planStore.js            # 行程规划记录
│   │   ├── routeStore.js           # 路线记录
│   │   ├── shareStore.js           # 分享社区
│   │   ├── mapStore.js             # 地图交互状态
│   │   └── uiStore.js              # UI 状态（抽屉）
│   ├── utils/              # 工具函数
│   │   ├── agnesApi.js             # AI API 封装
│   │   └── apiClient.js            # Axios 后端请求封装
│   ├── views/              # 页面级组件
│   │   ├── AuthPage.vue
│   │   ├── Bookings.vue
│   │   ├── Favorites.vue
│   │   ├── Home.vue
│   │   ├── HotDestinationsPage.vue
│   │   ├── TravelJournal.vue
│   │   ├── TravelPlan.vue
│   │   ├── TravelShare.vue
│   │   └── TripRoutes.vue
│   ├── App.vue
│   └── main.js
├── index.html
├── package.json
└── vite.config.js
```

---

## 配置说明

### 后端配置

复制 `backend/.env.example` 为 `backend/.env`，主要配置项：

| 配置项 | 说明 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接串 |
| `SECRET_KEY` | JWT 签名密钥 |
| `DEEPSEEK_API_KEY` | DeepSeek API Key |
| `ZHIPU_API_KEY` | 智谱 AI API Key |
| `AGNES_API_KEY` | Agnes AI API Key |
| `S3_ENDPOINT` | S3 兼容对象存储 Endpoint |
| `S3_ACCESS_KEY` | Access Key |
| `S3_SECRET_KEY` | Secret Key |
| `S3_BUCKET` | Bucket 名称 |
| `S3_REGION` | Region |
| `S3_PUBLIC_URL` | 可选 CDN 域名 |

### 前端配置

前端 API 基础地址在 `.env` 中配置：

```env
VITE_API_BASE_URL=http://localhost:8081/api
```

高德地图 Key 目前硬编码在 `src/components/AMapChina.vue` 与 `src/views/TripRoutes.vue` 中，生产环境建议通过服务端代理或构建时注入。

> 注意：当前代码中高德 Key 为明文硬编码，仅用于开发/演示。生产环境请通过环境变量注入并配置服务端代理，避免前端暴露密钥。

---

## 测试账号

- 手机号：`13800138000`
- 密码：`123456`

---

## 浏览器支持

- Chrome / Edge / Firefox / Safari 最新版
- 语音输入功能需要浏览器支持 Web Speech API

---

## 许可证

私有项目，仅供学习与交流使用。
