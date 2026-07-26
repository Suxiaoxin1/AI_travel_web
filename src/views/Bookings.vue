<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">我的预定</h1>
      <p class="page-subtitle">管理你的酒店、机票、景点门票与旅行团</p>
    </div>

    <!-- 未登录提示：引导用户登录 -->
    <div v-if="!authStore.currentUser" class="login-tip">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4A84B" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>请先登录后查看你的预订</p>
      <button class="login-btn" @click="router.push('/login')">前往登录</button>
    </div>

    <div v-else class="bookings-list">
      <!-- 空状态：用户没添加任何预订 -->
      <div v-if="!displayBookings.length" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D4C8B8" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p>暂无预定，去地图点击省份查看团票吧</p>
      </div>

      <!-- 系统预置的 demo 预订（北京/成都/故宫门票） -->
      <div v-for="booking in demoBookings" :key="'demo-' + booking.id" class="booking-card">
        <div class="booking-status" :class="booking.status">{{ booking.statusText }}</div>
        <div class="booking-body">
          <h3 class="booking-name">{{ booking.name }}</h3>
          <div class="booking-meta">
            <div class="meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {{ booking.date }}
            </div>
            <div class="meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {{ booking.location }}
            </div>
            <div class="meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              {{ booking.duration }}
            </div>
          </div>
          <div class="booking-footer">
            <span class="booking-price">¥{{ booking.price }}</span>
            <div class="booking-actions">
              <button class="booking-btn" @click="alert('查看详情')">查看详情</button>
              <button class="booking-btn cancel" v-if="booking.status === 'confirmed'" @click="cancelDemo(booking.id)">取消预定</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 用户从地图添加的真实预订（飞猪链接） -->
      <div v-for="booking in userBookings" :key="booking.id" class="booking-card booking-card-fliggy">
        <div class="booking-status fliggy">飞猪旅行团</div>
        <div class="booking-body">
          <h3 class="booking-name">{{ booking.province }} · 跟团游</h3>
          <div class="booking-meta">
            <div class="meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {{ formatTime(booking.created_at) }}
            </div>
            <div class="meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              {{ booking.keyword }}
            </div>
          </div>
          <div class="booking-footer">
            <span class="booking-source">来自{{ platformName(booking.platform) }}</span>
            <div class="booking-actions">
              <button class="booking-btn primary" @click="openBooking(booking.url)">前往查看</button>
              <button class="booking-btn cancel" @click="removeBooking(booking.id)">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore.js'
import { useBookingStore } from '../stores/bookingStore.js'

const router = useRouter()
const authStore = useAuthStore()
const bookingStore = useBookingStore()

onMounted(() => {
  bookingStore.loadBookings()
})

// 从 store 取当前用户的预订
const userBookings = computed(() => bookingStore.currentUserBookings)
// 用于空状态判断：demo + 真实预订都为空时才显示空状态
const displayBookings = computed(() => [...userBookings.value, ...demoBookings.value])

// 系统预置 demo 数据（保持与之前页面一致）
const demoBookings = ref([
  { id: 1, type: '酒店', name: '大理古城民宿 · 风花雪月', status: 'confirmed', statusText: '已确认', date: '2026-07-15', location: '大理', duration: '3晚', price: '1,280' },
  { id: 2, type: '机票', name: '北京 → 成都 往返机票', status: 'confirmed', statusText: '已确认', date: '2026-07-10', location: '北京-成都', duration: '5天', price: '2,450' },
  { id: 3, type: '门票', name: '故宫博物院门票 × 2', status: 'pending', statusText: '待支付', date: '2026-07-20', location: '北京', duration: '1天', price: '280' },
])

// 取消 demo 预订
function cancelDemo(id) {
  if (confirm('确定要取消这个预定吗？')) {
    demoBookings.value = demoBookings.value.filter(b => b.id !== id)
  }
}

// 删除一条真实预订
async function removeBooking(id) {
  if (confirm('确定要删除这个预订记录吗？')) {
    await bookingStore.removeBooking(id)
  }
}

// 打开预订链接
function openBooking(url) {
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

// 平台名称
function platformName(p) {
  if (p === 'ctrip') return '携程'
  if (p === 'fliggy') return '飞猪'
  return '第三方'
}

// 时间戳/ISO 格式化为可读字符串
function formatTime(ts) {
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
.page-container { max-width: 800px; margin: 0 auto; padding: 80px 24px 40px; }
.page-header { text-align: center; margin-bottom: 32px; }
.page-title { font-size: 28px; font-weight: 700; color: #1A1A2E; margin: 0 0 6px; }
.page-subtitle { font-size: 14px; color: #8B8B9E; margin: 0; }

.bookings-list { display: flex; flex-direction: column; gap: 16px; }

.booking-card { background: #fff; border: 1px solid #E5E0D6; border-radius: 16px; overflow: hidden; }
.booking-card-fliggy { border-color: #FFCDB0; background: linear-gradient(180deg, #FFF9F2 0%, #FFFFFF 100%); }

.booking-status { padding: 8px 16px; font-size: 12px; font-weight: 600; }
.booking-status.confirmed { background: rgba(13,107,92,0.08); color: #0D6B5C; }
.booking-status.pending { background: rgba(212,168,75,0.1); color: #B8960C; }
.booking-status.fliggy { background: linear-gradient(90deg, #FF8A1F 0%, #FF6A00 100%); color: #FFFFFF; }

.booking-body { padding: 20px; }
.booking-name { font-size: 16px; font-weight: 600; color: #1A1A2E; margin: 0 0 12px; }

.booking-meta { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; }
.meta-item { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #5C5C6E; }

.booking-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F0EDE6; padding-top: 16px; }
.booking-price { font-size: 20px; font-weight: 700; color: #C23B22; }
.booking-source { font-size: 13px; color: #FF6A00; font-weight: 500; }
.booking-actions { display: flex; gap: 8px; }
.booking-btn { padding: 8px 16px; border: 1px solid #E5E0D6; border-radius: 8px; background: #F8F6F0; font-size: 13px; color: #5C5C6E; cursor: pointer; font-family: 'Noto Sans SC', sans-serif; transition: all 0.2s; }
.booking-btn:hover { border-color: #0D6B5C; color: #0D6B5C; }
.booking-btn.cancel:hover { color: #C23B22; border-color: #C23B22; }
.booking-btn.primary { background: linear-gradient(135deg, #FF8A1F 0%, #FF6A00 100%); color: #FFFFFF; border-color: transparent; }
.booking-btn.primary:hover { color: #FFFFFF; filter: brightness(1.05); }

.empty-state { text-align: center; padding: 60px 20px; }
.empty-state svg { display: flex; margin: 0 auto 16px; }
.empty-state p { font-size: 14px; color: #8B8B9E; }

.login-tip { text-align: center; padding: 80px 20px; }
.login-tip svg { display: flex; margin: 0 auto 16px; }
.login-tip p { font-size: 15px; color: #5C5C6E; margin: 0 0 24px; }
.login-btn { padding: 10px 28px; background: linear-gradient(135deg, #0D6B5C 0%, #1A8A7A 100%); color: #fff; border: none; border-radius: 24px; font-size: 14px; font-weight: 600; cursor: pointer; }
.login-btn:hover { filter: brightness(1.1); }
</style>
