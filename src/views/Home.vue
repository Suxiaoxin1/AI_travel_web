<template>
  <div class="home-page">
    <div class="hero-intro">
      <h1 class="hero-title">星际行者</h1>
      <p class="hero-desc">让AI成为你的星际导航员，开启穿行34个星际省域的奇幻旅程。</p>
    </div>
    <!-- 地图区域：单独展示，点击省份后弹出 Modal 显示景点 -->
    <div class="map-layout">
      <div class="map-area">
        <AMapChina @province-click="onProvinceClick" />
      </div>
    </div>
    <!-- 省份景点弹窗：Teleport 到 body，居中弹出，不影响地图布局 -->
    <ProvincePanel
      v-if="selectedProvince"
      :province="selectedProvince"
      :data="selectedProvinceData"
      @close="selectedProvince = null"
    />
    <div class="section-width">
      <FeatureEntriesSection />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AMapChina from '../components/AMapChina.vue'
import ProvincePanel from '../components/ProvincePanel.vue'
import FeatureEntriesSection from '../components/FeatureEntries.vue'
import { provinceData } from '../data/provinces.js'

const selectedProvince = ref(null)

const selectedProvinceData = computed(() => {
  if (!selectedProvince.value) return null
  return provinceData[selectedProvince.value] || null
})

function onProvinceClick(code) {
  selectedProvince.value = code
}
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 48px;
}

.hero-intro {
  text-align: center;
  padding: 48px 0 32px;
}

.hero-title {
  font-size: 36px;
  font-weight: 700;
  color: #1A1A2E;
  margin: 0 0 12px;
  font-family: 'Noto Sans SC', sans-serif;
  letter-spacing: 2px;
}

.hero-desc {
  font-size: 15px;
  color: #5C5C6E;
  margin: 0;
  font-family: 'Noto Sans SC', sans-serif;
  line-height: 1.8;
}

.map-layout {
  width: 70%;
  max-width: 1400px;
  height: 70vh;
  min-height: 540px;
  margin: 0 auto;
  border: 1px solid #E5E0D6;
  border-radius: 20px;
  background: #FFFFFF;
  box-shadow:
    0 1px 3px rgba(0,0,0,0.06),
    0 8px 24px rgba(0,0,0,0.08),
    inset 0 1px 0 rgba(255,255,255,0.8);
  overflow: hidden;
  position: relative;
}

.map-area {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.section-width {
  max-width: 1400px;
  width: 70%;
  margin: 32px auto 0;
}
</style>
