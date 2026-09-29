/** API 根（去掉 /api），用于本地开发拼接 uploads 绝对地址。 */
function apiOrigin() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8081/api'
  return String(apiBase).replace(/\/api\/?$/, '')
}

/** 将本站 uploads 绝对地址改成相对路径，便于入库与生产同源导出。 */
export function normalizeMediaUrl(url) {
  const text = String(url || '').trim()
  if (!text) return ''
  if (text.startsWith('data:') || text.startsWith('blob:')) return text
  const uploads = text.match(/^https?:\/\/[^/]+(\/uploads\/.+)$/i)
  if (uploads) return uploads[1]
  const legacy = text.match(/^https?:\/\/[^/]+\/upload\/(.+)$/i)
  if (legacy) return `/uploads/${legacy[1]}`
  return text
}

/**
 * 画布/导出展示用地址：
 * - 生产：相对 /uploads 同源
 * - 本地 Vite：拼到后端 origin，并靠 CORS + crossOrigin 导出
 */
export function resolveDisplayMediaUrl(url) {
  const normalized = normalizeMediaUrl(url)
  if (!normalized) return ''
  if (normalized.startsWith('data:') || normalized.startsWith('blob:')) return normalized
  if (normalized.startsWith('/uploads/') && import.meta.env.DEV) {
    return `${apiOrigin()}${normalized}`
  }
  return normalized
}

/** 是否需要 crossOrigin=anonymous（外域 http(s) 图）。 */
export function needsAnonymousCors(url) {
  const text = String(url || '').trim()
  if (!text || text.startsWith('data:') || text.startsWith('blob:') || text.startsWith('/')) {
    return false
  }
  if (!/^https?:\/\//i.test(text)) return false
  try {
    return new URL(text, window.location.origin).origin !== window.location.origin
  } catch {
    return true
  }
}
