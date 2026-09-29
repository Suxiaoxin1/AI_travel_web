/**
 * FILM VOLO 成片：表单约定 + 对接独立视频后端（odyssee）
 *
 * ---------------------------------------------------------------------------
 * 架构说明（与主站 FastAPI :8081 无关）
 *
 *   TravelJournal.vue (FILM Tab)
 *        └─ VoloFilmWorkspace.vue  ← UI：表单 + idle/composing/success/failed
 *               └─ 本文件 filmCompose.js
 *                      ├─ onStartCompose          ← 主成片链路
 *                      └─ generateFilmNarration   ← 可选：先写旁白
 *
 *   视频后端 VITE_FILM_API_BASE（生产必配；本地未配时回退 localhost:3000）
 *      POST /api/upload                 上传照片 → imagePaths
 *      POST /api/analyze                可选 AI 旁白（看图写 story）
 *      POST /api/ai/film/tasks          主站注入万相密钥后转发建任务
 *      GET  /api/video-engine/tasks/:id 轮询进度（内存任务，重启会丢）
 *           └─ 百炼 wan2.7-r2v 图生动态片段 → FFmpeg 合并/混音 → /uploads/*.mp4
 *
 * 主成片链路（onStartCompose）：
 *   校验表单 → 上传 → 创建任务 → 每 FILM_POLL_INTERVAL_MS 轮询 → videoUrl
 *
 * 旁白文案优先级（resolveNarrationText）：
 *   旁白框 → 旅行心得 →「一段关于{地点}的旅途回忆。」
 * ---------------------------------------------------------------------------
 *
 * @typedef {'720P' | '1080P'} FilmResolution
 * @typedef {'16:9' | '9:16' | '1:1' | '4:3' | '3:4'} FilmRatio
 * @typedef {'auto' | 'manual'} FilmDurationMode
 * @typedef {'female' | 'male'} FilmVoice
 * @typedef {'idle' | 'composing' | 'success' | 'failed'} FilmComposeUiStatus
 *
 * @typedef {Object} FilmPhotoItem
 * @property {string} id
 * @property {File} [file]
 * @property {string} previewUrl
 * @property {'ready' | 'uploading' | 'error'} status
 * @property {string} [error]
 *
 * @typedef {Object} FilmComposeForm
 * @property {FilmPhotoItem[]} photos
 * @property {string} location
 * @property {string} travelDate
 * @property {string} travelNote
 * @property {boolean} narrationEnabled
 * @property {string} narrationText
 * @property {FilmVoice} voice
 * @property {FilmResolution} resolution
 * @property {FilmRatio} ratio
 * @property {number} durationPerImage
 * @property {FilmDurationMode} durationMode
 * @property {string} requirement
 */

import apiClient from './apiClient.js'

export const FILM_MIN_PHOTOS = 3
export const FILM_MAX_PHOTOS = 8
export const FILM_MAX_FILE_MB = 10
export const FILM_DURATION_MIN = 2
export const FILM_DURATION_MAX = 15
export const FILM_ACCEPT = 'image/jpeg,image/png,image/jpg,image/webp,.jpg,.jpeg,.png,.webp'
/** 轮询最长等待；超时后前端提示重试（任务可能仍在后端跑） */
export const FILM_POLL_TIMEOUT_MS = 25 * 60 * 1000
/** 与流程图一致：约每 3 秒查一次任务状态 */
export const FILM_POLL_INTERVAL_MS = 3000

/**
 * 视频后端根地址（不含 /api 后缀）。
 * - 本地：http://localhost:3000
 * - 生产构建：/film-api（由 Nginx 反代到 film 容器）
 */
export function getFilmApiBase() {
  const raw = import.meta.env.VITE_FILM_API_BASE || import.meta.env.VITE_ODYSSEE_API_BASE || ''
  const trimmed = String(raw).replace(/\/+$/, '').replace(/\/api$/i, '')
  if (trimmed) return trimmed
  // 仅本地开发回退；生产构建必须在 Dockerfile.web 注入 VITE_FILM_API_BASE=/film-api
  if (import.meta.env.DEV) return 'http://localhost:3000'
  return ''
}

/** 合成 / 旁白前调用：生产缺 env 时给出明确错误 */
export function assertFilmApiReady() {
  const base = getFilmApiBase()
  if (!base) {
    throw new Error('未配置视频服务地址（VITE_FILM_API_BASE），无法合成')
  }
  return base
}

/**
 * 跨域友好的成片下载：fetch → blob → 临时 objectURL。
 * CORS 失败时抛错，由 UI 提示「右键视频另存为」。
 */
export async function downloadFilmVideo(url, filename = 'starwalk-volo-film.mp4') {
  const src = String(url || '').trim()
  if (!src) throw new Error('没有可下载的成片')
  const res = await fetch(src, { mode: 'cors' })
  if (!res.ok) throw new Error(`下载失败（HTTP ${res.status}）`)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1500)
  }
}

export const RESOLUTION_OPTIONS = [
  { value: '720P', label: '720P', hint: '推荐' },
  { value: '1080P', label: '1080P', hint: '' }
]

export const RATIO_OPTIONS = [
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' }
]

/** 预览区进度文案：key 来自 mapBackendStage / onStartCompose 主动上报 */
export const STAGE_LABELS = {
  upload: '正在上传照片…',
  narration: '正在生成旁白…',
  submit: '正在提交合成任务…',
  motion: '正在生成动态画面…',
  merge: '正在合并成片…',
  mix: '正在混入旁白…',
  default: '正在合成旅途小电影…'
}

/** @returns {FilmComposeForm} */
export function createEmptyFilmForm() {
  return {
    photos: [],
    location: '',
    travelDate: '',
    travelNote: '',
    narrationEnabled: true,
    narrationText: '',
    voice: 'female',
    resolution: '720P',
    ratio: '16:9',
    durationPerImage: 8,
    durationMode: 'manual',
    requirement: ''
  }
}

export function createPhotoId() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 合成前前端校验：张数 / 分辨率 / 比例 / 单张时长 / 旁白开时文案非空
 * @param {FilmComposeForm} form
 * @returns {{ ok: boolean, message?: string }}
 */
export function validateFilmComposeForm(form) {
  const count = form.photos?.length || 0
  if (count < FILM_MIN_PHOTOS) {
    return { ok: false, message: `请至少上传 ${FILM_MIN_PHOTOS} 张旅途照片` }
  }
  if (count > FILM_MAX_PHOTOS) {
    return { ok: false, message: `最多上传 ${FILM_MAX_PHOTOS} 张照片` }
  }
  if (!form.resolution) return { ok: false, message: '请选择分辨率' }
  if (!form.ratio) return { ok: false, message: '请选择画幅比例' }
  const duration = Number(form.durationPerImage)
  if (!Number.isFinite(duration) || duration < FILM_DURATION_MIN || duration > FILM_DURATION_MAX) {
    return { ok: false, message: `单张时长需在 ${FILM_DURATION_MIN}–${FILM_DURATION_MAX} 秒之间` }
  }
  if (form.narrationEnabled) {
    const text = resolveNarrationText(form)
    if (!text) return { ok: false, message: '旁白开启时请填写旁白文案或旅行心得' }
  }
  return { ok: true }
}

/**
 * 旁白正文解析（提交任务与校验共用）
 * 优先级：旁白文案框 → 旅行心得 → 地点模板句
 * @param {FilmComposeForm} form
 */
export function resolveNarrationText(form) {
  const direct = String(form.narrationText || '').trim()
  if (direct) return direct
  const note = String(form.travelNote || '').trim()
  if (note) return note
  const loc = String(form.location || '').trim()
  if (loc) return `一段关于${loc}的旅途回忆。`
  return ''
}

/** UI 女声/男声 → 百炼音色名 */
function mapVoice(voice) {
  return voice === 'male' ? 'Fenrir' : 'Aoede'
}

function assertNotAborted(signal) {
  if (signal?.aborted) {
    const err = new Error('已取消')
    err.name = 'AbortError'
    throw err
  }
}

/**
 * 把后端 stage 中文（如「等待百炼：第 2 张 RUNNING」）映射成 STAGE_LABELS 的 key
 */
function mapBackendStage(stageText = '', withNarration = true) {
  const s = String(stageText)
  if (/旁白|TTS|语音/i.test(s)) return 'narration'
  if (/混入|混音|音轨/i.test(s)) return 'mix'
  if (/合并/i.test(s)) return 'merge'
  if (/百炼|万相|动态|片段|排队|处理|提交/i.test(s)) return 'motion'
  if (/上传/i.test(s)) return 'upload'
  return withNarration ? 'default' : 'motion'
}

function absoluteMediaUrl(pathOrUrl, apiBase = getFilmApiBase()) {
  const raw = String(pathOrUrl || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw) || raw.startsWith('blob:')) return raw
  if (raw.startsWith('/')) return `${apiBase}${raw}`
  return `${apiBase}/${raw}`
}

/**
 * ① 上传旅途照片 → POST /api/upload
 * @param {FilmPhotoItem[]} photos
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<string[]>} 相对路径，如 uploads/xxx.jpg（创建任务时用）
 */
export async function uploadFilmPhotos(photos, options = {}) {
  const apiBase = assertFilmApiReady()
  const formData = new FormData()
  let appended = 0

  for (const item of photos || []) {
    const file = item?.file
    if (!(file instanceof File)) {
      throw new Error('有照片缺少原始文件，请重新选择上传')
    }
    formData.append('photos', file, file.name || `photo_${appended + 1}.jpg`)
    appended += 1
  }

  if (!appended) throw new Error('没有可上传的照片')

  assertNotAborted(options.signal)
  const res = await fetch(`${apiBase}/api/upload`, {
    method: 'POST',
    body: formData,
    signal: options.signal
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    throw new Error(data?.error || `上传失败（HTTP ${res.status}）`)
  }

  const files = Array.isArray(data?.files) ? data.files : []
  if (!files.length) throw new Error('上传成功但未返回文件列表')

  return files.map((f) => String(f.path || '').replace(/^\//, '')).filter(Boolean)
}

/**
 * 【可选支路】AI 生成旁白文案（不触发成片）
 * 流程：upload → POST /api/analyze({ filePaths }) → story 字符串
 * UI「AI 生成旁白」调用；失败时由组件降级本地模板草稿
 * @param {FilmComposeForm} form
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<string>}
 */
export async function generateFilmNarration(form, options = {}) {
  if (!form?.photos?.length) {
    throw new Error('请先上传至少 1 张照片再生成旁白')
  }

  const apiBase = assertFilmApiReady()
  const imagePaths = await uploadFilmPhotos(form.photos, options)

  assertNotAborted(options.signal)
  const res = await fetch(`${apiBase}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePaths: imagePaths }),
    signal: options.signal
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    throw new Error(data?.error || `生成旁白失败（HTTP ${res.status}）`)
  }

  const story = String(data?.story?.story || data?.story || '').trim()
  if (!story) throw new Error('AI 未返回旁白文案')
  return story
}

/**
 * ② 创建异步成片任务 → POST /api/video-engine/tasks
 * 后端随后：百炼图生视频片段 → FFmpeg 合并/混旁白 → 写出 mp4
 */
async function createVideoTask(imagePaths, form, options = {}) {
  assertFilmApiReady()
  const narrationOn = form.narrationEnabled !== false
  const storyText = resolveNarrationText(form)
  const location = String(form.location || '').trim()
  const requirementParts = []
  if (form.requirement) requirementParts.push(String(form.requirement).trim())
  if (form.travelDate) requirementParts.push(`旅途时间：${String(form.travelDate).trim()}`)
  if (form.travelNote && form.travelNote !== storyText) {
    requirementParts.push(`旅行心得：${String(form.travelNote).trim().slice(0, 120)}`)
  }
  // 无声成片时「自动对齐旁白」无意义，强制手动时长
  const durationMode = !narrationOn || form.durationMode === 'manual' ? 'manual' : 'auto'

  const body = {
    imagePaths,
    withNarration: narrationOn,
    storyText: narrationOn ? storyText : undefined,
    voice: mapVoice(form.voice),
    location,
    sceneName: location,
    requirement: requirementParts.join('。') || '治愈风，镜头慢一点，适合旅行短视频',
    resolution: form.resolution || '720P',
    ratio: form.ratio || '16:9',
    durationPerImage: Number(form.durationPerImage) || 8,
    durationMode,
    descriptions: (form.photos || []).map(() => ({
      location,
      city: location,
      mood: ''
    }))
  }

  assertNotAborted(options.signal)
  let data = null
  try {
    const res = await apiClient.post('/ai/film/tasks', body, {
      signal: options.signal,
      timeout: 60000
    })
    data = res.data?.data || res.data
  } catch (err) {
    if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') throw err
    const detail = err?.response?.data?.detail
    throw new Error(typeof detail === 'string' ? detail : (err?.message || '创建任务失败'))
  }

  const taskId = data?.task_id
  if (!taskId) throw new Error('未返回 task_id')
  return { taskId, initial: data }
}

/**
 * ③ 轮询任务状态 → GET /api/video-engine/tasks/:id
 * completed 时取 videoUrl/finalUrl；failed / 超时则抛错给 UI
 */
async function pollVideoTask(taskId, form, options = {}) {
  const apiBase = assertFilmApiReady()
  const started = Date.now()
  const withNarration = form.narrationEnabled !== false

  while (Date.now() - started < FILM_POLL_TIMEOUT_MS) {
    assertNotAborted(options.signal)

    const res = await fetch(`${apiBase}/api/video-engine/tasks/${taskId}`, {
      signal: options.signal
    })
    let task = null
    try {
      task = await res.json()
    } catch {
      task = null
    }

    if (!res.ok) {
      throw new Error(task?.error || `查询任务失败（HTTP ${res.status}）`)
    }

    const stageKey = mapBackendStage(task.stage || task.status, withNarration)
    const progress = typeof task.progress === 'number' ? task.progress : undefined
    options.onStage?.(stageKey, progress)

    if (task.status === 'completed' && (task.videoUrl || task.finalUrl)) {
      const videoUrl = absoluteMediaUrl(task.videoUrl || task.finalUrl, apiBase)
      return { videoUrl, task }
    }
    if (task.status === 'failed') {
      throw new Error(task.error || '合成失败，请重试')
    }

    await new Promise((resolve) => setTimeout(resolve, FILM_POLL_INTERVAL_MS))
  }

  throw new Error(`等待超时（任务 ${taskId}），请稍后重试或向后端核对进度`)
}

/**
 * 【主成片入口】UI「开始合成旅途小电影」最终调用这里
 *
 *   onStage('upload')  → POST /api/upload
 *   onStage('submit')  → POST /api/video-engine/tasks
 *   onStage(...)       → GET  /api/video-engine/tasks/:id（约 3s 一次）
 *   return { videoUrl } → 预览区播放 / 下载（绝对 URL）
 *
 * 禁止把密钥写进仓库；本页可临时填写万相 Key（仅本机 localStorage + 发给视频后端）。
 *
 * @param {FilmComposeForm} formPayload
 * @param {{ onStage?: (stage: string, progress?: number) => void, signal?: AbortSignal }} [options]
 * @returns {Promise<{ videoUrl: string, meta: Record<string, unknown> }>}
 */
export async function onStartCompose(formPayload, options = {}) {
  const { onStage, signal } = options
  assertFilmApiReady()
  const form = {
    ...formPayload,
    narrationText: resolveNarrationText(formPayload)
  }

  // ① 上传照片
  onStage?.('upload', 5)
  const imagePaths = await uploadFilmPhotos(form.photos, { signal })

  // ② 创建成片任务（含旁白开关 / 分辨率 / 比例 / 时长策略等）
  onStage?.('submit', 12)
  const { taskId } = await createVideoTask(imagePaths, form, { signal })

  // ③ 轮询直到 completed（后端：百炼动效 → FFmpeg 合并）
  onStage?.(form.narrationEnabled ? 'narration' : 'motion', 18)
  const { videoUrl, task } = await pollVideoTask(taskId, form, { onStage, signal })

  return {
    videoUrl,
    meta: {
      stub: false,
      taskId,
      photoCount: form.photos.length,
      resolution: form.resolution,
      ratio: form.ratio,
      durationMode: form.narrationEnabled === false || form.durationMode === 'manual' ? 'manual' : 'auto',
      durationPerImage: form.durationPerImage,
      narrationEnabled: form.narrationEnabled,
      alignment: task?.alignment || null,
      engine: task?.engine || null
    }
  }
}

/**
 * @param {File} file
 * @returns {{ ok: boolean, message?: string }}
 */
export function validateFilmImageFile(file) {
  if (!file) return { ok: false, message: '无效文件' }
  const type = String(file.type || '').toLowerCase()
  const name = String(file.name || '').toLowerCase()
  const okType =
    /image\/(jpeg|jpg|png|webp)/i.test(type) ||
    (!type && /\.(jpe?g|png|webp)$/i.test(name))
  if (!okType) return { ok: false, message: '仅支持 JPG / PNG / WebP' }
  if (file.size > FILM_MAX_FILE_MB * 1024 * 1024) {
    return { ok: false, message: `单张不超过 ${FILM_MAX_FILE_MB}MB` }
  }
  return { ok: true }
}
