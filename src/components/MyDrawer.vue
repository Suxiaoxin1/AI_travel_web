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
              <span v-if="intentBookings.length || orderBookings.length" class="tab-count">{{ intentBookings.length + orderBookings.length }}</span>
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
                  <button class="masonry-del" title="删除" @click.stop="confirmRemoveFavorite(item)">✕</button>
                </div>
                <div class="masonry-content">
                  <h4 class="masonry-title">{{ item.name }}</h4>
                  <p class="masonry-desc">{{ item.description }}</p>
                  <div v-if="getPreviewTags(item.plan_json).length" class="masonry-tags">
                    <span
                      v-for="tag in getPreviewTags(item.plan_json).slice(0, 4)"
                      :key="tag.label"
                      class="masonry-tag"
                      :class="`type-${tag.type || 'experience'}`"
                    >{{ tag.label }}</span>
                  </div>
                  <div class="masonry-footer">
                    <span class="masonry-date">{{ formatDate(item.created_at) }}</span>
                    <div class="masonry-actions">
                    <button v-if="item.plan_json" class="masonry-link" @click="openPlanModal(item)">查看行程 →</button>
                      <button class="masonry-delete-btn" @click.stop="confirmRemoveFavorite(item)">删除</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 我的预定：意向商品 + 已确认订单（二期） -->
          <div v-else-if="ui.drawerType === 'bookings'" class="bookings-panel">
            <section class="booking-section">
              <div class="section-head">
                <h3 class="section-title">想去的商品</h3>
                <span class="section-count">{{ intentBookings.length }}</span>
              </div>
              <div v-if="!intentBookings.length" class="empty-state compact">
                <p>还没有收藏旅行链接</p>
                <p class="empty-tip">在首页省份弹窗点「跟团」或景点「门票」，跳转后返回即可保存链接</p>
            </div>
            <div v-else class="masonry">
                <div v-for="b in intentBookings" :key="b.id" class="masonry-card">
                  <div
                    class="masonry-image booking-image"
                    :class="{ 'has-cover': !!bookingCover(b) }"
                    :style="getBookingCoverStyle(b)"
                  >
                    <div class="masonry-badge">{{ platformName(b.platform) }}</div>
                    <span class="link-type-pill">{{ linkTypeLabel(b.link_type) }}</span>
                    <button class="masonry-del" title="删除" @click.stop="confirmRemoveBooking(b)">✕</button>
                  </div>
                  <div class="masonry-content">
                    <h4 class="masonry-title">{{ bookingTitle(b) }}</h4>
                    <p class="masonry-desc">{{ sourceSubtitle(b) }}</p>
                    <p v-if="b.note" class="booking-note">{{ b.note }}</p>
                    <div class="masonry-footer booking-footer">
                      <span class="masonry-date">{{ formatDate(b.updated_at || b.created_at) }}</span>
                      <div class="masonry-actions booking-actions-wrap">
                        <a
                          v-if="b.url"
                          :href="b.url"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="masonry-link"
                        >打开</a>
                        <button type="button" class="masonry-link" @click="copyBookingUrl(b)">复制</button>
                        <button
                          v-if="b.link_type !== 'product'"
                          type="button"
                          class="masonry-link upgrade-link"
                          @click="openUpgradeBooking(b)"
                        >升级为商品链接</button>
                        <button type="button" class="masonry-link" @click="openEditBooking(b)">编辑</button>
                        <button type="button" class="masonry-delete-btn" @click.stop="confirmRemoveBooking(b)">删除</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section class="booking-section order-section">
              <div class="section-head">
                <h3 class="section-title">已确认订单</h3>
                <span class="section-count">{{ orderBookings.length }}</span>
              </div>
              <div v-if="!orderBookings.length" class="empty-state compact">
                <p>暂无已确认订单</p>
                <p class="empty-tip">二期将支持订单号与出行状态；一期请先在上方收藏可回访的商品链接</p>
              </div>
              <div v-else class="masonry">
                <div v-for="b in orderBookings" :key="b.id" class="masonry-card">
                  <div
                    class="masonry-image booking-image"
                    :class="{ 'has-cover': !!bookingCover(b) }"
                    :style="getBookingCoverStyle(b)"
                  >
                    <div class="masonry-badge">{{ platformName(b.platform) }}</div>
                    <button class="masonry-del" title="删除" @click.stop="confirmRemoveBooking(b)">✕</button>
                </div>
                <div class="masonry-content">
                    <h4 class="masonry-title">{{ bookingTitle(b) }}</h4>
                  <p class="masonry-desc">
                    <span v-if="b.order_no" class="booking-meta">订单号：{{ b.order_no }}</span>
                    <span v-if="b.travel_date" class="booking-meta">出行：{{ formatDate(b.travel_date) }}</span>
                    <span v-if="b.amount" class="booking-meta">金额：¥{{ b.amount }}</span>
                  </p>
                  <div class="masonry-footer">
                    <span class="masonry-date">{{ formatDate(b.created_at) }}</span>
                      <div class="masonry-actions">
                        <a v-if="b.url" :href="b.url" target="_blank" rel="noopener noreferrer" class="masonry-link">打开 →</a>
                        <button class="masonry-delete-btn" @click.stop="confirmRemoveBooking(b)">删除</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
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
                  <button class="masonry-del" title="删除" @click.stop="confirmRemoveJournal(j)">✕</button>
                </div>
                <div class="masonry-content">
                  <h4 class="masonry-title">{{ j.title }}</h4>
                  <p class="masonry-desc">{{ j.mood || '记录一段美好旅程' }}</p>
                  <div class="masonry-footer">
                    <span class="masonry-date">{{ j.location }}</span>
                    <div class="masonry-actions">
                      <button class="masonry-delete-btn" @click.stop="confirmRemoveJournal(j)">删除</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 行程详情弹窗：与旅行规划报告结构对齐 -->
    <Transition name="modal-fade">
      <div v-if="planModal" class="plan-modal" @click.self="planModal = null">
        <div class="plan-modal-card">
          <button class="modal-close" @click="planModal = null">✕</button>
          <h2>{{ planModal.name }}</h2>
          <p class="modal-meta" v-if="planModal.plan_json">
            {{ planModal.plan_json.destination || '目的地待定' }}
            · {{ planModal.plan_json.days || (planModal.plan_json.daysList || []).length }}天
            · {{ formatCities(planModal.plan_json) }}城
            · {{ planModal.plan_json.estimateCost || planModal.plan_json.budgetLabel || (planModal.plan_json.budget ? `¥${planModal.plan_json.budget}` : '预算灵活') }}
          </p>
          <div v-if="planModal.plan_json?.userInput" class="modal-user-input">用户输入：{{ planModal.plan_json.userInput }}</div>

          <div v-if="planModal.plan_json?.reason" class="modal-block">
            <div class="modal-block-title">推荐理由</div>
            <p class="modal-block-text">{{ planModal.plan_json.reason }}</p>
          </div>

          <div v-if="planModal.plan_json?.transport" class="modal-block">
            <div class="modal-block-title">出发信息</div>
            <p class="modal-block-text">{{ formatTransport(planModal.plan_json.transport) }}</p>
          </div>

          <div v-if="planModal.plan_json?.weather?.days?.length" class="modal-block weather-block">
            <div class="modal-block-title">
              出行天气预报
              <span class="weather-loc">{{ planModal.plan_json.weather.city }}{{ planModal.plan_json.weather.admin1 ? ` · ${planModal.plan_json.weather.admin1}` : '' }}</span>
            </div>
            <p v-if="planModal.plan_json.weather.note" class="weather-note" :class="{ 'is-ref': planModal.plan_json.weather.mode !== 'forecast' }">{{ planModal.plan_json.weather.note }}</p>
            <div class="weather-row">
              <div v-for="d in planModal.plan_json.weather.days" :key="d.date" class="weather-chip" :class="{ 'is-ref': d.source === 'historical' }">
                <span class="w-day">{{ d.weekday }}</span>
                <span class="w-date">{{ formatShortDate(d.date) }}</span>
                <span class="w-sum">{{ d.summary }}</span>
                <span class="w-temp">{{ formatTemp(d.temp_max) }}/{{ formatTemp(d.temp_min) }}</span>
              </div>
            </div>
          </div>

          <div v-if="planModal.plan_json?.bestSeason || planModal.plan_json?.hotel" class="modal-info-row">
            <div v-if="planModal.plan_json.bestSeason" class="modal-info-card">
              <span class="info-label">最佳季节</span>
              <strong>{{ planModal.plan_json.bestSeason }}</strong>
            </div>
            <div v-if="planModal.plan_json.hotel" class="modal-info-card">
              <span class="info-label">住宿建议</span>
              <strong>{{ planModal.plan_json.hotel }}</strong>
            </div>
          </div>

          <div v-if="planModal.plan_json?.tips?.length" class="modal-block">
            <div class="modal-block-title">旅行贴士</div>
            <ul class="modal-tips">
              <li v-for="(t, i) in planModal.plan_json.tips" :key="i">{{ t }}</li>
            </ul>
          </div>

          <div class="modal-timeline" v-if="planModal.plan_json?.daysList?.length">
            <div class="modal-block-title days-head-title">每日行程安排</div>
            <div v-for="(day, i) in planModal.plan_json.daysList" :key="i" class="modal-day">
              <div class="modal-day-dot">{{ i + 1 }}</div>
              <div class="modal-day-content">
                <h4>{{ day.title }}</h4>
                <p>{{ day.desc }}</p>
                <div v-if="day.highlights?.length" class="modal-highlights">
                  <span
                    v-for="(h, j) in day.highlights"
                    :key="`${h.type}-${h.label}-${j}`"
                    class="modal-highlight"
                    :class="`type-${h.type || 'experience'}`"
                  >{{ h.label }}</span>
                </div>
                <div v-else-if="day.spots?.length" class="modal-spots">
                  <div v-for="s in day.spots" :key="s.name || s" class="modal-spot">
                    <img v-if="s.image" :src="s.image" :alt="s.name || s" />
                    <span>{{ s.name || s }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    <!-- 意向链接编辑 / 升级弹窗 -->
    <Transition name="modal-fade">
      <div v-if="editBooking" class="plan-modal" @click.self="closeEditBooking">
        <div class="plan-modal-card booking-edit-card">
          <button class="modal-close" @click="closeEditBooking">✕</button>
          <h2>{{ editMode === 'upgrade' ? '升级为商品链接' : '编辑收藏' }}</h2>
          <p v-if="editMode === 'upgrade'" class="edit-hint">
            当前是搜索入口。请粘贴携程/飞猪商品页地址，保存后可下次直达。
          </p>
          <div class="edit-form">
            <label>标题</label>
            <input v-model="editForm.title" type="text" maxlength="255" />
            <label>{{ editMode === 'upgrade' ? '商品页链接' : '链接' }}</label>
            <div class="edit-url-row">
              <input
                ref="editUrlInput"
                v-model="editForm.url"
                type="url"
                :class="{ invalid: !!editError && editForm.url.trim() }"
                :placeholder="editMode === 'upgrade' ? '粘贴商品页 https://…' : ''"
              />
              <button
                v-if="editMode === 'upgrade'"
                type="button"
                class="edit-paste-btn"
                @click="pasteUpgradeUrl"
              >剪贴板</button>
            </div>
            <label>备注</label>
            <input v-model="editForm.note" type="text" maxlength="500" />
            <p v-if="editError" class="edit-error">{{ editError }}</p>
            <p v-else-if="editMode === 'upgrade' && editUrlOk" class="edit-ok">链接可用</p>
          </div>
          <div class="edit-actions">
            <button type="button" class="masonry-delete-btn" @click="closeEditBooking">取消</button>
            <button
              type="button"
              class="edit-save-btn"
              :disabled="editSaving || (editMode === 'upgrade' && !editUrlOk)"
              @click="saveEditBooking"
            >
              {{ editSaving ? '保存中…' : (editMode === 'upgrade' ? '确认升级' : '保存') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useUiStore } from '../stores/uiStore.js'
import { useBookingStore } from '../stores/bookingStore.js'
import { useFavoriteStore } from '../stores/favoriteStore.js'
import { useJournalStore } from '../stores/journalStore.js'
import {
  isAllowedBookingUrl,
  platformLabel,
  resolveBookingCoverImage,
  sourceSubtitle
} from '../utils/bookingLinks.js'
import { resolveDisplayMediaUrl } from '../utils/mediaUrl.js'

const ui = useUiStore()
const bookingStore = useBookingStore()
const favoriteStore = useFavoriteStore()
const journalStore = useJournalStore()

const planModal = ref(null)
const editBooking = ref(null)
const editMode = ref('edit') // edit | upgrade
const editForm = ref({ title: '', url: '', note: '' })
const editError = ref('')
const editSaving = ref(false)
const editUrlInput = ref(null)

const editUrlOk = computed(() => {
  const text = String(editForm.value.url || '').trim()
  return !!text && isAllowedBookingUrl(text) && /^https?:\/\//i.test(text)
})

watch(() => editForm.value.url, (value) => {
  if (editMode.value !== 'upgrade') return
  const text = String(value || '').trim()
  if (!text) {
    editError.value = ''
    return
  }
  if (!/^https?:\/\//i.test(text)) {
    editError.value = '请粘贴以 http(s):// 开头的完整链接'
    return
  }
  if (!isAllowedBookingUrl(text)) {
    editError.value = '仅支持携程/飞猪等旅行平台链接'
    return
  }
  editError.value = ''
})

watch(() => ui.drawerType, (val) => {
  if (val) {
    favoriteStore.loadFavorites()
    bookingStore.loadBookings()
    journalStore.loadJournals()
  }
})

const favorites = computed(() => favoriteStore.favorites || [])
const intentBookings = computed(() => bookingStore.intentBookings || [])
const orderBookings = computed(() => bookingStore.orderBookings || [])
const journals = computed(() => journalStore.journals || [])

async function confirmRemoveFavorite(item) {
  const name = item?.name || '该收藏'
  if (!window.confirm(`确定删除「${name}」吗？`)) return
  await favoriteStore.removeFavorite(item.id)
}

async function confirmRemoveJournal(j) {
  const name = j?.title || '该日记'
  if (!window.confirm(`确定删除「${name}」吗？`)) return
  await journalStore.removeJournal(j.id)
}

async function confirmRemoveBooking(b) {
  const name = bookingTitle(b)
  if (!window.confirm(`确定删除「${name}」吗？`)) return
  await bookingStore.removeBooking(b.id)
}

function platformName(p) {
  return platformLabel(p)
}

function bookingTitle(b) {
  return b?.title || b?.keyword || (b?.source_name || b?.province ? `${b.source_name || b.province}` : '旅行链接')
}

function linkTypeLabel(linkType) {
  return linkType === 'product' ? '商品页' : '搜索入口'
}

function formatDate(iso) {
  if (!iso) return ''
  return String(iso).slice(0, 10)
}

function getBookingColor(b) {
  const platform = platformLabel(b?.platform)
  if (platform === '携程' || b?.platform === 'ctrip') return 'linear-gradient(135deg, #2D8CF0, #1A6FCC)'
  if (platform === '飞猪' || b?.platform === 'fliggy') return 'linear-gradient(135deg, #FF6B35, #E85A2A)'
  return 'linear-gradient(135deg, #0D6B5C, #1A8A7A)'
}

function bookingCover(b) {
  return resolveBookingCoverImage(b)
}

function getBookingCoverStyle(b) {
  const cover = bookingCover(b)
  if (cover) {
    return {
      backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 100%), url(${cover})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  return { background: getBookingColor(b) }
}

async function copyBookingUrl(b) {
  const url = b?.url
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    ui.showToast('链接已复制', 'success')
  } catch {
    window.prompt('复制下面的链接：', url)
  }
}

function openEditBooking(b) {
  editMode.value = 'edit'
  editBooking.value = b
  editForm.value = {
    title: b.title || '',
    url: b.url || '',
    note: b.note || ''
  }
  editError.value = ''
}

async function openUpgradeBooking(b) {
  editMode.value = 'upgrade'
  editBooking.value = b
  editForm.value = {
    title: b.title || '',
    url: '',
    note: b.note || ''
  }
  editError.value = ''
  await nextTick()
  editUrlInput.value?.focus()
}

function closeEditBooking() {
  editBooking.value = null
  editMode.value = 'edit'
  editError.value = ''
  editSaving.value = false
}

async function pasteUpgradeUrl() {
  try {
    if (!navigator.clipboard?.readText) {
      editError.value = '请手动粘贴商品页链接'
      return
    }
    const text = (await navigator.clipboard.readText()).trim()
    if (!text) {
      editError.value = '剪贴板为空'
      return
    }
    editForm.value.url = text
  } catch {
    editError.value = '无法读取剪贴板，请手动粘贴'
  }
}

async function saveEditBooking() {
  if (!editBooking.value) return
  const title = editForm.value.title.trim()
  const url = editForm.value.url.trim()
  const note = editForm.value.note.trim()
  if (!url) {
    editError.value = '链接不能为空'
    return
  }
  if (!/^https?:\/\//i.test(url) || !isAllowedBookingUrl(url)) {
    editError.value = '仅支持携程/飞猪等旅行平台链接'
    return
  }
  if (editMode.value === 'upgrade' && url === editBooking.value.url) {
    editError.value = '请粘贴商品页链接，不要继续使用搜索入口'
    return
  }
  editSaving.value = true
  editError.value = ''
  const patch = {
    title: title || null,
    url,
    note: note || null
  }
  if (editMode.value === 'upgrade' || url !== editBooking.value.url) {
    patch.linkType = 'product'
  }
  const result = await bookingStore.updateBooking(editBooking.value.id, patch)
  editSaving.value = false
  if (!result.ok) {
    editError.value = result.msg || '保存失败'
    ui.showToast(result.msg || '保存失败', 'error')
    return
  }
  ui.showToast(editMode.value === 'upgrade' ? '已升级为商品链接' : '已更新收藏', 'success')
  closeEditBooking()
}

function getAllSpots(plan) {
  if (!plan || !plan.daysList) return []
  const map = new Map()
  plan.daysList.forEach(day => {
    (day.spots || []).forEach(s => {
      const name = typeof s === 'string' ? s : s?.name
      if (name && !map.has(name)) map.set(name, typeof s === 'string' ? { name } : s)
    })
  })
  return Array.from(map.values())
}

function getPreviewTags(plan) {
  if (!plan || !plan.daysList) return []
  const seen = new Set()
  const tags = []
  for (const day of plan.daysList) {
    for (const h of day.highlights || []) {
      const label = String(h.label || h.name || '').trim()
      if (!label || seen.has(label)) continue
      seen.add(label)
      tags.push({ type: h.type || 'experience', label })
    }
  }
  if (tags.length) return tags
  return getAllSpots(plan).map((s) => ({ type: 'spot', label: s.name }))
}

function formatCities(plan) {
  if (!plan) return 1
  if (typeof plan.cities === 'number') return plan.cities
  if (Array.isArray(plan.cities)) return plan.cities.length || 1
  return 1
}

function formatTransport(transport) {
  if (!transport) return ''
  const periodMap = {
    morning: '上午',
    afternoon: '下午',
    evening: '晚间'
  }
  const prefMap = {
    smart: '智能推荐',
    drive: '驾车优先',
    transit: '公共交通优先',
    rail: '高铁/动车建议优先',
    flight: '飞机建议优先'
  }
  const dateText = transport.departureDate || '待定日期'
  const period = periodMap[transport.departurePeriod] || '灵活时段'
  const origin = transport.origin || '出发地'
  const pref = prefMap[transport.preference] || transport.preference || '智能推荐'
  return `${dateText} ${period}从${origin}出发，交通偏好：${pref}。`
}

function formatShortDate(iso) {
  if (!iso) return ''
  const parts = String(iso).split('-')
  if (parts.length < 3) return iso
  return `${Number(parts[1])}/${Number(parts[2])}`
}

function formatTemp(value) {
  if (value == null || value === '') return '—'
  return `${value}°`
}

function openPlanModal(item) {
  planModal.value = item
}

function getCardImage(item) {
  if (item.type === '行程' && item.plan_json?.heroImage) {
    return `url(${item.plan_json.heroImage})`
  }
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

function getJournalImage(j) {
  // 优先用生成封面（手账成图 / VOLO 视频首帧），其次第一张照片，最后品牌渐变。
  // cover_url / photos 存的是相对路径，本地 Vite 需拼后端 origin。
  const cover = resolveDisplayMediaUrl(j.cover_url)
  if (cover) return `url(${cover})`
  const first = Array.isArray(j.photos) ? resolveDisplayMediaUrl(j.photos[0]) : ''
  if (first) return `url(${first})`
  const image = resolveDisplayMediaUrl(j.image)
  if (image) return `url(${image})`
  if (j.color) return j.color
  return 'linear-gradient(135deg, #0D6B5C, #1A8A7A)'
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
  width: 26px; height: 26px; border-radius: 50%;
  border: none; background: rgba(0, 0, 0, 0.55); color: #fff;
  font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  opacity: 1; transition: background 0.2s; z-index: 2;
}
.masonry-del:hover { background: rgba(194, 59, 34, 0.9); }
.masonry-footer { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #8B8B9E; padding-top: 8px; border-top: 1px solid #F0EDE6; gap: 8px; }
.masonry-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.masonry-link { color: #0D6B5C; text-decoration: none; font-weight: 500; border: none; background: none; cursor: pointer; font-size: 11px; font-family: inherit; padding: 0; }
.masonry-link:hover { text-decoration: underline; }
.masonry-delete-btn {
  border: none; background: none; color: #C23B22; font-size: 11px; font-weight: 600;
  cursor: pointer; font-family: inherit; padding: 0;
}
.masonry-delete-btn:hover { text-decoration: underline; opacity: 0.85; }

.masonry-content { padding: 12px 14px; }
.masonry-title { font-size: 14px; font-weight: 600; color: #1A1A2E; margin: 0 0 4px; }
.masonry-desc { font-size: 12px; color: #5C5C6E; margin: 0 0 10px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.booking-meta { display: inline-block; margin-right: 10px; }
.booking-meta:last-child { margin-right: 0; }

.bookings-panel { display: flex; flex-direction: column; gap: 22px; }
.booking-section { display: flex; flex-direction: column; gap: 12px; }
.section-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 2px;
}
.section-title {
  margin: 0; font-size: 14px; font-weight: 700; color: #1A1A2E;
}
.section-count {
  font-size: 11px; padding: 2px 8px; border-radius: 999px;
  background: rgba(13, 107, 92, 0.1); color: #0D6B5C; font-weight: 600;
}
.empty-state.compact { padding: 24px 12px; }
.order-section .empty-state.compact {
  background: #fff; border: 1px dashed #E5E0D6; border-radius: 12px;
}
.link-type-pill {
  position: absolute; left: 8px; top: 8px;
  padding: 2px 8px; border-radius: 999px;
  background: rgba(0, 0, 0, 0.45); color: #fff;
  font-size: 10px; font-weight: 600;
}
.booking-image.has-cover .masonry-badge {
  background: rgba(255, 255, 255, 0.92);
}
.booking-image {
  background-repeat: no-repeat;
}
.booking-note {
  margin: 0 0 10px; font-size: 12px; color: #8B8B9E; line-height: 1.5;
}
.booking-footer { align-items: flex-start; gap: 8px; }
.booking-actions-wrap {
  flex-wrap: wrap; justify-content: flex-end; row-gap: 4px;
}
.booking-edit-card { max-width: 420px; }
.edit-hint {
  margin: 0 0 4px; font-size: 13px; color: #5C5C6E; line-height: 1.5;
}
.edit-form { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.edit-form label { font-size: 12px; color: #5C5C6E; font-weight: 600; }
.edit-form input,
.edit-url-row input {
  width: 100%; box-sizing: border-box;
  padding: 10px 12px; border: 1px solid #E5E0D6; border-radius: 10px;
  font-size: 14px; outline: none;
}
.edit-form input:focus,
.edit-url-row input:focus { border-color: #0D6B5C; }
.edit-url-row input.invalid { border-color: #C23B22; }
.edit-url-row { display: flex; gap: 8px; }
.edit-url-row input { flex: 1; min-width: 0; }
.edit-paste-btn {
  flex-shrink: 0; border: none; border-radius: 10px; padding: 0 12px;
  background: #E8F4F1; color: #0D6B5C; font-size: 13px; font-weight: 600; cursor: pointer;
}
.edit-error { margin: 0; color: #C23B22; font-size: 12px; }
.edit-ok { margin: 0; color: #0D6B5C; font-size: 12px; }
.edit-actions {
  display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px;
}
.edit-save-btn {
  border: none; border-radius: 10px; padding: 8px 16px;
  background: #1A3A2E; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
}
.edit-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.upgrade-link { color: #C23B22 !important; }
.masonry-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.masonry-tag {
  padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;
  border: 1px solid transparent; line-height: 1.3;
}
.masonry-tag.type-food { color: #9A5B16; background: #FFF6E8; border-color: #F0D7B0; }
.masonry-tag.type-culture { color: #2F4F8A; background: #EEF3FB; border-color: #C9D7F0; }
.masonry-tag.type-experience { color: #0D6B5C; background: #E8F5F1; border-color: #B9DDD4; }
.masonry-tag.type-vibe { color: #7A5A12; background: #FBF3DD; border-color: #E7D59A; }
.masonry-tag.type-spot { color: #3D5A80; background: #EEF2F7; border-color: #C5D0E0; }
.masonry-spots { display: flex; gap: 4px; margin-bottom: 10px; }
.mini-spot { width: 36px; height: 28px; border-radius: 4px; overflow: hidden; background: #F0EDE6; }
.mini-spot img { width: 100%; height: 100%; object-fit: cover; }
.mini-spot-name-only { width: auto; height: auto; max-width: 120px; padding: 4px 6px; background: #fff; border: 1px solid #F0EDE6; }
.mini-spot-name-only span { display: block; font-size: 10px; line-height: 1.25; color: #5C5C6E; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 行程详情弹窗 */
.plan-modal {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 10000; padding: 20px;
}
.plan-modal-card {
  background: #fff; border-radius: 16px; padding: 28px;
  max-width: 720px; width: 100%; max-height: 88vh; overflow-y: auto;
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
.modal-block { margin-bottom: 14px; padding: 12px 14px; background: #F7FBF9; border: 1px solid #E5E0D6; border-radius: 12px; }
.modal-block-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #0D6B5C; margin-bottom: 8px; }
.modal-block-text { margin: 0; font-size: 13px; line-height: 1.7; color: #3A3A4E; }
.modal-info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
.modal-info-card { padding: 12px; background: #fff; border: 1px solid #E5E0D6; border-radius: 10px; }
.modal-info-card .info-label { display: block; font-size: 11px; color: #8B8B9E; margin-bottom: 4px; }
.modal-info-card strong { font-size: 13px; color: #1A1A2E; font-weight: 600; line-height: 1.5; }
.modal-tips { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.8; color: #3A3A4E; }
.weather-loc { margin-left: auto; font-size: 12px; font-weight: 600; color: #5C5C6E; }
.weather-note { margin: 0 0 10px; font-size: 12px; line-height: 1.6; color: #5C5C6E; }
.weather-note.is-ref { color: #8A5A16; }
.weather-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 8px; }
.weather-chip {
  text-align: center; padding: 8px 6px; background: #fff; border: 1px solid #E5E0D6; border-radius: 10px;
  display: flex; flex-direction: column; gap: 2px;
}
.weather-chip.is-ref { border-color: #E7D59A; background: #FFFDF5; }
.w-day { font-size: 12px; font-weight: 700; color: #1A1A2E; }
.w-date { font-size: 11px; color: #8B8B9E; }
.w-sum { font-size: 12px; font-weight: 600; color: #0D6B5C; }
.w-temp { font-size: 11px; color: #5C5C6E; }
.days-head-title { margin-bottom: 12px; }
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
.modal-highlights { display: flex; flex-wrap: wrap; gap: 6px; }
.modal-highlight {
  padding: 4px 10px; border-radius: 14px; font-size: 12px; font-weight: 600;
  border: 1px solid transparent; line-height: 1.4;
}
.modal-highlight.type-food { color: #9A5B16; background: #FFF6E8; border-color: #F0D7B0; }
.modal-highlight.type-culture { color: #2F4F8A; background: #EEF3FB; border-color: #C9D7F0; }
.modal-highlight.type-experience { color: #0D6B5C; background: #E8F5F1; border-color: #B9DDD4; }
.modal-highlight.type-vibe { color: #7A5A12; background: #FBF3DD; border-color: #E7D59A; }
.modal-highlight.type-spot { color: #3D5A80; background: #EEF2F7; border-color: #C5D0E0; }
.modal-spots { display: flex; gap: 8px; flex-wrap: wrap; }
.modal-spot {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 10px 4px 4px; background: #F8F6F0; border-radius: 8px;
  border: 1px solid #F0EDE6;
}
.modal-spot img { width: 28px; height: 28px; border-radius: 4px; object-fit: cover; }
.modal-spot span { font-size: 12px; color: #5C5C6E; }

@media (max-width: 640px) {
  .modal-info-row { grid-template-columns: 1fr; }
  .weather-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

/* 抽屉动画 */
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.25s; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }

.drawer-slide-enter-active, .drawer-slide-leave-active { transition: transform 0.3s ease; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
