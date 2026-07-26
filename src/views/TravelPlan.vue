<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">旅行规划</h1>
      <p class="page-subtitle" v-if="prefLoaded && prefData?.mbti">已加载你的旅行偏好报告 — {{ prefPersona }}（{{ prefData.mbti }}）</p>
      <p class="page-subtitle" v-else-if="prefLoaded">已加载你的旅行偏好报告 — {{ prefPersona }}</p>
      <p class="page-subtitle" v-else>告诉我你的想法，AI 为你定制专属旅程</p>
    </div>
    <div class="plan-layout">
      <!-- 左侧：输入区 -->
      <div class="input-card">
        <div class="pref-banner" v-if="prefData">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A84B" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span>基于你的偏好报告：<strong>{{ prefData.persona?.title || '探索者' }}</strong><span v-if="prefData.mbti" class="pref-mbti">{{ prefData.mbti }}</span></span>
          <button class="pref-dismiss" @click="dismissPref">✕</button>
        </div>
        <div class="input-header">
          <h2 class="input-title">告诉我你的旅行想法</h2>
          <span class="input-hint">支持文字、图片、语音多种方式</span>
        </div>

        <!-- 输入模式切换 -->
        <div class="mode-tabs">
          <button v-for="tab in tabs" :key="tab.key" :class="['mode-tab', { active: currentTab === tab.key }]" @click="currentTab = tab.key">
            <span class="tab-icon" v-html="tab.icon"></span>
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- 文字输入 -->
        <div v-show="currentTab === 'text'" class="input-body">
          <div class="textarea-wrapper">
            <textarea v-model="inputText" class="text-input" placeholder="描述你想要的旅行，比如：&#10;我想去海边，预算3000元左右，玩5天，喜欢潜水" rows="6"></textarea>
            <button :class="['mic-btn', { recording: isRecording }]" @click="toggleRecord" :disabled="!isVoiceSupported" title="语音输入">
              <svg v-if="!isRecording" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D6B5C" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C23B22" stroke-width="2"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            </button>
          </div>
          <div class="input-toolbar">
            <span class="char-count">{{ inputText.length }}/500</span>
            <span v-if="recordError" class="voice-status error">{{ recordError }}</span>
            <span v-else-if="isRecording" class="voice-status recording">正在识别…</span>
            <button class="clear-btn" @click="inputText = ''">清空</button>
          </div>
        </div>

        <!-- 图片上传 -->
        <div v-show="currentTab === 'image'" class="input-body">
          <div class="upload-zone" :class="{ dragging: isDragging }" @dragover.prevent="isDragging = true" @dragleave="isDragging = false" @drop.prevent="handleDrop" @click="triggerFileInput">
            <div class="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#B8C5B0" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            </div>
            <p class="upload-text">点击或拖拽上传灵感图片</p>
            <p class="upload-hint">支持 JPG、PNG、GIF 格式，最多 5 张</p>
            <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="handleFiles" />
          </div>
          <div class="image-preview-list" v-if="images.length">
            <div v-for="(img, i) in images" :key="i" class="preview-item">
              <img :src="img" alt="" />
              <button class="preview-remove" @click.stop="images.splice(i, 1)">×</button>
            </div>
          </div>
        </div>

        <!-- 旅行风格 -->
        <div class="style-section">
          <label class="section-label">旅行风格</label>
          <div class="style-options">
            <button v-for="s in travelStyles" :key="s.key" :class="['style-chip', { active: form.style === s.key }]" @click="form.style = s.key">
              <span class="style-icon" v-html="s.icon"></span>
              <span>{{ s.label }}</span>
            </button>
          </div>
        </div>

        <!-- 人员组合 -->
        <div class="people-section">
          <label class="section-label">出行人员</label>
          <div class="people-options">
            <button v-for="p in peopleTypes" :key="p.key" :class="['people-chip', { active: form.people === p.key }]" @click="form.people = p.key">
              <span class="people-icon" v-html="p.icon"></span>
              <span>{{ p.label }}</span>
            </button>
          </div>
        </div>

        <!-- 附加选项 -->
        <div class="extra-options">
          <div class="option-group">
            <label>出行时间</label>
            <input type="date" v-model="form.startDate" class="option-input" />
          </div>
          <div class="option-group">
            <label>预算范围</label>
            <select v-model="form.budget" class="option-input">
              <option value="">不限</option>
              <option>1000元以内</option>
              <option>1000-3000元</option>
              <option>3000-5000元</option>
              <option>5000元以上</option>
            </select>
          </div>
          <div class="option-group" style="grid-column: 1 / -1;">
            <label>旅行天数：<span class="day-val">{{ form.days }} 天</span></label>
            <input type="range" min="1" max="30" v-model.number="form.days" class="range-slider" />
          </div>
        </div>

        <button class="submit-btn" @click="generatePlan" :disabled="isGenerating">
          <svg v-if="!isGenerating" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          <svg v-else class="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/><polyline points="21 3 21 9 15 9"/></svg>
          {{ isGenerating ? 'AI 规划中…' : '开始规划' }}
        </button>
      </div>

      <!-- 右侧：结果区 -->
      <div class="result-card">
        <div class="result-header">
          <h2 class="result-title">AI 行程推荐</h2>
          <span class="result-hint">根据你的偏好智能生成</span>
        </div>
        <div class="result-body">
          <!-- 加载中骨架屏 -->
          <div v-if="isGenerating" class="skeleton-wrap">
            <div class="skel-summary">
              <div v-for="i in 3" :key="i" class="skel-block lg"></div>
            </div>
            <div v-for="i in 4" :key="i" class="skel-day">
              <div class="skel-dot"></div>
              <div class="skel-content">
                <div class="skel-block md"></div>
                <div class="skel-block sm"></div>
                <div class="skel-chip-row">
                  <div v-for="j in 3" :key="j" class="skel-chip"></div>
                </div>
              </div>
            </div>
            <p class="skel-tip">AI 正在为你规划专属行程…</p>
          </div>

          <!-- 错误状态 -->
          <div v-else-if="errorMsg" class="error-wrap">
            <div class="error-icon">⚠️</div>
            <h3 class="error-title">生成失败</h3>
            <p class="error-desc">{{ errorMsg }}</p>
            <button class="error-retry" @click="generatePlan">重新生成</button>
          </div>

          <!-- 正常结果 -->
          <div v-else-if="planGenerated" class="result-content">
            <!-- 思考过程 -->
            <details v-if="thinkingContent" class="thinking-section" :open="false">
              <summary class="thinking-summary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                AI 思考过程
                <span class="thinking-toggle">点击展开</span>
              </summary>
              <div class="thinking-content">{{ thinkingContent }}</div>
            </details>

            <!-- JSON 解析失败时的 Markdown 回退渲染 -->
            <div v-if="rawContent && (!plan.daysList || plan.daysList.length === 0)" class="markdown-fallback" v-html="renderMarkdown(rawContent)"></div>
            <!-- 顶部推荐目的地卡片 -->
            <div v-if="plan.heroImage" class="result-hero">
              <img :src="plan.heroImage" :alt="plan.destination" class="hero-img" />
              <div class="hero-overlay">
                <h3 class="hero-dest">{{ plan.destination }}</h3>
                <div class="hero-tags">
                  <span class="hero-tag" v-for="t in plan.heroTags" :key="t">{{ t }}</span>
                </div>
              </div>
            </div>
            <!-- 推荐理由 -->
            <div v-if="plan.reason" class="reason-card">
              <div class="reason-head">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A84B" stroke-width="2"><path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2Z"/></svg>
                <span>推荐理由</span>
              </div>
              <p class="reason-text">{{ plan.reason }}</p>
            </div>
            <!-- 关键信息（最佳季节/预算） -->
            <div v-if="plan.bestSeason || plan.estimateCost" class="info-row">
              <div v-if="plan.bestSeason" class="info-card">
                <span class="info-icon">📅</span>
                <div>
                  <span class="info-label">最佳季节</span>
                  <span class="info-value">{{ plan.bestSeason }}</span>
                </div>
              </div>
              <div v-if="plan.estimateCost" class="info-card">
                <span class="info-icon">💰</span>
                <div>
                  <span class="info-label">预估费用</span>
                  <span class="info-value">{{ plan.estimateCost }}</span>
                </div>
              </div>
            </div>
            <!-- 住宿建议 -->
            <div v-if="plan.hotel" class="tip-card">
              <div class="tip-head">
                <span class="tip-icon">🏨</span>
                <span>住宿建议</span>
              </div>
              <p class="tip-text">{{ plan.hotel }}</p>
            </div>
            <!-- 旅行贴士 -->
            <div v-if="plan.tips && plan.tips.length" class="tip-card">
              <div class="tip-head">
                <span class="tip-icon">💡</span>
                <span>旅行贴士</span>
              </div>
              <ul class="tip-list">
                <li v-for="(t, i) in plan.tips" :key="i">{{ t }}</li>
              </ul>
            </div>
            <!-- 每日行程 -->
            <div v-if="plan.daysList && plan.daysList.length" class="days-section">
              <h4 class="days-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D6B5C" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                每日行程安排
              </h4>
              <div v-for="(day, i) in plan.daysList" :key="i" class="day-card">
                <div class="day-badge">Day {{ i + 1 }}</div>
                <div class="day-body">
                  <h5 class="day-title">{{ day.title }}</h5>
                  <p class="day-desc">{{ day.desc }}</p>
                  <div v-if="day.spots && day.spots.length" class="day-spots">
                    <span v-for="(s, j) in day.spots" :key="j" class="day-spot">{{ s.name || s }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="result-actions">
              <button class="action-btn primary" @click="savePlan">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                保存到我的行程
              </button>
              <button class="action-btn" @click="copyPlan">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                复制行程
              </button>
              <button class="action-btn" @click="generatePlan">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                重新生成
              </button>
            </div>
          </div>

          <!-- 占位提示 -->
          <div v-else class="result-placeholder">
            <div class="placeholder-visual">
              <div class="pv-ring pv-ring-1"></div>
              <div class="pv-ring pv-ring-2"></div>
              <div class="pv-ring pv-ring-3"></div>
              <div class="pv-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4C8B8" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
            </div>
            <p class="placeholder-title">准备好了吗？</p>
            <p class="placeholder-desc">在左侧输入你的旅行想法<br/>AI 将为你生成专属行程</p>
          </div>
        </div>
      </div>
    </div>
    <div v-if="actionToast" class="action-toast" :class="actionToast.type">{{ actionToast.text }}</div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { chat, chatWithVision } from '../utils/agnesApi.js'
import { getSpotImageByName } from '../data/provinces.js'
import { useUiStore } from '../stores/uiStore.js'
import { useAuthStore } from '../stores/authStore.js'
import { usePlanStore } from '../stores/planStore.js'
import { useFavoriteStore } from '../stores/favoriteStore.js'

const router = useRouter()
const ui = useUiStore()
const authStore = useAuthStore()
const planStore = usePlanStore()
const favoriteStore = useFavoriteStore()

// 加载已保存的偏好报告
const prefData = ref(null)
const prefLoaded = ref(false)
const prefPersona = ref('')

onMounted(() => {
  try {
    const saved = localStorage.getItem('travelPreference')
    if (saved) {
      prefData.value = JSON.parse(saved)
      prefLoaded.value = true
      prefPersona.value = prefData.value.persona?.title || '探索者'
    }
  } catch (e) { /* ignore */ }

  // 读取出行偏好页面传来的报告文本，填入文本框
  const prefsText = sessionStorage.getItem('travelPrefsText')
  if (prefsText) {
    inputText.value = prefsText
    sessionStorage.removeItem('travelPrefsText') // 用完即删，避免重复填入
  }

  // 检测浏览器是否支持语音识别
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (SR) {
    isVoiceSupported.value = true
    console.log('[语音识别] 浏览器支持 SpeechRecognition')
  } else {
    console.error('[语音识别] 浏览器不支持 SpeechRecognition')
  }
})

function dismissPref() {
  prefData.value = null
  prefLoaded.value = false
  localStorage.removeItem('travelPreference')
}

const tabs = [
  { key: 'text', label: '文字描述', icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>` },
  { key: 'image', label: '上传图片', icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>` }
]

const currentTab = ref('text')
const inputText = ref('')
const images = ref([])
const isDragging = ref(false)
const fileInput = ref(null)
const isRecording = ref(false)
const recognition = ref(null)
const isVoiceSupported = ref(false)

// 语音识别过程中的临时状态
const recordBaseText = ref('')
const recordFinalText = ref('')
const recordInterimText = ref('')
const recordError = ref('')

const form = reactive({
  startDate: '',
  budget: '',
  days: 7,
  style: '',
  people: ''
})

const travelStyles = [
  { key: 'relax', label: '悠闲度假', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>` },
  { key: 'adventure', label: '冒险探索', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>` },
  { key: 'culture', label: '文化古迹', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>` },
  { key: 'food', label: '美食之旅', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>` },
  { key: 'nature', label: '自然风光', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21l4-10 4 10"/><path d="M2 21l6-14 3.5 7"/><path d="M14.5 14L18 7l4 1"/></svg>` },
  { key: 'photo', label: '摄影采风', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>` }
]

const peopleTypes = [
  { key: 'solo', label: '独自出行', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
  { key: 'couple', label: '情侣双人', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>` },
  { key: 'family', label: '家庭亲子', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
  { key: 'friends', label: '好友结伴', icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` }
]

function triggerFileInput() { fileInput.value.click() }

function handleFiles(e) {
  const files = Array.from(e.target.files)
  files.slice(0, 5 - images.value.length).forEach(file => {
    const reader = new FileReader()
    reader.onload = (ev) => images.value.push(ev.target.result)
    reader.readAsDataURL(file)
  })
}

function handleDrop(e) {
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
  files.slice(0, 5 - images.value.length).forEach(file => {
    const reader = new FileReader()
    reader.onload = (ev) => images.value.push(ev.target.result)
    reader.readAsDataURL(file)
  })
  isDragging.value = false
}

function toggleRecord() {
  if (!isVoiceSupported.value) {
    recordError.value = '当前浏览器不支持语音识别'
    return
  }
  if (isRecording.value) {
    stopRecord()
  } else {
    startRecord()
  }
}

function startRecord() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return

  // 每次开始都创建新的识别实例，避免部分浏览器复用实例时报错
  recognition.value = new SR()
  recognition.value.continuous = true
  recognition.value.interimResults = true
  recognition.value.lang = 'zh-CN'

  recordBaseText.value = inputText.value
  recordFinalText.value = ''
  recordInterimText.value = ''
  recordError.value = ''

  recognition.value.onstart = () => {
    console.log('[语音识别] 已开始')
    isRecording.value = true
  }

  recognition.value.onresult = (event) => {
    let interim = ''
    let final = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        final += transcript
      } else {
        interim += transcript
      }
    }
    if (final) {
      recordFinalText.value += final
    }
    recordInterimText.value = interim
    // 实时将识别结果写入文本框：原始文本 + 已确定结果 + 临时结果
    inputText.value = recordBaseText.value + recordFinalText.value + recordInterimText.value
  }

  recognition.value.onerror = (event) => {
    console.error('[语音识别] 错误:', event.error, event.message)
    isRecording.value = false
    if (event.error === 'no-speech') {
      recordError.value = '未检测到语音，请大声一点再试'
    } else if (event.error === 'not-allowed') {
      recordError.value = '请允许麦克风权限（浏览器设置中）'
    } else if (event.error === 'network') {
      recordError.value = '网络错误，请检查网络连接'
    } else if (event.error === 'aborted') {
      // 用户手动停止，不算错误
      recordError.value = ''
    } else {
      recordError.value = `识别出错: ${event.error}`
    }
  }

  recognition.value.onend = () => {
    console.log('[语音识别] 已结束')
    isRecording.value = false
    // 结束时的最终文本已在 onresult 中写入 inputText
    recordInterimText.value = ''
  }

  try {
    recognition.value.start()
  } catch (e) {
    console.error('[语音识别] 启动失败:', e)
    recordError.value = '启动失败，请刷新页面重试'
    isRecording.value = false
  }
}

function stopRecord() {
  if (recognition.value) {
    try {
      recognition.value.stop()
    } catch (e) {
      console.warn('[语音识别] 停止失败:', e)
    }
  }
  isRecording.value = false
  recordInterimText.value = ''
  console.log('[语音识别] 用户手动停止')
}

const planGenerated = ref(false)
const rawContent = ref('') // AI 原始返回内容（JSON 解析失败时用于 Markdown 回退渲染）
const plan = reactive({
  days: 7, cities: 3, budget: '4500', daysList: [],
  destination: '', heroImage: '', heroTags: [],
  reason: '', bestSeason: '', estimateCost: '',
  hotel: '', tips: []
})
const isGenerating = ref(false)
const thinkingContent = ref('')
const errorMsg = ref('')
const actionToast = ref(null)
let actionToastTimer = null

// 图片风格标签（用户可勾选 1 个或多个，用于辅助 AI 理解图片）
// 由于本系统是纯文本模型，AI 无法直接看图，需要用户给图片加 1-2 个标签
// 注意：deepseek-v4-flash 原生支持图像理解，相关标签已废弃

const spotPool = {
  '北京': ['故宫', '长城', '颐和园'], '上海': ['外滩', '迪士尼', '豫园'],
  '杭州': ['西湖', '灵隐寺', '宋城'], '成都': ['大熊猫基地', '宽窄巷子', '锦里'],
  '西安': ['兵马俑', '大雁塔', '城墙'], '厦门': ['鼓浪屿', '南普陀', '环岛路'],
  '丽江': ['古城', '玉龙雪山', '束河古镇'], '重庆': ['洪崖洞', '磁器口', '武隆'],
  '长沙': ['岳麓山', '橘子洲', '湖南博物院'], '武汉': ['黄鹤楼', '东湖', '湖北省博']
}

/**
 * 多策略 JSON 提取函数
 * AI 模型有时会在 JSON 周围夹杂额外内容（markdown 代码块、解释文字等），
 * 这里按从严格到宽松的顺序尝试多种匹配方式
 *
 * @param {string} text - AI 原始返回内容
 * @returns {Object|null} 解析成功返回对象，失败返回 null
 */
function extractJson(text) {
  if (!text) return null

  // 策略 1：直接尝试整体解析（最理想情况）
  try {
    const obj = JSON.parse(text)
    if (obj && typeof obj === 'object') return obj
  } catch (e) { /* 继续尝试 */ }

  // 策略 2：提取 markdown 代码块 ```json ... ``` 或 ``` ... ```
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (codeBlockMatch) {
    try {
      const obj = JSON.parse(codeBlockMatch[1].trim())
      if (obj && typeof obj === 'object') return obj
    } catch (e) { /* 继续尝试 */ }
  }

  // 策略 3：用括号配对找到第一个完整的 {...} 块
  const firstBrace = text.indexOf('{')
  if (firstBrace >= 0) {
    let depth = 0
    let inString = false
    let escape = false
    let endIdx = -1
    for (let i = firstBrace; i < text.length; i++) {
      const ch = text[i]
      if (escape) { escape = false; continue }
      if (ch === '\\') { escape = true; continue }
      if (ch === '"' && !escape) { inString = !inString; continue }
      if (inString) continue
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) { endIdx = i; break }
      }
    }
    if (endIdx > firstBrace) {
      const candidate = text.slice(firstBrace, endIdx + 1)
      try {
        const obj = JSON.parse(candidate)
        if (obj && typeof obj === 'object') return obj
      } catch (e) { /* 继续尝试 */ }
    }
  }

  // 策略 4：宽松正则匹配（非贪婪，但可能截断）
  const looseMatch = text.match(/\{[\s\S]*\}/)
  if (looseMatch) {
    try {
      const obj = JSON.parse(looseMatch[0])
      if (obj && typeof obj === 'object') return obj
    } catch (e) { /* 全部失败 */ }
  }

  return null
}

/**
 * 把 Markdown 文本转成简单 HTML（用于 JSON 解析失败时的回退渲染）
 * 支持：## 标题、**粗体**、- 列表、换行
 *
 * @param {string} md - Markdown 文本
 * @returns {string} HTML 字符串
 */
function renderMarkdown(md) {
  if (!md) return ''
  const escapeHtml = (s) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const lines = escapeHtml(md).split('\n')
  let html = ''
  let inList = false
  for (let line of lines) {
    line = line.trim()
    if (!line) { if (inList) { html += '</ul>'; inList = false } html += '<p></p>'; continue }
    if (line.startsWith('## ')) {
      if (inList) { html += '</ul>'; inList = false }
      html += `<h2>${line.slice(3)}</h2>`
    } else if (/^[-*]\s+/.test(line)) {
      if (!inList) { html += '<ul>'; inList = true }
      html += `<li>${line.replace(/^[-*]\s+/, '')}</li>`
    } else {
      if (inList) { html += '</ul>'; inList = false }
      // 行内粗体
      const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      html += `<p>${formatted}</p>`
    }
  }
  if (inList) html += '</ul>'
  return html
}

function buildPrompt() {
  let prompt = `你是一个资深的旅行规划师。基于用户的需求（文字 + 图片），生成一份结构化、完整的旅行方案。模型具备视觉理解能力，请直接观察图片内容来推断用户的旅行偏好。

## 用户输入
`
  if (inputText.value) prompt += `- 文字描述：${inputText.value}\n`
  if (images.value.length > 0) {
    prompt += `- 灵感图片：用户上传了 ${images.value.length} 张图片\n`
    prompt += `  含义：图片是用户**最直接**的旅行意愿表达，请结合图片内容（自然风光/都市/古镇/海岛等）设计行程\n`
  }
  if (form.style) prompt += `- 旅行风格：${form.style}\n`
  if (form.people) prompt += `- 出行人员：${form.people}\n`
  if (form.startDate) prompt += `- 出发日期：${form.startDate}\n`
  if (form.budget) prompt += `- 预算范围：${form.budget}\n`
  prompt += `- 旅行天数：${form.days}天\n`
  if (prefData.value) {
    prompt += `- 用户偏好报告：${JSON.stringify(prefData.value)}\n`
  }

  prompt += `
## 要求
1. 选定 1 个最适合的**主目的地城市**（如威海、大理、成都等）
2. 景点选择应**直接呼应**用户需求（尤其是图片场景）
3. 景点名称使用**规范全名**（如"故宫博物院"、"慕田峪长城"）
4. 每天给出合理的活动安排

## 输出格式（严格遵守）

【必须】只输出一个 JSON 对象，**不要任何额外内容**：
- ❌ 不要在 JSON 前面/后面添加任何解释、问候、标题
- ❌ 不要在字段值里添加 emoji（如 ✨📅💰🏨💡📍）
- ❌ 不要重复字段名（如不要写"推荐理由：xxx"）
- ❌ 不要用 markdown 代码块包裹（不要写 \`\`\`json）
- ❌ 不要写"以下是JSON"等引导文字
- ✅ 直接以 \`{\` 开头，以 \`}\` 结尾

【字段值规范】
- "reason"：纯文本推荐理由，2-3 句话，**不要 emoji 也不要"推荐理由："前缀**
- "bestSeason"：纯季节描述，如 "4-10 月" 或 "6-9 月最佳"
- "estimateCost"：纯价格范围，如 "800-1000 元/人"
- "hotel"：纯住宿建议文本，**不要 emoji 也不要"住宿建议："前缀**
- "tips"：数组，每项是一条纯文本贴士，**不要 emoji 也不要数字编号**
- "daysList[].title"：纯标题，如 "Day 1 · 泰山脚下热身"（不要 emoji）
- "daysList[].desc"：纯行程描述
- "daysList[].spots"：**景点对象数组**（不是字符串！），每个对象必须包含：
  - "name"：景点规范全名（如"故宫博物院"、"慕田裕长城"、"涠洲岛"）
  - "city"：景点所在城市（如"北京"、"北海"）
  - "lat"：景点纬度（数字，保留 2-4 位小数，必须真实可用）
  - "lng"：景点经度（数字，保留 2-4 位小数，必须真实可用）
  - "province"：景点所在省份（如"北京"、"广西"）
  【关键】坐标必须真实准确，是后续地图路线规划的核心数据，请务必输出

## 输出示例（仅作格式参考，不要照抄内容）
{"destination":"大理","heroTags":["苍山洱海","白族文化","慢生活"],"reason":"大理兼具自然风光与少数民族文化，节奏舒缓适合休闲度假。","bestSeason":"3-5月、9-11月","estimateCost":"2000-3500元/人","hotel":"建议住在古城内或才村附近，客栈为主，150-300元/晚","tips":["苍山海拔较高，注意防晒","紫外线强，备好墨镜","租电动车环洱海更方便","古城石板路多，穿平底鞋"],"days":3,"cities":1,"budget":"3000","daysList":[{"title":"Day 1 · 抵达大理","desc":"抵达后入住古城客栈，下午漫步古城感受白族风情。","spots":[{"name":"大理古城","city":"大理","lat":25.69,"lng":100.16,"province":"云南"},{"name":"五华楼","city":"大理","lat":25.69,"lng":100.17,"province":"云南"},{"name":"洋人街","city":"大理","lat":25.69,"lng":100.16,"province":"云南"}]},{"title":"Day 2 · 环洱海","desc":"包车或电动车环洱海，途经喜洲、双廊等小镇。","spots":[{"name":"喜洲古镇","city":"大理","lat":25.84,"lng":100.13,"province":"云南"},{"name":"双廊","city":"大理","lat":25.91,"lng":100.19,"province":"云南"},{"name":"小普陀","city":"大理","lat":25.93,"lng":100.21,"province":"云南"}]},{"title":"Day 3 · 登苍山","desc":"乘坐索道上苍山，俯瞰洱海全景。","spots":[{"name":"苍山","city":"大理","lat":25.68,"lng":100.22,"province":"云南"},{"name":"洗马潭大索道","city":"大理","lat":25.66,"lng":100.23,"province":"云南"}]}]}`
  prompt += `
## 每日行程真实性与路线数据规则（必须执行）
1. 每天按上午、午餐/休息、下午、晚间安排真实活动，不要把一天默认压缩成一个景点。
2. 大型景区、主题乐园、长城、国家公园、古镇深度游可以独占一天；普通博物馆、城市地标和街区通常安排 2 个左右；相邻的小型景点可合理组合为 3-4 个。
3. 抵达日、离开日和跨城市移动日要扣除交通与入住时间，减少景点数量；不要为了凑数量安排距离很远或体验重复的景点。
4. 同一天景点必须优先选择同一区域或交通顺路的地点，并在 daysList[].desc 中写清上午、下午、晚间安排和必要的交通衔接。
5. 每个 daysList[].spots[] 景点对象必须包含 name、city、province、lat、lng；lat/lng 必须是与该景点对应的真实十进制度坐标，不能使用空值、0、城市中心点或虚构坐标。没有可靠坐标的景点不要作为正式行程景点输出。
6. image 不属于 AI 输出字段；前端只使用与景点名称精确匹配的本地图片。没有对应图片时保持空值，不得使用其他景点图片代替。
`
  return prompt
}

async function generatePlan() {
  if (isGenerating.value) return
  isGenerating.value = true
  errorMsg.value = ''
  planGenerated.value = true

  try {
    const prompt = buildPrompt()

    // 构造多模态消息：有图片时走 Zhipu glm-4v-plus-0111（视觉模型），纯文本时走 DeepSeek
    let userMessage
    let resp
    if (images.value.length > 0) {
      // 图片 + 文本 → 智谱视觉模型
      const contentParts = [{ type: 'text', text: prompt }]
      images.value.forEach((imgDataUrl) => {
        contentParts.push({ type: 'image_url', image_url: { url: imgDataUrl } })
      })
      userMessage = { role: 'user', content: contentParts }
      resp = await chatWithVision([userMessage], { maxTokens: 2048 })
    } else {
      // 纯文本 → DeepSeek
      userMessage = { role: 'user', content: prompt }
      resp = await chat([userMessage], { maxTokens: 4000 })
    }

    // 解析响应
    const content = resp.choices?.[0]?.message?.content || ''
    console.log('[AI响应] 原始内容:', content)
    // 保存原始内容（用于 JSON 解析失败时的 Markdown 回退）
    rawContent.value = content

    // 思考链
    const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/i)
    if (thinkingMatch) {
      thinkingContent.value = thinkingMatch[1].trim()
    }
    const cleanContent = content.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim()

    // 多策略 JSON 提取（按优先级尝试）
    const data = extractJson(cleanContent)
    if (!data) throw new Error('AI 返回内容无法解析为 JSON')

    // 填充到 plan（覆盖式重置）
    plan.destination = data.destination || ''
    plan.heroTags = data.heroTags || []
    plan.reason = data.reason || ''
    plan.bestSeason = data.bestSeason || ''
    plan.estimateCost = data.estimateCost || ''
    plan.hotel = data.hotel || ''
    plan.tips = data.tips || []
    plan.days = data.days || form.days
    plan.cities = data.cities || 1
    plan.budget = data.budget || '4500'

    // 尝试获取主目的地城市图（作为 hero 背景）
    if (plan.destination) {
      const heroImg = getSpotImageByName(plan.destination)
      if (heroImg) plan.heroImage = heroImg
    }
    // 没找到时，用第一天第一个景点的图片
    if (!plan.heroImage && data.daysList?.[0]?.spots?.[0]) {
      const firstSpotImg = getSpotImageByName(data.daysList[0].spots[0])
      if (firstSpotImg) plan.heroImage = firstSpotImg
    }

    // 解析每日行程，附加图片
    plan.daysList = (data.daysList || []).map(day => {
      const spots = (day.spots || []).map(spot => {
        // 兼容两种格式：对象或字符串
        const spotName = typeof spot === 'string' ? spot : (spot.name || '')
        if (!spotName) return null
        let url = getSpotImageByName(spotName)
        // 提取坐标（如果 AI 返回了）
        const lat = typeof spot === 'object' ? parseFloat(spot.lat) : NaN
        const lng = typeof spot === 'object' ? parseFloat(spot.lng) : NaN
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
        return {
          name: spotName,
          image: url || '',
          city: typeof spot === 'object' ? (spot.city || '') : '',
          province: typeof spot === 'object' ? (spot.province || '') : '',
          lat: isNaN(lat) ? null : lat,
          lng: isNaN(lng) ? null : lng
        }
      }).filter(Boolean)
      return { title: day.title, desc: day.desc, spots }
    })
    if (plan.daysList.length === 0) throw new Error('AI 返回的行程为空')

    showActionToast('行程已生成', 'success')
  } catch (err) {
    console.error('AI生成失败:', err)
    thinkingContent.value = ''

    // 区分错误类型：格式异常 vs 服务不可用
    if (rawContent.value && rawContent.value.length > 30) {
      // AI 返回了内容但解析失败 → Markdown 回退渲染
      errorMsg.value = 'AI 响应格式异常，已自动用 Markdown 模式展示'
      showActionToast('已为你展示 AI 回复内容', 'info')
    } else {
      // 真正的网络/服务失败 → 使用预设模板兜底
      errorMsg.value = err.message || 'AI 服务暂时不可用，请稍后再试'
      fallbackGenerate()
      showActionToast('已为你生成推荐行程', 'info')
    }
  } finally {
    isGenerating.value = false
  }
}

function fallbackGenerate() {
  plan.days = form.days
  plan.cities = Math.min(Math.max(Math.floor(form.days / 2), 1), 5)
  const budgetMap = { '': '4500', '1000元以内': '800', '1000-3000元': '2000', '3000-5000元': '4000', '5000元以上': '8000' }
  plan.budget = budgetMap[form.budget] || '4500'

  let cityPool = ['北京', '上海', '杭州', '成都', '西安', '厦门', '丽江', '重庆', '长沙', '武汉']
  if (prefData.value) {
    const dimMap = {
      '自然探索': ['丽江', '杭州', '成都', '重庆'],
      '美食指数': ['成都', '长沙', '武汉', '重庆'],
      '住宿品味': ['厦门', '杭州', '丽江', '成都'],
      '旅行节奏': ['西安', '北京', '上海', '杭州'],
      '交通偏好': ['成都', '西安', '杭州', '厦门']
    }
    const topDim = prefData.value.dimensions?.[0]?.label
    if (topDim && dimMap[topDim]) {
      cityPool = dimMap[topDim]
    }
  }

  const pickedCities = cityPool.slice(0, plan.cities)
  plan.daysList = []
  for (let i = 0; i < form.days; i++) {
    const city = pickedCities[i % pickedCities.length]
    const spotsNames = spotPool[city] || ['当地景点']
    // 给 fallback 景点也带上 imageUrl
    const spots = spotsNames.slice(0, 2 + (i % 2)).map(name => {
      // 优先精确匹配
      let url = getSpotImageByName(name)
      return { name, image: url || '' }
    })
    plan.daysList.push({ title: `Day ${i + 1} · ${city}`, desc: `在${city}感受独特的旅行魅力`, spots })
  }
}

// 图片加载失败时把 src 清空，让占位 SVG 显示
function onSpotImgError(e) {
  e.target.style.display = 'none'
}

// 显示操作提示
function showActionToast(text, type = 'info') {
  if (actionToastTimer) clearTimeout(actionToastTimer)
  actionToast.value = { text, type }
  actionToastTimer = setTimeout(() => { actionToast.value = null }, 2500)
}

// 把行程保存到后端
// 1) 写入 travel_plans 表（完整数据）
// 2) 同步写入 favorites，让"我的收藏"页面也能看到
async function savePlan() {
  if (!authStore.currentUser) {
    showActionToast('请先登录后再保存行程', 'warn')
    setTimeout(() => router.push('/auth'), 1200)
    return
  }
  try {
    const imageInsight = images.value.length > 0
      ? `图片输入：已上传 ${images.value.length} 张图片。图片识别参考：${plan.heroTags.length ? plan.heroTags.join('、') : '已结合图片内容进行视觉分析'}${plan.reason ? `。${plan.reason}` : ''}`
      : ''
    const savedUserInput = [
      inputText.value ? `文字输入：${inputText.value}` : '',
      imageInsight
    ].filter(Boolean).join('\n')
    const planData = {
      title: `${plan.days}天${plan.cities}城行程`,
      days: plan.days,
      cities: plan.cities,
      budget: plan.budget,
      daysList: plan.daysList,
      userInput: savedUserInput,
      imageAnalysis: imageInsight,
      preferenceText: prefData.value ? JSON.stringify(prefData.value) : ''
    }

    // 保存完整行程
    const planResult = await planStore.savePlan(planData)
    if (!planResult.ok) {
      showActionToast(planResult.msg || '保存行程失败', 'error')
      return
    }

    // 同步添加到收藏
    const favoriteResult = await favoriteStore.addFavorite({
      type: '行程',
      name: planData.title,
      description: inputText.value || `AI 生成的 ${plan.days} 天行程，途经 ${plan.cities} 个城市`,
      plan: planData
    })

    if (!favoriteResult.ok) {
      console.error('同步到我的收藏失败:', favoriteResult.msg)
      showActionToast('行程已保存，但同步到我的收藏失败，请重试', 'warn')
      return
    }

    // 以服务端最新数据刷新，确保收藏抽屉与数据库内容一致
    await favoriteStore.loadFavorites()

    showActionToast('已保存到我的收藏，正在打开抽屉', 'success')
    setTimeout(() => ui.openDrawer('favorites'), 600)
  } catch (e) {
    console.error('保存行程失败:', e)
    showActionToast('保存失败', 'error')
  }
}

// 复制行程到剪贴板
async function copyPlan() {
  const text = plan.daysList.map(d => `${d.title}\n${d.desc}\n景点：${(d.spots || []).map(s => s.name || s).join('、')}`).join('\n\n')
  try {
    await navigator.clipboard.writeText(text)
    showActionToast('行程已复制', 'success')
  } catch (e) {
    showActionToast('复制失败，请手动复制', 'error')
  }
}
</script>

<style scoped>
.page-container { max-width: 1400px; width: 70%; margin: 0 auto; padding: 40px 24px; }

.page-header { text-align: center; margin-bottom: 32px; }
.page-title { font-size: 32px; font-weight: 700; color: #1A1A2E; margin: 0 0 8px; font-family: 'Noto Sans SC', sans-serif; }
.page-subtitle { font-size: 15px; color: #5C5C6E; margin: 0; }

.plan-layout { display: grid; grid-template-columns: minmax(360px, 1fr) minmax(420px, 1.1fr); gap: 24px; align-items: start; }

/* ========== 左侧输入卡 ========== */
.input-card {
  background: #fff;
  border: 1px solid #E5E0D6;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 24px;
}

.input-header { margin-bottom: 18px; }
.input-title { font-size: 20px; font-weight: 700; color: #1A1A2E; margin: 0 0 4px; }
.input-hint { font-size: 12px; color: #8B8B9E; }

/* 偏好提示条 */
.pref-banner {
  display: flex; align-items: center; gap: 8px; padding: 10px 16px;
  background: rgba(212, 168, 75, 0.08); border: 1px solid rgba(212, 168, 75, 0.2);
  border-radius: 12px; margin-bottom: 18px; font-size: 13px; color: #5C5C6E;
}
.pref-banner strong { color: #D4A84B; }
.pref-mbti { margin-left: 8px; padding: 2px 8px; background: rgba(13,107,92,0.1); border-radius: 6px; font-size: 12px; font-weight: 800; color: #0D6B5C; letter-spacing: 0.5px; }
.pref-dismiss {
  margin-left: auto; border: none; background: none; color: #8B8B9E;
  cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px;
}
.pref-dismiss:hover { background: rgba(0,0,0,0.06); }

.mode-tabs { display: flex; gap: 6px; margin-bottom: 16px; background: #F8F6F0; border-radius: 12px; padding: 4px; }
.mode-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 8px 12px; border: none; border-radius: 10px; background: transparent; font-size: 13px; color: #5C5C6E; cursor: pointer; transition: all 0.2s; font-family: 'Noto Sans SC', sans-serif; }
.mode-tab.active { background: #fff; color: #0D6B5C; font-weight: 600; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

/* 文本输入框 + 麦克风按钮：输入框与外框同大小，按钮悬浮于右下 */
.textarea-wrapper { position: relative; width: 100%; height: 200px; }
.text-input { width: 100%; height: 100%; box-sizing: border-box; padding: 14px 56px 14px 14px; border: 1px solid #E5E0D6; border-radius: 12px; font-size: 14px; font-family: 'Noto Sans SC', sans-serif; color: #1A1A2E; background: #F8F6F0; resize: none; line-height: 1.7; transition: border-color 0.2s; }
.text-input:focus { outline: none; border-color: #0D6B5C; background: #fff; }

.mic-btn {
  position: absolute; bottom: 10px; right: 10px;
  width: 32px; height: 32px; border-radius: 50%;
  border: none; background: transparent;
  cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
  opacity: 0.5; z-index: 2;
}
.mic-btn:hover { opacity: 1; background: rgba(13, 107, 92, 0.08); }
.mic-btn.recording { opacity: 1; background: rgba(194, 59, 34, 0.1); animation: mic-pulse 1.5s ease-in-out infinite; }
.mic-btn:disabled { display: none; }
@keyframes mic-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(194, 59, 34, 0.3); }
  50% { box-shadow: 0 0 0 8px rgba(194, 59, 34, 0); }
}

.input-toolbar { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 12px; color: #8B8B9E; }
.clear-btn { border: none; background: none; color: #8B8B9E; cursor: pointer; font-size: 12px; font-family: 'Noto Sans SC', sans-serif; }
.clear-btn:hover { color: #C23B22; }
.voice-status { font-size: 12px; margin: 0 auto 0 12px; }
.voice-status.recording { color: #0D6B5C; }
.voice-status.error { color: #C23B22; }

/* 图片上传 */
.upload-zone { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px dashed #E5E0D6; border-radius: 16px; cursor: pointer; transition: all 0.2s; padding: 32px; min-height: 160px; }
.upload-zone:hover, .upload-zone.dragging { border-color: #0D6B5C; background: rgba(13, 107, 92, 0.03); }
.upload-text { font-size: 14px; color: #5C5C6E; margin: 12px 0 4px; }
.upload-hint { font-size: 12px; color: #8B8B9E; margin: 0; }

.image-preview-list { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
.preview-item { position: relative; width: 100px; height: 100px; border-radius: 10px; overflow: hidden; border: 1px solid #E5E0D6; }
.preview-item img { width: 100%; height: 100%; object-fit: cover; }
.preview-remove { position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; border-radius: 50%; border: none; background: rgba(0,0,0,0.5); color: #fff; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

/* 旅行风格 */
.style-section { margin-top: 16px; }
.section-label { display: block; font-size: 13px; font-weight: 600; color: #1A1A2E; margin-bottom: 10px; }
.style-options { display: flex; flex-wrap: wrap; gap: 8px; }
.style-chip { display: flex; align-items: center; gap: 5px; padding: 8px 14px; border: 1px solid #E5E0D6; border-radius: 20px; background: #F8F6F0; font-size: 13px; color: #5C5C6E; cursor: pointer; transition: all 0.2s; font-family: 'Noto Sans SC', sans-serif; }
.style-chip:hover { border-color: #0D6B5C; color: #0D6B5C; }
.style-chip.active { background: #0D6B5C; color: #fff; border-color: #0D6B5C; }

/* 人员组合 */
.people-section { margin-top: 14px; }
.people-options { display: flex; flex-wrap: wrap; gap: 8px; }
.people-chip { display: flex; align-items: center; gap: 5px; padding: 8px 14px; border: 1px solid #E5E0D6; border-radius: 20px; background: #F8F6F0; font-size: 13px; color: #5C5C6E; cursor: pointer; transition: all 0.2s; font-family: 'Noto Sans SC', sans-serif; }
.people-chip:hover { border-color: #0D6B5C; color: #0D6B5C; }
.people-chip.active { background: #0D6B5C; color: #fff; border-color: #0D6B5C; }

/* 附加选项 */
.extra-options { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #F0EDE6; }
.option-group label { display: block; font-size: 12px; color: #8B8B9E; margin-bottom: 6px; }
.day-val { color: #0D6B5C; font-weight: 600; }
.option-input { width: 100%; padding: 8px 12px; border: 1px solid #E5E0D6; border-radius: 8px; font-size: 13px; font-family: 'Noto Sans SC', sans-serif; color: #1A1A2E; background: #F8F6F0; }
.option-input:focus { outline: none; border-color: #0D6B5C; }
.range-slider { width: 100%; accent-color: #0D6B5C; }

.submit-btn { width: 100%; padding: 14px; margin-top: 20px; background: linear-gradient(135deg, #0D6B5C 0%, #1A8A7A 100%); color: #fff; border: none; border-radius: 14px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.25s; font-family: 'Noto Sans SC', sans-serif; display: flex; align-items: center; justify-content: center; gap: 8px; }
.submit-btn:hover { box-shadow: 0 6px 24px rgba(13, 107, 92, 0.35); transform: translateY(-1px); }
.submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
.spin-icon { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ========== 右侧结果卡 ========== */
.result-card { background: #fff; border: 1px solid #E5E0D6; border-radius: 20px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); display: flex; flex-direction: column; min-height: 600px; }
.result-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #F0EDE6; }
.result-title { font-size: 20px; font-weight: 700; color: #1A1A2E; margin: 0; }
.result-hint { font-size: 12px; color: #8B8B9E; }
.result-body { flex: 1; }
.result-content::-webkit-scrollbar { width: 4px; }
.result-content::-webkit-scrollbar-thumb { background: #D4C8B8; border-radius: 2px; }

/* 思考过程折叠区 */
.thinking-section { margin-bottom: 16px; border: 1px solid #E5E0D6; border-radius: 12px; overflow: hidden; background: linear-gradient(135deg, #FAFAF5 0%, #F5F1E8 100%); }
.thinking-summary { display: flex; align-items: center; gap: 8px; padding: 12px 16px; font-size: 13px; color: #5C5C6E; cursor: pointer; font-weight: 600; user-select: none; transition: background 0.2s; }
.thinking-summary:hover { background: rgba(212, 168, 75, 0.08); }
.thinking-summary svg { opacity: 0.6; }
.thinking-toggle { margin-left: auto; font-size: 11px; color: #8B8B9E; font-weight: 400; }
.thinking-content { padding: 14px 16px; font-size: 13px; color: #5C5C6E; line-height: 1.7; white-space: pre-wrap; max-height: 240px; overflow-y: auto; border-top: 1px solid #E5E0D6; background: #fff; }
.thinking-content::-webkit-scrollbar { width: 4px; }
.thinking-content::-webkit-scrollbar-thumb { background: #D4C8B8; border-radius: 2px; }

.result-summary { display: flex; align-items: center; justify-content: center; gap: 20px; padding: 18px 0; margin-bottom: 20px; background: linear-gradient(135deg, rgba(13, 107, 92, 0.04) 0%, rgba(13, 107, 92, 0.08) 100%); border-radius: 14px; }
.summary-item { display: flex; flex-direction: column; align-items: center; }
.summary-num { font-size: 28px; font-weight: 700; color: #0D6B5C; line-height: 1; }
.summary-label { font-size: 11px; color: #8B8B9E; margin-top: 4px; }
.summary-divider { width: 1px; height: 36px; background: #E5E0D6; }

/* ===== 顶部 Hero 推荐卡片（目的地大图）===== */
.result-hero { position: relative; margin-bottom: 16px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(13, 107, 92, 0.12); aspect-ratio: 16 / 9; max-height: 240px; background: #E5E0D6; }
.hero-img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; transition: transform 0.5s ease; }
.result-hero:hover .hero-img { transform: scale(1.05); }
.hero-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 16px 20px; background: linear-gradient(180deg, transparent 40%, rgba(0, 0, 0, 0.6) 100%); pointer-events: none; }
.hero-dest { margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #fff; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); letter-spacing: 0.5px; }
.hero-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.hero-tag { padding: 4px 10px; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-radius: 12px; font-size: 12px; color: #0D6B5C; font-weight: 500; pointer-events: auto; }

/* 移动端 hero 进一步压缩 */
@media (max-width: 640px) {
  .result-hero { max-height: 180px; border-radius: 12px; }
  .hero-overlay { padding: 12px 14px; }
  .hero-dest { font-size: 18px; margin-bottom: 6px; }
  .hero-tag { font-size: 11px; padding: 3px 8px; }
}

/* ===== 推荐理由卡片 ===== */
.reason-card { margin-bottom: 16px; padding: 16px 18px; background: linear-gradient(135deg, rgba(212, 168, 75, 0.08) 0%, rgba(212, 168, 75, 0.04) 100%); border: 1px solid rgba(212, 168, 75, 0.2); border-radius: 14px; }
.reason-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 14px; font-weight: 700; color: #B8941F; }
.reason-head svg { flex-shrink: 0; }
.reason-text { margin: 0; font-size: 13.5px; line-height: 1.75; color: #3A3A4E; white-space: pre-wrap; }

/* ===== 关键信息行（最佳季节 / 预估费用） ===== */
.info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.info-card { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #F8F6F0; border: 1px solid #E5E0D6; border-radius: 12px; transition: all 0.2s; }
.info-card:hover { border-color: #0D6B5C; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(13, 107, 92, 0.08); }
.info-icon { font-size: 24px; line-height: 1; flex-shrink: 0; }
.info-card > div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.info-label { font-size: 11px; color: #8B8B9E; font-weight: 500; }
.info-value { font-size: 14px; color: #1A1A2E; font-weight: 600; line-height: 1.4; word-break: break-word; }

/* ===== 通用 Tip 卡片（住宿 / 旅行贴士） ===== */
.tip-card { margin-bottom: 14px; padding: 14px 16px; background: #fff; border: 1px solid #E5E0D6; border-radius: 12px; transition: all 0.2s; }
.tip-card:hover { border-color: #0D6B5C; box-shadow: 0 2px 8px rgba(13, 107, 92, 0.06); }
.tip-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 14px; font-weight: 700; color: #0D6B5C; }
.tip-icon { font-size: 18px; line-height: 1; }
.tip-text { margin: 0; font-size: 13px; line-height: 1.75; color: #3A3A4E; white-space: pre-wrap; }
.tip-list { margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.85; color: #3A3A4E; }
.tip-list li { margin-bottom: 4px; }
.tip-list li:last-child { margin-bottom: 0; }
.tip-list li::marker { color: #0D6B5C; font-weight: 700; }

/* ===== 每日行程 ===== */
.days-section { margin-top: 18px; padding-top: 18px; border-top: 1px solid #F0EDE6; }
.days-title { display: flex; align-items: center; gap: 8px; margin: 0 0 14px; font-size: 15px; font-weight: 700; color: #0D6B5C; }
.days-title svg { flex-shrink: 0; }
.day-card { display: flex; gap: 14px; margin-bottom: 14px; padding: 14px; background: #FAFAF5; border: 1px solid #F0EDE6; border-radius: 14px; transition: all 0.2s; }
.day-card:last-child { margin-bottom: 0; }
.day-card:hover { border-color: #0D6B5C; background: #fff; box-shadow: 0 2px 8px rgba(13, 107, 92, 0.06); }
.day-badge { flex-shrink: 0; width: 56px; height: 56px; border-radius: 12px; background: linear-gradient(135deg, #1A8A7A 0%, #0D6B5C 100%); color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(13, 107, 92, 0.25); }
.day-body { flex: 1; min-width: 0; }
.day-title { margin: 0 0 6px; font-size: 14.5px; font-weight: 700; color: #1A1A2E; }
.day-desc { margin: 0 0 10px; font-size: 13px; line-height: 1.7; color: #5C5C6E; }
.day-spots { display: flex; flex-wrap: wrap; gap: 6px; }
.day-spot { padding: 4px 10px; background: #fff; border: 1px solid #E5E0D6; border-radius: 14px; font-size: 12px; color: #0D6B5C; transition: all 0.2s; }
.day-spot:hover { background: rgba(13, 107, 92, 0.08); border-color: #0D6B5C; transform: translateY(-1px); }

/* ===== Markdown 回退渲染（JSON 解析失败时） ===== */
.markdown-fallback { padding: 16px 18px; background: #F8F6F0; border: 1px solid #E5E0D6; border-radius: 12px; font-size: 13px; line-height: 1.85; color: #3A3A4E; white-space: pre-wrap; word-break: break-word; }
.markdown-fallback h2 { margin: 14px 0 8px; font-size: 15px; font-weight: 700; color: #0D6B5C; }
.markdown-fallback h2:first-child { margin-top: 0; }
.markdown-fallback p { margin: 0 0 8px; }
.markdown-fallback ul { margin: 6px 0 10px; padding-left: 20px; }
.markdown-fallback li { margin-bottom: 4px; }

.route-timeline { padding-left: 4px; }
.timeline-item { position: relative; padding-bottom: 20px; display: flex; gap: 14px; }
.timeline-item:last-child { padding-bottom: 0; }
.timeline-dot { flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #1A8A7A, #0D6B5C); color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; z-index: 1; box-shadow: 0 2px 8px rgba(13, 107, 92, 0.25); }
.timeline-line { position: absolute; left: 17px; top: 36px; width: 2px; height: calc(100% - 20px); background: linear-gradient(180deg, #E5E0D6 0%, rgba(229, 224, 214, 0.3) 100%); }
.timeline-content { flex: 1; padding-top: 4px; min-width: 0; }
.timeline-content h4 { font-size: 15px; font-weight: 600; color: #1A1A2E; margin: 0 0 6px; }
.timeline-content p { font-size: 13px; color: #5C5C6E; margin: 0 0 10px; line-height: 1.6; }
.timeline-spots { display: flex; gap: 10px; flex-wrap: wrap; }
.spot-card {
  display: flex; flex-direction: column; align-items: center;
  width: 80px; padding: 6px; border: 1px solid #F0EDE6; border-radius: 10px;
  background: #FAFAF5; transition: all 0.2s;
}
.spot-card:hover { border-color: #0D6B5C; background: #fff; transform: translateY(-1px); }
.spot-thumb {
  width: 68px; height: 52px; border-radius: 6px; overflow: hidden; background: #F0EDE6;
  display: flex; align-items: center; justify-content: center;
}
.spot-thumb img { width: 100%; height: 100%; object-fit: cover; }
.spot-thumb-placeholder { display: flex; align-items: center; justify-content: center; }
.spot-name {
  font-size: 11px; color: #5C5C6E; text-align: center; margin-top: 4px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  line-height: 1.3;
}

.result-actions { display: flex; gap: 10px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #F0EDE6; flex-wrap: wrap; }
.action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border: 1px solid #E5E0D6; border-radius: 10px; background: #fff; font-size: 13px; color: #5C5C6E; cursor: pointer; font-family: 'Noto Sans SC', sans-serif; transition: all 0.2s; }
.action-btn:hover { border-color: #0D6B5C; color: #0D6B5C; }
.action-btn.primary { background: #0D6B5C; color: #fff; border-color: #0D6B5C; }
.action-btn.primary:hover { background: #1A8A7A; color: #fff; box-shadow: 0 4px 12px rgba(13, 107, 92, 0.3); }

/* 错误状态 */
.error-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px 20px; }
.error-icon { font-size: 48px; margin-bottom: 12px; }
.error-title { font-size: 18px; font-weight: 600; color: #1A1A2E; margin: 0 0 8px; }
.error-desc { font-size: 13px; color: #8B8B9E; margin: 0 0 20px; max-width: 320px; line-height: 1.6; }
.error-retry { padding: 10px 24px; background: #0D6B5C; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans SC', sans-serif; }
.error-retry:hover { background: #1A8A7A; }

/* 骨架屏 */
.skeleton-wrap { padding: 8px 0; }
.skel-summary { display: flex; gap: 20px; justify-content: center; padding: 18px 0; margin-bottom: 20px; background: linear-gradient(135deg, rgba(13, 107, 92, 0.04), rgba(13, 107, 92, 0.08)); border-radius: 14px; }
.skel-block { background: linear-gradient(90deg, #EAE5D8 0%, #F8F6F0 50%, #EAE5D8 100%); background-size: 200% 100%; border-radius: 6px; animation: skel-shine 1.4s ease-in-out infinite; }
.skel-block.lg { width: 60px; height: 28px; }
.skel-block.md { width: 140px; height: 16px; margin-bottom: 8px; }
.skel-block.sm { width: 200px; height: 12px; }
.skel-day { display: flex; gap: 14px; margin-bottom: 18px; }
.skel-dot { flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%; background: #EAE5D8; }
.skel-content { flex: 1; }
.skel-chip-row { display: flex; gap: 6px; margin-top: 6px; }
.skel-chip { width: 70px; height: 20px; border-radius: 10px; background: #EAE5D8; }
.skel-tip { text-align: center; font-size: 13px; color: #8B8B9E; margin-top: 16px; }
@keyframes skel-shine { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.result-placeholder { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; min-height: 400px; }
.placeholder-visual { position: relative; width: 120px; height: 120px; margin-bottom: 24px; }
.pv-ring { position: absolute; border-radius: 50%; border: 1px solid rgba(212, 168, 75, 0.15); }
.pv-ring-1 { inset: 0; animation: ring-pulse 3s ease-in-out infinite; }
.pv-ring-2 { inset: 12px; animation: ring-pulse 3s ease-in-out 0.5s infinite; }
.pv-ring-3 { inset: 24px; animation: ring-pulse 3s ease-in-out 1s infinite; }
@keyframes ring-pulse { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }
.pv-center { position: absolute; inset: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #F8F6F0; }
.placeholder-title { font-size: 16px; font-weight: 600; color: #1A1A2E; margin: 0 0 8px; }
.placeholder-desc { font-size: 13px; color: #8B8B9E; margin: 0; line-height: 1.7; }

/* 操作提示气泡 */
.action-toast {
  position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
  padding: 10px 20px; border-radius: 24px; font-size: 13px; font-weight: 500;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15); z-index: 9999;
  animation: toast-pop 0.25s ease-out;
  font-family: 'Noto Sans SC', sans-serif;
}
.action-toast.success { background: #0D6B5C; color: #fff; }
.action-toast.error { background: #C23B22; color: #fff; }
.action-toast.info { background: #1A8A7A; color: #fff; }
@keyframes toast-pop {
  0% { opacity: 0; transform: translate(-50%, 10px); }
  100% { opacity: 1; transform: translate(-50%, 0); }
}

/* 响应式 */
@media (max-width: 1024px) {
  .plan-layout { grid-template-columns: 1fr; }
  .input-card { position: static; }
  .result-card { min-height: auto; }
}
@media (max-width: 640px) {
  .page-container { width: 100%; padding: 24px 16px; }
  .input-card, .result-card { padding: 20px; border-radius: 16px; }
  .preview-item { width: 80px; height: 80px; }
}
</style>
