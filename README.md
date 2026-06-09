<div align="center">

# 🧭 探途 · WANDR

**AI 智能旅行伴侣 — 让每一次出行都值得被记录**

[![GitHub Stars](https://img.shields.io/github/stars/Suxiaoxin1/AI_travel_web?style=flat-square&color=f5a623)](https://github.com/Suxiaoxin1/AI_travel_web/stargazers)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-brightgreen?style=flat-square&logo=leaflet)](https://leafletjs.com/)

[在线体验](#快速开始) · [功能截图](#功能预览) · [本地运行](#本地运行) · [项目结构](#项目结构)

</div>

---

## ✨ 核心功能

| 模块 | 描述 |
|------|------|
| 🤖 **AI 行程规划** | 接入 DeepSeek / 智谱 AI，输入目的地与天数，一键生成个性化旅行攻略 |
| 🗺️ **景点地图导航** | 基于 Leaflet.js 展示全国景点，支持省份切换、自定义标注与地理搜索 |
| 🛤️ **多点路线规划** | 智能规划多个景点间的最优路线，支持路径可视化与导出 |
| 🧠 **MBTI 旅行性格测试** | 根据性格类型推荐专属旅行目的地与风格 |
| 📸 **用户分享社区** | 浏览、发布、点赞他人的旅行故事与照片 |
| 📓 **AI 旅行日记** | 上传照片，AI 自动生成旅行游记，支持导出为图片 |
| 🏨 **热门目的地 & 预订** | 浏览热门城市/景区，一键跳转飞猪完成预订 |
| ❤️ **收藏 & 我的预订** | 本地化管理收藏景点与预订记录 |

---

## 🛠️ 技术栈

### 前端
- **HTML5 / CSS3 / 原生 JavaScript**（SPA 单页应用）
- **Leaflet.js** — 交互式地图引擎
- **CartoDB** — 中文地图底图
- **阿里云 DataV** — 中国省份 GeoJSON 边界数据
- **Font Awesome 6** — 图标库
- **html2canvas** — 旅行日记图片导出

### 后端
- **Node.js + Express** — API 服务器
- **axios** — HTTP 请求
- **node-cache** — 服务端缓存
- **winston** — 日志系统
- **dotenv** — 环境变量管理

### AI & 第三方服务
- **DeepSeek API** — AI 行程规划主力模型
- **智谱 AI（GLM）** — 备用 AI 模型
- **OpenAI API** — 旅行日记生成
- **飞猪 FlyAI** — 机票/酒店搜索与预订

---

## 📁 项目结构

```
travel-website/
├── index.html                  # 主页面（SPA 入口）
├── style.css                   # 全局样式（含响应式断点）
├── script.js                   # 主业务逻辑（AI规划/地图/分享/日记）
│
├── js/                         # 功能模块
│   ├── wandr-core.js           # 命名空间、全局状态、工具函数、LRU 缓存
│   ├── api-key-manager.js      # API Key 统一管理工厂
│   ├── fav-manager.js          # 收藏管理（FavManager）
│   ├── toast-anim.js           # Toast 提示 + 滚动动画
│   └── i18n.js                 # 消息常量 / 多语言扩展
│
├── lib/                        # 本地依赖库
│   └── leaflet/                # Leaflet 地图库
│
├── server/                     # 后端服务
│   ├── index.js                # Express 应用入口
│   ├── routes/                 # API 路由
│   ├── services/               # 业务逻辑服务
│   ├── route-planner/          # 路线规划模块
│   ├── config/                 # 配置文件
│   ├── data/                   # 静态数据（景点/分享）
│   └── package.json
│
├── china-destinations-data.js  # 热门目的地数据
├── china-all-spots-data.js     # 全国景点坐标数据
└── 路线规划/                   # 路线规划独立模块
```

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.x
- 现代浏览器（Chrome / Edge / Firefox）

### 本地运行

**1. 克隆项目**

```bash
git clone https://github.com/Suxiaoxin1/AI_travel_web.git
cd AI_travel_web
```

**2. 安装后端依赖**

```bash
cd server
npm install
```

**3. 配置环境变量**

```bash
# 复制示例配置
cp server/.env.example server/.env
```

编辑 `server/.env`，填入你的 API Keys：

```env
# DeepSeek API
DEEPSEEK_API_KEY=your_deepseek_key_here

# 智谱 AI（可选）
ZHIPU_API_KEY=your_zhipu_key_here

# OpenAI（旅行日记功能）
OPENAI_API_KEY=your_openai_key_here
```

**4. 启动后端服务**

```bash
cd server
npm start
# 服务运行在 http://localhost:3000
```

**5. 打开前端**

直接用浏览器打开 `index.html`，或使用 Live Server 插件启动。

> 💡 也可以在前端页面的设置面板中，直接填入 API Key，无需后端即可使用 AI 功能。

---

## 🗺️ 功能预览

### AI 行程规划
输入目的地、天数、出行人数，AI 自动生成包含交通、餐饮、住宿的完整攻略。

### 景点地图
全国 3000+ 景点坐标标注，按省份筛选，支持搜索定位与景点详情查看。

### MBTI 旅行性格测试
回答简短问卷，获取专属旅行性格标签（如「探险者」「文艺浪人」）及匹配目的地。

### 用户分享社区
瀑布流展示旅行故事，支持点赞、评论、发布新游记。

---

## 📝 开发说明

### 响应式断点

| 断点 | 适用设备 |
|------|----------|
| `< 480px` | 小屏手机 |
| `< 768px` | 竖屏平板 / 大屏手机 |
| `< 1024px` | 横屏平板 |
| `>= 1400px` | 大屏显示器 |

### 模块架构

前端采用命名空间模式，所有状态统一挂载在 `WANDR.state`，避免全局变量污染：

```javascript
WANDR.state = {
  currentDestKey: null,
  route: { waypoints, polyline, markers, ... },
  map: { leafletMap, selectedSpot, provinceLayer, ... },
  shares: { all, currentIndex, editingId, ... },
  diary: { photos, currentHTML, isGenerating, ... },
  mbti: { currentCategory, currentQuestion, answers },
}
```

---

## 🤝 贡献

欢迎提交 Issue 或 Pull Request！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: add your feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 发起 Pull Request

---

## 📄 License

[MIT](LICENSE) © 2026 Suxiaoxin1

---

<div align="center">
  <sub>用 ❤️ 和 AI 构建，为热爱旅行的你</sub>
</div>
