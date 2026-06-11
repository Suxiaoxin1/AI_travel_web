<div align="center">

# 🧭 探途 · WANDR

**AI 智能旅行伴侣 — 让每一次出行都值得被记录**

[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-brightgreen?style=flat-square&logo=leaflet)](https://leafletjs.com/)

[功能概览](#功能概览) · [快速开始](#快速开始) · [项目结构](#项目结构) · [架构说明](#架构说明)

</div>

---

## 功能概览

| 模块 | 页面 | 描述 |
|------|------|------|
| 🤖 **AI 行程规划** | `ai-plan.html` | 上传照片/文字/语音，DeepSeek / 智谱 AI 生成个性化旅行攻略 |
| 🧠 **MBTI 旅行性格** | `mbti.html` | 16 型旅行性格测试，匹配专属目的地与风格 |
| 🏨 **热门目的地** | `destinations.html` | 浏览热门城市/景区，一键跳转飞猪完成预订 |
| 🗺️ **景点导航** | `navigate.html` | 全国景点地图标注，多点路线规划与可视化 |
| 📸 **口碑评价** | `reviews.html` | 聚合多平台真实评价，AI 提炼核心洞察 |
| 📓 **AI 旅行日记** | `journal.html` | 上传照片自动生成手帐日记，支持图片导出 |

所有页面共享：收藏管理、预订面板、用户中心、Toast 通知。

---

## 快速开始

### 环境要求

- **Node.js** >= 18.x
- 现代浏览器（Chrome / Edge / Firefox）

### 本地运行

```bash
# 1. 克隆项目
git clone https://github.com/Suxiaoxin1/AI_travel_web.git
cd AI_travel_web

# 2. 安装后端依赖
cd server
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 API Key（详见 .env.example 注释）

# 4. 启动后端
npm start
# 服务运行在 http://localhost:3001

# 5. 打开前端
# 直接用浏览器打开 index.html，或使用 Live Server
```

> 💡 AI 功能支持在前端设置面板中直接填入 API Key，无需后端也可使用。

### 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `FLYAI_API_KEY` | 飞猪 AI 开放平台 Key | 预订功能需要 |
| `AMAP_API_KEY` | 高德地图 API Key | 路线规划需要 |
| `DEEPSEEK_API_KEY` | DeepSeek API Key（前端配置） | AI 规划需要 |
| `ZHIPU_API_KEY` | 智谱 AI Key（前端配置） | 视觉分析需要 |
| `OPENAI_BASE_URL` | OpenAI 代理地址 | 日记生成需要 |

---

## 项目结构

```
travel-website/
├── index.html                      # 首页（SPA 入口 + 六大模块卡片）
├── ai-plan.html                    # AI 行程规划页
├── mbti.html                       # MBTI 性格测试页
├── destinations.html               # 热门目的地页
├── navigate.html                   # 景点导航页（Leaflet 地图）
├── reviews.html                    # 口碑评价页
├── journal.html                    # AI 旅行日记页
├── style.css                       # 全局样式（含响应式断点）
│
├── china-destinations-data.js      # 热门目的地数据（85KB）
├── china-all-spots-data.js         # 全国景点坐标数据（84KB）
│
├── js/                             # 前端 JS 模块
│   ├── wandr-core.js               # 命名空间、全局状态、工具函数
│   ├── i18n.js                     # 消息常量 / 多语言扩展
│   ├── api-key-manager.js          # API Key 统一管理
│   ├── toast-anim.js               # Toast 提示 + 滚动动画
│   ├── fav-manager.js              # 收藏 / 预订 / 日记本地管理
│   ├── shared.js                   # 共享业务逻辑（导航栏、弹窗、事件委托等）
│   ├── page-ai-plan.js             # AI 规划页专属逻辑
│   ├── page-mbti.js                # MBTI 测试页专属逻辑
│   ├── page-destinations.js        # 目的地页专属逻辑
│   ├── page-navigate.js            # 导航页专属逻辑
│   ├── page-reviews.js             # 评价页专属逻辑
│   └── page-video.js               # 日记页专属逻辑
│
├── server/                         # 后端服务（端口 3001）
│   ├── index.js                    # Express 应用入口（飞猪AI / 路线 / 评价 / 分享）
│   ├── config/                     # 配置（高德、常量）
│   ├── routes/                     # API 路由（评价、分享）
│   ├── services/                   # 业务逻辑（飞猪、订单、爬虫）
│   ├── route-planner/              # 路线规划子模块
│   │   ├── routes/                 # 地址 / 路线 API
│   │   ├── services/               # 地址 / 路线 / 路径优化
│   │   ├── middleware/             # 错误处理 / 参数校验
│   │   ├── repositories/           # 缓存
│   │   └── utils/                  # 日志 / 限流 / 校验
│   ├── data/                       # 静态数据（订单、分享、评价汇总）
│   ├── .env.example                # 环境变量模板
│   └── package.json
│
└── .gitignore
```

---

## 架构说明

### MPA 多页面架构

项目从 SPA（单页应用）改造为 MPA（多页面应用），每个功能模块独立为 `.html` 页面：

```
首页 (index.html)  ──→  ai-plan.html       (AI 行程规划)
                   ├─→  mbti.html          (MBTI 性格测试)
                   ├─→  destinations.html  (热门目的地)
                   ├─→  navigate.html      (景点导航)
                   ├─→  reviews.html        (口碑评价)
                   └─→  journal.html       (AI 旅行日记)
```

### JS 加载顺序

每个页面的 JS 加载遵循固定依赖链：

```
wandr-core.js → i18n.js → api-key-manager.js → toast-anim.js → fav-manager.js
    → (数据文件：china-destinations-data.js / china-all-spots-data.js)
        → shared.js → page-xxx.js (页面专属逻辑)
```

- `shared.js`：共享业务逻辑 — 导航栏、汉堡菜单、事件委托、骨架屏、焦点陷阱、卡片动画、用户面板、飞猪集成、目的地详情弹窗
- `page-*.js`：各页面专属逻辑，DOM 守卫确保只在本页运行

### 技术栈

**前端**
- HTML5 / CSS3 / 原生 JavaScript（无框架依赖）
- Leaflet.js — 交互式地图引擎（CDN 加载）
- 高德地图 API — 后端路线计算与地理编码
- Font Awesome 6 — 图标库
- html2canvas — 旅行日记图片导出（CDN 加载）

**后端**
- Node.js + Express — API 服务器
- axios / p-limit — HTTP 请求与并发控制
- node-cache — 服务端缓存
- winston — 日志系统
- playwright — 景区评论爬虫

**AI 服务**
- DeepSeek API — AI 行程规划主力模型
- 智谱 AI（GLM）— 视觉分析 + 备用模型
- OpenAI API — 旅行日记生成
- 飞猪 FlyAI — 机票/酒店搜索与预订

### 响应式断点

| 断点 | 适用设备 |
|------|----------|
| `< 480px` | 小屏手机 |
| `< 768px` | 竖屏平板 / 大屏手机 |
| `< 1024px` | 横屏平板 |
| `>= 1400px` | 大屏显示器 |

---

## 贡献

欢迎提交 Issue 或 Pull Request：

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: add your feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 发起 Pull Request

---

## License

[MIT](LICENSE) © 2026 Suxiaoxin1

---

<div align="center">
  <sub>用 ❤️ 和 AI 构建，为热爱旅行的你</sub>
</div>
