<template>
  <div ref="mapContainer" class="simple-map-container">
    <img
      src="@/assets/china-map.png"
      alt="中国地图"
      class="china-map-img"
      @load="onImageLoad"
      @error="onImageError"
    />
    <div v-if="!imageLoaded" class="map-loading">地图加载中...</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const mapContainer = ref(null)
const emit = defineEmits(['province-click'])
const imageLoaded = ref(false)

function onImageLoad() {
  imageLoaded.value = true
}

function onImageError() {
  imageLoaded.value = false
}
</script>

<style scoped>
.simple-map-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.china-map-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}

.map-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  color: #8B8B9E;
}
</style>
