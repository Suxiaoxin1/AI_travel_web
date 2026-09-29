/**
 * Frontend helpers for OTA booking intent links (mirrors backend booking_links).
 */

import { provinceData } from '../data/provinces.js'

const ALLOWED_HOST_SUFFIXES = [
  'ctrip.com',
  'trip.com',
  'fliggy.com',
  'taobao.com',
  'tmall.com'
]

const PLATFORM_ALIASES = {
  ctrip: 'ctrip',
  携程: 'ctrip',
  fliggy: 'fliggy',
  飞猪: 'fliggy',
  other: 'other',
  第三方: 'other'
}

export const PENDING_BOOKING_KEY = 'pendingBooking'
export const PENDING_TTL_MS = 30 * 60 * 1000

export function platformLabel(platform) {
  if (platform === 'ctrip' || platform === '携程') return '携程'
  if (platform === 'fliggy' || platform === '飞猪') return '飞猪'
  return '第三方'
}

export function normalizePlatform(value, url = '') {
  const text = String(value || '').trim()
  if (text) {
    const mapped = PLATFORM_ALIASES[text] || PLATFORM_ALIASES[text.toLowerCase()]
    if (mapped) return mapped
  }
  return detectPlatform(url)
}

export function detectPlatform(url) {
  try {
    const host = new URL(String(url || '').trim()).hostname.toLowerCase()
    if (host === 'ctrip.com' || host.endsWith('.ctrip.com') || host === 'trip.com' || host.endsWith('.trip.com')) {
      return 'ctrip'
    }
    if (
      host === 'fliggy.com' || host.endsWith('.fliggy.com') ||
      host === 'taobao.com' || host.endsWith('.taobao.com') ||
      host === 'tmall.com' || host.endsWith('.tmall.com')
    ) {
      return 'fliggy'
    }
  } catch {
    /* ignore */
  }
  return 'other'
}

export function isAllowedBookingUrl(url) {
  try {
    const parsed = new URL(String(url || '').trim())
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    const host = parsed.hostname.toLowerCase()
    return ALLOWED_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`)
    )
  } catch {
    return false
  }
}

export function normalizeBookingUrl(url) {
  const parsed = new URL(String(url || '').trim())
  parsed.hash = ''
  let path = parsed.pathname || '/'
  if (path !== '/' && path.endsWith('/')) path = path.replace(/\/+$/, '')
  parsed.pathname = path
  const params = [...parsed.searchParams.entries()].sort((a, b) => {
    if (a[0] === b[0]) return a[1].localeCompare(b[1])
    return a[0].localeCompare(b[0])
  })
  parsed.search = ''
  for (const [k, v] of params) parsed.searchParams.append(k, v)
  return parsed.toString()
}

export function defaultBookingTitle(sourceName, platform) {
  const name = String(sourceName || '').trim() || '旅行商品'
  return `${name} · ${platformLabel(platform)}`
}

export function sourceSubtitle(booking) {
  const name = booking?.source_name || booking?.province || ''
  if (booking?.source_type === 'spot') return `${name} · 景点门票`
  if (booking?.source_type === 'province') return `${name} · 省份跟团游`
  if (booking?.keyword) return booking.keyword
  return name || '旅行链接'
}

function provinceList() {
  return Object.values(provinceData || {})
}

/** Look up a landmark image for a booking from local province/spot data. */
export function resolveBookingCoverImage(booking) {
  if (!booking) return ''
  if (booking.cover_image_url || booking.image_url || booking.coverImageUrl) {
    return booking.cover_image_url || booking.image_url || booking.coverImageUrl
  }

  const sourceName = String(booking.source_name || '').trim()
  const provinceName = String(booking.province || '').trim()
  const haystack = [
    sourceName,
    provinceName,
    booking.title,
    booking.keyword
  ].filter(Boolean).join(' ')

  // Exact spot match first
  for (const province of provinceList()) {
    for (const spot of province.hotspots || []) {
      if (!spot?.imageUrl) continue
      if (sourceName && spot.name === sourceName) return spot.imageUrl
      if (haystack && haystack.includes(spot.name)) return spot.imageUrl
    }
  }

  // Province-level: use first hotspot cover
  const province = provinceList().find((p) => p.name === provinceName || p.name === sourceName)
  if (province?.hotspots?.[0]?.imageUrl) return province.hotspots[0].imageUrl

  return ''
}

/** Resolve cover for a destination name before jump (spot preferred). */
export function resolveDestinationCoverImage({ sourceType, sourceName, province } = {}) {
  return resolveBookingCoverImage({
    source_type: sourceType,
    source_name: sourceName,
    province
  })
}

/** Build + persist pending intent after jumping to OTA (overwrites previous). */
export function writePendingBooking({
  platform,
  url,
  keyword,
  sourceType = 'province',
  sourceName = '',
  province = '',
  coverImageUrl = ''
}) {
  const normalizedPlatform = normalizePlatform(platform, url)
  const cover = coverImageUrl || resolveDestinationCoverImage({
    sourceType,
    sourceName: sourceName || province,
    province: province || sourceName
  })
  const payload = {
    platform: normalizedPlatform,
    url,
    keyword: keyword || '',
    sourceType,
    sourceName: sourceName || province || '',
    province: province || sourceName || '',
    coverImageUrl: cover || '',
    linkType: 'search',
    createdAt: Date.now(),
    askDismissed: false
  }
  localStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(payload))
  return payload
}

export function readPendingBooking() {
  const raw = localStorage.getItem(PENDING_BOOKING_KEY)
  if (!raw) return null
  try {
    const data = JSON.parse(raw)
    if (!data?.url || !data?.createdAt) {
      localStorage.removeItem(PENDING_BOOKING_KEY)
      return null
    }
    if (Date.now() - data.createdAt > PENDING_TTL_MS) {
      localStorage.removeItem(PENDING_BOOKING_KEY)
      return null
    }
    return {
      ...data,
      platform: normalizePlatform(data.platform, data.url)
    }
  } catch {
    localStorage.removeItem(PENDING_BOOKING_KEY)
    return null
  }
}

export function clearPendingBooking() {
  localStorage.removeItem(PENDING_BOOKING_KEY)
}

export function markPendingAskDismissed() {
  const pending = readPendingBooking()
  if (!pending) return null
  const next = { ...pending, askDismissed: true }
  localStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(next))
  return next
}

export function buildCtripSearchUrl(keyword, provinceName = '') {
  const q = keyword || `${provinceName}跟团游`
  const sv = provinceName || keyword || ''
  return `https://vacations.ctrip.com/list/whole/sc.html?sv=${encodeURIComponent(sv)}&keyword=${encodeURIComponent(q)}`
}

export function buildFliggySearchUrl(keyword) {
  return `https://www.fliggy.com/search.htm?q=${encodeURIComponent(keyword)}`
}
