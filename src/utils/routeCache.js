const STORAGE_KEY = 'travel-route-cache:v2'
const DEFAULT_TTL = 2 * 60 * 60 * 1000
const memoryCache = new Map()

function buildCacheKey({ planId, dayIndex, strategy, spots, mode, segment }) {
  return JSON.stringify({
    planId: planId || 'draft',
    dayIndex,
    segment: segment ?? null,
    mode: mode || 'drive',
    strategy: strategy || 'time',
    spots: spots.map(spot => [Number(spot.lng), Number(spot.lat)])
  })
}

function readStorage() {
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeStorage(cache) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // sessionStorage 不可用时仍保留当前页面内的内存缓存。
  }
}

export function getRouteCache(params) {
  const key = buildCacheKey(params)
  if (memoryCache.has(key)) return memoryCache.get(key)

  const cache = readStorage()
  const entry = cache[key]
  if (!entry) return null

  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    delete cache[key]
    writeStorage(cache)
    return null
  }

  memoryCache.set(key, entry.route)
  return entry.route
}

export function setRouteCache(params, route, ttl = DEFAULT_TTL) {
  const key = buildCacheKey(params)
  const cache = readStorage()
  cache[key] = {
    expiresAt: Date.now() + ttl,
    route
  }
  writeStorage(cache)
  memoryCache.set(key, route)
}
