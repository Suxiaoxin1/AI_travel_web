<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">我的预定</h1>
      <p class="page-subtitle">收藏可回访的旅行商品 / 搜索链接；正式订单能力将在二期开放</p>
    </div>

    <div v-if="!authStore.currentUser" class="login-tip">
      <p>请先登录后查看你的预定收藏</p>
      <button class="login-btn" @click="router.push('/auth?redirect=/bookings')">前往登录</button>
    </div>

    <div v-else class="bookings-page">
      <div class="toolbar">
        <button type="button" class="open-drawer-btn" @click="openDrawer">在侧栏打开</button>
      </div>

      <section class="section">
        <div class="section-head">
          <h2>想去的商品</h2>
          <span>{{ intentBookings.length }}</span>
        </div>
        <div v-if="!intentBookings.length" class="empty-state">
          <p>还没有收藏旅行链接</p>
          <p class="empty-tip">去首页地图打开省份弹窗，点击跟团或景点门票，返回后即可保存</p>
        </div>
        <div v-else class="list">
          <article v-for="b in intentBookings" :key="b.id" class="card">
            <div
              class="card-cover"
              :class="{ 'has-cover': !!resolveBookingCoverImage(b) }"
              :style="coverStyle(b)"
            >
              <span class="pill" :class="b.platform">{{ platformLabel(b.platform) }}</span>
              <span class="pill muted">{{ b.link_type === 'product' ? '商品页' : '搜索入口' }}</span>
            </div>
            <div class="card-body">
              <h3>{{ b.title || b.keyword || b.source_name || '旅行链接' }}</h3>
              <p class="sub">{{ sourceSubtitle(b) }}</p>
              <p v-if="b.note" class="note">{{ b.note }}</p>
              <div class="actions">
                <a v-if="b.url" :href="b.url" target="_blank" rel="noopener noreferrer">打开</a>
                <button type="button" @click="copyUrl(b.url)">复制</button>
                <button type="button" class="danger" @click="remove(b)">删除</button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>已确认订单</h2>
          <span>{{ orderBookings.length }}</span>
        </div>
        <div class="empty-state dashed">
          <p>暂无已确认订单</p>
          <p class="empty-tip">二期将支持订单状态；一期请使用上方「想去的商品」收藏链接</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore.js'
import { useBookingStore } from '../stores/bookingStore.js'
import { useUiStore } from '../stores/uiStore.js'
import { platformLabel, resolveBookingCoverImage, sourceSubtitle } from '../utils/bookingLinks.js'

const router = useRouter()
const authStore = useAuthStore()
const bookingStore = useBookingStore()
const ui = useUiStore()

const intentBookings = computed(() => bookingStore.intentBookings)
const orderBookings = computed(() => bookingStore.orderBookings)

onMounted(() => {
  if (authStore.currentUser) bookingStore.loadBookings()
})

function openDrawer() {
  ui.openDrawer('bookings')
}

function coverStyle(b) {
  const cover = resolveBookingCoverImage(b)
  if (cover) {
    return {
      backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.4)), url(${cover})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  if (b.platform === 'fliggy') return { background: 'linear-gradient(135deg, #FF6B35, #E85A2A)' }
  if (b.platform === 'ctrip') return { background: 'linear-gradient(135deg, #2D8CF0, #1A6FCC)' }
  return { background: 'linear-gradient(135deg, #0D6B5C, #1A8A7A)' }
}

async function copyUrl(url) {
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    ui.showToast('链接已复制', 'success')
  } catch {
    window.prompt('复制下面的链接：', url)
  }
}

async function remove(b) {
  const name = b?.title || b?.keyword || '该收藏'
  if (!window.confirm(`确定删除「${name}」吗？`)) return
  await bookingStore.removeBooking(b.id)
}
</script>

<style scoped>
.page-container { max-width: 800px; margin: 0 auto; padding: 80px 24px 40px; }
.page-header { text-align: center; margin-bottom: 28px; }
.page-title { font-size: 28px; font-weight: 700; color: #1A1A2E; margin: 0 0 6px; }
.page-subtitle { font-size: 14px; color: #8B8B9E; margin: 0; }

.toolbar { display: flex; justify-content: flex-end; margin-bottom: 16px; }
.open-drawer-btn {
  border: 1px solid #E5E0D6; background: #fff; border-radius: 999px;
  padding: 8px 14px; font-size: 13px; color: #0D6B5C; cursor: pointer; font-weight: 600;
}

.section { margin-bottom: 28px; }
.section-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.section-head h2 { margin: 0; font-size: 16px; color: #1A1A2E; }
.section-head span {
  font-size: 12px; padding: 2px 8px; border-radius: 999px;
  background: rgba(13,107,92,0.1); color: #0D6B5C; font-weight: 600;
}

.list { display: flex; flex-direction: column; gap: 12px; }
.card {
  background: #fff; border: 1px solid #E5E0D6; border-radius: 14px; overflow: hidden;
}
.card-cover {
  min-height: 110px; padding: 12px; display: flex; align-items: flex-start; gap: 8px;
  background-repeat: no-repeat;
}
.card-body { padding: 14px 18px 16px; }
.pill {
  font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
  background: rgba(255,255,255,0.92); color: #5C5C6E;
}
.pill.ctrip { background: rgba(45,140,240,0.92); color: #fff; }
.pill.fliggy { background: rgba(255,107,53,0.92); color: #fff; }
.pill.muted { font-weight: 600; background: rgba(0,0,0,0.4); color: #fff; }
.card h3 { margin: 0 0 6px; font-size: 16px; color: #1A1A2E; }
.sub, .note, .empty-tip { margin: 0; font-size: 13px; color: #8B8B9E; line-height: 1.5; }
.note { margin-top: 6px; }
.actions { display: flex; gap: 10px; margin-top: 12px; }
.actions a, .actions button {
  border: none; background: none; padding: 0; font-size: 13px;
  color: #0D6B5C; font-weight: 600; cursor: pointer; text-decoration: none;
}
.actions .danger { color: #C23B22; }

.empty-state { text-align: center; padding: 36px 16px; color: #8B8B9E; }
.empty-state.dashed {
  border: 1px dashed #E5E0D6; border-radius: 12px; background: #fff;
}
.empty-state p { margin: 0 0 6px; font-size: 14px; color: #5C5C6E; }

.login-tip { text-align: center; padding: 80px 20px; }
.login-tip p { font-size: 15px; color: #5C5C6E; margin: 0 0 24px; }
.login-btn {
  padding: 10px 28px; background: linear-gradient(135deg, #0D6B5C 0%, #1A8A7A 100%);
  color: #fff; border: none; border-radius: 24px; font-size: 14px; font-weight: 600; cursor: pointer;
}
</style>
