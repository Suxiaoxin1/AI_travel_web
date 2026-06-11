/**
 * 探途 WANDR - 后端服务（飞猪 AI + 路线规划 + 景区评论）
 * 
 * 架构说明:
 * ┌──────────┐     REST API     ┌──────────────┐   OpenClaw    ┌────────────┐
 * │ 前端页面  │ ◄──────────────► │  Node.js 后端 │ ◄───────────► │ 飞猪 FlyAI  │
 * │ index.html│    /api/xxx      │  (本文件)     │   协议         │  开放平台   │
 * └──────────┘                   └──────┬───────┘               └────────────┘
 *                                       │
 *                       ┌───────────────┼───────────────┐
 *                       │               │               │
 *                  ┌────┴────┐   ┌──────┴──────┐  ┌────┴─────┐
 *                  │ 订单存储  │   │ 路线规划模块  │  │ 景区评论  │
 *                  │orders.json│  │ route-planner│  │ reviews   │
 *                  └─────────┘   └──────┬──────┘  └──────────┘
 *                                       │
 *                                  ┌────┴────┐
 *                                  │ 高德地图  │
 *                                  │   API    │
 *                                  └─────────┘
 * 
 * 启动方式:
 *   1. cd server && npm install
 *   2. cp .env.example .env → 填入 API Keys
 *   3. npm run dev
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const flyai = require('./services/flyai-client');
const orderStore = require('./services/order-store');
const reviewsRouter = require('./routes/reviews');
const sharesRouter = require('./routes/shares');
const registerRoutePlannerRoutes = require('./route-planner/routes');
const { errorHandler } = require('./route-planner/middleware/error.handler');

const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ================================================================
//  API 路由
// ================================================================

// ─── 健康检查 ───
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: process.env.NODE_ENV || 'sandbox',
    flyaiEnabled: !!process.env.FLYAI_API_KEY && process.env.FLYAI_API_KEY !== 'your_api_key_here',
    timestamp: new Date().toISOString(),
  });
});

// ─── 1. 搜索旅行团产品 ───
// POST /api/products/search
// Body: { keyword, city, startDate, days, people, type }
app.post('/api/products/search', async (req, res) => {
  try {
    const { keyword, city, startDate, days, people, type } = req.body;
    const result = await flyai.searchTourProducts({ keyword, city, startDate, days, people, type });
    res.json(result);
  } catch (err) {
    console.error('[searchProducts]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 2. 创建预订订单 ───
// POST /api/bookings
// Body: { productId, productName, destName, type, contactName, contactPhone,
//         startDate, days, people, totalPrice }
app.post('/api/bookings', async (req, res) => {
  try {
    const {
      productId, productName, destName, type,
      contactName, contactPhone, startDate,
      days, people, totalPrice
    } = req.body;

    // 1. 参数校验
    if (!contactName || !contactName.trim()) {
      return res.status(400).json({ success: false, error: '请输入联系人姓名' });
    }
    if (!contactPhone || !/^1[3-9]\d{9}$/.test(contactPhone)) {
      return res.status(400).json({ success: false, error: '请输入有效的手机号码' });
    }
    if (!startDate) {
      return res.status(400).json({ success: false, error: '请选择出发日期' });
    }

    // 2. 调用飞猪 API 创建订单
    let fliggyResult = null;
    try {
      fliggyResult = await flyai.createBooking({
        productId: productId || 'default',
        contactName: contactName.trim(),
        contactPhone,
        startDate,
        adultCount: people || 2,
        childCount: 0,
      });
    } catch (e) {
      console.warn('[createBooking] 飞猪 API 调用异常，降级到本地订单', e.message);
    }

    // 3. 生成本地订单 ID 并存库
    const localId = 'WDR' + Date.now().toString(36).toUpperCase();
    const order = orderStore.createOrder({
      id: localId,
      fliggyOrderId: fliggyResult?.orderId || null,
      destName: destName || '未知目的地',
      productName: productName || destName,
      type: type || '跟团游',
      contactName: contactName.trim(),
      contactPhone,
      startDate,
      days: days || 5,
      people: people || 2,
      totalPrice: totalPrice || '待定',
      status: fliggyResult?.status || 'confirmed',
      payUrl: fliggyResult?.payUrl || null,
    });

    res.json({
      success: true,
      order,
      fliggy: fliggyResult,
      message: fliggyResult?.payUrl
        ? '订单已创建，请点击支付链接完成付款'
        : '订单创建成功！',
    });
  } catch (err) {
    console.error('[createBooking]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 3. 获取订单列表 ───
// GET /api/bookings?phone=138xxxx
app.get('/api/bookings', (req, res) => {
  try {
    const { phone } = req.query;
    const orders = orderStore.getUserOrders(phone);
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 4. 获取单个订单详情 ───
// GET /api/bookings/:id
app.get('/api/bookings/:id', (req, res) => {
  try {
    const order = orderStore.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: '订单不存在' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 5. 取消订单 ───
// POST /api/bookings/:id/cancel
// Body: { reason }
app.post('/api/bookings/:id/cancel', async (req, res) => {
  try {
    const order = orderStore.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: '订单不存在' });
    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, error: '订单已取消' });
    }

    // 调用飞猪 API 取消订单（如有 fliggyOrderId）
    if (order.fliggyOrderId) {
      try {
        await flyai.cancelBooking(order.fliggyOrderId, req.body.reason || '用户取消');
      } catch (e) {
        console.warn('[cancelBooking] 飞猪 API 取消失败，仅取消本地记录', e.message);
      }
    }

    const updated = orderStore.cancelOrder(req.params.id);
    res.json({ success: true, order: updated, message: '订单已取消' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 6. 获取目的地推荐产品（快捷接口） ───
// GET /api/products/recommend?dest=张家界
app.get('/api/products/recommend', async (req, res) => {
  try {
    const { dest } = req.query;
    if (!dest) return res.json({ success: true, products: [] });

    const result = await flyai.searchTourProducts({ keyword: dest, people: 2 });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 景区评论爬虫路由 ───
app.use('/api/reviews', reviewsRouter);

// ─── 用户分享路由 ───
app.use('/api/shares', sharesRouter);

// ─── 路线规划模块路由 ───
registerRoutePlannerRoutes(app);

// ─── 路线规划错误处理中间件 ───
app.use('/api/route', errorHandler);
app.use('/api/address', errorHandler);

// ─── AI 日记生成代理（绕过浏览器 CORS 限制）───
// POST /api/openai/generate-diary
// Body: { apiKey, title, date, style, content, tags, photoCount }
//
// 默认使用 DeepSeek（国内免费，OpenAI 兼容格式），可通过环境变量切换：
//   - DeepSeek（默认）: AI_DIARY_BASE_URL=https://api.deepseek.com/v1, AI_DIARY_MODEL=deepseek-chat
//   - 其他兼容 API: AI_DIARY_BASE_URL=https://xxx.com/v1, AI_DIARY_MODEL=xxx
//   - 兼容旧版 OpenAI 配置: 设置 OPENAI_BASE_URL/OPENAI_MODEL 可覆盖默认值

/**
 * 根据风格构建独立的 systemPrompt + userPrompt
 * 六种风格各有不同的色彩、排版、装饰、照片框架体系
 */
function buildStylePrompt(style, ctx) {
  const { title, date, content, tagsStr, photoCount } = ctx;
  const safeTitle = title || '旅行日记';
  const safeDate = date || '未知日期';
  const safeContent = content || '记录旅途中的美好瞬间';

  // — 通用技术规则（六种风格共享）—
  const TECH_RULES = `
【技术规则 —— 必须遵守】
- 所有CSS必须内联在 style 属性中，不使用 class 引用（前端用 html2canvas 渲染）
- 不使用任何外部资源（图片、字体CDN）
- 照片 img 标签 src 必须设为 {{PHOTO_1}}、{{PHOTO_2}} 等（编号从1开始），如 <img src="{{PHOTO_1}}">，前端会替换为真实URL
- 不要输出 <html>, <head>, <body> 等外层标签，只输出手帐内部HTML代码片段
- 页面固定宽度480px，高度填满且不低于820px（9:16竖版比例），CSS padding: 20px 16px
- 使用 position:relative 或 absolute 实现层叠，不能用 CSS Grid / clip-path / mix-blend-mode / filter
- transform: rotate() 支持良好；照片容器用 display:inline-block + margin 实现错落
- 字体选择：中文优先 "KaiTi","STKaiti","Microsoft YaHei"；英文标题优先 serif 字体如 "Georgia","Times New Roman"`.trim();

  // — 照片渲染指导（根据 photoCount 动态生成）—
  function photoGuide(count, frameStyle) {
    if (count === 0) return '无照片，请用CSS/SVG绘制旅行主题装饰插画填充照片区';
    return `共${count}张照片，编号1-${count}。第1张用 <img src="{{PHOTO_1}}">，第2张用 <img src="{{PHOTO_2}}"> 以此类推，外面用样式div包裹。${frameStyle}`;
  }

  // ============ 风格1：复古胶片 vintage ============
  if (style === 'vintage') {
    return {
      system: `你是一位擅长复古胶片风格的旅行手账设计师，深受胶片摄影和怀旧美学影响。你创作的手帐充满颗粒感、暖棕色调，仿佛从旧时光里翻出的一本旅行相册。

【美学定位 —— Retro Film Travel Journal】
暖棕色系 · 胶片颗粒 · 拍立得拼贴 · 怀旧纸质感 · Kodak Portra 色板

【色彩体系】
- 主色：米黄 #f5ead5 / 奶油白 #fdfaf0 / 深棕 #4a3020 / 焦糖 #8b5e3c
- 点缀：老照片黄 #e8d5a8 / 褪色砖红 #c47a5a / 橄榄绿 #8a9a6b / 古铜金 #b8936e
- 文字：深棕 #4a3020，标题可用更深的 #2c1810
- 背景：做旧米黄纸 texture（radial-gradient 点阵 + 细微噪点），暖黄光晕

【排版风格】
- 标题：font-size:30px; color:#4a3020; letter-spacing:4px; font-family:"Georgia","KaiTi",serif；配英文手写体副标题（font-size:12px; color:#b8936e; font-style:italic; letter-spacing:3px）
- 日期：褪色印章风格：background:rgba(200,160,100,0.2); border:1px dashed #c4a078; border-radius:12px; padding:3px 12px; font-size:11px; color:#8b6e5c
- 正文：font-family:"KaiTi","STKaiti",cursive; line-height:2.0; font-size:14px; color:#5a4030；扩展为2-3段温暖的旅行随笔
- 引言块：border-left:3px solid #c4a078; padding-left:14px; color:#8b6e5c; font-style:italic; background:rgba(245,235,210,0.3)
- 标签：pill形状 border-radius:16px; background:rgba(200,160,100,0.18); border:1px dashed rgba(180,130,80,0.3); font-size:11px; color:#8b6e5c

【照片框架 —— 拍立得 + 胶卷底片主导】
- 主照→Polaroid：border:6px solid #fdfaf0; border-bottom:26px solid #fdfaf0; box-shadow:2px 3px 10px rgba(60,30,10,0.15); width:200-240px
- 小照→圆形椭圆 border-radius:50%；或胶卷条带 width:160px height:120px 内含2-3张并排图
- 每张照片旋转 -5°~5°，交错重叠，用CSS模拟泛黄相纸边缘
- 照片框颜色：#f5ead5 或 #fdfaf0 奶油白边框

【装饰元素——复古感】
- 和纸胶带：暖黄、古铜、橄榄绿 3-4条，半透明带撕边
- Emoji贴纸：✈️📷🎞️🧭📮🗺️🧳🌅☕🎫 等 6-8个，放在圆形半透明白底上
- 手写批注：倾斜小字颜色 #b8936e，"胶片里的回忆🎞️"
- SVG装饰：虚线箭头（#c4a078）、小相机简笔画、星星涂鸦
- 局部"撕纸重叠"效果：不规则圆角色块覆盖

【模块化】
- "旅行札记" → 正文+引言
- "胶片相册" → 照片拼贴区
- "旅途印记" → 标签云
${TECH_RULES}`,

      user: `请为以下内容设计一份【复古胶片风】旅行手帐HTML。

【标题】${safeTitle}
【日期】${safeDate}
【内容】${safeContent}
【标签】${tagsStr}
【照片】${photoGuide(photoCount, '拍立得边框主导（border:6px solid #fdfaf0; border-bottom:26px），每张旋转-5°~5°，奶油白相框，焦糖色胶带固定。没有照片则用SVG画老式相机、胶片、地图钉等复古元素。')}

【核心要求】
1. 暖棕色调 · 胶片颗粒感 · 拍立得拼贴 · 怀旧纸质感
2. 文字扩展成2-3段旅行随笔，有旧日记的温度
3. 标题配英文小写副标题（手写体风格）
4. 至少6个emoji贴纸散布全页 + 3条和纸胶带
5. 模块化分区：旅行札记 / 胶片相册 / 旅途印记
6. 480×820px，页面填满不留大片空白
7. 所有CSS内联，照片用 {{PHOTO_N}} 占位

请直接输出手帐内部HTML代码。`
    };
  }

  // ============ 风格2：简约清新 minimal ============
  if (style === 'minimal') {
    return {
      system: `你是一位极简主义旅行手账设计师，深受日本MUJI风格和北欧Scandi美学影响。你创作的手帐干净克制、大量留白、用最少的元素传递最大的情感。

【美学定位 —— Minimalist Travel Journal】
极简留白 · 克制配色 · 纤细线条 · 呼吸感排版 · 日式侘寂美学

【色彩体系】
- 主色：纯白 #ffffff / 浅灰白 #f8f8f6 / 深灰 #3a3a3a / 中灰 #8a8a8a
- 点缀：鼠尾草绿 #b0c4a8 / 雾蓝 #c0cfd8 / 淡杏 #f0e8d8 （仅作点缀，面积不超过5%）
- 文字：深灰 #3a3a3a，标题可略深 #2a2a2a
- 背景：纯白或极浅灰色，完全不用纹理，追求洁净空气感

【排版风格】
- 标题：font-size:28px; font-weight:300; color:#2a2a2a; letter-spacing:6px; font-family:"Georgia","KaiTi",serif；极其克制的字号和字重
- 日期：极简细线框：border:1px solid #d0d0d0; border-radius:2px; padding:2px 10px; font-size:10px; color:#999; letter-spacing:2px
- 正文：font-family:"KaiTi","STKaiti","Microsoft YaHei"; line-height:2.2; font-size:13px; color:#5a5a5a；每段之间有足够间距（margin-bottom:28px），让文字呼吸
- 引言块：border-left:1px solid #d0d0d0; padding-left:16px; color:#888; font-style:italic; font-size:13px
- 标签：极简方框 border:1px solid #e0e0e0; border-radius:2px; padding:2px 10px; font-size:10px; color:#999; background:transparent

【照片框架——极简几何】
- 所有照片为直角矩形或轻微圆角（border-radius:2px），不加旋转
- 白色边框 border:3px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,0.06)
- 照片等距排列（margin:8px），可形成2×2或3×2的干净网格
- 主照width:85%，小照width:48%，不重叠
- 不使用胶带、不旋转、不倾斜，追求绝对秩序感

【装饰元素——极简克制】
- 完全不使用emoji贴纸
- 不使用胶带、SVG涂鸦
- 唯一装饰：1-2条极细分隔线（border-top:1px solid #eee; width:60px）或者小圆点分隔符 ···
- 装饰文字：仅1条手写小字"☁ quiet moments"放在角落，font-size:9px; color:#ccc

【模块化——简约分区】
- 顶部：标题+日期，大面积留白
- 中段：旅行正文，段落间距充足
- 底部：照片区（干净网格排列）
- 末行：标签+日期
${TECH_RULES}`,

      user: `请为以下内容设计一份【简约清新风】旅行手帐HTML。

【标题】${safeTitle}
【日期】${safeDate}
【内容】${safeContent}
【标签】${tagsStr}
【照片】${photoGuide(photoCount, '直角矩形，白色细边框，等距网格排列，不旋转不重叠。没有照片则用极简线条SVG画几何形状（圆形/方形）占位。')}

【核心要求】
1. 极简留白 · 克制配色 · 大量呼吸空间 · 纯白背景
2. 文字扩展成2-3段旅行随笔，段落之间保持28px+间距
3. 不使用任何emoji贴纸、胶带、涂鸦装饰
4. 照片直角矩形网格排列，不旋转
5. 标题轻字重（font-weight:300），超大letter-spacing
6. 480×820px，但60%以上面积为留白，让内容呼吸
7. 所有CSS内联，照片用 {{PHOTO_N}} 占位

请直接输出手帐内部HTML代码。`
    };
  }

  // ============ 风格3：多彩活泼 colorful ============
  if (style === 'colorful') {
    return {
      system: `你是一位充满活力的旅行手账设计师，擅长用大胆鲜艳的色彩、趣味的排版、丰富的贴纸和涂鸦打造让人看了就开心的元气手帐。

【美学定位 —— Colorful Playful Travel Journal】
鲜艳撞色 · 圆润形状 · 满版贴纸 · 趣味涂鸦 · 元气满满

【色彩体系】
- 主色：珊瑚粉 #ff6b6b / 天空蓝 #4ecdc4 / 向日葵黄 #ffe66d / 薰衣草紫 #a29bfe
- 底色：淡奶油 #fffef5 或 浅粉 #fff5f5 或 浅蓝 #f5faff（可用渐变 mixing）
- 文字：深灰 #333，标题可用彩色渐变
- 彩色便签块：粉色 #ffe0e0 / 黄色 #fff8d0 / 蓝色 #d8ecff / 绿色 #d8f5e0

【排版风格】
- 标题：font-size:34px; font-weight:800; 文字彩色渐变效果 background:linear-gradient(135deg,#ff6b6b,#feca57,#4ecdc4); -webkit-background-clip:text; -webkit-text-fill-color:transparent 或直接用彩色单字
- 日期：彩色圆角胶囊 border-radius:20px; padding:4px 14px; font-size:12px; font-weight:600; 背景色随机从调色板选（粉/黄/蓝/紫）
- 正文：font-family:"KaiTi","Microsoft YaHei"; line-height:1.9; font-size:14px; color:#444；可穿插彩色关键词（如"太好吃了！"用粉色）
- 引言块：彩色便签样式 border-radius:12px; padding:12px 16px; transform:rotate(1deg); 背景色从调色板选
- 标签：colorful pill彩色填充标签

【照片框架——多彩趣味】
- 彩色相框：border:5px solid（颜色从调色板随机选：粉/黄/蓝/绿/紫）
- 照片旋转 -6°~8°，翘角效果
- 圆形照片 border-radius:50%、星形裁剪（可用border技巧）、圆角矩形
- 照片散落有重叠感，模拟"把照片扔在桌面上"的随性感
- 彩色胶带固定：至少5条不同颜色的和纸胶带

【装饰元素——元气贴纸大爆发】
- Emoji贴纸至少12-15个！散布全页，必须放在彩色圆形底托上（不透明度0.9）
  推荐：🌈✨💖🎀🌸🍦🍭🧸🎈🌟🦋💫🎪🌻🍉🎨
- 彩色虚线、波浪线（SVG）：用调色板颜色绘制
- 涂鸦式小图标：小太阳、小彩虹、小冰淇淋、小气球
- 手写批注：彩色小字，"超可爱！💖"、"好吃到转圈圈🍰"、"下次还要来！"

【模块化】
- "快乐旅程" → 正文+引言
- "美照放送" → 照片拼贴
- "今日份开心" → 标签+emoji
- 彩色色块分隔区域
${TECH_RULES}`,

      user: `请为以下内容设计一份【多彩活泼风】旅行手帐HTML。

【标题】${safeTitle}
【日期】${safeDate}
【内容】${safeContent}
【标签】${tagsStr}
【照片】${photoGuide(photoCount, '彩色相框（边框颜色：粉/黄/蓝/绿/紫随机），旋转-6°~8°，部分圆形裁剪，彩色胶带固定。没有照片则用彩色SVG画太阳/彩虹/气球等元气元素。')}

【核心要求】
1. 鲜艳撞色 · 圆润形状 · 至少12个emoji贴纸 · 元气满满
2. 文字扩展成2-3段活泼的旅行随笔，彩色关键词高亮
3. 照片彩色边框（粉/黄/蓝/绿/紫），趣味旋转
4. 标题用彩色渐变效果
5. 至少5条不同颜色的和纸胶带
6. 彩色虚线/波浪线SVG装饰
7. 480×820px，页面有能量感不沉闷
8. 所有CSS内联，照片用 {{PHOTO_N}} 占位

请直接输出手帐内部HTML代码。`
    };
  }

  // ============ 风格4：暗黑质感 dark ============
  if (style === 'dark') {
    return {
      system: `你是一位擅长暗黑风格的高级旅行手账设计师，作品充满电影感、奢华质感和深邃氛围。你的手帐仿佛出自一本高端独立杂志的午夜特辑。

【美学定位 —— Dark Moody Travel Journal】
暗黑底色 · 金铜点缀 · 高对比 · 电影质感 · 奢华暗夜美学

【色彩体系】
- 主色：深黑 #1a1a1a / 炭灰 #2d2d2d / 墨蓝 #1c2433 / 深棕黑 #221c18
- 亮点：古铜金 #c9a96e / 玫瑰金 #b8866b / 哑光金 #a08060 / 银灰 #9ca3af
- 文字：暖白 #e8e0d5（不用纯白），标题可用金色 #c9a96e
- 背景：深色纯底或细微纹理（radial-gradient 暗角光晕），营造暗房/星空氛围

【排版风格】
- 标题：font-size:34px; font-weight:700; color:#c9a96e; letter-spacing:5px; font-family:"Georgia","KaiTi",serif；金色金属质感字体
- 日期：金色细线框 border:1px solid rgba(201,169,110,0.4); border-radius:2px; padding:3px 12px; font-size:10px; color:#a09080; letter-spacing:3px
- 正文：font-family:"KaiTi","STKaiti","Microsoft YaHei"; line-height:2.1; font-size:14px; color:#c5bab0；段落有呼吸间距
- 引言块：border-left:3px solid #c9a96e; padding-left:14px; color:#b8a890; font-style:italic
- 标签：暗色标签 border:1px solid rgba(201,169,110,0.25); border-radius:14px; padding:2px 12px; font-size:10px; color:#a09080

【照片框架——暗夜相框】
- 深色细边框：border:3px solid #2a2a2a; box-shadow:0 4px 20px rgba(0,0,0,0.5)
- 照片加暗角效果（通过叠加半透明黑色渐变遮罩模拟 vignette）
- 主照width:70%，小照width:35%-45%
- 微微旋转 -3°~3°，低调不夸张
- 金色线条或铜色胶带作为照片固定元素
- 照片之间留暗色间隙，像画廊展墙上的作品

【装饰元素——克制奢华】
- Emoji贴纸仅4-6个，低调精致：🌙✨🌌🎬🖤🥃 放在半透明深色圆底上
- 金色细线分隔（border-top:1px solid rgba(201,169,110,0.3)）
- SVG装饰：星座连线、星轨弧线（金色/铜色线条）
- 手写批注：颜色 #a09080，"夜色中的城市🌙"

【模块化】
- "暗夜纪行" → 正文+引言
- "光影画廊" → 照片区
- "午夜印记" → 标签
- 用金色细线分隔各模块
${TECH_RULES}`,

      user: `请为以下内容设计一份【暗黑质感风】旅行手帐HTML。

【标题】${safeTitle}
【日期】${safeDate}
【内容】${safeContent}
【标签】${tagsStr}
【照片】${photoGuide(photoCount, '深色细边框（border:3px solid #2a2a2a），暗角阴影，低调旋转-3°~3°，像画廊作品。没有照片则用金色SVG画星座/星轨/月亮等暗夜元素。')}

【核心要求】
1. 深黑/炭灰底色 · 金色铜色点缀 · 电影质感 · 暗夜氛围
2. 文字扩展成2-3段沉浸式旅行随笔，暗色调情绪
3. 标题用金色金属质感（color:#c9a96e）
4. 照片深色边框+暗角阴影效果
5. 4-6个低调emoji贴纸 + 金色细线分隔
6. 暖白文字 #e8e0d5（不用纯白）
7. 480×820px，全页填充深色不留白
8. 所有CSS内联，照片用 {{PHOTO_N}} 占位

请直接输出手帐内部HTML代码。`
    };
  }

  // ============ 风格5：水彩手绘 watercolor ============
  if (style === 'watercolor') {
    return {
      system: `你是一位水彩艺术旅行手账设计师，擅长用水彩渲染、手绘线条、柔和的色彩渐变来创作充满艺术气息的手帐。你的作品像一本随身水彩速写本。

【美学定位 —— Watercolor Art Travel Journal】
水彩晕染 · 手绘线稿 · 柔和渐变 · 艺术速写 · 梦幻朦胧

【色彩体系】
- 主色：水彩蓝 #b8d4e3 / 水彩粉 #f0d0d8 / 水彩绿 #c8dfc8 / 水彩紫 #d8d0e8 / 水彩黄 #f5ecd8
- 底色：水彩纸白 #faf8f4 或极淡的水彩渐变 wash（从某个淡彩色过渡到白色）
- 文字：软灰棕 #6a5a50，不要纯黑
- 背景效果：用 radial-gradient 模拟水彩边缘晕染，色块边界柔和模糊

【排版风格】
- 标题：font-size:30px; font-weight:400; color:#5a4a40; letter-spacing:3px; font-family:"Georgia","KaiTi",serif；手写体风格
- 日期：水彩墨点标签：圆形或椭圆背景色块（border-radius:50%，半透明水彩色），padding:6px 14px; font-size:11px
- 正文：font-family:"KaiTi","STKaiti",cursive; line-height:2.1; font-size:14px; color:#6a5a50；2-3段诗意文字
- 引言块：水彩便签 background:linear-gradient(135deg, rgba(200,220,230,0.4), rgba(220,200,210,0.4)); border-radius:8px 20px 8px 20px; padding:12px 16px
- 标签：水彩渐变色标签 border-radius:16px; background:rgba(200,210,220,0.3); font-size:10px

【照片框架——水彩相框】
- 水彩边框：用 box-shadow 多层模拟水彩笔触边框（内层浅色，外层渐变色）
  例如：box-shadow:0 0 0 4px rgba(255,255,255,0.9), 0 0 0 8px rgba(180,200,210,0.25), 0 3px 12px rgba(0,0,0,0.08)
- 照片右上角或左下角叠加水彩色块 wash（半透明渐变圆形），模拟"刚画完还没干"的感觉
- 圆角柔和 border-radius:4px 12px 4px 12px
- 微微旋转 -2°~3°，像速写本里随手夹的照片
- 水彩胶带固定：柔和半透明彩色条（蓝/粉/绿）

【装饰元素——水彩手绘】
- 不用emoji贴纸！用水彩色块+手写文字代替
- 圆形水彩墨点：radial-gradient 彩色圆形散布（淡蓝、淡粉、淡黄），大小不一
- SVG手绘线条：用 stroke-dasharray 模拟铅笔速写线
- 水彩小图：小叶子🍃简笔画、小花朵🌸简笔画、小咖啡杯☕简笔（用纯CSS或SVG绘制，线条颜色柔和）
- 手写批注：倾斜草书风格，"水彩的温柔🎨"

【模块化】
- "水彩游记" → 正文+引言
- "速写剪影" → 照片区
- "画册边角" → 标签+水彩墨点
- 模块间用水彩渐变 wash 色块过渡
${TECH_RULES}`,

      user: `请为以下内容设计一份【水彩手绘风】旅行手帐HTML。

【标题】${safeTitle}
【日期】${safeDate}
【内容】${safeContent}
【标签】${tagsStr}
【照片】${photoGuide(photoCount, '水彩笔触边框（多层box-shadow），柔和圆角，水彩色块叠加，微微旋转。没有照片则用水彩SVG画花朵/叶子/咖啡杯等速写元素。')}

【核心要求】
1. 水彩晕染底色 · 柔和渐变 · 手绘线条 · 艺术速写感
2. 文字扩展成2-3段诗意旅行随笔
3. 照片用水彩笔触边框（多层box-shadow + 水彩色块叠加）
4. 不用emoji贴纸！用水彩色块+圆形墨点+SVG手绘代替
5. 水彩色调：蓝粉绿紫色系，柔和朦胧
6. 背景用水彩渐变 wash 效果
7. 480×820px，整体像一本水彩速写本
8. 所有CSS内联，照片用 {{PHOTO_N}} 占位

请直接输出手帐内部HTML代码。`
    };
  }

  // ============ 风格6：杂志排版 magazine ============
  if (style === 'magazine') {
    return {
      system: `你是一位顶级旅行杂志美术编辑，擅长Vogue、Condé Nast Traveler、Monocle风格的编辑排版。你创作的手帐结构严谨、层次分明、像一本高端旅行杂志的专题页面。

【美学定位 —— Editorial Magazine Travel Journal】
编辑排版 · 网格结构 · 粗体标题 · 跨页设计 · 现代精炼质感

【色彩体系】
- 主色：纯白 #ffffff / 浅灰 #f5f5f5 / 深黑 #1a1a1a / 中灰 #666
- 点缀：杂志红 #c0392b / 金盏黄 #e8a838 / 深蓝 #1a3a5c / 墨绿 #1a4a3a
- 文字：标题用深黑 #1a1a1a，正文用深灰 #333
- 背景：纯白或浅灰色块分区，色块边缘锐利，像杂志排版

【排版风格】
- 标题：font-size:36px; font-weight:900; color:#1a1a1a; letter-spacing:2px; font-family:"Georgia","Times New Roman","KaiTi",serif; text-transform:uppercase 用于英文
- 副标题（deck）：font-size:16px; font-weight:400; color:#666; font-style:italic; line-height:1.5
- 日期：杂志格式位置：放在标题上方或旁边，小号大写字母 font-size:10px; font-weight:600; letter-spacing:3px; color:#999; text-transform:uppercase
- 正文：font-family:"KaiTi","STKaiti","Microsoft YaHei"; line-height:1.9; font-size:13px; color:#3a3a3a；可首字下沉（用font-size:36px float:left）
- Pull Quote（大字引用）：font-size:22px; font-weight:700; color:#1a3a5c; font-style:italic; letter-spacing:1px; border-left:4px solid #c0392b; padding-left:16px; margin:24px 0
- 段落之间：用细线分隔 border-top:1px solid #e0e0e0; margin:20px 0

【照片框架——杂志大片】
- 全幅出血照：width:100%（撑满页面宽度），不加边框
- 跨页布局：主照占满上1/3或下1/3页面
- 小照片条形排列：height:120px; object-fit:cover; 横向等宽排列
- 所有照片不旋转，保持杂志的精确和严谨
- 照片之间用 2px 白色分隔线
- 偶尔在照片角落叠加半透明文字标注（像杂志图片说明）

【装饰元素——编辑精炼】
- 完全不使用emoji贴纸
- 不使用胶带、涂鸦
- 唯一装饰：几何细线（border）、小方块色块（16×16px）、杂志页码风格编号
- 使用 "Section Header" 风格：全大写英文小标题 + 粗线下划线（border-bottom:3px solid #c0392b; display:inline-block）
- 底部可用"✦" "·" 等印刷符号做节分隔

【模块化——杂志结构】
- 封面区：主照全幅 + 标题叠在照片上（文字半透明深色背景）
- 正文区：两栏或通栏文字
- Pull Quote 插入区
- 照片画廊区：3-4张横图条形排列
- 底栏：标签+杂志名称"WANDR DIARY"
${TECH_RULES}`,

      user: `请为以下内容设计一份【杂志排版风】旅行手帐HTML。

【标题】${safeTitle}
【日期】${safeDate}
【内容】${safeContent}
【标签】${tagsStr}
【照片】${photoGuide(photoCount, '杂志全幅/条形排列，不加边框不旋转，照片撑满宽度。没有照片则用深色色块+粗体文字模拟杂志封面排版。')}

【核心要求】
1. 编辑排版 · 粗体标题 · 网格结构 · 现代精炼
2. 文字扩展成2-3段旅行随笔 + 1个Pull Quote大字引用
3. 照片全幅出血或条形排列，不旋转不加边框
4. 不使用任何emoji、贴纸、胶带
5. 标题超大36px font-weight:900
6. 杂志风格Section Header + 红色点缀线条
7. 480×820px，像Vogue Travel专题页
8. 所有CSS内联，照片用 {{PHOTO_N}} 占位

请直接输出手帐内部HTML代码。`
    };
  }

  // — 兜底：默认使用vintage复古风 —
  return {
    system: '',
    user: `请为以下内容设计一份复古旅行手帐HTML。【标题】${safeTitle}【日期】${safeDate}【内容】${safeContent}【标签】${tagsStr}【照片】${photoGuide(photoCount, '拍立得风格')}。480×820px，所有CSS内联，照片 {{PHOTO_N}}。直接输出HTML。`
  };
}

app.post('/api/openai/generate-diary', async (req, res) => {
  try {
    const { apiKey, title, date, style, content, tags, photoCount } = req.body;
    if (!apiKey) return res.status(400).json({ success: false, error: '缺少 DeepSeek API Key' });
    if (!title && !content) return res.status(400).json({ success: false, error: '缺少日记内容' });

    const tagsStr = (tags || []).join('、') || '无';

    // ============ 六种风格的独立提示词 ============
    const prompts = buildStylePrompt(style, { title, date, content, tagsStr, photoCount });
    const systemPrompt = prompts.system;
    const userPrompt = prompts.user;

    // 支持通过环境变量配置：优先 AI_DIARY_*，兼容旧 OPENAI_* 变量
    const AI_DIARY_BASE_URL = (process.env.AI_DIARY_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/+$/, '');
    const AI_DIARY_MODEL = process.env.AI_DIARY_MODEL || process.env.OPENAI_MODEL || 'deepseek-chat';
    const apiUrl = `${AI_DIARY_BASE_URL}/chat/completions`;

    console.log('[AI Diary] 请求地址:', apiUrl);
    console.log('[AI Diary] 模型:', AI_DIARY_MODEL);
    console.log('[AI Diary] prompt 长度:', userPrompt.length);

    const resp = await axios.post(
      apiUrl,
      {
        model: AI_DIARY_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 4096,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 180000,  // DeepSeek 生成复杂 HTML 需较长时间
      }
    );

    const generatedHTML = resp.data?.choices?.[0]?.message?.content;
    if (!generatedHTML) {
      console.error('[AI Diary] 未返回内容:', JSON.stringify(resp.data).slice(0, 500));
      return res.status(500).json({ success: false, error: 'AI 模型未返回有效内容' });
    }

    // 清洗：去掉可能的 markdown 代码块包裹
    let cleanHTML = generatedHTML
      .replace(/```html\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    console.log('[AI Diary] 生成成功，HTML 长度:', cleanHTML.length);

    res.json({ success: true, html: cleanHTML });
  } catch (err) {
    console.error('[AI Diary] 错误:', err.message);

    // API 返回了错误响应（如 401/429/500）
    if (err.response) {
      const status = err.response.status;
      const detail = JSON.stringify(err.response.data).slice(0, 300);
      console.error(`[AI Diary] 响应 ${status}:`, detail);
      return res.status(status).json({
        success: false,
        error: `AI API ${status} 错误: ${detail}`,
      });
    }

    // 请求超时
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return res.status(504).json({
        success: false,
        error: '请求 AI API 超时 (120s)，可能是网络不稳定或 API 响应过慢',
      });
    }

    // DNS 解析失败 / 无法连接
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
      const AI_DIARY_BASE_URL = (process.env.AI_DIARY_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/+$/, '');
      return res.status(502).json({
        success: false,
        error: `无法连接到 AI API (${err.code})。`
          + `当前目标: ${AI_DIARY_BASE_URL}。`
          + '如果你在国内，默认使用 DeepSeek（api.deepseek.com），无需额外配置。',
      });
    }

    // 其他未知错误
    res.status(500).json({
      success: false,
      error: `请求失败 (${err.code || 'UNKNOWN'}): ${err.message}`,
    });
  }
});

// ================================================================
//  静态文件托管（生产模式）
// ================================================================
app.use(express.static(path.join(__dirname, '..')));

// ================================================================
//  启动服务
// ================================================================
const server = app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  探途 WANDR 后端服务已启动');
  console.log(`  地址: http://localhost:${PORT}`);
  console.log(`  模式: ${process.env.NODE_ENV || 'sandbox'}`);
  console.log(`  API 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`  路线规划: http://localhost:${PORT}/api/route/health`);
  console.log('═══════════════════════════════════════════════');
  console.log('');
  
  // 检查高德API Key配置
  if (!process.env.AMAP_API_KEY || process.env.AMAP_API_KEY === '你的高德地图API_KEY') {
    console.log('⚠️  提示：高德地图API Key未配置，路线规划功能无法使用');
    console.log('   1. 访问 https://console.amap.com/dev/key/app 申请API Key');
    console.log('   2. 在 .env 中设置 AMAP_API_KEY');
    console.log('');
  }
});

// AI 日记生成超时时间较长，避免 Express 默认超时（120s）截断请求
server.timeout = 300000;           // 5 分钟总超时
server.headersTimeout = 310000;    // 请求头超时需大于 timeout
