/* ================================================================
 * 探途 WANDR — 新版旅行手帐「Canvas 渲染器」
 *
 * 职责：把 DeepSeek 返回的 1080×1440「排版 JSON」（新版 schema）在
 * 浏览器里用真实照片 + OpenMoji 公网贴纸 + 手帐文字合成最终画面，
 * 供预览与 PNG 导出。
 *
 * 红线（与后端一致）：
 *  - 绝不调用文生图/图生图；用户照片只做等比 cover 裁切后原样贴图，
 *    不做任何 AI 重绘（未来抠图由 Imgly-WASM 在前端完成）；
 *  - 贴纸只取 OpenMoji CDN（cdn.jsdelivr.net），crossOrigin=anonymous，
 *    canvas 不被污染；
 *  - 单张照片/贴纸加载失败只跳过该项，不中断整体渲染。
 *
 * 新版排版 JSON（与 diary-next-data.js 锚点约定同步）：
 * {
 *   "style":"复古胶片", "style_variation":"变体01",
 *   "canvas_width":1080, "canvas_height":1440,
 *   "bg_color":"#F5EFE6", "layout":"staggered",
 *   "items":[ {photo_index,x,y,width,height,rotate,border} ],
 *   "decor_stickers":[ {id,x,y,width,height} ],
 *   "texts":[ {content,x,y,font_size,color} ]
 * }
 *  - item  (x,y) 是照片画面区左上角；border 向四周外扩，rotate 以画面
 *    中心为轴（度，顺时针为正）；
 *  - decor_stickers (x,y) 是贴纸左上角，width/height 贴纸占位；
 *  - texts (x,y) 是文本块左上角，font_size 字号，自动换行。
 *  兼容旧字段别名：w/h 与 width/height、rotation 与 rotate、anchor:'center'
 *  可将 (x,y) 视为中心点。
 *
 * 对外 API（window.DiaryNextRenderer）：
 *   render(spec, {
 *     photos:   [HTMLImageElement|HTMLCanvasElement|Blob|File|String(dataURL/URL)],
 *     scale:    0..1 预览缩放（默认 1，输出为 1080×1440 全尺寸）
 *   }) => Promise<{ canvas, ctx, scale, toDataURL(type,quality), blob() }>
 * ================================================================ */
(function (global) {
  'use strict';

  const CW = 1080;
  const CH = 1440;

  /* 兼容：老渲染器用 frame='polaroid'，新 schema 用 border='polaroid_white' */
  const BORDER_ALIAS = {
    none: 'none',
    '': 'none',
    thin_white: 'thin_white', thin: 'thin_white', white: 'thin_white',
    polaroid_white: 'polaroid_white', polaroid: 'polaroid_white',
    polaroid_note: 'polaroid_white',
    film_border: 'film_border', film: 'film_border',
    thick_white: 'thick_white', thick: 'thick_white',
    color_frame: 'color_frame', color: 'color_frame',
    soft_white: 'soft_white', soft: 'soft_white',
    rect_border: 'rect_border', rect: 'rect_border'
  };

  const FONT_STACK = {
    hand:  '"Zhi Mang Xing","Ma Shan Zheng","Long Cang","Kaiti SC","KaiTi","STKaiti","DFKai-SB","Microsoft YaHei",cursive',
    note:  '"Zhi Mang Xing","Ma Shan Zheng","Kaiti SC","KaiTi","STKaiti","DFKai-SB","Microsoft YaHei",cursive',
    serif: 'Georgia,"Noto Serif SC","Songti SC","STSong","SimSun",serif',
    sans:  '-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
    type:  '"Arial Narrow","Roboto Condensed","Microsoft YaHei","SimHei",sans-serif',
    // 英文手写 script（参考图 vintage/watercolor 的 "Travel memories" 类标题）
    script: '"Caveat","Liu Jian Mao Cao","Dancing Script","Segoe Script","Bradley Hand","Comic Sans MS","Segoe Print",cursive',
    // 粗黑手写大字（参考图 dark "今天无味！"）
    marker: '"Ma Shan Zheng","Liu Jian Mao Cao","Zhi Mang Xing","STXinwei","Xinwei","Microsoft YaHei","SimHei",sans-serif',
    // v3.18 简约清新：用户参考图那种「圆头马克笔手写涂鸦」体
    // （中文用站酷快乐体，英文/数字用 Patrick Hand / Gaegu，都是圆头手写感）
    fresh: '"ZCOOL KuaiLe","Patrick Hand","Gaegu","Ma Shan Zheng","Zhi Mang Xing","Kaiti SC","KaiTi","STKaiti","Microsoft YaHei",cursive',
    // v3.20 多彩活泼：比 fresh 更「圆咕隆咚」的涂鸦体 —— 英文/数字优先走 Gaegu
    // （韩系可爱圆体，配韩系贴纸），中文仍用站酷快乐体兜底
    lively: '"ZCOOL KuaiLe","Gaegu","Patrick Hand","Ma Shan Zheng","Liu Jian Mao Cao","Zhi Mang Xing","Kaiti SC","KaiTi","STKaiti","Microsoft YaHei",cursive',
    // v3.23 多彩活泼：文案全英文 → Caveat 优先（连笔细笔、略右倾，是行楷气质的
    // 英文对应字体；journal.html 的 Google Fonts CSS 已含 Caveat 400/600）。
    // 若模型漏出中文，仍由 hongleixingshu（v3.22 细笔行楷）兜底，气质不打架。
    pen: '"Caveat","hongleixingshu","Gaegu","Patrick Hand","ZCOOL KuaiLe","Kaiti SC","KaiTi","STKaiti","Microsoft YaHei",cursive'
  };

  /* ---------- 小工具 ---------- */

  function num(v, d) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  function deg2rad(d) { return (num(d, 0)) * Math.PI / 180; }

  function parseHex(c) {
    if (typeof c !== 'string') return { r: 255, g: 255, b: 255 };
    let s = c.trim().replace(/^#/, '');
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    const n = parseInt(s.slice(0, 6), 16);
    if (Number.isNaN(n)) return { r: 255, g: 255, b: 255 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgba(c, a) {
    const { r, g, b } = parseHex(c);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + (a == null ? 1 : a) + ')';
  }

  // 圆角矩形路径（不依赖 ctx.roundRect，兼容旧内核）
  function roundRectPath(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(num(r, 0), w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // 可复现伪随机（纸纹噪点，保证预览与导出一致）
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- 图片装载（照片 + 贴纸） ---------- */

  function isEl(v) { return v instanceof HTMLImageElement || v instanceof HTMLCanvasElement; }

  function loadSource(src) {
    return new Promise(function (resolve, reject) {
      if (src instanceof HTMLCanvasElement) {
        return resolve({ el: src, w: src.width, h: src.height });
      }
      if (src instanceof HTMLImageElement) {
        if (src.complete && src.naturalWidth > 0) {
          return resolve({ el: src, w: src.naturalWidth, h: src.naturalHeight });
        }
        src.addEventListener('load', function () {
          resolve({ el: src, w: src.naturalWidth, h: src.naturalHeight });
        }, { once: true });
        src.addEventListener('error', function () { reject(new Error('图片加载失败')); }, { once: true });
        return undefined;
      }
      if (src instanceof Blob || src instanceof File) {
        const url = URL.createObjectURL(src);
        const img = new Image();
        img.onload = function () {
          URL.revokeObjectURL(url);
          resolve({ el: img, w: img.naturalWidth, h: img.naturalHeight });
        };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('图片解码失败')); };
        img.src = url;
        return undefined;
      }
      if (typeof src === 'string') {
        const img = new Image();
        if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous';
        img.onload = function () {
          resolve({ el: img, w: img.naturalWidth, h: img.naturalHeight });
        };
        img.onerror = function () { reject(new Error('图片加载失败: ' + String(src).slice(0, 60))); };
        img.src = src;
        return undefined;
      }
      reject(new Error('不支持的图片来源'));
    });
  }

  const _stickerCache = {};
  function loadStickerImg(url, key) {
    if (_stickerCache[key]) return Promise.resolve(_stickerCache[key]);
    return new Promise(function (resolve, reject) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () { _stickerCache[key] = img; resolve(img); };
      img.onerror = function () { reject(new Error('贴纸加载失败: ' + key)); };
      img.src = url;
    });
  }

  /* ---------- 排版 JSON 标准化 ---------- */

  // 把新版 schema 规范化成内部对象；不做深度校验，字段缺失走宽容默认
  function normalizeLayout(layout) {
    if (!layout || typeof layout !== 'object') {
      throw new Error('排版 JSON 无效：缺少 layout 对象');
    }
    const items = [];
    (Array.isArray(layout.items) ? layout.items : []).forEach(function (it, i) {
      if (!it || typeof it !== 'object') return;
      const box = {};
      const isCenter = it.anchor === 'center';
      const x = num(it.x, 0), y = num(it.y, 0);
      const w = num(it.w || it.width, 0);
      const h = num(it.h || it.height, 0);
      box.x = isCenter ? x - w / 2 : x;
      box.y = isCenter ? y - h / 2 : y;
      box.w = w; box.h = h;
      box.photoIndex = num(it.photo_index, -1);
      if (it.photo != null && box.photoIndex < 0) box.photoIndex = num(it.photo, -1);
      box.rotate = num(it.rotate, it.rotation != null ? num(it.rotation, 0) : 0);
      const b = BORDER_ALIAS[String(it.border != null ? it.border : it.frame)] || 'none';
      box.border = b;
      box.borderColor = it.border_color || it.frame_color || it.borderColor || null;
      box.borderWidth = it.border_width != null ? num(it.border_width, 0) : null;
      box.shadow = it.shadow !== false;
      box.caption = it.caption || it.caption_text || null;
      box.captionColor = it.caption_color || null;
      box.z = num(it.z, 10);
      items.push(box);
    });

    const stickers = [];
    (Array.isArray(layout.decor_stickers) ? layout.decor_stickers : []).forEach(function (s, i) {
      if (!s) return;
      stickers.push({
        x: num(s.x, 0), y: num(s.y, 0),
        w: num(s.w || s.width, num(s.size, 80)),
        h: num(s.h || s.height, num(s.size, 80)),
        id: s.id != null ? s.id : ('sticker_' + (i + 1)),
        rotate: num(s.rotate, s.rotation != null ? num(s.rotation, 0) : 0),
        opacity: s.opacity != null ? clamp(num(s.opacity, 1), 0, 1) : 1,
        shadow: s.shadow !== false, // 默认开贴纸阴影
        z: num(s.z, 20)
      });
    });

    const texts = [];
    (Array.isArray(layout.texts) ? layout.texts : []).forEach(function (t) {
      if (!t) return;
      texts.push({
        x: num(t.x, 0), y: num(t.y, 0),
        content: String(t.content != null ? t.content : t.text || ''),
        size: num(t.font_size, num(t.size, 28)),
        color: t.color || '#333333',
        font: t.font || 'hand',
        align: t.align || 'left',
        rotate: num(t.rotate, t.rotation != null ? num(t.rotation, 0) : 0),
        width: t.width != null ? num(t.width, 0) : 0,
        lineHeight: t.line_height ? num(t.line_height, 0) : 0,
        bold: !!t.bold,
        // 描边（与 v2 一致语义：>0 即生效；色/宽可单独指定）
        stroke: t.stroke != null ? num(t.stroke, 0) : 0,
        strokeColor: t.stroke_color || t.strokeColor || '#FFFFFF',
        strokeWidth: t.stroke_width != null ? num(t.stroke_width, 2) : 2,
        // v3.14 便签底层文字：画在便签之上、照片/贴纸之下（见 layout.note）
        underPhotos: !!t.under_photos,
        z: num(t.z, 30)
      });
    });

    // 解析背景渐变（partial background cover / partial highlight）
    // { type:'linear'|'radial', x,y,w,h, angle(linear), from, to, stops? }
    let bgGradient = null;
    if (layout.bg_gradient && typeof layout.bg_gradient === 'object') {
      const g = layout.bg_gradient;
      bgGradient = {
        type: g.type === 'radial' ? 'radial' : 'linear',
        x: num(g.x, 0), y: num(g.y, 0),
        w: num(g.w || g.width, CW),
        h: num(g.h || g.height, CH),
        angle: num(g.angle, 180),
        from: g.from || layout.bg_color || '#FFFFFF',
        to:   g.to   || '#FFFFFF',
        stops: Array.isArray(g.stops) && g.stops.length >= 2
          ? g.stops.map(function (s, i) { return { at: num(s.at != null ? s.at : i / (g.stops.length - 1), i / Math.max(1, g.stops.length - 1)), color: s.color || '#FFFFFF' }; })
          : null
      };
    }

    return {
      style: layout.style || '',
      styleVariation: layout.style_variation || '',
      canvasW: num(layout.canvas_width, CW),
      canvasH: num(layout.canvas_height, CH),
      bgColor: layout.bg_color || layout.background_color || '#FFFFFF',
      bgGradient: bgGradient,
      bgNoise: layout.bg_noise !== false,
      bgPaperLines: !!layout.bg_paper_lines,
      bgPaperAged: !!layout.bg_paper_aged,
      layoutKind: layout.layout || 'staggered',
      // v3.8 复古胶片调色：grade 必须透传，否则 render() 末尾 applyVintageGrade 会因 layout.grade 为空而跳过
      grade: layout.grade || null,
      // v3.13 6 套预设模板：每张照片顶边自动贴一条胶带（照片被宽高比扩缩/挪位，胶带跟着走）。
      // AI / 自定义排版沿用其自带 tapes（走"就近吸附"分支）；模板可显式写 tapes_auto:false 关掉。
      tapesAuto: layout.tapes_auto != null
        ? !!layout.tapes_auto
        : ['vintage', 'minimal', 'colorful', 'dark', 'watercolor', 'magazine']
            .indexOf(String(layout.style || '')) !== -1,
      cards: (Array.isArray(layout.cards) ? layout.cards : []).map(function (c) {
        return {
          x: num(c.x, 0), y: num(c.y, 0),
          w: num(c.w || c.width, 800),
          h: num(c.h || c.height, 1100),
          fill: (c.fill === 'none' || c.fill === null || c.fill === undefined) ? 'none' : c.fill,
          round: num(c.round, 0),
          grid: !!c.grid,
          gridV: !!(c.grid_v != null ? c.grid_v : c.gridV),
          lineColor: c.line_color || c.lineColor || '#D8D0BE',
          lineSpacing: num(c.line_spacing != null ? c.line_spacing : c.lineSpacing, 36),
          colSpacing: num(c.col_spacing != null ? c.col_spacing : c.colSpacing, 58),
          borderColor: c.border_color || c.borderColor || 'rgba(0,0,0,0)',
          borderWidth: num(c.border_width != null ? c.border_width : c.borderWidth, 0),
          shadow: c.shadow !== false,
          rotate: num(c.rotate, 0)
        };
      }),
      items: items,
      stickers: stickers,
      cutouts: (Array.isArray(layout.cutouts) ? layout.cutouts : []).map(function (c) {
        return {
          x: num(c.x, 0), y: num(c.y, 0),
          w: num(c.w || c.width, 140),
          h: num(c.h || c.height, 140),
          photoIndex: num(c.photo_index != null ? c.photo_index : c.photoIndex, -1),
          rotate: num(c.rotate, 0),
          opacity: c.opacity != null ? clamp(num(c.opacity, 1), 0, 1) : 1,
          z: num(c.z, 20)
        };
      }),
      texts: texts,
      tapes: (Array.isArray(layout.tapes) ? layout.tapes : []).map(function (t) {
        return {
          x: num(t.x, 0), y: num(t.y, 0),
          w: num(t.w || t.width, 120),
          h: num(t.h || t.height, 28),
          rotate: num(t.rotate, 0),
          color: t.color || '#F5A623',
          // v3.20 多彩活泼：真实和纸胶带图（assets/stickers/<style>/<file>.png）
          // 有 file 时 drawTapeItem 走图片分支，color 作废但不影响老排版
          file: t.file || null,
          opacity: t.opacity != null ? clamp(num(t.opacity, 1), 0, 1) : 0.82
        };
      }),
      // v3.20 真实胶带候选池（[{f,w,h}]，w/h = 胶带图原始像素，用于算宽高比）：
      // buildAutoPhotoTapes 给每张照片顶边依次取一条，避免拉伸变形。
      // ⚠️ normalizeLayout 是透传字段的隐形杀手 —— 新顶层字段必须在这里显式带上。
      tapeFiles: (Array.isArray(layout.tapeFiles) ? layout.tapeFiles : [])
        .filter(function (m) { return m && m.f; })
        .map(function (m) { return { f: String(m.f), w: num(m.w, 0), h: num(m.h, 0) }; }),
      // 复古贴纸库：外部透明 PNG 贴纸（不去背景、不裁剪，整张 contain 放进槽位）
      library: (Array.isArray(layout.library) ? layout.library : []).map(function (l) {
        return {
          file: String(l.file || ''),           // 贴纸文件 id（对应 assets/stickers/<style>/<file>.png）
          src: l.src || null,                    // 可选：直接给完整 URL / dataURL
          x: num(l.x, 0), y: num(l.y, 0),
          w: num(l.w || l.width, 160),
          h: num(l.h || l.height, 160),
          rotate: num(l.rotate, 0),
          opacity: l.opacity != null ? clamp(num(l.opacity, 1), 0, 1) : 1,
          shadow: l.shadow !== false,
          z: num(l.z, 24)
        };
      }),
      pins: (Array.isArray(layout.pins) ? layout.pins : []).map(function (p) {
        return {
          x: num(p.x, 0), y: num(p.y, 0),
          size: num(p.size, 40),
          color: p.color || '#E74C3C'

        };
      }),
      doodles: (Array.isArray(layout.doodles) ? layout.doodles : []).map(function (d) {
        return {
          kind: String(d.kind || 'arrow'),
          x: num(d.x, 0), y: num(d.y, 0),
          w: num(d.w || d.width, 120),
          h: num(d.h || d.height, 80),
          color: d.color || '#444444',
          fill: d.fill || null,
          opacity: d.opacity != null ? clamp(num(d.opacity, 1), 0, 1) : 1,
          rotate: num(d.rotate, 0),
          stroke: num(d.stroke, 0),
          // v3.18 空心图形（star/ellipse 只描边不填充）→ 简约清新的「空心星星」
          hollow: !!d.hollow,
          // v3.19 圆角星 + 柔光晕（参考图那种软糯发光星）
          rounded: !!d.rounded,
          round: num(d.round, 0),
          roundInner: num(d.roundInner, 0),
          glow: num(d.glow, 0)
        };
      }),
      widgets: (Array.isArray(layout.widgets) ? layout.widgets : []).map(function (wgt) {
        return {
          type: String(wgt.type || ''),
          x: num(wgt.x, 0), y: num(wgt.y, 0),
          w: num(wgt.w || wgt.width, 0),
          h: num(wgt.h || wgt.height, 0),
          rotate: num(wgt.rotate, 0),
          color: wgt.color || null,
          opacity: wgt.opacity != null ? clamp(num(wgt.opacity, 1), 0, 1) : 1,
          // 各类型自有参数原样透传
          data: wgt.data || null,
          text: wgt.text || null,
          items: Array.isArray(wgt.items) ? wgt.items : null,
          // v3.14 便签底层挂件（如便签上的清单）：画在便签之上、照片/贴纸之下
          underPhotos: !!wgt.under_photos
        };
      }),
      // v3.14 实心便签（次底层）：背景/卡片之上、照片/贴纸之下
      note: (function () {
        const n = layout.note;
        if (!n || typeof n !== 'object') return null;
        const w = num(n.w || n.width, 0), h = num(n.h || n.height, 0);
        if (w <= 0 || h <= 0) return null;
        return {
          x: num(n.x, 0), y: num(n.y, 0), w: w, h: h,
          fill: (n.fill === 'none' || n.fill == null) ? null : n.fill,
          stroke: n.stroke || n.color || null,
          strokeWidth: num(n.stroke_width != null ? n.stroke_width : n.strokeWidth, 0),
          round: num(n.round, 0),
          rotate: num(n.rotate, 0),
          shadow: n.shadow !== false,
          opacity: n.opacity != null ? clamp(num(n.opacity, 1), 0, 1) : 1
        };
      })()
    };
  }

  /* ---------- v3.8 复古胶片调色（Lightroom 式 9 参数）：HSL + USM + 噪点 ----------
   * 全部基于 layout.grade 字段，数值范围 [-100, 100]，0 = 不动。
   * 字段：vibrance（鲜明度）/ value（明度）/ brightness（亮度）/ contrast（对比度）
   *       clarity（清晰度，中调反差）/ saturation（饱和度）/ grain（颗粒）
   *       highlights（高光）/ sharpen（锐化）
   * 调用顺序（在画布上）：HSL-pass → CSS filter → USM（clarity+sharpen） → 颗粒
   */

  function clamp255(v) { return v < 0 ? 0 : v > 255 ? 255 : v | 0; }

  // 简易 box blur（半径 r，对称处理边界）；输出新 ImageData
  // 1080×1440 在 r=2 (5x5) 时约 38M 次操作，V8 下 ~150ms 可接受
  function boxBlur(imageData, r) {
    const W = imageData.width, H = imageData.height;
    const src = imageData.data;
    const out = new Uint8ClampedArray(src.length);
    const size = (2 * r + 1) * (2 * r + 1);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let R = 0, G = 0, B = 0, A = 0, n = 0;
        const y0 = Math.max(0, y - r), y1 = Math.min(H - 1, y + r);
        const x0 = Math.max(0, x - r), x1 = Math.min(W - 1, x + r);
        for (let ny = y0; ny <= y1; ny++) {
          for (let nx = x0; nx <= x1; nx++) {
            const idx = (ny * W + nx) * 4;
            R += src[idx]; G += src[idx + 1]; B += src[idx + 2]; A += src[idx + 3];
            n++;
          }
        }
        const idx = (y * W + x) * 4;
        out[idx]     = R / n;
        out[idx + 1] = G / n;
        out[idx + 2] = B / n;
        out[idx + 3] = A / n;
      }
    }
    return new ImageData(out, W, H);
  }

  // 确定性颗粒噪点（per-pixel hash，相同位置总是相同值——预览和导出结果一致）
  function addGrain(canvas, amount) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cur = ctx.getImageData(0, 0, W, H);
    const d = cur.data;
    const amp = amount * 36;  // amount ∈ [-1,1] → 颗粒振幅 [-36, 36]
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let h = (x * 2654435761) ^ (y * 40503) ^ 0x9E3779B9;
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        h = (h ^ (h >>> 16)) >>> 0;
        const r = (h / 4294967296 - 0.5) * 2;  // -1..1
        const i = (y * W + x) * 4;
        d[i]     = clamp255(d[i]     + r * amp);
        d[i + 1] = clamp255(d[i + 1] + r * amp * 0.95);
        d[i + 2] = clamp255(d[i + 2] + r * amp * 0.9);
      }
    }
    ctx.putImageData(cur, 0, 0);
  }

  // USM 锐化（中调 clarity 用大半径、轻量 sharpen 用小半径）
  // clarityAmt, sharpenAmt ∈ [-1, 1]
  function applyUSM(canvas, clarityAmt, sharpenAmt) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const src = ctx.getImageData(0, 0, W, H);
    const blurC = Math.abs(clarityAmt) > 0.005 ? boxBlur(src, 2) : null;  // 5x5
    const blurS = Math.abs(sharpenAmt) > 0.005 ? boxBlur(src, 0) : null;  // 1x1（接近原图，差值为边缘）
    const d = src.data;
    const bc = blurC ? blurC.data : null;
    const bs = blurS ? blurS.data : null;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], g = d[i + 1], b = d[i + 2];
      if (bc) {
        const dr = r - bc[i],     dg = g - bc[i + 1],     db = b - bc[i + 2];
        r += dr * clarityAmt * 1.4;
        g += dg * clarityAmt * 1.4;
        b += db * clarityAmt * 1.4;
      }
      if (bs) {
        const dr = r - bs[i],     dg = g - bs[i + 1],     db = b - bs[i + 2];
        r += dr * sharpenAmt * 1.8;
        g += dg * sharpenAmt * 1.8;
        b += db * sharpenAmt * 1.8;
      }
      d[i] = clamp255(r); d[i + 1] = clamp255(g); d[i + 2] = clamp255(b);
    }
    ctx.putImageData(src, 0, 0);
  }

  // 完整调色 pipeline
  function applyVintageGrade(canvas, grade) {
    if (!grade) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    const vib  = clamp(grade.vibrance    || 0, -100, 100) / 100;  // [-1, 1]
    const valM = Math.pow(2, clamp(grade.value       || 0, -100, 100) / 100);
    const brtA = clamp(grade.brightness    || 0, -100, 100) * 1.27;   // [-127, 127]
    const hiA  = clamp(grade.highlights    || 0, -100, 100) * 0.6;    // [-60, 60]
    const satA = clamp(grade.saturation   || 0, -100, 100);            // [-100, 100] for CSS %
    const conA = clamp(grade.contrast      || 0, -100, 100);            // [-100, 100] for CSS %
    const gA   = clamp(grade.grain         || 0, -100, 100);
    const cA   = clamp(grade.clarity       || 0, -100, 100);
    const sA   = clamp(grade.sharpen       || 0, -100, 100);

    const needPixelPass = Math.abs(vib) > 0.01 || Math.abs(valM - 1) > 0.005 ||
                          Math.abs(brtA) > 0.5 || Math.abs(hiA) > 0.5;
    if (needPixelPass) {
      const img = ctx.getImageData(0, 0, W, H);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        let r = d[i], g = d[i + 1], b = d[i + 2];
        // 1) 鲜明度：低饱和大色板
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        const curSat = mx === mn ? 0 : (mx - mn) / 255;
        const vibBoost = (1 - curSat) * vib * 0.85;
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const k = 1 + vibBoost;
        r = gray + (r - gray) * k;
        g = gray + (g - gray) * k;
        b = gray + (b - gray) * k;
        // 2) 明度（multiplicative）
        r *= valM; g *= valM; b *= valM;
        // 3) 亮度（additive）
        r += brtA; g += brtA; b += brtA;
        // 4) 高光：提亮高亮像素
        const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        const hiMask = Math.max(0, (lum - 0.5) * 2);  // 0..1 above 50% lum
        const hi = hiMask * hiA;
        r += hi; g += hi; b += hi;
        d[i] = r; d[i + 1] = g; d[i + 2] = b;
      }
      ctx.putImageData(img, 0, 0);
    }

    // CSS filter: contrast / saturation（用临时 canvas 套）
    if (Math.abs(conA) > 0.5 || Math.abs(satA) > 0.5) {
      const tmp = document.createElement('canvas');
      tmp.width = W; tmp.height = H;
      tmp.getContext('2d').drawImage(canvas, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const parts = [];
      if (Math.abs(satA) > 0.5) parts.push('saturate(' + (100 + satA) + '%)');
      if (Math.abs(conA) > 0.5) parts.push('contrast(' + (100 + conA) + '%)');
      ctx.filter = parts.join(' ');
      ctx.drawImage(tmp, 0, 0);
      ctx.filter = 'none';
    }

    // 锐化/清晰度（USM）
    if (Math.abs(cA) > 1 || Math.abs(sA) > 1) {
      applyUSM(canvas, cA / 100, sA / 100);
    }
    // 颗粒噪点（最顶层）
    if (Math.abs(gA) > 1) {
      addGrain(canvas, gA / 100);
    }
  }

  /* ---------- 边框度量 ---------- */

  // 各边框相对照片画面(w×h)的外扩；polaroid 底部大留白、film 左右齿孔带
  function borderMetrics(border, bw) {
    switch (border) {
      case 'thin_white': {
        const p = bw || 10;
        return { l: p, r: p, t: p, b: p, fill: '#FFFFFF', round: 0 };
      }
      case 'polaroid_white': {
        const p = bw || 14;
        const band = 100; // 拍立得底部大片留白
        return { l: p, r: p, t: p, b: p + band, fill: '#FFFFFF', round: 0 };
      }
      case 'film_border': {
        const lr = bw || 34;
        const tb = Math.max(8, Math.round(lr * 0.35));
        return { l: lr, r: lr, t: tb, b: tb, fill: '#151515', round: 0 };
      }
      case 'thick_white': {
        const p = bw || 30;
        return { l: p, r: p, t: p, b: p, fill: '#FFFFFF', round: 0 };
      }
      case 'color_frame': {
        const p = bw || 18;
        return { l: p, r: p, t: p, b: p, fill: '#F5A6B8', round: 24 };
      }
      case 'soft_white': {
        const p = bw || 18;
        return { l: p, r: p, t: p, b: p, fill: '#FFFFFF', round: 16 };
      }
      case 'rect_border': {
        // 无填充，仅描边（杂志感：内描边 + 外框虚位）
        return { l: 0, r: 0, t: 0, b: 0, fill: null, round: 0 };
      }
      default:
        return { l: 0, r: 0, t: 0, b: 0, fill: null, round: 0 }; // none
    }
  }

  // item 边框实际颜色：color_frame 用 item.borderColor || 风格派生色兜底
  function borderFillColor(item, metrics, paletteIndex) {
    if (metrics.fill == null) return null;
    if (item.borderColor) return item.borderColor;
    if (item.border === 'color_frame') {
      // 未指定时按 照片序号 从马卡龙色板循环取，保证每次观感稳定
      const PALETTE = ['#FF9E9E', '#FFC46B', '#9BD6B2', '#8FC5F0', '#C9A7EB', '#F2A6C9'];
      return PALETTE[Math.abs(paletteIndex || 0) % PALETTE.length];
    }
    return metrics.fill;
  }

  /* ---------- 背景 ---------- */

  function drawBackground(ctx, spec) {
    ctx.fillStyle = spec.bgColor;
    ctx.fillRect(0, 0, CW, CH);
    // 局部渐变（partial background cover / partial highlight）
    if (spec.bgGradient) {
      const g = spec.bgGradient;
      let grad;
      if (g.type === 'radial') {
        const cx = g.x + g.w / 2, cy = g.y + g.h / 2;
        const r = Math.max(g.w, g.h) / 2;
        grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      } else {
        // angle: 0=上→下, 90=左→右, 180=下→上（canvas 默认）
        const rad = (g.angle || 0) * Math.PI / 180;
        const dx = Math.sin(rad), dy = Math.cos(rad);
        const x0 = g.x + g.w / 2 - dx * g.w / 2;
        const y0 = g.y + g.h / 2 - dy * g.h / 2;
        const x1 = g.x + g.w / 2 + dx * g.w / 2;
        const y1 = g.y + g.h / 2 + dy * g.h / 2;
        grad = ctx.createLinearGradient(x0, y0, x1, y1);
      }
      if (g.stops && g.stops.length >= 2) {
        g.stops.forEach(function (s) { grad.addColorStop(Math.max(0, Math.min(1, s.at)), s.color); });
      } else {
        grad.addColorStop(0, g.from);
        grad.addColorStop(1, g.to);
      }
      ctx.fillStyle = grad;
      ctx.fillRect(g.x, g.y, g.w, g.h);
    }
    if (!spec.bgNoise) return;
    // 1) 草稿纸横线纹（可选，默认关）——参考纸为纯色，仅当模板显式开启才画
    if (spec.bgPaperLines) {
      ctx.save();
      ctx.strokeStyle = 'rgba(120, 95, 60, 0.16)';
      ctx.lineWidth = 1;
      const lineSpacing = 48;
      const topMargin = 80;
      for (let y = topMargin; y < CH - 60; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(40, y + 0.5);
        ctx.lineTo(CW - 40, y + 0.5);
        ctx.stroke();
      }
      // 左侧红色边距线（草稿纸标志）
      ctx.strokeStyle = 'rgba(180, 70, 60, 0.18)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(80 + 0.5, 40);
      ctx.lineTo(80 + 0.5, CH - 40);
      ctx.stroke();
      ctx.restore();
    }
    // 2) 纸面纤维噪点（细密 + 暖色调，模拟牛皮纸纤维；比草稿纸颗粒更细）
    const rng = mulberry32(20260909);
    const n = Math.floor(CW * CH / 2600);   // 更密集的细纤维
    for (let i = 0; i < n; i++) {
      const x = rng() * CW, y = rng() * CH;
      const r = 0.3 + rng() * 0.8;          // 更细的颗粒
      // 用贴近底色的暖棕色/米白，alpha 低，避免把整张纸压暗
      ctx.fillStyle = rng() > 0.5 ? 'rgba(140, 115, 78, 0.05)' : 'rgba(250, 244, 230, 0.06)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // 3) 四角做旧（可选）——轻做旧，避免重污渍；参考纸较均匀
    if (spec.bgPaperAged) {
      ctx.save();
      const corners = [
        { x: 0, y: 0 }, { x: CW, y: 0 },
        { x: 0, y: CH }, { x: CW, y: CH }
      ];
      for (const c of corners) {
        const grad = ctx.createRadialGradient(c.x, c.y, Math.min(CW, CH) * 0.18,
                                               c.x, c.y, Math.min(CW, CH) * 0.55);
        grad.addColorStop(0, 'rgba(110, 80, 35, 0.16)');
        grad.addColorStop(0.6, 'rgba(110, 80, 35, 0.05)');
        grad.addColorStop(1, 'rgba(110, 80, 35, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CW, CH);
      }
      ctx.restore();
    }
  }

  /* ---------- 卡片（米色/白色矩形内页，可选网格线/边线/阴影）---------- */
  // 用途：magazine 模板的米色网格笔记本卡、colorful 模板的白色小网格纸
  // 位置：背景之后、照片之前（最底层）
  /**
   * v3.14 实心便签（次底层）：同色系实心米棕底 + 细边 + 柔阴影。
   * 由 render() 在「背景/卡片之后、照片/贴纸之前」调用 —— 便签上的文字/清单
   * 由 under_photos 标记的那批 texts/widgets 紧随其后绘制，因此层级是：
   *   背景 < 便签底 < 便签文字/清单 < 照片/胶带/贴纸（可压住便签一部分）
   */
  function drawNoteBox(ctx, n) {
    if (!n || !n.w || !n.h) return;
    const x = n.x, y = n.y, w = n.w, h = n.h;
    const round = n.round || 0;
    ctx.save();
    ctx.globalAlpha = n.opacity != null ? n.opacity : 1;
    if (n.rotate) {
      const cx = x + w / 2, cy = y + h / 2;
      ctx.translate(cx, cy);
      ctx.rotate(deg2rad(n.rotate));
      ctx.translate(-cx, -cy);
    }
    // 柔阴影（让便签从背景上"浮"起来，符合次底层的层次）
    if (n.shadow) {
      ctx.save();
      ctx.shadowColor = 'rgba(90,60,25,0.28)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = '#000';
      if (round > 0) { roundRectPath(ctx, x, y, w, h, round); ctx.fill(); }
      else { ctx.fillRect(x, y, w, h); }
      ctx.restore();
    }
    // 实心底色
    if (n.fill) {
      ctx.fillStyle = n.fill;
      if (round > 0) { roundRectPath(ctx, x, y, w, h, round); ctx.fill(); }
      else { ctx.fillRect(x, y, w, h); }
    }
    // 描边（与底色同色系加深）
    if (n.stroke && n.strokeWidth > 0) {
      ctx.strokeStyle = n.stroke;
      ctx.lineWidth = n.strokeWidth;
      if (round > 0) { roundRectPath(ctx, x, y, w, h, round); ctx.stroke(); }
      else { ctx.strokeRect(x, y, w, h); }
    }
    ctx.restore();
  }

  function drawCardItem(ctx, c) {
    if (!c || !c.w || !c.h) return;
    const x = c.x, y = c.y, w = c.w, h = c.h;
    const round = c.round || 0;
    const noFill = c.fill === 'none';
    const fill = noFill ? null : (c.fill || '#FAF6E8');
    const lineColor = c.lineColor || '#D8D0BE';
    const lineSpacing = c.lineSpacing || 36;
    const showGrid = !!c.grid;
    const borderColor = c.borderColor || 'rgba(0,0,0,0)';
    const borderWidth = c.borderWidth || 0;
    const shadow = c.shadow !== false; // 默认带柔阴影

    ctx.save();
    if (c.rotate) {
      const cx = x + w / 2, cy = y + h / 2;
      ctx.translate(cx, cy);
      ctx.rotate(deg2rad(c.rotate));
      ctx.translate(-cx, -cy);
    }

    // 阴影
    if (shadow) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.18)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#000';
      if (round > 0) {
        roundRectPath(ctx, x, y, w, h, round);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, w, h);
      }
      ctx.restore();
    }

    // 卡片填充（fill:'none' 时透明，仅边框）
    if (!noFill) {
      ctx.fillStyle = fill;
      if (round > 0) {
        roundRectPath(ctx, x, y, w, h, round);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, w, h);
      }
    }

    // 网格线（横线 + 竖线）
    if (showGrid) {
      ctx.save();
      ctx.beginPath();
      if (round > 0) {
        roundRectPath(ctx, x, y, w, h, round);
      } else {
        ctx.rect(x, y, w, h);
      }
      ctx.clip();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 0.6;
      // 横线
      for (let yy = y + lineSpacing; yy < y + h; yy += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x + w, yy);
        ctx.stroke();
      }
      // 竖线（可选）
      if (c.gridV) {
        const colSpacing = c.colSpacing || lineSpacing * 1.6;
        for (let xx = x + colSpacing; xx < x + w; xx += colSpacing) {
          ctx.beginPath();
          ctx.moveTo(xx, y);
          ctx.lineTo(xx, y + h);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 卡片外边线
    if (borderWidth > 0 && borderColor !== 'rgba(0,0,0,0)') {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      if (round > 0) {
        roundRectPath(ctx, x, y, w, h, round);
      } else {
        ctx.strokeRect(x, y, w, h);
      }
    }
    ctx.restore();
  }

  /* ---------- v3.4 小部件：邮戳/清单/便签/长尾夹/页码/日历 ---------- */

  // 圆形邮戳：双圈 + 环形文字 + 中心行文字（参考图 vintage 右上）
  function drawPostmarkItem(ctx, wgt) {
    const r = Math.min(wgt.w, wgt.h) / 2;
    const cx = wgt.x + wgt.w / 2, cy = wgt.y + wgt.h / 2;
    const col = wgt.color || '#6B5B45';
    const data = wgt.data || {};
    ctx.save();
    if (wgt.rotate) {
      ctx.translate(cx, cy);
      ctx.rotate(deg2rad(wgt.rotate));
      ctx.translate(-cx, -cy);
    }
    ctx.globalAlpha = wgt.opacity != null ? wgt.opacity : 0.9;
    ctx.strokeStyle = col;
    ctx.fillStyle = col;

    // 外圈 + 内圈
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2); ctx.stroke();

    // 环形文字（上弧 + 下弧）
    const topText = String(data.ring_top || 'MEMORIES');
    const botText = String(data.ring_bottom || 'COLLECT MOMENTS');
    const ringR = (r + r * 0.78) / 2;
    ctx.font = '700 ' + Math.max(12, Math.round(r * 0.16)) + 'px "Segoe UI","Arial",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // 上弧：从左到右
    const topChars = topText.split('');
    const topArc = Math.min(Math.PI * 0.9, topChars.length * 0.16);
    topChars.forEach(function (ch, i) {
      const a = -Math.PI / 2 - topArc / 2 + (topArc * i) / Math.max(1, topChars.length - 1);
      ctx.save();
      ctx.translate(cx + Math.cos(a) * ringR, cy + Math.sin(a) * ringR);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
    // 下弧：从左到右（字不倒立）
    const botChars = botText.split('');
    const botArc = Math.min(Math.PI * 0.8, botChars.length * 0.14);
    botChars.forEach(function (ch, i) {
      const a = Math.PI / 2 + botArc / 2 - (botArc * i) / Math.max(1, botChars.length - 1);
      ctx.save();
      ctx.translate(cx + Math.cos(a) * ringR, cy + Math.sin(a) * ringR);
      ctx.rotate(a - Math.PI / 2);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });

    // 中心行文字（日期等）
    const lines = Array.isArray(data.center) ? data.center : (data.center ? [data.center] : []);
    if (lines.length) {
      ctx.font = Math.round(r * 0.2) + 'px "Caveat","Segoe Script","KaiTi",cursive';
      const lh = r * 0.26;
      lines.forEach(function (ln, i) {
        ctx.fillText(String(ln), cx, cy - ((lines.length - 1) * lh) / 2 + i * lh);
      });
    }
    ctx.restore();
  }

  // 勾选清单：方形勾选框 + 行文字（参考图 vintage 左下 "good food..."）
  function drawChecklistItem(ctx, wgt) {
    const list = wgt.items || [];
    if (!list.length) return;
    const size = wgt.data && wgt.data.size ? wgt.data.size : 30;
    const gap = wgt.data && wgt.data.gap ? wgt.data.gap : 54;
    const col = wgt.color || '#5A4A36';
    const boxColor = (wgt.data && wgt.data.box_color) || col;
    ctx.save();
    if (wgt.rotate) {
      ctx.translate(wgt.x, wgt.y);
      ctx.rotate(deg2rad(wgt.rotate));
      ctx.translate(-wgt.x, -wgt.y);
    }
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.font = size + 'px "Caveat","Segoe Script","Kaiti SC","KaiTi",cursive';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    list.forEach(function (row, i) {
      const ry = wgt.y + i * gap;
      const label = String(row.text != null ? row.text : row);
      const checked = row.checked !== false;
      // 勾选框
      ctx.strokeStyle = boxColor;
      const b = size * 0.9;
      ctx.strokeRect(wgt.x, ry - b / 2, b, b);
      if (checked) {
        ctx.strokeStyle = col;
        ctx.beginPath();
        ctx.moveTo(wgt.x + b * 0.18, ry);
        ctx.lineTo(wgt.x + b * 0.42, ry + b * 0.28);
        ctx.lineTo(wgt.x + b * 0.85, ry - b * 0.3);
        ctx.stroke();
      }
      // 文字
      ctx.fillStyle = col;
      ctx.fillText(label, wgt.x + b + 14, ry + 2);
    });
    ctx.restore();
  }

  // 便签条：黄色方块 + 顶部粘胶 + 手写文字（参考图 watercolor 顶部 / magazine）
  function drawStickyNoteItem(ctx, wgt) {
    if (!wgt.w || !wgt.h) return;
    const x = wgt.x, y = wgt.y, w = wgt.w, h = wgt.h;
    const fill = wgt.color || '#FFE8A3';
    const data = wgt.data || {};
    const text = wgt.text || '';
    const textColor = data.text_color || '#6B5B3A';
    const textSize = data.text_size || 30;
    const round = data.round || 0;
    ctx.save();
    if (wgt.rotate) {
      const cx = x + w / 2, cy = y + h / 2;
      ctx.translate(cx, cy);
      ctx.rotate(deg2rad(wgt.rotate));
      ctx.translate(-cx, -cy);
    }
    // 阴影
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.16)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = '#000';
    if (round > 0) { roundRectPath(ctx, x, y, w, h, round); ctx.fill(); }
    else ctx.fillRect(x, y, w, h);
    ctx.restore();
    // 主体
    ctx.fillStyle = fill;
    if (round > 0) { roundRectPath(ctx, x, y, w, h, round); ctx.fill(); }
    else ctx.fillRect(x, y, w, h);
    // 顶部粘胶带
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(x + w * 0.2, y, w * 0.6, 10);
    // 手写文字（自动换行）
    if (text) {
      ctx.fillStyle = textColor;
      ctx.font = textSize + 'px "Caveat","Segoe Script","Kaiti SC","KaiTi",cursive';
      ctx.textBaseline = 'top';
      ctx.textAlign = data.align || 'left';
      const maxW = w - 36;
      const lines = wrapText(ctx, text, maxW);
      const lh = data.line_height || Math.round(textSize * 1.4);
      const tx = (data.align === 'center') ? x + w / 2 : x + 18;
      lines.forEach(function (ln, i) {
        ctx.fillText(ln, tx, y + 26 + i * lh);
      });
    }
    ctx.restore();
  }

  // 长尾夹：金属两翼 + 夹体（参考图 magazine 顶部红色夹）
  function drawBinderClipItem(ctx, wgt) {
    const w = wgt.w || 60, h = wgt.h || 60;
    const cx = wgt.x + w / 2, cy = wgt.y + h / 2;
    const body = wgt.color || '#D9443A';
    ctx.save();
    if (wgt.rotate) {
      ctx.translate(cx, cy);
      ctx.rotate(deg2rad(wgt.rotate));
      ctx.translate(-cx, -cy);
    }
    // 金属长尾（两片向上张开的梯形）
    const metal = '#B8B8BC';
    ctx.fillStyle = metal;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.08, cy - h * 0.05);
    ctx.lineTo(cx - w * 0.4, cy - h * 0.5);
    ctx.lineTo(cx - w * 0.24, cy - h * 0.5);
    ctx.lineTo(cx - w * 0.02, cy - h * 0.12);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.08, cy - h * 0.05);
    ctx.lineTo(cx + w * 0.4, cy - h * 0.5);
    ctx.lineTo(cx + w * 0.24, cy - h * 0.5);
    ctx.lineTo(cx + w * 0.02, cy - h * 0.12);
    ctx.closePath(); ctx.fill();
    // 夹体（圆角三角/拱形）
    ctx.fillStyle = body;
    roundRectPath(ctx, cx - w * 0.22, cy - h * 0.22, w * 0.44, h * 0.44, 6);
    ctx.fill();
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    roundRectPath(ctx, cx - w * 0.14, cy - h * 0.16, w * 0.12, h * 0.28, 4);
    ctx.fill();
    ctx.restore();
  }

  // 页码小标：圆角矩形 + "2/5" 文字（参考图 magazine 右上）
  function drawPageTagItem(ctx, wgt) {
    if (!wgt.w || !wgt.h) return;
    const x = wgt.x, y = wgt.y, w = wgt.w, h = wgt.h;
    const fill = wgt.color || '#8A8A8A';
    const text = wgt.text || '';
    const round = Math.min(w, h) / 2;
    ctx.save();
    if (wgt.rotate) {
      const cx = x + w / 2, cy = y + h / 2;
      ctx.translate(cx, cy);
      ctx.rotate(deg2rad(wgt.rotate));
      ctx.translate(-cx, -cy);
    }
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = fill;
    roundRectPath(ctx, x, y, w, h, round);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    if (text) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 ' + Math.round(h * 0.42) + 'px "Segoe UI","Arial",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(text), x + w / 2, y + h / 2 + 1);
    }
    ctx.restore();
  }

  // 迷你日历：月份条 + 数字网格（参考图 dark 右上）
  function drawMiniCalendarItem(ctx, wgt) {
    if (!wgt.w || !wgt.h) return;
    const x = wgt.x, y = wgt.y, w = wgt.w, h = wgt.h;
    const data = wgt.data || {};
    const month = data.month || 'JAN';
    const day = data.day || 18;
    const headFill = wgt.color || '#3A3A3A';
    ctx.save();
    if (wgt.rotate) {
      const cx = x + w / 2, cy = y + h / 2;
      ctx.translate(cx, cy);
      ctx.rotate(deg2rad(wgt.rotate));
      ctx.translate(-cx, -cy);
    }
    // 阴影
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    // 白底
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, w, h);
    // 月份条
    ctx.fillStyle = headFill;
    ctx.fillRect(x, y, w, h * 0.3);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 ' + Math.round(h * 0.18) + 'px "Segoe UI","Arial",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(month), x + w / 2, y + h * 0.15);
    // 大日期
    ctx.fillStyle = '#333333';
    ctx.font = '700 ' + Math.round(h * 0.42) + 'px "Segoe UI","Arial",sans-serif';
    ctx.fillText(String(day), x + w / 2, y + h * 0.64);
    ctx.restore();
  }

  // 统一分发
  function drawWidget(ctx, wgt) {
    if (!wgt || !wgt.type) return;
    switch (String(wgt.type)) {
      case 'postmark':    return drawPostmarkItem(ctx, wgt);
      case 'checklist':   return drawChecklistItem(ctx, wgt);
      case 'sticky_note': return drawStickyNoteItem(ctx, wgt);
      case 'binder_clip': return drawBinderClipItem(ctx, wgt);
      case 'page_tag':    return drawPageTagItem(ctx, wgt);
      case 'mini_calendar': return drawMiniCalendarItem(ctx, wgt);
    }
  }

  /* ---------- 照片绘制 ---------- */

  function paintCover(ctx, el, x, y, w, h) {
    const iw = el.naturalWidth || el.width, ih = el.naturalHeight || el.height;
    if (!iw || !ih) return;
    const sc = Math.max(w / iw, h / ih);
    const sw = w / sc, sh = h / sc;
    const sx = (iw - sw) / 2, sy = (ih - sh) / 2;
    ctx.drawImage(el, sx, sy, sw, sh, x, y, w, h);
  }

  /* v3.7 智能匹配照片方向：保留原始横竖比，避免被强行 cover 裁切
   * - 若照片与槽位宽高比差异 > 15%，按"最小变化"原则调整槽位宽高
   * - 优先固定 H 调 W（或反之），单边缩放限制 0.4x ~ 1.7x（防极端放大霸占整页）
   * - 保持槽位中心点不变；canvas 边界兜底
   * - 横竖比相近时不调整，保持模板原貌
   * - 极端情况（如 9:16 竖照 + 4:3 横槽，超出调整范围）→ 优雅降级为原 cover 行为
   * @returns {x,y,width,height}|null 不需调整时返回 null（保持原样）
   */
  function adjustItemToPhotoAspect(item, photo) {
    if (!item || !photo || !photo.w || !photo.h) return null;
    const slotW = item.w, slotH = item.h;
    if (slotW <= 0 || slotH <= 0) return null;
    const slotRatio = slotW / slotH;
    const photoRatio = photo.w / photo.h;
    // 横竖比相近（< 15% 差异）→ 不动，避免抖动
    const relDiff = Math.abs(slotRatio - photoRatio) / Math.max(slotRatio, photoRatio);
    if (relDiff < 0.15) return null;

    const MIN_SCALE = 0.40, MAX_SCALE = 1.70;
    let newW, newH;

    // 主选：固定 H，按照片宽高比反推 W（最稳，几乎不挪位置）
    const wByH = slotH * photoRatio;
    if (wByH >= slotW * MIN_SCALE && wByH <= slotW * MAX_SCALE) {
      newW = Math.round(wByH);
      newH = slotH;
    } else {
      // 次选：固定 W，按照片宽高比反推 H
      const hByW = slotW / photoRatio;
      if (hByW >= slotH * MIN_SCALE && hByW <= slotH * MAX_SCALE) {
        newW = slotW;
        newH = Math.round(hByW);
      } else {
        // 两种都越界 → 不调整（保持原 cover 行为，避免破坏整体布局）
        return null;
      }
    }

    // canvas 边界保护
    if (newW > CW) newW = CW;
    if (newH > CH) newH = CH;
    if (newW < 80) newW = 80;
    if (newH < 80) newH = 80;

    // 保持槽位中心点不变（视觉上感觉照片"原位微调"，不漂移）
    const cx = item.x + slotW / 2;
    const cy = item.y + slotH / 2;
    let nx = Math.round(cx - newW / 2);
    let ny = Math.round(cy - newH / 2);
    if (nx < 0) nx = 0;
    if (ny < 0) ny = 0;
    if (nx + newW > CW) nx = CW - newW;
    if (ny + newH > CH) ny = CH - newH;

    return { x: nx, y: ny, width: newW, height: newH };
  }

  // 绘制单张照片 item（含边框/阴影/旋转）
  function drawPhotoItem(ctx, item, photo, paletteIndex, scale) {
    const x = item.x, y = item.y, w = item.w, h = item.h;
    if (!w || !h) return;
    const cx = x + w / 2, cy = y + h / 2;
    const m = borderMetrics(item.border, item.borderWidth);
    const frameFill = borderFillColor(item, m, paletteIndex);
    const hasPad = m.fill != null && (m.l || m.t || m.r || m.b);

    ctx.save();

    // 旋转：统一绕照片画面中心 (cx,cy)，边框随之外扩旋转
    if (item.rotate) {
      ctx.translate(cx, cy);
      ctx.rotate(deg2rad(item.rotate));
      ctx.translate(-cx, -cy);
    }

    // 外框包围盒（画面区 + 边框外扩）
    const fx = x - m.l, fy = y - m.t;
    const fw = w + m.l + m.r, fh = h + m.t + m.b;

    // —— 阴影 ——
    if (item.shadow) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.30)';
      ctx.shadowBlur = (item.border === 'none' || item.border === 'rect_border') ? 12 * scale : 18 * scale;
      ctx.shadowOffsetY = (item.border === 'none') ? 4 * scale : 7 * scale;
      if (m.round > 0) {
        ctx.fillStyle = '#000';
        roundRectPath(ctx, fx, fy, fw, fh, m.round);
        ctx.fill();
      } else if (hasPad) {
        ctx.fillStyle = '#000';
        ctx.fillRect(fx, fy, fw, fh);
      } else if (item.border === 'rect_border') {
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = Math.max(3, m.l || 3);
        ctx.strokeRect(x, y, w, h);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.fillRect(x, y, w, h);
      }
      ctx.restore();
    }

    // —— 边框本体 ——
    if (hasPad) {
      const color = frameFill || '#FFFFFF';
      if (m.round > 0) {
        roundRectPath(ctx, fx, fy, fw, fh, m.round);
        ctx.fillStyle = color;
        ctx.fill();
      } else {
        ctx.fillStyle = color;
        ctx.fillRect(fx, fy, fw, fh);
      }

      // 胶片齿孔：左右齿孔带内打双排交错齿孔 + 上下小齿孔，destination-out 露出下层画面
      if (item.border === 'film_border') {
        const holeR = clamp(m.l * 0.32, 7, 14);
        ctx.save();
        ctx.beginPath();
        ctx.rect(fx, fy, fw, fh);
        ctx.clip();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#000';
        // 左右齿孔带：双排交错
        [-1, 1].forEach(function (side) {
          const padInner = m.l * 0.5;
          const col1 = side < 0 ? fx + padInner : fx + fw - padInner;
          const col2 = side < 0 ? fx + m.l - padInner * 0.5 : fx + fw - (m.l - padInner * 0.5);
          const rangeY = fh - m.t - m.b - 14;
          const n = Math.max(4, Math.floor(rangeY / (holeR * 2.4)));
          for (let i = 0; i < n; i++) {
            const baseY = fy + m.t + 7 + (rangeY / Math.max(1, n - 1)) * i;
            // 主排孔（贴近画面）
            ctx.beginPath();
            ctx.arc(col1, baseY + (i % 2 ? holeR * 0.4 : 0), holeR, 0, Math.PI * 2);
            ctx.fill();
            // 第二排孔（更靠外）
            ctx.beginPath();
            ctx.arc(col2, baseY - (i % 2 ? holeR * 0.4 : 0), holeR * 0.85, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        // 上下小齿孔（孔位居中，4 个一组）
        const smallHoleR = holeR * 0.7;
        const nTop = Math.max(3, Math.floor(fw / 80));
        for (let i = 0; i < nTop; i++) {
          const x = fx + (fw / (nTop + 1)) * (i + 1);
          ctx.beginPath();
          ctx.arc(x, fy + m.t / 2, smallHoleR, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, fy + fh - m.b / 2, smallHoleR, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 柔和白边：在照片内缘叠一条极淡内阴影线，做出“柔和”过渡
      if (item.border === 'soft_white') {
        roundRectPath(ctx, fx + m.l - 1.5, fy + m.t - 1.5, fw - m.l - m.r + 3, fh - m.t - m.b + 3, Math.max(4, m.round - 2));
        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    // —— 杂志矩形框（无填充，双描边制造排版感）——
    if (item.border === 'rect_border') {
      const c1 = item.borderColor || '#1a1a1a';
      const gap = clamp(item.borderWidth || 12, 6, 24);
      ctx.strokeStyle = c1;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - gap, y - gap, w + gap * 2, h + gap * 2);
      ctx.globalAlpha = 1;
    }

    // —— 照片本体（cover 等比填充画面区）——
    paintCover(ctx, photo.el, x, y, w, h);

    // —— 拍立得底部手写说明（可选 caption）——
    if (item.border === 'polaroid_white' && item.caption) {
      const bottomPad = m.b;
      const capY = y + h + bottomPad / 2;
      ctx.save();
      if (item.rotate) {
        ctx.translate(cx, cy);
        ctx.rotate(deg2rad(item.rotate));
        ctx.translate(-cx, -cy);
      }
      ctx.font = '26px "Caveat","Kalam","Segoe Script","Kaiti SC","KaiTi",cursive';
      ctx.fillStyle = item.captionColor || '#6B4F3A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(item.caption).slice(0, 24), cx, capY);
      ctx.restore();
    }

    ctx.restore();
  }

  /* ---------- 贴纸 / 文字 ---------- */

  function drawStickerItem(ctx, s, img) {
    const cxp = s.x + s.w / 2, cyp = s.y + s.h / 2;
    ctx.save();
    ctx.globalAlpha = clamp(s.opacity, 0, 1);
    // 贴纸阴影：柔和落影（shadow 后再画原图，但 shadow API 会污染整个块）
    // 改用「先画一层深色偏移副本，再画原图」的策略，避免影响后续元素
    if (s.shadow) {
      ctx.save();
      ctx.translate(cxp + 4, cyp + 6);
      if (s.rotate) ctx.rotate(deg2rad(s.rotate));
      ctx.globalAlpha = clamp(s.opacity, 0, 1) * 0.22;
      ctx.filter = 'blur(3px)';
      ctx.drawImage(img, -s.w / 2, -s.h / 2, s.w, s.h);
      ctx.restore();
    }
    ctx.globalAlpha = clamp(s.opacity, 0, 1);
    ctx.filter = 'none';
    ctx.translate(cxp, cyp);
    if (s.rotate) ctx.rotate(deg2rad(s.rotate));
    ctx.drawImage(img, -s.w / 2, -s.h / 2, s.w, s.h);
    ctx.restore();
  }

  /* 抠图主体贴纸：照片经 background-removal 抠出的透明 PNG，contain 放进槽位
   * 原照片照常保留（items 里那张图仍在），这里只是它的"主体副本"贴纸
   * v7：白色 die-cut 描边 + 加重落影 —— 贴纸在任何底色上都一眼可见 */
  function drawCutoutItem(ctx, c, img) {
    if (!c || !c.w || !c.h || !img) return;
    const cxp = c.x + c.w / 2, cyp = c.y + c.h / 2;
    // contain 缩放：保持原图比例，居中放进槽位
    const iw = img.naturalWidth || img.width || 1;
    const ih = img.naturalHeight || img.height || 1;
    const scaleF = Math.min(c.w / iw, c.h / ih);
    const dw = Math.max(8, iw * scaleF);
    const dh = Math.max(8, ih * scaleF);

    // 白色贴纸剪影（die-cut 轮廓源）：主体形状染成纯白，用来沿边缘描一圈白边
    let outline = null;
    const edgeR = Math.max(9, Math.min(dw, dh) * 0.06);
    if (c.outline !== false && dw > 60 && dh > 60) {
      const oc = document.createElement('canvas');
      oc.width = Math.max(1, Math.round(dw)); oc.height = Math.max(1, Math.round(dh));
      const octx = oc.getContext('2d');
      octx.drawImage(img, 0, 0, oc.width, oc.height);
      octx.globalCompositeOperation = 'source-in';
      octx.fillStyle = '#FFFFFF';
      octx.fillRect(0, 0, oc.width, oc.height);
      outline = oc;
    }

    ctx.save();
    ctx.globalAlpha = clamp(c.opacity, 0, 1);
    // 落影：描边后的整体投影，更立体
    if (c.shadow !== false) {
      ctx.save();
      ctx.translate(cxp + 7, cyp + 12);
      if (c.rotate) ctx.rotate(deg2rad(c.rotate));
      ctx.globalAlpha = clamp(c.opacity, 0, 1) * 0.3;
      ctx.filter = 'blur(8px)';
      if (outline) {
        const sw = dw + edgeR * 2.8, sh = dh + edgeR * 2.8;
        ctx.drawImage(outline, -sw / 2, -sh / 2, sw, sh);
      } else {
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      }
      ctx.restore();
    }
    ctx.filter = 'none';
    ctx.globalAlpha = clamp(c.opacity, 0, 1);
    ctx.translate(cxp, cyp);
    if (c.rotate) ctx.rotate(deg2rad(c.rotate));
    if (outline) {
      // 白边：中心等比放大一圈 + 沿圆周 16 方向偏移剪影，拼成均匀描边
      const s = 1 + (2 * edgeR) / Math.min(dw, dh);
      ctx.drawImage(outline, -dw * s / 2, -dh * s / 2, dw * s, dh * s);
      for (let i = 0; i < 16; i++) {
        const ang = (Math.PI * 2 * i) / 16;
        ctx.drawImage(outline, -dw / 2 + Math.cos(ang) * edgeR, -dh / 2 + Math.sin(ang) * edgeR, dw, dh);
      }
    }
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }

  /* 复古贴纸库：外部透明 PNG（已离线抠好白底），整张 contain 放进槽位保持原比例。
   * 不再做 white die-cut 描边——贴纸本身自带浅色边（如白蝴蝶结、白雕塑就不该再描白边）。
   * 带柔和落影 + 轻微旋转，模拟真实贴纸贴在手帐上的立体感。 */
  function drawLibraryItem(ctx, l, img) {
    if (!l || !l.w || !l.h || !img) return;
    const cxp = l.x + l.w / 2, cyp = l.y + l.h / 2;
    const iw = img.naturalWidth || img.width || 1;
    const ih = img.naturalHeight || img.height || 1;
    const scaleF = Math.min(l.w / iw, l.h / ih);
    const dw = Math.max(8, iw * scaleF);
    const dh = Math.max(8, ih * scaleF);
    ctx.save();
    ctx.globalAlpha = clamp(l.opacity, 0, 1);
    if (l.shadow !== false) {
      ctx.save();
      ctx.translate(cxp + 5, cyp + 8);
      if (l.rotate) ctx.rotate(deg2rad(l.rotate));
      ctx.globalAlpha = clamp(l.opacity, 0, 1) * 0.24;
      ctx.filter = 'blur(5px)';
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    }
    ctx.filter = 'none';
    ctx.globalAlpha = clamp(l.opacity, 0, 1);
    ctx.translate(cxp, cyp);
    if (l.rotate) ctx.rotate(deg2rad(l.rotate));
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }

  /* ---------- 胶带（半透明彩色矩形带 + 斜纹/纯色/和纸可选样式）---------- */

  // v3.13 各预设模板的自动胶带配色（按照片顺序循环取用）
  const AUTO_TAPE_COLORS = {
    vintage:    ['newsprint_dark', 'newsprint', 'newsprint_light'],
    minimal:    ['washi_mint', 'washi_beige'],
    colorful:   ['washi_pink', 'washi_blue', 'washi_yellow'],
    dark:       ['washi_gray', 'washi_brown'],
    watercolor: ['washi_mint', 'washi_blue'],
    magazine:   ['washi_gray', 'washi_beige']
  };

  /**
   * v3.13 自动照片胶带：给**每一张照片**的顶边贴一条胶带。
   *  - 胶带中心压在外框顶边线上 → 垂直方向天然 50% 压相框 / 50% 垂到背景；
   *  - 胶带角度跟随该照片自身旋转角（±3° 抖动），像"顺手贴上去的"；
   *  - 坐标全部用照片**定稿后**的外框计算，所以照片被宽高比扩缩 / 挪位后胶带依然贴得准。
   */
  function buildAutoPhotoTapes(layout, frames, loaded) {
    const colors = AUTO_TAPE_COLORS[layout.style] || ['washi_beige', 'transparent'];
    // v3.20 多彩活泼：候选池里是**真实和纸胶带图**（layout.tapeFiles）。
    // 有池就按池里的实际宽高比定高（不然一条 4:1 的长胶带会被压成 30px 高、扁得看不出来）；
    // 起点随机 → 同一套主题每次生成的胶带搭配都不同。没有池就退回原来的程序化色块。
    const pool = Array.isArray(layout.tapeFiles) ? layout.tapeFiles : [];
    let cursor = pool.length ? Math.floor(Math.random() * pool.length) : 0;
    const tapes = [];
    frames.forEach(function (f, i) {
      if (f.photoIndex < 0) return;                       // 空槽位不贴
      if (loaded && !loaded[f.photoIndex]) return;        // 该槽位没照片 → 不贴
      const fw = f.r - f.l, fh = f.b - f.t;
      if (fw < 80 || fh < 80) return;                     // 太小的照片不贴
      let w, h;
      let meta = null;
      if (pool.length) {
        meta = pool[cursor % pool.length]; cursor++;
        w = Math.round(Math.max(150, Math.min(320, fw * 0.46)));
        const aspect = (meta.w > 0 && meta.h > 0) ? (meta.w / meta.h) : 3.6;
        h = Math.round(Math.max(24, Math.min(104, w / aspect)));
      } else {
        w = Math.round(Math.max(130, Math.min(230, fw * 0.34)));
        h = 30;
      }
      // 横向中心落在照片跨度内（留出胶带半宽），避免胶带整个悬在照片外
      const frac = 0.22 + Math.random() * 0.4;            // 0.22 ~ 0.62
      let cx = f.l + fw * frac;
      cx = Math.max(f.l + w / 2 + 8, Math.min(cx, f.r - w / 2 - 8));
      tapes.push({
        x: Math.round(cx - w / 2),
        y: Math.round(f.t - h / 2),                        // 顶边线正中 → 50/50
        w: w,
        h: h,
        rotate: Math.round(Math.max(-14, Math.min(14, (f.rotate || 0) + (Math.random() * 6 - 3))) * 10) / 10,
        color: colors[i % colors.length],
        file: meta ? meta.f : null,
        opacity: meta ? 0.96 : 0.88
      });
    });
    return tapes;
  }

  /**
   * v3.12 胶带吸附照片外边缘：把胶带中心线压到照片"相框外沿"上，
   * 让它**一半贴在相框上、一半垂到背景上**（手帐贴照片的经典样式）。
   *
   * 为什么放在渲染器里而不是模板里：照片会被 adjustItemToPhotoAspect()
   * 按照片真实横竖比二次扩缩（位置/宽度都会变），模板里写死的胶带坐标
   * 就会错开边线。这里在照片定稿之后统一校正，AI 排版来的 tapes 也一并受益。
   *
   * v3.13 扩展：预设模板走"自动胶带"分支 —— 每张照片各贴一条（见 buildAutoPhotoTapes），
   *            AI / 自定义排版仍走下面的"就近吸附"分支。
   */
  function snapTapesToPhotoEdge(layout, loaded) {
    if (window.__DIARY_NO_TAPE_SNAP) return; // 调试开关：置 true 可对比吸附前效果
    if (!layout || !Array.isArray(layout.items) || !layout.items.length) return;

    // 1) 算出每张照片的"外框"（照片矩形 + 卡片边框外扩）
    const frames = [];
    layout.items.forEach(function (it) {
      if (!it) return;
      const w = (it.w != null ? it.w : it.width) || 0;
      const h = (it.h != null ? it.h : it.height) || 0;
      if (w <= 0 || h <= 0) return;
      const m = borderMetrics(it.border, it.borderWidth);
      frames.push({
        l: it.x - m.l, t: it.y - m.t,
        r: it.x + w + m.r, b: it.y + h + m.b,
        photoIndex: (it.photoIndex != null ? it.photoIndex : -1),
        rotate: it.rotate || 0
      });
    });
    if (!frames.length) return;

    // A) 预设模板：每张照片顶边各贴一条胶带（位置已精确算好，无需再吸附）
    if (layout.tapesAuto) {
      const auto = buildAutoPhotoTapes(layout, frames, loaded);
      // v3.20 多彩活泼：前端预置的「飘落胶带」是带 file 的真实胶带图，不能被顶掉 → 合并保留
      const pre = (Array.isArray(layout.tapes) ? layout.tapes : [])
        .filter(function (t) { return t && t.file; });
      layout.tapes = pre.concat(auto);
      return;
    }

    // B) 模板 / AI 自带胶带：就近吸附到最近的照片外沿
    if (!Array.isArray(layout.tapes) || !layout.tapes.length) return;
    const SNAP = 64;      // 垂距 ≤64px 才吸附（避免动到纯装饰、不贴照片的胶带）
    const EDGE_PAD = 18;  // 胶带中心需落在这条边线的跨度内（±pad），否则不算"贴这条边"

    layout.tapes.forEach(function (t) {
      if (!t || !t.w || !t.h) return;
      const cx = t.x + t.w / 2, cy = t.y + t.h / 2;
      let best = null;
      const consider = function (axis, pos, dist) {
        if (dist <= SNAP && (!best || dist < best.d)) best = { d: dist, axis: axis, pos: pos };
      };
      frames.forEach(function (f) {
        // 横向落在这张照片跨度内 → 上/下边可吸附
        if (cx >= f.l - EDGE_PAD && cx <= f.r + EDGE_PAD) {
          consider('y', f.t, Math.abs(cy - f.t));
          consider('y', f.b, Math.abs(cy - f.b));
        }
        // 纵向落在这张照片跨度内 → 左/右边可吸附
        if (cy >= f.t - EDGE_PAD && cy <= f.b + EDGE_PAD) {
          consider('x', f.l, Math.abs(cx - f.l));
          consider('x', f.r, Math.abs(cx - f.r));
        }
      });
      if (!best) return;
      // 2) 把胶带中心挪到外沿线上 → 垂直方向自然一半在内、一半在外
      if (best.axis === 'y') t.y = Math.round(best.pos - t.h / 2);
      else t.x = Math.round(best.pos - t.w / 2);
    });
  }

  // 内置 6 款胶带配色（hex + 是否条纹）
  const TAPE_PRESETS = {
    'washi_pink':    { main: '#F8B8C8', stripe: '#F5A6B8', pattern: 'stripe' },
    'washi_blue':    { main: '#B5D9FF', stripe: '#A8C8E8', pattern: 'stripe' },
    'washi_yellow':  { main: '#FFE08A', stripe: '#FFD45F', pattern: 'stripe' },
    'washi_mint':    { main: '#B8E8C8', stripe: '#A0D8B0', pattern: 'stripe' },
    'washi_purple':  { main: '#D4B8E8', stripe: '#C5A5DC', pattern: 'stripe' },
    'washi_beige':   { main: '#EBDDC2', stripe: '#DECBA6', pattern: 'stripe' },
    'washi_brown':   { main: '#C8A97E', stripe: '#B89768', pattern: 'stripe' },
    'washi_orange':  { main: '#FFC98A', stripe: '#F5B56A', pattern: 'stripe' },
    'washi_gray':    { main: '#C5C8CC', stripe: '#B2B6BC', pattern: 'stripe' },
    'transparent':   { main: '#F0E8D0', stripe: null, pattern: 'plain' },
    'stripe':        { main: '#F8B8C8', stripe: '#F5A6B8', pattern: 'stripe' },
    'polka':         { main: '#FFE8F0', stripe: '#D64870', pattern: 'polka' },
    // 旧报纸做旧色调（复古胶片用，低饱和灰米，模拟旧纸胶带）
    'newsprint':        { main: '#BEB39A', stripe: '#AFA48A', pattern: 'stripe' },
    'newsprint_light':  { main: '#CBC1A9', stripe: '#BFB394', pattern: 'stripe' },
    'newsprint_dark':   { main: '#A79B80', stripe: '#978A6E', pattern: 'stripe' }
  };

  /**
   * v3.20 真实和纸胶带：t.file 命中已预载的贴纸库图片时走图片分支。
   * 胶带图是「已抠好的透明 PNG」，按块位等比 contain（不拉伸变形），
   * 下压一层淡淡的投影 → 像真的撕下来贴在相纸上。
   */
  function drawTapeImage(ctx, t, img) {
    if (!img) return;
    const iw = img.naturalWidth || img.width || 1;
    const ih = img.naturalHeight || img.height || 1;
    const s = Math.min(t.w / iw, t.h / ih);
    const dw = Math.max(6, iw * s), dh = Math.max(4, ih * s);
    const cxp = t.x + t.w / 2, cyp = t.y + t.h / 2;
    ctx.save();
    ctx.translate(cxp, cyp);
    if (t.rotate) ctx.rotate(deg2rad(t.rotate));
    ctx.globalAlpha = clamp(t.opacity != null ? t.opacity : 0.96, 0, 1);
    // 轻微投影（胶带纸有厚度）
    ctx.save();
    ctx.globalAlpha *= 0.22;
    ctx.filter = 'blur(3px)';
    ctx.fillStyle = '#000';
    ctx.translate(1, 2);
    ctx.beginPath();
    ctx.rect(-dw / 2, -dh / 2, dw, dh);
    ctx.fill();
    ctx.restore();
    ctx.filter = 'none';
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }

  function drawTapeItem(ctx, t, imgs) {
    if (!t || !t.w || !t.h) return;
    // v3.20 真实胶带优先：命中图片就直接画，不再走程序化色块
    if (t.file && imgs && imgs[t.file]) { drawTapeImage(ctx, t, imgs[t.file]); return; }
    const cxp = t.x + t.w / 2, cyp = t.y + t.h / 2;
    const preset = TAPE_PRESETS[t.color] || TAPE_PRESETS['washi_pink'];
    ctx.save();
    ctx.translate(cxp, cyp);
    if (t.rotate) ctx.rotate(deg2rad(t.rotate));
    ctx.globalAlpha = clamp(t.opacity != null ? t.opacity : 0.82, 0, 1);

    const w = t.w, h = t.h;
    // 不规则边：上下边各加 ±2px 抖动（手撕感）
    const jag = 2;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + (Math.random() - 0.5) * jag, -h / 2);
    ctx.lineTo(w / 2 + (Math.random() - 0.5) * jag, -h / 2);
    ctx.lineTo(w / 2 + (Math.random() - 0.5) * jag, h / 2);
    ctx.lineTo(-w / 2 + (Math.random() - 0.5) * jag, h / 2);
    ctx.closePath();
    ctx.fillStyle = preset.main;
    ctx.fill();

    // 斜纹/波点装饰
    if (preset.pattern === 'stripe' && preset.stripe) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(-w / 2, -h / 2, w, h);
      ctx.clip();
      ctx.strokeStyle = preset.stripe;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha *= 0.55;
      for (let i = -h; i < w; i += 8) {
        ctx.beginPath();
        ctx.moveTo(-w / 2 + i, -h / 2);
        ctx.lineTo(-w / 2 + i + h, h / 2);
        ctx.stroke();
      }
      ctx.restore();
    } else if (preset.pattern === 'polka' && preset.stripe) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(-w / 2, -h / 2, w, h);
      ctx.clip();
      ctx.fillStyle = preset.stripe;
      ctx.globalAlpha *= 0.6;
      for (let dx = 0; dx < w; dx += 10) {
        for (let dy = 0; dy < h; dy += 10) {
          ctx.beginPath();
          ctx.arc(-w / 2 + dx + 4, -h / 2 + dy + 4, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // 半透感：上下各加 4px 渐变（让胶带"贴"在画面上）
    ctx.globalAlpha *= 0.4;
    const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    grad.addColorStop(0, 'rgba(255,255,255,0.4)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = grad;
    ctx.fillRect(-w / 2, -h / 2, w, h);

    ctx.restore();
  }

  /* ---------- 图钉（圆形金属 + 高光 + 阴影）---------- */

  const PIN_COLORS = {
    red:    { base: '#E74C3C', hi: '#FF8A7A' },
    blue:   { base: '#3B7DD8', hi: '#7AA8E8' },
    yellow: { base: '#F5C518', hi: '#FFE066' },
    black:  { base: '#222222', hi: '#666666' },
    white:  { base: '#E8E8E8', hi: '#FFFFFF' },
    green:  { base: '#16A085', hi: '#5DD2B8' }
  };

  function drawPinItem(ctx, p) {
    if (!p || !p.size) return;
    const cxp = p.x + p.size / 2, cyp = p.y + p.size / 2;
    const col = PIN_COLORS[p.color] || PIN_COLORS.red;
    const r = p.size / 2;
    ctx.save();

    // 阴影（先画深色副本 + 偏移）
    ctx.save();
    ctx.translate(cxp + 2, cyp + 4);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 钉身（金属感：径向渐变）
    const grad = ctx.createRadialGradient(cxp - r * 0.3, cyp - r * 0.3, r * 0.2, cxp, cyp, r);
    grad.addColorStop(0, col.hi);
    grad.addColorStop(0.6, col.base);
    grad.addColorStop(1, col.base);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cxp, cyp, r, 0, Math.PI * 2);
    ctx.fill();

    // 高光（小白点）
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(cxp - r * 0.35, cyp - r * 0.4, r * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // 边缘深色描边
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cxp, cyp, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  /* ---------- 涂鸦（手绘路径：arrow/underline/circle/heart/star/swirl/scribble/check）---------- */

  function drawDoodleItem(ctx, d) {
    if (!d || !d.w || !d.h) return;
    const cxp = d.x + d.w / 2, cyp = d.y + d.h / 2;
    const color = d.color || '#444444';
    ctx.save();
    ctx.translate(cxp, cyp);
    if (d.rotate) ctx.rotate(deg2rad(d.rotate));
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(2, Math.min(d.w, d.h) * 0.06);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // v3.18：允许 doodle 自带 opacity（0~1）做半透明点缀；不传时保持旧的 0.85
    ctx.globalAlpha = d.opacity != null ? clamp(0.85 * num(d.opacity, 1), 0, 1) : 0.85;

    const W = d.w, H = d.h;
    switch (String(d.kind)) {
      case 'arrow': {
        // 简笔箭头：直线 + 三角箭头
        ctx.beginPath();
        ctx.moveTo(-W * 0.45, H * 0.1);
        ctx.lineTo(W * 0.35, -H * 0.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(W * 0.35, -H * 0.1);
        ctx.lineTo(W * 0.15, -H * 0.35);
        ctx.lineTo(W * 0.45, -H * 0.1);
        ctx.lineTo(W * 0.15, H * 0.15);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'underline': {
        // 手绘下划线（带轻微抖动）
        ctx.beginPath();
        ctx.moveTo(-W * 0.5, H * 0.1);
        for (let i = 0; i <= 12; i++) {
          const x = -W * 0.5 + (W * i) / 12;
          const y = Math.sin(i * 0.6) * H * 0.05 + H * 0.1;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        break;
      }
      case 'circle': {
        // 手绘圈（不闭合 + 起笔收笔错开）
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(W, H) * 0.42, 0, Math.PI * 1.92);
        ctx.stroke();
        break;
      }
      case 'heart': {
        const s = Math.min(W, H) * 0.45;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.7);
        ctx.bezierCurveTo(s * 1.2, s * 0.2, s * 0.6, -s * 0.6, 0, -s * 0.1);
        ctx.bezierCurveTo(-s * 0.6, -s * 0.6, -s * 1.2, s * 0.2, 0, s * 0.7);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'star': {
        const R = Math.min(W, H) * 0.45, r = R * 0.4;
        const pts = [];
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (Math.PI * i) / 5;
          const rr = i % 2 ? r : R;
          pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
        }
        ctx.beginPath();
        if (d.rounded) {
          // v3.19 圆角星（参考图那种「软糯星星」）：顶点用二次贝塞尔倒角。
          // 关键：**外尖倒角大、内凹角倒角极小** —— 内角也倒圆的话五角轮廓会糊成一朵云。
          const rOut = Math.min(W, H) * (num(d.round, 0) || 0.075);
          const rIn = Math.min(W, H) * (num(d.roundInner, 0) || 0.018);
          for (let i = 0; i < 10; i++) {
            const prev = pts[(i + 9) % 10], cur = pts[i], next = pts[(i + 1) % 10];
            const v1x = prev[0] - cur[0], v1y = prev[1] - cur[1];
            const v2x = next[0] - cur[0], v2y = next[1] - cur[1];
            const l1 = Math.sqrt(v1x * v1x + v1y * v1y) || 1;
            const l2 = Math.sqrt(v2x * v2x + v2y * v2y) || 1;
            const rad = (i % 2 === 0) ? rOut : rIn;      // i 偶数 = 外尖，奇数 = 内凹角
            const d1 = Math.min(rad, l1 * 0.46), d2 = Math.min(rad, l2 * 0.46);
            const ax = cur[0] + (v1x / l1) * d1, ay = cur[1] + (v1y / l1) * d1;
            const bx = cur[0] + (v2x / l2) * d2, by = cur[1] + (v2y / l2) * d2;
            if (i === 0) ctx.moveTo(ax, ay); else ctx.lineTo(ax, ay);
            ctx.quadraticCurveTo(cur[0], cur[1], bx, by);
          }
        } else {
          for (let i = 0; i < 10; i++) {
            if (i) ctx.lineTo(pts[i][0], pts[i][1]); else ctx.moveTo(pts[i][0], pts[i][1]);
          }
        }
        ctx.closePath();
        // v3.19 柔光晕（参考图星星边缘那圈晕开的光）
        const hadGlow = num(d.glow, 0) > 0;
        if (hadGlow) { ctx.shadowColor = color; ctx.shadowBlur = num(d.glow, 0); }
        // v3.18 空心星：只描边（简约清新的空心星星）；实心星保持旧行为
        if (d.hollow) {
          ctx.lineWidth = d.stroke > 0 ? d.stroke : Math.max(2, Math.min(W, H) * 0.10);
          ctx.stroke();
          if (hadGlow) { ctx.shadowBlur = 0; ctx.stroke(); }   // 关闭阴影再描一遍 → 笔触实、外圈柔
        } else if (d.fill && d.fill !== 'none') {
          ctx.fillStyle = d.fill;
          ctx.fill();
        } else {
          ctx.fill();
        }
        if (hadGlow) ctx.shadowBlur = 0;
        break;
      }
      case 'swirl': {
        // 螺旋：3 圈向外扩展
        ctx.beginPath();
        const turns = 3;
        for (let t = 0; t <= 80; t++) {
          const a = (t / 80) * Math.PI * 2 * turns;
          const rr = (t / 80) * Math.min(W, H) * 0.4;
          const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
          t ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
        break;
      }
      case 'scribble': {
        // 乱涂（z 字抖动）
        ctx.beginPath();
        ctx.moveTo(-W * 0.45, -H * 0.35);
        for (let i = 0; i < 8; i++) {
          const x = -W * 0.45 + (W * i) / 7;
          const y = (i % 2 ? H : -H) * 0.35;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        break;
      }
      case 'check': {
        ctx.beginPath();
        ctx.moveTo(-W * 0.4, 0);
        ctx.lineTo(-W * 0.1, H * 0.35);
        ctx.lineTo(W * 0.4, -H * 0.35);
        ctx.stroke();
        break;
      }
      case 'branch': {
        // 植物枝条：弯曲主干 + 两侧对生叶片（参考图 vintage 的干枝装饰）
        const len = W, segs = 7;
        ctx.beginPath();
        ctx.moveTo(-len * 0.5, 0);
        for (let i = 1; i <= segs; i++) {
          const t = i / segs;
          const px = -len * 0.5 + len * t;
          const py = Math.sin(t * Math.PI * 1.2) * H * 0.18;
          ctx.lineTo(px, py);
        }
        ctx.stroke();
        // 叶片
        const leaf = Math.min(W, H) * 0.16;
        for (let i = 1; i <= segs - 1; i++) {
          const t = i / segs;
          const px = -len * 0.5 + len * t;
          const py = Math.sin(t * Math.PI * 1.2) * H * 0.18;
          const side = i % 2 ? 1 : -1;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.quadraticCurveTo(px + leaf * 0.7, py - side * leaf * 0.9, px + leaf * 1.1, py - side * leaf * 0.4);
          ctx.quadraticCurveTo(px + leaf * 0.5, py - side * leaf * 0.15, px, py);
          ctx.fillStyle = d.fill || d.color;
          ctx.fill();
        }
        break;
      }
      case 'sparkle': {
        // 四角闪光（白/金）：4 尖光芒 + 中心高光 + 外圈光晕（参考图 watercolor）
        const s = Math.min(W, H) * 0.5;
        const col = d.fill || d.color || '#FFFFFF';
        // 光晕（透明度取 d.opacity 的 40% 封顶，保持柔和）
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 2.1);
        g.addColorStop(0, col);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = Math.min(d.opacity, 1) * 0.4;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, s * 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = Math.min(d.opacity, 1);
        // 4 尖主体
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(s * 0.12, -s * 0.12, s, 0);
        ctx.quadraticCurveTo(s * 0.12, s * 0.12, 0, s);
        ctx.quadraticCurveTo(-s * 0.12, s * 0.12, -s, 0);
        ctx.quadraticCurveTo(-s * 0.12, -s * 0.12, 0, -s);
        ctx.closePath();
        ctx.fill();
        // 中心高光
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'hashtag': {
        // 手绘 # 标签（参考图 dark）
        const s = Math.min(W, H) * 0.4;
        ctx.beginPath();
        ctx.moveTo(-s * 0.7, -s * 0.4); ctx.lineTo(s * 0.7, -s * 0.5);
        ctx.moveTo(-s * 0.6, s * 0.0);  ctx.lineTo(s * 0.8, s * 0.1);
        ctx.moveTo(-s * 0.35, -s * 0.7); ctx.lineTo(-s * 0.2, s * 0.8);
        ctx.moveTo(s * 0.15, -s * 0.7);  ctx.lineTo(s * 0.3, s * 0.8);
        ctx.stroke();
        break;
      }
      case 'rect': {
        // 手绘矩形框（参考图 vintage 相框 / magazine 橙色标题框）；fill 可选
        const lw = d.stroke || Math.max(2, Math.min(W, H) * 0.04);
        ctx.lineWidth = lw;
        if (d.fill) {
          ctx.fillStyle = d.fill;
          ctx.fillRect(-W / 2, -H / 2, W, H);
        }
        ctx.strokeRect(-W / 2, -H / 2, W, H);
        break;
      }
      case 'ellipse': {
        // 手绘椭圆点缀（参考图 minimal 米色椭圆）
        ctx.beginPath();
        ctx.ellipse(0, 0, W * 0.5, H * 0.5, 0, 0, Math.PI * 2);
        if (d.fill) { ctx.fillStyle = d.fill; ctx.fill(); }
        else ctx.stroke();
        break;
      }
    }
    ctx.restore();
  }

  // v3.23 换行：含空格的文本（英文）优先按「整词」断行，避免单词被拦腰截断；
  // 纯中文/无空格文本维持逐字测量；单词本身比一行还宽时才逐字硬拆。
  function wrapText(ctx, text, maxWidth) {
    const out = [];
    const wrapChars = (s) => {
      let cur = '';
      for (const ch of s) {
        const test = cur + ch;
        if (cur !== '' && ctx.measureText(test).width > maxWidth) { out.push(cur); cur = ch; }
        else cur = test;
      }
      if (cur !== '') out.push(cur);
    };
    String(text == null ? '' : text).split('\n').forEach(para => {
      if (para === '') { out.push(''); return; }
      if (para.indexOf(' ') === -1) { wrapChars(para); return; }
      let cur = '';
      para.split(' ').forEach((word, idx) => {
        if (idx === 0) {
          if (ctx.measureText(word).width > maxWidth) { wrapChars(word); cur = ''; }
          else cur = word;
          return;
        }
        if (ctx.measureText(word).width > maxWidth) {   // 单词本身超宽 → 硬拆
          if (cur) { out.push(cur); cur = ''; }
          wrapChars(word);
          return;
        }
        const test = cur ? cur + ' ' + word : word;
        if (cur && ctx.measureText(test).width > maxWidth) { out.push(cur); cur = word; }
        else cur = test;
      });
      if (cur !== '') out.push(cur);
    });
    return out;
  }

  function drawTextItem(ctx, t, _scale) {
    const content = String(t.content || '');
    if (!content) return;
    const size = clamp(t.size, 10, 200);
    const family = FONT_STACK[t.font] || FONT_STACK.hand;
    const maxW = Math.max(40, t.width > 0 ? t.width : (CW - t.x - 48));
    const lh = t.lineHeight > 0 ? t.lineHeight : Math.round(size * 1.5);
    const doStroke = t.stroke > 0 && t.strokeWidth > 0;

    ctx.save();
    if (t.rotate) {
      ctx.translate(t.x, t.y);
      ctx.rotate(deg2rad(t.rotate));
      ctx.translate(-t.x, -t.y);
    }

    ctx.font = (t.bold ? 'bold ' : '') + size + 'px ' + family;
    ctx.textBaseline = 'alphabetic';
    if (doStroke) {
      ctx.strokeStyle = t.strokeColor;
      ctx.lineWidth = t.strokeWidth;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
    }
    ctx.fillStyle = t.color;
    const lines = wrapText(ctx, content, maxW);

    ctx.textAlign = t.align === 'center' ? 'center' : (t.align === 'right' ? 'right' : 'left');
    let baseX;
    if (t.align === 'center') baseX = t.x + maxW / 2;
    else if (t.align === 'right') baseX = t.x + maxW;
    else baseX = t.x;

    // y 为文本块顶部，首行基线 ≈ 顶部 + 0.86×字号
    let baseline = t.y + size * 0.86;
    for (let i = 0; i < lines.length; i++) {
      if (doStroke) ctx.strokeText(lines[i], baseX, baseline);
      ctx.fillText(lines[i], baseX, baseline);
      baseline += lh;
    }
    ctx.restore();
  }

  /* ---------- 排版 JSON 兜底（DeepSeek 输出不可控，必须强制安全化） ---------- */

  // 颜色合法性（#RGB / #RRGGBB）
  function isValidHex(c) {
    if (typeof c !== 'string') return false;
    const s = c.trim().replace(/^#/, '');
    return /^[0-9a-fA-F]{3}$/.test(s) || /^[0-9a-fA-F]{6}$/.test(s);
  }

  /**
   * sanitizeLayout(spec, photoCount)
   *  - 数值 clamp 到画布内（贴纸/图片强制不溢出）
   *  - 宽高非法/为 0 的丢弃
   *  - photo_index 强制覆盖 0..photoCount-1，溢出丢弃，重复强制重排
   *  - 颜色非法回退到默认值
   *  - 字号、sticker id 合法性校验
   *  - 返回 { layout, fixes:[] } 记录修正点供上层 toast
   */
  function sanitizeLayout(spec, photoCount) {
    photoCount = Math.max(0, num(photoCount, 0));
    const fixes = [];
    const add = function (msg) { fixes.push(msg); };

    // 1. 背景色非法
    if (spec.bg_color && !isValidHex(spec.bg_color)) {
      add('bg_color 非法「' + spec.bg_color + '」已回退 #FFFFFF');
      spec.bg_color = '#FFFFFF';
    }

    // 1a. cards 校验 + clamp（米色/白色内页矩形，magazine 笔记本卡/水彩网格纸）
    if (Array.isArray(spec.cards)) {
      spec.cards = spec.cards.filter(function (c) {
        if (!c || typeof c !== 'object') return false;
        let w = num(c.w != null ? c.w : c.width, 800);
        let h = num(c.h != null ? c.h : c.height, 1100);
        if (w <= 0 || h <= 0) return false;
        let x = num(c.x, 0), y = num(c.y, 0);
        if (x + w > CW + 20) x = CW - w;
        if (y + h > CH + 20) y = CH - h;
        if (x < -20) x = -20;
        if (y < -20) y = -20;
        c.x = Math.round(x); c.y = Math.round(y);
        c.width = Math.round(w); c.height = Math.round(h);
        if (c.w != null) { c.w = c.width; delete c.w; }
        if (c.h != null) { c.h = c.height; delete c.h; }
        if (c.fill && c.fill !== 'none' && !isValidHex(c.fill)) { c.fill = '#FAF6E8'; }
        return true;
      });
    }

    // 1b. note 校验 + clamp（v3.14 实心便签，次底层；非法则丢弃）
    if (spec.note != null) {
      const n = spec.note;
      let w = num(n && (n.w != null ? n.w : n.width), 0);
      let h = num(n && (n.h != null ? n.h : n.height), 0);
      if (!n || typeof n !== 'object' || w <= 0 || h <= 0) {
        add('note 宽高非法，已丢弃');
        delete spec.note;
      } else {
        let x = num(n.x, 0), y = num(n.y, 0);
        if (x + w > CW + 20) x = CW - w;
        if (y + h > CH + 20) y = CH - h;
        if (x < -20) x = -20;
        if (y < -20) y = -20;
        n.x = Math.round(x); n.y = Math.round(y);
        n.width = Math.round(w); n.height = Math.round(h);
        if (n.w != null) { n.w = n.width; delete n.w; }
        if (n.h != null) { n.h = n.height; delete n.h; }
        if (n.fill && n.fill !== 'none' && !isValidHex(n.fill)) { add('note.fill 非法，已回退 #E3D0B2'); n.fill = '#E3D0B2'; }
        if (n.stroke && !isValidHex(n.stroke)) { n.stroke = '#8B5A2B'; }
      }
    }

    // 2. items 校验 + photo_index 覆盖 + clamp
    if (Array.isArray(spec.items)) {
      const usedIdx = new Set();
      spec.items = spec.items.filter(function (it) {
        if (!it || typeof it !== 'object') { add('丢弃空 item'); return false; }
        let w = num(it.w != null ? it.w : it.width, 0);
        let h = num(it.h != null ? it.h : it.height, 0);
        if (w <= 0 || h <= 0) { add('item 宽高非法，已丢弃'); return false; }
        if (w < 40) w = 40;
        if (h < 40) h = 40;
        // 边框外扩余量给一点：rect_border 0，polaroid 底部 100，film 左右 34
        const bw = it.border_width != null ? num(it.border_width, 12) : 12;
        const outerMax = (it.border === 'film_border') ? 40 : 14;
        const polaroidMax = (it.border === 'polaroid_white') ? 110 : outerMax;
        let x = num(it.x, 0), y = num(it.y, 0);
        const maxX = CW - w - polaroidMax;
        const maxY = CH - h - outerMax;
        if (x < -outerMax) { add('item.x<0 已 clamp'); x = -outerMax; }
        if (y < -outerMax) { add('item.y<0 已 clamp'); y = -outerMax; }
        if (x > maxX) { add('item.x 越界 ' + Math.round(x) + '→' + Math.round(maxX)); x = maxX; }
        if (y > maxY) { add('item.y 越界 ' + Math.round(y) + '→' + Math.round(maxY)); y = maxY; }
        // 强制 width/height 整数
        it.x = Math.round(x); it.y = Math.round(y);
        it.width = Math.round(w); it.height = Math.round(h);
        if (it.w != null) { it.w = it.width; delete it.w; }
        if (it.h != null) { it.h = it.height; delete it.h; }

        // photo_index 强制覆盖 0..photoCount-1
        let pi = num(it.photo_index, num(it.photo, -1));
        if (pi < 0 || pi >= photoCount) {
          // 自动选未用的最近下标
          let cand = 0;
          while (usedIdx.has(cand) && cand < photoCount) cand++;
          if (cand >= photoCount) { add('item 找不到可用 photo_index，已丢弃'); return false; }
          add('item.photo_index ' + pi + ' 越界，已重排到 ' + cand);
          pi = cand;
        }
        if (usedIdx.has(pi)) {
          let cand = 0;
          while (usedIdx.has(cand) && cand < photoCount) cand++;
          if (cand >= photoCount) { add('item.photo_index 重复 ' + pi + '，已丢弃'); return false; }
          add('item.photo_index 重复 ' + pi + '，已重排到 ' + cand);
          pi = cand;
        }
        usedIdx.add(pi);
        it.photo_index = pi;
        if (it.photo != null) delete it.photo;

        // border 非法兜底
        if (it.border != null && !BORDER_ALIAS[String(it.border)]) {
          add('item.border 非法「' + it.border + '」已回退 none');
          it.border = 'none';
        }
        return true;
      });
    }

    // 3. stickers 校验 + clamp
    if (Array.isArray(spec.decor_stickers)) {
      spec.decor_stickers = spec.decor_stickers.filter(function (s) {
        if (!s || typeof s !== 'object') return false;
        if (s.id == null || s.id === '') { add('sticker 缺 id，已丢弃'); return false; }
        let w = num(s.w != null ? s.w : (s.width != null ? s.width : s.size), 80);
        let h = num(s.h != null ? s.h : (s.height != null ? s.height : s.size), w);
        if (w <= 0 || h <= 0) return false;
        let x = num(s.x, 0), y = num(s.y, 0);
        if (x + w > CW) { add('sticker 越界右 已 clamp x'); x = CW - w; }
        if (y + h > CH) { add('sticker 越界下 已 clamp y'); y = CH - h; }
        if (x < 0) { add('sticker 越界左 已 clamp x=0'); x = 0; }
        if (y < 0) { add('sticker 越界上 已 clamp y=0'); y = 0; }
        s.x = Math.round(x); s.y = Math.round(y);
        s.width = Math.round(w); s.height = Math.round(h);
        if (s.w != null) delete s.w;
        if (s.h != null) delete s.h;
        return true;
      });
    }

    // 3a. tapes 校验 + clamp
    if (Array.isArray(spec.tapes)) {
      spec.tapes = spec.tapes.filter(function (t) {
        if (!t || typeof t !== 'object') return false;
        let w = num(t.w != null ? t.w : t.width, 120);
        let h = num(t.h != null ? t.h : t.height, 28);
        if (w <= 0 || h <= 0) return false;
        let x = num(t.x, 0), y = num(t.y, 0);
        if (x + w > CW) { x = CW - w; }
        if (y + h > CH) { y = CH - h; }
        if (x < -10) x = -10;
        if (y < -10) y = -10;
        t.x = Math.round(x); t.y = Math.round(y);
        t.width = Math.round(w); t.height = Math.round(h);
        if (t.w != null) { t.w = t.width; delete t.w; }
        if (t.h != null) { t.h = t.height; delete t.h; }
        return true;
      });
    }

    // 3b. pins 校验 + clamp
    if (Array.isArray(spec.pins)) {
      spec.pins = spec.pins.filter(function (p) {
        if (!p || typeof p !== 'object') return false;
        let sz = num(p.size, 40);
        if (sz <= 0) return false;
        let x = num(p.x, 0), y = num(p.y, 0);
        if (x + sz > CW) x = CW - sz;
        if (y + sz > CH) y = CH - sz;
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        p.x = Math.round(x); p.y = Math.round(y);
        p.size = Math.round(sz);
        return true;
      });
    }

    // 3c. doodles 校验 + clamp
    const DOODLE_KINDS = new Set(['arrow', 'underline', 'circle', 'heart', 'star', 'swirl', 'scribble', 'check', 'branch', 'sparkle', 'hashtag', 'rect', 'ellipse']);
    if (Array.isArray(spec.doodles)) {
      spec.doodles = spec.doodles.filter(function (d) {
        if (!d || typeof d !== 'object') return false;
        const k = String(d.kind || '');
        if (!DOODLE_KINDS.has(k)) { add('doodle.kind 非法「' + d.kind + '」已丢弃'); return false; }
        let w = num(d.w != null ? d.w : d.width, 120);
        let h = num(d.h != null ? d.h : d.height, 80);
        if (w <= 0 || h <= 0) return false;
        let x = num(d.x, 0), y = num(d.y, 0);
        if (x + w > CW) x = CW - w;
        if (y + h > CH) y = CH - h;
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        d.x = Math.round(x); d.y = Math.round(y);
        d.width = Math.round(w); d.height = Math.round(h);
        if (d.w != null) { d.w = d.width; delete d.w; }
        if (d.h != null) { d.h = d.height; delete d.h; }
        return true;
      });
    }

    // 4. texts 校验
    if (Array.isArray(spec.texts)) {
      spec.texts = spec.texts.filter(function (t) {
        if (!t || typeof t !== 'object') return false;
        const content = String(t.content != null ? t.content : t.text || '');
        if (!content.trim()) { add('text 空字符串，已丢弃'); return false; }
        const size = num(t.font_size, num(t.size, 28));
        if (size < 10 || size > 200) { add('text.font_size 越界 ' + size + ' 已 clamp'); t.font_size = clamp(size, 10, 200); }
        if (t.color && !isValidHex(t.color)) { add('text.color 非法，已回退 #333'); t.color = '#333333'; }
        if (t.stroke_color && !isValidHex(t.stroke_color)) { add('text.stroke_color 非法，已回退 #FFF'); t.stroke_color = '#FFFFFF'; }
        let x = num(t.x, 0), y = num(t.y, 0);
        const w = Math.max(40, num(t.width, 0));
        if (x + w > CW) { add('text 越界右 已 clamp x'); t.x = CW - w; }
        if (y < 0) t.y = 0;
        if (y > CH - 20) { add('text 越界下 已 clamp y'); t.y = CH - 20; }
        return true;
      });
    }

    return { layout: spec, fixes: fixes };
  }

  /* ---------- 主入口 ---------- */

  /**
   * @param {Object} spec 新版排版 JSON
   * @param {Object} opts
   *   photos 照片源数组（按下标对应 item.photo_index）
   *   scale  预览缩放（默认 1，全尺寸 1080×1440）
   * @returns {Promise<{canvas, ctx, scale, toDataURL, blob, spec}>}
   */
  async function render(spec, opts) {
    opts = opts || {};
    const photosSrc = Array.isArray(opts.photos) ? opts.photos : [];
    const useSanitize = opts.sanitize !== false; // 默认开；显式 sanitize:false 可关

    // 0. 先做 DeepSeek 输出兜底（数值 clamp / 贴纸溢出 / photo_index 覆盖）
    const sanitized = useSanitize
      ? sanitizeLayout(spec, photosSrc.length)
      : { layout: spec, fixes: [] };
    if (opts.onFixes && sanitized.fixes.length) {
      try { opts.onFixes(sanitized.fixes); } catch (e) { /* noop */ }
    }
    if (opts.debug && sanitized.fixes.length) console.log('[DiaryNextRenderer] 兜底修正：', sanitized.fixes);

    const layout = normalizeLayout(sanitized.layout);
    if (opts.debug) window.__DIARY_LAST_LAYOUT = layout;   // 调试：查看归一化后的 layout（含 note/自动胶带）
    const scale = clamp(num(opts.scale, 1), 0.05, 1);

    // 1. 装载照片（缺某张只跳过对应 item）
    const loaded = new Array(photosSrc.length);
    await Promise.all(photosSrc.map(function (src, i) {
      return loadSource(src)
        .then(function (res) { loaded[i] = res; })
        .catch(function (err) {
          console.warn('[DiaryNextRenderer] 第 ' + (i + 1) + ' 张照片无法加载：' + err.message);
        });
    }));

    // 1a. 装载抠图主体贴纸（opts.cutoutSrcs: photoIndex → 透明 PNG dataURL）
    const cutoutImgs = {};
    const cutoutNeed = {};
    (Array.isArray(layout.cutouts) ? layout.cutouts : []).forEach(function (c) {
      if (c.photoIndex < 0) return;
      const src = opts.cutoutSrcs && opts.cutoutSrcs[c.photoIndex];
      if (src && !cutoutNeed[c.photoIndex]) cutoutNeed[c.photoIndex] = src;
    });
    await Promise.all(Object.keys(cutoutNeed).map(function (k) {
      return loadSource(cutoutNeed[k])
        // loadSource 返回 { el, w, h } 包装对象，而 drawCutoutItem 直接 drawImage(img) 需要裸元素 → 取 .el
        .then(function (res) { cutoutImgs[k] = (res && res.el) ? res.el : res; })
        .catch(function (err) {
          console.warn('[DiaryNextRenderer] 抠图贴纸(照片' + k + ')无法加载：' + err.message);
        });
    }));

    // 数据源（必须在任何使用 DATA 的代码之前声明，const 有 TDZ）
    const DATA = global.DIARY_NEXT_DATA;

    // 1b. 装载复古贴纸库（layout.library: file → assets/stickers/<style>/<file>.png）
    const libraryImgs = {};
    const libNeed = {};
    (Array.isArray(layout.library) ? layout.library : []).forEach(function (l) {
      const key = l.file;
      if (!key || libNeed[key]) return;
      const url = l.src || (DATA.libraryBase ? DATA.libraryBase(layout.style) : '') + key + '.png';
      if (!l.src && !url) { console.warn('[DiaryNextRenderer] 贴纸库无 base 无法解析 file=' + key); return; }
      libNeed[key] = url;
    });
    // v3.20 真实胶带候选池也走同一个图片仓库：
    // 胶带是在 snapTapesToPhotoEdge 里才挑的（要等照片宽高比定稿），
    // 所以这里把**整个候选池**先预载好，drawTapeItem 才拿得到图。
    (Array.isArray(layout.tapeFiles) ? layout.tapeFiles : []).forEach(function (m) {
      const key = m && m.f;
      if (!key || libNeed[key]) return;
      libNeed[key] = (DATA.libraryBase ? DATA.libraryBase(layout.style) : '') + key + '.png';
    });
    await Promise.all(Object.keys(libNeed).map(function (k) {
      return loadSource(libNeed[k])
        .then(function (res) { libraryImgs[k] = (res && res.el) ? res.el : res; })
        .catch(function (err) {
          console.warn('[DiaryNextRenderer] 贴纸库 ' + k + ' 无法加载：' + err.message);
        });
    }));

    // 2. 预载本 layout 用到的贴纸（id 解析失败只告警，单张贴纸不影响整体）
    const needUrl = function (sticker) {
      if (typeof DATA.stickerUrl === 'function') {
        return DATA.stickerUrl(layout.style, sticker.id);
      }
      return null;
    };
    const stickerImgs = {};
    const seen = {};
    const pendingStickers = [];
    layout.stickers.forEach(function (s) {
      const key = String(s.id);
      if (!key || seen[key]) return;
      seen[key] = 1;
      const url = needUrl(s);
      if (!url) {
        console.warn('[DiaryNextRenderer] 无法解析贴纸 id=' + key + '，已跳过');
        return;
      }
      pendingStickers.push(
        loadStickerImg(url, key)
          .then(function (img) { stickerImgs[key] = img; })
          .catch(function (err) { console.warn('[DiaryNextRenderer]', err.message); })
      );
    });
    // 等所有贴纸就绪（各自已捕获失败，不会 reject）
    await Promise.all(pendingStickers.map(function (p) {
      return Promise.resolve(p).catch(function () { /* ignore */ });
    }));

    // 3. 建画布（物理尺寸固定 1080×1440，scale 仅缩预览）
    const cw = Math.round(CW * scale), chh = Math.round(CH * scale);
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = chh;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // 4. 背景 + 元素（组间默认 bg<card<note<photo<tape<sticker<pin<doodle<text）
    drawBackground(ctx, layout);
    // 卡片（米色/白色内页矩形）— 位于背景之上、照片之下
    if (Array.isArray(layout.cards) && layout.cards.length) {
      layout.cards.forEach(function (c) { drawCardItem(ctx, c); });
    }
    // v3.14 实心便签（次底层）→ 其上紧跟「便签文字 / 便签挂件」（under_photos）
    // 层级：背景 < 便签底 < 便签文字/清单 < 照片/胶带/贴纸（贴纸可压住便签一部分，但受"不可全遮挡"保护）
    if (layout.note) drawNoteBox(ctx, layout.note);
    layout.texts.forEach(function (t) { if (t.underPhotos) drawTextItem(ctx, t, scale); });
    if (Array.isArray(layout.widgets) && layout.widgets.length) {
      layout.widgets.forEach(function (wgt) { if (wgt.underPhotos) drawWidget(ctx, wgt); });
    }
    // v3.7：先按照片实际宽高比对每个槽位做一次"智能扩缩"（差异 > 15% 才触发），
    // 保留照片原始横竖比，避免被强行 cover 裁切；同时同步到 layout.items（贴纸/抠图位会跟着避让）
    layout.items.forEach(function (item) {
      const photo = item.photoIndex >= 0 ? loaded[item.photoIndex] : null;
      if (!photo) return;
      const adj = adjustItemToPhotoAspect(item, photo);
      if (adj) {
        item.x = adj.x;
        item.y = adj.y;
        item.w = adj.width;
        item.h = adj.height;
      }
    });
    layout.items.forEach(function (item, i) {
      const photo = item.photoIndex >= 0 ? loaded[item.photoIndex] : null;
      if (photo) drawPhotoItem(ctx, item, photo, i, scale);
    });
    // v3.12/13 照片位置已定稿 → 胶带按照片外沿定位（预设模板=每张照片顶边各一条）
    snapTapesToPhotoEdge(layout, loaded);
    // 胶带：贴在照片边角（位于贴纸下层）
    if (Array.isArray(layout.tapes) && layout.tapes.length) {
      layout.tapes.forEach(function (t) { drawTapeItem(ctx, t, libraryImgs); });
    }
    layout.stickers.forEach(function (s) {
      const img = stickerImgs[String(s.id)];
      if (img) drawStickerItem(ctx, s, img);
    });
    // 抠图主体贴纸（在贴纸层之后、图钉之前；原照片在 items 层已保留）
    if (Array.isArray(layout.cutouts) && layout.cutouts.length) {
      layout.cutouts.forEach(function (c) {
        const img = cutoutImgs[c.photoIndex];
        if (img) drawCutoutItem(ctx, c, img);
      });
    }
    // 复古贴纸库：外部透明贴纸（与抠图贴纸同层、位于图钉之前）
    if (Array.isArray(layout.library) && layout.library.length) {
      layout.library.forEach(function (l) {
        const img = libraryImgs[l.file];
        if (img) drawLibraryItem(ctx, l, img);
      });
    }
    // 图钉：钉在照片角（位于贴纸上层）
    if (Array.isArray(layout.pins) && layout.pins.length) {
      layout.pins.forEach(function (p) { drawPinItem(ctx, p); });
    }
    // 涂鸦：手绘符号（最上层，最显眼的引导线）
    if (Array.isArray(layout.doodles) && layout.doodles.length) {
      layout.doodles.forEach(function (d) { drawDoodleItem(ctx, d); });
    }
    // 小部件：邮戳/清单/便签/长尾夹/页码/日历（涂鸦与文字之间）
    // v3.14：带 underPhotos 的挂件（便签上的清单）已在便签之后画过，这里跳过避免重复绘制
    if (Array.isArray(layout.widgets) && layout.widgets.length) {
      layout.widgets.forEach(function (wgt) { if (!wgt.underPhotos) drawWidget(ctx, wgt); });
    }
    layout.texts.forEach(function (t) {
      if (t.underPhotos) return;   // v3.14：便签文字已在便签之后绘制
      drawTextItem(ctx, t, scale);
    });

    // v3.8 复古胶片调色（Lightroom 式 9 参数）：HSL-pass → CSS filter → USM → 颗粒
    if (layout.grade) applyVintageGrade(canvas, layout.grade);

    return {
      canvas: canvas,
      ctx: ctx,
      scale: scale,
      spec: layout,
      toDataURL: function (type, quality) {
        return canvas.toDataURL(type || 'image/png', quality);
      },
      blob: function (type, quality) {
        return new Promise(function (resolve) {
          canvas.toBlob(resolve, type || 'image/png', quality);
        });
      }
    };
  }

  global.DiaryNextRenderer = {
    CW: CW,
    CH: CH,
    render: render,
    normalizeLayout: normalizeLayout,
    sanitizeLayout: sanitizeLayout,
    borderMetrics: borderMetrics,
    BORDER_ALIAS: BORDER_ALIAS,
    loadSource: loadSource,
    wrapText: wrapText
  };
})(window);
