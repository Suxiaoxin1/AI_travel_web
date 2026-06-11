# 探途 WANDR — Railway 极简部署指引

> 约 5 分钟上线，全程无需 SSH / 服务器运维 / Nginx 配置。

---

## 前提条件

| 项目 | 说明 |
|------|------|
| GitHub 账号 | 已有此仓库 |
| Railway 账号 | 用 GitHub 一键登录 [railway.app](https://railway.app) |
| API Keys | `FLYAI_API_KEY` + `AMAP_API_KEY` + `DEEPSEEK_API_KEY` 已就绪 |

---

## 第 1 步：登录 Railway

1. 打开 [railway.app](https://railway.app)
2. 点击右上角 **Login** → 选择 **Login with GitHub**
3. 授权 Railway 访问你的 GitHub 账号

---

## 第 2 步：创建项目

1. 点击 **New Project** → 选择 **Deploy from GitHub repo**
2. 在弹出的列表中找到 `travel-website`，点击 **Deploy Now**
3. Railway 自动检测到根目录 `package.json`，执行：
   - `npm install` → 自动触发 `postinstall`，安装 `server/` 子目录依赖
   - `npm start` → 启动 `node server/index.js`

---

## 第 3 步：填入环境变量（最重要！）

1. 在项目 Dashboard 点击你的 service（通常名为 `travel-website`）
2. 切换到 **Variables** 标签
3. 点击 **New Variable**，逐条添加：

| 变量名 | 说明 | 获取方式 |
|--------|------|---------|
| `FLYAI_API_KEY` | 飞猪开放平台 Key | fly.ai → 控制台 → API Keys |
| `AMAP_API_KEY` | 高德地图 Web 服务 Key | console.amap.com → 我的应用 |
| `DEEPSEEK_API_KEY` | DeepSeek AI Key | platform.deepseek.com → API Keys |

> ⚠️ **必须填完 3 个 Key 后，点击右上角 Deploy → Redeploy 重新部署**，否则 API 调用会失败。

---

## 第 4 步：访问上线站点

1. 部署完成后，Railway 会在 **Settings** 页显示 `Public Domain`：
   ```
   https://travel-website-production-xxxx.up.railway.app
   ```
2. 复制这个域名，粘贴到浏览器，你的网站就上线了！
3. Railway 自动提供 HTTPS，无需额外配置。

---

## 可选：绑定自定义域名

1. 在 Railway Dashboard → 你的 service → **Settings** → **Domains**
2. 点击 **Generate Domain** 或 **Custom Domain**
3. 输入你的域名（如 `wandr.travel`）
4. 在域名 DNS 管理中添加一条 CNAME 记录：
   ```
   类型: CNAME
   主机记录: @（或 www）
   记录值: 你的 Railway 域名（travel-website-production-xxxx.up.railway.app）
   ```
5. 等待 DNS 生效（1-10 分钟），Railway 自动签发 SSL 证书

---

## 验证清单

部署后请依次验证：

- [ ] 首页 `index.html` 正常加载
- [ ] AI 规划页 `ai-plan.html` 能调 DeepSeek
- [ ] 导航地图页 `navigate.html` 能加载高德地图
- [ ] MBTI 页 `mbti.html` 正常切换
- [ ] 目的地页 `destinations.html` 数据正常
- [ ] 手帐日记页 `journal.html` 功能正常
- [ ] 评价页 `reviews.html` 正常（评论爬虫已降级，不影响）

---

## 常见问题

### Q: 部署后显示 "Internal Server Error"
A: 大概率是为环境变量未填或填错。检查 Railway Dashboard → Variables 中 3 个 Key 是否齐全、值是否正确。

### Q: 免费额度够用吗？
A: Railway 免费额度每月 $5 或 500 小时。探途 WANDR 纯静态 + 轻量 API 代理，日常开发使用绰绰有余。

### Q: 国内访问慢怎么办？
A: Railway 节点在海外，中国大部分地区延迟 150-300ms。旅行网站非实时交易场景可用。如需更低延迟，后续可迁移至腾讯云轻量服务器。

### Q: 如何更新部署？
A: 本地 `git push` 到 GitHub → Railway 自动检测 → 自动重新部署。无需手动操作。
