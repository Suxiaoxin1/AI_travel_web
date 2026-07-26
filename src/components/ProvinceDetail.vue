<template>
  <transition name="panel-slide">
    <div v-if="province" class="detail-panel">
      <!-- 返回按钮 -->
      <button class="back-btn" @click="store.clearSelection()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        返回星图
      </button>

      <!-- 省份标题 -->
      <div class="province-header">
        <div class="province-name-group">
          <h2 class="province-name">{{ province.name }}</h2>
          <span class="province-name-en">{{ province.nameEn }}</span>
        </div>
        <div class="province-badge" :style="{ background: province.color + '20', color: province.color, borderColor: province.color + '40' }">
          {{ province.hotspotCount }} 个探索目的地
        </div>
      </div>

      <!-- 省份描述 -->
      <p class="province-desc">{{ province.description }}</p>

      <!-- 数据概览 -->
      <div class="province-stats">
        <div class="stat-item">
          <span class="stat-value">{{ province.hotspotCount }}</span>
          <span class="stat-label">热门景点</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ province.avgRating || '-' }}</span>
          <span class="stat-label">平均评分</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">✦</span>
          <span class="stat-label">{{ province.bestSeason || '全年皆宜' }}</span>
        </div>
      </div>

      <!-- 景点列表 -->
      <div class="hotspots-section">
        <h3 class="section-title">必去景点</h3>
        <div class="hotspot-list">
          <div v-for="(spot, index) in province.hotspots" :key="index" class="hotspot-card">
            <div class="hotspot-image" :class="{ 'has-image': spot.imageUrl }">
              <img v-if="spot.imageUrl" :src="spot.imageUrl" :alt="spot.name" class="hotspot-img" @error="onImgError" />
              <template v-else>
                <span class="hotspot-type-tag">{{ typeLabels[spot.type] || spot.type }}</span>
                <div class="hotspot-rating">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#D4A84B">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                  {{ spot.rating }}
                </div>
              </template>
              <span class="hotspot-type-tag" v-if="!spot.imageUrl">{{ typeLabels[spot.type] || spot.type }}</span>
              <div class="hotspot-rating" v-if="spot.imageUrl">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#D4A84B">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
                {{ spot.rating }}
              </div>
            </div>
            <div class="hotspot-info">
              <h4 class="hotspot-name">{{ spot.name }}</h4>
              <p class="hotspot-desc">{{ spot.shortDesc }}</p>
              <div class="hotspot-meta">
                <span class="hotspot-duration">⏱ {{ spot.duration }}</span>
                <span class="hotspot-price">💰 {{ spot.price }}</span>
              </div>
              <div class="hotspot-tags">
                <span v-for="tag in spot.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI 规划按钮 -->
      <button class="ai-plan-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
        AI 规划{{ province.name }}行程
      </button>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import { useMapStore } from '../stores/mapStore.js'

const store = useMapStore()
const province = computed(() => store.selectedProvince)

const typeLabels = {
  cultural: '人文',
  natural: '自然',
  urban: '都市',
  adventure: '游乐'
}

function getGradient(type) {
  const gradients = {
    cultural: 'linear-gradient(135deg, #1A8A7A 0%, #2EA89A 100%)',
    natural: 'linear-gradient(135deg, #0D6B5C 0%, #1A8A7A 100%)',
    urban: 'linear-gradient(135deg, #D4A84B 0%, #E8C87A 100%)',
    adventure: 'linear-gradient(135deg, #C23B22 0%, #E05A4A 100%)'
  }
  return gradients[type] || gradients.cultural
}

function onImgError(e) {
  // 图片加载失败时隐藏 img，回退到 gradient 背景
  const img = e.target
  img.style.display = 'none'
  img.parentElement.classList.add('fallback-gradient')
}
</script>

<style scoped>
.detail-panel {
  width: 42%;
  height: calc(100vh - 64px - 80px);
  padding: 32px 36px;
  overflow-y: auto;
  background: #FFFFFF;
  border-left: 1px solid #E5E0D6;
}

.detail-panel::-webkit-scrollbar {
  width: 4px;
}

.detail-panel::-webkit-scrollbar-track {
  background: transparent;
}

.detail-panel::-webkit-scrollbar-thumb {
  background: #D4A84B;
  border-radius: 2px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: #6B6B7D;
  background: #F8F6F0;
  border: 1px solid #E5E0D6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: 'Noto Sans SC', sans-serif;
  margin-bottom: 20px;
}

.back-btn:hover {
  color: #0D6B5C;
  border-color: #0D6B5C;
  background: rgba(13, 107, 92, 0.06);
}

.province-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.province-name-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.province-name {
  font-size: 28px;
  font-weight: 700;
  color: #1A1A2E;
  margin: 0;
  font-family: 'Noto Sans SC', sans-serif;
}

.province-name-en {
  font-size: 13px;
  color: #B8C5B0;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.5px;
}

.province-badge {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 20px;
  border: 1px solid;
  white-space: nowrap;
  font-family: 'Noto Sans SC', sans-serif;
}

.province-desc {
  font-size: 14px;
  line-height: 1.7;
  color: #5C5C6E;
  margin: 0 0 20px 0;
  font-family: 'Noto Sans SC', sans-serif;
}

.province-stats {
  display: flex;
  gap: 0;
  margin-bottom: 28px;
  background: #F8F6F0;
  border-radius: 12px;
  overflow: hidden;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 8px;
  gap: 4px;
}

.stat-item + .stat-item {
  border-left: 1px solid #E5E0D6;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #0D6B5C;
  font-family: 'Noto Sans SC', sans-serif;
}

.stat-label {
  font-size: 12px;
  color: #6B6B7D;
  font-family: 'Noto Sans SC', sans-serif;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 16px 0;
  font-family: 'Noto Sans SC', sans-serif;
}

.hotspot-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hotspot-card {
  display: flex;
  gap: 16px;
  padding: 14px;
  background: #FAF9F6;
  border-radius: 12px;
  border: 1px solid #EFECE4;
  transition: all 0.25s ease;
}

.hotspot-card:hover {
  border-color: #D4A84B;
  box-shadow: 0 4px 16px rgba(212, 168, 75, 0.15);
  transform: translateY(-2px);
}

.hotspot-image {
  width: 100px;
  min-height: 100px;
  border-radius: 8px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1A8A7A 0%, #2EA89A 100%);
}

.hotspot-image.has-image {
  padding: 0;
}

.hotspot-image.fallback-gradient {
  background: linear-gradient(135deg, #1A8A7A 0%, #2EA89A 100%);
}

.hotspot-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 8px;
}

.hotspot-type-tag {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  background: rgba(0,0,0,0.3);
  border-radius: 4px;
  backdrop-filter: blur(4px);
  font-family: 'Noto Sans SC', sans-serif;
}

.hotspot-rating {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0,0,0,0.3);
  font-family: 'Noto Sans SC', sans-serif;
}

.hotspot-info {
  flex: 1;
  min-width: 0;
}

.hotspot-name {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 4px 0;
  font-family: 'Noto Sans SC', sans-serif;
}

.hotspot-desc {
  font-size: 13px;
  color: #6B6B7D;
  line-height: 1.5;
  margin: 0 0 8px 0;
  font-family: 'Noto Sans SC', sans-serif;
}

.hotspot-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #8B8B9E;
  font-family: 'Noto Sans SC', sans-serif;
}

.hotspot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 2px 10px;
  font-size: 11px;
  color: #1A8A7A;
  background: rgba(26, 138, 122, 0.08);
  border-radius: 12px;
  font-weight: 500;
  font-family: 'Noto Sans SC', sans-serif;
}

.ai-plan-btn {
  width: 100%;
  margin-top: 24px;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #0D6B5C, #1A8A7A);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Noto Sans SC', sans-serif;
}

.ai-plan-btn:hover {
  box-shadow: 0 6px 20px rgba(13, 107, 92, 0.35);
  transform: translateY(-1px);
}

/* 面板滑入动画 */
.panel-slide-enter-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
