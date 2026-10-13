/**
 * IP 贴纸库（移植自旧项目 journal/js/diary-ip-stickers.js，window 全局 → ES 模块）。
 *
 * - public/journal-ip/manifest.json：{ ips: [{ id, name, aliases:[], stickers:[{file,width,height}] }] }
 * - 面板选择「IP 贴纸」（auto=按描述关键词命中 / none=不用 / 指定某个 IP），
 *   生成时由 planIpStickers() 把对应贴纸摆进 layout.library（渲染器按 src 加载）。
 * - file 命名：'ip_<id>_<file>'，src 为绝对路径 /journal-ip/<id>/<file>.png。
 */

const MANIFEST_URL = '/journal-ip/manifest.json'
const IMG_BASE = '/journal-ip/'

let _manifest = null
let _loading = null

/** 加载清单（失败/404 时退化为空库，不阻塞出图）。force=true 强制重载（导入新 IP 后用）。 */
export function loadIpManifest(force = false) {
  if (force) {
    _manifest = null
    _loading = null
  }
  if (_manifest) return Promise.resolve(_manifest)
  if (_loading) return _loading
  _loading = fetch(force ? `${MANIFEST_URL}?t=${Date.now()}` : MANIFEST_URL)
    .then((r) => (r.ok ? r.json() : { ips: [] }))
    .then((m) => {
      _manifest = m && Array.isArray(m.ips) ? m : { ips: [] }
      return _manifest
    })
    .catch(() => {
      _manifest = { ips: [] }
      return _manifest
    })
  return _loading
}

export function listIps() {
  return (_manifest && _manifest.ips) || []
}

export function stickerSrc(ipId, file) {
  return `${IMG_BASE}${ipId}/${file}.png`
}

/** 描述 → 命中的 IP（别名/中文名/英文全都不分大小写地找）；命中多个取第一个出现的 */
export function matchIp(text) {
  const t = String(text || '').toLowerCase()
  if (!t.trim()) return null
  let best = null
  let bestPos = Infinity
  for (const ip of listIps()) {
    const keys = [ip.name].concat(ip.aliases || []).filter(Boolean)
    for (const k of keys) {
      const pos = t.indexOf(String(k).toLowerCase())
      if (pos >= 0 && pos < bestPos) {
        best = ip
        bestPos = pos
      }
    }
  }
  return best
}

/** 面板下拉值 → 要用的 IP（'auto'=按描述 / 'none'=不用 / 其它=IP id） */
export function resolveIpSelection(sel, descText) {
  if (sel === 'none') return null
  if (sel && sel !== 'auto') {
    const hit = listIps().find((ip) => ip.id === sel)
    if (hit) return hit
  }
  return matchIp(descText)
}

/** 密度解析：描述里说了算（说少→少、说数字→按数字、没说→尽量丰富） */
export function parseIpDensity(text) {
  const t = String(text || '')
  const numMatch = t.match(/(\d{1,2})\s*(?:张|枚|个|只)?\s*(?:贴纸|ip|IP)?/)
  if (numMatch) {
    const n = Math.max(1, Math.min(18, Number(numMatch[1]) || 0))
    if (n) return { level: n <= 3 ? 'few' : n >= 12 ? 'many' : 'rich', count: n }
  }
  if (/少|简洁|简约|留白|一两|不要太多/.test(t)) return { level: 'few', count: 0 }
  if (/多|丰富|满|热闹|越多越好|堆满/.test(t)) return { level: 'many', count: 0 }
  return { level: 'rich', count: 0 }
}

export function ipDensityLabel(dens) {
  if (dens.count) return `${dens.count}枚`
  if (dens.level === 'few') return '少'
  if (dens.level === 'many') return '多'
  return '丰富'
}

/** 照片核心区占位（向内缩 photoInset，边缘允许贴纸压）+ 文字/便签禁区 */
function collectIpOccupied(layout, { photoInset = 26, textPad = 10 } = {}) {
  const rects = []
  const push = (x, y, w, h, pad) => {
    if (w > 0 && h > 0) rects.push({ x: x - pad, y: y - pad, w: w + pad * 2, h: h + pad * 2 })
  }
  ;(layout.items || []).forEach((p) => {
    const w = p.width != null ? p.width : p.w
    const h = p.height != null ? p.height : p.h
    push(p.x + photoInset, p.y + photoInset, Math.max(10, w - photoInset * 2), Math.max(10, h - photoInset * 2), 6)
  })
  ;(layout.widgets || []).forEach((w) => push(w.x, w.y, w.w, w.h, 6))
  const n = layout && layout.note
  if (n) {
    const nw = (n.w != null ? n.w : n.width) || 0
    const nh = (n.h != null ? n.h : n.height) || 0
    if (nw > 0 && nh > 0) {
      const r = 0.18
      const ix = Math.round(nw * r)
      const iy = Math.round(nh * r)
      push(n.x + ix, n.y + iy, Math.max(4, nw - ix * 2), Math.max(4, nh - iy * 2), 4)
    }
  }
  ;(layout.texts || []).forEach((t) => {
    if (!t || !t.content) return
    const fs = t.font_size || 24
    let tw = 0
    for (const ch of String(t.content)) tw += ch.charCodeAt(0) > 0x2e80 ? fs : fs * 0.56
    push(t.x, t.y, Math.min(tw, 960), fs * 1.4, textPad)
  })
  ;(Array.isArray(layout.cutouts) ? layout.cutouts : []).forEach((c) => {
    if (c && c.w > 0 && c.h > 0) rects.push({ x: c.x, y: c.y, w: c.w, h: c.h })
  })
  return rects
}

/** 贴纸等比贴合尺寸（绝不拉伸）：长边 targetLong，短边不小于 minShort，不超过 maxScale 倍 */
function fitStickerSize(s, targetLong, minShort, maxScale) {
  const cap = maxScale == null ? 1 : maxScale
  const longSide = Math.max(1, Math.max(s.w, s.h))
  const shortSide = Math.max(1, Math.min(s.w, s.h))
  let sc = Math.min(targetLong / longSide, cap)
  if (shortSide * sc < minShort) sc = Math.min(Math.max(sc, minShort / shortSide), cap)
  return { w: Math.max(1, Math.round(s.w * sc)), h: Math.max(1, Math.round(s.h * sc)) }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

/**
 * 在画布空白区找位置：逐档缩小（scales），缩到 minSide 以下放弃。
 * region 限定在某个格子内时做区域搜索；pickRandom 收集全部合法位随机取。
 */
function findSpot(occupied, want, taken, canvasW, canvasH, opts = {}) {
  const margin = opts.margin || 30
  const scales = opts.scales || [1, 0.85, 0.72, 0.6]
  const minSide = opts.minSide || 40
  const region = opts.region || null
  const bx = region ? Math.max(margin, region.x) : margin
  const by = region ? Math.max(margin, region.y) : margin
  const bw = region ? Math.max(0, Math.min(canvasW - margin, region.x + region.w) - bx) : canvasW - 2 * margin
  const bh = region ? Math.max(0, Math.min(canvasH - margin, region.y + region.h) - by) : canvasH - 2 * margin
  for (let si = 0; si < scales.length; si++) {
    const w = Math.round(want.w * scales[si])
    const h = Math.round(want.h * scales[si])
    if (w < minSide || h < minSide) return null
    if (w > bw || h > bh) continue
    const step = 16
    const cols = Math.max(1, Math.floor(bw / step))
    const rows = Math.max(1, Math.floor(bh / step))
    const colStart = Math.floor(Math.random() * cols)
    const rowStart = Math.floor(Math.random() * rows)
    const picked = []
    for (let dy = 0; dy < rows; dy++) {
      const cy = (rowStart + dy) % rows
      for (let dx = 0; dx < cols; dx++) {
        const cx = (colStart + dx) % cols
        const x = bx + cx * step
        const y = by + cy * step
        if (x + w > bx + bw || y + h > by + bh) continue
        const r = { x, y, w, h }
        let hit = false
        for (let i = 0; i < occupied.length && !hit; i++) if (rectsOverlap(r, occupied[i])) hit = true
        if (!hit) for (let i = 0; i < taken.length && !hit; i++) if (rectsOverlap(r, taken[i])) hit = true
        if (!hit) picked.push(r)
      }
    }
    if (picked.length) return picked[Math.floor(Math.random() * picked.length)]
  }
  return null
}

const IP_PLAN = {
  few: [
    [60, 18, [1, 0.88, 0.76], 52, 26],
    [40, 14, [1, 0.85, 0.72], 48, 18],
  ],
  rich: [
    [60, 18, [1, 0.88, 0.76, 0.64, 0.54], 52, 26],
    [40, 14, [1, 0.85, 0.72, 0.6, 0.5], 48, 18],
    [26, 10, [1, 0.8, 0.66, 0.55, 0.46], 44, 12],
    [14, 8, [0.9, 0.75, 0.62, 0.5, 0.42], 40, 8],
    [8, 8, [0.75, 0.6, 0.5, 0.42, 0.36], 34, 6],
  ],
  many: [
    [60, 18, [1, 0.88, 0.76, 0.64, 0.54], 50, 24],
    [40, 14, [1, 0.85, 0.72, 0.6, 0.5], 46, 16],
    [26, 10, [1, 0.8, 0.66, 0.55, 0.46], 42, 10],
    [14, 8, [0.9, 0.75, 0.62, 0.5, 0.42], 38, 8],
    [8, 6, [0.75, 0.6, 0.5, 0.42, 0.36], 32, 5],
    [4, 4, [0.62, 0.52, 0.44, 0.36, 0.3], 28, 4],
  ],
}

/**
 * 把某 IP 的贴纸摆进 layout.library（渲染器按 l.src 加载 PNG）。
 * 密度：留白率 → 目标枚数（few 1~3 / rich 4~14 / many 6~18，用户说数字以数字为准）。
 * 3×3 分格散落，杂志排版避开右侧时间轴带。单张手帐内每枚贴纸只用一次。
 * @returns {{placed: number, ipName: string}}
 */
export function buildIpStickers(layout, ip, density) {
  if (!layout || !ip) return { placed: 0, ipName: '' }
  const pool = (ip.stickers || []).map((s) => ({ f: s.file, w: s.width, h: s.height }))
  if (!pool.length) return { placed: 0, ipName: ip.name || '' }

  const canvasW = layout.canvas_width || 1080
  const canvasH = layout.canvas_height || 1440
  layout.library = layout.library || []
  const allPlaced = []
  ;(layout.library || []).forEach((l) => {
    if (l && l.w > 0 && l.h > 0) allPlaced.push({ x: l.x - 8, y: l.y - 8, w: l.w + 16, h: l.h + 16 })
  })

  const dens = density || { level: 'rich', count: 0 }
  let occupiedArea = 0
  for (const r of collectIpOccupied(layout, { photoInset: 26, textPad: 10 })) {
    const ox = Math.max(0, Math.min(r.x + r.w, canvasW) - Math.max(0, r.x))
    const oy = Math.max(0, Math.min(r.y + r.h, canvasH) - Math.max(0, r.y))
    occupiedArea += ox * oy
  }
  const freeRatio = Math.max(0, Math.min(1, (canvasW * canvasH - occupiedArea) / (canvasW * canvasH)))
  let target
  if (dens.count) target = dens.count
  else if (dens.level === 'few') target = Math.max(1, Math.round(1 + freeRatio * 1.5))
  else if (dens.level === 'many') target = Math.round(6 + freeRatio * 12)
  else target = Math.round(4 + freeRatio * 10)
  target = Math.max(1, Math.min(target, pool.length))
  const LONG = dens.level === 'few' ? 205 : dens.level === 'many' ? 158 : 178
  const GAP = dens.level === 'few' ? 34 : dens.level === 'many' ? 13 : 20

  const rightLimit = layout.style === 'magazine' ? 740 : canvasW
  const GX = 3
  const GY = 3
  const makeCells = (cellPad) => {
    const gridW = rightLimit - 2 * cellPad
    const cw = gridW / GX
    const chh = (canvasH - 2 * cellPad) / GY
    const cells = []
    for (let gy = 0; gy < GY; gy++) {
      for (let gx = 0; gx < GX; gx++) {
        cells.push({
          x: Math.round(cellPad + gx * cw),
          y: Math.round(cellPad + gy * chh),
          w: Math.round(cw),
          h: Math.round(chh),
        })
      }
    }
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = cells[i]
      cells[i] = cells[j]
      cells[j] = tmp
    }
    return cells
  }

  const poolShuffled = pool.slice()
  for (let i = poolShuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = poolShuffled[i]
    poolShuffled[i] = poolShuffled[j]
    poolShuffled[j] = tmp
  }
  const used = new Set()
  let cursor = 0
  const takeNext = () => {
    let guard = 0
    while (guard++ < poolShuffled.length) {
      const s = poolShuffled[cursor % poolShuffled.length]
      cursor++
      if (!used.has(s.f)) return s
    }
    return null
  }

  let placed = 0
  const attempt = (photoInset, textPad, scales, minSide, cellPad) => {
    const occupied = collectIpOccupied(layout, { photoInset, textPad })
    const cells = makeCells(cellPad)
    let n = 0
    for (let pass = 0; pass < 2 && placed + n < target; pass++) {
      if (pass > 0) {
        for (let i = cells.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          const tmp = cells[i]
          cells[i] = cells[j]
          cells[j] = tmp
        }
      }
      for (let ci = 0; ci < cells.length && placed + n < target; ci++) {
        const cell = cells[ci]
        for (let tries = 0; tries < 5; tries++) {
          const s = takeNext()
          if (!s) return n
          const sz = fitStickerSize(s, LONG, 64, 1.4)
          if (Math.max(sz.w, sz.h) < 70) continue
          const sp = findSpot(occupied, { w: sz.w, h: sz.h }, allPlaced, canvasW, canvasH, {
            minSide,
            scales,
            region: cell,
            pickRandom: true,
          })
          if (!sp) continue
          used.add(s.f)
          allPlaced.push({ x: sp.x - GAP / 2, y: sp.y - GAP / 2, w: sp.w + GAP, h: sp.h + GAP })
          layout.library.push({
            file: `ip_${ip.id}_${s.f}`,
            src: stickerSrc(ip.id, s.f),
            x: sp.x,
            y: sp.y,
            w: sp.w,
            h: sp.h,
            rotate: Math.round((Math.random() * 9 - 4.5) * 10) / 10,
            shadow: true,
            z: 24,
          })
          placed++
          n++
          break
        }
      }
    }
    return n
  }

  const plan = IP_PLAN[dens.level] || IP_PLAN.rich
  for (const p of plan) {
    if (placed >= target) break
    attempt(p[0], p[1], p[2], p[3], p[4])
  }
  return { placed, ipName: ip.name || '' }
}

/**
 * 生成流程统一入口：读面板选择（auto=按描述命中）→ 清 emoji（仅 few 档）→ 摆 IP 贴纸。
 * @param {object} layout 排版 JSON（原地修改 library/decor_stickers）
 * @param {{selection: string, descText: string}} opts
 * @returns {Promise<{placed: number, ipName: string}>}
 */
export async function applyIpStickersToLayout(layout, opts = {}) {
  try {
    if (!layout) return { placed: 0, ipName: '' }
    await loadIpManifest()
    const sel = opts.selection || 'auto'
    const desc = opts.descText || ''
    const ip = resolveIpSelection(sel, desc)
    if (!ip) return { placed: 0, ipName: '' }
    const dens = parseIpDensity(desc)
    const keepEmoji = dens.level !== 'few'
    if (!keepEmoji && Array.isArray(layout.decor_stickers) && layout.decor_stickers.length) {
      layout.decor_stickers = []
    }
    const r = buildIpStickers(layout, ip, dens)
    if (!keepEmoji && Array.isArray(layout.decor_stickers)) layout.decor_stickers = []
    return r
  } catch (e) {
    console.warn('[Diary] IP 贴纸失败（忽略）', e)
    return { placed: 0, ipName: '' }
  }
}
