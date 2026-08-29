<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="ui.drawerType" class="drawer-mask" @click="ui.closeDrawer"></div>
    </Transition>
    <Transition name="drawer-slide">
      <div v-if="ui.drawerType" class="drawer-panel">
        <!-- 头部：3 个 Tab 切换 -->
        <div class="drawer-header">
          <div class="drawer-tabs">
            <button :class="['d-tab', { active: ui.drawerType === 'favorites' }]" @click="ui.openDrawer('favorites')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              我的收藏
              <span v-if="favorites.length" class="tab-count">{{ favorites.length }}</span>
            </button>
            <button :class="['d-tab', { active: ui.drawerType === 'bookings' }]" @click="ui.openDrawer('bookings')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              我的预定
              <span v-if="bookings.length" class="tab-count">{{ bookings.length }}</span>
            </button>
            <button :class="['d-tab', { active: ui.drawerType === 'journal' }]" @click="ui.openDrawer('journal')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              我的日记
              <span v-if="journals.length" class="tab-count">{{ journals.length }}</span>
            </button>
          </div>
          <button class="d-close" @click="ui.closeDrawer">✕</button>
        </div>

        <!-- 主体内容 -->
        <div class="drawer-body">
          <!-- 我的收藏 -->
          <div v-if="ui.drawerType === 'favorites'">
            <div v-if="!favorites.length" class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D4C8B8" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <p>还没有收藏</p>
            </div>
            <div v-else class="masonry">
              <div v-for="item in favorites" :key="item.id" class="masonry-card">
                <div class="masonry-image" :style="{ backgroundImage: getCardImage(item) }">
                  <div class="masonry-badge">
                    <svg v-if="item.type === '行程'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <svg v-else-if="item.type === '景点'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    {{ item.type }}
                  </div>
                  <button class="masonry-del" @click.stop="removeFavorite(item.id)">✕</button>
                </div>
                <div class="masonry-content">
                  <h4 class="masonry-title">{{ item.name }}</h4>
                  <p class="masonry-desc">{{ item.description }}</p>
                  <div v-if="item.plan_json && item.plan_json.daysList" class="masonry-spots">
                    <div v-for="s in getAllSpots(item.plan_json).slice(0, 3)" :key="s.name" :class="['mini-spot', { 'mini-spot-name-only': !s.image }]" :title="s.name">
                      <img v-if="s.image" :src="s.image" :alt="s.name" />
                      <span v-else>{{ s.name }}</span>
                    </div>
                  </div>
                  <div class="masonry-footer">
                    <span class="masonry-date">{{ formatDate(item.created_at) }}</span>
                    <button v-if="item.plan_json" class="masonry-link" @click="openPlanModal(item)">查看行程 →</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 我的预定 -->
          <div v-else-if="ui.drawerType === 'bookings'">
            <div v-if="!bookings.length" class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D4C8B8" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
              <p>还没有预定</p>
              <p class="empty-tip">去首页点击省份弹窗里的"携程"或"飞猪"按钮即可添加</p>
            </div>
            <div v-else class="masonry">
              <div v-for="b in bookings" :key="b.id" class="masonry-card">
                <div class="masonry-image booking-image" :style="{ background: getBookingColor(b) }">
                  <div class="masonry-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {{ b.province }}
                  </div>
                  <button class="masonry-del" @click.stop="removeBooking(b.id)">✕</button>
                </div>
                <div class="masonry-content">
                  <h4 class="masonry-title">{{ b.keyword || b.province + '跟团游' }}</h4>
                  <p class="masonry-desc">
                    <span v-if="b.order_no" class="booking-meta">订单号：{{ b.order_no }}</span>
                    <span v-if="b.travel_date" class="booking-meta">出行：{{ formatDate(b.travel_date) }}</span>
                    <span v-if="b.amount" class="booking-meta">金额：¥{{ b.amount }}</span>
                    <span v-if="!b.order_no">点击按钮前往{{ platformName(b.platform) }}查看并完成预订</span>
                  </p>
                  <div class="masonry-footer">
                    <span class="masonry-date">{{ formatDate(b.created_at) }}</span>
                    <a v-if="b.url" :href="b.url" target="_blank" rel="noopener noreferrer" class="masonry-link">前往{{ platformName(b.platform) }} →</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 我的日记 -->
          <div v-else-if="ui.drawerType === 'journal'">
            <div v-if="!journals.length" class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D4C8B8" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <p>还没有日记</p>
              <p class="empty-tip">前往"旅游手账"页面记录你的旅行故事</p>
            </div>
            <div v-else class="masonry">
              <div v-for="j in journals" :key="j.id" class="masonry-card">
                <div class="masonry-image" :style="{ backgroundImage: getJournalImage(j) }">
                  <div class="masonry-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/></svg>
                    {{ formatDate(j.travel_date || j.created_at) }}
                  </div>
                  <button class="masonry-del" @click.stop="removeJournal(j.id)">✕</button>
                </div>
                <div class="masonry-content">
                  <h4 class="masonry-title">{{ j.title }}</h4>
                  <p class="masonry-desc">{{ j.mood || '记录一段美好旅程' }}</p>
                  <div class="masonry-footer">
                    <span class="masonry-date">{{ j.location }}</span>
                    <button class="masonry-link" @click="openJournal(j)">继续编辑 →</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 行程详情弹窗 -->
    <Transition name="modal-fade">
      <div v-if="planModal" class="plan-modal" @click.self="planModal = null">
        <div class="plan-modal-card">
          <button class="modal-close" @click="planModal = null">✕</button>
          <h2>{{ planModal.name }}</h2>
          <p class="modal-meta" v-if="planModal.plan_json">{{ planModal.plan_json.days }}天 · {{ (planModal.plan_json.cities || []).length || 1 }}城 · 预算 ¥{{ planModal.plan_json.budget || '未知' }}</p>
          <div v-if="planModal.plan_json && planModal.plan_json.userInput" class="modal-user-input">用户输入：{{ planModal.plan_json.userInput }}</div>
          <div class="modal-timeline" v-if="planModal.plan_json">
            <div v-for="(day, i) in planModal.plan_json.daysList" :key="i" class="modal-day">
              <div class="modal-day-dot">{{ i + 1 }}</div>
              <div class="modal-day-content">
                <h4>{{ day.title }}</h4>
                <p>{{ day.desc }}</p>
                <div class="modal-spots">
                  <div v-for="s in day.spots" :key="s.name" class="modal-spot">
                    <img v-if="s.image" :src="s.image" :alt="s.name" />
                    <span>{{ s.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useUiStore } from '../stores/uiStore.js'
import { useBookingStore } from '../stores/bookingStore.js'
import { useFavoriteStore } from '../stores/favoriteStore.js'
import { useJournalStore } from '../stores/journalStore.js'
import { useAuthStore } from '../stores/authStore.js'
import { useRouter } from 'vue-router'

const ui = useUiStore()
const bookingStore = useBookingStore()
const favoriteStore = useFavoriteStore()
const journalStore = useJournalStore()
const authStore = useAuthStore()
const router = useRouter()

// 行程详情 Modal
const planModal = ref(null)

// 监听抽屉打开，重新加载数据
watch(() => ui.drawerType, (val) => {
  if (val) {
    favoriteStore.loadFavorites()
    bookingStore.loadBookings()
    journalStore.loadJournals()
  }
})

// 收藏、预定、日记直接取自 store
const favorites = computed(() => favoriteStore.favorites || [])
const bookings = computed(() => bookingStore.currentUserBookings || [])
const journals = computed(() => journalStore.journals || [])

async function openJournal(journal) {
  await router.push({ name: 'TravelJournal', query: { journalId: journal.id } })
  ui.closeDrawer()
}

// 删除收藏
async function removeFavorite(id) {
  await favoriteStore.removeFavorite(id)
}

// 删除日记
async function removeJournal(id) {
  await journalStore.removeJournal(id)
}

// 删除预订
async function removeBooking(id) {
  await bookingStore.removeBooking(id)
}

// 平台名
function platformName(p) {
  if (p === 'ctrip') return '携程'
  if (p === 'fliggy') return '飞猪'
  return '第三方'
}

// 格式化日期
function formatDate(iso) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

// 预订卡片颜色
function getBookingColor(b) {
  if (b.platform === 'ctrip') return 'linear-gradient(135deg, #2D8CF0, #1A6FCC)'
  if (b.platform === 'fliggy') return 'linear-gradient(135deg, #FF6B35, #E85A2A)'
  return 'linear-gradient(135deg, #0D6B5C, #1A8A7A)'
}

// 从 plan 提取所有景点
function getAllSpots(plan) {
  if (!plan || !plan.daysList) return []
  const map = new Map()
  plan.daysList.forEach(day => {
    (day.spots || []).forEach(s => {
      if (!map.has(s.name)) map.set(s.name, s)
    })
  })
  return Array.from(map.values())
}

// 打开行程详情
function openPlanModal(item) {
  planModal.value = item
}

// 获取卡片背景图：优先用景点图，否则用渐变
function getCardImage(item) {
  if (item.type === '行程' && item.plan_json) {
    const allSpots = getAllSpots(item.plan_json)
    const withImage = allSpots.find(s => s.image)
    if (withImage) return `url(${withImage.image})`
  }
  if (item.image_url) return `url(${item.image_url})`
  if (item.image) return `url(${item.image})`
  if (item.color) return item.color
  return 'linear-gradient(135deg, #0D6B5C, #1A8A7A)'
}

// 日记卡片图
function getJournalImage(j) {
  if (j.photos && j.photos.length) return `url(${j.photos[0]})`
  if (j.image) return `url(${j.image})`
  if (j.color) return j.color
  return 'linear-gradient(135deg, #4A90E2, #357ABD)'
}
</script>

<style scoped>
.drawer-mask {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4);
  z-index: 9998;
}

/* 右侧抽屉 */
.drawer-panel {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: 420px; max-width: 90vw;
  background: #FAF8F2;
  z-index: 9999;
  display: flex; flex-direction: column;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.1);
  font-family: 'Noto Sans SC', sans-serif;
}

/* 抽屉头部 */
.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #E5E0D6;
  background: #fff;
  flex-shrink: 0;
}
.drawer-tabs { display: flex; gap: 4px; flex: 1; }
.d-tab {
  display: flex; align-items: center; gap: 5px;
  padding: 8px 12px; border: none; background: none;
  border-radius: 10px; font-size: 13px; color: #5C5C6E;
  cursor: pointer; transition: all 0.2s; position: relative;
}
.d-tab:hover { background: #F8F6F0; }
.d-tab.active { background: rgba(13, 107, 92, 0.1); color: #0D6B5C; font-weight: 600; }
.tab-count {
  font-size: 10px; padding: 1px 6px; border-radius: 8px;
  background: rgba(13, 107, 92, 0.15); color: #0D6B5C; margin-left: 2px;
}
.d-close {
  width: 32px; height: 32px; border-radius: 50%;
  border: none; background: #F8F6F0; color: #5C5C6E;
  cursor: pointer; font-size: 16px; flex-shrink: 0;
}
.d-close:hover { background: #E5E0D6; }

/* 抽屉主体 */
.drawer-body { flex: 1; overflow-y: auto; padding: 16px; }
.drawer-body::-webkit-scrollbar { width: 6px; }
.drawer-body::-webkit-scrollbar-thumb { background: #D4C8B8; border-radius: 3px; }

/* 空状态 */
.empty-state { text-align: center; padding: 60px 20px; color: #8B8B9E; }
.empty-state svg { display: flex; margin: 0 auto 16px; }
.empty-state p { font-size: 14px; margin: 0 0 8px; color: #5C5C6E; }
.empty-tip { font-size: 12px; color: #8B8B9E; line-height: 1.6; }

/* 瀑布流 */
.masonry { display: flex; flex-direction: column; gap: 14px; }
.masonry-card {
  background: #fff; border: 1px solid #E5E0D6; border-radius: 14px;
  overflow: hidden; transition: all 0.25s; cursor: pointer;
}
.masonry-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08); }

.masonry-image {
  height: 110px; background-size: cover; background-position: center;
  position: relative; display: flex; align-items: flex-end;
  padding: 8px;
}
.masonry-badge {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 3px 8px; border-radius: 8px;
  background: rgba(255, 255, 255, 0.95); color: #1A1A2E;
  font-size: 11px; font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
.masonry-del {
  position: absolute; top: 6px; right: 6px;
  width: 22px; height: 22px; border-radius: 50%;
  border: none; background: rgba(0, 0, 0, 0.4); color: #fff;
  font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s;
}
.masonry-card:hover .masonry-del { opacity: 1; }
.masonry-del:hover { background: rgba(194, 59, 34, 0.8); }

.masonry-content { padding: 12px 14px; }
.masonry-title { font-size: 14px; font-weight: 600; color: #1A1A2E; margin: 0 0 4px; }
.masonry-desc { font-size: 12px; color: #5C5C6E; margin: 0 0 10px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.booking-meta { display: inline-block; margin-right: 10px; }
.booking-meta:last-child { margin-right: 0; }
.masonry-spots { display: flex; gap: 4px; margin-bottom: 10px; }
.mini-spot { width: 36px; height: 28px; border-radius: 4px; overflow: hidden; background: #F0EDE6; }
.mini-spot img { width: 100%; height: 100%; object-fit: cover; }
.mini-spot-name-only { width: auto; height: auto; max-width: 120px; padding: 4px 6px; background: #fff; border: 1px solid #F0EDE6; }
.mini-spot-name-only span { display: block; font-size: 10px; line-height: 1.25; color: #5C5C6E; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.masonry-footer { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #8B8B9E; padding-top: 8px; border-top: 1px solid #F0EDE6; }
.masonry-link { color: #0D6B5C; text-decoration: none; font-weight: 500; }
.masonry-link:hover { text-decoration: underline; }

/* 行程详情弹窗 */
.plan-modal {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 10000; padding: 20px;
}
.plan-modal-card {
  background: #fff; border-radius: 16px; padding: 28px;
  max-width: 640px; width: 100%; max-height: 88vh; overflow-y: auto;
  position: relative;
}
.modal-close {
  position: absolute; top: 16px; right: 16px;
  width: 32px; height: 32px; border-radius: 50%;
  border: none; background: #F8F6F0; color: #5C5C6E;
  cursor: pointer; font-size: 16px;
}
.plan-modal-card h2 { font-size: 20px; font-weight: 700; color: #1A1A2E; margin: 0 0 8px; padding-right: 40px; }
.modal-meta { font-size: 13px; color: #0D6B5C; margin: 0 0 12px; }
.modal-user-input { font-size: 13px; color: #5C5C6E; padding: 10px 14px; background: #F8F6F0; border-radius: 8px; margin-bottom: 16px; line-height: 1.6; }
.modal-timeline { padding-left: 4px; }
.modal-day { display: flex; gap: 12px; margin-bottom: 16px; }
.modal-day-dot {
  flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%;
  background: linear-gradient(135deg, #1A8A7A, #0D6B5C); color: #fff;
  font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.modal-day-content { flex: 1; min-width: 0; }
.modal-day-content h4 { font-size: 14px; font-weight: 600; color: #1A1A2E; margin: 0 0 4px; }
.modal-day-content p { font-size: 13px; color: #5C5C6E; margin: 0 0 8px; line-height: 1.5; }
.modal-spots { display: flex; gap: 8px; flex-wrap: wrap; }
.modal-spot {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 10px 4px 4px; background: #F8F6F0; border-radius: 8px;
  border: 1px solid #F0EDE6;
}
.modal-spot img { width: 28px; height: 28px; border-radius: 4px; object-fit: cover; }
.modal-spot span { font-size: 12px; color: #5C5C6E; }

/* 抽屉动画 */
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.25s; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }

.drawer-slide-enter-active, .drawer-slide-leave-active { transition: transform 0.3s ease; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
