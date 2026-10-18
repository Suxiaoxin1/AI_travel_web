/**
 * 手账页生成适配层。
 *
 * diary-layout：POST /api/diary/layout-next → DiaryNextRenderer 合成预览
 */

import apiClient from './apiClient.js'
import { buildFallbackVisionAnalysis } from './journalCopy.js'
import { composeDiaryNextPreview, loadPhotoAspects } from './diaryNextBridge.js'
import { applyIpStickersToLayout, loadIpManifest } from '../modules/journal/ip-stickers.js'

export { loadIpManifest }

/** 前端风格 key → layout-next 预设 id */
export const STYLE_TO_DIARY_ID = {
  retro: 'vintage',
  clean: 'minimal',
  vivid: 'colorful',
  dark: 'dark',
  watercolor: 'watercolor',
  magazine: 'magazine'
}

/**
 * IP 贴纸规划：读面板选择（auto/none/指定 IP），把贴纸摆进 layout.library。
 * 'none' 或未命中时静默返回，不阻塞出图。
 */
export async function planIpStickers(layout, input, onProgress) {
  const sel = input?.ipSticker || 'auto'
  if (sel === 'none' || !layout) return { placed: 0, ipName: '' }
  const descText = [input?.location || '', input?.mood || '', input?.description || '']
    .filter(Boolean)
    .join(' ')
  try {
    const r = await applyIpStickersToLayout(layout, { selection: sel, descText })
    if (r.placed) emitProgress(onProgress, 'ip', 70, `已贴${r.ipName}${r.placed} 枚贴纸`)
    return r
  } catch (err) {
    console.warn('[Diary] IP 贴纸失败，无贴纸继续出图:', err?.message || err)
    return { placed: 0, ipName: '' }
  }
}

/**
 * 主体抠图贴纸规划：默认开启（旧版常开行为），失败/无主体时返回 {}，
 * 调用方无抠图继续出图。照片全覆盖校验 항상 执行（AI 排版可能漏照片）。
 * @returns {Promise<object>} cutoutSrcs {photoIndex: 透明PNG dataURL}
 */
export async function planCutoutStickers(layout, input, diaryStyle, onProgress) {
  const photos = Array.isArray(input?.photos) ? input.photos : []
  try {
    const sprites = await import('../modules/journal/cutout-sprites.js')
    // 照片全覆盖校验 항상 执行（AI 排版可能漏照片）：缺的自动补矩形位
    sprites.ensureAllPhotosPlaced(layout, photos.length)
    // IP 贴纸：在抠图之前先摆（抠图主体贴纸会避让 library），失败静默跳过
    await planIpStickers(layout, input, onProgress)
    if (input?.enableCutout === false || !photos.length) return {}
    emitProgress(onProgress, 'cutout', 72, '识别照片主体并抠图…')
    const run =
      diaryStyle === 'magazine'
        ? sprites.magazineCutoutStickers(layout, { photos })
        : sprites.buildCutoutSprites(layout, {
            style: diaryStyle,
            photos,
            onTrace: (msg) => emitProgress(onProgress, 'cutout', 74, String(msg).slice(0, 60)),
          })
    const r = await run
    if (r.placed) emitProgress(onProgress, 'cutout', 76, `已抠出 ${r.placed} 枚主体贴纸`)
    return r.cutoutSrcs || {}
  } catch (err) {
    console.warn('[Diary] 抠图编排失败，无抠图继续出图:', err?.message || err)
    return {}
  }
}

const STYLE_LABELS = {
  retro: '复古胶片',
  clean: '简约清新',
  vivid: '多彩活泼',
  dark: '暗黑质感',
  watercolor: '水彩手绘',
  magazine: '杂志排版'
}

/**
 * @typedef {object} JournalGenerateProgress
 * @property {string} stage
 * @property {number} percent
 * @property {string} label
 */

/**
 * @typedef {object} JournalGenerateInput
 * @property {string} style
 * @property {string} [location]
 * @property {string} [date]
 * @property {string} [mood]
 * @property {string[]} photos
 * @property {(progress: JournalGenerateProgress) => void} [onProgress]
 */

/**
 * @typedef {object} JournalGenerateResult
 * @property {'diary-layout'} engine
 * @property {object} visionAnalysis
 * @property {string} contentHtml
 * @property {object} [diaryNextLayout]
 * @property {string} [previewUrl]
 */

/** @param {(progress: JournalGenerateProgress) => void} [onProgress] */
function emitProgress(onProgress, stage, percent, label) {
  if (typeof onProgress !== 'function') return
  onProgress({
    stage,
    percent: Math.max(0, Math.min(100, Math.round(Number(percent) || 0))),
    label: String(label || '')
  })
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildContext({ location, date, mood }) {
  const parts = []
  if (location) parts.push(`地点：${location}`)
  if (date) parts.push(`日期：${date}`)
  if (mood) parts.push(`心情：${mood}`)
  return parts.join('\n')
}

function contentHtmlFromLayout(layout, { location, date, style }) {
  const texts = Array.isArray(layout?.texts) ? layout.texts : []
  const title = texts[0]?.content || `${location || '我的'}旅行手帐`
  const body = texts.slice(1).map((t) => `<p>${escapeHtml(t.content)}</p>`).join('\n')
  const meta = [date || '', location || '', STYLE_LABELS[style] || style].filter(Boolean).join(' · ')
  return [
    `<h1>${escapeHtml(title)}</h1>`,
    meta ? `<p class="meta">${escapeHtml(meta)}</p>` : '',
    body || `<p>${escapeHtml(layout?.style_variation || '旅途手帐')}</p>`
  ].filter(Boolean).join('\n')
}

function visionFromLayout(layout, input) {
  const texts = Array.isArray(layout?.texts) ? layout.texts : []
  const fallback = buildFallbackVisionAnalysis({
    photoCount: input.photos.length,
    location: input.location || '',
    mood: input.mood || '',
    style: input.style || 'retro'
  })
  return {
    ...fallback,
    title: texts[0]?.content || fallback.title,
    intro: texts[1]?.content || fallback.intro,
    highlight: layout?.style_variation || fallback.highlight
  }
}

/**
 * 请求后端 layout-next 并合成预览图。
 * @param {JournalGenerateInput} input
 * @returns {Promise<JournalGenerateResult>}
 */
export async function requestDiaryLayout(input) {
  const photoCount = input.photos.length
  if (photoCount < 3 || photoCount > 9) {
    throw new Error(`模板排版需要 3—9 张照片，当前 ${photoCount} 张`)
  }

  const onProgress = input.onProgress
  const diaryStyle = STYLE_TO_DIARY_ID[input.style] || input.style || 'vintage'

  emitProgress(onProgress, 'aspects', 10, '分析照片比例…')
  const aspects = await loadPhotoAspects(input.photos)

  emitProgress(onProgress, 'layout', 22, 'AI 正在排版…')
  let softPercent = 22
  const softTick = setInterval(() => {
    softPercent = Math.min(softPercent + 1.4, 68)
    emitProgress(onProgress, 'layout', softPercent, 'AI 正在排版…')
  }, 900)

  let response
  try {
    response = await apiClient.post(
      '/diary/layout-next',
      {
        style: diaryStyle,
        description: '',
        context: buildContext(input),
        photoCount,
        aspects
      },
      { timeout: 160000 }
    )
  } catch (err) {
    const detail = err?.response?.data?.error || err?.response?.data?.detail || err?.message
    throw new Error(typeof detail === 'string' ? detail : '排版请求失败')
  } finally {
    clearInterval(softTick)
  }

  const data = response.data
  if (!data?.success || !data.layout) {
    throw new Error(data?.error || '排版生成失败')
  }

  // 把用户填的地点/日期/心情挂到 layout，供皮肤层兜底文案使用（如杂志刊期行）
  data.layout._userMeta = {
    location: input.location || '',
    date: input.date || '',
    mood: input.mood || '',
  }

  emitProgress(onProgress, 'skin', 78, '套用风格素材…')
  // 先加载渲染器/皮肤脚本，再套专属素材库后合成（勿在脚本未就绪时提前套皮肤）
  emitProgress(onProgress, 'render', 88, '合成手账预览…')
  const { previewUrl, layout } = await composeDiaryNextPreview(data.layout, input.photos, {
    styleId: diaryStyle,
    cutoutSrcs: await planCutoutStickers(data.layout, input, diaryStyle, onProgress),
  })
  emitProgress(onProgress, 'done', 100, '完成')
  return {
    engine: 'diary-layout',
    diaryNextLayout: layout,
    previewUrl,
    visionAnalysis: visionFromLayout(layout, input),
    contentHtml: contentHtmlFromLayout(layout, input)
  }
}

/**
 * 统一生成入口。
 * @param {JournalGenerateInput} input
 * @returns {Promise<JournalGenerateResult>}
 */
export async function generateJournalPage(input) {
  const photos = Array.isArray(input.photos) ? input.photos : []
  if (photos.length < 1) {
    throw new Error('请先上传照片')
  }

  return requestDiaryLayout({ ...input, photos })
}
