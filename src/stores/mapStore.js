import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { provinceData } from '../data/provinces.js'

export const useMapStore = defineStore('map', () => {
  // 当前选中的省份 adcode，null 表示未选中
  const selectedProvinceCode = ref(null)
  // 当前悬停的省份 adcode
  const hoveredProvinceCode = ref(null)
  // 地图 TopoJSON 数据加载状态
  const mapDataLoaded = ref(false)
  // 地图数据加载错误
  const mapDataError = ref(null)

  // 当前选中的省份完整数据
  const selectedProvince = computed(() => {
    if (!selectedProvinceCode.value) return null
    return provinceData[selectedProvinceCode.value] || null
  })

  // 当前悬停的省份完整数据
  const hoveredProvince = computed(() => {
    if (!hoveredProvinceCode.value) return null
    return provinceData[hoveredProvinceCode.value] || null
  })

  // 是否正在显示详情面板（选中了省份且有数据）
  const showDetailPanel = computed(() => !!selectedProvinceCode.value)

  // 选中省份
  function selectProvince(code) {
    // 如果点击的是同一个省份，取消选中（返回全屏地图）
    if (selectedProvinceCode.value === code) {
      selectedProvinceCode.value = null
    } else {
      selectedProvinceCode.value = code
    }
  }

  // 取消选中（返回全屏地图）
  function clearSelection() {
    selectedProvinceCode.value = null
  }

  // 设置悬停省份
  function setHoveredProvince(code) {
    hoveredProvinceCode.value = code
  }

  // 清除悬停
  function clearHoveredProvince() {
    hoveredProvinceCode.value = null
  }

  // 设置地图加载状态
  function setMapLoaded(loaded) {
    mapDataLoaded.value = loaded
  }

  // 设置地图加载错误
  function setMapError(error) {
    mapDataError.value = error
  }

  return {
    selectedProvinceCode,
    hoveredProvinceCode,
    mapDataLoaded,
    mapDataError,
    selectedProvince,
    hoveredProvince,
    showDetailPanel,
    selectProvince,
    clearSelection,
    setHoveredProvince,
    clearHoveredProvince,
    setMapLoaded,
    setMapError
  }
})
