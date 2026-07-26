# 项目进度报告

> 项目名称：星际行者 · AI 旅行向导  
> 当前版本：v0.8.0（预发布）  
> 报告时间：2026-07-19

---

## 一、总体进度

| 维度 | 状态 | 说明 |
| --- | --- | --- |
| 项目架构 | ✅ 完成 | Vue 3 + Vite + Pinia + Vue Router + FastAPI + PostgreSQL 已落地。 |
| 首页与地图 | ✅ 完成 | 高德地图接入、省份标记、景点弹窗、热门目的地轮播均已可用。 |
| 用户系统 | ✅ 完成 | 登录/注册/登出、JWT 鉴权、登录态持久化、导航栏用户菜单完整。 |
| AI 规划 | ✅ 完成 | 文本/图片/语音输入 + DeepSeek / 智谱 AI 生成行程，结果保存到后端。 |
| 偏好测试 | ✅ 完成 | 60 题测试生成 MBTI 与旅行画像，可带入规划页。 |
| 收藏/预定 | ✅ 完成 | 收藏与预定均通过后端 API 持久化，右侧抽屉统一管理。 |
| 行程规划 | ✅ 完成 | 规划结果可保存到后端，路线页可导入已保存行程。 |
| 行程路线 | ✅ 完成 | 地图路线查看/编辑已实现，保存结果写入后端数据库。 |
| 旅游手账 | ✅ 完成 | AI 文案/视频生成已接入，生成结果可保存到后端并在“我的日记”查看。 |
| 旅途分享 | ✅ 完成 | 社区 UI 与发布功能已可用，帖子、点赞、评论已接入后端 PostgreSQL 持久化。 |
| 生产准备 | ⚠️ 部分完成 | 高德 Key 已迁移到环境变量；CI/CD、对象存储生产配置待完善。 |

**整体完成度估算：约 92%**

---

## 二、各模块详细状态

### 2.1 首页与互动地图

- **文件**：`src/views/Home.vue`、`src/components/AMapChina.vue`、`src/components/ProvincePanel.vue`
- **状态**：已完成
- **关键能力**：
  - 高德 JS API 初始化空白底图，叠加省份名称标签。
  - 省份中心点标记，hover 放大、click 触发弹窗。
  - 弹窗展示省份名称、评分、景点数量、简介、推荐景点列表。
  - 景点卡片展示图片、评分、价格、简介、标签。
  - 提供携程 / 飞猪快捷搜索入口，点击后可将链接加入“我的预定”。

### 2.2 用户认证

- **文件**：`src/views/AuthPage.vue`、`src/stores/authStore.js`、`backend/app/routers/auth.py`
- **状态**：已完成
- **关键能力**：
  - 手机号 / 邮箱两种登录/注册方式。
  - 表单校验：手机号格式、邮箱格式、密码长度、昵称非空。
  - 后端使用 `passlib` 加密密码，签发 JWT `access_token` / `refresh_token`。
  - 前端在 `localStorage` 保存 token，登录态刷新后保持。
  - 登出清除登录态。

### 2.3 AI 旅行规划

- **文件**：`src/views/TravelPlan.vue`、`src/stores/planStore.js`、`src/utils/agnesApi.js`、`backend/app/routers/plans.py`
- **状态**：已完成
- **关键能力**：
  - 输入方式：文字、图片拖拽上传、语音输入。
  - 偏好配置：风格、人员、预算、天数。
  - 调用 DeepSeek `deepseek-v4-flash` 生成结构化行程。
  - 图片输入调用智谱 `glm-4.6v` 多模态模型。
  - 生成结果支持保存到后端、复制、重新生成。

### 2.4 出行偏好测试

- **文件**：`src/views/HotDestinationsPage.vue`
- **状态**：已完成
- **关键能力**：
  - 60 道情景选择题。
  - 本地规则统计生成 MBTI 类型与旅行画像。
  - 可将偏好文本带入规划页。

### 2.5 我的收藏 / 我的预定 / 我的日记

- **文件**：`src/components/MyDrawer.vue`、`src/stores/favoriteStore.js`、`src/stores/bookingStore.js`、`src/stores/journalStore.js`、`backend/app/routers/favorites.py`、`backend/app/routers/bookings.py`、`backend/app/routers/journals.py`
- **状态**：已完成
- **关键能力**：
  - 右侧抽屉统一入口，支持 Tab 切换。
  - 收藏：从后端 API 加载，支持新增与删除。
  - 预定：从后端 API 加载，支持新增与删除，可跳转 OTA 链接。
  - 日记：从后端 API 加载真实手账记录，支持删除。
- **待完善**：
  - 日记目前仅展示列表，尚不支持在抽屉内点击查看详情或编辑。

### 2.6 行程路线

- **文件**：`src/views/TripRoutes.vue`、`src/stores/routeStore.js`、`backend/app/routers/routes.py`
- **状态**：已完成
- **关键能力**：
  - 从后端已保存行程导入。
  - 在高德地图上展示每日路线与景点。
  - 支持删除/添加景点、切换路线策略。
  - 保存路线时写入后端，包含标题、策略、路线点、距离。
- **待完善**：
  - 已保存路线列表目前仅在抽屉/状态中，路线页内未提供独立的“我的路线”列表展示。

### 2.7 旅游手账

- **文件**：`src/views/TravelJournal.vue`、`src/stores/journalStore.js`、`backend/app/routers/journals.py`
- **状态**：已完成
- **关键能力**：
  - 选择手账风格、上传照片、填写地点/日期/心情。
  - 调用 DeepSeek 生成手账 HTML 文案。
  - 支持调用 Agnes 视频生成接口。
  - 生成结果可保存到后端，并在“我的日记”中查看。
- **待完善**：
  - 视频生成依赖外部服务额度，缺少任务状态管理。
  - 照片使用 Data URL，大图片占用数据库空间，需接入对象存储。

### 2.8 旅途分享

- **文件**：`src/views/TravelShare.vue`、`src/stores/shareStore.js`、`backend/app/routers/posts.py`、`backend/app/routers/comments.py`、`backend/app/routers/likes.py`
- **状态**：已完成
- **关键能力**：
  - 精选游记轮播、全部评论横向滚动。
  - 发布弹窗支持文字与图片上传。
  - 点赞、评论已对接后端 API，数据持久化到 PostgreSQL。
  - 图片上传通过 `/api/uploads` 接入 S3 兼容对象存储。

### 2.9 后端服务

- **文件**：`backend/app/main.py`、`backend/app/models.py`、`backend/app/schemas.py`、`backend/app/routers/*`
- **状态**：已完成基础 API
- **关键能力**：
  - FastAPI 应用，CORS 允许前端 `localhost:5173`、`127.0.0.1:5173`、`localhost:4173`、`127.0.0.1:4173`。
  - PostgreSQL 数据库，SQLAlchemy ORM。
  - Alembic 迁移已配置。
  - 已实现 API：认证、用户、收藏、预定、行程规划、路线、手账。
- **待完善**：
  - 生产环境 CI/CD 与对象存储配置。
  - 分享社区真实语音发布需接入语音识别/合成服务（当前已移除语音模拟）。

---

## 三、技术债务与风险

### 3.1 高风险

| 问题 | 影响 | 建议处理方案 |
| --- | --- | --- |
| 高德地图 Key 硬编码在前端 | 密钥泄露风险 | ✅ 已迁移到 `VITE_AMAP_KEY` 环境变量。 |
| 文件上传使用 Data URL | 数据库膨胀、性能差 | ✅ 已接入 `/api/uploads` + S3 兼容对象存储。 |
| 分享社区未持久化 | 用户发布内容刷新丢失 | ✅ 已实现后端 API 并与前端 store 对接。 |

### 3.2 中风险

| 问题 | 影响 | 建议处理方案 |
| --- | --- | --- |
| AI 生成任务无队列管理 | 长时间生成无状态反馈，易超时 | 增加异步任务队列与轮询/回调机制。 |
| 缺少后端单元测试 | 后续迭代容易回归 | 补充 `pytest` 测试覆盖核心 CRUD 与鉴权。 |
| 生产环境配置未整理 | 部署困难 | 提供 `docker-compose.yml` 与生产 `.env` 模板。 |

### 3.3 低风险

- 部分图标与占位图片使用渐变背景，后续可替换为真实素材。
- 缺少前端 E2E 测试覆盖。

---

## 四、下一步计划

### 近期（Week 4：生产准备收尾）

1. 配置生产环境 `.env` 与对象存储（S3/MinIO）。
2. 补充后端 `pytest` 测试覆盖上传接口。
3. 提供 `docker-compose.yml` 一键启动前后端 + 数据库。
4. 配置前端生产构建与基础 CI/CD 流程。

### 中期（1 个月内）

1. 将前端高德 Key 迁移到环境变量或服务端代理。
2. 增加 AI 生成任务队列，优化图片/视频生成的等待体验。
3. 完善“我的日记”详情查看与编辑。
4. 提供 `docker-compose.yml` 一键启动前后端 + 数据库。

### 远期（1-3 个月）

1. 性能优化与 PWA 支持。
2. 增加前端单元测试与 E2E 测试。
3. 部署到生产环境并配置 CI/CD。

---

## 五、关键指标

| 指标 | 当前值 |
| --- | --- |
| 页面数量 | 9 个 |
| 核心组件数量 | 11 个 |
| Pinia Store 数量 | 8 个 |
| 后端 API 路由数量 | 7 个 |
| AI 服务集成 | 3 个（DeepSeek / 智谱 / Agnes） |
| 外部 API | 2 个（高德地图 / OTA 跳转） |
| 持久化数据项 | 8 项（用户、收藏、行程、偏好、预定、路线、手账、登录态） |
