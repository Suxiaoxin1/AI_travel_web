<template>
  <!-- 询问弹窗：是否添加刚才的预定 -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showAsk" class="modal-mask" @click.self="cancelAsk">
        <div class="modal-card">
          <h3>检测到您查看了旅游产品</h3>
          <p class="modal-desc">
            您刚刚在 <strong>{{ pending.platform }}</strong> 查看了「{{ pending.province }}」的
            <span class="keyword">{{ pending.keyword }}</span>，是否上传订单截图添加到「我的预定」？
          </p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="cancelAsk">暂不添加</button>
            <button class="btn-confirm" @click="confirmAsk">确定添加</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- 上传截图弹窗 -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showUpload" class="modal-mask" @click.self="cancelUpload">
        <div class="modal-card">
          <h3>上传订单截图</h3>
          <p class="modal-desc">请上传携程/飞猪的订单详情页截图，系统将自动识别订单信息。</p>
          <div class="upload-area" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
            <div v-if="previewUrl" class="preview-box">
              <img :src="previewUrl" alt="订单截图预览" />
            </div>
            <div v-else class="upload-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#B8C5B0" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
              <span>点击或拖拽上传订单截图</span>
            </div>
            <input ref="fileInput" type="file" accept="image/*" hidden @change="handleFileSelect" />
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="cancelUpload">取消</button>
            <button class="btn-confirm" :disabled="!selectedFile" @click="startOcr">开始识别</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- OCR 结果确认弹窗 -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showResult" class="modal-mask" @click.self="cancelResult">
        <div class="modal-card result-card">
          <h3>识别结果</h3>
          <p class="modal-desc">请核对识别结果，如有误可手动修改。</p>
          <div class="form-group">
            <label>平台</label>
            <input v-model="form.platform" type="text" />
          </div>
          <div class="form-group">
            <label>省份/目的地</label>
            <input v-model="form.province" type="text" />
          </div>
          <div class="form-group">
            <label>订单号</label>
            <input v-model="form.orderNo" type="text" placeholder="如：CT12345678" />
          </div>
          <div class="form-group">
            <label>产品名称</label>
            <input v-model="form.productName" type="text" />
          </div>
          <div class="form-group">
            <label>出行日期</label>
            <input v-model="form.travelDate" type="date" />
          </div>
          <div class="form-group">
            <label>金额（元）</label>
            <input v-model="form.amount" type="number" />
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="cancelResult">重新上传</button>
            <button class="btn-confirm" @click="saveBooking">确认添加到我的预定</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- 浮动入口：存在待确认预定时显示，方便用户随时上传截图 -->
  <Teleport to="body">
    <Transition name="fab-slide">
      <button
        v-if="showFab"
        class="booking-fab"
        @click="openUploadFromFab"
        title="已完成下单？上传截图保存到「我的预定」"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span>上传订单截图</span>
      </button>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useBookingStore } from '../stores/bookingStore.js'

const bookingStore = useBookingStore()

const showAsk = ref(false)
const showUpload = ref(false)
const showResult = ref(false)
const showFab = ref(false)
const pending = reactive({ platform: '', province: '', keyword: '', url: '' })

const selectedFile = ref(null)
const previewUrl = ref('')
const fileInput = ref(null)

const form = reactive({
  platform: '',
  province: '',
  orderNo: '',
  productName: '',
  travelDate: '',
  amount: ''
})

let isRecognizing = false

function checkPendingBooking() {
  const raw = localStorage.getItem('pendingBooking')
  if (!raw) {
    showFab.value = false
    return false
  }
  try {
    const data = JSON.parse(raw)
    // 超过 30 分钟的待确认记录自动过期
    if (Date.now() - data.createdAt > 30 * 60 * 1000) {
      localStorage.removeItem('pendingBooking')
      showFab.value = false
      return false
    }
    Object.assign(pending, data)
    return true
  } catch {
    localStorage.removeItem('pendingBooking')
    showFab.value = false
    return false
  }
}

function updateFab() {
  // 任意弹窗打开时不显示浮动入口
  showFab.value = checkPendingBooking() && !showAsk.value && !showUpload.value && !showResult.value
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible' && checkPendingBooking()) {
    showAsk.value = true
  }
  updateFab()
}

function cancelAsk() {
  showAsk.value = false
  localStorage.removeItem('pendingBooking')
  updateFab()
}

function confirmAsk() {
  showAsk.value = false
  showUpload.value = true
  updateFab()
}

function openUploadFromFab() {
  showUpload.value = true
  updateFab()
}

function triggerUpload() {
  fileInput.value?.click()
}

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (file) setFile(file)
}

function handleDrop(e) {
  const file = e.dataTransfer.files[0]
  if (file) setFile(file)
}

function setFile(file) {
  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => { previewUrl.value = ev.target.result }
  reader.readAsDataURL(file)
}

function cancelUpload() {
  showUpload.value = false
  selectedFile.value = null
  previewUrl.value = ''
  updateFab()
}

// 模拟 OCR 识别：从 pending 信息生成基础数据
// 真实项目中可替换为 Tesseract.js 或后端 OCR 接口
async function startOcr() {
  if (!selectedFile.value || isRecognizing) return
  isRecognizing = true

  // 这里模拟识别耗时
  await new Promise(resolve => setTimeout(resolve, 800))

  // 基于 pending 信息填充表单（真实 OCR 应解析图片内容）
  form.platform = pending.platform
  form.province = pending.province
  form.productName = pending.keyword
  form.orderNo = generateOrderNo(pending.platform)
  form.travelDate = formatDate(new Date())
  form.amount = ''

  isRecognizing = false
  showUpload.value = false
  showResult.value = true
}

function generateOrderNo(platform) {
  const prefix = platform === '携程' ? 'CT' : (platform === '飞猪' ? 'FZ' : 'BK')
  const random = Math.floor(Math.random() * 90000000) + 10000000
  return `${prefix}${random}`
}

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function cancelResult() {
  showResult.value = false
  selectedFile.value = null
  previewUrl.value = ''
  showUpload.value = true
  updateFab()
}

async function saveBooking() {
  const result = await bookingStore.addBooking({
    province: form.province,
    keyword: form.productName || pending.keyword,
    url: pending.url,
    platform: form.platform,
    orderNo: form.orderNo,
    travelDate: form.travelDate,
    amount: form.amount ? Number(form.amount) : null
  })
  if (result.ok) {
    localStorage.removeItem('pendingBooking')
    showResult.value = false
    selectedFile.value = null
    previewUrl.value = ''
    updateFab()
    alert('已添加到「我的预定」')
  } else {
    alert(result.msg || '添加失败')
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  // 页面加载时如果存在待确认记录也检查一下
  if (document.visibilityState === 'visible' && checkPendingBooking()) {
    showAsk.value = true
  }
  updateFab()
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
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.result-card {
  max-width: 460px;
}

.modal-card h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1A1A2E;
  margin: 0 0 12px;
}

.modal-desc {
  font-size: 14px;
  color: #5C5C6E;
  line-height: 1.6;
  margin-bottom: 20px;
}

.modal-desc strong {
  color: #0D6B5C;
}

.keyword {
  color: #C23B22;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-cancel {
  background: #F0EDE6;
  color: #5C5C6E;
}

.btn-cancel:hover {
  background: #E5E0D6;
}

.btn-confirm {
  background: #1A3A2E;
  color: #fff;
}

.btn-confirm:hover:not(:disabled) {
  background: #0D6B5C;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-area {
  border: 2px dashed #D4C8B8;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: #0D6B5C;
  background: rgba(13,107,92,0.02);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #8B8B9E;
  font-size: 14px;
}

.preview-box img {
  max-width: 100%;
  max-height: 240px;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: #5C5C6E;
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #E5E0D6;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: #0D6B5C;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 浮动上传入口 */
.booking-fab {
  position: fixed;
  right: 24px;
  bottom: 100px;
  z-index: 900;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border: none;
  border-radius: 28px;
  background: linear-gradient(135deg, #0D6B5C 0%, #1A8A7A 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(13, 107, 92, 0.35);
  font-family: 'Noto Sans SC', sans-serif;
  transition: all 0.25s ease;
}

.booking-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 26px rgba(13, 107, 92, 0.45);
}

.booking-fab svg {
  flex-shrink: 0;
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
    padding: 10px 14px;
    font-size: 13px;
  }
  .booking-fab span {
    display: none;
  }
}
</style>
