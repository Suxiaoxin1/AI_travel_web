# 星际行者 · AI 旅行向导

“星际行者”是一套基于 Vue 3、Vite、Pinia、FastAPI 和 PostgreSQL 的 AI 旅行规划与旅行内容分享平台。项目覆盖地图探索、旅行偏好测试、AI 行程规划、真实路线规划、旅行手账生成与编辑、旅行游记分享和公共链接访问等核心场景。

## 当前能力

### 首页与地图

- 高德地图中国地图展示
- 省份标记、详情弹窗和热门景点信息
- 景点图片、评分、价格、简介和推荐信息
- 前端高德 JS Key 使用 `VITE_AMAP_KEY` 注入
- 路线服务通过后端 Web 服务 Key 代理，避免把服务端 Key 暴露给浏览器

### AI 旅行规划

- 支持文字、图片和语音输入
- 支持文字与图片同时提交给视觉模型分析
- 接入 DeepSeek 文本模型和智谱视觉模型
- 生成结构化的多日旅行计划
- 支持每天多个景点、景点位置信息和景点图片
- 没有景点图片时不展示空图片占位
- 支持保存、复制和重新生成行程

### 行程路线规划

- 导入已保存行程并按天展示途经景点
- 添加、删除和调整景点顺序
- 支持时间优先、路程优先、顺利优先和费用优先
- 将路线偏好映射为高德路线策略
- 按天调用后端真实路线接口并进行前端缓存
- 展示真实道路轨迹，而不是简单直线连接
- 地图颜色区分行程天数，数字区分当天途经顺序
- 支持保存调整后的路线

### 旅行手账

- 支持 3、5、9 张照片的自动拼贴版式
- 根据照片内容选择主图
- 使用 `layout.elements` 统一管理照片、文本、贴纸、胶带和手绘线
- 支持照片移动、缩放、旋转、删除、复制和图层调整
- 支持多种贴纸、胶带、手绘线和文本样式
- 支持自定义文本框
- 支持保存、更新、刷新恢复和继续编辑
- 支持新建手账

### 旅行分享

- 发布文字游记和多图片游记
- 最多上传 9 张图片，单张图片大小限制为 10MB
- 支持点赞、评论和评论分页，每页 6 条
- 精选游记展示互动数据最高的前 10 条
- 图片加载失败时隐藏损坏图片
- 无图片游记只展示文字内容
- 支持分享弹窗、复制链接、二维码和浏览器系统分享
- 公共游记详情页：`/share/post/{postId}`

### 后端与数据持久化

- FastAPI + SQLAlchemy + PostgreSQL
- JWT 登录认证
- 用户、收藏、预定、行程、路线、手账、游记、评论和点赞持久化
- Alembic 数据库迁移
- `/api/uploads` 文件上传接口
- S3/MinIO 兼容对象存储，异常时支持本地存储回退

## 技术栈

### 前端

- Vue 3 Composition API
- Vite 5
- Pinia
- Vue Router 4
- 高德地图 JS API
- Leaflet、D3、html2canvas、qrcode
- 原生 CSS 和 Scoped CSS

### 后端

- Python 3.11+
- FastAPI
- PostgreSQL 14+
- SQLAlchemy 2
- Alembic
- JWT
- Uvicorn

### AI 与外部服务

- DeepSeek：文本对话和行程规划
- 智谱：图片与文本多模态分析
- Agnes AI：图片/视频生成能力
- 高德地图：地图、地理编码和路线规划
- S3/MinIO：图片等媒体资源存储

## 本地启动

### 前端依赖

```powershell
npm install
```

### 后端环境

```powershell
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
```

复制 `backend/.env.example` 为 `backend/.env`，配置数据库、JWT、AI 服务、对象存储和高德 Web 服务 Key。

### 数据库迁移

```powershell
cd backend
.venv\Scripts\alembic upgrade head
```

### 启动后端

```powershell
cd backend
.venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8081 --reload
```

### 启动前端

```powershell
npm run dev
```

默认地址：

- 前端：<http://127.0.0.1:5173>
- 后端 API：<http://127.0.0.1:8081>
- OpenAPI：<http://127.0.0.1:8081/openapi.json>
- 健康检查：<http://127.0.0.1:8081/health>

## 环境变量

前端 `.env`：

```env
VITE_API_BASE_URL=http://127.0.0.1:8081/api
VITE_AMAP_KEY=your-amap-js-key
```

后端 `backend/.env`：

```env
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/starwalk
SECRET_KEY=replace-with-a-long-random-secret
DEEPSEEK_API_KEY=your-deepseek-key
ZHIPU_API_KEY=your-zhipu-key
AGNES_API_KEY=your-agnes-key
AMAP_WEB_SERVICE_KEY=your-amap-web-service-key
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=starwalk
S3_REGION=us-east-1
S3_PUBLIC_URL=
```

不要把真实密码、API Key 或数据库凭据写入 README、Git 或前端代码。生产环境需要分别验证高德 JS API Key 的域名白名单和 Web 服务 Key 的路线规划权限。

## 构建与验证

```powershell
npm.cmd run build
cd backend
.venv\Scripts\python.exe -m pytest -q
```

当前本地验证结果：

- 前端构建通过
- 后端测试 3 passed
- 前端 `5173` 服务可访问
- 后端 `/health` 返回 200
- 游记公共详情接口可访问

## 当前限制与后续工作

- AI 模型调用依赖外部额度、网络和服务稳定性；视觉模型需要继续完善超时、重试和降级提示
- S3/MinIO 生产环境可用性和 CDN 配置尚未完成正式验收
- 微信、微博、QQ 等平台专用分享 SDK 尚未接入，目前提供复制链接、二维码和浏览器系统分享
- 前端构建仍有大于 500KB 的 chunk 提示，后续可进行路由级代码分割
- 尚未完成生产域名、HTTPS、CI/CD 和正式部署验收
- 尚未建立完整的前端 Playwright/E2E 自动化测试

## 项目结构

```text
backend/              FastAPI 后端、数据库模型、路由和迁移
public/               静态图片和地图资源
src/components/       公共组件和地图组件
src/views/            页面级组件
src/stores/           Pinia 状态管理
src/utils/            API 与 AI 服务封装
src/router/           Vue Router 路由
```

项目为学习和交流用途，生产使用前请完成安全配置、第三方服务权限、对象存储、HTTPS 和完整验收。
