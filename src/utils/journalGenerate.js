/**
 * 手账页生成适配层。
 *
 * diary-layout：POST /api/diary/layout-next → DiaryNextRenderer 合成预览
 */

import apiClient from './apiClient.js'
import { buildFallbackVisionAnalysis } from './journalCopy.js'
import { composeDiaryNextPreview, loadPhotoAspects } from './diaryNextBridge.js'

/** 前端风格 key → layout-next 预设 id */
export const STYLE_TO_DIARY_ID = {
  retro: 'vintage',
  clean: 'minimal',
  vivid: 'colorful',
  dark: 'dark',
  watercolor: 'watercolor',
  magazine: 'magazine'
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

  emitProgress(onProgress, 'skin', 78, '套用风格素材…')
  // 先加载渲染器/皮肤脚本，再套专属素材库后合成（勿在脚本未就绪时提前套皮肤）
  emitProgress(onProgress, 'render', 88, '合成手账预览…')
  const { previewUrl, layout } = await composeDiaryNextPreview(data.layout, input.photos, {
    styleId: diaryStyle
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
