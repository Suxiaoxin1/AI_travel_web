import { writeFileSync } from 'node:fs'
import { provinceData, hotDestinations } from '../src/data/provinces.js'

const map = new Map()
for (const province of Object.values(provinceData)) {
  for (const spot of province.hotspots || []) {
    if (spot.name && spot.imageUrl) map.set(spot.name, spot.imageUrl)
  }
}

const covers = {}
for (const dest of hotDestinations) {
  const url = map.get(dest.name)
  if (url) covers[dest.name] = url
}

writeFileSync(
  new URL('../backend/app/data/attraction_covers.json', import.meta.url),
  `${JSON.stringify(covers, null, 2)}\n`,
  'utf8',
)
console.log(`wrote ${Object.keys(covers).length} covers`)
