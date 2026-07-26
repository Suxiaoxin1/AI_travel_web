<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">我的收藏</h1>
      <p class="page-subtitle">你收藏的行程、景点和攻略</p>
    </div>
    <div class="favorites-grid">
      <div v-if="!favorites.length" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D4C8B8" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <p>还没有收藏，快去发现精彩旅程吧</p>
        <button class="go-plan-btn" @click="$router.push('/plan')">前往旅行规划</button>
      </div>
      <div v-for="item in favorites" :key="item.id" class="fav-card">
        <div class="fav-image" :style="{ background: getCardBackground(item) }">
          <div v-if="item.plan_json" class="fav-days-badge">{{ item.plan_json.days }}天{{ (item.plan_json.cities || []).length || 1 }}城</div>
        </div>
        <div class="fav-body">
          <div class="fav-type">{{ item.type }}</div>
          <h3 class="fav-name">{{ item.name }}</h3>
          <p class="fav-desc">{{ item.description }}</p>
          <!-- 行程卡片额外展示景点缩略图 -->
          <div v-if="item.plan_json && item.plan_json.daysList" class="fav-spots">
            <div v-for="spot in getAllSpots(item.plan_json).slice(0, 6)" :key="spot.name" :class="['fav-spot-thumb', { 'fav-spot-name-only': !spot.image }]" :title="spot.name">
              <img v-if="spot.image" :src="spot.image" :alt="spot.name" />
              <span v-else class="fav-spot-name">{{ spot.name }}</span>
            </div>
          </div>
          <div class="fav-footer">
            <span class="fav-date">{{ formatDate(item.created_at) }}</span>
            <div class="fav-actions">
              <button v-if="item.plan_json" class="fav-view" @click="viewPlan(item)">查看详情</button>
              <button class="fav-unlike" @click="removeFavorite(item.id)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                取消收藏
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 行程详情弹窗 -->
    <div v-if="viewingPlan" class="plan-modal" @click.self="viewingPlan = null">
      <div class="plan-modal-card">
        <button class="modal-close" @click="viewingPlan = null">✕</button>
        <h2>{{ viewingPlan.name }}</h2>
        <p class="modal-meta" v-if="viewingPlan.plan_json">{{ viewingPlan.plan_json.days }}天 · {{ (viewingPlan.plan_json.cities || []).length || 1 }}城 · 预算 ¥{{ viewingPlan.plan_json.budget || '未知' }}</p>
        <div v-if="viewingPlan.plan_json && viewingPlan.plan_json.userInput" class="modal-user-input">用户输入：{{ viewingPlan.plan_json.userInput }}</div>
        <div class="modal-timeline" v-if="viewingPlan.plan_json">
          <div v-for="(day, i) in viewingPlan.plan_json.daysList" :key="i" class="modal-day">
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useFavoriteStore } from '../stores/favoriteStore.js'

const favoriteStore = useFavoriteStore()
const favorites = computed(() => favoriteStore.favorites)
const viewingPlan = ref(null)
const defaultColor = 'linear-gradient(135deg, #0D6B5C, #1A8A7A)'

onMounted(() => {
  favoriteStore.loadFavorites()
})

// 取消收藏
async function removeFavorite(id) {
  await favoriteStore.removeFavorite(id)
}

// 查看行程详情
function viewPlan(item) {
  viewingPlan.value = item
}

// 格式化日期
function formatDate(iso) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

// 获取卡片背景
function getCardBackground(item) {
  if (item.image_url) return `url(${item.image_url})`
  if (item.color) return item.color
  return defaultColor
}

// 从 plan.daysList 提取所有景点（去重）
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
</script>

<style scoped>
.page-container { max-width: 1200px; width: 90%; margin: 0 auto; padding: 40px 24px; }
.page-header { text-align: center; margin-bottom: 32px; }
.page-title { font-size: 28px; font-weight: 700; color: #1A1A2E; margin: 0 0 6px; }
.page-subtitle { font-size: 14px; color: #8B8B9E; margin: 0; }

.favorites-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

.fav-card { background: #fff; border: 1px solid #E5E0D6; border-radius: 16px; overflow: hidden; transition: all 0.3s; display: flex; flex-direction: column; }
.fav-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }

.fav-image { height: 120px; position: relative; }
.fav-days-badge {
  position: absolute; top: 12px; right: 12px;
  padding: 4px 10px; background: rgba(255,255,255,0.95); border-radius: 12px;
  font-size: 12px; font-weight: 600; color: #0D6B5C;
}

.fav-body { padding: 16px; flex: 1; display: flex; flex-direction: column; }
.fav-type { font-size: 11px; color: #0D6B5C; background: rgba(13,107,92,0.08); padding: 2px 10px; border-radius: 8px; display: inline-block; margin-bottom: 8px; align-self: flex-start; }
.fav-name { font-size: 16px; font-weight: 600; color: #1A1A2E; margin: 0 0 6px; }
.fav-desc { font-size: 13px; color: #5C5C6E; margin: 0 0 12px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.fav-spots { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
.fav-spot-thumb { width: 44px; height: 44px; border-radius: 6px; overflow: hidden; border: 1px solid #F0EDE6; background: #F8F6F0; display: flex; align-items: center; justify-content: center; }
.fav-spot-thumb img { width: 100%; height: 100%; object-fit: cover; }
.fav-spot-name-only { width: auto; height: auto; max-width: 160px; padding: 5px 8px; background: #fff; }
.fav-spot-name { font-size: 11px; line-height: 1.25; color: #5C5C6E; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.fav-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F0EDE6; padding-top: 12px; margin-top: auto; }
.fav-date { font-size: 11px; color: #8B8B9E; }
.fav-actions { display: flex; gap: 10px; }
.fav-view { border: none; background: none; color: #0D6B5C; font-size: 12px; cursor: pointer; font-family: 'Noto Sans SC', sans-serif; }
.fav-view:hover { text-decoration: underline; }
.fav-unlike { display: flex; align-items: center; gap: 4px; border: none; background: none; color: #C23B22; font-size: 12px; cursor: pointer; font-family: 'Noto Sans SC', sans-serif; }
.fav-unlike:hover { opacity: 0.8; }

.empty-state { grid-column: 1 / -1; text-align: center; padding: 60px 20px; }
.empty-state svg { display: flex; margin: 0 auto 16px; }
.empty-state p { font-size: 14px; color: #8B8B9E; margin-bottom: 16px; }
.go-plan-btn { padding: 10px 24px; background: #0D6B5C; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans SC', sans-serif; }
.go-plan-btn:hover { background: #1A8A7A; }

/* 行程详情弹窗 */
.plan-modal {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 20px;
}
.plan-modal-card {
  background: #fff; border-radius: 16px; padding: 28px;
  max-width: 720px; width: 100%; max-height: 88vh; overflow-y: auto;
  position: relative;
}
.modal-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%; border: none; background: #F8F6F0; color: #5C5C6E; cursor: pointer; font-size: 16px; }
.modal-close:hover { background: #E5E0D6; }
.plan-modal-card h2 { font-size: 20px; font-weight: 700; color: #1A1A2E; margin: 0 0 8px; padding-right: 40px; }
.modal-meta { font-size: 13px; color: #0D6B5C; margin: 0 0 12px; }
.modal-user-input { font-size: 13px; color: #5C5C6E; padding: 10px 14px; background: #F8F6F0; border-radius: 8px; margin-bottom: 16px; line-height: 1.6; }
.modal-timeline { padding-left: 4px; }
.modal-day { display: flex; gap: 12px; margin-bottom: 16px; }
.modal-day-dot { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #1A8A7A, #0D6B5C); color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.modal-day-content { flex: 1; min-width: 0; }
.modal-day-content h4 { font-size: 14px; font-weight: 600; color: #1A1A2E; margin: 0 0 4px; }
.modal-day-content p { font-size: 13px; color: #5C5C6E; margin: 0 0 8px; line-height: 1.5; }
.modal-spots { display: flex; gap: 8px; flex-wrap: wrap; }
.modal-spot { display: flex; align-items: center; gap: 6px; padding: 4px 10px 4px 4px; background: #F8F6F0; border-radius: 8px; border: 1px solid #F0EDE6; }
.modal-spot img { width: 28px; height: 28px; border-radius: 4px; object-fit: cover; }
.modal-spot span { font-size: 12px; color: #5C5C6E; }

@media (max-width: 640px) {
  .page-container { width: 100%; padding: 24px 16px; }
}
</style>
