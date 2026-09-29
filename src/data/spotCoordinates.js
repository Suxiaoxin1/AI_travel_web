/**
 * 本地精坐标库（GCJ-02，约 5–6 位小数），作高德定位失败时的兜底。
 * zone: island = 鼓浪屿等轮渡可达小岛；walk = 宜步行连片街区。
 */
const PRECISE_SPOTS = [
  { name: '鼓浪屿', lat: 24.44752, lng: 118.06348, zone: 'island', city: '厦门' },
  { name: '日光岩', lat: 24.44785, lng: 118.06492, zone: 'island', city: '厦门' },
  { name: '菽庄花园', lat: 24.44380, lng: 118.06620, zone: 'island', city: '厦门' },
  { name: '皓月园', lat: 24.45120, lng: 118.06680, zone: 'island', city: '厦门' },
  { name: '中山路步行街', lat: 24.45548, lng: 118.08255, zone: 'walk', city: '厦门' },
  { name: '厦门中山路', lat: 24.45548, lng: 118.08255, zone: 'walk', city: '厦门' },
  { name: '中山路', lat: 24.45548, lng: 118.08255, zone: 'walk', city: '厦门' },
  { name: '胡里山炮台', lat: 24.42955, lng: 118.10248, zone: 'walk', city: '厦门' },
  { name: '曾厝垵', lat: 24.43355, lng: 118.12852, zone: 'walk', city: '厦门' },
  { name: '环岛路', lat: 24.43480, lng: 118.14520, zone: 'drive', city: '厦门' },
  { name: '厦门大学', lat: 24.43755, lng: 118.09648, zone: 'walk', city: '厦门' },
  { name: '厦大', lat: 24.43755, lng: 118.09648, zone: 'walk', city: '厦门' },
  { name: '南普陀寺', lat: 24.44152, lng: 118.09255, zone: 'walk', city: '厦门' },
  { name: '南普陀', lat: 24.44152, lng: 118.09255, zone: 'walk', city: '厦门' },
  { name: '沙坡尾艺术西区', lat: 24.44355, lng: 118.08548, zone: 'walk', city: '厦门' },
  { name: '沙坡尾', lat: 24.44355, lng: 118.08548, zone: 'walk', city: '厦门' },
]

const ISLAND_KEYWORDS = ['鼓浪屿', '日光岩', '菽庄花园', '皓月园', '轮渡码头']

/** @type {Map<string, typeof PRECISE_SPOTS[0]>} */
const byExact = new Map(PRECISE_SPOTS.map((s) => [s.name, s]))

export function getPreciseSpotCoords(name) {
  const text = String(name || '').trim()
  if (!text) return null
  if (byExact.has(text)) {
    const hit = byExact.get(text)
    return { name: text, lat: hit.lat, lng: hit.lng, zone: hit.zone, city: hit.city, source: 'local_precise' }
  }
  let best = null
  for (const spot of PRECISE_SPOTS) {
    if (!(text.includes(spot.name) || spot.name.includes(text))) continue
    if (spot.name.length < 2) continue
    if (!best || spot.name.length > best.name.length) best = spot
  }
  if (!best || best.name.length < 2) return null
  return {
    name: text,
    lat: best.lat,
    lng: best.lng,
    zone: best.zone,
    city: best.city,
    source: 'local_precise',
  }
}

export function isIslandSpotName(name) {
  const text = String(name || '')
  const precise = getPreciseSpotCoords(text)
  if (precise?.zone === 'island') return true
  return ISLAND_KEYWORDS.some((k) => text.includes(k))
}

/**
 * 相邻两点路段模式：ferry | walk | drive
 */
export function resolveSegmentMode(a, b, distanceKm) {
  const aIsland = Boolean(a?.zone === 'island' || isIslandSpotName(a?.name))
  const bIsland = Boolean(b?.zone === 'island' || isIslandSpotName(b?.name))
  if (aIsland !== bIsland) return 'ferry'
  const km = Number(distanceKm)
  if (Number.isFinite(km) && km <= 2.8) return 'walk'
  if (a?.zone === 'walk' && b?.zone === 'walk' && Number.isFinite(km) && km <= 4) return 'walk'
  return 'drive'
}

export { PRECISE_SPOTS, ISLAND_KEYWORDS }
