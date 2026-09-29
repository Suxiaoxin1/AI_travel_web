<template>
  <!-- 回站确认：双路径保存搜索入口 / 粘贴商品链接 -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showPanel" class="modal-mask" @click.self="dismissPanel">
        <div class="modal-card">
          <h3>保存到「我的预定」</h3>
          <p class="modal-desc">
            您刚在 <strong>{{ platformText }}</strong> 查看了
            「{{ pending.sourceName || pending.province || '目的地' }}」的
            <span class="keyword">{{ pending.keyword }}</span>。
            可先收藏本次搜索入口，或粘贴具体商品页链接以便下次直达。
          </p>

          <div class="form-group">
            <label>标题</label>
            <input v-model="form.title" type="text" maxlength="255" placeholder="列表中显示的名称" />
          </div>

          <div class="form-group">
            <label>备注（可选）</label>
            <input v-model="form.note" type="text" maxlength="500" placeholder="例如：想看早场 / 含接驳" />
          </div>

          <div class="path-block">
            <div class="path-label">方式一：保存搜索入口</div>
            <p class="path-hint">使用刚才跳转的搜索页，一键收藏（可稍后在列表升级为商品链接）。</p>
            <button class="btn-confirm btn-block" :disabled="saving" @click="saveSearchLink">
              {{ saving && saveMode === 'search' ? '保存中…' : '保存搜索入口' }}
            </button>
          </div>

          <div class="path-divider"><span>或</span></div>

          <div class="path-block">
            <div class="path-label">方式二：粘贴商品链接</div>
            <p class="path-hint">在携程/飞猪打开商品页后复制地址栏链接，粘贴到下方（手机可长按粘贴）。</p>
            <div class="url-row">
              <input
                v-model="form.productUrl"
                type="url"
                placeholder="https://… 商品页链接"
                :class="{ invalid: !!urlError && form.productUrl.trim(), valid: urlOk }"
                @keydown.enter.prevent="saveProductLink"
              />
              <button type="button" class="btn-secondary" :disabled="saving" @click="pasteFromClipboard">
                剪贴板
              </button>
            </div>
            <p v-if="urlError" class="field-error">{{ urlError }}</p>
            <p v-else-if="urlOk" class="field-ok">链接可用，可保存为商品页</p>
            <button
              class="btn-confirm btn-block"
              :disabled="saving || !urlOk"
              @click="saveProductLink"
            >
              {{ saving && saveMode === 'product' ? '保存中…' : '保存商品链接' }}
            </button>
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" :disabled="saving" @click="discardPending">放弃本次</button>
            <button class="btn-ghost" :disabled="saving" @click="dismissPanel">稍后再说</button>
          </div>
          <p v-if="statusMsg" class="status-msg" :class="statusType">{{ statusMsg }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- 悬浮入口：pending 仍在且弹窗关闭时显示来源 -->
  <Teleport to="body">
    <Transition name="fab-slide">
      <button
        v-if="showFab"
        class="booking-fab"
        :title="fabTitle"
        @click="openPanelFromFab"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        <span class="fab-text">
          <strong>保存链接</strong>
          <em>{{ fabSource }}</em>
        </span>
      </button>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useBookingStore } from '../stores/bookingStore.js'
import { useUiStore } from '../stores/uiStore.js'
import {
  clearPendingBooking,
  defaultBookingTitle,
  isAllowedBookingUrl,
  markPendingAskDismissed,
  normalizePlatform,
  platformLabel,
  readPendingBooking
} from '../utils/bookingLinks.js'

const bookingStore = useBookingStore()
const ui = useUiStore()

const showPanel = ref(false)
const showFab = ref(false)
const saving = ref(false)
const saveMode = ref('')
const urlError = ref('')
const statusMsg = ref('')
const statusType = ref('ok')

const pending = reactive({
  platform: '',
  province: '',
  sourceName: '',
  sourceType: 'province',
  keyword: '',
  url: '',
  askDismissed: false
})

const form = reactive({
  title: '',
  note: '',
  productUrl: ''
})

const platformText = computed(() => platformLabel(pending.platform))

const fabSource = computed(() => {
  const place = pending.sourceName || pending.province || '旅行'
  const plat = platformLabel(pending.platform)
  const text = `${place}·${plat}`
  return text.length > 14 ? `${text.slice(0, 13)}…` : text
})

const fabTitle = computed(() => {
  const place = pending.sourceName || pending.province || '目的地'
  return `保存「${place}」在${platformLabel(pending.platform)}的浏览链接`
})

const urlOk = computed(() => {
  const text = form.productUrl.trim()
  return !!text && !validateProductUrl(text)
})

watch(() => form.productUrl, (value) => {
  const text = String(value || '').trim()
  if (!text) {
    urlError.value = ''
    return
  }
  urlError.value = validateProductUrl(text)
})

function syncPendingFromStorage() {
  const data = readPendingBooking()
  if (!data) {
    Object.assign(pending, {
      platform: '',
      province: '',
      sourceName: '',
      sourceType: 'province',
      keyword: '',
      url: '',
      askDismissed: false
    })
    return null
  }
  Object.assign(pending, {
    platform: normalizePlatform(data.platform, data.url),
    province: data.province || '',
    sourceName: data.sourceName || data.province || '',
    sourceType: data.sourceType || 'province',
    keyword: data.keyword || '',
    url: data.url || '',
    askDismissed: !!data.askDismissed
  })
  return data
}

function fillFormDefaults() {
  form.title = defaultBookingTitle(pending.sourceName || pending.province, pending.platform)
  form.note = ''
  form.productUrl = ''
  urlError.value = ''
  statusMsg.value = ''
}

function updateFab() {
  const data = syncPendingFromStorage()
  showFab.value = !!data && !showPanel.value
}

function openPanel() {
  if (!syncPendingFromStorage()) {
    showPanel.value = false
    updateFab()
    return
  }
  fillFormDefaults()
  showPanel.value = true
  updateFab()
}

function openPanelFromFab() {
  openPanel()
}

function dismissPanel() {
  markPendingAskDismissed()
  showPanel.value = false
  updateFab()
}

function discardPending() {
  clearPendingBooking()
  showPanel.value = false
  saving.value = false
  updateFab()
}

function autoOpenOnce() {
  const data = syncPendingFromStorage()
  if (!data || data.askDismissed || showPanel.value) {
    updateFab()
    return
  }
  markPendingAskDismissed()
  openPanel()
}

function onVisibilityChange() {
  if (document.visibilityState !== 'visible') return
  autoOpenOnce()
}

async function pasteFromClipboard() {
  urlError.value = ''
  try {
    if (!navigator.clipboard?.readText) {
      urlError.value = '当前浏览器不支持读取剪贴板，请手动粘贴'
      return
    }
    const text = (await navigator.clipboard.readText()).trim()
    if (!text) {
      urlError.value = '剪贴板为空，请先复制商品页链接'
      return
    }
    form.productUrl = text
    urlError.value = validateProductUrl(text)
  } catch {
    urlError.value = '无法读取剪贴板，请手动长按粘贴'
  }
}

function validateProductUrl(url) {
  const text = String(url || '').trim()
  if (!text) return '请粘贴商品页链接'
  if (!/^https?:\/\//i.test(text)) return '请粘贴以 http(s):// 开头的完整链接'
  if (!isAllowedBookingUrl(text)) return '仅支持携程/飞猪等旅行平台商品链接'
  return ''
}

async function persistIntent({ url, linkType }) {
  saving.value = true
  statusMsg.value = ''
  try {
    const result = await bookingStore.addBooking({
      url,
      kind: 'intent',
      title: form.title.trim() || defaultBookingTitle(pending.sourceName || pending.province, pending.platform),
      note: form.note.trim() || null,
      sourceType: pending.sourceType || 'province',
      sourceName: pending.sourceName || pending.province || '',
      linkType,
      province: pending.province || pending.sourceName || '',
      keyword: pending.keyword || '',
      platform: pending.platform
    })
    if (!result.ok) {
      statusType.value = 'err'
      statusMsg.value = result.msg || '保存失败'
      ui.showToast(result.msg || '保存失败', 'error')
      return false
    }
    clearPendingBooking()
    showPanel.value = false
    statusType.value = 'ok'
    statusMsg.value = ''
    updateFab()
    const msg = result.deduped
      ? '已在收藏中，已更新信息'
      : (linkType === 'product' ? '已保存商品链接' : '已保存搜索入口')
    ui.showToast(msg, 'success')
    ui.openDrawer('bookings')
    return true
  } finally {
    saving.value = false
    saveMode.value = ''
  }
}

async function saveSearchLink() {
  if (!pending.url) {
    statusType.value = 'err'
    statusMsg.value = '缺少搜索链接，请重新从地图跳转'
    ui.showToast(statusMsg.value, 'error')
    return
  }
  if (!isAllowedBookingUrl(pending.url)) {
    statusType.value = 'err'
    statusMsg.value = '搜索链接无效，请改用粘贴商品链接'
    ui.showToast(statusMsg.value, 'error')
    return
  }
  saveMode.value = 'search'
  await persistIntent({ url: pending.url, linkType: 'search' })
}

async function saveProductLink() {
  urlError.value = validateProductUrl(form.productUrl)
  if (urlError.value) return
  saveMode.value = 'product'
  await persistIntent({
    url: form.productUrl.trim(),
    linkType: 'product'
  })
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  if (document.visibilityState === 'visible') {
    autoOpenOnce()
  } else {
    updateFab()
  }
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(26, 26, 46, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-card {
  background: #fff;
  border-radius: 20px;
  padding: 28px;
  width: 100%;
  max-width: 460px;
  max-height: min(90vh, 720px);
  overflow: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-card h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 12px;
}

.modal-desc {
  font-size: 14px;
  color: #5c5c6e;
  line-height: 1.6;
  margin-bottom: 18px;
}

.modal-desc strong {
  color: #0d6b5c;
}

.keyword {
  color: #c23b22;
  font-weight: 600;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label,
.path-label {
  display: block;
  font-size: 13px;
  color: #5c5c6e;
  margin-bottom: 6px;
  font-weight: 600;
}

.form-group input,
.url-row input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e5e0d6;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus,
.url-row input:focus {
  border-color: #0d6b5c;
}

.url-row input.invalid {
  border-color: #c23b22;
}

.url-row input.valid {
  border-color: #0d6b5c;
}

.path-block {
  margin-top: 8px;
}

.path-hint {
  font-size: 12px;
  color: #8b8b9e;
  line-height: 1.5;
  margin: 0 0 10px;
}

.path-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 0;
  color: #b8b8c5;
  font-size: 12px;
}

.path-divider::before,
.path-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #ebe6de;
}

.url-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.url-row input {
  flex: 1;
  min-width: 0;
}

.field-error {
  color: #c23b22;
  font-size: 12px;
  margin: 0 0 8px;
}

.field-ok {
  color: #0d6b5c;
  font-size: 12px;
  margin: 0 0 8px;
}

.status-msg {
  margin: 12px 0 0;
  font-size: 13px;
}

.status-msg.ok {
  color: #0d6b5c;
}

.status-msg.err {
  color: #c23b22;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-cancel,
.btn-confirm,
.btn-secondary,
.btn-ghost {
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-block {
  width: 100%;
  margin-top: 4px;
}

.btn-cancel {
  background: #f0ede6;
  color: #5c5c6e;
}

.btn-cancel:hover:not(:disabled) {
  background: #e5e0d6;
}

.btn-confirm {
  background: #1a3a2e;
  color: #fff;
}

.btn-confirm:hover:not(:disabled) {
  background: #0d6b5c;
}

.btn-confirm:disabled,
.btn-secondary:disabled,
.btn-ghost:disabled,
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  flex-shrink: 0;
  background: #e8f4f1;
  color: #0d6b5c;
}

.btn-secondary:hover:not(:disabled) {
  background: #d5ebe5;
}

.btn-ghost {
  background: transparent;
  color: #5c5c6e;
  border: 1px solid #e5e0d6;
}

.btn-ghost:hover:not(:disabled) {
  background: #f7f4ef;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.booking-fab {
  position: fixed;
  right: 24px;
  bottom: 100px;
  z-index: 900;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: none;
  border-radius: 28px;
  background: linear-gradient(135deg, #0d6b5c 0%, #1a8a7a 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(13, 107, 92, 0.35);
  font-family: 'Noto Sans SC', sans-serif;
  transition: all 0.25s ease;
  max-width: min(72vw, 260px);
}

.booking-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 26px rgba(13, 107, 92, 0.45);
}

.fab-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  min-width: 0;
  line-height: 1.2;
}

.fab-text strong {
  font-size: 13px;
  font-weight: 700;
}

.fab-text em {
  font-style: normal;
  font-size: 11px;
  font-weight: 500;
  opacity: 0.88;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fab-slide-enter-active,
.fab-slide-leave-active {
  transition: all 0.3s ease;
}

.fab-slide-enter-from,
.fab-slide-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@media (max-width: 640px) {
  .booking-fab {
    right: 16px;
    bottom: 80px;
    padding: 10px 12px;
  }

  .fab-text em {
    max-width: 120px;
  }

  .url-row {
    flex-direction: column;
  }
}
</style>
