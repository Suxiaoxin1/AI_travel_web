<template>
  <div class="map-wrapper" :class="{ 'map-shrinked': shrinked }">
    <div class="map-status" id="mapStatus">{{ statusText }}</div>
    <div class="province-tooltip" ref="tooltipRef" :class="{ visible: tooltipVisible }">
      <span class="tooltip-name">{{ tooltipName }}</span>
      <span class="tooltip-hint">点击探索</span>
    </div>
    <svg ref="svgRef" id="china-map-svg" preserveAspectRatio="xMidYMid meet" class="map-svg"></svg>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'
import { feature } from 'topojson-client'
import { useMapStore } from '../stores/mapStore.js'
import { provinceData } from '../data/provinces.js'
import { provinceCenters } from '../data/province-centers.js'

const store = useMapStore()
const props = defineProps({ shrinked: Boolean })
const emit = defineEmits(['province-click'])

const svgRef = ref(null)
const tooltipRef = ref(null)
const statusText = ref('加载中...')
const tooltipVisible = ref(false)
const tooltipName = ref('')

let svg = null
let projection = null
let path = null
let zoom = null
let g = null
let allPaths = null
let tooltipDiv = null
let geoData = null
let isFallback = false
let selectedProvince = null

const VB_W = 960
const VB_H = 850

function say(m) {
  statusText.value = m
  console.log('[Map] ' + m)
}

async function initMap() {
  if (!svgRef.value) {
    say('SVG ref is null')
    return
  }

  if (svg) {
    svg.on('.zoom', null)
    svg.selectAll('*').remove()
  }
  if (tooltipDiv) tooltipDiv.remove()
  svg = null
  g = null
  allPaths = null
  geoData = null
  isFallback = false

  svg = d3.select(svgRef.value)
    .attr('viewBox', `0 0 ${VB_W} ${VB_H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('width', '100%')
    .style('height', '100%')
  svg.selectAll('*').remove()

  const defs = svg.append('defs')

  defs.append('filter').attr('id', 'shadow')
    .append('feDropShadow')
    .attr('dx', 0).attr('dy', 2)
    .attr('stdDeviation', 4)
    .attr('flood-color', 'rgba(0,0,0,0.15)')

  defs.append('filter').attr('id', 'glow-selected')
    .append('feDropShadow')
    .attr('dx', 0).attr('dy', 0)
    .attr('stdDeviation', 10)
    .attr('flood-color', '#1A8A7A')
    .attr('flood-opacity', 0.8)

  defs.append('filter').attr('id', 'glow')
    .append('feDropShadow')
    .attr('dx', 0).attr('dy', 0)
    .attr('stdDeviation', 8)
    .attr('flood-color', '#D4A84B')
    .attr('flood-opacity', 0.6)

  g = svg.append('g').attr('class', 'map-group')

  projection = d3.geoMercator()
    .center([104, 35])
    .scale(700)
    .translate([VB_W / 2, VB_H / 2 + 50])

  path = d3.geoPath().projection(projection)

  zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on('zoom', (e) => {
      g.attr('transform', e.transform)
    })
  svg.call(zoom)

  tooltipDiv = d3.select('body').append('div')
    .attr('class', 'map-tooltip')
    .style('position', 'absolute')
    .style('display', 'none')
    .style('background', 'rgba(26,26,46,0.9)')
    .style('color', '#fff')
    .style('padding', '8px 14px')
    .style('border-radius', '8px')
    .style('font-size', '14px')
    .style('pointer-events', 'none')
    .style('backdrop-filter', 'blur(8px)')
    .style('z-index', '1000')
    .style('border', '1px solid rgba(212,168,75,0.3)')
    .style('font-family', '"Noto Sans SC", sans-serif')

  const data = await loadGeoJSON()

  if (data) {
    try {
      let geojson
      if (data.objects) {
        const key = Object.keys(data.objects)[0]
        if (!key) throw new Error('TopoJSON 无有效对象键')
        geojson = feature(data, data.objects[key])
      } else {
        geojson = data
      }

      if (!geojson.features || geojson.features.length === 0) {
        throw new Error('GeoJSON 无 features')
      }

      renderMapFeatures(geojson.features)
      addSouthChinaSeaBox()
      say('地图渲染完成！')
    } catch (e) {
      console.error('解析 GeoJSON 失败:', e)
      renderFallbackNodes()
      say('使用降级节点地图')
    }
  } else {
    renderFallbackNodes()
    say('使用降级节点地图')
  }
}

async function loadGeoJSON() {
  const sources = [
    { name: '代理 /api/map', url: '/api/map', timeout: 6000 },
    { name: '直连 datav', url: 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json', timeout: 6000 }
  ]

  for (const s of sources) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), s.timeout)
      const resp = await fetch(s.url, { signal: controller.signal })
      clearTimeout(timer)
      if (!resp.ok) {
        console.warn(s.name + ' HTTP ' + resp.status)
        continue
      }
      const json = await resp.json()
      const size = JSON.stringify(json).length
      const keys = Object.keys(json).join(', ')
      console.log('数据源 ' + s.name + ' 成功，大小 ' + (size/1024).toFixed(0) + 'KB，顶层键: ' + keys)
      return json
    } catch (e) {
      console.warn('数据源 ' + s.name + ': ' + e.message)
    }
  }
  console.log('所有远程源不可用，使用降级节点地图')
  return null
}

function renderMapFeatures(features) {
  isFallback = false
  allPaths = g.selectAll('.province-path')
    .data(features)
    .enter()
    .append('path')
    .attr('class', 'province-path')
    .attr('d', path)
    .attr('fill', (d) => {
      const adcode = d.properties?.adcode || d.properties?.code
      const pd = adcode ? provinceData[adcode] : null
      return pd ? pd.color : '#B8C5B0'
    })
    .attr('stroke', '#F8F6F0')
    .attr('stroke-width', 1)
    .attr('opacity', 1)
    .style('filter', 'url(#shadow)')
    .style('cursor', 'pointer')

  allPaths
    .on('mouseenter', function(event, d) {
      const adcode = d.properties?.adcode || d.properties?.code
      const pd = provinceData[adcode]
      d3.select(this)
        .transition().duration(200)
        .attr('opacity', 1)
        .attr('stroke-width', 2.5)
        .attr('stroke', '#D4A84B')
        .style('filter', 'url(#glow)')
      showTooltip(d, event)
    })
    .on('mousemove', function(event) {
      moveTooltip(event)
    })
    .on('mouseleave', function(event, d) {
      d3.select(this)
        .transition().duration(200)
        .attr('opacity', 0.95)
        .attr('stroke-width', 1)
        .attr('stroke', '#F8F6F0')
        .style('filter', 'url(#shadow)')
      hideTooltip()
    })
    .on('click', function(event, d) {
      const adcode = d.properties?.adcode || d.properties?.code
      const pd = provinceData[adcode]
      if (pd) {
        handleProvinceClick(adcode, pd)
      } else {
        const name = d.properties?.name || ''
        const matched = findProvinceByName(name)
        if (matched) {
          handleProvinceClick(matched.code, matched.data)
        }
      }
    })

  updateSelectionFromStore()
}

function renderFallbackNodes() {
  isFallback = true
  allPaths = null

  const ng = g.append('g').attr('class', 'node-group')

  Object.entries(provinceCenters).forEach(([code, data]) => {
    const pd = provinceData[code]
    const center = projection([data.lng, data.lat])
    if (!center || center.some(isNaN)) return

    const name = pd ? pd.name : data.name
    const color = pd ? pd.color : '#1A8A7A'

    const node = ng.append('g')
      .attr('class', 'province-node')
      .attr('data-code', code)
      .attr('transform', 'translate(' + center[0] + ',' + center[1] + ')')
      .style('cursor', 'pointer')

    node.append('circle')
      .attr('r', 10)
      .attr('fill', color)
      .attr('opacity', 0.8)
      .attr('stroke', '#F8F6F0')
      .attr('stroke-width', 1.5)

    node.append('text')
      .attr('y', -16)
      .attr('text-anchor', 'middle')
      .attr('fill', '#5C5C6E')
      .attr('font-size', '11')
      .attr('font-weight', '600')
      .attr('font-family', '"Noto Sans SC", sans-serif')
      .text(name)

    node.on('mouseenter', function() {
      d3.select(this).select('circle').attr('r', 14).attr('opacity', 1)
    }).on('mouseleave', function() {
      d3.select(this).select('circle').attr('r', 10).attr('opacity', 0.8)
    }).on('click', function() {
      const pd = provinceData[code]
      if (pd) handleProvinceClick(code, pd)
    })
  })

  say('使用降级节点地图')
}

function findProvinceByName(name) {
  for (const [code, pd] of Object.entries(provinceData)) {
    if (pd.name === name) {
      return { code, data: pd }
    }
  }
  for (const [code, pd] of Object.entries(provinceData)) {
    if (name.includes(pd.name) || pd.name.includes(name)) {
      return { code, data: pd }
    }
  }
  return null
}

function handleProvinceClick(code, data) {
  console.log('点击省份:', data.name, code)
  selectedProvince = code
  store.selectProvince(code)
  emit('province-click', { id: code, ...data })
}

function updateSelectionFromStore() {
  if (!allPaths) return
  const code = store.selectedProvinceCode
  if (!code) return

  allPaths.each(function(d) {
    const adcode = d.properties?.adcode || d.properties?.code
    const pd = provinceData[adcode]
    const nameMatch = pd && pd.name === store.selectedProvince?.name
    if (String(adcode) === String(code) || nameMatch) {
      d3.select(this)
        .transition().duration(500)
        .attr('opacity', 1)
        .attr('stroke-width', 2)
        .attr('stroke', '#1A8A7A')
        .style('filter', 'url(#glow-selected)')
    }
  })
}

function addSouthChinaSeaBox() {
  g.append('rect')
    .attr('x', 850).attr('y', 700)
    .attr('width', 80).attr('height', 90)
    .attr('fill', 'none')
    .attr('stroke', '#B8C5B0')
    .attr('stroke-width', 0.5)
    .attr('rx', 4)
  g.append('text')
    .attr('x', 890).attr('y', 750)
    .attr('text-anchor', 'middle')
    .attr('fill', '#B8C5B0')
    .attr('font-size', '10')
    .attr('font-family', '"Noto Sans SC", sans-serif')
    .text('南海诸岛')
}

function showTooltip(d, event) {
  const adcode = d.properties?.adcode || d.properties?.code
  const pd = provinceData[adcode]
  tooltipDiv.style('display', 'block')
    .html(pd
      ? '<strong>' + pd.name + '</strong><br/>' + (pd.hotspotCount || 0) + '个景点 · 评分 ' + (pd.avgRating || '-')
      : '<strong>' + (d.properties?.name || adcode) + '</strong>')
}

function moveTooltip(event) {
  tooltipDiv
    .style('left', (event.pageX + 15) + 'px')
    .style('top', (event.pageY - 10) + 'px')
}

function hideTooltip() {
  tooltipDiv.style('display', 'none')
}

watch(() => store.selectedProvinceCode, (code) => {
  if (!allPaths) return
  if (code) {
    allPaths.each(function(d) {
      const adcode = d.properties?.adcode || d.properties?.code
      const pd = provinceData[adcode]
      const nameMatch = pd && pd.name === store.selectedProvince?.name
      const isSelected = String(adcode) === String(code) || nameMatch
      const p = d3.select(this)
      if (isSelected) {
        p.transition().duration(500)
          .attr('opacity', 1)
          .attr('stroke-width', 2)
          .attr('stroke', '#1A8A7A')
          .style('filter', 'url(#glow-selected)')
      } else {
        p.transition().duration(500)
          .attr('opacity', 0.5)
          .attr('stroke-width', 0.8)
          .attr('stroke', '#F8F6F0')
          .style('filter', 'url(#shadow)')
      }
    })
  } else {
    allPaths.transition().duration(500)
      .attr('opacity', 0.85)
      .attr('stroke-width', 0.8)
      .attr('stroke', '#F8F6F0')
      .style('filter', 'url(#shadow)')
  }
})

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (svg) {
    svg.on('.zoom', null)
    svg.selectAll('*').remove()
  }
  if (tooltipDiv) tooltipDiv.remove()
  geoData = null
  selectedProvince = null
})
</script>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
  border: 1px solid #E5E0D6;
  border-radius: 12px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.map-wrapper.map-shrinked {
  width: 65%;
}

.map-status {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 99;
  font-size: 12px;
  font-family: 'Noto Sans SC', sans-serif;
  background: rgba(248, 246, 240, 0.9);
  backdrop-filter: blur(8px);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #D4A84B;
  color: #1A1A2E;
}

.province-tooltip {
  position: absolute;
  z-index: 100;
  background: #FFFFFF;
  backdrop-filter: blur(12px);
  border: 1px solid #D4A84B;
  border-radius: 8px;
  padding: 8px 14px;
  pointer-events: none;
  opacity: 0;
  transform: translateY(5px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  box-shadow: 0 4px 20px rgba(212, 168, 75, 0.15);
}

.province-tooltip.visible {
  opacity: 1;
  transform: translateY(0);
}

.province-tooltip .tooltip-name {
  display: block;
  color: #1A1A2E;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Noto Sans SC', sans-serif;
}

.province-tooltip .tooltip-hint {
  display: block;
  color: #1A8A7A;
  font-size: 11px;
  margin-top: 2px;
  font-family: 'Noto Sans SC', sans-serif;
}

.map-svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
