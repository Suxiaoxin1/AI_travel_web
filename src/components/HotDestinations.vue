<template>
  <section class="hot-destinations">
    <div class="section-header">
      <h2 class="section-title">热门目的地</h2>
      <span class="section-subtitle">探索旅行者最向往的星际坐标</span>
    </div>
    <div class="carousel-wrapper" ref="carouselRef">
      <div class="carousel-track" :style="{ transform: `translateX(-${currentIndex * cardWidth}px)` }">
        <div v-for="dest in destinations" :key="dest.id" class="dest-card">
          <div class="dest-image" :style="{ background: getDestBg(dest) }">
            <div class="dest-season">{{ dest.season }}</div>
            <div class="dest-rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#D4A84B">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
              {{ dest.rating }}
            </div>
          </div>
          <div class="dest-info">
            <h3 class="dest-name">{{ dest.name }}</h3>
            <span class="dest-province">{{ dest.province }}</span>
            <p class="dest-desc">{{ dest.shortDesc }}</p>
          </div>
        </div>
      </div>
      <button class="carousel-btn carousel-btn-left" @click="prevSlide" :disabled="currentIndex === 0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button class="carousel-btn carousel-btn-right" @click="nextSlide" :disabled="currentIndex >= maxIndex">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>
    <div class="carousel-dots">
      <span v-for="(_, i) in dotsCount" :key="i" class="dot" :class="{ active: i === Math.floor(currentIndex / (showCount > 0 ? showCount : 4)) }" @click="goToSlide(i)"></span>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { hotDestinations } from '../data/provinces.js'

const destinations = hotDestinations
const currentIndex = ref(0)
const cardWidth = 260
const showCount = ref(4)
const carouselRef = ref(null)

const maxIndex = computed(() => Math.max(0, destinations.length * cardWidth - showCount.value * cardWidth))
const dotsCount = computed(() => Math.ceil(destinations.length / showCount.value))

let autoTimer = null

function getDestBg(dest) {
  const bgMap = {
    '九寨沟': 'linear-gradient(135deg, #0D6B5C 0%, #2EA89A 50%, #D4A84B 100%)',
    '西湖': 'linear-gradient(135deg, #1A8A7A 0%, #2EA89A 50%, #E8C87A 100%)',
    '喀纳斯': 'linear-gradient(135deg, #0D6B5C 0%, #1A8A7A 50%, #D4A84B 100%)',
    '鼓浪屿': 'linear-gradient(135deg, #2EA89A 0%, #1A8A7A 50%, #D4A84B 100%)',
    '兵马俑': 'linear-gradient(135deg, #C23B22 0%, #D4A84B 50%, #E8C87A 100%)',
    '大理古城': 'linear-gradient(135deg, #D4A84B 0%, #E8C87A 50%, #F8F6F0 100%)',
    '外滩': 'linear-gradient(135deg, #0D6B5C 0%, #1A8A7A 50%, #D4A84B 100%)',
    '亚龙湾': 'linear-gradient(135deg, #2EA89A 0%, #1A8A7A 50%, #D4A84B 100%)',
  }
  return bgMap[dest.name] || 'linear-gradient(135deg, #1A8A7A, #0D6B5C)'
}

function nextSlide() {
  if (currentIndex.value < maxIndex.value) {
    currentIndex.value += cardWidth
  }
}

function prevSlide() {
  if (currentIndex.value > 0) {
    currentIndex.value -= cardWidth
  }
}

function goToSlide(index) {
  currentIndex.value = index * showCount.value * cardWidth
}

function updateShowCount() {
  if (carouselRef.value) {
    const w = carouselRef.value.offsetWidth
    showCount.value = Math.max(1, Math.floor(w / cardWidth))
  }
}

onMounted(() => {
  updateShowCount()
  window.addEventListener('resize', updateShowCount)
  autoTimer = setInterval(() => {
    if (currentIndex.value < maxIndex.value) {
      currentIndex.value += cardWidth
    } else {
      currentIndex.value = 0
    }
  }, 4000)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateShowCount)
  if (autoTimer) clearInterval(autoTimer)
})
</script>

<style scoped>
.hot-destinations {
  padding: 48px 0;
  background: #F8F6F0;
}

.section-header {
  padding: 0 32px;
  margin-bottom: 28px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #1A1A2E;
  margin: 0;
  font-family: 'Noto Sans SC', sans-serif;
}

.section-subtitle {
  font-size: 14px;
  color: #8B8B9E;
  margin-top: 4px;
  display: block;
  font-family: 'Noto Sans SC', sans-serif;
}

.carousel-wrapper {
  padding: 0 32px;
  position: relative;
  overflow: hidden;
}

.carousel-track {
  display: flex;
  gap: 20px;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.dest-card {
  min-width: 240px;
  max-width: 240px;
  background: #FFFFFF;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #EFECE4;
  transition: all 0.35s ease;
  cursor: pointer;
}

.dest-card:hover {
  transform: translateY(-6px) perspective(800px) rotateY(-3deg);
  box-shadow: 0 16px 40px rgba(13, 107, 92, 0.15);
  border-color: #D4A84B;
}

.dest-image {
  height: 140px;
  display: flex;
  justify-content: space-between;
  padding: 12px;
  position: relative;
}

.dest-season {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  background: rgba(0,0,0,0.25);
  backdrop-filter: blur(4px);
  border-radius: 6px;
  align-self: flex-start;
  font-family: 'Noto Sans SC', sans-serif;
}

.dest-rating {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0,0,0,0.3);
  align-self: flex-start;
  font-family: 'Noto Sans SC', sans-serif;
}

.dest-info {
  padding: 16px;
}

.dest-name {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 2px 0;
  font-family: 'Noto Sans SC', sans-serif;
}

.dest-province {
  font-size: 12px;
  color: #1A8A7A;
  font-weight: 500;
  font-family: 'Noto Sans SC', sans-serif;
}

.dest-desc {
  font-size: 13px;
  color: #6B6B7D;
  margin: 8px 0 0;
  line-height: 1.5;
  font-family: 'Noto Sans SC', sans-serif;
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 1px solid #E5E0D6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;
  color: #6B6B7D;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.carousel-btn:hover:not(:disabled) {
  background: #0D6B5C;
  color: #fff;
  border-color: #0D6B5C;
}

.carousel-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.carousel-btn-left { left: 8px; }
.carousel-btn-right { right: 8px; }

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #D4C8B8;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot.active {
  width: 24px;
  border-radius: 4px;
  background: #1A8A7A;
}
</style>
