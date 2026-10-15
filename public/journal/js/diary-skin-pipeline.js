/* migrated diary skin pipeline excerpt from page-video.js */
function _v3Trace() {}

/* ---------- v3.54 水彩手绘「钢笔淡彩」皮肤常量 ---------- */
const WC_BG_COLOR = '#F7F3EA'                                 // 水彩纸米白（背景图兜底色）
const WC_BG_IMAGE = '/journal/assets/bg/watercolor/paper_01.jpg'
const WC_INK = '#3A3630'                                      // 细钢笔墨色（主标题）
const WC_TEXT_COLORS = ['#5C5A52', '#7C97A8', '#B08968', '#6E7F6B']
const WC_SPARKLE = '#8FA6B2'                                  // 钢笔小星（白 sparkle 在米白纸上隐形）
const WC_BORDER = 'rect_border'
const WC_BORDER_COLOR = '#3A3630'
const WC_BORDER_W = 3
const WC_FONT = 'wc'                                          // 渲染器 FONT_STACK.wc

/** v3.51 人脸保护区：① layout._faceZones（抠图主体上部，最准）；② 兜底为照片上部 42% 头带 */
function faceZones(layout, pad) {
  const W = (layout && layout.canvas_width) || 1080
  const H = (layout && layout.canvas_height) || 1440
  const m = pad == null ? 14 : pad
  const out = []
  const clipPush = (x, y, w, h) => {
    if (!(w > 0 && h > 0)) return
    const x0 = Math.max(0, x - m)
    const y0 = Math.max(0, y - m)
    const x1 = Math.min(W, x + w + m)
    const y1 = Math.min(H, y + h + m)
    if (x1 > x0 && y1 > y0) out.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 })
  }
  const pf = layout && layout._faceZones
  if (Array.isArray(pf) && pf.length) {
    for (const z of pf) if (z) clipPush(z.x, z.y, z.w, z.h)
    return out
  }
  ;(layout.items || []).forEach((it) => {
    const w = it.width != null ? it.width : it.w
    const h = it.height != null ? it.height : it.h
    if (!(w > 80 && h > 80)) return
    clipPush(it.x, it.y, w, h * 0.42)
  })
  return out
}

/** 估文字宽度（中文按整字宽，其余按 0.52 倍） */
function estimateTextWidth(t, fs) {
  const s = String((t && t.content) || '')
  let w = 0
  for (let i = 0; i < s.length; i++) {
    w += /[\u3400-\u9FFF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF]/.test(s[i]) ? fs : fs * 0.52
  }
  return w
}

/** v3.61 把拆成两行的标题并回一行 */
function mergeTitleLines(layout) {
  const H = (layout && layout.canvas_height) || 1440
  const texts = (layout && Array.isArray(layout.texts)) ? layout.texts : []
  const tops = texts.filter((t) => t && t.content && (Number(t.y) || 0) < H * 0.16)
  if (tops.length < 2) return
  tops.sort((a, b) => (Number(b.font_size) || 0) - (Number(a.font_size) || 0))
  const A = tops[0]
  const fsA = Number(A.font_size) || 24
  const ax = Number(A.x) || 0
  const cont = tops.filter((t) => {
    if (t === A) return false
    const dy = (Number(t.y) || 0) - (Number(A.y) || 0)
    return dy > 0 && dy < fsA * 1.7 && (Number(t.x) || 0) < ax + estimateTextWidth(A, fsA)
  })
  if (!cont.length) return
  const parts = [A].concat(cont).sort((a, b) => (Number(a.x) || 0) - (Number(b.x) || 0))
  A.content = parts.map((p) => String(p.content)).join('')
  cont.forEach((t) => { t.content = '' })
}

/** v3.54 右上角文字放大（右上一句太小），并左移避免放大后出血 */
function enlargeTopRightText(layout) {
  mergeTitleLines(layout)
  const W = (layout && layout.canvas_width) || 1080
  const H = (layout && layout.canvas_height) || 1440
  const texts = (layout && Array.isArray(layout.texts)) ? layout.texts : []
  texts.forEach((t) => {
    if (!t || !t.content) return
    const fs0 = Number(t.font_size) || 24
    const x0 = Number(t.x) || 0
    const y0 = Number(t.y) || 0
    const cx = x0 + estimateTextWidth(t, fs0) / 2
    if (!(cx > W * 0.55 && y0 < H * 0.13)) return
    const fs = Math.min(Math.round(fs0 * 1.5), 84)
    if (fs <= fs0) return
    const w = estimateTextWidth(t, fs)
    let x = x0
    if (x + w > W - 24) x = Math.max(16, W - 24 - w)
    t.font_size = fs
    t.x = Math.round(x)
  })
}


/* ---- lines 1135-1310 ---- */
function noteCoreRect(layout, protectRatio) {
  const n = layout && layout.note;
  if (!n) return null;
  const w = (n.w != null ? n.w : n.width) || 0;
  const h = (n.h != null ? n.h : n.height) || 0;
  if (w <= 0 || h <= 0) return null;
  const r = protectRatio != null ? protectRatio : 0.18;
  const ix = Math.round(w * r), iy = Math.round(h * r);
  return { x: n.x + ix, y: n.y + iy, w: Math.max(4, w - ix * 2), h: Math.max(4, h - iy * 2) };
}

/** 判定一个矩形是否"几乎盖满"便签（覆盖便签面积 ≥ ratio，默认 55%）→ 视为全遮挡，禁止 */
function coversNoteFully(rect, layout, ratio) {
  const n = layout && layout.note;
  if (!n || !rect) return false;
  const nw = (n.w != null ? n.w : n.width) || 0;
  const nh = (n.h != null ? n.h : n.height) || 0;
  if (nw <= 0 || nh <= 0) return false;
  const ix = Math.max(rect.x, n.x), iy = Math.max(rect.y, n.y);
  const ax = Math.min(rect.x + rect.w, n.x + nw), ay = Math.min(rect.y + rect.h, n.y + nh);
  const inter = Math.max(0, ax - ix) * Math.max(0, ay - iy);
  return (inter / (nw * nh)) >= (ratio != null ? ratio : 0.55);
}

/** 收集版面里不能被贴纸挡住的矩形：照片 / 文字 / 便签日历等挂件
 *  （小装饰贴纸、涂鸦、胶带不算——贴纸压住它们反而有拼贴感） */
function collectOccupiedRects(layout) {
  const rects = [];
  const push = (x, y, w, h, pad) => {
    if (w > 0 && h > 0) rects.push({ x: x - pad, y: y - pad, w: w + pad * 2, h: h + pad * 2 });
  };
  (layout.items || []).forEach(p => push(p.x, p.y, p.width, p.height, 18));
  (layout.widgets || []).forEach(w => push(w.x, w.y, w.w, w.h, 12));
  // v3.14 便签核心保护区（抠图/贴纸不得整块盖住便签）
  const nCore = noteCoreRect(layout);
  if (nCore) push(nCore.x, nCore.y, nCore.w, nCore.h, 6);
  (layout.texts || []).forEach(t => {
    if (!t || !t.content) return;
    const fs = t.font_size || 24;
    let tw = 0;
    for (const ch of String(t.content)) tw += ch.charCodeAt(0) > 0x2E80 ? fs : fs * 0.56;
    push(t.x, t.y, Math.min(tw, 960), fs * 1.4, 10);
  });
  return rects;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** 在画布空白区给贴纸找位置：理想尺寸放不下就逐级缩小（0.85/0.72/0.6），
 *  缩到 130px 以下就放弃（宁缺毋滥，太小的贴纸没有主角感）。
 *  绝不与照片/文字/挂件(occupied)重叠，也绝不与已放下的贴纸(taken)重叠。
 *  opts.randomStart=true 时，扫描顺序从画布随机起点开始（避免多枚贴纸都堆左上） */
function findFreeSpot(occupied, want, taken, canvasW, canvasH, opts) {
  const margin = (opts && opts.margin) || 30;
  const scales = (opts && opts.scales) || [1, 0.85, 0.72, 0.6];
  const minSide = (opts && opts.minSide) || 130;
  const randomStart = !!(opts && opts.randomStart);
  // v3.16 可选：把扫描范围限制在一个矩形区域内（便签留白填补用）。
  // 不传 region 时 bx/by/bw/bh 退化成原来的 [margin, canvas-margin]，行为完全不变。
  const region = (opts && opts.region) || null;
  // v3.17 可选：收集区域内**所有**合法位置后随机取一个（而非取扫描到的第一个）。
  // 不传时行为完全不变（还是「第一个就返回」）。用来打破"同排贴纸全落在同一基线"的机械感。
  const pickRandom = !!(opts && opts.pickRandom);
  const bx = region ? Math.max(margin, region.x) : margin;
  const by = region ? Math.max(margin, region.y) : margin;
  const bw = region ? Math.max(0, Math.min(canvasW - margin, region.x + region.w) - bx) : canvasW - 2 * margin;
  const bh = region ? Math.max(0, Math.min(canvasH - margin, region.y + region.h) - by) : canvasH - 2 * margin;
  for (let si = 0; si < scales.length; si++) {
    const w = Math.round(want.w * scales[si]);
    const h = Math.round(want.h * scales[si]);
    if (w < minSide || h < minSide) return null;
    if (w > bw || h > bh) continue;   // 这一档在这个区域里必然放不下 → 试更小一档
    // 网格化扫描位置（8px 步长比之前 24 更密，找得到更窄的缝）
    const step = 16;
    // 按画布列数划分网格：每列高度差 1~2 行，打散到不同区域
    const cols = Math.max(1, Math.floor(bw / step));
    const rows = Math.max(1, Math.floor(bh / step));
    let colStart, rowStart;
    if (opts && opts.anchor) { // 锚点定位：从指定区域开始扫（配合多锚点实现跨版面分散）
      const ax = Math.max(bx, Math.min(opts.anchor.x, bx + bw));
      const ay = Math.max(by, Math.min(opts.anchor.y, by + bh));
      colStart = Math.floor((ax - bx) / step); if (colStart < 0) colStart = 0;
      rowStart = Math.floor((ay - by) / step); if (rowStart < 0) rowStart = 0;
      // 锚点附近随机抖动，避免每枚贴纸都从同一格扫起
      colStart = (colStart + Math.floor(Math.random() * 3) - 1 + cols) % cols;
      rowStart = (rowStart + Math.floor(Math.random() * 3) - 1 + rows) % rows;
    } else if (randomStart) {
      colStart = Math.floor(Math.random() * cols);
      rowStart = Math.floor(Math.random() * rows);
    } else {
      colStart = 0; rowStart = 0;
    }
    const picked = pickRandom ? [] : null;
    for (let dy = 0; dy < rows; dy++) {
      const cy = (rowStart + dy) % rows;
      for (let dx = 0; dx < cols; dx++) {
        const cx = (colStart + dx) % cols;
        const x = bx + cx * step;
        const y = by + cy * step;
        if (x + w > bx + bw || y + h > by + bh) continue;
        const r = { x: x, y: y, w: w, h: h };
        let hit = false;
        for (let i = 0; i < occupied.length && !hit; i++) if (rectsOverlap(r, occupied[i])) hit = true;
        if (!hit) for (let i = 0; i < taken.length && !hit; i++) if (rectsOverlap(r, taken[i])) hit = true;
        if (!hit) {
          if (pickRandom) picked.push(r);
          else return r;
        }
      }
    }
    // 这一档有合法位就随机挑一个（优先大尺寸，只有大档完全放不下才缩档）
    if (pickRandom && picked.length) return picked[Math.floor(Math.random() * picked.length)];
  }
  return null;
}

/**
 * v3.18 抠图兜底位置：版面被照片/文字塞满、找不到整块空位时，
 * 让主体从「源照片」的某个角上探出来 —— 手帐里很常见的「撕下来的主体贴在照片边上」观感。
 * 只躲文字（重叠 >15% 就换角），允许压照片/挂件，超出画布则夹回。
 * 返回 {x,y,w,h} 或 null。
 */
function collectVintageLibRects(layout, opts) {
  const rects = [];
  // v3.21：photoInset = 照片核心区向内缩多少（缩得越少＝保护区越大＝贴纸离照片越远）
  //        textPad    = 文字四周留白
  const photoInset = (opts && opts.photoInset != null) ? opts.photoInset : 30;
  const textPad = (opts && opts.textPad != null) ? opts.textPad : 12;
  const push = (x, y, w, h, pad) => {
    if (w > 0 && h > 0) rects.push({ x: x - pad, y: y - pad, w: w + pad * 2, h: h + pad * 2 });
  };
  // 照片：只保护核心区（向内缩 photoInset 后剩余的矩形），其余边缘允许贴纸压上去
  (layout.items || []).forEach(p => {
    const inset = photoInset;
    push(p.x + inset, p.y + inset, Math.max(10, p.width - inset * 2), Math.max(10, p.height - inset * 2), 6);
  });
  // v3.14 便签核心保护区：贴纸库允许压住便签外圈（拼贴感），但不得压到中心 → 便签不会被整块盖住
  const nCore = noteCoreRect(layout);
  if (nCore) push(nCore.x, nCore.y, nCore.w, nCore.h, 4);
  // widgets（邮戳/checklist）：不算禁区，允许贴纸贴旁边/边缘（手帐感），但避开正中心
  // 文字：必须避开，保证可读
  (layout.texts || []).forEach(t => {
    if (!t || !t.content) return;
    const fs = t.font_size || 24;
    let tw = 0;
    for (const ch of String(t.content)) tw += ch.charCodeAt(0) > 0x2E80 ? fs : fs * 0.56;
    push(t.x, t.y, Math.min(tw, 960), fs * 1.4, textPad);
  });
  return rects;
}

/**
 * v3.15 贴纸等比贴合尺寸（**绝不拉伸**）：
 *  - 先按「长边 = targetLong」等比缩放
 *  - 若这样算出的短边 < minShort，则改成「短边 = minShort」再等比缩放
 *  - 全程不超过 maxScale 倍放大（小图标不许被拉糊）
 * 旧写法 `Math.max(56, w*scale)` 会把细长胶带 / 方形小图标压成正方形，故废弃。
 */
function fitStickerSize(s, targetLong, minShort, maxScale) {
  const cap = (maxScale == null) ? 1 : maxScale;
  const longSide = Math.max(1, Math.max(s.w, s.h));
  const shortSide = Math.max(1, Math.min(s.w, s.h));
  let sc = Math.min(targetLong / longSide, cap);
  if (shortSide * sc < minShort) sc = Math.min(Math.max(sc, minShort / shortSide), cap);
  return { w: Math.max(1, Math.round(s.w * sc)), h: Math.max(1, Math.round(s.h * sc)) };
}

/**
 * v3.16 便签留白补小贴纸
 * -----------------------------------------------------------------------------
 * vintage 的实心便签（layout.note）右侧 / 上方有大片留白（清单文字只占左半边），
 * 用户希望「这里空的贴点贴纸」。
 * 做法：以「便签内缩 14px」为**扫描区域**，把便签里已有的内容当禁区 —
 *   - 「完」等 texts（按估宽）
 *   - checklist 挂件（按**逐行实际文字**范围算，不用整块 385px 宽，否则整张便签被封死）
 *   - 其他挂件、照片、抠图主体、已贴贴纸（照片在便签之上，会盖住便签 → 那儿贴了也白贴）
 * 然后挑**方正的**小贴纸（长边≈130、短边≥44，细长胶带跳过）贴进去，轻微随机旋转，
 * 像"随手按在便签留白上"。放不下就少贴（宁缺毋滥）。
 * @returns {{placed:number, nextIdx:number}} nextIdx 回写洗牌游标，避免与后续阶段刷同一批
 */
function fillNoteStickers(layout, pool, startIdx, allPlaced, canvasW, canvasH) {
  const n = layout && layout.note;
  if (!n || !pool || !pool.length) return { placed: 0, nextIdx: startIdx };
  const nw = (n.w != null ? n.w : n.width) || 0;
  const nh = (n.h != null ? n.h : n.height) || 0;
  if (nw < 140 || nh < 110) return { placed: 0, nextIdx: startIdx };
  const PAD = 14;
  const region = { x: n.x + PAD, y: n.y + PAD, w: nw - PAD * 2, h: nh - PAD * 2 };
  if (region.w < 100 || region.h < 80) return { placed: 0, nextIdx: startIdx };

  // ---- 便签内禁区 ----
  const occ = [];
  const push = (x, y, w, h, pad) => {
    if (w > 0 && h > 0) occ.push({ x: x - pad, y: y - pad, w: w + pad * 2, h: h + pad * 2 });
  };
  (layout.texts || []).forEach(t => {
    if (!t || !t.content) return;
    const fs = t.font_size || 24;
    let tw = 0;
    for (const ch of String(t.content)) tw += ch.charCodeAt(0) > 0x2E80 ? fs : fs * 0.58;
    push(t.x, t.y - fs * 0.25, Math.min(tw * 1.12, 960), fs * 1.3, 12);
  });
  (layout.widgets || []).forEach(w => {
    if (!w) return;
    if (w.type === 'checklist' && Array.isArray(w.items) && w.items.length) {
      // 逐行实际文字范围（复刻 diary-next-render.js drawChecklistItem 的排版）
      const size = (w.data && w.data.size) || 30;
      const gap = (w.data && w.data.gap) || 54;
      const b = size * 0.9;
      let maxW = 0;
      w.items.forEach(row => {
        const label = String(row && row.text != null ? row.text : row);
        let cw = 0;
        for (const ch of label) cw += ch.charCodeAt(0) > 0x2E80 ? size * 1.05 : size * 0.58;
        if (cw > maxW) maxW = cw;
      });
      const y0 = w.y - size * 0.75;
      const y1 = w.y + (w.items.length - 1) * gap + size * 0.75;
      // 132% 余量：Caveat 手写体实际字宽 ≈0.52em，估算取 0.58 再乘 1.12 → 约 26% 安全边
      push(w.x, y0, b + 14 + maxW * 1.12, y1 - y0, 12);
    } else {
      push(w.x, w.y, w.w || 0, w.h || 0, 10);
    }
  });
  (layout.items || []).forEach(p => push(p.x, p.y, p.width, p.height, 6));
  (layout.cutouts || []).forEach(c => push(c.x, c.y, c.w, c.h, 6));

  const MAX_NOTE = 3;
  const anchorsRel = [
    { fx: 0.76, fy: 0.22 },  // 便签右上留白
    { fx: 0.86, fy: 0.80 },  // 便签右下留白
    { fx: 0.62, fy: 0.52 },  // 便签中部偏右
    { fx: 0.92, fy: 0.50 },  // 便签最右中段
    { fx: 0.68, fy: 0.38 }   // 便签上部中段
  ];
  let idx = startIdx, placed = 0, miss = 0;
  // 候选被 aspect/尺寸筛掉不算"放不下"，所以多给几次机会，只把命中上限卡在 MAX_NOTE
  for (let k = 0; k < MAX_NOTE + 3 && placed < MAX_NOTE; k++) {
    const s = pool[idx % pool.length];
    idx++;
    const aspect = Math.max(s.w, s.h) / Math.max(1, Math.min(s.w, s.h));
    if (aspect > 3.2) continue;           // 细长胶带塞不进便签留白 → 换一枚
    const sz = fitStickerSize(s, 130, 44, 1.3);
    if (Math.max(sz.w, sz.h) < 56) continue;  // 太小没存在感
    const a = anchorsRel[k % anchorsRel.length];
    const anchor = { x: region.x + region.w * a.fx, y: region.y + region.h * a.fy };
    let sp = null;
    for (let t = 0; t < 3 && !sp; t++) {
      sp = findFreeSpot(occ, { w: sz.w, h: sz.h }, allPlaced, canvasW, canvasH, {
        margin: PAD, minSide: 30, scales: [1, 0.85, 0.72, 0.6, 0.5],
        randomStart: true, anchor: anchor, region: region
      });
    }
    if (!sp || Math.min(sp.w, sp.h) < 30) { miss++; if (miss >= 3) break; continue; }
    miss = 0;
    allPlaced.push({ x: sp.x - 8, y: sp.y - 8, w: sp.w + 16, h: sp.h + 16 });
    layout.library.push({ file: s.f, x: sp.x, y: sp.y, w: sp.w, h: sp.h,
      rotate: Math.round((Math.random() * 10 - 5) * 10) / 10, shadow: true, z: 24 });
    placed++;
  }
  return { placed: placed, nextIdx: idx };
}

function buildVintageStickers(layout) {
  const lib = (window.DiaryTemplates && window.DiaryTemplates.vintageLibrary)
    ? window.DiaryTemplates.vintageLibrary() : [];
  if (!lib.length) return { placed: 0 };

  const canvasW = layout.canvas_width || 1080;
  const canvasH = layout.canvas_height || 1440;

  // ---- 禁区集 ----
  // ① 填充用：照片核心区(内缩30px) + 文字 + 抠图主体 → 贴纸不压照片中心、不挡文字
  const fillOccupied = collectVintageLibRects(layout);
  // ② 边角用：只避文字 + 抠图主体 → 允许贴纸压照片边角（手帐"边角贴纸"）
  const cornerOccupied = [];
  (layout.texts || []).forEach(t => {
    if (!t || !t.content) return;
    const fs = t.font_size || 24;
    let tw = 0;
    for (const ch of String(t.content)) tw += ch.charCodeAt(0) > 0x2E80 ? fs : fs * 0.56;
    cornerOccupied.push({ x: t.x - 10, y: t.y - 10, w: Math.min(tw, 960) + 20, h: fs * 1.4 + 20 });
  });
  if (Array.isArray(layout.cutouts)) {
    for (const c of layout.cutouts) {
      if (c && c.w > 0 && c.h > 0) fillOccupied.push({ x: c.x, y: c.y, w: c.w, h: c.h });
    }
    for (const c of layout.cutouts) {
      if (c && c.w > 0 && c.h > 0) cornerOccupied.push({ x: c.x, y: c.y, w: c.w, h: c.h });
    }
  }

  // 已放贴纸（含间距），两阶段共用避让
  const allPlaced = [];
  layout.library = layout.library || [];

  // 洗牌库（角标/填充共用一份，避免重复刷同一批）
  const pool = lib.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }

  // ---- 阶段 1：照片边角贴纸（小号，压在照片角上，营造"手帐边角贴"） ----
  let poolIdx = 0;
  const photoItems = (layout.items || []).filter(it => it && it.width > 60 && it.height > 60);
  for (const it of photoItems) {
    const corners = [
      { x: it.x, y: it.y },
      { x: it.x + it.width, y: it.y },
      { x: it.x, y: it.y + it.height },
      { x: it.x + it.width, y: it.y + it.height }
    ];
    // 洗牌角顺序，随机挑 1~2 个边角
    for (let i = corners.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = corners[i]; corners[i] = corners[j]; corners[j] = t; }
    const nCorner = 1 + Math.floor(Math.random() * 2); // 1~2 个角
    for (let ci = 0; ci < Math.min(nCorner, corners.length); ci++) {
      if (!pool.length) break;
      const s = pool[poolIdx % pool.length];
      // v3.15 小号：长边 ≈104px、短边 ≥32px，等比（不拉伸），最多放大 1.6 倍
      const sz = fitStickerSize(s, 104, 32, 1.6);
      const w = sz.w, h = sz.h;
      if (Math.max(w, h) < 52) continue;   // 太小不可见 → 换下一枚
      const c = corners[ci];
      let sx = Math.round(c.x - w / 2);
      let sy = Math.round(c.y - h / 2);
      sx = Math.max(14, Math.min(sx, canvasW - w - 14));
      sy = Math.max(14, Math.min(sy, canvasH - h - 14));
      const r = { x: sx, y: sy, w: w, h: h };
      // v3.14 便签不可全遮挡：压住便签可以，整块盖住不行
      if (coversNoteFully(r, layout)) continue;
      let hit = false;
      for (const o of cornerOccupied) if (rectsOverlap(r, o)) { hit = true; break; }
      if (!hit) for (const o of allPlaced) if (rectsOverlap(r, o)) { hit = true; break; }
      if (hit) continue;
      poolIdx++;
      allPlaced.push({ x: sx - 10, y: sy - 10, w: w + 20, h: h + 20 });
      layout.library.push({ file: s.f, x: sx, y: sy, w: w, h: h,
        rotate: Math.round((Math.random() * 8 - 4) * 10) / 10, shadow: true, z: 24 });
    }
  }
  const cornerPlaced = allPlaced.length;

  // ---- 阶段 2：空白区按剩余空白率自适应填 ----
  const totalArea = canvasW * canvasH;
  let occupiedArea = 0;
  for (const r of fillOccupied) {
    const ox = Math.max(0, Math.min(r.x + r.w, canvasW) - Math.max(0, r.x));
    const oy = Math.max(0, Math.min(r.y + r.h, canvasH) - Math.max(0, r.y));
    occupiedArea += ox * oy;
  }
  const freeRatio = Math.max(0, Math.min(1, (totalArea - occupiedArea) / totalArea));
  const MAX_N = 16, MIN_N = 5;
  let targetFill = Math.max(MIN_N, Math.min(MAX_N, Math.round(MIN_N + freeRatio * (MAX_N - MIN_N))));
  if (freeRatio < 0.08) targetFill = 2; // 版面非常满时仍撒 2 枚点缀

  // 分散锚点：让贴纸依次落到画布不同区域（中心→右上→左下→右下→左上→中上→中下→右中→左中），
  // 填满大片空白而不是挤在一堆里（每次从锚点附近开始扫，扫不到就换下一档缩放/下一枚）
  const anchors = [
    { x: canvasW * 0.50, y: canvasH * 0.55 },
    { x: canvasW * 0.80, y: canvasH * 0.30 },
    { x: canvasW * 0.22, y: canvasH * 0.70 },
    { x: canvasW * 0.78, y: canvasH * 0.80 },
    { x: canvasW * 0.20, y: canvasH * 0.28 },
    { x: canvasW * 0.50, y: canvasH * 0.20 },
    { x: canvasW * 0.50, y: canvasH * 0.85 },
    { x: canvasW * 0.84, y: canvasH * 0.55 },
    { x: canvasW * 0.18, y: canvasH * 0.48 }
  ];

  let filled = 0, missStreak = 0;
  for (let k = 0; k < targetFill; k++) {
    if (!pool.length) break;
    const s = pool[poolIdx % pool.length];
    // v3.15 空白填充：长边 ≈210px、短边 ≥70px，等比（不拉伸），最多放大 1.6 倍。
    // 细长胶带保持细长（不再被 Math.max(84,…) 压成方块），方形小图标才等比放大。
    const sz = fitStickerSize(s, 210, 70, 1.6);
    const w = sz.w, h = sz.h;
    let sp = null;
    const anchor = anchors[k % anchors.length];
    // 同一枚围绕锚点多试几个起点，避免"有位置但第一次没扫到"的假空
    for (let t = 0; t < 3 && !sp; t++) {
      sp = findFreeSpot(fillOccupied, { w: w, h: h }, allPlaced, canvasW, canvasH, {
        minSide: 62,
        scales: [1, 0.85, 0.72, 0.6, 0.5],
        randomStart: true,
        anchor: anchor
      });
    }
    // 真放不下（试了 3 个锚点抖动 + 5 档缩放）→ 版面已密集，停止
    if (!sp) { missStreak++; if (missStreak >= 2) break; continue; }
    // v3.14 便签不可全遮挡：候选位若几乎盖满便签则换下一个（便签是次底层，必须留出可见部分）
    if (coversNoteFully({ x: sp.x, y: sp.y, w: sp.w, h: sp.h }, layout)) { missStreak++; continue; }
    missStreak = 0;
    poolIdx++;
    allPlaced.push({ x: sp.x - 12, y: sp.y - 12, w: sp.w + 24, h: sp.h + 24 });
    layout.library.push({ file: s.f, x: sp.x, y: sp.y, w: sp.w, h: sp.h,
      rotate: Math.round((Math.random() * 8 - 4) * 10) / 10, shadow: true, z: 24 });
    filled++;
  }

  // ---- 阶段 3：便签留白补小贴纸（v3.16）----
  // 阶段 2 的 fillOccupied 含「便签核心保护区」，所以贴纸永远不会落进便签里；
  // 但用户希望便签右侧的空白也贴几枚 → 这里专门在便签内缩范围内、避开「完」和清单文字再贴 1~3 枚。
  const noteRes = fillNoteStickers(layout, pool, poolIdx, allPlaced, canvasW, canvasH);
  poolIdx = noteRes.nextIdx;

  const total = layout.library.length;
  _v3Trace('🎞 复古贴纸库拼接 ' + total + ' 枚（边角 ' + cornerPlaced + ' + 空白 ' + filled +
    ' + 便签留白 ' + noteRes.placed + '，空白率 ' + (freeRatio * 100).toFixed(0) + '%，目标 ' + targetFill + '，库 ' + lib.length + '）');
  return { placed: total };
}

/* ---- lines 1719-2405 ---- */
/**
 * v3.17 简约清新「墨绿底」皮肤
 * -----------------------------------------------------------------------------
 * 用户给的参考模板是**灰墨绿毡底**（实测采样 #434F37 / #5B6A4B / #6B785C，主色 #586848）
 * + 大片留白 + 错落照片 + 浅奶油色手写文字。
 * DeepSeek 只会给「浅底 + 深字」的通用简约方案，所以这里统一覆写皮肤层：
 *  - 背景强制墨绿（并清掉可能冲突的渐变）
 *  - 文字颜色统一转浅（奶油白/浅米），深色字改成浅色保证可读；字号最大那条给纯白
 *  - 关掉纸纹 / 做旧（清新不是复古），并清掉 grade（不做复古调色）
 *  - 锁定 style='minimal'：渲染器据此选胶带色板(mint/beige)、tapesAuto、以及
 *    /assets/stickers/minimal/ 贴纸目录（libraryBase(layout.style)）
 * 只动「皮肤」，不碰 DeepSeek 排出来的照片坐标/尺寸 → 位置仍由 AI 决定。
 */
// v3.19 底色提亮 → 更浅、更清透的墨绿（原 #5B6A4B 偏沉；参考纸样 RGB(105,122,92)）
const FRESH_BG_COLOR = '#6D7C5D';
// v3.19 字体配色：主标题青白，正文青蓝（取自参考图 "Don't" 手写青色，中位 #508C9A 提亮到可读）
const FRESH_TEXT_MAIN = '#C8ECF5';
const FRESH_TEXT_COLORS = ['#74C7DD', '#8AD4E6', '#63B8D0', '#A0DFEC'];
// v3.19 星星色：参考图那种「浅绿白柔光轮廓星」（原为青色 #7FC8C1）
const FRESH_ACCENT = '#C8E2CE';
// v3.18 手写涂鸦体（见 diary-next-render.js FONT_STACK.fresh）
const FRESH_FONT = 'fresh';

/**
 * v3.20 多彩活泼：4 套配色主题，随机选一套生成
 * -----------------------------------------------------------------------------
 * 用户指定 4 个色盘（蓝/绿/粉/黄），每次点击"开始生成"随机抽一个：
 *  - bg：纯色 pastel 底
 *  - ink：'light' = 深底配浅字；'dark' = 浅底配深字
 *  - textMain / textColors：文字配色（主标题 + 正文循环）
 *  - doodle：涂鸦主色
 *  - pinC / pinY / pinW / pinR：图钉色卡（每次随机取一种）
 *  - tapes：胶带权重 [{k:'b'/'k'/'p'/'y', w:3},{k:'k',w:1}]，彩色主色 ×3 + 黑白点缀 ×1
 *  - accent：当前主题的"代表色"，用于彩色边框点缀
 *
 * ink=light 主题（深底，浅字）  → 给 doodle/pin 转成浅色
 * ink=dark  主题（浅底，深字）  → 给 doodle/pin 留 AI 原色 / 略加深
 *
 * 用户原话（同色系优先 + 黑白点缀）。注：tape 源图里没有"绿"系，绿色主题
 * 用蓝色胶带替代作为同色系（冷色调），其他三色都对上。
 */
const COLORFUL_THEMES = [
  {                                       // ① 雾蓝 (用户图1 左上)
    key: 'blue', name: '雾蓝', bg: '#4275A4', ink: 'light',
    textMain: '#F0F7FC',
    textColors: ['#E4F1FA', '#CFE6F5', '#DCEBF7', '#BEDCF0'],
    doodle: '#F2F8FC', pin: '#F5D77E',
    tapes: [{ k: 'b', w: 3 }, { k: 'k', w: 1 }],
    accent: '#BFDCF0'
  },
  {                                       // ② 薄荷绿 (用户图1 右上)
    key: 'mint', name: '薄荷绿', bg: '#D4DFC9', ink: 'dark',
    textMain: '#3F5A3C',
    textColors: ['#5C7A55', '#4E6B4A', '#6B8A62', '#8AA37E'],
    doodle: '#4E6B4A', pin: '#E8946C',
    tapes: [{ k: 'b', w: 3 }, { k: 'k', w: 1 }],   // 源图无绿胶带 → 用冷色蓝 + 黑白点缀
    accent: '#A8C9A0'
  },
  {                                       // ③ 藕粉 (用户图1 左下)
    key: 'pink', name: '藕粉', bg: '#F3D6D4', ink: 'dark',
    textMain: '#8A4550',
    textColors: ['#A8606A', '#96525C', '#B8737C', '#C08A90'],
    doodle: '#96525C', pin: '#E8C268',
    tapes: [{ k: 'p', w: 3 }, { k: 'k', w: 1 }],
    accent: '#E39AA6'
  },
  {                                       // ④ 奶油黄 (用户图1 右下)
    key: 'cream', name: '奶油黄', bg: '#F7EDCB', ink: 'dark',
    textMain: '#8A6A24',
    textColors: ['#A07E30', '#8E7028', '#B08A3C', '#C09A50'],
    doodle: '#8E7028', pin: '#E8946C',
    tapes: [{ k: 'y', w: 3 }, { k: 'k', w: 1 }],
    accent: '#E8B64C'
  }
];
const COLORFUL_FONT = 'pen';               // v3.22 渲染器 FONT_STACK.pen（细笔硬笔行楷 · 宏雷行书）
const COLORFUL_PHOTO_BORDER_W = 12;        // v3.21 照片统一「白色细边框」的边宽（px，画布 1080 宽）

/** v3.20 多彩活泼：随机抽一套主题。控制台 __DIARY_FORCE_COLORFUL_THEME 强制指定。 */
function pickColorfulTheme() {
  const forceKey = window.__DIARY_FORCE_COLORFUL_THEME;
  if (forceKey) {
    const hit = COLORFUL_THEMES.find(t => t.key === forceKey);
    if (hit) return hit;
  }
  return COLORFUL_THEMES[Math.floor(Math.random() * COLORFUL_THEMES.length)];
}

function applyFreshSkin(layout) {
  if (!layout || typeof layout !== 'object') return layout;

  layout.style = 'minimal';            // 渲染器据此选贴纸目录 + 胶带色板 + tapesAuto
  layout.bg_color = FRESH_BG_COLOR;    // 墨绿毡底
  layout.bg_gradient = null;           // 避免 AI 给的浅色渐变盖掉墨绿
  layout.bg_paper_lines = false;
  layout.bg_paper_aged = false;
  layout.grade = null;                 // 不做复古调色

  // 文字转浅色：深色字（相对亮度偏低）一律换成奶油白系，保证在墨绿上可读
  const hexLum = (hex) => {
    const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex || '').trim());
    if (!m) return 255;                // 非 hex（含 named color）→ 视为需要处理
    const v = parseInt(m[1], 16);
    return 0.299 * ((v >> 16) & 255) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255);
  };
  const texts = Array.isArray(layout.texts) ? layout.texts : [];
  // 字号最大的一条视为主标题 → 给纯白，其余循环奶油色
  let mainIdx = -1, mainSize = -1;
  texts.forEach((t, i) => {
    const s = Number(t && t.font_size) || 0;
    if (s > mainSize) { mainSize = s; mainIdx = i; }
  });
  texts.forEach((t, i) => {
    if (!t) return;
    // v3.19 用户指定：字体颜色统一走参考图那支青色系（主标题青白压得住，正文青蓝）
    t.color = (i === mainIdx) ? FRESH_TEXT_MAIN : FRESH_TEXT_COLORS[i % FRESH_TEXT_COLORS.length];
    t.stroke = 0;                      // 清掉可能残留的深色描边
    t.font = FRESH_FONT;               // v3.18 换成参考图那种圆头手写涂鸦体
  });

  // 涂鸦/图钉默认色偏深，在墨绿上会糊 → 统一转浅
  (Array.isArray(layout.doodles) ? layout.doodles : []).forEach(d => {
    if (d && (hexLum(d.color) < 150)) d.color = '#F0EAD8';
  });
  (Array.isArray(layout.pins) ? layout.pins : []).forEach(p => {
    if (p && typeof p.color === 'string' && hexLum(p.color) < 150) p.color = 'white';
  });

  _v3Trace('🌿 墨绿皮肤已应用（bg ' + layout.bg_color + '，文字转浅 ' + texts.length + ' 条）');
  return layout;
}

/**
 * v3.17 简约清新贴纸库：墨绿底 + 大留白 → 把绿色系（主，权重 ×2）+ 蓝色系（点缀）的
 * 实物贴纸随机撒进空白区。与 buildVintageStickers 的差别：
 *  - **只做「空白填充」一个阶段**（不做照片边角叠贴）——参考图的调性是把贴纸放在留白里"飘着"；
 *  - 数量（v3.19 加量）：版面越空越多，6 ~ 15 枚；尺寸中等（长边 ≈185px），避免把留白填满；
 *  - 允许贴纸压到照片外沿（手帐拼贴感），但绝不压照片中心、不挡文字。
 * layout.library = [{ file, x, y, w, h, rotate, shadow }] → assets/stickers/minimal/<file>.png
 */
function buildFreshStickers(layout) {
  const lib = (window.DiaryTemplates && window.DiaryTemplates.freshLibrary)
    ? window.DiaryTemplates.freshLibrary() : [];
  if (!lib.length) return { placed: 0 };

  const canvasW = layout.canvas_width || 1080;
  const canvasH = layout.canvas_height || 1440;

  // 禁区：照片核心区(内缩 30px) + 文字（保证可读）+ 抠图主体
  const occupied = collectVintageLibRects(layout);
  if (Array.isArray(layout.cutouts)) {
    for (const c of layout.cutouts) {
      if (c && c.w > 0 && c.h > 0) occupied.push({ x: c.x, y: c.y, w: c.w, h: c.h });
    }
  }

  layout.library = layout.library || [];
  const allPlaced = [];
  // 把已有 library 也算进避让（例如再次生成时残留）
  (layout.library || []).forEach(l => {
    if (l && l.w > 0 && l.h > 0) allPlaced.push({ x: l.x - 8, y: l.y - 8, w: l.w + 16, h: l.h + 16 });
  });

  // 洗牌（freshLibrary 已是「绿 ×2 + 蓝 ×1」的加权池）
  const pool = lib.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }
  // 去重取用：加权池里绿色有 2 份，直接顺序取会出现「同一朵四叶草贴两遍」。
  // 这里保证**单张手帐内每枚贴纸只用一次**，权重只影响它出现在取用序列里的先后概率。
  const usedFiles = new Set();
  let cursor = 0;
  const takeNext = () => {
    let guard = 0;
    while (guard++ < pool.length) {
      const s = pool[cursor % pool.length]; cursor++;
      if (!usedFiles.has(s.f)) { usedFiles.add(s.f); return s; }
    }
    return null;
  };

  // 空白率 → 目标枚数（v3.19 用户反馈"整体有点空" → 上限 9→16、下限 3→7，并对中段留白加权 1.2）
  const totalArea = canvasW * canvasH;
  let occupiedArea = 0;
  for (const r of occupied) {
    const ox = Math.max(0, Math.min(r.x + r.w, canvasW) - Math.max(0, r.x));
    const oy = Math.max(0, Math.min(r.y + r.h, canvasH) - Math.max(0, r.y));
    occupiedArea += ox * oy;
  }
  const freeRatio = Math.max(0, Math.min(1, (totalArea - occupiedArea) / totalArea));
  const MAX_N = 16, MIN_N = 7;
  let target = Math.max(MIN_N, Math.min(MAX_N, Math.round(MIN_N + freeRatio * (MAX_N - MIN_N) * 1.2)));
  if (freeRatio < 0.10) target = 3;

  // 分散策略：把画布按 3×3 均分，洗牌后**每枚贴纸独占一格** → 贴纸天然散落各象限。
  // （旧的「9 点锚点 + 行优先环绕扫描」在照片密的版面上会全部被吸到最下方那条大空白带，
  //   排成整齐一行，很机械。）
  // v3.19：格数不变但**跑两轮**（每轮重新洗牌格子），让 15 枚的上限也铺得开、不叠在一起。
  const GX = 3, GY = 3, CELL_PAD = 30;
  const cellW = (canvasW - 2 * CELL_PAD) / GX;
  const cellH = (canvasH - 2 * CELL_PAD) / GY;
  const cells = [];
  for (let gy = 0; gy < GY; gy++) {
    for (let gx = 0; gx < GX; gx++) {
      cells.push({
        x: Math.round(CELL_PAD + gx * cellW), y: Math.round(CELL_PAD + gy * cellH),
        w: Math.round(cellW), h: Math.round(cellH)
      });
    }
  }
  const shuffleCells = () => {
    for (let i = cells.length - 1; i > 0; i--) {          // 洗牌格子 → 每轮落点不同
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = cells[i]; cells[i] = cells[j]; cells[j] = tmp;
    }
  };
  shuffleCells();

  const CELL_TRIES = 5;                                  // 每格最多试 5 枚候选，避免死格拖慢
  let placed = 0;
  const PASSES = 2;                                      // v3.19 两轮铺贴
  for (let pass = 0; pass < PASSES && placed < target; pass++) {
    if (pass > 0) shuffleCells();
    for (let ci = 0; ci < cells.length && placed < target; ci++) {
      const cell = cells[ci];
      // 挨个试新贴纸，直到有一枚能落在这一格里；全试完仍放不下就放弃这一格
      for (let tries = 0; tries < CELL_TRIES; tries++) {
        const s = takeNext();
        if (!s) break;
        // 实物贴纸等比放进槽位：长边 ≈185px、短边 ≥60px，最多放大 1.5 倍（不拉伸变形）
        const sz = fitStickerSize(s, 185, 60, 1.5);
        if (Math.max(sz.w, sz.h) < 64) continue;
        const sp = findFreeSpot(occupied, { w: sz.w, h: sz.h }, allPlaced, canvasW, canvasH, {
          minSide: 46,
          scales: [1, 0.88, 0.76, 0.64, 0.54],
          region: cell,
          pickRandom: true
        });
        if (!sp) continue;
        allPlaced.push({ x: sp.x - 14, y: sp.y - 14, w: sp.w + 28, h: sp.h + 28 });
        layout.library.push({
          file: s.f, x: sp.x, y: sp.y, w: sp.w, h: sp.h,
          rotate: Math.round((Math.random() * 8 - 4) * 10) / 10, shadow: true, z: 24
        });
        placed++;
        break;
      }
    }
  }

  _v3Trace('🌱 清新贴纸库拼接 ' + placed + ' 枚（空白率 ' + (freeRatio * 100).toFixed(0) +
    '%，目标 ' + target + '，池 ' + lib.length + '）');
  return { placed: placed };
}

/**
 * v3.19 简约清新「浅色柔光圆角星」点缀
 * -----------------------------------------------------------------------------
 * 用户参考图（星星特写）要求：**浅绿白**（≈#C8E2CE）、**粗圆角描边**、**边缘柔光晕**、
 * 尺寸比原先大一圈的空心星。原 v3.18 是青色细描边星，已按参考图替换。
 *  - 只贴星星这一种形状（克制，"一点点缀"，不抢照片）
 *  - 全部空心（hollow=true → 渲染器只描边不填充）
 *  - 圆角（rounded=true → 渲染器用二次贝塞尔倒角）+ 光晕（glow → shadowBlur）
 *  - 只落在真留白里：避开照片核心区 / 文字 / 便签核心区 / 抠图主体 / 已放的实物贴纸
 *  - 距画布四边 ≥ MARGIN（含光晕半径，星角绝不被裁），彼此也不重叠
 * A/B 开关：控制台 `window.__DIARY_NO_FRESH_STARS = true` 可整体关掉
 */
/**
 * v3.22 把版面里所有会画到画布上的文字拼起来，喂给 fonts.load() 用。
 * 切片字体（unicode-range）只下载「用到的字」所在的分片，所以必须喂真实文案而非示例句。
 */
function collectLayoutText(layout) {
  if (!layout || typeof layout !== 'object') return '';
  const parts = [];
  (Array.isArray(layout.texts) ? layout.texts : []).forEach(t => {
    if (t && typeof t.content === 'string') parts.push(t.content);
  });
  (Array.isArray(layout.items) ? layout.items : []).forEach(it => {
    if (it && typeof it.caption === 'string') parts.push(it.caption);
  });
  (Array.isArray(layout.note) ? layout.note : []).forEach(n => {
    if (n && typeof n.content === 'string') parts.push(n.content);
  });
  return parts.join('');
}

/**
 * v3.18 确保「手写涂鸦体」真的下载完再画
 * Canvas 的 fillText 不会触发字体下载，而 document.fonts.ready 只等"已经在排队"的字体，
 * 所以必须先 fonts.load() 点名要一次，否则会先画出系统默认字体，再也不会重绘。
 * ⚠ 必须先 await document.fonts.ready：否则样式表里的 @font-face 还没注册进
 *   document.fonts，load() 匹配不到任何 FontFace，静默返回空数组 → 字体永不下载。
 */
async function ensureFreshFonts(sampleText) {
  if (!(document.fonts && document.fonts.load)) return;
  const probe = (typeof sampleText === 'string' && sampleText.length) ? sampleText : '旅行手帐记录美好时光';
  try { await document.fonts.ready; } catch (e) { /* ignore */ }
  try {
    await Promise.all([
      document.fonts.load('40px "ZCOOL KuaiLe"', probe),
      document.fonts.load('32px "Patrick Hand"', 'Travel'),
      document.fonts.load('32px "Gaegu"', 'Travel')
    ]);
  } catch (e) { /* 加载失败 → 退回后面的系统手写体，不阻断出图 */ }
  try { await document.fonts.ready; } catch (e) { /* ignore */ }
}

function buildFreshStars(layout) {
  if (window.__DIARY_NO_FRESH_STARS) return { placed: 0 };
  const canvasW = layout.canvas_width || 1080;
  const canvasH = layout.canvas_height || 1440;

  // 禁区 = 照片核心区 + 文字 + 便签核心区，再并入抠图主体与已放的实物贴纸
  const occupied = collectVintageLibRects(layout);
  (Array.isArray(layout.cutouts) ? layout.cutouts : []).forEach(c => {
    if (c && c.w > 0 && c.h > 0) occupied.push({ x: c.x, y: c.y, w: c.w, h: c.h });
  });
  (Array.isArray(layout.library) ? layout.library : []).forEach(l => {
    if (l && l.w > 0 && l.h > 0) occupied.push({ x: l.x - 6, y: l.y - 6, w: l.w + 12, h: l.h + 12 });
  });

  // 留白比例 → 目标数量（6~18 枚；v3.19 星星调大后略增数量保持"满天"感）
  const totalArea = canvasW * canvasH;
  let occupiedArea = 0;
  for (const r of occupied) {
    const ox = Math.max(0, Math.min(r.x + r.w, canvasW) - Math.max(0, r.x));
    const oy = Math.max(0, Math.min(r.y + r.h, canvasH) - Math.max(0, r.y));
    occupiedArea += ox * oy;
  }
  const freeRatio = Math.max(0, Math.min(1, (totalArea - occupiedArea) / totalArea));
  const target = Math.max(6, Math.min(18, Math.round(6 + freeRatio * 14)));

  layout.doodles = Array.isArray(layout.doodles) ? layout.doodles : [];
  const taken = [];
  const MARGIN = 34;                    // 距画布边 ≥34px → 旋转后的星角 + 光晕都不会被裁
  let placed = 0;
  for (let tries = 0; tries < 900 && placed < target; tries++) {
    const s = 32 + Math.round(Math.random() * 56);                 // 32~88px（比 v3.18 大一圈）
    const r = {
      x: Math.round(MARGIN + Math.random() * Math.max(1, canvasW - MARGIN * 2 - s)),
      y: Math.round(MARGIN + Math.random() * Math.max(1, canvasH - MARGIN * 2 - s)),
      w: s, h: s
    };
    if (occupied.some(o => rectsOverlap(r, o))) continue;           // 不压照片/文字
    if (taken.some(o => rectsOverlap(r, o))) continue;              // 星星彼此（含光晕）不重叠
    const pad = Math.round(s * 0.5);                                // 光晕外扩，别让两团光糊在一起
    taken.push({ x: r.x - pad, y: r.y - pad, w: s + pad * 2, h: s + pad * 2 });
    layout.doodles.push({
      kind: 'star',
      x: r.x, y: r.y, w: s, h: s,
      color: FRESH_ACCENT,
      hollow: true,                                   // 空心：只描边不填充
      rounded: true,                                  // v3.19 圆角星（参考图那种软糯星）
      round: 0.05,                                    // 外尖倒角 = 尺寸 × 0.05（约边长 16%，"尖而柔"）
      roundInner: 0.014,                              // 内凹角几乎不倒 → 保住五角轮廓
      stroke: Math.max(3, Math.round(s * 0.10)),      // 粗一点，更像马克笔勾的
      glow: Math.round(s * 0.40),                     // v3.19 边缘柔光晕（别太大，否则糊成一团）
      rotate: Math.round((Math.random() * 70 - 35) * 10) / 10,
      opacity: Math.round((0.5 + Math.random() * 0.3) * 100) / 100
    });
    placed++;
  }

  _v3Trace('✦ 浅色柔光星 ' + placed + ' 枚（空白率 ' + (freeRatio * 100).toFixed(0) +
    '%，目标 ' + target + '）');
  return { placed: placed };
}

/* ================= v3.20 多彩活泼：皮肤 + 贴纸库 + 浪点 ================= */

/**
 * v3.20 多彩活泼：把 AI 给的 layout 套上「主题色皮肤」
 *  - bg = theme.bg（4 套随机）
 * v3.21 变更：
 *  - 照片边框**强制统一白色细边框**（thin_white / 12px），不再让 AI 出彩色粗框
 *    —— 用户反馈「照片边框统一用白色细边框」
 *  - 文字、涂鸦、图钉按 ink 是 dark/light 转深浅
 *  - 字体 = 'pen'（v3.22 起：细笔硬笔行楷 · 宏雷行书，替代原 'lively' 圆头涂鸦体）
 *  - tapeFiles = theme.tapes 权重池 → buildAutoPhotoTapes 每张照片会贴一条同色系胶带
 *
 * 彩色相框感改由「真实和纸胶带图的色调」提供（蓝主题=蓝胶带，粉=粉胶带…）。
 */
function applyColorfulSkin(layout, theme) {
  if (!layout || !theme) return layout;
  layout.style = 'colorful';
  layout.bg_color = theme.bg;
  layout.bg_gradient = null;
  layout.bg_paper_lines = false;
  layout.bg_paper_aged = false;
  layout.grade = null;

  // —— v3.21 照片边框统一「白色细边框」——
  // AI 在 colorful 预设里爱出 color_frame（马卡龙粗彩框，24px 圆角），
  // 与「贴纸 + 胶带」的实物拼贴感打架，且 4 色主题下彩框会跟主题色串色 → 一律压成白细边。
  (Array.isArray(layout.items) ? layout.items : []).forEach(it => {
    if (!it) return;
    it.border = 'thin_white';
    it.border_width = COLORFUL_PHOTO_BORDER_W;   // 12px：细，不抢戏
    it.border_color = null;                       // 走 borderMetrics 的 #FFFFFF
    it.frame = null;                              // 清掉 AI 可能给的旧字段（frame/frame_color）
    it.frame_color = null;
    it.borderColor = null;
  });

  // 文字颜色：深底用浅字，浅底用深字
  const texts = Array.isArray(layout.texts) ? layout.texts : [];
  let mainIdx = -1, mainSize = -1;
  texts.forEach((t, i) => {
    const s = Number(t && t.font_size) || 0;
    if (s > mainSize) { mainSize = s; mainIdx = i; }
  });
  texts.forEach((t, i) => {
    if (!t) return;
    t.color = (i === mainIdx) ? theme.textMain : theme.textColors[i % theme.textColors.length];
    t.stroke = 0;
    t.font = COLORFUL_FONT;          // v3.23 Caveat 英文连笔（漏出的中文走宏雷行书兜底）
    // v3.22 AI 预设要求主标题 bold=true，而 canvas 会给无粗体字面的细笔行书
    // 合成「伪粗」——笔画被撑糊，丢掉样张那种提按分明的细笔感 → 一律关掉，
    // 靠字号本身（80~110）撑分量。
    t.bold = false;
  });

  // 涂鸦默认色按 ink 方向统一换色
  const hexLum = (hex) => {
    const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex || '').trim());
    if (!m) return 255;
    const v = parseInt(m[1], 16);
    return 0.299 * ((v >> 16) & 255) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255);
  };
  const doodleTarget = theme.doodle;
  (Array.isArray(layout.doodles) ? layout.doodles : []).forEach(d => {
    if (!d) return;
    if (theme.ink === 'light') {           // 深底 → 涂鸦统一用主题浅色，AI 给的深色会糊
      if (hexLum(d.color) < 150) d.color = doodleTarget;
    } else {                                // 浅底 → 涂鸦统一用主题深色，AI 给的浅色会糊
      if (hexLum(d.color) > 180) d.color = doodleTarget;
    }
  });
  // 图钉统一换成主题点缀色
  (Array.isArray(layout.pins) ? layout.pins : []).forEach(p => {
    if (p && typeof p.color === 'string') p.color = theme.pin;
  });

  // 切掉 AI 自带的 tape / tapeFiles（前端会按主题权重新生成）
  layout.tapes = Array.isArray(layout.tapes) ? [] : [];
  // tapeFiles：[{f,w,h}]，让 buildAutoPhotoTapes 按宽高比挑一条贴每张照片顶边
  if (window.DiaryTemplates && window.DiaryTemplates.colorfulTapePool) {
    const pool = window.DiaryTemplates.colorfulTapePool(theme.tapes || []);
    layout.tapeFiles = pool.slice();        // 直接给加权池（不重排；渲染器顺序取）
  }
  // 关闭 tapes_auto 让 AI 给的"tapesAuto:true"不再走老的 washi_* drawTapeItem 默认路径
  layout.tapes_auto = true;                 // 但 tapeFiles 已替代真实胶带图，因此仍开 auto

  _v3Trace('🌈 多彩皮肤已应用（' + theme.name + ' / bg ' + theme.bg + '，胶带池 ' +
    (layout.tapeFiles ? layout.tapeFiles.length : 0) + ' 张，文字 ' + texts.length + ' 条）');
  return layout;
}

/**
 * v3.20 多彩活泼「可爱贴纸 + 飘落胶带」库
 * -----------------------------------------------------------------------------
 * 用户参考图：底色 pastel + 照片 + 大留白里铺**实体贴纸**和**飘落的和纸胶带条**
 *  - 贴纸：来源是 segment_colorful.py 切的 s_01..28（韩系可爱），4 色主题通用
 *  - 飘落胶带：除了 buildAutoPhotoTapes 贴在照片边的胶带外，再额外在留白里铺
 *    3~5 条「倾斜 30~70°、半透明、可叠加照片边」的和纸胶带（对应参考图的胶带斜贴感）
 *
 * 与 buildFreshStickers 的差别：
 *  - 贴纸数量按留白 + 照片张数收敛（v3.21：5 ~ 11 枚；照片越多贴得越少越小）
 *  - 贴纸分「大 / 中 / 小」三档（v3.21：用户要"有一些小一点有一些大一点"），
 *    并保证一版里大、小都至少出现一枚
 *  - 多一个"飘落胶带"阶段：在不同九宫格位里横斜贴 2~4 条（不放照片中心）
 *  - 不做星星点缀（活泼主题已经有大量元素，不需要加星）
 */
function buildColorfulStickers(layout, theme) {
  const lib = (window.DiaryTemplates && window.DiaryTemplates.colorfulLibrary)
    ? window.DiaryTemplates.colorfulLibrary() : [];
  if (!lib.length) return { placed: 0 };

  const canvasW = layout.canvas_width || 1080;
  const canvasH = layout.canvas_height || 1440;

  // 禁区：照片核心区（v3.21 内缩收紧到 14 → 贴纸离照片白边更远，减少"糊在一起"的拥挤感）
  //       + 文字（pad 加大到 16）+ 抠图主体
  const occupied = collectVintageLibRects(layout, { photoInset: 14, textPad: 16 });
  if (Array.isArray(layout.cutouts)) {
    for (const c of layout.cutouts) {
      if (c && c.w > 0 && c.h > 0) occupied.push({ x: c.x - 10, y: c.y - 10, w: c.w + 20, h: c.h + 20 });
    }
  }

  layout.library = layout.library || [];
  const allPlaced = [];
  (layout.library || []).forEach(l => {
    if (l && l.w > 0 && l.h > 0) allPlaced.push({ x: l.x - 10, y: l.y - 10, w: l.w + 20, h: l.h + 20 });
  });

  // 洗牌（活泼比 minimal 更激进，每枚贴纸尺寸也更大）
  const pool = lib.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }
  const usedFiles = new Set();
  let cursor = 0;
  // v3.21 改为「按条件挑」而不是「顺序取」：
  // 大贴纸需要方正（长宽比不能太扁），顺序取经常抽到细长条 → 大档永远放不下。
  const pickSticker = (pred) => {
    for (let i = 0; i < pool.length; i++) {
      const s = pool[(cursor + i) % pool.length];
      if (!s || usedFiles.has(s.f)) continue;
      if (pred && !pred(s)) continue;
      usedFiles.add(s.f);
      cursor = (cursor + i + 1) % pool.length;
      return s;
    }
    return null;
  };
  const longOf = (s) => Math.max(s.w, s.h);
  const chunkiness = (s) => (longOf(s) ? Math.min(s.w, s.h) / longOf(s) : 0);

  // 留白比例 → 目标数量
  // v3.21 收敛：用户反馈"贴纸杂乱拥挤" → 上限 18→11、下限 8→5，
  // 并叠加「照片越多 → 版面越挤 → 贴纸越少」的拥挤惩罚（crowd）
  const totalArea = canvasW * canvasH;
  let occupiedArea = 0;
  for (const r of occupied) {
    const ox = Math.max(0, Math.min(r.x + r.w, canvasW) - Math.max(r.x, 0));
    const oy = Math.max(0, Math.min(r.y + r.h, canvasH) - Math.max(r.y, 0));
    occupiedArea += ox * oy;
  }
  const freeRatio = Math.max(0, Math.min(1, (totalArea - occupiedArea) / totalArea));
  const photoN = (Array.isArray(layout.items) ? layout.items.length : 0);
  const crowd = Math.max(0, Math.min(1, (photoN - 2) / 6));    // 2 张 → 0，8 张及以上 → 1
  const MAX_N = 11, MIN_N = 5;
  let target = Math.round((MIN_N + freeRatio * (MAX_N - MIN_N)) * (1 - crowd * 0.3));
  target = Math.max(3, Math.min(MAX_N, target));
  if (freeRatio < 0.10) target = 4;

  // 3×3 网格独占一格
  const GX = 3, GY = 3, CELL_PAD = 44;     // v3.21 30→44：贴纸不贴画布边，留呼吸感
  const cellW = (canvasW - 2 * CELL_PAD) / GX;
  const cellH = (canvasH - 2 * CELL_PAD) / GY;
  const cells = [];
  for (let gy = 0; gy < GY; gy++) {
    for (let gx = 0; gx < GX; gx++) {
      cells.push({
        x: Math.round(CELL_PAD + gx * cellW), y: Math.round(CELL_PAD + gy * cellH),
        w: Math.round(cellW), h: Math.round(cellH)
      });
    }
  }
  const shuffleCells = () => {
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = cells[i]; cells[i] = cells[j]; cells[j] = tmp;
    }
  };
  shuffleCells();

  // —— v3.21 尺寸三档：大 / 中 / 小 ——
  // 用户反馈「图片多的时候可以有一些小一点有一些大一点」：
  // 以前所有贴纸都按长边 200 等比缩放 → 大小整齐划一，铺满后像"贴纸雨"，显乱。
  // 现在按 2:5:4 的权重抽档，大枚当视觉锚点、小枚做点缀，层次拉开；
  // 再叠一个 sizeBias —— 照片越多 / 留白越少，整体尺寸越收（避免挤成一团）。
  const SIZE_TIERS = {
    // 大：每版 1~2 枚，当视觉锚点（要求方正，细长条不配当"大"）
    L: { k: 'L', lo: 162, hi: 202, short: 96, maxScale: 1.9, scales: [1, 0.94, 0.88],
         pred: (s) => chunkiness(s) >= 0.55 },
    // 中：主体
    M: { k: 'M', lo: 110, hi: 146, short: 66, maxScale: 1.7, scales: [1, 0.92, 0.84, 0.76],
         pred: null },
    // 小：点缀，塞缝隙
    S: { k: 'S', lo: 62,  hi: 92,  short: 44, maxScale: 1.5, scales: [1, 0.92, 0.84, 0.76],
         pred: null }
  };
  // 拥挤惩罚只作用一次（照片越多 → 整体略收）。
  // 早前版本把它和「留白不足」连乘 → sizeBias 掉到 0.68，"大"档被压成"中"，全版没有大小差。
  const sizeBias = Math.max(0.80, 1 - crowd * 0.18);
  const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  // 尺寸计划：**保证**一版里同时出现「大」和「小」（用户要的层次感），再打乱顺序
  const plan = [];
  const nL = Math.max(1, Math.min(2, Math.round(target * 0.25)));
  const nS = Math.max(1, Math.min(3, Math.round(target * 0.4)));
  for (let i = 0; i < nL; i++) plan.push(SIZE_TIERS.L);
  for (let i = 0; i < nS; i++) plan.push(SIZE_TIERS.S);
  while (plan.length < target) plan.push(SIZE_TIERS.M);
  for (let i = plan.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = plan[i]; plan[i] = plan[j]; plan[j] = tmp;
  }

  let placed = 0, planIdx = 0;
  const CELL_TRIES = 5;
  // v3.21 3 轮 → 2 轮：目标数已降，再叠 3 轮会把空格也填满
  const PASSES = 2;
  stickerLoop:
  for (let pass = 0; pass < PASSES && placed < target; pass++) {
    if (pass > 0) shuffleCells();
    for (let ci = 0; ci < cells.length && placed < target; ci++) {
      const cell = cells[ci];
      for (let tries = 0; tries < CELL_TRIES; tries++) {
        const tier = plan[Math.min(planIdx, plan.length - 1)] || SIZE_TIERS.M;
        const s = pickSticker(tier.pred);
        if (!s) break stickerLoop;                     // 池里没有合适（方正/未用）的贴纸了
        const long = Math.max(58, Math.round(randInt(tier.lo, tier.hi) * sizeBias));
        const sz = fitStickerSize(s, long, Math.round(tier.short * sizeBias), tier.maxScale);
        if (Math.max(sz.w, sz.h) < 44) { usedFiles.delete(s.f); continue; }
        const sp = findFreeSpot(occupied, { w: sz.w, h: sz.h }, allPlaced, canvasW, canvasH, {
          minSide: Math.max(40, Math.round(tier.short * sizeBias * 0.8)),
          scales: tier.scales,
          region: cell,
          pickRandom: true
        });
        // 放不下就把这枚**退回池子**（否则一轮失败就吃掉一枚，28 枚的池很快就抽干 → 只贴出 3 枚）
        if (!sp) { usedFiles.delete(s.f); continue; }
        planIdx++;
        // 贴纸之间的自留白按自身尺寸给（大贴纸给得更多）：不许互相压边，视觉上就不会"杂"
        const pad = Math.round(Math.max(20, Math.max(sp.w, sp.h) * 0.16));
        allPlaced.push({ x: sp.x - pad, y: sp.y - pad, w: sp.w + pad * 2, h: sp.h + pad * 2 });
        layout.library.push({
          file: s.f, x: sp.x, y: sp.y, w: sp.w, h: sp.h,
          rotate: Math.round((Math.random() * 12 - 6) * 10) / 10,   // ±6°，太歪会显乱
          shadow: true, z: 24
        });
        placed++;
        break;
      }
    }
  }

  // —— 阶段 2：留白里「飘落胶带」2~4 条（横斜贴、半透明、可压在照片边角） ——
  // 注意：buildAutoPhotoTapes 已经给每张照片顶边自动贴了一条（顶边吸附）；
  // 这里在留白里**再**斜贴几条，强化"活泼手帐随手贴"感
  // v3.21：3~5 → 2~4 条（照片多时只贴 2 条），长度也分长短两档，避免一版全是同长度胶带
  const tapePool = window.DiaryTemplates && window.DiaryTemplates.colorfulTapePool
    ? window.DiaryTemplates.colorfulTapePool(theme.tapes || []) : [];
  const looseTapeCount = Math.max(2, Math.round(4 - crowd * 1.6) - (Math.random() < 0.4 ? 1 : 0));
  const usedTapes = new Set();
  let tapePlaced = 0;
  layout.tapes = Array.isArray(layout.tapes) ? layout.tapes : [];
  for (let t = 0; t < 80 && tapePlaced < looseTapeCount; t++) {
    if (!tapePool.length) break;
    let meta = null, guard2 = 0;
    while (guard2++ < tapePool.length) {
      const cand = tapePool[Math.floor(Math.random() * tapePool.length)];
      if (!usedTapes.has(cand.f)) { usedTapes.add(cand.f); meta = cand; break; }
    }
    if (!meta) break;
    // 长短两档：75% 中短条（96~180）、25% 长条（190~265）
    const isLong = Math.random() < 0.25;
    const fw = Math.round((isLong ? 190 + Math.random() * 75 : 96 + Math.random() * 84) * sizeBias);
    const aspect = (meta.w > 0 && meta.h > 0) ? (meta.w / meta.h) : 3.6;
    const fh = Math.max(18, Math.min(64, Math.round(fw / aspect)));
    const sp = findFreeSpot(
      occupied.concat(allPlaced),
      { w: fw, h: fh },
      [{ x: -2000, y: -2000, w: 0, h: 0 }].concat(allPlaced),  // 强制避开自己前面贴的胶带
      canvasW, canvasH,
      { minSide: 36, scales: [1, 0.9, 0.78, 0.66], pickRandom: true, margin: 30 }
    );
    if (!sp) continue;
    const rot = Math.round((Math.random() * 118 - 59) * 10) / 10;   // -59~+59° 大角度斜贴
    // v3.21：findFreeSpot 只按「未旋转的矩形」判碰撞，而画出来的是旋转后的 AABB ——
    // 60° 斜贴时真实占位比 w×h 大一大截，会横穿照片（用户反馈的"杂乱"来源之一）。
    // 这里补一次「旋转 AABB 对照片的覆盖率」校验：超过 20% 就换位，轻贴边角仍允许。
    const th = Math.abs(rot) * Math.PI / 180;
    const aabbW = Math.abs(fw * Math.cos(th)) + Math.abs(fh * Math.sin(th));
    const aabbH = Math.abs(fw * Math.sin(th)) + Math.abs(fh * Math.cos(th));
    const box = { x: sp.x - (aabbW - fw) / 2, y: sp.y - (aabbH - fh) / 2, w: aabbW, h: aabbH };
    let heavy = false;
    for (let oi = 0; oi < occupied.length && !heavy; oi++) {
      const r = occupied[oi];
      const ox = Math.max(0, Math.min(box.x + box.w, r.x + r.w) - Math.max(box.x, r.x));
      const oy = Math.max(0, Math.min(box.y + box.h, r.y + r.h) - Math.max(box.y, r.y));
      if (ox * oy > 0.20 * (r.w * r.h)) heavy = true;
    }
    if (heavy) continue;
    layout.tapes.push({
      x: sp.x, y: sp.y, w: sp.w, h: sp.h,
      rotate: rot,
      opacity: 0.86, file: meta.f, z: 22
    });
    allPlaced.push({ x: sp.x - 16, y: sp.y - 16, w: sp.w + 32, h: sp.h + 32 });
    tapePlaced++;
  }

  _v3Trace('🎨 多彩活泼: 贴纸 ' + placed + ' 枚 + 飘落胶带 ' + tapePlaced +
    ' 条（空白率 ' + (freeRatio * 100).toFixed(0) + '%，目标 ' + target + '）');
  return { placed: placed, tapes: tapePlaced };
}

/**
 * v3.54 水彩手绘「钢笔淡彩」皮肤：水彩纸米白底 + 细钢笔勾轮廓 + 墨色手写。
 * 只动皮肤层，不碰照片坐标。与两条生成路径共用。
 */
function applyWatercolorSkin(layout) {
  if (!layout || typeof layout !== 'object') return layout

  const hexLum = (hex) => {
    const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex || '').trim())
    if (!m) return 128
    const v = parseInt(m[1], 16)
    return 0.299 * ((v >> 16) & 255) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)
  }

  layout.style = 'watercolor'
  layout.bg_color = WC_BG_COLOR
  layout.bg_gradient = null
  layout.bg_paper_lines = false
  layout.bg_paper_aged = false
  layout.grade = null
  layout.bg_noise = true
  layout.bg_image = Object.assign({}, layout.bg_image || {}, {
    src: WC_BG_IMAGE, dim: 0, vignette: 0, fit: 'cover'
  })

  ;(Array.isArray(layout.items) ? layout.items : []).forEach((it) => {
    if (!it) return
    it.border = WC_BORDER
    it.border_color = it.border_color || it.borderColor || WC_BORDER_COLOR
    it.border_width = WC_BORDER_W
  })

  const texts = Array.isArray(layout.texts) ? layout.texts : []
  let mainIdx = -1
  let mainSize = -1
  texts.forEach((t, i) => {
    const s = Number(t && t.font_size) || 0
    if (s > mainSize) { mainSize = s; mainIdx = i }
  })
  const hasCJK = (s) => /[\u3400-\u9FFF\uF900-\uFAFF\u3000-\u303F]/.test(String(s || ''))
  texts.forEach((t, i) => {
    if (!t) return
    t.color = (i === mainIdx) ? WC_INK : WC_TEXT_COLORS[i % WC_TEXT_COLORS.length]
    t.stroke = 0
    if (hasCJK(t.content) || !t.font) t.font = WC_FONT
  })
  enlargeTopRightText(layout)

  ;(Array.isArray(layout.doodles) ? layout.doodles : []).forEach((d) => {
    if (!d) return
    if (d.fill && hexLum(d.fill) > 200) d.fill = WC_SPARKLE
    if (d.color && hexLum(d.color) > 200) d.color = WC_SPARKLE
    if (d.color && hexLum(d.color) < 30) d.color = WC_INK
  })
  ;(Array.isArray(layout.pins) ? layout.pins : []).forEach((p) => {
    if (p && typeof p.color === 'string' && hexLum(p.color) > 200) p.color = WC_SPARKLE
  })
  ;(Array.isArray(layout.widgets) ? layout.widgets : []).forEach((w) => {
    if (!w || w.type !== 'sticky_note') return
    if (typeof w.color === 'string' && hexLum(w.color) > 210) w.color = '#F5E7C8'
    if (hasCJK(w.text) || hasCJK(w.content)) {
      w.data = Object.assign({}, w.data || {}, { font: WC_FONT })
    }
  })

  return layout
}

/**
 * v3.61 水彩模板：照片垂直再平衡（上半挤成一团、下半大片空白时拉开到底部）。
 * 只动 y，x/宽高不动；与文字/抠图冲突时整体放弃。
 */
function balanceWatercolorPhotoSpread(layout) {
  try {
    const items = (layout.items || []).filter((it) => it && it.width > 60 && it.height > 60)
    if (items.length < 3) return
    const canvasH = layout.canvas_height || 1440
    const sorted = items.slice().sort((a, b) => a.y - b.y)

    const linkGap = []
    let crowded = false
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i]
      const b = sorted[i + 1]
      const xOverlap = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
      const linked = xOverlap > Math.min(a.width, b.width) * 0.3
      const g = linked ? (b.y - (a.y + a.height)) : 0
      if (linked && g < 20) crowded = true
      linkGap.push({ linked, gap: g })
    }
    if (!crowded) return

    const targetBottom = canvasH - 64
    const place = (minGap, stretch) => {
      const newY = new Array(sorted.length)
      let delta = 0
      let prevBottom = -Infinity
      let bottom = -Infinity
      for (let i = 0; i < sorted.length; i++) {
        const it = sorted[i]
        if (i === 0) newY[i] = it.y
        else if (linkGap[i - 1].linked) newY[i] = prevBottom + Math.max(linkGap[i - 1].gap, minGap) * stretch
        else newY[i] = it.y + delta
        delta = newY[i] - it.y
        prevBottom = Math.max(prevBottom, newY[i] + it.height)
        bottom = Math.max(bottom, newY[i] + it.height)
      }
      return { newY, bottom }
    }

    let lo = 8
    let hi = 64
    let best = 0
    let bestY = null
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      const r = place(mid, 1)
      if (r.bottom <= targetBottom) { best = mid; bestY = r.newY; lo = mid + 1 }
      else hi = mid - 1
    }
    if (!bestY) return

    let bottom = 0
    for (let i = 0; i < sorted.length; i++) bottom = Math.max(bottom, bestY[i] + sorted[i].height)
    const extra = targetBottom - bottom
    if (extra > 2) {
      let sumG = 0
      for (const lg of linkGap) if (lg.linked) sumG += Math.max(lg.gap, best)
      if (sumG > 0) {
        const r2 = place(best, (sumG + extra) / sumG)
        let b2 = 0
        for (let i = 0; i < sorted.length; i++) b2 = Math.max(b2, r2.newY[i] + sorted[i].height)
        if (b2 <= targetBottom + 2) bestY = r2.newY
      }
    }

    const willMove = new Map()
    for (let i = 0; i < sorted.length; i++) {
      const dy = Math.round(bestY[i] - sorted[i].y)
      if (dy > 0.5) willMove.set(sorted[i], dy)
    }
    if (!willMove.size) return

    const blocked = []
    ;(layout.texts || []).forEach((t) => {
      if (!t || !t.content) return
      const fs = t.font_size || 24
      let tw = 0
      for (const ch of String(t.content)) tw += ch.charCodeAt(0) > 0x2e80 ? fs : fs * 0.56
      blocked.push({ x: t.x - 8, y: t.y - 8, w: Math.min(tw, 960) + 16, h: fs * 1.5 + 16 })
    })
    if (Array.isArray(layout.cutouts)) {
      for (const c of layout.cutouts) if (c && c.w > 0 && c.h > 0) blocked.push(c)
    }
    for (const [it, dy] of willMove) {
      for (const b of blocked) {
        if (it.x < b.x + b.w && b.x < it.x + it.width &&
            it.y + dy < b.y + b.h && b.y < it.y + dy + it.height) {
          return
        }
      }
    }

    for (const [it, dy] of willMove) it.y += dy
  } catch (e) {
    console.warn('[Diary] 照片再平衡失败（忽略）', e)
  }
}

/**
 * v3.24 暗黑贴纸库：照片边角（贴外圈）+ 空白区自适应填。
 * 库来自 darkLibrary()（d1 黑物 / d2 黑白音乐拼贴 ×2，d3 黑底拼贴 ×1，均带白描边）。
 */
function buildDarkStickers(layout) {
  const lib = (window.DiaryTemplates && window.DiaryTemplates.darkLibrary)
    ? window.DiaryTemplates.darkLibrary() : []
  if (!lib.length) return { placed: 0 }

  const canvasW = layout.canvas_width || 1080
  const canvasH = layout.canvas_height || 1440

  const fillOccupied = collectVintageLibRects(layout)
  const cornerOccupied = []
  ;(layout.texts || []).forEach((t) => {
    if (!t || !t.content) return
    const fs = t.font_size || 24
    let tw = 0
    for (const ch of String(t.content)) tw += ch.charCodeAt(0) > 0x2e80 ? fs : fs * 0.56
    cornerOccupied.push({ x: t.x - 10, y: t.y - 10, w: Math.min(tw, 960) + 20, h: fs * 1.4 + 20 })
  })
  ;(layout.widgets || []).forEach((w) => {
    if (!w || w.type !== 'date_calendar' || !w.w) return
    const r = { x: w.x - 16, y: w.y - 16, w: w.w + 32, h: w.h + 32 }
    fillOccupied.push(r)
    cornerOccupied.push(r)
  })
  if (Array.isArray(layout.cutouts)) {
    for (const c of layout.cutouts) {
      if (c && c.w > 0 && c.h > 0) fillOccupied.push({ x: c.x, y: c.y, w: c.w, h: c.h })
    }
    for (const c of layout.cutouts) {
      if (c && c.w > 0 && c.h > 0) cornerOccupied.push({ x: c.x, y: c.y, w: c.w, h: c.h })
    }
  }
  for (const z of faceZones(layout, 12)) { fillOccupied.push(z); cornerOccupied.push(z) }

  const allPlaced = []
  layout.library = layout.library || []

  const pool = lib.slice()
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = pool[i]
    pool[i] = pool[j]
    pool[j] = tmp
  }

  let poolIdx = 0
  const photoItems = (layout.items || []).filter((it) => it && it.width > 60 && it.height > 60)
  for (const it of photoItems) {
    const corners = [
      { x: it.x, y: it.y },
      { x: it.x + it.width, y: it.y },
      { x: it.x, y: it.y + it.height },
      { x: it.x + it.width, y: it.y + it.height },
    ]
    for (let i = corners.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const t = corners[i]
      corners[i] = corners[j]
      corners[j] = t
    }
    const nCorner = 1 + Math.floor(Math.random() * 2)
    for (let ci = 0; ci < Math.min(nCorner, corners.length); ci++) {
      if (!pool.length) break
      const s = pool[poolIdx % pool.length]
      const sz = fitStickerSize(s, 66, 20, 1.5)
      const w = sz.w
      const h = sz.h
      if (Math.max(w, h) < 46) continue
      const c = corners[ci]
      const dirX = c.x < it.x + it.width / 2 ? -1 : 1
      const dirY = c.y < it.y + it.height / 2 ? -1 : 1
      let sx = Math.round(c.x - w / 2 + dirX * w * 0.35)
      let sy = Math.round(c.y - h / 2 + dirY * h * 0.35)
      sx = Math.max(14, Math.min(sx, canvasW - w - 14))
      sy = Math.max(14, Math.min(sy, canvasH - h - 14))
      const r = { x: sx, y: sy, w, h }
      if (coversNoteFully(r, layout)) continue
      let hit = false
      for (const o of cornerOccupied) if (rectsOverlap(r, o)) { hit = true; break }
      if (!hit) for (const o of allPlaced) if (rectsOverlap(r, o)) { hit = true; break }
      if (!hit) {
        for (const o of photoItems) {
          if (o === it) continue
          const ox = Math.max(0, Math.min(r.x + r.w, o.x + o.width) - Math.max(r.x, o.x))
          const oy = Math.max(0, Math.min(r.y + r.h, o.y + o.height) - Math.max(r.y, o.y))
          if (ox * oy > r.w * r.h * 0.25) { hit = true; break }
        }
      }
      if (hit) continue
      poolIdx++
      allPlaced.push({ x: sx - 10, y: sy - 10, w: w + 20, h: h + 20 })
      layout.library.push({
        file: s.f, x: sx, y: sy, w, h,
        rotate: Math.round((Math.random() * 8 - 4) * 10) / 10, shadow: true, z: 24,
      })
    }
  }

  const totalArea = canvasW * canvasH
  let occupiedArea = 0
  for (const r of fillOccupied) {
    const ox = Math.max(0, Math.min(r.x + r.w, canvasW) - Math.max(0, r.x))
    const oy = Math.max(0, Math.min(r.y + r.h, canvasH) - Math.max(0, r.y))
    occupiedArea += ox * oy
  }
  const freeRatio = Math.max(0, Math.min(1, (totalArea - occupiedArea) / totalArea))
  const MAX_N = 20
  const MIN_N = 9
  let targetFill = Math.max(MIN_N, Math.min(MAX_N, Math.round(MIN_N + freeRatio * (MAX_N - MIN_N))))
  if (freeRatio < 0.08) targetFill = 4

  const anchors = [
    { x: canvasW * 0.5, y: canvasH * 0.55 },
    { x: canvasW * 0.8, y: canvasH * 0.3 },
    { x: canvasW * 0.22, y: canvasH * 0.7 },
    { x: canvasW * 0.78, y: canvasH * 0.8 },
    { x: canvasW * 0.62, y: canvasH * 0.16 },
    { x: canvasW * 0.5, y: canvasH * 0.85 },
    { x: canvasW * 0.88, y: canvasH * 0.55 },
    { x: canvasW * 0.2, y: canvasH * 0.45 },
    { x: canvasW * 0.1, y: canvasH * 0.34 },
    { x: canvasW * 0.9, y: canvasH * 0.72 },
    { x: canvasW * 0.3, y: canvasH * 0.88 },
  ]

  let filled = 0
  let missStreak = 0
  for (let k = 0; k < targetFill; k++) {
    if (!pool.length) break
    const s = pool[poolIdx % pool.length]
    const base = fitStickerSize(s, s.f.slice(0, 2) === 'd3' ? 130 : 150, 40, 1.5)
    let sp = null
    const anchor = anchors[k % anchors.length]
    for (let t = 0; t < 3 && !sp; t++) {
      sp = findFreeSpot(fillOccupied, { w: base.w, h: base.h }, allPlaced, canvasW, canvasH, {
        minSide: 40,
        scales: [1, 0.85, 0.72, 0.6, 0.5],
        randomStart: true,
        anchor,
      })
    }
    if (!sp) { missStreak++; if (missStreak >= 3) break; continue }
    if (coversNoteFully({ x: sp.x, y: sp.y, w: sp.w, h: sp.h }, layout)) { missStreak++; continue }
    missStreak = 0
    poolIdx++
    allPlaced.push({ x: sp.x - 12, y: sp.y - 12, w: sp.w + 24, h: sp.h + 24 })
    layout.library.push({
      file: s.f, x: sp.x, y: sp.y, w: sp.w, h: sp.h,
      rotate: Math.round((Math.random() * 8 - 4) * 10) / 10, shadow: true, z: 24,
    })
    filled++
  }

  return { placed: layout.library.length }
}

/**
 * v3.54 水彩手绘贴纸库：照片边角 + 空白区填充，两阶段与 buildDarkStickers 同构。
 * 库来自 watercolorLibrary()（w1 33 枚 / w2 12 枚），无白描边，旋转 ±5°。
 * maxCount > 0 时限贴 N 枚（整洁模式）。
 */
function buildWatercolorStickers(layout, maxCount) {
  const lib = (window.DiaryTemplates && window.DiaryTemplates.watercolorLibrary)
    ? window.DiaryTemplates.watercolorLibrary() : []
  if (!lib.length) return { placed: 0 }
  const cap = Math.max(0, Number(maxCount) || 0)

  const canvasW = layout.canvas_width || 1080
  const canvasH = layout.canvas_height || 1440

  const fillOccupied = collectVintageLibRects(layout)
  const cornerOccupied = []
  ;(layout.texts || []).forEach((t) => {
    if (!t || !t.content) return
    const fs = t.font_size || 24
    let tw = 0
    for (const ch of String(t.content)) tw += ch.charCodeAt(0) > 0x2e80 ? fs : fs * 0.56
    cornerOccupied.push({ x: t.x - 10, y: t.y - 10, w: Math.min(tw, 960) + 20, h: fs * 1.4 + 20 })
  })
  if (Array.isArray(layout.cutouts)) {
    for (const c of layout.cutouts) {
      if (!c || !(c.w > 0 && c.h > 0)) continue
      fillOccupied.push({ x: c.x, y: c.y, w: c.w, h: c.h })
      cornerOccupied.push({ x: c.x, y: c.y, w: c.w, h: c.h })
    }
  }
  for (const z of faceZones(layout, 12)) { fillOccupied.push(z); cornerOccupied.push(z) }

  const allPlaced = []
  layout.library = layout.library || []

  const pool = lib.slice()
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = pool[i]
    pool[i] = pool[j]
    pool[j] = tmp
  }
  let poolIdx = 0

  const photoItems = (layout.items || []).filter((it) => it && it.width > 60 && it.height > 60)
  for (const it of photoItems) {
    const corners = [
      { x: it.x, y: it.y },
      { x: it.x + it.width, y: it.y },
      { x: it.x, y: it.y + it.height },
      { x: it.x + it.width, y: it.y + it.height },
    ]
    for (let i = corners.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const t = corners[i]
      corners[i] = corners[j]
      corners[j] = t
    }
    for (let ci = 0; ci < 1; ci++) {
      if (!pool.length) break
      const s = pool[poolIdx % pool.length]
      const sz = fitStickerSize(s, 84, 26, 1.5)
      const w = sz.w
      const h = sz.h
      if (Math.max(w, h) < 52) continue
      const c = corners[ci]
      const dirX = c.x < it.x + it.width / 2 ? -1 : 1
      const dirY = c.y < it.y + it.height / 2 ? -1 : 1
      let sx = Math.round(c.x - w / 2 + dirX * w * 0.35)
      let sy = Math.round(c.y - h / 2 + dirY * h * 0.35)
      sx = Math.max(14, Math.min(sx, canvasW - w - 14))
      sy = Math.max(14, Math.min(sy, canvasH - h - 14))
      const r = { x: sx, y: sy, w, h }
      if (coversNoteFully(r, layout)) continue
      let hit = false
      for (const o of cornerOccupied) if (rectsOverlap(r, o)) { hit = true; break }
      if (!hit) for (const o of allPlaced) if (rectsOverlap(r, o)) { hit = true; break }
      if (!hit) {
        for (const o of photoItems) {
          if (o === it) continue
          const ox = Math.max(0, Math.min(r.x + r.w, o.x + o.width) - Math.max(r.x, o.x))
          const oy = Math.max(0, Math.min(r.y + r.h, o.y + o.height) - Math.max(r.y, o.y))
          if (ox * oy > r.w * r.h * 0.25) { hit = true; break }
        }
      }
      if (hit) continue
      poolIdx++
      allPlaced.push({ x: sx - 10, y: sy - 10, w: w + 20, h: h + 20 })
      layout.library.push({
        file: s.f, x: sx, y: sy, w, h,
        rotate: Math.round((Math.random() * 10 - 5) * 10) / 10, shadow: true, z: 24,
      })
      if (cap && layout.library.length >= cap) return { placed: layout.library.length }
    }
  }

  const TARGET_MIN = 8
  const TARGET_MAX = 14
  const totalArea = canvasW * canvasH
  let occupiedArea = 0
  for (const r of fillOccupied) {
    const ox = Math.max(0, Math.min(r.x + r.w, canvasW) - Math.max(0, r.x))
    const oy = Math.max(0, Math.min(r.y + r.h, canvasH) - Math.max(0, r.y))
    occupiedArea += ox * oy
  }
  const freeRatio = Math.max(0, Math.min(1, (totalArea - occupiedArea) / totalArea))
  let targetFill = Math.round((TARGET_MIN + Math.floor(Math.random() * (TARGET_MAX - TARGET_MIN + 1)))
    * (0.55 + freeRatio))
  targetFill = Math.max(4, Math.min(TARGET_MAX, targetFill))
  const anchors = [
    { x: canvasW * 0.5, y: canvasH * 0.55 },
    { x: canvasW * 0.8, y: canvasH * 0.3 },
    { x: canvasW * 0.22, y: canvasH * 0.7 },
    { x: canvasW * 0.78, y: canvasH * 0.8 },
    { x: canvasW * 0.62, y: canvasH * 0.16 },
    { x: canvasW * 0.5, y: canvasH * 0.85 },
    { x: canvasW * 0.88, y: canvasH * 0.55 },
    { x: canvasW * 0.2, y: canvasH * 0.45 },
    { x: canvasW * 0.1, y: canvasH * 0.34 },
    { x: canvasW * 0.9, y: canvasH * 0.72 },
    { x: canvasW * 0.3, y: canvasH * 0.88 },
  ]

  let filled = 0
  let missStreak = 0
  for (let k = 0; k < targetFill; k++) {
    if (!pool.length) break
    const s = pool[poolIdx % pool.length]
    const base = fitStickerSize(s, 165, 46, 1.5)
    let sp = null
    const anchor = anchors[Math.floor(Math.random() * anchors.length)]
    for (let t = 0; t < 3 && !sp; t++) {
      sp = findFreeSpot(fillOccupied, { w: base.w, h: base.h }, allPlaced, canvasW, canvasH, {
        minSide: 46,
        scales: [1, 0.85, 0.72, 0.6, 0.5, 0.42],
        randomStart: true,
        anchor,
      })
    }
    if (!sp) { missStreak++; if (missStreak >= 5) break; continue }
    if (coversNoteFully({ x: sp.x, y: sp.y, w: sp.w, h: sp.h }, layout)) { missStreak++; continue }
    missStreak = 0
    poolIdx++
    allPlaced.push({ x: sp.x - 12, y: sp.y - 12, w: sp.w + 24, h: sp.h + 24 })
    layout.library.push({
      file: s.f, x: sp.x, y: sp.y, w: sp.w, h: sp.h,
      rotate: Math.round((Math.random() * 10 - 5) * 10) / 10, shadow: true, z: 24,
    })
    filled++
    if (cap && layout.library.length >= cap) break
  }

  return { placed: layout.library.length }
}

/**
 * v3.63 杂志排版防重叠：照片矩形 + 主体贴纸先大后小落位，不压装饰/文字，
 * 放不下先缩小再螺旋平移，宁可轻叠也不丢照片。必须在路线节点生成之前调用。
 */
function resolveMagazineOverlaps(layout) {
  try {
    if (!layout) return
    const W = layout.canvas_width || 1080
    const H = layout.canvas_height || 1440

    const obstacles = []
    const pushO = (x, y, w, h, pad) => {
      if (w > 0 && h > 0) obstacles.push({ x: x - pad, y: y - pad, w: w + pad * 2, h: h + pad * 2 })
    }
    ;(layout.doodles || []).forEach((d) => {
      if (!d || d.underPhotos) return
      pushO(d.x, d.y, d.width || d.w || 0, d.height || d.h || 0, 8)
    })
    ;(layout.widgets || []).forEach((wg) => {
      if (wg) pushO(wg.x, wg.y, wg.w || wg.width || 0, wg.h || wg.height || 0, 10)
    })
    ;(layout.texts || []).forEach((t) => {
      if (!t || !t.content) return
      const fs = t.font_size || 24
      let tw = 0
      for (const ch of String(t.content)) tw += ch.charCodeAt(0) > 0x2e80 ? fs : fs * 0.56
      pushO(t.x, t.y, Math.min(tw, 960), fs * 1.4, 10)
    })

    const ents = []
    ;(layout.items || []).forEach((it) => {
      const w = it.width != null ? it.width : it.w
      const h = it.height != null ? it.height : it.h
      if (it && w > 0 && h > 0) ents.push({ ref: it, isItem: true, w0: w, h0: h, x0: it.x, y0: it.y })
    })
    ;(layout.cutouts || []).forEach((c) => {
      const w = c.w != null ? c.w : c.width
      const h = c.h != null ? c.h : c.height
      if (c && w > 0 && h > 0) ents.push({ ref: c, isItem: false, w0: w, h0: h, x0: c.x, y0: c.y })
    })
    ents.sort((a, b) => b.w0 * b.h0 - a.w0 * a.h0)

    const placed = []
    const hitsAny = (x, y, w, h) => {
      if (x < 6 || y < 6 || x + w > W - 6 || y + h > H - 6) return true
      for (let i = 0; i < placed.length; i++) if (rectsOverlap({ x, y, w, h }, placed[i])) return true
      for (let i = 0; i < obstacles.length; i++) if (rectsOverlap({ x, y, w, h }, obstacles[i])) return true
      return false
    }

    for (const e of ents) {
      const cx = e.x0 + e.w0 / 2
      const cy = e.y0 + e.h0 / 2
      let fx = e.x0
      let fy = e.y0
      let fw = e.w0
      let fh = e.h0
      let ok = false
      if (!hitsAny(fx, fy, fw, fh)) ok = true
      if (!ok) {
        outer:
        for (const sc of [0.94, 0.88, 0.82, 0.76, 0.7, 0.64, 0.58, 0.52]) {
          const w = Math.round(e.w0 * sc)
          const h = Math.round(e.h0 * sc)
          for (let dy = 0; dy <= H; dy += 26) {
            for (const sy of [1, -1]) {
              const ny = Math.max(6, Math.min(Math.round(cy - h / 2) + sy * dy, H - 6 - h))
              for (let dx = 0; dx <= W; dx += 26) {
                for (const sx of [1, -1]) {
                  const nx = Math.max(6, Math.min(Math.round(cx - w / 2) + sx * dx, W - 6 - w))
                  if (!hitsAny(nx, ny, w, h)) { fx = nx; fy = ny; fw = w; fh = h; ok = true; break outer }
                }
              }
            }
          }
        }
      }
      e.ref.x = Math.round(fx)
      e.ref.y = Math.round(fy)
      if (e.isItem) {
        if (e.ref.width != null) { e.ref.width = fw; e.ref.height = fh } else { e.ref.w = fw; e.ref.h = fh }
      } else {
        e.ref.w = fw
        e.ref.h = fh
        if (e.ref.width != null) { e.ref.width = fw; e.ref.height = fh }
      }
      placed.push({ x: e.ref.x, y: e.ref.y, w: fw, h: fh })
    }
  } catch (e) {
    console.warn('[Diary] 杂志排版防重叠失败（忽略）', e)
  }
}

/**
 * 生成后套皮肤 + 专属贴纸库（不含抠图）。
 * styleId: vintage | minimal | colorful | dark | watercolor | magazine
 */
function applyDiarySkin(layout, styleId) {
  if (!layout || typeof layout !== 'object') return { layout: layout, skin: styleId || '' };
  const style = styleId || layout.style || '';
  try {
    if (style === 'minimal') {
      if (typeof applyFreshSkin === 'function') applyFreshSkin(layout);
      if (typeof buildFreshStickers === 'function') buildFreshStickers(layout);
      if (typeof buildFreshStars === 'function') buildFreshStars(layout);
    } else if (style === 'colorful') {
      const theme = (typeof pickColorfulTheme === 'function') ? pickColorfulTheme() : null;
      if (theme && typeof applyColorfulSkin === 'function') applyColorfulSkin(layout, theme);
      if (typeof buildColorfulStickers === 'function') buildColorfulStickers(layout, theme);
    } else if (style === 'vintage') {
      layout.style = 'vintage';
      if (typeof buildVintageStickers === 'function') buildVintageStickers(layout);
    } else if (style === 'dark') {
      layout.style = 'dark';
      if (typeof buildDarkStickers === 'function') buildDarkStickers(layout);
    } else if (style === 'watercolor') {
      if (typeof applyWatercolorSkin === 'function') applyWatercolorSkin(layout);
      if (typeof balanceWatercolorPhotoSpread === 'function') balanceWatercolorPhotoSpread(layout);
      if (typeof buildWatercolorStickers === 'function') buildWatercolorStickers(layout, 0);
    } else if (style === 'magazine') {
      layout.style = 'magazine';
      if (typeof resolveMagazineOverlaps === 'function') resolveMagazineOverlaps(layout);
    }
    // 专属素材库已铺上时，去掉 AI 的 OpenMoji decor_stickers，避免公网 CDN 失败拖垮观感
    if (Array.isArray(layout.library) && layout.library.length) {
      layout.decor_stickers = [];
    }
  } catch (err) {
    console.warn('[diary skin]', err);
  }
  return { layout: layout, skin: style };
}

window.applyDiarySkin = applyDiarySkin;
