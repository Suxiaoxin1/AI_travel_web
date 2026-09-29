/**
 * 手账视觉文案：规范化 vision JSON + 风格化回退，避免空泛占位句。
 */
import { getStylePreset } from '../data/journalStylePresets.js'

function clip(text, max) {
  const value = String(text || '').replace(/\s+/g, ' ').trim()
  if (!value) return ''
  return value.length > max ? value.slice(0, max) : value
}

function pick(pool, index) {
  const list = Array.isArray(pool) && pool.length ? pool : ['旅途片刻']
  return list[(Math.max(0, index)) % list.length]
}

/** 去掉模型常见的尾逗号：`,}` / `,]`（字符串外） */
export function stripTrailingCommas(text) {
  let out = ''
  let inString = false
  let escape = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (escape) {
      out += ch
      escape = false
      continue
    }
    if (ch === '\\' && inString) {
      out += ch
      escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      out += ch
      continue
    }
    if (!inString && ch === ',') {
      let j = i + 1
      while (j < text.length && /\s/.test(text[j])) j++
      if (text[j] === '}' || text[j] === ']') continue
    }
    out += ch
  }
  return out
}

function extractBalancedObject(text) {
  const start = text.indexOf('{')
  if (start < 0) return ''
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escape) {
      escape = false
      continue
    }
    if (ch === '\\' && inString) {
      escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return ''
}

function tryParseObject(raw) {
  if (!raw) return null
  try {
    const value = JSON.parse(raw)
    if (value && typeof value === 'object' && !Array.isArray(value)) return value
  } catch {
    /* ignore */
  }
  return null
}

/**
 * 宽松解析视觉/结构化 JSON：去思维链、抽代码块、去尾逗号、抽完整 {...}
 */
export function parseLooseJson(content) {
  let cleaned = String(content || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<\/?redacted_reasoning>/gi, '')
    .trim()
  if (!cleaned) return null

  const candidates = []
  const pushCandidate = (raw) => {
    const text = String(raw || '').trim()
    if (!text) return
    candidates.push(text)
    const stripped = stripTrailingCommas(text)
    if (stripped !== text) candidates.push(stripped)
  }

  pushCandidate(cleaned)

  const fences = [...cleaned.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)]
  for (let i = fences.length - 1; i >= 0; i--) {
    pushCandidate(fences[i][1])
  }

  const balanced = extractBalancedObject(cleaned)
  if (balanced) pushCandidate(balanced)

  const greedy = cleaned.match(/\{[\s\S]*\}/)
  if (greedy?.[0]) pushCandidate(greedy[0])

  for (const candidate of candidates) {
    const parsed = tryParseObject(candidate)
    if (parsed) return parsed
  }
  return null
}

export function isPlaceholderCaption(text) {
  const s = String(text || '').replace(/\s+/g, '')
  if (!s) return true
  if (/^(瞬间|照片|图片|图|相片|旅途片刻|片刻|记录|打卡|场景)[\d一二三四五六七八九十]+$/.test(s)) return true
  if (/^[\d一二三四五六七八九十]+$/.test(s)) return true
  if (['旅途片刻', '瞬间', '照片', '未命名', '图片', '场景'].includes(s)) return true
  return false
}

function isWeakTitle(text) {
  const s = String(text || '').replace(/\s+/g, '')
  if (!s) return true
  if (['旅行手帐', '我的旅行手帐', '旅行日记', '手帐'].includes(s)) return true
  return false
}

function normalizeRole(role, index) {
  const value = String(role || '').toLowerCase()
  if (['hero', 'main', '主图', '封面'].includes(value)) return value === 'main' ? 'main' : 'hero'
  if (['support', 'supporting', '辅图', '配图'].includes(value)) return 'support'
  return index === 1 ? 'hero' : 'support'
}

function ensureSingleHero(photos) {
  const ranked = [...photos].sort((a, b) => {
    const roleScore = role => (role === 'hero' ? 2 : role === 'main' ? 1 : 0)
    return roleScore(b.suggestedRole) - roleScore(a.suggestedRole) || (b.importance || 0) - (a.importance || 0)
  })
  const heroIndex = ranked[0]?.index
  return photos.map(photo => ({
    ...photo,
    suggestedRole: photo.index === heroIndex ? 'hero' : (photo.suggestedRole === 'hero' ? 'support' : photo.suggestedRole)
  }))
}

function fallbackCaption({ tone, index, scene, subject, location, mood }) {
  const dest = clip(location, 6)
  for (const candidate of [
    subject ? `${clip(subject, 8)}的样子` : '',
    scene ? `${clip(scene, 8)}小记` : '',
    dest ? `${dest}一角` : '',
    index === 1 && mood ? clip(mood, 10) : '',
    subject,
    scene
  ]) {
    const cap = clip(candidate, 12)
    if (cap && !isPlaceholderCaption(cap)) return cap
  }
  return pick(tone.fallbackCaptions, index - 1)
}

function fallbackTitle({ tone, location }) {
  const dest = clip(location, 6)
  if (dest) return clip(`${dest}手记`, 14)
  return pick(tone.fallbackTitles, 0)
}

function fallbackIntro({ tone, mood, location }) {
  if (mood) return clip(mood, 35)
  if (location) return clip(`在${clip(location, 8)}，把这一天轻轻记下。`, 35)
  return pick(tone.fallbackIntros, 0)
}

/**
 * 把视觉模型原始 JSON 收成画布可用结构；缺字段/占位文案用风格回退补齐。
 */
export function normalizeVisionAnalysis(raw, {
  photoCount,
  location = '',
  mood = '',
  style = 'retro'
} = {}) {
  const preset = getStylePreset(style)
  const tone = preset.copyTone || {}
  const sourcePhotos = Array.isArray(raw?.photos) ? raw.photos : []

  let photos = []
  for (let i = 1; i <= photoCount; i++) {
    const found = sourcePhotos.find(item => Number(item.index) === i) || {}
    const scene = clip(found.scene, 20)
    const subject = clip(found.subject, 16)
    let caption = clip(found.caption, 12)
    if (isPlaceholderCaption(caption)) {
      caption = fallbackCaption({ tone, index: i, scene, subject, location, mood })
    }
    const importanceRaw = Number(found.importance)
    photos.push({
      index: i,
      order: Number(found.order) > 0 ? Number(found.order) : i,
      scene,
      subject,
      caption,
      category: clip(found.category, 20),
      orientation: clip(found.orientation, 16),
      importance: Number.isFinite(importanceRaw) ? Math.min(1, Math.max(0, importanceRaw)) : Math.max(0.25, 0.72 - (i - 1) * 0.05),
      suggestedRole: normalizeRole(found.suggestedRole, i)
    })
  }
  photos = ensureSingleHero(photos)

  let title = clip(raw?.title, 14)
  if (isWeakTitle(title)) title = fallbackTitle({ tone, location })

  let highlight = clip(raw?.highlight, 12)
  if (!highlight || isPlaceholderCaption(highlight)) {
    highlight = clip(location, 12) || tone.fallbackHighlight || '旅途主题'
  }

  let intro = clip(raw?.intro, 35)
  if (!intro || isPlaceholderCaption(intro)) {
    intro = fallbackIntro({ tone, mood, location })
  }

  return { title, highlight, intro, photos }
}

export function buildFallbackVisionAnalysis(ctx) {
  return normalizeVisionAnalysis(null, ctx)
}

/** 视觉分析提示：风格语气真正写入要求 */
export function buildVisionPromptText({
  photoCount,
  location,
  date,
  mood,
  style
}) {
  const preset = getStylePreset(style)
  const tone = preset.copyTone || {}
  return `你是一位旅行手帐视觉编辑。请分析下面按顺序编号的 ${photoCount} 张旅行照片，并只返回 JSON，不要 Markdown 代码块。

结合旅行地点“${location || '未指定'}”、日期“${date || '未指定'}”、心情“${mood || '未指定'}”和手帐风格“${preset.label}”，返回：
{
  "title": "不超过14字的手帐标题",
  "highlight": "最值得强调的一个旅行主题，不超过12字",
  "intro": "不超过35字的开篇句",
  "photos": [
    {
      "index": 1,
      "order": 1,
      "scene": "照片场景",
      "subject": "主体（如有）",
      "caption": "不超过12字的照片短句",
      "category": "landscape|portrait|food|architecture|detail|other",
      "orientation": "landscape|portrait|square",
      "importance": 0.0,
      "suggestedRole": "hero|main|support"
    }
  ]
}

文案语气必须贴近风格「${preset.label}」：${tone.voice || '自然贴图'}。
${tone.diaryHint || ''}

硬性要求：
1. photos 必须覆盖每一张照片（index 1..${photoCount}）
2. order 为从 1 开始的展示顺序
3. caption 必须具体贴图，禁止「照片1」「瞬间2」「旅途片刻3」等占位写法
4. 不要编造照片中无法确认的人名、精确地名或事件
5. suggestedRole=hero 只给叙事最强的一张主图；其余用 main 或 support
6. importance 为 0 到 1
7. 只输出合法 JSON：不要尾逗号，不要注释，不要额外解释文字`
}

/** 日记 HTML prompt 的风格 + 视觉摘要 */
export function buildDiaryPromptExtras(vision, style) {
  const preset = getStylePreset(style)
  const tone = preset.copyTone || {}
  const captions = (vision?.photos || [])
    .slice()
    .sort((a, b) => (a.order || a.index) - (b.order || b.index))
    .map(photo => `第${photo.index}张(${photo.suggestedRole || 'support'})：${photo.caption || photo.scene || '未标注'}`)
    .join('\n')

  const visionBlock = vision
    ? `视觉标题：${vision.title || ''}
主题强调：${vision.highlight || ''}
开篇句：${vision.intro || ''}
照片旁注：
${captions || '无'}

请让日记具体呼应这些照片场景与旁注，不要添加视觉分析未确认的事实。`
    : '视觉分析不可用：请根据地点/心情写克制具体的日记，避免空泛套话。'

  return {
    styleLabel: preset.label,
    toneHint: `${tone.voice || ''}。${tone.diaryHint || ''}`.trim(),
    visionBlock
  }
}
