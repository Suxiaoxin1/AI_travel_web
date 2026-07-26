<template>
  <!-- 省份景点弹窗 Modal：点击地图省份标记后弹出，居中展示该省推荐景点 -->
  <teleport to="body">
    <transition name="modal-fade">
      <div v-if="province && data" class="modal-mask" @click.self="$emit('close')">
        <div class="modal-container" role="dialog" aria-modal="true">
          <!-- 弹窗头部：省份名 + 评分 + 飞猪按钮 + 关闭按钮 -->
          <div class="modal-header">
            <div class="modal-title-area">
              <h2 class="modal-title">{{ data.name }}</h2>
              <span class="modal-rating" v-if="data.avgRating">★ {{ data.avgRating }}</span>
              <span class="modal-count">{{ data.hotspots?.length || 0 }} 个景点</span>
            </div>
            <div class="modal-header-actions">
              <!-- 携程按钮：点击跳转到携程搜索对应省份的旅行团 -->
              <button class="ctrip-btn" @click="goToCtrip(data.name)" title="在携程平台查看旅行团">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 12l9-9 9 9"/>
                  <path d="M5 10v10h14V10"/>
                  <path d="M9 20v-6h6v6"/>
                </svg>
                <span>携程</span>
              </button>
              <!-- 飞猪按钮：点击跳转到飞猪搜索对应省份的旅行团 -->
              <button class="fliggy-btn" @click="goToFliggy(data.name)" title="在飞猪平台查看旅行团">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 16l9-13 9 13"/>
                  <path d="M5 16v5h14v-5"/>
                  <circle cx="12" cy="20" r="1.5" fill="currentColor"/>
                </svg>
                <span>飞猪</span>
              </button>
              <button class="modal-close" @click="$emit('close')" aria-label="关闭">✕</button>
            </div>
          </div>
          <!-- 弹窗描述：省份简介 -->
          <p class="modal-desc" v-if="data.description">{{ data.description }}</p>
          <!-- 弹窗主体：推荐景点列表，支持纵向滚动 -->
          <div class="modal-body">
            <div class="section-label">推荐景点</div>
            <div class="hotspot-list">
              <div v-for="spot in (data.hotspots || [])" :key="spot.name" class="spot-card">
                <!-- 景点图片：用响应式 Map 追踪加载状态，加载完成后淡入显示 -->
                <div class="spot-image">
                  <!-- 加载中 spinner（imgLoaded 还未标记为 true 时显示） -->
                  <div v-if="spot.imageUrl && !imgLoadedMap[spot.name]" class="img-loading">
                    <svg class="loading-spinner" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="16" class="spinner-ring" />
                    </svg>
                  </div>
                  <!-- 真实图片：有 imageUrl 才渲染，加载完成触发 onLoad 标记状态 -->
                  <img
                    v-if="spot.imageUrl"
                    :src="spot.imageUrl"
                    :alt="spot.name"
                    class="spot-img"
                    :class="{ 'img-loaded': imgLoadedMap[spot.name] }"
                    @load="onSpotImgLoad(spot.name)"
                    @error="onSpotImgError(spot.name)"
                  />
                  <!-- 占位图标：没有 imageUrl 或加载失败时显示 -->
                  <div v-if="imgErrorMap[spot.name] || !spot.imageUrl" class="img-placeholder">🏞</div>
                </div>
                <!-- 景点信息：名称、评分、简介、标签 -->
                <div class="spot-content">
                  <div class="spot-top">
                    <span class="spot-name">{{ spot.name }}</span>
                    <span class="spot-meta">★ {{ spot.rating }} · {{ spot.price }}</span>
                  </div>
                  <p class="spot-desc">{{ spot.shortDesc }}</p>
                  <div class="spot-tags">
                    <span v-for="t in (spot.tags || [])" :key="t" class="spot-tag">{{ t }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="!data.hotspots?.length" class="panel-empty">暂无景点数据</div>
          </div>
        </div>
      </div>
    </transition>
    <!-- 飞猪预订 toast 提示 -->
    <transition name="toast-fade">
      <div v-if="toast.visible" class="panel-toast" :class="toast.type">{{ toast.message }}</div>
    </transition>
  </teleport>
</template>

<script setup>
import { reactive, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore.js'
import { useBookingStore } from '../stores/bookingStore.js'

// 省份弹窗组件 props：province 为省份 adcode（用于控制显隐），data 为该省份完整数据
const props = defineProps({ province: String, data: Object })
defineEmits(['close'])
const router = useRouter()
const authStore = useAuthStore()
const bookingStore = useBookingStore()

// 内部 toast：登录提示 / 预订成功提示
const toast = ref({ visible: false, message: '', type: 'info' })
let toastTimer = null
// 显示一条 toast 通知，3 秒后自动隐藏
function showToast(message, type = 'info') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { visible: true, message, type }
  toastTimer = setTimeout(() => { toast.value.visible = false }, 3000)
}

// 图片加载状态 Map：用 reactive 包裹，key 为景点名，value 为 true/false
// 用响应式 Map 而不是直接改 props.spot._imgLoaded，避免深层属性修改无法触发更新
const imgLoadedMap = reactive({})
const imgErrorMap = reactive({})

// 切换省份时清空状态，避免上一次的加载状态影响新省份的图片显示
watch(() => props.province, () => {
  Object.keys(imgLoadedMap).forEach(k => delete imgLoadedMap[k])
  Object.keys(imgErrorMap).forEach(k => delete imgErrorMap[k])
})

// 图片加载完成回调：在响应式 Map 中标记该景点图片已加载，触发淡入动画
function onSpotImgLoad(name) {
  imgLoadedMap[name] = true
}

// 图片加载失败回调：在错误 Map 中标记，显示占位图标
function onSpotImgError(name) {
  imgErrorMap[name] = true
}

// 携程跳转：打开携程搜索结果页，并标记待确认预定
async function goToCtrip(provinceName) {
  const keyword = `${provinceName}跟团游`
  const ctripUrl = `https://vacations.ctrip.com/list/whole/sc.html?sv=${encodeURIComponent(provinceName)}&keyword=${encodeURIComponent(keyword)}`
  if (!authStore.currentUser) {
    showToast('请先登录后再添加预订', 'warn')
    setTimeout(() => router.push('/auth'), 1200)
    return
  }
  // 记录待确认预定，用户下单返回后可上传截图确认
  localStorage.setItem('pendingBooking', JSON.stringify({
    province: provinceName,
    keyword,
    platform: '携程',
    url: ctripUrl,
    createdAt: Date.now()
  }))
  window.open(ctripUrl, '_blank', 'noopener,noreferrer')
  showToast('已跳转携程，下单完成后请返回上传订单截图', 'success')
}

// 飞猪跳转：打开飞猪对应省份搜索页，并标记待确认预定
async function goToFliggy(provinceName) {
  const keyword = `${provinceName}跟团游`
  const fliggyUrl = `https://www.fliggy.com/search.htm?q=${encodeURIComponent(keyword)}`
  if (!authStore.currentUser) {
    showToast('请先登录后再添加预订', 'warn')
    setTimeout(() => router.push('/auth'), 1200)
    return
  }
  // 记录待确认预定，用户下单返回后可上传截图确认
  localStorage.setItem('pendingBooking', JSON.stringify({
    province: provinceName,
    keyword,
    platform: '飞猪',
    url: fliggyUrl,
    createdAt: Date.now()
  }))
  window.open(fliggyUrl, '_blank', 'noopener,noreferrer')
  showToast('已跳转飞猪，下单完成后请返回上传订单截图', 'success')
}
</script>

<style scoped>
/* 遮罩层：覆盖整个视口，半透明黑色背景 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(26, 26, 46, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
  backdrop-filter: blur(2px);
}

/* 弹窗容器：固定宽度，圆角卡片，最大高度限制保证可滚动 */
.modal-container {
  width: 720px;
  max-width: 100%;
  max-height: 88vh;
  background: #FFFFFF;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 弹窗头部 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px 16px;
  border-bottom: 1px solid #F0EDE6;
  flex-shrink: 0;
}

.modal-title-area {
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #1A1A2E;
  margin: 0;
  letter-spacing: 1px;
}

.modal-rating {
  font-size: 15px;
  color: #D4A84B;
  font-weight: 600;
}

.modal-count {
  font-size: 13px;
  color: #8B8B9E;
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* 携程按钮：蓝绿色渐变，体现携程品牌色 */
.ctrip-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: linear-gradient(135deg, #2EA89A 0%, #0D6B5C 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(13, 107, 92, 0.25);
  font-family: 'Noto Sans SC', sans-serif;
  white-space: nowrap;
}

.ctrip-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(13, 107, 92, 0.4);
  filter: brightness(1.05);
}

.ctrip-btn:active {
  transform: translateY(0);
}

.ctrip-btn svg {
  flex-shrink: 0;
}

/* 飞猪按钮：橙色渐变，体现平台品牌色 */
.fliggy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: linear-gradient(135deg, #FF8A1F 0%, #FF6A00 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(255, 138, 31, 0.25);
  font-family: 'Noto Sans SC', sans-serif;
  white-space: nowrap;
}

.fliggy-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(255, 138, 31, 0.4);
  filter: brightness(1.05);
}

.fliggy-btn:active {
  transform: translateY(0);
}

.fliggy-btn svg {
  flex-shrink: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #F0EDE6;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  color: #5C5C6E;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

/* 飞猪预订 toast 提示（弹窗内底部） */
.panel-toast {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 22px;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 500;
  color: #FFFFFF;
  z-index: 10000;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  font-family: 'Noto Sans SC', sans-serif;
}

.panel-toast.success { background: #0D6B5C; }
.panel-toast.error { background: #C23B22; }
.panel-toast.warn { background: #D4A84B; color: #1A1A2E; }
.panel-toast.info { background: #5C5C6E; }

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

.modal-close:hover {
  background: #E5E0D6;
  color: #1A1A2E;
  transform: rotate(90deg);
}

/* 省份描述 */
.modal-desc {
  font-size: 14px;
  color: #5C5C6E;
  line-height: 1.7;
  padding: 14px 28px;
  margin: 0;
  border-bottom: 1px solid #F0EDE6;
  flex-shrink: 0;
}

/* 弹窗主体：可滚动区域 */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 28px 24px;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #D4C8B8;
  border-radius: 3px;
}

.section-label {
  font-size: 13px;
  color: #8B8B9E;
  padding: 18px 0 12px;
  font-weight: 600;
  position: sticky;
  top: 0;
  background: #FFFFFF;
  z-index: 1;
}

/* 景点卡片：横向布局，左图右文 */
.hotspot-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.spot-card {
  display: flex;
  gap: 16px;
  padding: 14px;
  background: #F8F6F0;
  border: 1px solid #EFECE4;
  border-radius: 14px;
  transition: all 0.2s;
}

.spot-card:hover {
  border-color: #D4A84B;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

/* 景点图片容器：100×100，相对定位，子元素绝对定位叠加 */
.spot-image {
  width: 100px;
  height: 100px;
  min-width: 100px;
  border-radius: 10px;
  overflow: hidden;
  background: #E5E0D6;
  position: relative;
}

/* 加载中 spinner 居中显示 */
.img-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0ede6 0%, #e5e0d6 100%);
  z-index: 1;
}

.loading-spinner {
  width: 28px;
  height: 28px;
}

.spinner-ring {
  fill: none;
  stroke: #0D6B5C;
  stroke-width: 3;
  stroke-dasharray: 80;
  stroke-dashoffset: 60;
  stroke-linecap: round;
  animation: spin 1.2s ease-in-out infinite;
}

@keyframes spin {
  to { stroke-dashoffset: -20; }
}

/* 占位图标：加载失败或没有 imageUrl 时显示 */
.img-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  opacity: 0.5;
  background: #E5E0D6;
  z-index: 1;
}

/* 真实图片：默认透明，加载完成后加 img-loaded 类变不透明，触发淡入动画 */
.spot-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 2;
}

.spot-img.img-loaded {
  opacity: 1;
}

/* 景点文本内容 */
.spot-content {
  flex: 1;
  min-width: 0;
}

.spot-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 12px;
}

.spot-name {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.spot-meta {
  font-size: 13px;
  color: #5C5C6E;
  white-space: nowrap;
}

.spot-desc {
  font-size: 13px;
  color: #6B6B7D;
  line-height: 1.65;
  margin: 0 0 10px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.spot-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.spot-tag {
  font-size: 11px;
  padding: 2px 9px;
  background: rgba(13, 107, 92, 0.08);
  color: #0D6B5C;
  border-radius: 8px;
}

.panel-empty {
  text-align: center;
  color: #8B8B9E;
  font-size: 14px;
  padding: 48px 20px;
}

/* 弹窗淡入动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* 小屏适配：窄屏时弹窗占满宽度，图片稍小 */
@media (max-width: 640px) {
  .modal-container {
    width: 100%;
    max-height: 92vh;
    border-radius: 14px;
  }
  .modal-header,
  .modal-desc,
  .modal-body {
    padding-left: 16px;
    padding-right: 16px;
  }
  .spot-image {
    width: 80px;
    height: 80px;
    min-width: 80px;
  }
}
</style>
