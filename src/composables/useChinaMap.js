import { onMounted, onUnmounted, watch, ref, shallowRef, reactive } from 'vue'
import * as d3 from 'd3'
import { feature } from 'topojson-client'
import { useMapStore } from '../stores/mapStore.js'
import { provinceData } from '../data/provinces.js'
import { provinceCenters } from '../data/province-centers.js'

export function useChinaMap(svgRef, debugState) {
  const store = useMapStore()
  const loading = ref(true)
  const mapReady = shallowRef(false)

  let svg, projection, path, g, tooltipDiv
  let allPaths
  let isFallback = false
  const VB = { w: 960, h: 850 }

  function dbg(key, ok, msg) {
    if (debugState) debugState[key] = { ok, msg, time: Date.now() }
    console.log(`[图层 ${key}] ${ok ? '✅' : '❌'} ${msg}`)
  }

  // ===== 图层 1: SVG 容器 =====
  function step1_SVG() {
    if (!svgRef.value) { dbg('svg容器', false, 'svgRef.value 为空'); return false }
    const rect = svgRef.value.getBoundingClientRect()
    dbg('svg容器', true, `尺寸: ${rect.width.toFixed(0)}×${rect.height.toFixed(0)}`)

    svg = d3.select(svgRef.value)
      .attr('viewBox', `0 0 ${VB.w} ${VB.h}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%').style('height', '100%')
    svg.selectAll('*').remove()

    // 测试绘制 - 在角落画一个标记
    svg.append('circle').attr('cx', 20).attr('cy', 20).attr('r', 8)
      .attr('fill', '#1A8A7A').attr('opacity', 0.5)
    dbg('svg标记', true, '左上角绿色标记已绘制')
    return true
  }

  // ===== 图层 2: D3 滤波器和组 =====
  function step2_Filters() {
    try {
      const defs = svg.append('defs')
      defs.append('filter').attr('id', 'shadow')
        .append('feDropShadow').attr('dx', 0).attr('dy', 2)
        .attr('stdDeviation', 4).attr('flood-color', 'rgba(0,0,0,0.15)')
      defs.append('filter').attr('id', 'glow')
        .append('feDropShadow').attr('dx', 0).attr('dy', 0)
        .attr('stdDeviation', 8).attr('flood-color', '#D4A84B').attr('flood-opacity', 0.6)
      defs.append('filter').attr('id', 'glow-selected')
        .append('feDropShadow').attr('dx', 0).attr('dy', 0)
        .attr('stdDeviation', 10).attr('flood-color', '#1A8A7A').attr('flood-opacity', 0.8)
      g = svg.append('g').attr('class', 'map-group')
      dbg('滤镜&组', true, 'defs 和 map-group 创建成功')
      return true
    } catch (e) { dbg('滤镜&组', false, e.message); return false }
  }

  // ===== 图层 3: D3 投影和路径 =====
  function step3_Projection() {
    try {
      projection = d3.geoMercator()
        .center([104, 35]).scale(700)
        .translate([VB.w / 2, VB.h / 2 + 50])
      path = d3.geoPath().projection(projection)

      // 测试投影
      const beijing = projection([116.4, 39.9])
      const shanghai = projection([121.5, 31.2])
      dbg('投影', true, `北京→(${beijing[0].toFixed(0)},${beijing[1].toFixed(0)}) 上海→(${shanghai[0].toFixed(0)},${shanghai[1].toFixed(0)})`)

      // 绘制一个测试多边形验证 geoPath
      const testPoly = { type: 'Polygon', coordinates: [[[100, 30], [110, 30], [110, 40], [100, 40], [100, 30]]] }
      const d = path(testPoly)
      g.append('path').attr('d', d).attr('fill', '#D4A84B').attr('opacity', 0.3).attr('stroke', '#D4A84B')
      dbg('路径', true, 'geoPath 测试多边形渲染成功')
      return true
    } catch (e) { dbg('投影', false, e.message); return false }
  }

  // ===== 图层 4: 数据源加载 =====
  async function step4_Fetch() {
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
        if (!resp.ok) { dbg('数据源', false, `${s.name} HTTP ${resp.status}`); continue }
        const json = await resp.json()
        const size = JSON.stringify(json).length
        const keys = Object.keys(json).join(', ')
        dbg('数据源', true, `${s.name} 成功，大小:${(size/1024).toFixed(0)}KB，顶层键:${keys}`)
        return json
      } catch (e) {
        dbg('数据源', false, `${s.name}: ${e.message}`)
      }
    }
    dbg('数据源', true, '所有远程源不可用，使用降级节点地图')
    return null
  }

  // ===== 图层 5: TopoJSON/GeoJSON 解析 =====
  function step5_Parse(data) {
    try {
      let geojson
      if (data.objects) {
        const key = Object.keys(data.objects)[0]
        if (!key) throw new Error('TopoJSON 无有效对象键')
        geojson = feature(data, data.objects[key])
        dbg('数据解析', true, `TopoJSON → GeoJSON, 对象键:${key}`)
      } else if (data.type === 'FeatureCollection') {
        geojson = data
        dbg('数据解析', true, 'GeoJSON FeatureCollection 格式')
      } else if (Array.isArray(data.features)) {
        geojson = { type: 'FeatureCollection', features: data.features }
        dbg('数据解析', true, '原始 features 数组格式')
      } else {
        throw new Error('无法识别的数据格式: ' + Object.keys(data).join(','))
      }

      if (!geojson.features || geojson.features.length === 0) throw new Error('无有效特征')
      dbg('数据解析增量', true, `共 ${geojson.features.length} 个省级特征`)

      // 过滤有效特征
      const valid = geojson.features.filter(f => f.properties && (f.properties.adcode || f.properties.code || f.properties.name))
      dbg('特征过滤', true, `有效特征 ${valid.length}/${geojson.features.length}`)

      return valid
    } catch (e) { dbg('数据解析', false, e.message); return null }
  }

  // ===== 图层 6: 地图渲染（路径 / 节点）=====
  function step6_Render(validFeatures) {
    try {
      if (validFeatures && validFeatures.length > 0) {
        isFallback = false
        allPaths = g.selectAll('path.province-path')
          .data(validFeatures)
          .join('path')
          .attr('class', 'province-path')
          .attr('d', d => { try { return path(d) } catch { return '' } })
          .attr('fill', d => {
            const code = d.properties.adcode || d.properties.code || ''
            const pd = provinceData[code]
            return pd && pd.color ? pd.color : '#B8C5B0'
          })
          .attr('stroke', '#F8F6F0').attr('stroke-width', 0.8)
          .attr('stroke-linejoin', 'round').attr('opacity', 0.85)
          .style('cursor', 'pointer').style('transition', 'all 0.3s ease')
          .style('filter', 'url(#shadow)')
          .on('mouseenter', onEnter).on('mousemove', onMove)
          .on('mouseleave', onLeave).on('click', onClick)

        const renderedCount = allPaths.size()
        dbg('路径渲染', true, `已渲染 ${renderedCount} 个省份路径`)
        addLabels(validFeatures)
      } else {
        isFallback = true
        renderFallbackNodes()
        dbg('路径渲染', true, 'GeoJSON 不可用，已渲染节点降级地图')
      }

      addSouthChinaSea()

      if (store.selectedProvinceCode) updateSelection(store.selectedProvinceCode)
      dbg('整体地图', true, '地图渲染完成 ✅')
      return true
    } catch (e) { dbg('路径渲染', false, e.message); return false }
  }

  // ===== 降级节点渲染 =====
  function renderFallbackNodes() {
    const entries = Object.entries(provinceCenters)

    // 添加连接线
    const neighbors = [
      ['110000','120000'],['110000','130000'],['310000','320000'],['310000','330000'],
      ['440000','450000'],['440000','460000'],['510000','500000'],['510000','520000'],
      ['530000','520000'],['510000','610000'],['610000','410000'],['610000','620000'],
      ['510000','540000'],['330000','350000'],['370000','410000'],['420000','430000'],
      ['420000','410000'],['430000','440000'],['430000','450000'],['650000','620000'],
      ['650000','630000'],['150000','210000'],['210000','220000'],['220000','230000']
    ]
    neighbors.forEach(([a, b]) => {
      const pa = provinceCenters[a], pb = provinceCenters[b]
      if (!pa || !pb) return
      const [x1, y1] = projection([pa.lng, pa.lat])
      const [x2, y2] = projection([pb.lng, pb.lat])
      g.append('line').attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2)
        .attr('stroke', '#D4C8B8').attr('stroke-width', 0.5).attr('opacity', 0.3)
    })

    allPaths = g.selectAll('circle')
      .data(entries)
      .join('circle')
      .attr('cx', ([c, p]) => projection([p.lng, p.lat])[0])
      .attr('cy', ([c, p]) => projection([p.lng, p.lat])[1])
      .attr('r', 10).attr('fill', '#1A8A7A').attr('stroke', '#F8F6F0')
      .attr('stroke-width', 1.5).attr('opacity', 0.85)
      .style('cursor', 'pointer').style('filter', 'url(#shadow)')
      .on('mouseenter', onNodeEnter).on('mousemove', onMove)
      .on('mouseleave', onNodeLeave).on('click', onClickNode)

    entries.forEach(([code, p]) => {
      const [x, y] = projection([p.lng, p.lat])
      g.append('text').attr('class', 'province-label')
        .attr('x', x).attr('y', y - 16)
        .attr('text-anchor', 'middle').attr('fill', '#5C5C6E')
        .attr('font-size', '11').attr('font-family', '"Noto Sans SC", sans-serif')
        .style('pointer-events', 'none').text(p.name)
    })
  }

  // ===== 交互处理器 =====
  function onEnter(event, d) {
    const code = d.properties.adcode || d.properties.code || ''
    d3.select(this).transition().duration(300)
      .attr('opacity', 1).attr('stroke-width', 1.5).attr('stroke', '#D4A84B')
      .style('filter', 'url(#glow)')
    const c = path.centroid(d)
    if (c && !c.some(isNaN)) {
      g.append('text').attr('class', 'province-label-hover')
        .attr('x', c[0]).attr('y', c[1]).attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central').attr('fill', '#1A1A2E')
        .attr('font-size', '14').attr('font-weight', '600')
        .attr('font-family', '"Noto Sans SC", sans-serif')
        .style('pointer-events', 'none')
        .style('text-shadow', '0 0 8px rgba(255,255,255,0.9)')
        .text(d.properties.name || '')
    }
    showTooltip(code, d.properties.name)
    store.setHoveredProvince(code)
  }

  function onNodeEnter(event, [code]) {
    d3.select(this).transition().duration(300)
      .attr('opacity', 1).attr('stroke', '#D4A84B').attr('stroke-width', 2.5)
      .style('filter', 'url(#glow)')
    showTooltip(code, provinceCenters[code]?.name)
    store.setHoveredProvince(code)
  }

  function onMove(event) {
    tooltipDiv.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 10) + 'px')
  }

  function onLeave(event, d) {
    const code = d.properties?.adcode || d.properties?.code || ''
    resetPath(this, code)
    cleanupHover()
    store.clearHoveredProvince()
  }

  function onNodeLeave(event, [code]) {
    d3.select(this).transition().duration(300)
      .attr('opacity', 0.85).attr('stroke', '#F8F6F0').attr('stroke-width', 1.5)
      .style('filter', store.selectedProvinceCode === code ? 'url(#glow-selected)' : 'url(#shadow)')
    cleanupHover()
    store.clearHoveredProvince()
  }

  function onClick(event, d) {
    const code = d.properties?.adcode || d.properties?.code || ''
    if (code) store.selectProvince(code)
  }

  function onClickNode(event, [code]) {
    if (code) store.selectProvince(code)
  }

  function resetPath(el, code) {
    const sel = d3.select(el)
    if (isFallback) {
      sel.transition().duration(300)
        .attr('opacity', 0.85).attr('stroke', '#F8F6F0').attr('stroke-width', 1.5)
        .style('filter', store.selectedProvinceCode === code ? 'url(#glow-selected)' : 'url(#shadow)')
    } else {
      sel.transition().duration(300)
        .attr('opacity', 0.85).attr('stroke-width', 0.8).attr('stroke', '#F8F6F0')
        .style('filter', store.selectedProvinceCode === code ? 'url(#glow-selected)' : 'url(#shadow)')
    }
  }

  function cleanupHover() {
    g.selectAll('.province-label-hover').remove()
    tooltipDiv.style('display', 'none')
  }

  function showTooltip(code, name) {
    const pd = provinceData[code]
    tooltipDiv.style('display', 'block')
      .html(pd ? `<strong>${pd.name}</strong><br/>${pd.hotspotCount||0}个景点·评分${pd.avgRating||'-'}`
        : `<strong>${name || code}</strong>`)
  }

  function addLabels(features) {
    const names = ['北京','上海','浙江','福建','广东','海南','四川','云南','陕西','新疆',
      '西藏','内蒙古','黑龙江','山东','江苏','湖南']
    features.forEach(f => {
      const n = f.properties?.name
      if (!n || !names.includes(n)) return
      const c = path.centroid(f)
      if (!c || c.some(isNaN)) return
      g.append('text').attr('class', 'province-label')
        .attr('x', c[0]).attr('y', c[1]).attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central').attr('fill', '#5C5C6E')
        .attr('font-size', '11').attr('font-weight', '500')
        .attr('font-family', '"Noto Sans SC", sans-serif')
        .style('pointer-events', 'none').style('opacity', '0.7')
        .style('text-shadow', '0 0 4px rgba(248,246,240,0.8)').text(n)
    })
  }

  function addSouthChinaSea() {
    g.append('rect').attr('x', 850).attr('y', 700).attr('width', 80).attr('height', 90)
      .attr('fill', 'none').attr('stroke', '#B8C5B0').attr('stroke-width', 0.5).attr('rx', 4)
    g.append('text').attr('x', 890).attr('y', 750).attr('text-anchor', 'middle')
      .attr('fill', '#B8C5B0').attr('font-size', '10')
      .attr('font-family', '"Noto Sans SC", sans-serif').text('南海诸岛')
  }

  function updateSelection(code) {
    if (!allPaths) return
    allPaths.each(function (d) {
      const adcode = isFallback ? d[0] : (d.properties?.adcode || d.properties?.code || '')
      const p = d3.select(this)
      if (String(adcode) === String(code)) {
        p.transition().duration(500).attr('opacity', 1).attr('stroke-width', isFallback ? 2.5 : 2)
          .attr('stroke', '#1A8A7A').style('filter', 'url(#glow-selected)')
      } else {
        p.transition().duration(500)
          .attr('opacity', store.selectedProvinceCode ? 0.5 : 0.85)
          .attr('stroke-width', isFallback ? 1.5 : 0.8)
          .attr('stroke', '#F8F6F0').style('filter', 'url(#shadow)')
      }
    })
  }

  // ===== 主流程：逐层执行 =====
  async function runLayers() {
    if (!step1_SVG()) { loading.value = false; return }
    if (!step2_Filters()) { loading.value = false; return }
    if (!step3_Projection()) { loading.value = false; return }

    // 工具提示
    try {
    tooltipDiv = d3.select('body').append('div')
      .attr('class', 'map-tooltip')
      .style('position', 'absolute').style('display', 'none')
      .style('background', 'rgba(26,26,46,0.9)').style('color', '#fff')
      .style('padding', '8px 14px').style('border-radius', '8px')
      .style('font-size', '14px').style('pointer-events', 'none')
      .style('backdrop-filter', 'blur(8px)').style('z-index', '1000')
      .style('border', '1px solid rgba(212,168,75,0.3)')
    .style('font-family', '"Noto Sans SC", sans-serif')
    } catch(e) { /* tooltip not critical */ }

    // 全局超时：最多等 12 秒，之后强制加载（降级地图）
    const timeoutPromise = new Promise(resolve => setTimeout(() => {
      dbg('超时', true, '数据请求超时，使用降级节点地图')
      resolve(null)
    }, 12000))

    const data = await Promise.race([step4_Fetch(), timeoutPromise])
    const features = data ? step5_Parse(data) : null
    step6_Render(features)

    loading.value = false
    mapReady.value = true
    dbg('完成', true, '所有图层加载完毕')
  }

  watch(() => store.selectedProvinceCode, (code) => {
    if (allPaths && allPaths.size()) {
      code ? updateSelection(code) : allPaths.transition().duration(500)
        .attr('opacity', 0.85).attr('stroke-width', isFallback ? 1.5 : 0.8)
        .attr('stroke', '#F8F6F0').style('filter', 'url(#shadow)')
    }
  })

  onMounted(() => runLayers())
  onUnmounted(() => { if (tooltipDiv) tooltipDiv.remove() })

  return { loading, mapReady }
}
