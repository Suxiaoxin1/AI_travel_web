/**
 * 6 套固定模板 v3.6 — 智能布局（photoCount 维度）+ 抠图安全位 + AI 配字
 *  01 vintage 复古胶片：米黄旧纸 + TRAVEL 大字 + 圆形邮戳 + 植物枝 + 实心便签（完 + checkbox 清单，次底层）+ 5 图拼贴
 *  02 minimal 简约清新：浅米白 + 中央大主图 + 虚线圆环绕 + 米色椭圆点缀 + 落叶
 *  03 colorful 多彩活泼：淡蓝底 + 白网格纸竖条 + 7 图错落 + 大量小贴纸 + 多色手写注释
 *  04 dark 暗黑质感：纯黑 + "今天无味！" 大字 + 日历 + 圆月 + 白便签卡 + 蓝心 + 黄星
 *  05 watercolor 水彩手绘：暖棕底 + 企鹅贴纸 + polaroid + 满屏白色 sparkle + 黄便签条
 *  06 magazine 杂志排版：灰底 + 米色网格笔记本卡 + 红长尾夹 + 2/5 页码 + 黄便签条 + 实物贴纸
 *
 * v3.6 新增：
 *  - buildLayout 支持 3-9 张照片动态布局（base items + smartPackPositions 补位）
 *  - smartPackPositions：主体居中原则 + 5 张以内不重叠 + 6+ 张允许拼贴重叠
 *  - 抠图位（CUTOUT_SPOTS）：colorful 已挪到右下角避开贴纸，minimal 保留右上点缀位
 *
 * 贴纸用 OpenMoji 裸 hex（渲染器 resolveStickerHex 支持）
 * 照片位置 ±15px 抖动 + ±2° 旋转抖动（用户允许"略微改变位置"）
 */
(function () {
  const B = 'border';

  /* ================= 01 复古胶片 vintage（参考图1 "Travel memories"） ================= */
  const vintage = {
    style: 'vintage',
    style_variation: '旧时光剪贴本',
    canvas_width: 1080, canvas_height: 1440,
    // 做旧牛皮纸暖米黄（参考用户提供的纸样 R196 G177 B155），细纤维斑点，无横线/无重暗角
    bg_color: '#C4B19B',
    bg_noise: true,
    bg_paper_lines: false,  // 参考纸是纯色纸，无草稿线
    bg_paper_aged: false,   // 参考纸均匀，无重暗角
    // v3.8 复古胶片调色（Lightroom 式 9 参数，渲染完后套用）
    // D2 preset：B 温柔版基础上仅抬 brightness，contrast/clarity 不动以保留阴影
    //   vibrance+15, value-22, brightness+5, contrast-2, clarity+24, sat-2, grain+4, highlights+14, sharpen+44
    grade: {
      vibrance: 15, brightness: 5, contrast: -2, clarity: 24,
      saturation: -2, value: -22, grain: 4, highlights: 14, sharpen: 44
    },
    layout: 'scrapbook',
    items: [
      // 左中大图：拍立得 + caption（v3.8 相框改为暖米黄，做旧感）
      { photo_index: 0, x: 72, y: 372, width: 470, height: 340, rotate: -4, border: 'polaroid_white', border_color: '#EFE3C8',
        caption: 'good old days', caption_color: '#6B4F3A' },
      // 右中图：细白边（撕角感用旋转模拟）
      { photo_index: 1, x: 590, y: 330, width: 400, height: 310, rotate: 5, border: 'thin_white', border_color: '#EFE3C8' },
      // 中下左：软白边
      { photo_index: 2, x: 130, y: 790, width: 420, height: 300, rotate: -2, border: 'soft_white', border_color: '#EFE3C8' },
      // 右下：拍立得
      { photo_index: 3, x: 610, y: 700, width: 380, height: 280, rotate: 3, border: 'polaroid_white', border_color: '#EFE3C8',
        caption: 'with friends', caption_color: '#6B4F3A' },
      // 底部：横图（拼贴组主位）
      { photo_index: 4, x: 110, y: 1140, width: 460, height: 240, rotate: -3, border: 'thin_white', border_color: '#EFE3C8' }
    ],
    decor_stickers: [],   // 改用「复古贴纸库」随机拼贴（见 VINTAGE_LIBRARY + buildVintageStickers），不再用 emoji 贴纸
    tapes: [
      // 左中大图顶部：旧报纸灰米胶带（贴照片用）
      { x: 100, y: 352, width: 210, height: 30, rotate: -6, color: 'newsprint', opacity: 0.9 },
      // 右中图顶部
      { x: 640, y: 312, width: 190, height: 28, rotate: 5, color: 'newsprint_light', opacity: 0.88 },
      // 底部横图角上
      { x: 500, y: 1120, width: 170, height: 26, rotate: 24, color: 'newsprint_dark', opacity: 0.85 }
    ],
    pins: [],
    doodles: [
      // 植物枝条 ×3（参考图左上/右中/右下的干枝）
      { kind: 'branch', x: 400, y: 96, width: 190, height: 120, color: '#7A6A4F', rotate: 24 },
      { kind: 'branch', x: 940, y: 620, width: 160, height: 110, color: '#8A7A5F', rotate: -110 },
      { kind: 'branch', x: 580, y: 1330, width: 150, height: 100, color: '#7A6A4F', rotate: 160 },
      // 手绘爱心 + 星（散落点缀）
      { kind: 'heart', x: 620, y: 470, width: 52, height: 46, color: '#C0392B', stroke: 4 },
      { kind: 'star', x: 1000, y: 520, width: 44, height: 44, color: '#D4A24C', stroke: 3 },
      { kind: 'star', x: 70, y: 660, width: 36, height: 36, color: '#D4A24C', stroke: 3 },
      // v3.10 底部棕框（框住「完 + 清单」）→ v3.14 升级为「实心便签」，见下面 note 字段。
      // 原 rect 描边框 + 右上 circle 圆圈已移除（圆圈语义不明，用户要求去掉）
    ],
    // v3.14 「完 + 清单」实心便签（**次底层**）：与边框 #8B5A2B 同色系的实心米棕便签，
    // 渲染在 背景/卡片 之上、照片/贴纸 之下；框内「完」与清单文字走 under_photos 底层（在便签之上、照片之下）。
    // 贴纸/照片可以压住便签一部分，但受「不可全遮挡」保护（见 page-video.js noteCoreRect / coversNoteFully）。
    note: {
      x: 632, y: 1170, width: 430, height: 260,
      fill: '#E3D0B2',                 // 同色系浅调实心（边框 #8B5A2B 的浅色系）
      stroke: '#8B5A2B', stroke_width: 5,
      round: 10, shadow: true, rotate: 0
    },
    widgets: [
      // 右上圆形邮戳（参考图核心元素）；data.center 用 __DATE_YEAR__ / __DATE__ token，
      // 运行时由 bakeDateToken 替换为「用户填的日期 / 当日日期」，字体沿用原邮戳字（drawPostmarkItem 不变）
      { type: 'postmark', x: 770, y: 52, w: 230, h: 230, rotate: 8, color: '#6B5B45',
        data: { ring_top: 'MADE BY MEMORIES', ring_bottom: 'COLLECT MOMENTS', center: ['__DATE_YEAR__', '__DATE__'] } },
      // 左下 checkbox 清单（画在便签之上、照片/贴纸之下 → under_photos）
      { type: 'checklist', x: 655, y: 1292, w: 385, h: 140, under_photos: true,
        items: [
          { text: 'good food', checked: true },
          { text: 'nice view', checked: true },
          { text: 'perfect day', checked: false }
        ],
        data: { size: 28, gap: 40, box_color: '#6B4F3A' }, color: '#5A4A36' }
    ],
    texts: [
      // 左上大标题（参考图 "TRAVEL memories"）
      { content: 'TRAVEL', x: 64, y: 64, font_size: 150, color: '#3E2A18', font: 'script' },
      { content: 'memories', x: 76, y: 196, font_size: 62, color: '#5C3A20', font: 'script' },
      // 标题下手写长文（参考图左侧）
      { content: 'Collect beautiful moments', x: 90, y: 272, font_size: 22, color: '#7A5A3A', font: 'hand' },
      { content: 'in every city and cherish', x: 90, y: 298, font_size: 22, color: '#7A5A3A', font: 'hand' },
      { content: 'the little things.', x: 90, y: 324, font_size: 22, color: '#7A5A3A', font: 'hand' },
      // 便签上的"完"（便签内左上，作为"结束章"；under_photos → 画在便签之上、照片/贴纸之下）
      { content: '完', x: 655, y: 1198, font_size: 42, color: '#8B5A2B', font: 'hand', under_photos: true },
      // 底部手写句（参考图 "take a walk..."）
      { content: 'take a walk, take a breath,', x: 110, y: 1398, font_size: 24, color: '#7A5A3A', font: 'hand' },
      { content: 'and the city will tell you its story', x: 110, y: 1424, font_size: 24, color: '#7A5A3A', font: 'hand' },
      // ⏰ 出行时间带（位于标题下，buildLayout 时把 __DATE__ 替换为用户填的日期；用户未填则显示 "9月8日"）
      { content: '__DATE__', x: 420, y: 220, font_size: 26, color: '#6B4F3A', font: 'hand', rotate: -2 }
    ]
  };

  /* ================= 02 简约清新 minimal（参考图2 布局示意图） ================= */
  const minimal = {
    style: 'minimal',
    style_variation: '留白呼吸感',
    canvas_width: 1080, canvas_height: 1440,
    bg_color: '#F8F6F1', bg_noise: false,
    layout: 'hero_center',
    items: [
      // 中央大主图（示意图深绿主块）
      { photo_index: 0, x: 320, y: 330, width: 480, height: 430, rotate: 0, border: 'thin_white' },
      // 右上次主图（示意图中绿块）
      { photo_index: 1, x: 650, y: 118, width: 320, height: 210, rotate: 3, border: 'soft_white' },
      // 左下次主图（示意图浅绿块）
      { photo_index: 2, x: 96, y: 880, width: 350, height: 270, rotate: -3, border: 'thin_white' },
      // 右下主图
      { photo_index: 3, x: 560, y: 900, width: 360, height: 270, rotate: 2, border: 'soft_white' }
    ],
    decor_stickers: [
      { id: '1F343', x: 120, y: 120, width: 76, height: 76, rotate: -14 },  // 落叶
      { id: '1F343', x: 940, y: 560, width: 60, height: 60, rotate: 22 },   // 落叶2
      { id: '1F331', x: 90, y: 520, width: 54, height: 54, rotate: 8 }      // 嫩芽
    ],
    tapes: [
      { x: 340, y: 306, width: 200, height: 26, rotate: -3, color: 'washi_mint', opacity: 0.7 },
      { x: 620, y: 880, width: 190, height: 26, rotate: 3, color: 'washi_beige', opacity: 0.7 }
    ],
    pins: [],
    doodles: [
      // 白色虚线大圆环绕主图（示意图核心）
      { kind: 'circle', x: 190, y: 210, width: 740, height: 740, color: '#C9C4B8', stroke: 2 },
      // 米色椭圆点缀 ×3（示意图椭圆）
      { kind: 'ellipse', x: 130, y: 780, width: 110, height: 64, fill: '#E8E2D4' },
      { kind: 'ellipse', x: 880, y: 700, width: 90, height: 54, fill: '#E8E2D4' },
      { kind: 'ellipse', x: 500, y: 1250, width: 120, height: 66, fill: '#E8E2D4' },
      // 细下划线
      { kind: 'underline', x: 96, y: 1230, width: 300, color: '#B8B2A4', stroke: 2 }
    ],
    widgets: [],
    texts: [
      { content: 'Slow Living', x: 88, y: 72, font_size: 92, color: '#4A4640', font: 'script' },
      { content: '慢一点，让生活进来', x: 92, y: 176, font_size: 26, color: '#8A857A', font: 'hand' },
      { content: 'keep it simple', x: 96, y: 1200, font_size: 26, color: '#8A857A', font: 'hand' },
      // ⏰ 出行时间（替换原硬编码 SEP · 2026）
      { content: '__DATE__', x: 830, y: 1252, font_size: 22, color: '#A8A294', font: 'sans' }
    ]
  };

  /* ================= 03 多彩活泼 colorful（参考图3 网格纸+小照片群） ================= */
  const colorful = {
    style: 'colorful',
    style_variation: '甜系拼贴',
    canvas_width: 1080, canvas_height: 1440,
    bg_color: '#D8EBF5', bg_noise: false,
    layout: 'cluster_organic',
    cards: [
      // 中央偏右白色网格纸竖条（参考图核心）
      { x: 610, y: 70, width: 330, height: 1290, fill: '#FFFFFF', grid: true, gridV: true,
        lineColor: '#DCE8EE', lineSpacing: 30, colSpacing: 30, round: 6, shadow: true, rotate: 2 }
    ],
    items: [
      // 左上：thin 白边
      { photo_index: 0, x: 70, y: 170, width: 310, height: 240, rotate: -6, border: 'thin_white' },
      // 网格条上部（贴在网格纸上）
      { photo_index: 1, x: 640, y: 130, width: 270, height: 210, rotate: -3, border: 'polaroid_white',
        caption: 'so sweet!', caption_color: '#D3567A' },
      // 中左：彩色框
      { photo_index: 2, x: 90, y: 480, width: 290, height: 220, rotate: 4, border: 'color_frame' },
      // 网格条中部
      { photo_index: 3, x: 650, y: 430, width: 260, height: 200, rotate: 3, border: 'thin_white' },
      // 中下左：拍立得
      { photo_index: 4, x: 80, y: 780, width: 300, height: 230, rotate: -4, border: 'polaroid_white',
        caption: 'yummy~', caption_color: '#D3567A' },
      // 网格条下部
      { photo_index: 5, x: 645, y: 740, width: 265, height: 205, rotate: -2, border: 'soft_white' },
      // 底部通栏
      { photo_index: 6, x: 130, y: 1090, width: 780, height: 260, rotate: 0, border: 'thin_white' }
    ],
    decor_stickers: [
      { id: '1F431', x: 430, y: 120, width: 90, height: 90, rotate: -8 },   // 猫脸（Hello Kitty 位）
      { id: '1F41A', x: 470, y: 640, width: 70, height: 70, rotate: 10 },   // 贝壳（海星位）
      { id: '1F366', x: 420, y: 950, width: 70, height: 78, rotate: -10 },  // 冰淇淋
      { id: '1F388', x: 90, y: 1050, width: 64, height: 78, rotate: 12 },   // 气球
      { id: '1F334', x: 970, y: 990, width: 76, height: 90, rotate: 6 },    // 棕榈树
      { id: '1F436', x: 40, y: 690, width: 70, height: 66, rotate: -12 },   // 小狗
      { id: '2728', x: 500, y: 300, width: 54, height: 54, rotate: 0 },     // 闪光
      { id: '2B50', x: 60, y: 440, width: 46, height: 46, rotate: 8 },      // 星
      { id: '1F308', x: 950, y: 1370, width: 84, height: 60, rotate: -4 }   // 彩虹
    ],
    tapes: [
      { x: 40, y: 150, width: 170, height: 26, rotate: -40, color: 'washi_pink', opacity: 0.9 },
      { x: 280, y: 466, width: 150, height: 24, rotate: 6, color: 'washi_yellow', opacity: 0.9 },
      { x: 600, y: 1070, width: 190, height: 26, rotate: -4, color: 'washi_mint', opacity: 0.9 },
      { x: 60, y: 770, width: 150, height: 24, rotate: 42, color: 'washi_orange', opacity: 0.88 }
    ],
    pins: [
      { x: 1005, y: 96, color: 'red', size: 26 },
      { x: 630, y: 418, color: 'yellow', size: 24 }
    ],
    doodles: [
      { kind: 'heart', x: 530, y: 480, width: 50, height: 44, color: '#E8607A', stroke: 4 },
      { kind: 'star', x: 560, y: 620, width: 42, height: 42, color: '#F2B33D', stroke: 3 },
      { kind: 'arrow', x: 440, y: 560, width: 90, height: 50, color: '#E8607A', stroke: 3 },
      { kind: 'swirl', x: 520, y: 830, width: 56, height: 56, color: '#7AB8D9', stroke: 3 }
    ],
    widgets: [],
    texts: [
      // 顶部标题（参考图顶部红色文字）
      // v3.23 多彩活泼文案全英文（与 v3 引擎 prompt 保持一致，此处是旧后端 v2 引擎兜底）
      { content: 'SWEET TRIP', x: 66, y: 62, font_size: 76, color: '#E8607A', font: 'script' },
      { content: 'sweet little trip', x: 70, y: 128, font_size: 26, color: '#4A7BA0', font: 'hand' },
      // 手写注释（多色，参考图大量小字）
      { content: 'sea breeze ♥', x: 400, y: 210, font_size: 24, color: '#D3567A', font: 'hand', rotate: -4 },
      { content: 'with my bestie!', x: 400, y: 530, font_size: 24, color: '#4A7BA0', font: 'hand', rotate: 3 },
      { content: 'so yummy!', x: 95, y: 1030, font_size: 24, color: '#E8912D', font: 'hand', rotate: -3 },
      { content: 'stay happy forever', x: 940, y: 700, font_size: 22, color: '#7AB8D9', font: 'hand', rotate: 78 },
      { content: 'best day ever ♥', x: 150, y: 1364, font_size: 30, color: '#E8607A', font: 'hand' },
      // ⏰ 出行时间带（顶部右上角小标签）
      { content: '__DATE__', x: 920, y: 80, font_size: 22, color: '#4A7BA0', font: 'hand', rotate: 4 }
    ]
  };

  /* ================= 04 暗黑质感 dark（参考图4 "今天无味！"） ================= */
  const dark = {
    style: 'dark',
    style_variation: '黑夜手帐',
    canvas_width: 1080, canvas_height: 1440,
    bg_color: '#0D0D0F', bg_noise: true,
    layout: 'hero_center',
    items: [
      // 中上主图（樱花位）：厚白边 + 顶部胶带
      { photo_index: 0, x: 120, y: 300, width: 440, height: 310, rotate: -3, border: 'thick_white' },
      // 右中（建筑位）
      { photo_index: 1, x: 610, y: 350, width: 370, height: 290, rotate: 4, border: 'thick_white' },
      // 中左（鞋位）
      { photo_index: 2, x: 100, y: 700, width: 340, height: 250, rotate: -2, border: 'thick_white' },
      // 中右（日落位）
      { photo_index: 3, x: 520, y: 740, width: 410, height: 270, rotate: 3, border: 'thick_white' },
      // 左下（小卡位）
      { photo_index: 4, x: 120, y: 1100, width: 330, height: 250, rotate: -5, border: 'soft_white' }
    ],
    decor_stickers: [
      { id: '1F315', x: 950, y: 260, width: 90, height: 90, rotate: 0 },    // 圆月（参考图右上）
      { id: '1F338', x: 500, y: 310, width: 64, height: 64, rotate: -10 },  // 樱花
      { id: '1F319', x: 70, y: 1020, width: 60, height: 60, rotate: 12 },   // 弯月
      { id: '1F6F6', x: 990, y: 1250, width: 60, height: 54, rotate: 8 }    // 伞(替代小物)
    ],
    tapes: [
      { x: 150, y: 278, width: 200, height: 30, rotate: -5, color: 'washi_gray', opacity: 0.8 },
      { x: 660, y: 330, width: 180, height: 28, rotate: 4, color: 'washi_gray', opacity: 0.8 },
      { x: 300, y: 1080, width: 170, height: 26, rotate: 30, color: 'washi_blue', opacity: 0.75 }
    ],
    pins: [],
    doodles: [
      // 蓝色爱心 ×2（标题旁，参考图）
      { kind: 'heart', x: 560, y: 96, width: 64, height: 56, color: '#6FA8DC', stroke: 4 },
      { kind: 'heart', x: 640, y: 150, width: 46, height: 42, color: '#6FA8DC', stroke: 3 },
      // 黄色星标 ×3（参考图散落黄星）
      { kind: 'star', x: 700, y: 90, width: 52, height: 52, color: '#F2C14E', stroke: 3 },
      { kind: 'star', x: 960, y: 660, width: 44, height: 44, color: '#F2C14E', stroke: 3 },
      { kind: 'star', x: 500, y: 1050, width: 40, height: 40, color: '#F2C14E', stroke: 3 },
      // hashtag 涂鸦
      { kind: 'hashtag', x: 900, y: 1000, width: 70, height: 70, color: '#6FA8DC', stroke: 3 },
      { kind: 'underline', x: 530, y: 690, width: 260, color: '#6FA8DC', stroke: 3 }
    ],
    widgets: [
      // 右上迷你日历（参考图 "1月" 日历）
      { type: 'mini_calendar', x: 830, y: 80, w: 150, h: 150, rotate: 5, color: '#2E2E33',
        data: { month: 'JAN', day: 18 } }
    ],
    cards: [
      // 中央白色便签卡（参考图中央浅蓝便签）
      { x: 420, y: 640, width: 230, height: 150, fill: '#FFFFFF', round: 4, shadow: true, rotate: -3 }
    ],
    texts: [
      // 左上大字标题（参考图 "今天无味！"）+ 蓝心在旁
      { content: '今天无味！', x: 64, y: 70, font_size: 108, color: '#EAEAF2', font: 'marker' },
      { content: 'a boring but sweet day', x: 70, y: 190, font_size: 26, color: '#9A9AB8', font: 'script' },
      // 便签卡上蓝字（参考图 "我会答应..."）
      { content: '我会答应', x: 444, y: 664, font_size: 30, color: '#4A6FA5', font: 'hand' },
      { content: '好好生活', x: 444, y: 702, font_size: 30, color: '#4A6FA5', font: 'hand' },
      // 左侧黄色手写小字（参考图多行黄字）
      { content: '__DATE__ 心情 晴', x: 66, y: 660, font_size: 24, color: '#F2C14E', font: 'hand' },
      { content: '去看樱花', x: 66, y: 690, font_size: 24, color: '#F2C14E', font: 'hand' },
      // 右下白色手写 + hashtag
      { content: '# 请大声听歌', x: 520, y: 1120, font_size: 26, color: '#EAEAF2', font: 'hand' },
      { content: '# 拍下此刻', x: 520, y: 1152, font_size: 26, color: '#6FA8DC', font: 'hand' },
      { content: '晚安，世界', x: 520, y: 1210, font_size: 30, color: '#EAEAF2', font: 'hand' },
      { content: 'STAY IN THE MOMENT', x: 120, y: 1380, font_size: 22, color: '#66667A', font: 'sans' }
    ]
  };

  /* ================= 05 水彩手绘 watercolor（参考图5 暖棕+企鹅+sparkle） ================= */
  const watercolor = {
    style: 'watercolor',
    style_variation: '暖棕日常',
    canvas_width: 1080, canvas_height: 1440,
    bg_color: '#9A7B5E', bg_noise: true,
    layout: 'cluster_organic',
    items: [
      // 左上（工作场景位）：拍立得
      { photo_index: 0, x: 80, y: 230, width: 420, height: 320, rotate: -4, border: 'polaroid_white' },
      // 右上（烤盘位）：拍立得
      { photo_index: 1, x: 570, y: 200, width: 400, height: 310, rotate: 5, border: 'polaroid_white' },
      // 中央（咖啡杯位）：拍立得 + caption
      { photo_index: 2, x: 330, y: 600, width: 400, height: 310, rotate: -3, border: 'polaroid_white',
        caption: 'coffee time', caption_color: '#F5EBDC' },
      // 左下（家居位）
      { photo_index: 3, x: 90, y: 1000, width: 380, height: 290, rotate: 4, border: 'polaroid_white' },
      // 右下
      { photo_index: 4, x: 540, y: 990, width: 400, height: 300, rotate: -5, border: 'polaroid_white' }
    ],
    decor_stickers: [
      // 顶部企鹅组合（参考图 Pingu 位，OpenMoji 企鹅替代）
      { id: '1F427', x: 440, y: 130, width: 150, height: 150, rotate: -6 },  // 大企鹅
      { id: '1F427', x: 620, y: 150, width: 96, height: 96, rotate: 10 },    // 小企鹅
      { id: '2615', x: 60, y: 130, width: 76, height: 76, rotate: -8 },      // 咖啡
      { id: '1F4BB', x: 990, y: 130, width: 70, height: 70, rotate: 6 }      // 笔记本电脑
    ],
    tapes: [
      { x: 110, y: 210, width: 190, height: 28, rotate: -6, color: 'washi_brown', opacity: 0.85 },
      { x: 620, y: 182, width: 180, height: 28, rotate: 5, color: 'washi_beige', opacity: 0.85 },
      { x: 360, y: 580, width: 200, height: 28, rotate: -3, color: 'washi_brown', opacity: 0.85 },
      { x: 560, y: 970, width: 190, height: 28, rotate: -5, color: 'washi_beige', opacity: 0.85 }
    ],
    pins: [],
    doodles: [
      // 满屏白色 sparkle（参考图核心！）
      { kind: 'sparkle', x: 70, y: 340, width: 56, height: 56, fill: '#FFF8EA', opacity: 0.9 },
      { kind: 'sparkle', x: 560, y: 300, width: 40, height: 40, fill: '#FFF8EA', opacity: 0.8 },
      { kind: 'sparkle', x: 1000, y: 420, width: 50, height: 50, fill: '#FFF8EA', opacity: 0.85 },
      { kind: 'sparkle', x: 300, y: 560, width: 36, height: 36, fill: '#FFF8EA', opacity: 0.7 },
      { kind: 'sparkle', x: 500, y: 540, width: 30, height: 30, fill: '#FFF8EA', opacity: 0.75 },
      { kind: 'sparkle', x: 60, y: 900, width: 44, height: 44, fill: '#FFF8EA', opacity: 0.85 },
      { kind: 'sparkle', x: 1020, y: 940, width: 38, height: 38, fill: '#FFF8EA', opacity: 0.8 },
      { kind: 'sparkle', x: 480, y: 950, width: 34, height: 34, fill: '#FFF8EA', opacity: 0.7 },
      { kind: 'sparkle', x: 150, y: 1330, width: 42, height: 42, fill: '#FFF8EA', opacity: 0.85 },
      { kind: 'sparkle', x: 950, y: 1340, width: 48, height: 48, fill: '#FFF8EA', opacity: 0.85 }
    ],
    widgets: [
      // 顶部黄色便签条（参考图 "特别享受每天晚上..."）
      { type: 'sticky_note', x: 130, y: 30, width: 300, height: 120, rotate: -3,
        color: '#FFE8A3', text: '特别享受每天晚上的咖啡时间',
        data: { text_color: '#6B5B3A', text_size: 28 } }
    ],
    texts: [
      { content: 'MY LITTLE LIFE', x: 700, y: 60, font_size: 56, color: '#FFF3E2', font: 'script' },
      { content: '__DATE__', x: 880, y: 620, font_size: 26, color: '#F5EBDC', font: 'sans' },
      { content: '在窗边发呆的一下午', x: 100, y: 585, font_size: 26, color: '#F5EBDC', font: 'hand' },
      { content: '热乎乎的一餐', x: 95, y: 1320, font_size: 26, color: '#F5EBDC', font: 'hand' },
      { content: '被治愈了', x: 560, y: 1320, font_size: 26, color: '#F5EBDC', font: 'hand' }
    ]
  };

  /* ================= 06 杂志排版 magazine（参考图6 MONA 露营日记） ================= */
  const magazine = {
    style: 'magazine',
    style_variation: 'VOL.01 秋日露营',
    canvas_width: 1080, canvas_height: 1440,
    bg_color: '#78837C', bg_noise: false,
    layout: 'notebook_card',
    cards: [
      // 中央米色网格笔记本大卡（参考图核心）
      { x: 52, y: 60, width: 976, height: 1330, fill: '#FAF1E1', grid: true, gridV: true,
        lineColor: '#E2D5B8', lineSpacing: 34, colSpacing: 44, round: 10, shadow: true },
      // 标题橙色描边框（参考图橙框标题）
      { x: 92, y: 200, width: 470, height: 130, fill: 'none', round: 8, shadow: false,
        border_color: '#E67E22', border_width: 3 }
    ],
    items: [
      // 卡内左上（SUV 位）
      { photo_index: 0, x: 100, y: 400, width: 310, height: 220, rotate: -3, border: 'rect_border', borderColor: '#2A2A2A' },
      // 卡内中上（小狗位）
      { photo_index: 1, x: 450, y: 390, width: 260, height: 200, rotate: 2, border: 'soft_white' },
      // 卡内右上（车内位）
      { photo_index: 2, x: 740, y: 400, width: 250, height: 190, rotate: -2, border: 'rect_border', borderColor: '#2A2A2A' },
      // 卡内中排（烤肉位）
      { photo_index: 3, x: 110, y: 680, width: 290, height: 210, rotate: 4, border: 'polaroid_white' },
      // 卡内中排（烤盘位）
      { photo_index: 4, x: 440, y: 660, width: 270, height: 200, rotate: -3, border: 'rect_border', borderColor: '#2A2A2A' },
      // 卡内中排右（湖边位）
      { photo_index: 5, x: 740, y: 670, width: 250, height: 210, rotate: 3, border: 'soft_white' }
    ],
    decor_stickers: [
      { id: '1F37E', x: 620, y: 210, width: 74, height: 74, rotate: -8 },   // 香槟杯
      { id: '1F373', x: 940, y: 940, width: 70, height: 62, rotate: 10 },   // 煎蛋
      { id: '1F4F7', x: 80, y: 950, width: 70, height: 70, rotate: -6 },    // 相机
      { id: '1F341', x: 60, y: 320, width: 62, height: 62, rotate: 14 },    // 枫叶
      { id: '26FA', x: 950, y: 330, width: 72, height: 72, rotate: 6 },     // 帐篷
      { id: '1F525', x: 500, y: 1300, width: 58, height: 66, rotate: -4 }   // 篝火
    ],
    tapes: [],
    pins: [],
    doodles: [
      // 底部照片下红线（杂志分隔）
      { kind: 'underline', x: 90, y: 1070, width: 420, color: '#C8281C', stroke: 4 },
      // 手绘箭头（指向照片）
      { kind: 'arrow', x: 620, y: 900, width: 100, height: 60, color: '#7A4F2A', stroke: 3 }
    ],
    widgets: [
      // 顶部红色长尾夹（参考图核心）
      { type: 'binder_clip', x: 505, y: 28, w: 74, h: 84, color: '#D9443A' },
      // 右上页码标（参考图 "2/5"）
      { type: 'page_tag', x: 880, y: 96, w: 84, h: 40, text: '2/5', color: '#8A8A8A' },
      // 黄色便签条 ×3（参考图多张便签）
      { type: 'sticky_note', x: 620, y: 920, width: 300, height: 110, rotate: 3,
        color: '#FFE8A3', text: '可以带毛孩子躺进大自然',
        data: { text_color: '#6B5B3A', text_size: 26 } },
      { type: 'sticky_note', x: 100, y: 1130, width: 300, height: 110, rotate: -3,
        color: '#FFE8A3', text: '把车内变身移动小窝',
        data: { text_color: '#6B5B3A', text_size: 26 } },
      { type: 'sticky_note', x: 640, y: 1130, width: 300, height: 110, rotate: 2,
        color: '#FFF3C4', text: '露营当然要 chill 一下',
        data: { text_color: '#6B5B3A', text_size: 26 } }
    ],
    texts: [
      // 左上标题区（参考图 "MONA 的生活备忘录" + 橙框标题）
      { content: 'MONA 的', x: 92, y: 92, font_size: 52, color: '#2A2A2A', font: 'marker' },
      { content: '生活备忘录', x: 260, y: 108, font_size: 34, color: '#FFFFFF', font: 'marker', stroke: 1, stroke_color: '#2A2A2A', stroke_width: 6 },
      { content: '秋日的「露营日记」', x: 116, y: 236, font_size: 56, color: '#C8281C', font: 'hand', bold: true },
      // 副文（参考图 "解锁秋天的正确打开方式"）
      { content: '解锁秋天的正确打开方式', x: 92, y: 356, font_size: 26, color: '#7A4F2A', font: 'hand' },
      // 照片注解
      { content: '后备箱塞满快乐', x: 104, y: 636, font_size: 22, color: '#7A4F2A', font: 'hand' },
      { content: '狗子是露营 MVP', x: 452, y: 622, font_size: 22, color: '#7A4F2A', font: 'hand' },
      // 底部注解 + 页脚
      { content: '煮着火锅看夕阳', x: 96, y: 1092, font_size: 26, color: '#7A4F2A', font: 'hand' },
      { content: '这就是理想周末的模样啊', x: 460, y: 1300, font_size: 28, color: '#5A3A20', font: 'hand' },
      // ⏰ 出行时间带（标题区右侧，橙框上方）
      { content: '__DATE__', x: 580, y: 92, font_size: 22, color: '#7A4F2A', font: 'hand', rotate: 2 }
    ]
  };

  /* ================= 工厂：按 photoCount 生成 ================= */
  function jitter(v, range) {
    return v + (Math.random() * 2 - 1) * range;
  }

  // 读取用户填的「旅行日期」+ 今日日期（未填则用今日）
  // 返回 { raw, year, md, full }；raw='' 表示用户没填
  function getDateParts() {
    const raw = (typeof document !== 'undefined'
      ? (document.getElementById('diaryDate')?.value || '').trim() : '');
    const today = new Date();
    const ty = String(today.getFullYear());
    const tmd = (today.getMonth() + 1) + '月' + today.getDate() + '日';
    let year = ty, md = tmd, full = ty + '年' + tmd;
    if (raw) {
      const m = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
      if (m) {
        year = m[1];
        md = parseInt(m[2], 10) + '月' + parseInt(m[3], 10) + '日';
        full = year + '年' + md;
      } else {
        // 用户填的不是标准格式（自由文本），整段当月日，年份取今日
        md = raw;
        full = year + '年' + md;
      }
    }
    return { raw, year, md, full };
  }

  /**
   * 把模板里的 __DATE__ 标记替换为用户日期（用于 AI 替换文本之后、渲染之前）
   * - texts.content 中的 __DATE__  → 完整日期（如 "2026年9月9日"）
   * - widgets.postmark.data.center（数组/字符串）中的 __DATE_YEAR__ → 年份，__DATE__ → 月日
   * - 用户没填日期时：用当日日期（年份+月日），不再写死 "9月8日"
   */
  function bakeDateToken(layout) {
    if (!layout) return;
    const { year, md, full } = getDateParts();
    // 1) texts: __DATE__ → 完整日期
    (layout.texts || []).forEach(function (t) {
      if (t && typeof t.content === 'string' && t.content.indexOf('__DATE__') >= 0) {
        t.content = t.content.split('__DATE__').join(full);
      }
    });
    // 2) widgets.postmark.center: 替换 token
    (layout.widgets || []).forEach(function (w) {
      if (!w || w.type !== 'postmark' || !w.data) return;
      const replaceOne = function (s) {
        return String(s == null ? '' : s)
          .split('__DATE_YEAR__').join(year)
          .split('__DATE__').join(md);
      };
      if (Array.isArray(w.data.center)) {
        w.data.center = w.data.center.map(replaceOne);
      } else if (typeof w.data.center === 'string') {
        w.data.center = replaceOne(w.data.center);
      }
    });
  }

  function buildLayout(styleId, photoCount) {
    const templates = { vintage, minimal, colorful, dark, watercolor, magazine };
    const tpl = templates[styleId];
    if (!tpl) return null;

    const out = JSON.parse(JSON.stringify(tpl));
    const baseItems = out.items;
    const items = [];

    // 1) 先用 base items 的前 N 个（N = min(photoCount, baseItems.length)）
    const primaryCount = Math.min(photoCount, baseItems.length);
    for (let i = 0; i < primaryCount; i++) {
      const base = baseItems[i];
      items.push({
        photo_index: i,
        x: Math.round(jitter(base.x, 15)),
        y: Math.round(jitter(base.y, 15)),
        width: base.width,
        height: base.height,
        rotate: Math.round(jitter(base.rotate, 2) * 10) / 10,
        border: base.border,
        border_color: base.border_color || base.borderColor,
        caption: base.caption,
        caption_color: base.caption_color
      });
    }

    // 2) 若超出 base items 数 → 用 smartPack 在画布剩余空间补位
    if (photoCount > baseItems.length) {
      const extraCount = photoCount - baseItems.length;
      const extras = smartPackPositions(
        out.canvas_width, out.canvas_height,
        primaryCount,   // photo_index 从这里继续
        extraCount,
        items.map(it => ({ x: it.x, y: it.y, width: it.width, height: it.height, rotate: it.rotate })),
        baseItems,
        styleId
      );
      extras.forEach(ex => items.push(ex));
    } else if (photoCount < baseItems.length) {
      // 3) 照片数少于槽位 → 模板前 N 个固定坐标可能全堆在顶部（底部/左下大片空）。
      //    v3.9 稀疏铺开：把已放置的照片「纵向拉伸」铺满画布高度，避免版面空一圈。
      //    （连带把挂在照片上的胶带/图钉一起上移下移，避免它们飘在照片外）
      spreadSparsePhotos(out, styleId);
    }

    out.items = items;
    // 不在这里替换 __DATE__：让 describeSlots / AI 能看到原 token，AI 处理后再替换

    return out;
  }

  /**
   * v3.9 稀疏铺开：photoCount < baseItems 时，模板前 N 张照片往往集中在画布上部，
   * 导致底部/左边大片留白。这里把照片按「中心 y」排序后线性映射到画布安全高度区间，
   * 让照片铺满上下，而不是堆在顶部。
   *  - 只在画布实际空（垂直跨度 < 目标跨度）时触发；已铺满则跳过，绝不压缩
   *  - 保留相对顺序与间距比例（线性伸缩），避免重排导致重叠
   *  - 顶部避开标题/长文区（y>350），底部避开清单/底部文字（y< canvasH-240）
   */
  function spreadSparsePhotos(out, styleId) {
    const items = out.items;
    if (!items || items.length < 2) return;
    // 只对"拼贴/散点"型模板铺开（minimal/magazine 走"居中留白"哲学，不强铺）
    if (styleId === 'minimal' || styleId === 'magazine') return;
    const canvasW = out.canvas_width, canvasH = out.canvas_height;
    const targetTop = 360;                 // 标题区以下（TRAVEL/memories/长文 在 y<330）
    const targetBottom = canvasH - 240;    // 底部文字/清单以上
    // 按中心 y 排序
    const sorted = items.map(it => ({ it, cy: it.y + it.height / 2 })).sort((a, b) => a.cy - b.cy);
    const curTop = sorted[0].cy, curBottom = sorted[sorted.length - 1].cy;
    const curSpan = curBottom - curTop;
    const tgtSpan = targetBottom - targetTop;
    if (curSpan < 50 || tgtSpan <= curSpan + 40) return; // 已铺满或跨度不够，跳过
    const k = tgtSpan / curSpan; // 唯一 >1 的伸缩系数（只放大不压缩）
    // 记录每个照片的旧 y 范围 + 位移，用于带动挂在照片上的胶带/图钉
    const moves = [];
    for (const s of sorted) {
      const it = s.it;
      const oldY = it.y;
      const newCy = targetTop + (s.cy - curTop) * k;
      let ny = Math.round(newCy - it.height / 2);
      ny = Math.max(targetTop, Math.min(ny, canvasH - it.height - 60));
      const dy = ny - oldY;
      if (dy === 0) continue;
      it.y = ny;
      moves.push({ y: oldY, h: it.height, dy: dy });
    }
    // 带动挂在照片上的胶带/图钉（其 y 落在此照片旧垂直范围 ±60 内 → 跟照片一起动）
    const attachables = [];
    (out.tapes || []).forEach(t => attachables.push(t));
    (out.pins || []).forEach(p => attachables.push(p));
    for (const a of attachables) {
      for (const m of moves) {
        if (a.y >= m.y - 60 && a.y <= m.y + m.h + 60) { a.y += m.dy; break; }
      }
    }
  }

  /**
   * 智能补位：当 photoCount > 模板 base items 数时，在画布剩余空间填入额外照片位
   *  原则：
   *   - 主体居中：base 第一张大图通常居中 → 新增位在边缘/角落
   *   - 图片少不重叠（5 张以内：每个新增位四周 ≥ 60px 空隙）
   *   - 图片多可重叠（6+ 张：允许新增位之间 ±10° 旋转、贴近边缘的可以部分叠到画布外）
   *   - 避开 base items 已占区 + 标题区 + 主要装饰区
   *   - 风景/纯建筑风格：尺寸略大 + 横长比
   *   - 人物/特写风格：尺寸偏正方形 + 偏中央
   */
  function smartPackPositions(canvasW, canvasH, startIdx, count, occupied, baseItems, styleId) {
    if (count <= 0) return [];
    const out = [];

    // 安全区：base items 中心点（避开主体）
    const centers = occupied.map(o => ({ cx: o.x + o.width / 2, cy: o.y + o.height / 2 }));
    // base 第一张大图通常 = 主体，保护其 ±180px 半径范围
    const hero = baseItems[0];
    const heroCx = hero.x + hero.width / 2;
    const heroCy = hero.y + hero.height / 2;
    const heroR = Math.max(hero.width, hero.height) / 2 + 100;

    // 候选网格（4×3 = 12 候选，按从大到小填充）
    // 风格偏好：vintage/colorful 喜欢小贴纸型；minimal/dark 喜欢大气型
    const styleSizePref = (styleId === 'vintage' || styleId === 'colorful')
      ? { w: 260, h: 200 }
      : (styleId === 'dark' || styleId === 'watercolor')
      ? { w: 320, h: 240 }
      : { w: 340, h: 250 };  // minimal/magazine

    // 风格偏好：人物/特写型模板 → 横长比；风景/建筑型模板 → 横长比也合理
    // 因为模板已含 base items 的 orientation，新增位用横向（人眼对横照更宽容）

    const candidates = [];
    // 顶部边缘（避开标题区 y < 280）
    candidates.push({ x: 60, y: 70, w: styleSizePref.w, h: styleSizePref.h });
    candidates.push({ x: 380, y: 56, w: styleSizePref.w, h: styleSizePref.h });
    candidates.push({ x: 700, y: 60, w: styleSizePref.w, h: styleSizePref.h });
    // 左侧
    candidates.push({ x: 50, y: 600, w: styleSizePref.w, h: styleSizePref.h });
    candidates.push({ x: 50, y: 870, w: styleSizePref.w, h: styleSizePref.h });
    candidates.push({ x: 60, y: 1130, w: styleSizePref.w, h: styleSizePref.h });
    // 右侧
    candidates.push({ x: 730, y: 600, w: styleSizePref.w, h: styleSizePref.h });
    candidates.push({ x: 720, y: 870, w: styleSizePref.w, h: styleSizePref.h });
    candidates.push({ x: 720, y: 1130, w: styleSizePref.w, h: styleSizePref.h });
    // 底部
    candidates.push({ x: 380, y: 1180, w: styleSizePref.w, h: styleSizePref.h });
    candidates.push({ x: 60, y: 1240, w: styleSizePref.w, h: styleSizePref.h });
    candidates.push({ x: 720, y: 1260, w: styleSizePref.w, h: styleSizePref.h });

    let placed = 0;
    for (let ci = 0; ci < candidates.length && placed < count; ci++) {
      const c = candidates[ci];
      // 画布边界检查
      if (c.x + c.w > canvasW - 20) continue;
      if (c.y + c.h > canvasH - 30) continue;
      // 不能挡主体（hero 大图 ±180px 范围）
      const ccx = c.x + c.w / 2, ccy = c.y + c.h / 2;
      const dx = ccx - heroCx, dy = ccy - heroCy;
      if (Math.sqrt(dx * dx + dy * dy) < heroR) continue;
      // 不能与已放置的（含 base）太近：5 张以内保持 60px 间距
      let tooClose = false;
      for (const o of occupied.concat(out)) {
        const ocx = o.x + o.width / 2, ocy = o.y + o.height / 2;
        const d = Math.sqrt((ccx - ocx) ** 2 + (ccy - ocy) ** 2);
        const minDist = Math.max(o.width, o.height, c.w, c.h) / 2 + (count <= 5 ? 60 : 30);
        if (d < minDist) { tooClose = true; break; }
      }
      if (tooClose) continue;
      // 6+ 张：可重叠 → 但选 rotate ±4~10° 营造拼贴感
      const rot = (startIdx + placed) >= 5
        ? Math.round((Math.random() * 8 - 4) * 10) / 10   // 主体居中无旋转
        : Math.round((Math.random() * 14 - 7) * 10) / 10;  // 拼贴型 ±7°
      out.push({
        photo_index: startIdx + placed,
        x: c.x, y: c.y,
        width: c.w, height: c.h,
        rotate: rot,
        border: 'thin_white'
      });
      placed++;
    }

    // 候选不够用 → 在画布剩余空间均匀追加（最后兜底）
    while (placed < count) {
      const col = placed % 3;
      const row = Math.floor(placed / 3);
      const w = styleSizePref.w - col * 30;
      const h = styleSizePref.h - col * 20;
      out.push({
        photo_index: startIdx + placed,
        x: 80 + col * (w + 30),
        y: 300 + row * (h + 30),
        width: w, height: h,
        rotate: Math.round((Math.random() * 10 - 5) * 10) / 10,
        border: 'thin_white'
      });
      placed++;
    }
    return out;
  }

  /* ================= 槽位描述（供 DeepSeek 只填文字用） =================
   * describeSlots(style, layout) → { style, styleName, slots:[{key,role,lang,max}] }
   * layout 为 buildLayout 产出：文字/便签/清单位置坐标由模板固定，AI 只替换内容。
   * 颜色由模板色板定死（深字浅底/浅字深底/同系暖色），保证与背景区分但不割裂。
   */
  const STYLE_NAMES = {
    vintage: '复古胶片', minimal: '简约清新', colorful: '多彩活泼',
    dark: '暗黑质感', watercolor: '水彩手绘', magazine: '杂志排版'
  };

  function langOf(text) {
    return /[\u4e00-\u9fff]/.test(String(text || '')) ? 'zh' : 'en';
  }
  function looksStatic(text) {
    const s = String(text || '').trim();
    if (s === '完') return true;
    if (/^(完|END|THE END)$/i.test(s)) return true;
    if (/^[\d/:\s·\.]*$/.test(s)) return true;      // 1/8 18:50 / SEP · 2026 等时间戳
    if (/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*[·.]?\s*\d{2,4}$/i.test(s)) return true;
    return false;
  }

  function textRoleFor(t, i) {
    const size = t.font_size || 28;
    if (i === 0 && size >= 80) return '整页大标题（要有杂志/手帐气质，一句最好，不要长）';
    if (size >= 50) return '次标题/刊头（英文手写体或黑体大字，1~3 个词或 2~6 个汉字）';
    if (t.rotate) return '斜放手写批注（贴照片边角的小话，轻松口语）';
    if (size <= 26) return '手写短句（一行内的日记体，暖而具体，别写套话）';
    return '手写批注（简短，语气像随手写在手帐边上的话）';
  }

  function describeSlots(styleId, layout) {
    const tpl = (window.DiaryTemplates && window.DiaryTemplates.TEMPLATES && window.DiaryTemplates.TEMPLATES[styleId]) || null;
    const styleName = STYLE_NAMES[styleId] || styleId || '';
    const slots = [];

    // 1) 普通文字（texts）：按模板固定位置逐条给出角色与字数上限
    (layout && Array.isArray(layout.texts) ? layout.texts : []).forEach(function (t, i) {
      if (!t || typeof t.content !== 'string') return;
      // ⏰ 日期槽：必须填用户填的旅行日期（buildLayout 已把 __DATE__ 替换为占位日期）
      if (t.content.indexOf('__DATE__') >= 0 || /(^|\s)__DATE__(\s|$)/.test(t.content)) {
        slots.push({
          key: 't' + i,
          kind: 'date',
          role: '【关键】这是用户填的【旅行日期】展示位（YYYY-MM-DD 或 9月8日 / Sep 8 / 8 SEP 等自然格式）。如果用户没填日期，用当日的 "9月9日" 占位；如有用户填的具体日期，请用用户日期。',
          lang: /[\u4e00-\u9fff]/.test((getDateParts().raw || getDateParts().md) || '九月') ? 'zh' : 'en',
          max: 12,
          now: t.content,
          must: 'date'
        });
        return;
      }
      if (looksStatic(t.content)) return; // 时间戳/印章字不动
      const baseLang = langOf(t.content);
      const size = t.font_size || 28;
      let max;
      if (size >= 80) max = baseLang === 'zh' ? 5 : 10;
      else if (size >= 50) max = baseLang === 'zh' ? 7 : 16;
      else if (size >= 28) max = baseLang === 'zh' ? 10 : 26;
      else max = baseLang === 'zh' ? 11 : 34;
      slots.push({
        key: 't' + i,
        kind: 'text',
        role: textRoleFor(t, i),
        lang: baseLang,
        max: max,
        now: String(t.content || '').slice(0, max)
      });
    });

    // 2) 拍立得底部 caption（items 里带 caption 的槽）
    (layout && Array.isArray(layout.items) ? layout.items : []).forEach(function (it, i) {
      if (!it || !it.caption) return;
      if (looksStatic(it.caption)) return;
      const baseLang = langOf(it.caption);
      slots.push({
        key: 'c' + i,
        kind: 'caption',
        role: '照片底部手写小字（拍立得/贴纸注释，必须非常短）',
        lang: baseLang,
        max: baseLang === 'zh' ? 6 : 22,
        now: String(it.caption).slice(0, 22)
      });
    });

    // 3) 便签条文字（widgets 里 sticky_note）
    (layout && Array.isArray(layout.widgets) ? layout.widgets : []).forEach(function (wgt, i) {
      if (!wgt || wgt.type !== 'sticky_note' || !wgt.text) return;
      const baseLang = langOf(wgt.text);
      slots.push({
        key: 's' + i,
        kind: 'sticky',
        role: '黄色便签条上的话（写在备忘/心情纸上，2~3 行内，口语）',
        lang: baseLang,
        max: baseLang === 'zh' ? 26 : 40,
        now: String(wgt.text).slice(0, 40)
      });
    });

    // 4) checklist 打勾行（widgets 里 checklist.items）
    (layout && Array.isArray(layout.widgets) ? layout.widgets : []).forEach(function (wgt, wi) {
      if (!wgt || wgt.type !== 'checklist' || !Array.isArray(wgt.items)) return;
      wgt.items.forEach(function (row, k) {
        const text = row && row.text != null ? row.text : row;
        if (!text) return;
        if (looksStatic(text)) return;
        const baseLang = langOf(text);
        slots.push({
          key: 'l' + wi + '_' + k,
          kind: 'checklist',
          role: '待办勾选清单里的一行（一次小行动或小确幸，短语）',
          lang: baseLang,
          max: baseLang === 'zh' ? 8 : 18,
          now: String(text).slice(0, 18)
        });
      });
    });

    return { style: styleId, styleName, photoCount: (layout && layout.items ? layout.items.length : 0), slots: slots };
  }

  /* ============ 抠图主体贴纸尺寸参考 ============
   * 坐标已不使用：buildCutoutSprites 按本次实际排版（照片抖动/张数可变）动态扫描空白位放置，
   * 保证绝不压到照片、文字、便签等挂件，贴纸之间也互不重叠；放不下会自动缩小。 */
  const CUTOUT_SPOTS = {
    // 复古：2 枚大贴纸
    vintage: [
      { x: 640, y: 170, w: 300, h: 300 },
      { x: 600, y: 1030, w: 220, h: 220 }
    ],
    // 简约：底部大片留白，2 枚
    minimal: [
      { x: 400, y: 50, w: 300, h: 300 },
      { x: 500, y: 1200, w: 260, h: 260 }
    ],
    // 多彩：中央蓝色留白竖带，3 枚
    colorful: [
      { x: 400, y: 150, w: 300, h: 300 },
      { x: 420, y: 500, w: 230, h: 230 },
      { x: 400, y: 790, w: 220, h: 220 }
    ],
    // 暗黑：2 枚
    dark: [
      { x: 710, y: 1120, w: 330, h: 330 },
      { x: 600, y: 90, w: 260, h: 260 }
    ],
    // 水彩：2 枚
    watercolor: [
      { x: 350, y: 50, w: 340, h: 340 },
      { x: 770, y: 640, w: 250, h: 250 }
    ],
    // 杂志：2 枚
    magazine: [
      { x: 690, y: 140, w: 320, h: 320 },
      { x: 120, y: 920, w: 220, h: 220 }
    ]
  };
  function cutoutSpots(styleId) {
    return CUTOUT_SPOTS[styleId] || [];
  }

  /* ============ 复古贴纸库 ============
   * 用户提供的复古拼贴（白底），已离线分割成单个透明 PNG（assets/stickers/vintage/v_XX.png）。
   * f = 文件名（不含扩展名），w/h = 原始像素尺寸（用于按比例决定放置槽位，保持原比例不拉伸）。
   * 生成时随机挑一部分（见 page-video.buildVintageStickers），用 findFreeSpot 放空白处。
   */
  const VINTAGE_LIBRARY = [
    { f: 'v_01', w: 209, h: 331 },
    { f: 'v_02', w: 289, h: 291 },
    { f: 'v_03', w: 253, h: 237 },
    { f: 'v_05', w: 276, h: 194 },
    { f: 'v_10', w: 222, h: 310 },
    { f: 'v_11', w: 160, h: 273 },
    { f: 'v_12', w: 190, h: 293 },
    { f: 'v_13', w: 178, h: 239 },
    { f: 'v_14', w: 227, h: 178 },
    { f: 'v_15', w: 131, h: 121 },
    { f: 'v_16', w: 136, h: 297 },
    { f: 'v_17', w: 275, h: 355 },
    { f: 'v_18', w: 213, h: 303 },
    { f: 'v_21', w: 164, h: 187 },
    { f: 'v_22', w: 248, h: 184 },
    { f: 'v_32', w: 206, h: 183 },
    { f: 'v_33', w: 232, h: 267 },
    { f: 'v_35', w: 151, h: 215 },
    { f: 'v_36', w: 109, h: 115 },
    { f: 'v_37', w: 318, h: 322 },
    { f: 'v_38', w: 201, h: 115 },
    { f: 'v_39', w: 99, h: 96 },
    { f: 'v_40', w: 314, h: 213 },
    { f: 'v_41', w: 314, h: 218 },
    { f: 'v_42', w: 113, h: 245 },
    { f: 'v_43', w: 174, h: 244 },
    { f: 'v_44', w: 171, h: 265 },
    { f: 'v_45', w: 190, h: 204 },
    { f: 'v_46', w: 178, h: 185 },
    { f: 'v_47', w: 132, h: 93 },
    { f: 'v_48', w: 319, h: 277 },
    { f: 'v_49', w: 301, h: 239 },
    { f: 'v_50', w: 161, h: 207 },
    { f: 'v_51', w: 313, h: 128 },
    // ---- v3.15 第二批复古拼贴（vintage_source2.jpg / segment2.py 分割）36 枚 ----
    // 纸卡 · 票据 · 明信片 · 火漆印 · 复古胶带 · 小图标（星/心/闪光）
    // 已剔除原图的「灰盘钥匙」水印与 8 个纯色色卡圆点
    { f: 's2_01', w: 267, h: 370 },   // 撕口报纸 Fig.5 Plan
    { f: 's2_02', w: 165, h: 366 },   // 方格纸
    { f: 's2_03', w: 231, h: 367 },   // CARTE POSTALE 深棕卡
    { f: 's2_04', w: 206, h: 365 },   // collect beautiful moments
    { f: 's2_05', w: 202, h: 299 },   // 20C 打字机邮票
    { f: 's2_06', w: 194, h: 197 },   // 王冠火漆印
    { f: 's2_07', w: 221, h: 441 },   // little by little 吊牌
    { f: 's2_08', w: 309, h: 180 },   // TRAVELER'S NOTES 车票
    { f: 's2_09', w: 287, h: 134 },   // one day at a time
    { f: 's2_10', w: 324, h: 94 },    // 深棕波点胶带
    { f: 's2_11', w: 261, h: 290 },   // THE MODERN DANCES 书页
    { f: 's2_12', w: 263, h: 193 },   // ADMIT ONE 票根
    { f: 's2_13', w: 323, h: 146 },   // 海上箴言残页
    { f: 's2_14', w: 274, h: 89 },    // 米色颗粒胶带
    { f: 's2_15', w: 266, h: 84 },    // 格纹胶带
    { f: 's2_16', w: 276, h: 85 },    // 深棕细点胶带
    { f: 's2_17', w: 264, h: 343 },   // 回形针横线便签
    { f: 's2_18', w: 270, h: 73 },    // 格纸胶带
    { f: 's2_19', w: 273, h: 73 },    // 斜纹胶带
    { f: 's2_20', w: 276, h: 70 },    // 四心胶带
    { f: 's2_21', w: 302, h: 221 },   // No./Date 长尾夹表单
    { f: 's2_22', w: 276, h: 202 },   // Note to self
    { f: 's2_23', w: 242, h: 216 },   // MEMORIES 相机卡
    { f: 's2_24', w: 280, h: 231 },   // 希腊文老明信片
    { f: 's2_25', w: 369, h: 217 },   // CARTE POSTALE 手写明信片
    { f: 's2_26', w: 176, h: 216 },   // she packed her things
    { f: 's2_27', w: 259, h: 212 },   // No.7 乐谱残页
    { f: 's2_28', w: 212, h: 114 },   // KEEP GOING 木牌
    { f: 's2_29', w: 197, h: 111 },   // BE KIND 木牌
    { f: 's2_30', w: 202, h: 114 },   // It's a good day 木牌
    { f: 's2_31', w: 215, h: 116 },   // take care of yourself 木牌
    { f: 's2_32', w: 237, h: 115 },   // Enjoy the little things 木牌
    { f: 's2_33', w: 50, h: 55 },     // 闪光（描边）
    { f: 's2_34', w: 48, h: 47 },     // 实心五角星
    { f: 's2_35', w: 47, h: 46 },     // 描边爱心
    { f: 's2_36', w: 45, h: 43 }      // 实心爱心
  ];
  function vintageLibrary() {
    return VINTAGE_LIBRARY;
  }

  /* ============ 简约清新贴纸库（v3.17）============
   * 用户提供的两套拼贴：绿色四叶草系（g_XX，15 枚）+ 蓝色冬季系（b_XX，24 枚），
   * 已离线分割成单个透明 PNG（assets/stickers/minimal/，目录名 = 风格 id，见 segment_fresh.py）。
   * 风格基调：墨绿底 + 大量留白 → **绿色为主、蓝色作点缀**（绿:蓝 ≈ 2:1 权重，见 freshLibrary()）。
   * f = 文件名（不含扩展名），w/h = 原始像素尺寸（等比缩放到槽位，绝不拉伸）。
   */
  const FRESH_LIBRARY = [
    // ---- 绿色系（主）：蝴蝶结 / 云朵小狗 / 回形针 / 语录卡 / 幸运符卡 / 抹茶球 /
    //      玻璃心 / 相机 / 相框 / 葡萄 / 四叶草 / 青提饮 / 抹茶饭团 / 吊牌 ----
    { f: 'g_01', w: 326, h: 221 },   // 绿色缎带蝴蝶结
    { f: 'g_02', w: 181, h: 166 },   // 白色云朵小狗
    { f: 'g_03', w: 149, h: 146 },   // 绿色回形针
    { f: 'g_04', w: 184, h: 144 },   // 四叶草语录卡
    { f: 'g_05', w: 193, h: 189 },   // YOU ARE MY LUCKY CHARM 卡
    { f: 'g_06', w: 202, h: 181 },   // 抹茶球
    { f: 'g_07', w: 182, h: 164 },   // 玻璃心四叶草
    { f: 'g_08', w: 215, h: 137 },   // 拍立得相机
    { f: 'g_09', w: 199, h: 175 },   // 绿色相框
    { f: 'g_10', w: 175, h: 149 },   // 青葡萄
    { f: 'g_11', w: 158, h: 206 },   // 四叶草
    { f: 'g_12', w: 128, h: 221 },   // 青提气泡饮
    { f: 'g_13', w: 185, h: 174 },   // 四叶草
    { f: 'g_14', w: 172, h: 161 },   // 抹茶饭团
    { f: 'g_15', w: 250, h: 120 },   // 绿色吊牌
    // ---- 蓝色系（点缀）：标签 / 云朵 / 信封 / 塑封袋 / 撕纸 / 雪花 / 清单 /
    //      胶带 / 笔记本 / 便签 / 蝴蝶结 / 长尾夹 / 图钉 / 木夹 / 票根 /
    //      咖啡小票 / 证件挂绳 / 工牌夹 / 拍立得框 / 回形针 / 雪球 / 猫头鹰票 / 订单 ----
    { f: 'b_01', w: 133, h: 344 },   // 雪花吊牌
    { f: 'b_02', w: 278, h: 233 },   // keep it cool 云朵
    { f: 'b_03', w: 285, h: 219 },   // 蓝白条纹信封
    { f: 'b_04', w: 226, h: 284 },   // 透明塑封袋
    { f: 'b_05', w: 298, h: 199 },   // 波点撕纸
    { f: 'b_06', w: 215, h: 230 },   // 冰晶雪花
    { f: 'b_07', w: 183, h: 235 },   // today 清单
    { f: 'b_08', w: 291, h: 127 },   // 撕边和纸胶带
    { f: 'b_09', w: 183, h: 275 },   // 方格笔记本
    { f: 'b_10', w: 254, h: 260 },   // 横线便签本
    { f: 'b_11', w: 245, h: 251 },   // 方便利贴
    { f: 'b_12', w: 251, h: 234 },   // 蓝色蝴蝶结
    { f: 'b_13', w: 268, h: 212 },   // 蓝卡叠层
    { f: 'b_14', w: 224, h: 207 },   // 长尾夹
    { f: 'b_15', w: 78,  h: 184 },   // 木质木夹
    { f: 'b_16', w: 309, h: 167 },   // 472609 雪花票根
    { f: 'b_17', w: 180, h: 256 },   // FROST CAFE 小票
    { f: 'b_18', w: 217, h: 267 },   // 证件挂绳
    { f: 'b_19', w: 271, h: 240 },   // 工牌夹
    { f: 'b_20', w: 187, h: 230 },   // 雪花拍立得框
    { f: 'b_21', w: 180, h: 211 },   // 蓝色回形针
    { f: 'b_22', w: 178, h: 231 },   // 雪花水晶球
    { f: 'b_23', w: 222, h: 279 },   // ADMIT ONE 票根
    { f: 'b_24', w: 283, h: 161 }    // CAFE ORDER 点单卡
  ];
  /**
   * 简约清新贴纸池：绿:蓝 = 2:1 加权（绿色系出现概率是蓝色系的 2 倍），
   * 呼应「绿为主、蓝点缀」的基调。洗牌后按序取用即可。
   */
  function freshLibrary() {
    const pool = [];
    FRESH_LIBRARY.forEach(function (it) {
      pool.push(it);
      if (it.f.charAt(0) === 'g') pool.push(it);   // 绿色系重复一次 → 权重 ×2
    });
    return pool;
  }

  /* ============ 多彩活泼贴纸库（v3.20）============
   * 用户给的两张素材拼贴（纯白底商品图）已离线分割成单个透明 PNG，落在
   * assets/stickers/colorful/（目录名 = 风格 id，见 segment_colorful.py）。
   *  - 胶带库 4 分色，按素材图自身的 2×2 象限自动命名：
   *      红粉 t_p_xx(23)   黄 t_y_xx(29)   蓝 t_b_xx(27)   黑白 t_k_xx(30)
   *  - 贴纸库：韩系可爱贴纸 s_xx(28)，一套通吃四色主题。
   * f = 文件名（不含扩展名），w/h = 原始像素尺寸（等比缩放进槽位，绝不拉伸）。
   * 主题色系 → 胶带权重的映射在 page-video.js 的 COLORFUL_THEMES（走 colorfulTapePool）。
   */
  const COLORFUL_TAPES = {
    // 红粉组
    p: [
      { f: 't_p_01', w: 156, h: 56 }, { f: 't_p_02', w: 158, h: 55 }, { f: 't_p_03', w: 159, h: 61 },
      { f: 't_p_04', w: 199, h: 62 }, { f: 't_p_05', w: 166, h: 54 }, { f: 't_p_06', w: 114, h: 68 },
      { f: 't_p_07', w: 155, h: 63 }, { f: 't_p_08', w: 174, h: 55 }, { f: 't_p_09', w: 153, h: 54 },
      { f: 't_p_10', w: 158, h: 54 }, { f: 't_p_11', w: 162, h: 57 }, { f: 't_p_12', w: 152, h: 56 },
      { f: 't_p_13', w: 135, h: 70 }, { f: 't_p_14', w: 170, h: 62 }, { f: 't_p_15', w: 165, h: 53 },
      { f: 't_p_16', w: 198, h: 63 }, { f: 't_p_17', w: 281, h: 62 }, { f: 't_p_18', w: 184, h: 66 },
      { f: 't_p_19', w: 295, h: 72 }, { f: 't_p_20', w: 246, h: 52 }, { f: 't_p_21', w: 258, h: 46 },
      { f: 't_p_22', w: 256, h: 53 }, { f: 't_p_23', w: 251, h: 53 }
    ],
    // 黄组
    y: [
      { f: 't_y_01', w: 186, h: 66 }, { f: 't_y_02', w: 151, h: 60 }, { f: 't_y_03', w: 142, h: 73 },
      { f: 't_y_04', w: 179, h: 61 }, { f: 't_y_05', w: 176, h: 51 }, { f: 't_y_06', w: 145, h: 58 },
      { f: 't_y_07', w: 176, h: 48 }, { f: 't_y_08', w: 159, h: 47 }, { f: 't_y_09', w: 151, h: 47 },
      { f: 't_y_10', w: 250, h: 57 }, { f: 't_y_11', w: 241, h: 59 }, { f: 't_y_12', w: 168, h: 57 },
      { f: 't_y_13', w: 157, h: 56 }, { f: 't_y_14', w: 157, h: 59 }, { f: 't_y_15', w: 179, h: 59 },
      { f: 't_y_16', w: 171, h: 46 }, { f: 't_y_17', w: 134, h: 60 }, { f: 't_y_18', w: 208, h: 51 },
      { f: 't_y_19', w: 148, h: 42 }, { f: 't_y_20', w: 130, h: 46 }, { f: 't_y_21', w: 164, h: 51 },
      { f: 't_y_22', w: 161, h: 56 }, { f: 't_y_23', w: 160, h: 53 }, { f: 't_y_24', w: 164, h: 45 },
      { f: 't_y_25', w: 120, h: 63 }, { f: 't_y_26', w: 161, h: 56 }, { f: 't_y_27', w: 187, h: 44 },
      { f: 't_y_28', w: 142, h: 61 }, { f: 't_y_29', w: 155, h: 57 }
    ],
    // 蓝组
    b: [
      { f: 't_b_01', w: 169, h: 64 }, { f: 't_b_02', w: 153, h: 71 }, { f: 't_b_03', w: 144, h: 71 },
      { f: 't_b_04', w: 153, h: 48 }, { f: 't_b_05', w: 183, h: 60 }, { f: 't_b_06', w: 126, h: 67 },
      { f: 't_b_07', w: 162, h: 54 }, { f: 't_b_08', w: 137, h: 48 }, { f: 't_b_09', w: 155, h: 47 },
      { f: 't_b_10', w: 164, h: 56 }, { f: 't_b_11', w: 162, h: 49 }, { f: 't_b_12', w: 141, h: 58 },
      { f: 't_b_13', w: 153, h: 49 }, { f: 't_b_14', w: 160, h: 51 }, { f: 't_b_15', w: 163, h: 52 },
      { f: 't_b_16', w: 172, h: 51 }, { f: 't_b_17', w: 146, h: 51 }, { f: 't_b_18', w: 158, h: 49 },
      { f: 't_b_19', w: 163, h: 51 }, { f: 't_b_20', w: 162, h: 50 }, { f: 't_b_21', w: 156, h: 55 },
      { f: 't_b_22', w: 158, h: 52 }, { f: 't_b_23', w: 156, h: 51 }, { f: 't_b_24', w: 163, h: 55 },
      { f: 't_b_25', w: 157, h: 52 }, { f: 't_b_26', w: 165, h: 59 }, { f: 't_b_27', w: 154, h: 51 }
    ],
    // 黑白组
    k: [
      { f: 't_k_01', w: 158, h: 55 }, { f: 't_k_02', w: 157, h: 53 }, { f: 't_k_03', w: 167, h: 54 },
      { f: 't_k_04', w: 152, h: 54 }, { f: 't_k_05', w: 174, h: 54 }, { f: 't_k_06', w: 159, h: 56 },
      { f: 't_k_07', w: 153, h: 55 }, { f: 't_k_08', w: 158, h: 50 }, { f: 't_k_09', w: 170, h: 52 },
      { f: 't_k_10', w: 151, h: 48 }, { f: 't_k_11', w: 159, h: 49 }, { f: 't_k_12', w: 165, h: 52 },
      { f: 't_k_13', w: 174, h: 50 }, { f: 't_k_14', w: 173, h: 53 }, { f: 't_k_15', w: 143, h: 44 },
      { f: 't_k_16', w: 173, h: 51 }, { f: 't_k_17', w: 165, h: 53 }, { f: 't_k_18', w: 153, h: 53 },
      { f: 't_k_19', w: 157, h: 49 }, { f: 't_k_20', w: 172, h: 53 }, { f: 't_k_21', w: 170, h: 54 },
      { f: 't_k_22', w: 165, h: 53 }, { f: 't_k_23', w: 163, h: 51 }, { f: 't_k_24', w: 165, h: 51 },
      { f: 't_k_25', w: 173, h: 68 }, { f: 't_k_26', w: 153, h: 58 }, { f: 't_k_27', w: 167, h: 68 },
      { f: 't_k_28', w: 170, h: 68 }, { f: 't_k_29', w: 166, h: 70 }, { f: 't_k_30', w: 165, h: 49 }
    ]
  };

  const COLORFUL_STICKERS = [
    { f: 's_01', w: 208, h: 100 }, { f: 's_02', w: 352, h: 178 }, { f: 's_03', w: 257, h: 280 },
    { f: 's_04', w: 274, h: 115 }, { f: 's_05', w: 277, h: 258 }, { f: 's_06', w: 263, h: 150 },
    { f: 's_07', w: 244, h: 148 }, { f: 's_08', w: 321, h: 191 }, { f: 's_09', w: 344, h: 277 },
    { f: 's_10', w: 208, h: 243 }, { f: 's_11', w: 257, h: 270 }, { f: 's_12', w: 274, h: 239 },
    { f: 's_13', w: 175, h: 174 }, { f: 's_14', w: 174, h: 175 }, { f: 's_15', w: 197, h: 251 },
    { f: 's_16', w: 225, h: 211 }, { f: 's_17', w: 224, h: 273 }, { f: 's_18', w: 220, h: 218 },
    { f: 's_19', w: 248, h: 236 }, { f: 's_20', w: 208, h: 202 }, { f: 's_21', w: 132, h: 133 },
    { f: 's_22', w: 231, h: 189 }, { f: 's_23', w: 234, h: 233 }, { f: 's_24', w: 231, h: 192 },
    { f: 's_25', w: 198, h: 218 }, { f: 's_26', w: 111, h: 245 }, { f: 's_27', w: 107, h: 233 },
    { f: 's_28', w: 109, h: 258 }
  ];

  /**
   * 多彩活泼胶带池：按主题色系的权重表拼池（列表重复 w 次 → 出现概率 × w）。
   * 例：[{k:'b',w:3},{k:'k',w:1}] = 蓝胶带出现概率是黑白胶带的 3 倍。
   */
  function colorfulTapePool(fams) {
    const pool = [];
    (Array.isArray(fams) ? fams : []).forEach(function (fam) {
      const list = COLORFUL_TAPES[fam && fam.k];
      if (!list) return;
      const times = Math.max(1, Math.round(fam.w || 1));
      for (let n = 0; n < times; n++) {
        list.forEach(function (it) { pool.push(it); });
      }
    });
    return pool;
  }

  /** 多彩活泼的可爱贴纸池（四色主题通用） */
  function colorfulLibrary() {
    return COLORFUL_STICKERS;
  }

  /* ============ 暗黑质感贴纸库 ============
   *  - d1_XX：复古黑物（相机/闹钟/拨号电话/磁带/护照），白底素材
   *  - d2_XX：黑白音乐拼贴（黑胶/黑猫/幽灵/乐谱缎带/词条），白底素材
   *  - d3_XX：黑底黑白拼贴（美钞/缎带/翻盖机/CD/耳机），黑底自动反选
   * f = 文件名（不含扩展名），w/h = 原始像素尺寸（等比缩放进槽位，绝不拉伸）。
   * 注：d1_07 在切图时被剔除（与 d1_06 重复），库/清单/目录三方一致为 71 枚。
   */
  const DARK_LIBRARY = [
    { f: 'd1_01', w: 392, h: 317 },
    { f: 'd1_02', w: 385, h: 284 },
    { f: 'd1_03', w: 304, h: 423 },
    { f: 'd1_04', w: 307, h: 203 },
    { f: 'd1_05', w: 227, h: 359 },
    { f: 'd1_06', w: 425, h: 279 },
    { f: 'd1_08', w: 274, h: 184 },
    { f: 'd1_09', w: 739, h: 439 },
    { f: 'd1_10', w: 398, h: 398 },
    { f: 'd1_11', w: 128, h: 476 },
    { f: 'd1_12', w: 302, h: 200 },
    { f: 'd1_13', w: 381, h: 224 },
    { f: 'd1_14', w: 473, h: 255 },
    { f: 'd1_15', w: 592, h: 261 },
    { f: 'd2_01', w: 122, h: 206 },
    { f: 'd2_02', w: 306, h: 207 },
    { f: 'd2_03', w: 221, h: 223 },
    { f: 'd2_04', w: 74, h: 196 },
    { f: 'd2_05', w: 98, h: 150 },
    { f: 'd2_06', w: 84, h: 151 },
    { f: 'd2_07', w: 186, h: 122 },
    { f: 'd2_08', w: 212, h: 233 },
    { f: 'd2_09', w: 313, h: 271 },
    { f: 'd2_10', w: 280, h: 99 },
    { f: 'd2_11', w: 112, h: 116 },
    { f: 'd2_12', w: 215, h: 215 },
    { f: 'd2_13', w: 98, h: 56 },
    { f: 'd2_14', w: 151, h: 138 },
    { f: 'd2_15', w: 200, h: 90 },
    { f: 'd2_16', w: 114, h: 114 },
    { f: 'd2_17', w: 150, h: 70 },
    { f: 'd2_18', w: 79, h: 74 },
    { f: 'd2_19', w: 128, h: 51 },
    { f: 'd2_20', w: 82, h: 47 },
    { f: 'd2_21', w: 73, h: 45 },
    { f: 'd2_22', w: 121, h: 241 },
    { f: 'd2_23', w: 105, h: 107 },
    { f: 'd2_24', w: 228, h: 227 },
    { f: 'd2_25', w: 256, h: 261 },
    { f: 'd2_26', w: 257, h: 148 },
    { f: 'd2_27', w: 155, h: 208 },
    { f: 'd2_28', w: 168, h: 134 },
    { f: 'd2_29', w: 178, h: 137 },
    { f: 'd2_30', w: 186, h: 153 },
    { f: 'd2_31', w: 43, h: 96 },
    { f: 'd2_32', w: 209, h: 302 },
    { f: 'd2_33', w: 315, h: 316 },
    { f: 'd2_34', w: 210, h: 367 },
    { f: 'd2_35', w: 237, h: 300 },
    { f: 'd2_36', w: 104, h: 237 },
    { f: 'd2_37', w: 256, h: 268 },
    { f: 'd2_38', w: 334, h: 73 },
    { f: 'd2_39', w: 199, h: 212 },
    { f: 'd2_40', w: 169, h: 132 },
    { f: 'd2_41', w: 65, h: 102 },
    { f: 'd2_42', w: 281, h: 320 },
    { f: 'd2_43', w: 311, h: 205 },
    { f: 'd2_44', w: 38, h: 83 },
    { f: 'd2_45', w: 59, h: 90 },
    { f: 'd2_46', w: 54, h: 90 },
    { f: 'd2_47', w: 52, h: 102 },
    { f: 'd2_48', w: 156, h: 44 },
    { f: 'd3_01', w: 474, h: 379 },
    { f: 'd3_02', w: 747, h: 540 },
    { f: 'd3_03', w: 268, h: 372 },
    { f: 'd3_04', w: 425, h: 255 },
    { f: 'd3_05', w: 372, h: 374 },
    { f: 'd3_06', w: 335, h: 336 },
    { f: 'd3_07', w: 369, h: 335 },
    { f: 'd3_08', w: 640, h: 572 },
    { f: 'd3_09', w: 358, h: 510 }
  ];
  /**
   * 暗黑贴纸池：三组素材加权 —— d1 黑物（质感主料）×2、d2 黑白音乐拼贴 ×2、
   * d3 黑底拼贴 ×1（黑底反选件本身块头大、信息密，放多了页面发闷）。
   */
  function darkLibrary() {
    const pool = [];
    DARK_LIBRARY.forEach(function (it) {
      const g = it.f.slice(0, 2);
      if (g === 'd3') pool.push(it);
      else { pool.push(it); pool.push(it); }   // d1/d2 权重 ×2
    });
    return pool;
  }

  /* ============ 水彩手绘贴纸库 ============
   * 钢笔淡彩旅行插画离线分割（assets/stickers/watercolor/），共 45 枚：
   *  - w1_XX：第 1 张素材（33 枚）
   *  - w2_XX：第 2 张素材（12 枚）
   * 与 dark 库不同：**不垫白 die-cut 描边** —— 钢笔淡彩要通透，边缘透出手帐纸纹，
   * 物件本身已有黑色细钢笔轮廓线，加白边会变塑料贴纸感。
   * f = 文件名（不含扩展名），w/h = 原始像素尺寸（等比缩放进槽位，绝不拉伸）。
   */
  const WATERCOLOR_LIBRARY = [
    { f: 'w1_01', w: 227, h: 198 },
    { f: 'w1_02', w: 112, h: 192 },
    { f: 'w1_03', w: 133, h: 211 },
    { f: 'w1_04', w: 67, h: 115 },
    { f: 'w1_05', w: 88, h: 97 },
    { f: 'w1_06', w: 87, h: 125 },
    { f: 'w1_07', w: 55, h: 34 },
    { f: 'w1_08', w: 161, h: 173 },
    { f: 'w1_09', w: 209, h: 119 },
    { f: 'w1_10', w: 180, h: 168 },
    { f: 'w1_11', w: 198, h: 130 },
    { f: 'w1_12', w: 187, h: 144 },
    { f: 'w1_13', w: 160, h: 231 },
    { f: 'w1_14', w: 148, h: 208 },
    { f: 'w1_15', w: 208, h: 162 },
    { f: 'w1_16', w: 193, h: 196 },
    { f: 'w1_17', w: 214, h: 174 },
    { f: 'w1_18', w: 171, h: 173 },
    { f: 'w1_19', w: 164, h: 205 },
    { f: 'w1_20', w: 150, h: 199 },
    { f: 'w1_21', w: 52, h: 42 },
    { f: 'w1_22', w: 173, h: 203 },
    { f: 'w1_23', w: 222, h: 156 },
    { f: 'w1_24', w: 206, h: 153 },
    { f: 'w1_25', w: 184, h: 180 },
    { f: 'w1_26', w: 165, h: 170 },
    { f: 'w1_27', w: 203, h: 174 },
    { f: 'w1_28', w: 211, h: 202 },
    { f: 'w1_29', w: 195, h: 232 },
    { f: 'w1_30', w: 206, h: 249 },
    { f: 'w1_31', w: 182, h: 228 },
    { f: 'w1_32', w: 184, h: 220 },
    { f: 'w1_33', w: 177, h: 220 },
    { f: 'w2_01', w: 258, h: 339 },
    { f: 'w2_02', w: 180, h: 339 },
    { f: 'w2_03', w: 241, h: 285 },
    { f: 'w2_04', w: 261, h: 405 },
    { f: 'w2_05', w: 301, h: 305 },
    { f: 'w2_06', w: 240, h: 214 },
    { f: 'w2_07', w: 251, h: 334 },
    { f: 'w2_08', w: 111, h: 79 },
    { f: 'w2_09', w: 106, h: 81 },
    { f: 'w2_10', w: 271, h: 216 },
    { f: 'w2_11', w: 214, h: 109 },
    { f: 'w2_12', w: 49, h: 45 }
  ];

  /** 水彩手绘贴纸库：每次随机抽取若干枚（见 diary-skin-pipeline.buildWatercolorStickers） */
  function watercolorLibrary() {
    return WATERCOLOR_LIBRARY;
  }

  /* ============ 杂志排版专属素材库 ============
   * 编辑杂志元素程序化绘制（backend/gen_magazine_stickers.py），透明 PNG 12 枚：
   * 裁切角(m_cut_corner) / 页码牌(m_page_tag) / 红分隔线(m_red_rule) /
   * 相角(m_photo_corner) / 条码(m_barcode) / 大引号(m_quote) /
   * 栏目号(m_section_no) / 胶片条(m_film_strip) / 版头条(m_run_head) /
   * 红星(m_star_mark) / 圆点阵(m_dot_grid) / 牛皮吊牌(m_kraft_tag)
   * 无 die-cut 描边，干净编辑质感。
   */
  const MAGAZINE_LIBRARY = [
    { f: 'm_cut_corner', w: 90, h: 90 },
    { f: 'm_page_tag', w: 150, h: 60 },
    { f: 'm_red_rule', w: 520, h: 24 },
    { f: 'm_photo_corner', w: 70, h: 70 },
    { f: 'm_barcode', w: 180, h: 70 },
    { f: 'm_quote', w: 140, h: 110 },
    { f: 'm_section_no', w: 90, h: 90 },
    { f: 'm_film_strip', w: 260, h: 80 },
    { f: 'm_run_head', w: 300, h: 46 },
    { f: 'm_star_mark', w: 54, h: 54 },
    { f: 'm_dot_grid', w: 120, h: 120 },
    { f: 'm_kraft_tag', w: 110, h: 180 }
  ];

  /** 杂志专属素材库：编辑编排元素，每次洗牌取用 */
  function magazineLibrary() {
    return MAGAZINE_LIBRARY;
  }

  window.DiaryTemplates = {
    buildLayout: buildLayout,
    describeSlots: describeSlots,
    cutoutSpots: cutoutSpots,
    vintageLibrary: vintageLibrary,
    freshLibrary: freshLibrary,
    colorfulLibrary: colorfulLibrary,
    colorfulTapePool: colorfulTapePool,
    darkLibrary: darkLibrary,
    watercolorLibrary: watercolorLibrary,
    magazineLibrary: magazineLibrary,
    bakeDateToken: bakeDateToken,
    userDiaryDate: function () { return getDateParts().md; }, // 旧 API 兼容：返回 "9月9日"
    getDateParts: getDateParts,
    TEMPLATES: { vintage: vintage, minimal: minimal, colorful: colorful, dark: dark, watercolor: watercolor, magazine: magazine }
  };
})();
