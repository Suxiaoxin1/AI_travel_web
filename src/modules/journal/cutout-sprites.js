/**
 * 主体抠图贴纸编排（移植自旧项目 journal/js/page-video.js）。
 *
 * 流程：photos[0..N-1] → downscale(≤800px) → POST /api/diary/cutout（rembg u2net）
 * → trimCutoutBBox 提最大主体 → 按主体大小排序 → 空位搜索 / 英雄接缝角 / 照片角探出
 * 产出 layout.cutouts[] + cutoutSrcs{photoIndex: 透明PNG}，原矩形照片保留。
 * 失败（服务不可用/无主体/无空位）一律返回 {placed: 0, error}，调用方无抠图继续出图。
 */
import apiClient from '../../utils/apiClient.js'

/** 等比缩到 maxSide 以内（抠图前压缩，省内存/带宽） */
export function downscaleDataUrl(dataUrl, maxSide) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const iw = img.width || 1
        const ih = img.height || 1
        const s = Math.min(1, maxSide / Math.max(iw, ih))
        const w = Math.max(1, Math.round(iw * s))
        const h = Math.max(1, Math.round(ih * s))
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        c.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(c.toDataURL('image/jpeg', 0.9))
      } catch {
        resolve(dataUrl)
      }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

/**
 * 从抠图 PNG 提取最大主体：alpha 连通域分析 → 只留最大块 + 紧邻大碎块，
 * 主体不透明化，裁透明边。返回 {dataUrl,w,h,aspect,areaRatio,fillRatio,meanAlpha,
 * bxFrac,byFrac,bwFrac,bhFrac} 或 null。
 */
export function trimCutoutBBox(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const iw = img.width
        const ih = img.height
        if (!iw || !ih) {
          resolve(null)
          return
        }
        const c = document.createElement('canvas')
        c.width = iw
        c.height = ih
        const ctx = c.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0)
        const imgData = ctx.getImageData(0, 0, iw, ih)
        const d = imgData.data
        const n = iw * ih
        const solid = new Uint8Array(n)
        for (let i = 0; i < n; i++) solid[i] = d[i * 4 + 3] > 40 ? 1 : 0

        // 连通域分析（4-邻域，迭代洪泛）
        const visited = new Uint8Array(n)
        const stack = new Int32Array(n)
        const comps = []
        for (let start = 0; start < n; start++) {
          if (!solid[start] || visited[start]) continue
          let sp = 0
          stack[sp++] = start
          visited[start] = 1
          const comp = { count: 0, minX: iw, minY: ih, maxX: -1, maxY: -1, px: [] }
          while (sp > 0) {
            const p = stack[--sp]
            const px = p % iw
            const py = (p - px) / iw
            comp.count++
            comp.px.push(p)
            if (px < comp.minX) comp.minX = px
            if (px > comp.maxX) comp.maxX = px
            if (py < comp.minY) comp.minY = py
            if (py > comp.maxY) comp.maxY = py
            if (px > 0) { const q = p - 1; if (solid[q] && !visited[q]) { visited[q] = 1; stack[sp++] = q } }
            if (px < iw - 1) { const q = p + 1; if (solid[q] && !visited[q]) { visited[q] = 1; stack[sp++] = q } }
            if (py > 0) { const q = p - iw; if (solid[q] && !visited[q]) { visited[q] = 1; stack[sp++] = q } }
            if (py < ih - 1) { const q = p + iw; if (solid[q] && !visited[q]) { visited[q] = 1; stack[sp++] = q } }
          }
          comps.push(comp)
        }
        if (!comps.length) {
          resolve(null)
          return
        }

        comps.sort((a, b) => b.count - a.count)
        const main = comps[0]
        const keep = [main]
        const padX = (main.maxX - main.minX) * 0.25 + 12
        const padY = (main.maxY - main.minY) * 0.25 + 12
        for (let k = 1; k < comps.length; k++) {
          const cp = comps[k]
          if (cp.count < main.count * 0.15) break
          const cx = (cp.minX + cp.maxX) / 2
          const cy = (cp.minY + cp.maxY) / 2
          if (cx > main.minX - padX && cx < main.maxX + padX && cy > main.minY - padY && cy < main.maxY + padY) {
            keep.push(cp)
          }
        }

        // 主体置信度：平均 alpha < 100 视为模型没把握 → 拒收
        let keptPixels = 0
        let keptAlphaSum = 0
        for (const cp of keep) {
          for (let j = 0; j < cp.px.length; j++) {
            keptAlphaSum += d[cp.px[j] * 4 + 3]
            keptPixels++
          }
        }
        const meanAlpha = keptPixels ? keptAlphaSum / keptPixels : 0
        if (meanAlpha < 100) {
          resolve(null)
          return
        }

        // 主体不透明化：alpha ≥96 拉满，边缘羽化保留
        for (const cp of keep) {
          for (let j = 0; j < cp.px.length; j++) {
            const p = cp.px[j] * 4 + 3
            if (d[p] >= 96 && d[p] < 255) d[p] = 255
          }
        }

        // 没保留的连通块 alpha 清零
        let droppedCount = 0
        for (let k = keep.length; k < comps.length; k++) {
          for (let j = 0; j < comps[k].px.length; j++) d[comps[k].px[j] * 4 + 3] = 0
          droppedCount += comps[k].count
        }
        ctx.putImageData(imgData, 0, 0)

        let minX = iw
        let minY = ih
        let maxX = -1
        let maxY = -1
        for (const cp of keep) {
          if (cp.minX < minX) minX = cp.minX
          if (cp.maxX > maxX) maxX = cp.maxX
          if (cp.minY < minY) minY = cp.minY
          if (cp.maxY > maxY) maxY = cp.maxY
        }
        if (maxX < 0) {
          resolve(null)
          return
        }
        const bw = maxX - minX + 1
        const bh = maxY - minY + 1
        const crop = document.createElement('canvas')
        crop.width = bw
        crop.height = bh
        crop.getContext('2d').drawImage(c, minX, minY, bw, bh, 0, 0, bw, bh)
        resolve({
          dataUrl: crop.toDataURL('image/png'),
          w: bw,
          h: bh,
          aspect: bh ? bw / bh : 0,
          areaRatio: iw * ih ? (bw * bh) / (iw * ih) : 0,
          fillRatio: bw * bh ? keep.reduce((s, cp) => s + cp.count, 0) / (bw * bh) : 0,
          meanAlpha: Math.round(meanAlpha),
          bxFrac: iw ? minX / iw : 0,
          byFrac: ih ? minY / ih : 0,
          bwFrac: iw ? bw / iw : 1,
          bhFrac: ih ? bh / ih : 1,
        })
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

/** 候选照片批量发给服务端抠图，返回 [{ok,dataUrl}|{ok,error}]。 */
export async function callCutoutApi(images) {
  let response
  try {
    response = await apiClient.post('/diary/cutout', { images }, { timeout: 120000 })
  } catch (err) {
    if (err?.code === 'ECONNABORTED') throw new Error('抠图超时，已跳过抠图')
    const detail = err?.response?.data?.error || err?.response?.data?.detail || err?.message
    throw new Error(typeof detail === 'string' ? detail : '抠图请求失败')
  }
  const results = response?.data?.results
  return Array.isArray(results) ? results : []
}

/** 便签核心保护区：贴纸不得整块盖住便签 */
function noteCoreRect(layout, protectRatio) {
  const n = layout && layout.note
  if (!n) return null
  const w = (n.w != null ? n.w : n.width) || 0
  const h = (n.h != null ? n.h : n.height) || 0
  if (w <= 0 || h <= 0) return null
  const r = protectRatio != null ? protectRatio : 0.18
  const ix = Math.round(w * r)
  const iy = Math.round(h * r)
  return { x: n.x + ix, y: n.y + iy, w: Math.max(4, w - ix * 2), h: Math.max(4, h - iy * 2) }
}

/** 版面里不能被贴纸挡住的矩形：照片 / 文字 / 便签日历等挂件 */
export function collectOccupiedRects(layout) {
  const rects = []
  const push = (x, y, w, h, pad) => {
    if (w > 0 && h > 0) rects.push({ x: x - pad, y: y - pad, w: w + pad * 2, h: h + pad * 2 })
  }
  ;(layout.items || []).forEach((p) => push(p.x, p.y, p.width, p.height, 18))
  ;(layout.widgets || []).forEach((w) => push(w.x, w.y, w.w, w.h, 12))
  const nCore = noteCoreRect(layout)
  if (nCore) push(nCore.x, nCore.y, nCore.w, nCore.h, 6)
  ;(layout.texts || []).forEach((t) => {
    if (!t || !t.content) return
    const fs = t.font_size || 24
    let tw = 0
    for (const ch of String(t.content)) tw += ch.charCodeAt(0) > 0x2e80 ? fs : fs * 0.56
    push(t.x, t.y, Math.min(tw, 960), fs * 1.4, 10)
  })
  return rects
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

/** 取 item 对应的源照片序号（items 顺序 ≠ 照片顺序，必须看 photo_index） */
export function itemPhotoIndex(it, fallback) {
  if (!it) return fallback
  if (it.photo_index != null) return it.photo_index
  if (it.photoIndex != null) return it.photoIndex
  if (it.photo != null) return it.photo
  return fallback
}

/**
 * 人脸保护区：① layout._faceZones（抠图主体上部，最准）；
 * ② 兜底为每张照片上部 42% 头带。
 */
export function faceZones(layout, pad) {
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

/**
 * 在画布空白区给贴纸找位置：理想尺寸放不下逐级缩小，缩到 minSide 以下放弃。
 * 绝不与 occupied/taken 重叠。
 */
export function findFreeSpot(occupied, want, taken, canvasW, canvasH, opts) {
  const o = opts || {}
  const margin = o.margin || 30
  const scales = o.scales || [1, 0.85, 0.72, 0.6]
  const minSide = o.minSide || 130
  const randomStart = !!o.randomStart
  const region = o.region || null
  const pickRandom = !!o.pickRandom
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
    let colStart
    let rowStart
    if (o.anchor) {
      const ax = Math.max(bx, Math.min(o.anchor.x, bx + bw))
      const ay = Math.max(by, Math.min(o.anchor.y, by + bh))
      colStart = Math.floor((ax - bx) / step)
      if (colStart < 0) colStart = 0
      rowStart = Math.floor((ay - by) / step)
      if (rowStart < 0) rowStart = 0
      colStart = (((colStart + Math.floor(Math.random() * 3) - 1) % cols) + cols) % cols
      rowStart = (((rowStart + Math.floor(Math.random() * 3) - 1) % rows) + rows) % rows
    } else if (randomStart) {
      colStart = Math.floor(Math.random() * cols)
      rowStart = Math.floor(Math.random() * rows)
    } else {
      colStart = 0
      rowStart = 0
    }
    const picked = pickRandom ? [] : null
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
        if (!hit) {
          if (pickRandom) picked.push(r)
          else return r
        }
      }
    }
    if (pickRandom && picked.length) return picked[Math.floor(Math.random() * picked.length)]
  }
  return null
}

/**
 * 抠图兜底位置：版面塞满时，让主体从源照片的某个角探出来。
 * 只躲文字（重叠 >15% 换角），允许压照片/挂件。返回 {x,y,w,h} 或 null。
 */
export function cutoutEdgeAnchor(layout, pi, subj, canvasW, canvasH) {
  const items = layout.items || []
  let fr = null
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    const idx = it.photo_index != null ? it.photo_index : it.photo
    if (idx === pi) {
      fr = it
      break
    }
  }
  if (!fr) return null
  const fw = fr.width != null ? fr.width : fr.w
  const fh = fr.height != null ? fr.height : fr.h
  if (!(fw > 90 && fh > 90)) return null
  const aspect = subj.aspect || 1
  const long = Math.max(fw, fh)
  let w = Math.round(long * (0.44 + Math.random() * 0.14))
  let h = Math.round(w / aspect)
  if (w > fw * 0.78) {
    w = Math.round(fw * 0.78)
    h = Math.round(w / aspect)
  }
  if (h > fh * 0.78) {
    h = Math.round(fh * 0.78)
    w = Math.round(h * aspect)
  }
  if (w < 96 || h < 96) return null
  const textRects = []
  ;(layout.texts || []).forEach((t) => {
    if (!t || !t.content) return
    const fs = t.font_size || 24
    let tw = 0
    const s = String(t.content)
    for (let k = 0; k < s.length; k++) tw += s.charCodeAt(k) > 0x2e80 ? fs : fs * 0.56
    textRects.push({ x: t.x, y: t.y, w: Math.min(tw, 960), h: fs * 1.4 })
  })
  const fx = fr.x
  const fy = fr.y
  const corners = [
    { cx: fx, cy: fy },
    { cx: fx + fw, cy: fy },
    { cx: fx, cy: fy + fh },
    { cx: fx + fw, cy: fy + fh },
  ]
  for (let i = corners.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = corners[i]
    corners[i] = corners[j]
    corners[j] = tmp
  }
  for (let ci = 0; ci < corners.length; ci++) {
    const dirX = corners[ci].cx < fx + fw / 2 ? -1 : 1
    const dirY = corners[ci].cy < fy + fh / 2 ? -1 : 1
    let x = Math.round(corners[ci].cx - w / 2 + dirX * w * 0.35)
    let y = Math.round(corners[ci].cy - h / 2 + dirY * h * 0.35)
    x = Math.max(16, Math.min(x, canvasW - w - 16))
    y = Math.max(16, Math.min(y, canvasH - h - 16))
    const r = { x, y, w, h }
    let bad = false
    for (let i = 0; i < textRects.length && !bad; i++) {
      const tr = textRects[i]
      const ox = Math.max(0, Math.min(r.x + r.w, tr.x + tr.w) - Math.max(r.x, tr.x))
      const oy = Math.max(0, Math.min(r.y + r.h, tr.y + tr.h) - Math.max(r.y, tr.y))
      if (ox * oy > r.w * r.h * 0.15) bad = true
    }
    if (!bad) {
      const fa = faceZones(layout, 6)
      for (let i = 0; i < fa.length && !bad; i++) if (rectsOverlap(r, fa[i])) bad = true
    }
    if (!bad) return r
  }
  return null
}

function rotAABB(it) {
  const cx = it.x + it.width / 2
  const cy = it.y + it.height / 2
  const a = ((it.rotate || 0) * Math.PI) / 180
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const hw = it.width / 2
  const hh = it.height / 2
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  ;[[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].forEach((p) => {
    const X = cx + p[0] * cos - p[1] * sin
    const Y = cy + p[0] * sin + p[1] * cos
    if (X < x0) x0 = X
    if (Y < y0) y0 = Y
    if (X > x1) x1 = X
    if (Y > y1) y1 = Y
  })
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

/**
 * 暗黑英雄版式接缝角：主图↔副图咬合的缝角，贴纸骑缝。
 * 返回 [{x,y,size,ux,uy}]（中心点 + 尺寸），最多 5 个。
 */
function darkHeroCutoutCorners(items) {
  if (!Array.isArray(items) || items.length < 3) return []
  const main = items[0]
  const mainArea = main.width * main.height
  let maxSub = 0
  for (let i = 1; i < items.length; i++) maxSub = Math.max(maxSub, items[i].width * items[i].height)
  if (maxSub <= 0 || mainArea < maxSub * 1.25) return []
  const mB = rotAABB(main)
  const mc = { x: mB.x + mB.w / 2, y: mB.y + mB.h / 2 }
  const out = []
  for (let i = 1; i < items.length; i++) {
    const sub = items[i]
    const sB = rotAABB(sub)
    const sc = { x: sB.x + sB.w / 2, y: sB.y + sB.h / 2 }
    let px = Math.max(mB.x, Math.min(sc.x, mB.x + mB.w))
    let py = Math.max(mB.y, Math.min(sc.y, mB.y + mB.h))
    const dx = sc.x - mc.x
    const dy = sc.y - mc.y
    const d = Math.hypot(dx, dy) || 1
    px += (dx / d) * 12
    py += (dy / d) * 12
    const size = Math.max(88, Math.min(165, Math.min(main.width, sub.width) * 0.62))
    out.push({ x: Math.round(px), y: Math.round(py), size: Math.round(size), ux: dx / d, uy: dy / d })
  }
  out.sort((a, b) => b.size - a.size)
  return out.slice(0, 5)
}

/**
 * B 主流程：photos 打包发服务端抠图，把主体合理的透明贴纸放进版面空位。
 * layout.cutouts 与 cutoutSrcs[photoIndex] 同步产出；原照片不删。
 * @returns {Promise<{placed: number, error: string|null, cutoutSrcs: object}>}
 */
export async function buildCutoutSprites(layout, opts) {
  const o = opts || {}
  const trace = typeof o.onTrace === 'function' ? o.onTrace : () => {}
  const style = o.style || layout.style || 'vintage'
  const Templates = (typeof window !== 'undefined' && window.DiaryTemplates) || null
  const spots =
    Array.isArray(o.spots) && o.spots.length
      ? o.spots
      : Templates && typeof Templates.cutoutSpots === 'function'
        ? Templates.cutoutSpots(style)
        : []
  const photos = Array.isArray(o.photos) && o.photos.length ? o.photos : []
  const cutoutSrcs = {}
  if (!spots.length || !photos.length) {
    return { placed: 0, error: '当前模板无抠图预留位', cutoutSrcs }
  }
  const canvasW = layout.canvas_width || 1080
  const canvasH = layout.canvas_height || 1440
  const occupied = collectOccupiedRects(layout)
  const taken = []

  layout.cutouts = layout.cutouts || []
  const maxN = Math.min(photos.length, o.maxN || 6)
  const inputs = []
  for (let pi = 0; pi < maxN; pi++) {
    inputs.push(await downscaleDataUrl(photos[pi], 800))
  }

  let results
  try {
    results = await callCutoutApi(inputs)
  } catch (err) {
    const msg = (err && err.message) || String(err)
    trace('抠图服务不可用：' + msg)
    return { placed: 0, error: '抠图服务不可用：' + msg, cutoutSrcs }
  }

  // 第一遍：逐张分析主体，只认真正的主体（包围盒 ≥ 画面 10%，≤ 98%）
  const candidates = []
  let lastErr = null
  for (let pi = 0; pi < maxN; pi++) {
    const res = results && results[pi]
    if (!res || !res.ok || !res.dataUrl) {
      lastErr = (res && res.error) || '抠图模块失败'
      trace('照片' + pi + '：' + lastErr)
      continue
    }
    const subj = await trimCutoutBBox(res.dataUrl)
    if (!subj) {
      lastErr = '未识别到主体（全透明）'
      trace('照片' + pi + '：' + lastErr)
      continue
    }
    if (subj.areaRatio < 0.1) {
      lastErr = '无明确主体（最大目标仅占画面 ' + (subj.areaRatio * 100).toFixed(1) + '%，像背景路人/风景照）'
      trace('照片' + pi + '：' + lastErr)
      continue
    }
    if (subj.areaRatio > 0.98) {
      lastErr = '几乎占满整图（没抠出主体）'
      trace('照片' + pi + '：' + lastErr)
      continue
    }
    if (subj.aspect < 0.2 || subj.aspect > 4.5) {
      lastErr = '主体比例异常（aspect=' + subj.aspect.toFixed(2) + '）'
      trace('照片' + pi + '：' + lastErr)
      continue
    }
    candidates.push({ pi, subj })
  }

  // 人脸保护区（按抠图主体定位）
  {
    const zones = []
    for (const c of candidates) {
      const it = (layout.items || []).find((x) => itemPhotoIndex(x, -1) === c.pi)
      if (!it) continue
      const iw = it.width != null ? it.width : it.w
      const ih = it.height != null ? it.height : it.h
      if (!(iw > 0 && ih > 0)) continue
      const sx = it.x + (c.subj.bxFrac || 0) * iw
      const sy = it.y + (c.subj.byFrac || 0) * ih
      const sw = Math.max(8, (c.subj.bwFrac != null ? c.subj.bwFrac : 1) * iw)
      const sh = Math.max(8, (c.subj.bhFrac != null ? c.subj.bhFrac : 1) * ih)
      zones.push({
        x: sx + sw * 0.08,
        y: sy,
        w: Math.max(6, sw * 0.84),
        h: Math.max(6, sh * 0.55),
      })
    }
    if (zones.length) layout._faceZones = zones
  }
  for (const z of faceZones(layout, 10)) occupied.push(z)

  // 第二遍：按主体从大到小贴
  candidates.sort((a, b) => b.subj.areaRatio - a.subj.areaRatio)
  let placed = 0
  let heroCorners = style === 'dark' ? darkHeroCutoutCorners(layout.items) : []
  if (heroCorners.length) {
    const fa = faceZones(layout, 8)
    if (fa.length) {
      const cleared = []
      for (const c of heroCorners) {
        const sz = c.size
        for (let t = 0; t < 5; t++) {
          const k = t * 24
          const cx = c.x + (c.ux || 0) * k
          const cy = c.y + (c.uy || 0) * k
          const r = { x: cx - sz / 2, y: cy - sz / 2, w: sz, h: sz }
          let bad = false
          for (let i = 0; i < fa.length && !bad; i++) if (rectsOverlap(r, fa[i])) bad = true
          if (!bad) {
            cleared.push({ x: Math.round(cx), y: Math.round(cy), size: sz })
            break
          }
        }
      }
      heroCorners = cleared
    }
  }
  for (let ci = 0; ci < candidates.length; ci++) {
    const cand = candidates[ci]
    const pi = cand.pi
    const subj = cand.subj
    let sp = null
    let snapped = false
    if (heroCorners.length && placed < heroCorners.length) {
      const c = heroCorners[placed]
      let w = c.size
      let h = Math.round(c.size / (subj.aspect || 1))
      if (h > c.size) {
        h = c.size
        w = Math.round(c.size * (subj.aspect || 1))
      }
      w = Math.max(84, w)
      h = Math.max(84, h)
      let x = Math.round(c.x - w / 2)
      let y = Math.round(c.y - h / 2)
      x = Math.max(16, Math.min(x, canvasW - w - 16))
      y = Math.max(16, Math.min(y, canvasH - h - 16))
      sp = { x, y, w, h }
    }
    if (!sp) {
      const base = spots[Math.min(placed, spots.length - 1)]
      sp = findFreeSpot(occupied, base, taken, canvasW, canvasH, {
        scales: o.scales || [1, 0.85, 0.72, 0.6],
        minSide: o.minSide != null ? o.minSide : style === 'dark' ? 112 : 130,
        pickRandom: !!o.pickRandom,
      })
      if (!sp) {
        sp = cutoutEdgeAnchor(layout, pi, subj, canvasW, canvasH)
        snapped = !!sp
      }
    }
    if (!sp) {
      lastErr = '版面没有不挡东西的空位了'
      trace(lastErr)
      break
    }
    taken.push({ x: sp.x - 14, y: sp.y - 14, w: sp.w + 28, h: sp.h + 28 })
    cutoutSrcs[pi] = subj.dataUrl
    layout.cutouts.push({
      x: sp.x,
      y: sp.y,
      w: sp.w,
      h: sp.h,
      photo_index: pi,
      photoIndex: pi,
      rotate: snapped
        ? Math.round((Math.random() * 14 - 7) * 10) / 10
        : Math.round((Math.random() * 10 - 5) * 10) / 10,
      opacity: 1,
    })
    placed++
  }
  return { placed, error: placed ? null : lastErr || null, cutoutSrcs }
}

/**
 * 照片全覆盖硬校验：每张上传照片必须出现在版面（cutouts 或 items 有其一），
 * 缺的自动在空白带补矩形照片。返回补位张数。
 */
export function ensureAllPhotosPlaced(layout, n) {
  try {
    if (!layout || !n) return 0
    const used = new Set()
    ;(layout.items || []).forEach((it) => {
      const pi = itemPhotoIndex(it, -1)
      if (pi >= 0) used.add(pi)
    })
    ;(layout.cutouts || []).forEach((c) => {
      if (!c) return
      const pi = c.photo_index != null ? c.photo_index : c.photoIndex
      if (pi != null && Number(pi) >= 0) used.add(Number(pi))
    })
    const missing = []
    for (let i = 0; i < n; i++) if (!used.has(i)) missing.push(i)
    if (!missing.length) return 0

    const W = layout.canvas_width || 1080
    const H = layout.canvas_height || 1440
    const w = 300
    const h = 210
    const items = (layout.items = Array.isArray(layout.items) ? layout.items : [])
    const hits = (x, y) =>
      items.some((it) => {
        const iw = it.width != null ? it.width : it.w
        const ih = it.height != null ? it.height : it.h
        return it.x < x + w && x < it.x + iw && it.y < y + h && y < it.y + ih
      })
    let k = 0
    for (const pi of missing) {
      let spot = null
      for (let y = H - h - 40; y >= 40 && !spot; y -= h + 26) {
        for (let x = 50; x + w <= W - 350 && !spot; x += w + 30) {
          if (!hits(x, y)) spot = { x, y }
        }
      }
      if (!spot) spot = { x: 50 + (k % 3) * 320, y: H - h - 40 - Math.floor(k / 3) * (h + 22) }
      items.push({ photo_index: pi, x: spot.x, y: spot.y, width: w, height: h, rotate: 0, border: 'soft_white' })
      k++
    }
    return missing.length
  } catch (e) {
    console.warn('[Diary] 照片覆盖校验失败（忽略）', e)
    return 0
  }
}

/**
 * 杂志排版贴纸化：有清晰独立主体的照片抠成透明贴纸放回原槽位中心；
 * 无主体（街景/远景）保留原图矩形。绝不丢照片。
 */
export async function magazineCutoutStickers(layout, opts) {
  const o = opts || {}
  const trace = typeof o.onTrace === 'function' ? o.onTrace : () => {}
  const photos = Array.isArray(o.photos) && o.photos.length ? o.photos : []
  const cutoutSrcs = {}
  const items = (layout.items || []).slice()
  if (!photos.length || !items.length) return { placed: 0, error: '无照片', cutoutSrcs }
  const need = []
  const seen = new Set()
  for (const it of items) {
    const pi = itemPhotoIndex(it, -1)
    if (pi >= 0 && pi < photos.length && !seen.has(pi)) {
      seen.add(pi)
      need.push(pi)
    }
  }
  if (!need.length) return { placed: 0, error: '无有效照片槽', cutoutSrcs }
  const inputs = []
  for (const pi of need) inputs.push(await downscaleDataUrl(photos[pi], 800))
  let results = null
  try {
    results = await callCutoutApi(inputs)
  } catch (err) {
    return { placed: 0, error: (err && err.message) || String(err), cutoutSrcs }
  }
  layout.cutouts = layout.cutouts || []
  let placed = 0
  let lastErr = null
  const keepItems = []
  for (let k = 0; k < need.length; k++) {
    const pi = need[k]
    const it = items.find((x) => itemPhotoIndex(x, -1) === pi)
    if (!it) continue
    const res = results && results[k]
    let ok = false
    if (res && res.ok && res.dataUrl) {
      const subj = await trimCutoutBBox(res.dataUrl)
      const clearSubject =
        !!subj &&
        subj.areaRatio >= 0.2 &&
        subj.areaRatio <= 0.95 &&
        (subj.bwFrac == null || subj.bwFrac < 0.92) &&
        (subj.bhFrac == null || subj.bhFrac < 0.92) &&
        (subj.fillRatio == null || subj.fillRatio >= 0.42) &&
        subj.aspect >= 0.2 &&
        subj.aspect <= 4.5
      if (clearSubject) {
        const iw = it.width != null ? it.width : it.w
        const ih = it.height != null ? it.height : it.h
        let w = iw
        let h = Math.round(w / (subj.aspect || 1))
        if (h > ih) {
          h = ih
          w = Math.round(h * (subj.aspect || 1))
        }
        w = Math.max(60, w)
        h = Math.max(60, h)
        layout.cutouts.push({
          x: Math.round(it.x + (iw - w) / 2),
          y: Math.round(it.y + (ih - h) / 2),
          w,
          h,
          photo_index: pi,
          photoIndex: pi,
          rotate: it.rotate || 0,
          opacity: 1,
        })
        cutoutSrcs[pi] = subj.dataUrl
        ok = true
        placed++
      } else {
        lastErr = '照片' + (pi + 1) + ' 无明确主体'
        trace('照片' + (pi + 1) + ' 判定为无明显主体 → 原图矩形保留背景')
      }
    } else lastErr = (res && res.error) || '抠图模块失败'
    if (!ok) {
      it.border = 'soft_white'
      keepItems.push(it)
    }
  }
  layout.items = items.filter((it) => {
    if (keepItems.indexOf(it) !== -1) return true
    const pi = itemPhotoIndex(it, -1)
    return pi >= 0 && !seen.has(pi)
  })
  return { placed, error: placed ? null : lastErr || null, cutoutSrcs }
}
