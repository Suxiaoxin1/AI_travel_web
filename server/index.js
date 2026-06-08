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

// ─── OpenAI GPT-4o 日记生成代理（绕过浏览器 CORS 限制）───
// POST /api/openai/generate-diary
// Body: { apiKey, title, date, style, content, tags, photoCount }
//
// 支持通过环境变量 OPENAI_BASE_URL 配置代理地址：
//   - 官方直连（需代理）: 不设置，默认 https://api.openai.com/v1
//   - 国内代理: OPENAI_BASE_URL=https://你的代理域名/v1
//   - 其他兼容 API: OPENAI_BASE_URL=https://xxx.com/v1
app.post('/api/openai/generate-diary', async (req, res) => {
  try {
    const { apiKey, title, date, style, content, tags, photoCount } = req.body;
    if (!apiKey) return res.status(400).json({ success: false, error: '缺少 OpenAI API Key' });
    if (!title && !content) return res.status(400).json({ success: false, error: '缺少日记内容' });

    const styleNames = { fresh: '清新手帐风', collage: '美式拼贴风', retro: '复古胶片风' };
    const styleName = styleNames[style] || '清新手帐风';

    const tagsStr = (tags || []).join('、') || '无';

    const systemPrompt = `你是一位顶级小红书旅行手账设计师，擅长 Aesthetic Scrapbook Collage 风格，融合真实旅行摄影与软萌插画元素。请根据用户提供的旅行日记内容，生成一份排版精致、层次丰富、充满温暖生活感的HTML手帐页面。

【整体美学定位——Xiaohongshu Premium Travel Scrapbook】
- 页面尺寸：固定宽度440px，高度必须填满且不低于820px（9:16手机全屏竖版比例）。使用 CSS \`padding: 20px 16px\` 留出自然边距。
- 不要输出 <html>, <head>, <body> 等外层标签，只输出手帐内部HTML代码片段。
- 整体风格：Premium lifestyle travel scrapbook · editorial magazine layout · cinematic travel photography · cozy warm pastel tones · soft film grain · nostalgic mood

【背景质感——极为重要】
- 米色纹理纸底（beige textured paper）：用内联CSS实现 \`background-color: #f7f2e9\` 搭配细微纹理，如点阵网格 \`radial-gradient(circle, #e8dcc8 1px, transparent 1px)\` + \`background-size: 16px 16px\`，营造纸张触感。
- 可在局部叠加"撕纸"效果的多层色块：用不规则圆角矩形 \`border-radius: 60% 40% 70% 30% / 45% 55% 50% 50%\` + 半透明背景色模拟 torn paper collage。
- 整体底色必须保持温暖柔软的质感，如 "奶油米白"、"淡卡其"、"杏仁米色"，绝不能用纯白或冷色调。

【照片排版要求——小红书杂志级】
- 照片必须错落拼贴，形成 layered scrapbook composition（层级拼贴构图）：
  * 主照片（风景/地标）：宽度60%-75%，放在视觉焦点位置
  * 小照片（美食/自拍/票根）：宽度28%-45%，围绕主照片分布
  * 每张照片旋转角度随机（-4deg 到 6deg），营造"随手粘贴"的真实感
  * 照片之间必须有重叠感、穿插感，不要等距平铺！
- 照片形状多样化（模拟不同裁剪）：
  - 拍立得/Polaroid：\`border: 6px solid #fff; border-bottom: 28px solid #fff; box-shadow: 2px 3px 10px rgba(0,0,0,0.12)\`，适合主风景照
  - 胶卷底片 strip：横向窄长容器 \`width: 180px; height: 130px\`，内含2-3张并排小图
  - 圆形/椭圆：\`border-radius: 50%\` 或 \`border-radius: 55% 45% 60% 40% / 50% 55% 45% 50%\`，适合食物、自拍
  - 不规则圆角矩形：\`border-radius: 6px 20px 10px 14px\`，适合街景、建筑
  - 所有照片必须使用 \`object-fit: cover\` 裁剪
- 照片边框：白色/奶油色相框（\`border: 4px solid #fff\` 或 \`border: 5px solid #faf5ed\`），搭配柔光阴影 \`box-shadow: 2px 3px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)\`
- 胶带固定（masking tape）：至少4条不同颜色的半透明和纸胶带，用CSS渐变模拟（暖黄、薄荷绿、樱花粉、浅紫），贴在各照片角落，胶带边缘要呈现"被撕开"的不规则感

【文字排版要求——手写笔记风格】
- 标题（大标题）：\`font-size: 32px; font-weight: 800; letter-spacing: 3px; color: #5c3d2e\`（深棕暖色），加 \`text-shadow: 2px 2px 0 rgba(210,160,120,0.2)\` 营造立体复古感。可配英文副标题（小写手写体风格，\`font-size: 13px; color: #b8a088; letter-spacing: 4px; text-transform: lowercase\`）。
- 日期：精致胶囊标签 \`background: rgba(232,200,160,0.3); border-radius: 16px; padding: 3px 14px; font-size: 11px; color: #a08060\`
- 正文（handwritten Chinese diary notes）：必须把用户输入扩展成2-3段温暖深情的旅行随笔，每段3-5句话。字体用 \`font-family: "KaiTi", "STKaiti", "Microsoft YaHei", cursive\`，\`line-height: 2.0\`，\`font-size: 14px; color: #5a4636\`。文字要有"手写日记"的温度和情绪。
- 引言块（emotional captions）：用左侧彩色竖线 \`border-left: 3px solid #e0b890; padding-left: 14px; color: #8b6f5c; font-style: italic\`，包裹一句有感染力的旅行感悟
- 便签纸区块：\`background: rgba(255,252,240,0.7); border-radius: 3px 20px 5px 18px; transform: rotate(-1deg); box-shadow: 1px 2px 6px rgba(0,0,0,0.06)\`，模拟随手贴在页面上的便签

【模块化分区 —— 小红书 Scrapbook 结构】
根据内容在页面中创建模块化区块（用虚线或色块分隔），至少包含：
- "旅途纪行"模块：旅行正文 + 引言块
- "美食探店"模块（如有食物相关内容）：用小图标 🍜🥐☕ 标注美食文字
- "行程清单 / Travel Checklist"模块：用小方块 \`☑\` 或 \`☐\` 勾选样式列出行程节点，字号 12px，暖灰色，排列紧凑
- "随手拍"模块：集中展示照片拼贴区
- 标签区：pill形状标签 \`border-radius: 18px; padding: 3px 14px; font-size: 11px; background: rgba(232,190,150,0.25); border: 1px dashed rgba(180,140,100,0.3); margin: 2px; display: inline-block\`

【装饰元素 —— 萌系贴纸和小图标（核心灵魂）】
- 可爱插画元素（cute illustrated decorations）：
  * Emoji 贴纸（至少 8-12 个！分布全页）：📍✈️🧭📷🌿☀️🌊🎐💫❤️🌸🍜☕🎫🧸☁️⭐️🏔️🚗💌 等
  * 每个 emoji 必须装在圆形/圆角方形"贴纸底托"里：\`background: rgba(255,255,255,0.88); border-radius: 50%; padding: 5px; box-shadow: 1px 2px 6px rgba(0,0,0,0.08); display: inline-block\`，逼真模拟真实贴纸
  * 贴纸用 \`position: absolute\` 散布在页面四周（页边、照片间隙、文字旁），不要扎堆
- Q版简笔插画（chibi doodles）：
  * 用 SVG path 绘制 3-5 个简单可爱的涂鸦：小云朵 ☁、小星星 ⭐、小爱心 ❤、小旗子 🚩、小相机 📷、小脚印 👣
  * SVG 线条用低饱和度暖色（如 #d4a88c、#c2d5c0、#f0d0b0），不要黑色
- 手绘波浪线/箭头/虚线：用 SVG 绘制 3-5 条装饰线，连接不同模块或点缀空白区
- 手写批注：\`font-size: 10px; color: #c0a080; transform: rotate(-5deg); position: absolute\`，如"好想再去一次✨"、"收藏了这个地方~"、"治愈系小店💫"

【色彩体系 —— Cozy Warm Pastel Tones】
- 主色调：米白 #f7f2e9 / 奶油杏 #faf5ed / 暖灰棕 #5c3d2e / 深驼 #8b6f5c
- 点缀色：薄荷绿 #c8dcc8 / 樱花粉 #f0d0d0 / 淡鹅黄 #f5e6c8 / 天蓝 #d0dde8 / 淡紫 #e0d0e0
- 整体色温：温暖柔和，像午后阳光洒在纸面上的感觉（cozy and warm sunlight）
- 营造 soft film grain 氛围：可在背景上叠加细微噪点纹理，使用径向渐变 \`radial-gradient(ellipse at center, rgba(255,248,235,0.3) 0%, rgba(245,235,215,0.6) 100%)\` 模拟柔光

【技术规则】
- 所有CSS必须内联在 style 属性中，不使用 class 引用（前端用 html2canvas 渲染）
- 不使用任何外部资源（图片、字体CDN）
- 照片的 img 标签 src 必须设为 \`{{PHOTO_N}}\`（如 \`<img src="{{PHOTO_0}}">\`），前端会替换为真实URL
- 确保所有元素使用 \`position: relative\` 或 \`absolute\` 实现层叠效果，不能有元素互相遮挡导致内容不可见
- html2canvas 兼容性：避免复杂的 CSS filter、clip-path、mix-blend-mode、CSS Grid；transform: rotate() 支持良好；照片容器用 \`display:inline-block\` + \`margin\` 实现错落，比 absolute 定位更稳定
- 整体页面要呈现出 "premium handcrafted travel scrapbook / viral Xiaohongshu aesthetic" 的视觉效果`;

    const userPrompt = `请为以下旅行日记设计一份小红书 Premium Travel Scrapbook 风格的 HTML 手帐页面。

【标题】${title || '旅行日记'}
【日期】${date || '未知日期'}
【内容】${content || '记录旅途中的美好瞬间'}
【标签】${tagsStr}
【照片数量】${photoCount || 0}张
${photoCount > 0 ? '【照片占位说明】\n共' + photoCount + '张照片。每张用 <img src="{{PHOTO_N}}"> 嵌入，外面用样式div包裹。必须错落重叠！\n\n🎨 照片形状要求（每张不同，避免重复）：\n- 主风景照 → 拍立得：border:6px solid #fff; border-bottom:28px solid #fff; 底部留白可写小字备注\n- 美食/自拍照 → 圆形/椭圆：border-radius:50% 或 55% 45% 60% 40% / 50% 55% 45% 50%\n- 街景/建筑 → 不规则圆角矩形：border-radius: 6px 20px 10px 14px 或 4px 16px 8px 12px\n- 多图组合 → 横向胶卷条带：width:180px; height:130px; 内含2-3张并排小图\n- 所有照片 object-fit: cover + box-shadow: 2px 3px 12px rgba(0,0,0,0.10)\n\n示例（拍立得风格）：\n<div style="display:inline-block; transform:rotate(3deg); margin:8px; position:relative;">\n  <img src="{{PHOTO_0}}" style="border:6px solid #fff; border-bottom:28px solid #fff; border-radius:3px; box-shadow:2px 3px 12px rgba(0,0,0,0.12); width:210px; height:230px; object-fit:cover;">\n  <div style="position:absolute; top:-7px; left:20%; width:50%; height:14px; background:linear-gradient(90deg, rgba(255,224,130,0.7) 20%, rgba(255,204,128,0.8) 50%, rgba(255,224,130,0.7) 80%); transform:rotate(-4deg); border-radius:1px;"></div>\n</div>\n' : '无照片，请用CSS/SVG绘制旅行主题萌系插画（小飞机、地图钉、相机、太阳、云朵、贝壳等简笔画）填充照片区，搭配大量emoji贴纸。'}

【🚀 小红书 Scrapbook 特别要求 —— 核心规范】
1. 🌸 美学定位：Xiaohongshu Premium Aesthetic · Viral Travel Scrapbook · Cozy Pastel Tones · Soft Film Grain · Editorial Layout
2. ✍️ 文字扩展：把用户内容扩展成2-3段温暖深情的旅行随笔（每段3-5句），要有情绪感染力。加上英文副标题（小写手写风），营造杂志感
3. 🖼️ 照片拼贴：大小错落 + 形状多样（圆形/拍立得/椭圆/不规则圆角/胶卷条带）+ 白色相框 + 旋转-4°~6° + 和纸胶带固定 + 柔光阴影 + object-fit:cover
4. 🎀 装饰系统：
   - 和纸胶带：至少4条不同颜色（暖黄、薄荷绿、樱花粉、浅紫），有撕边感
   - Emoji贴纸：至少8-12个！必须放在圆形白底上（像真贴纸），散布全页各处
   - SVG涂鸦：3-5条手绘波浪线/箭头/虚线连接模块，低饱和度暖色
   - 手写批注：斜体小字"好想再去一次✨"、"治愈系~"、"收藏了💫"
   - 标签云：pill形状标签，底部排列
5. 📋 模块化分区（重要！）：
   - "旅途纪行"区块 → 旅行正文 + 引言块
   - "美食探店"区块（如有食物）→ 🍜☕ 标注 + 美食描述
   - "行程清单"区块 → ☑/☐ 勾选样式，列出关键行程节点
   - "随手拍"区块 → 照片拼贴集中区
6. 🎨 色彩：米白底 #f7f2e9 + 点阵纹理 + 暖棕文字 #5c3d2e + 驼色点缀 #8b6f5c + 杏色装饰
7. 📱 布局：440x820px 9:16比例，充分利用全页空间，底部也有内容，不留大面积空白
8. 🔧 所有CSS内联，不引用外部资源
9. 🌟 标题32px深棕手写风 + 英文小写副标题 + 胶囊日期标签
10. 📸 如有照片则必须全用 <img src="{{PHOTO_N}}">，没有照片就用CSS/SVG萌系插画代替

请直接输出手帐内部HTML代码片段。`;

    // 支持通过环境变量配置代理地址和模型
    const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
    const apiUrl = `${OPENAI_BASE_URL}/chat/completions`;

    console.log('[OpenAI Diary] 请求地址:', apiUrl);
    console.log('[OpenAI Diary] 模型:', OPENAI_MODEL);
    console.log('[OpenAI Diary] prompt 长度:', userPrompt.length);

    const resp = await axios.post(
      apiUrl,
      {
        model: OPENAI_MODEL,
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
        timeout: 120000,  // 提高超时到 120 秒
      }
    );

    const generatedHTML = resp.data?.choices?.[0]?.message?.content;
    if (!generatedHTML) {
      console.error('[OpenAI Diary] 未返回内容:', JSON.stringify(resp.data).slice(0, 500));
      return res.status(500).json({ success: false, error: 'GPT 未返回有效内容' });
    }

    // 清洗：去掉可能的 markdown 代码块包裹
    let cleanHTML = generatedHTML
      .replace(/```html\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    console.log('[OpenAI Diary] 生成成功，HTML 长度:', cleanHTML.length);

    res.json({ success: true, html: cleanHTML });
  } catch (err) {
    console.error('[OpenAI Diary] 错误:', err.message);

    // OpenAI API 返回了错误响应（如 401/429/500）
    if (err.response) {
      const status = err.response.status;
      const detail = JSON.stringify(err.response.data).slice(0, 300);
      console.error(`[OpenAI Diary] OpenAI 响应 ${status}:`, detail);
      return res.status(status).json({
        success: false,
        error: `OpenAI API ${status} 错误: ${detail}`,
      });
    }

    // 请求超时
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return res.status(504).json({
        success: false,
        error: '请求 OpenAI API 超时 (120s)，可能是网络不稳定或 API 响应过慢',
      });
    }

    // DNS 解析失败 / 无法连接 —— 国内最常见的问题
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
      const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      return res.status(502).json({
        success: false,
        error: `无法连接到 OpenAI API (${err.code})。`
          + `当前目标: ${OPENAI_BASE_URL}。`
          + '如果你在国内，需要在 .env 中设置 OPENAI_BASE_URL 为代理地址。'
          + '例如: OPENAI_BASE_URL=https://你的代理域名/v1',
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
app.listen(PORT, () => {
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
