<template>
  <div ref="mapContainer" class="amap-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import { provinceCenters } from '../data/province-centers.js'
import { provinceData } from '../data/provinces.js'

const mapContainer = ref(null)
const emit = defineEmits(['province-click'])
const AMap_KEY = import.meta.env.VITE_AMAP_KEY || ''

let map = null
let markers = []
let tooltipEl = null
let tooltipUnbind = null
let resizeHandler = null
let intersectionObserver = null

onMounted(async () => {
  const AMap = await AMapLoader.load({
    key: AMap_KEY,
    version: '2.0',
    plugins: ['AMap.DistrictSearch', 'AMap.ToolBar', 'AMap.Scale']
  })

  map = new AMap.Map(mapContainer.value, {
    zoom: 4,
    center: [104.5, 35],
    mapStyle: 'amap://styles/blank',
    resizeEnable: true,
    showLabel: true,
    suppressMapPluginBlock: true
  })

  const refreshMapSize = () => {
    if (!map) return
    try {
      map.resize()
    } catch {
      /* ignore */
    }
  }

  map.once('complete', () => {
    const tileLayer = new AMap.TileLayer({ opacity: 0.55 })
    tileLayer.setMap(map)
    refreshMapSize()
    window.setTimeout(refreshMapSize, 120)
    window.setTimeout(refreshMapSize, 480)
  })

  map.add(new AMap.ToolBar())
  map.add(new AMap.Scale())

  resizeHandler = () => refreshMapSize()
  window.addEventListener('resize', resizeHandler)

  if (typeof IntersectionObserver !== 'undefined' && mapContainer.value) {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) refreshMapSize()
      },
      { threshold: 0.15 }
    )
    intersectionObserver.observe(mapContainer.value)
  }

  // 隐藏高德 logo
  const hideLogo = () => {
    const style = document.createElement('style')
    style.textContent = `
      .amap-logo, .amap-copyright, .aui-page-header,
      .aui-bar-top, .aui-bar-bottom, .aui-bar-center,
      .AMapLogo, .amap-controlcontainer + img,
      [class*="amap-logo"], [class*="amap-copyright"],
      [class*="aui-bar"] {
        display: none !important;
        visibility: hidden !important;
      }
    `
    document.head.appendChild(style)
  }
  hideLogo()
  setTimeout(hideLogo, 3000)

  // 省份名称标签
  const district = new AMap.DistrictSearch({ extensions: 'all', level: 'province' })
  district.search('中国', (status, result) => {
    const allProvinces = result.districtList[0]?.subDistricts?.districtList || []
    allProvinces.forEach((province) => {
      const center = province.center
      if (center && province.name) {
        const textMarker = new AMap.Text({
          text: province.name,
          anchor: 'center',
          style: {
            'background-color': 'transparent',
            'border': 'none',
            'color': '#1A1A2E',
            'font-size': '13px',
            'font-weight': '600',
            'font-family': '"Noto Sans SC", sans-serif',
            'text-shadow': '0 0 4px rgba(255,255,255,0.9)'
          },
          center
        })
        map.add(textMarker)
      }
    })
  })

  addProvinceMarkers(AMap)
})

onUnmounted(() => {
  if (tooltipUnbind) tooltipUnbind()
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  if (intersectionObserver) {
    intersectionObserver.disconnect()
    intersectionObserver = null
  }
  if (map) map.destroy()
  map = null
})

function addProvinceMarkers(AMap) {
  const centers = Object.entries(provinceCenters)

  centers.forEach(([code, data]) => {
    const pd = provinceData[code]
    const hasHotspots = pd?.hotspots?.length > 0
    const color = pd?.color || '#B8C5B0'
    const lngLat = [data.lng, data.lat]

    const el = document.createElement('div')
    el.className = 'province-marker'
    el.style.cssText = `
      width: 12px;
      height: 12px;
      background: radial-gradient(circle at 35% 35%, #4ECDC4, #0D6B5C);
      border-radius: 50%;
      border: 2px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    `

    if (hasHotspots) {
      const glow = document.createElement('div')
      glow.style.cssText = `
        position: absolute; top: -3px; left: -3px;
        width: 14px; height: 14px;
        border-radius: 50%;
        border: 2px solid #1A8A7A;
        opacity: 0;
        transition: opacity 0.3s;
      `
      el.appendChild(glow)
      el.addEventListener('mouseenter', () => {
        glow.style.opacity = '0.5'
      })
      el.addEventListener('mouseleave', () => {
        glow.style.opacity = '0'
      })
    }

    const marker = new AMap.Marker({
      content: el,
      anchor: 'center',
      position: lngLat,
      extData: { code }
    })

    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.6)'
      el.style.boxShadow = '0 2px 10px rgba(13,107,92,0.4)'
      showTooltip(lngLat, data.name)
    })
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)'
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)'
      hideTooltip()
    })

    el.addEventListener('click', (e) => {
      e.stopPropagation()
      emit('province-click', code)
      highlightMarker(marker)
    })

    map.add(marker)
    markers.push(marker)
  })

  map.on('click', () => {
    markers.forEach(m => {
      const el = m.getContent()
      if (el && el.classList) {
        el.style.background = ''
        el.style.boxShadow = ''
      }
    })
  })
}

function highlightMarker(marker) {
  markers.forEach(m => {
    const el = m.getContent()
    if (el) {
      el.style.background = 'radial-gradient(circle at 35% 35%, #4ECDC4, #0D6B5C)'
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)'
    }
  })
  const el = marker.getContent()
  if (el) {
    el.style.background = 'radial-gradient(circle at 35% 35%, #D4A84B, #C23B22)'
    el.style.boxShadow = '0 0 0 3px rgba(212,168,75,0.4), 0 2px 10px rgba(194,59,34,0.4)'
    el.style.transform = 'scale(1.6)'
  }
}

function showTooltip(lngLat, name) {
  hideTooltip()
  tooltipEl = document.createElement('div')
  tooltipEl.style.cssText = `
    position: fixed;
    padding: 6px 12px;
    background: rgba(26,26,46,0.85);
    color: #fff;
    font-size: 13px;
    font-family: 'Noto Sans SC', sans-serif;
    border-radius: 6px;
    pointer-events: none;
    z-index: 1000;
    white-space: nowrap;
  `
  tooltipEl.textContent = name
  document.body.appendChild(tooltipEl)

  const updatePos = (e) => {
    if (tooltipEl) {
      tooltipEl.style.left = (e.clientX + 12) + 'px'
      tooltipEl.style.top = (e.clientY - 32) + 'px'
    }
  }

  const onMouseMove = (e) => updatePos(e)
  window.addEventListener('mousemove', onMouseMove)
  tooltipUnbind = () => {
    window.removeEventListener('mousemove', onMouseMove)
    if (tooltipEl) tooltipEl.remove()
    tooltipEl = null
  }

  const pixel = map.lngLatToPixel(lngLat)
  tooltipEl.style.left = (pixel.x + 12) + 'px'
  tooltipEl.style.top = (pixel.y - 32) + 'px'
}

function hideTooltip() {
  if (tooltipUnbind) {
    tooltipUnbind()
    tooltipUnbind = null
  }
}
</script>

<style>
.amap-container {
  width: 100%;
  height: 100%;
  min-height: 100%;
  background: #fff;
  transform: none;
  filter: none;
}
</style>
