import apiClient from './apiClient.js'

const memoryCache = new Map()
const inflight = new Map()

function cacheKey(label, tagType, city = '', excludeKey = '') {
  return `${tagType || 'experience'}::${(label || '').trim()}::${(city || '').trim()}::${excludeKey}`
}

/** 将本站 uploads 的 http(s)://host/... 绝对地址改成相对路径，避免 Mixed Content。 */
function normalizeImageUrl(url) {
  const text = String(url || '').trim()
  if (!text) return ''
  const m = text.match(/^https?:\/\/[^/]+(\/uploads\/.+)$/i)
  if (m) return m[1]
  const m2 = text.match(/^https?:\/\/[^/]+\/upload\/(.+)$/i)
  if (m2) return `/uploads/${m2[1]}`
  return text
}

function excludeSignature(excludeUrls = []) {
  return (excludeUrls || [])
    .map((u) => normalizeImageUrl(u) || String(u || '').trim())
    .filter(Boolean)
    .sort()
    .join('|')
}

/**
 * 解析标签预览图：优先内存缓存 → 本地图 → 后端图库/图搜落地。
 * @returns {Promise<{ image_url: string, source?: string, attribution?: string, cached?: boolean }>}
 */
export async function resolveTagPreview({
  label,
  tagType = 'experience',
  city = '',
  localImage = '',
  excludeUrls = [],
} = {}) {
  const excludes = (excludeUrls || [])
    .map((u) => normalizeImageUrl(u) || String(u || '').trim())
    .filter(Boolean)
  const key = cacheKey(label, tagType, city, excludeSignature(excludes))
  if (memoryCache.has(key)) {
    const cached = memoryCache.get(key)
    // 若缓存图已在排除列表，丢弃并重搜
    if (!excludes.includes(cached.image_url)) return cached
    memoryCache.delete(key)
  }
  if (inflight.has(key)) {
    return inflight.get(key)
  }

  const local = (localImage || '').trim()
  if (local && !excludes.includes(normalizeImageUrl(local))) {
    const quick = {
      image_url: normalizeImageUrl(local),
      source: 'local_bundle',
      attribution: '本地景点图库',
      cached: true,
    }
    memoryCache.set(key, quick)
    // 后台登记到服务端图库，不阻塞悬停首屏
    apiClient
      .post('/media/tag-preview', {
        label,
        tag_type: tagType,
        city: city || null,
        local_image: local,
        exclude_urls: excludes,
      })
      .catch(() => {})
    return quick
  }

  const request = apiClient
    .post('/media/tag-preview', {
      label,
      tag_type: tagType,
      city: city || null,
      exclude_urls: excludes,
    })
    .then((res) => {
      const data = res.data?.data || {}
      if (!data.image_url) {
        throw new Error('未返回图片')
      }
      data.image_url = normalizeImageUrl(data.image_url)
      memoryCache.set(key, data)
      return data
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, request)
  return request
}

export function peekTagPreviewCache(label, tagType = 'experience', city = '') {
  return memoryCache.get(cacheKey(label, tagType, city, '')) || null
}
