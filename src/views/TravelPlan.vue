<template>
  <div class="page-container">
    <PageHero v-bind="pageHeroConfig.plan" />
    <div id="plan-input" class="plan-layout">
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
          <div class="option-group" style="grid-column: 1 / -1;">
            <label>出发地 <span class="field-required">*</span></label>
            <input
              ref="originInput"
              v-model.trim="form.origin"
              class="option-input"
              :class="{ 'is-invalid': fieldErrors.origin }"
              placeholder="例如：广州天河区、北京南站"
              maxlength="120"
            />
          </div>
          <div class="option-group">
            <label>出发日期 <span class="field-required">*</span></label>
            <input
              ref="startDateInput"
              type="date"
              v-model="form.startDate"
              class="option-input"
              :class="{ 'is-invalid': fieldErrors.startDate }"
            />
          </div>
          <div class="option-group">
            <label>出发时段</label>
            <select v-model="form.departurePeriod" class="option-input">
              <option value="morning">上午（08:00 左右）</option>
              <option value="afternoon">下午（14:00 左右）</option>
              <option value="evening">晚间（19:00 左右）</option>
            </select>
          </div>
          <div class="option-group">
            <label>交通偏好</label>
            <select v-model="form.transportPreference" class="option-input">
              <option value="smart">智能推荐</option>
              <option value="drive">驾车优先</option>
              <option value="transit">公共交通优先</option>
              <option value="rail">高铁/动车建议优先</option>
              <option value="flight">飞机建议优先</option>
            </select>
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
            <!-- 出发信息摘要 -->
            <div v-if="plan.transport?.origin" class="departure-card">
              <div class="departure-head">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D6B5C" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>出发信息</span>
              </div>
              <p class="departure-summary">{{ formatDepartureSummary(plan.transport) }}</p>
              <div class="departure-grid">
                <div class="departure-item">
                  <span class="departure-label">出发地</span>
                  <strong>{{ plan.transport.origin }}</strong>
                </div>
                <div class="departure-item">
                  <span class="departure-label">出发日期</span>
                  <strong>{{ plan.transport.departureDate || '未设置' }}</strong>
                </div>
                <div class="departure-item">
                  <span class="departure-label">出发时段</span>
                  <strong>{{ departurePeriodLabels[plan.transport.departurePeriod] || '未设置' }}</strong>
                </div>
                <div class="departure-item">
                  <span class="departure-label">交通偏好</span>
                  <strong>{{ transportPreferenceLabels[plan.transport.preference] || '智能推荐' }}</strong>
                </div>
              </div>
              <p class="departure-note">详细去程查询可在「行程路线」页继续生成；这里只保留规划所需的出发摘要。</p>
            </div>
            <!-- 出行天气预报 -->
            <div v-if="weather.loading || weather.error || (weather.days && weather.days.length)" class="weather-card">
              <div class="weather-head">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D6B5C" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
                <span>出行天气预报</span>
                <span v-if="weather.city" class="weather-city">{{ weather.city }}{{ weather.admin1 ? ` · ${weather.admin1}` : '' }}</span>
              </div>
              <p v-if="weather.loading" class="weather-loading">正在获取目的地一周天气…</p>
              <p v-else-if="weather.error" class="weather-error">{{ weather.error }}</p>
              <template v-else>
                <p class="weather-note" :class="{ 'is-historical': weather.mode !== 'forecast' }">{{ weather.note }}</p>
                <div class="weather-grid">
                  <div
                    v-for="day in weather.days"
                    :key="day.date"
                    class="weather-day"
                    :class="{ 'is-ref': day.source === 'historical' }"
                  >
                    <div class="weather-day-top">
                      <span class="weather-weekday">{{ day.weekday }}</span>
                      <span class="weather-date">{{ formatWeatherDate(day.date) }}</span>
                    </div>
                    <div class="weather-summary">{{ day.summary }}</div>
                    <div class="weather-temp">
                      <strong>{{ formatTemp(day.temp_max) }}</strong>
                      <span>/ {{ formatTemp(day.temp_min) }}</span>
                    </div>
                    <div class="weather-meta">
                      <span v-if="day.precipitation_probability != null">降水 {{ day.precipitation_probability }}%</span>
                      <span v-else-if="day.precipitation_sum != null">降水 {{ day.precipitation_sum }}mm</span>
                      <span v-else>降水 —</span>
                    </div>
                    <div v-if="day.source === 'historical'" class="weather-badge">往年同期</div>
                  </div>
                </div>
              </template>
            </div>
            <!-- 关键信息（最佳季节/预算） -->
            <div v-if="plan.bestSeason || plan.estimateCost || plan.budgetLabel" class="info-row">
              <div v-if="plan.bestSeason" class="info-card">
                <span class="info-icon">📅</span>
                <div>
                  <span class="info-label">最佳季节</span>
                  <span class="info-value">{{ plan.bestSeason }}</span>
                </div>
              </div>
              <div v-if="plan.estimateCost || plan.budgetLabel" class="info-card">
                <span class="info-icon">💰</span>
                <div>
                  <span class="info-label">预估费用</span>
                  <span class="info-value">{{ plan.estimateCost || plan.budgetLabel }}</span>
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
              <div class="days-head">
                <h4 class="days-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D6B5C" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  每日行程安排
                </h4>
                <span class="days-hint">悬停景点 / 美食 / 人文标签可预览图片</span>
              </div>
              <div v-for="(day, i) in plan.daysList" :key="i" class="day-card" :class="{ 'is-arrival-day': i === 0 }">
                <div class="day-badge">Day {{ i + 1 }}</div>
                <div class="day-body">
                  <div class="day-title-row">
                    <h5 class="day-title">{{ day.title }}</h5>
                    <span v-if="i === 0" class="day-tag">去程衔接</span>
                  </div>
                  <p class="day-desc">{{ day.desc }}</p>
                  <div v-if="day.highlights && day.highlights.length" class="day-highlights">
                    <span
                      v-for="(item, j) in day.highlights"
                      :key="`${item.type}-${item.label}-${j}`"
                      class="day-highlight"
                      :class="[`type-${item.type}`, { 'has-preview': isPreviewableHighlight(item) }]"
                      @mouseenter="(e) => isPreviewableHighlight(item) && showTagPreview(e, {
                        label: item.label,
                        tagType: item.type,
                        city: form.destination || plan.destination,
                        localImage: item.image || getSpotImageByName(item.label),
                        dayIdx: i,
                        tagIdx: j,
                      })"
                      @mousemove="(e) => isPreviewableHighlight(item) && moveTagPreview(e)"
                      @mouseleave="() => isPreviewableHighlight(item) && hideTagPreview()"
                    >{{ item.label }}</span>
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
    <Teleport to="body">
      <div
        v-if="tagPreview.visible"
        class="tag-preview-card"
        :style="{ left: `${tagPreview.x}px`, top: `${tagPreview.y}px` }"
        @mouseenter="keepTagPreview"
        @mouseleave="hideTagPreview"
      >
        <div class="tag-preview-media">
          <img v-if="tagPreview.imageUrl" :src="tagPreview.imageUrl" :alt="tagPreview.label" />
          <div v-else-if="tagPreview.loading" class="tag-preview-state">加载图片中…</div>
          <div v-else class="tag-preview-state">暂无图片</div>
        </div>
        <div class="tag-preview-meta">
          <strong>{{ tagPreview.label }}</strong>
          <span v-if="tagPreview.attribution">{{ tagPreview.attribution }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { chat, chatWithVision } from '../utils/agnesApi.js'
import { getSpotImageByName } from '../data/provinces.js'
import { resolveTagPreview } from '../utils/tagPreview.js'
import apiClient from '../utils/apiClient.js'
import { useUiStore } from '../stores/uiStore.js'
import { useAuthStore } from '../stores/authStore.js'
import { usePlanStore } from '../stores/planStore.js'
import { useFavoriteStore } from '../stores/favoriteStore.js'
import PageHero from '../components/PageHero.vue'
import { pageHeroConfig } from '../config/pageHeroConfig.js'

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

function todayISODate() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const form = reactive({
  origin: '',
  startDate: todayISODate(),
  departurePeriod: 'morning',
  transportPreference: 'smart',
  budget: '',
  days: 7,
  style: '',
  people: ''
})

const originInput = ref(null)
const startDateInput = ref(null)
const fieldErrors = reactive({
  origin: false,
  startDate: false
})

const departurePeriodLabels = {
  morning: '上午（08:00 左右）',
  afternoon: '下午（14:00 左右）',
  evening: '晚间（19:00 左右）'
}

const transportPreferenceLabels = {
  smart: '智能推荐',
  drive: '驾车优先',
  transit: '公共交通优先',
  rail: '高铁/动车建议优先',
  flight: '飞机建议优先'
}

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
  days: 7, cities: 3, budget: '4500', budgetLabel: '', daysList: [],
  destination: '', heroImage: '', heroTags: [],
  reason: '', bestSeason: '', estimateCost: '',
  hotel: '', tips: [], transport: null
})

const weather = reactive({
  loading: false,
  error: '',
  city: '',
  admin1: '',
  mode: '',
  note: '',
  days: []
})

function resetWeather() {
  weather.loading = false
  weather.error = ''
  weather.city = ''
  weather.admin1 = ''
  weather.mode = ''
  weather.note = ''
  weather.days = []
}

function formatWeatherDate(iso) {
  if (!iso) return ''
  const parts = String(iso).split('-')
  if (parts.length < 3) return iso
  return `${Number(parts[1])}/${Number(parts[2])}`
}

function formatTemp(value) {
  if (value == null || value === '') return '—'
  return `${value}°`
}

function weatherModeLabel(mode) {
  if (mode === 'forecast') return '实时预报'
  if (mode === 'historical') return '往年同期参考'
  if (mode === 'mixed') return '预报+往年参考'
  return ''
}

async function loadTripWeather(city, startDate) {
  resetWeather()
  let place = String(city || '').trim()
  // 从「林芝（西藏）」这类文案中提取主城市名
  place = place.replace(/[（(].*?[）)]/g, '').replace(/[·\-—].*$/, '').trim()
  const dateStr = String(startDate || '').trim()
  if (!place || !dateStr) {
    weather.error = '缺少目的地或出发日期，暂无法展示天气'
    return
  }
  weather.loading = true
  try {
    const { data } = await apiClient.get('/weather/trip', {
      params: { city: place, start_date: dateStr, days: 7 }
    })
    weather.city = data.city || place
    weather.admin1 = data.admin1 || ''
    weather.mode = data.mode || ''
    weather.note = data.note || ''
    weather.days = Array.isArray(data.days) ? data.days : []
    if (!weather.days.length) weather.error = '暂无可用天气数据'
  } catch (err) {
    const detail = err.response?.data?.detail
    weather.error = (typeof detail === 'string' ? detail : null) || err.message || '天气获取失败'
    weather.days = []
  } finally {
    weather.loading = false
  }
}

const budgetEstimateMap = {
  '': '按实际行程灵活安排',
  '1000元以内': '800-1000元/人',
  '1000-3000元': '1000-3000元/人',
  '3000-5000元': '3000-5000元/人',
  '5000元以上': '5000元以上/人'
}

const budgetValueMap = {
  '': '4500',
  '1000元以内': '800',
  '1000-3000元': '2000',
  '3000-5000元': '4000',
  '5000元以上': '8000'
}

function buildTransportSnapshot() {
  return {
    origin: form.origin,
    departureDate: form.startDate,
    departurePeriod: form.departurePeriod,
    preference: form.transportPreference
  }
}

function formatDepartureSummary(transport) {
  if (!transport?.origin) return ''
  const dateText = transport.departureDate || '待定日期'
  const periodText = departurePeriodLabels[transport.departurePeriod] || '灵活时段'
  const preferenceText = transportPreferenceLabels[transport.preference] || '智能推荐'
  return `${dateText} ${periodText}从${transport.origin}出发，交通偏好：${preferenceText}。`
}

function syncBudgetFields() {
  plan.budgetLabel = form.budget || '不限'
  plan.budget = budgetValueMap[form.budget] || '4500'
  if (form.budget) {
    plan.estimateCost = budgetEstimateMap[form.budget]
  } else if (!plan.estimateCost) {
    plan.estimateCost = budgetEstimateMap['']
  }
}

function ensureDay1InboundDesc(daysList) {
  if (!Array.isArray(daysList) || !daysList.length || !form.origin) return daysList
  const day1 = { ...daysList[0] }
  const inboundLine = formatDepartureSummary(buildTransportSnapshot()).replace(/。$/, '')
  const prefix = `去程衔接：${inboundLine}，抵达后先办理入住，再安排附近轻松游览。`
  const desc = day1.desc || ''
  if (!desc.includes(form.origin) && !desc.includes('去程')) {
    day1.desc = `${prefix}${desc ? ` ${desc}` : ''}`
  }
  daysList[0] = day1
  return daysList
}

const tagPreview = reactive({
  visible: false,
  loading: false,
  label: '',
  imageUrl: '',
  attribution: '',
  x: 0,
  y: 0,
  token: 0,
})
let tagPreviewHideTimer = null
/** 当前规划结果内已分配给各标签的图片，避免同程撞车（对齐行程路线页） */
const tagImageByKey = new Map()

function tagImageKey(dayIdx, tagIdx) {
  return `${dayIdx}:${tagIdx}`
}

function collectExcludeTagImageUrls(exceptKey = '') {
  const urls = []
  for (const [key, url] of tagImageByKey.entries()) {
    if (key === exceptKey || !url) continue
    urls.push(url)
  }
  return urls
}

function normalizePreviewUrl(url) {
  const text = String(url || '').trim()
  if (!text) return ''
  const m = text.match(/^https?:\/\/[^/]+(\/uploads\/.+)$/i)
  if (m) return m[1]
  return text
}

function positionTagPreview(clientX, clientY) {
  const pad = 16
  const cardW = 220
  const cardH = 190
  let x = clientX + 14
  let y = clientY + 14
  if (typeof window !== 'undefined') {
    if (x + cardW + pad > window.innerWidth) x = Math.max(pad, clientX - cardW - 12)
    if (y + cardH + pad > window.innerHeight) y = Math.max(pad, clientY - cardH - 12)
  }
  tagPreview.x = x
  tagPreview.y = y
}

function keepTagPreview() {
  if (tagPreviewHideTimer) {
    clearTimeout(tagPreviewHideTimer)
    tagPreviewHideTimer = null
  }
}

function hideTagPreview() {
  if (tagPreviewHideTimer) clearTimeout(tagPreviewHideTimer)
  tagPreviewHideTimer = setTimeout(() => {
    tagPreview.visible = false
    tagPreview.loading = false
    tagPreview.imageUrl = ''
    tagPreview.attribution = ''
    tagPreview.token += 1
  }, 120)
}

function moveTagPreview(e) {
  if (!tagPreview.visible) return
  positionTagPreview(e.clientX, e.clientY)
}

async function showTagPreview(e, {
  label,
  tagType = 'spot',
  city = '',
  localImage = '',
  dayIdx = -1,
  tagIdx = -1,
} = {}) {
  const text = String(label || '').trim()
  if (!text) return
  keepTagPreview()
  const token = tagPreview.token + 1
  const imageKey = dayIdx >= 0 && tagIdx >= 0 ? tagImageKey(dayIdx, tagIdx) : `label:${text}`
  const excludeUrls = collectExcludeTagImageUrls(imageKey).map(normalizePreviewUrl)
  const local = normalizePreviewUrl(localImage)

  tagPreview.token = token
  tagPreview.visible = true
  tagPreview.label = text
  tagPreview.loading = true
  tagPreview.imageUrl = (local && !excludeUrls.includes(local)) ? local : ''
  tagPreview.attribution = tagPreview.imageUrl ? '本地景点图库' : ''
  positionTagPreview(e.clientX, e.clientY)

  // 1) 对齐行程路线：先查运营景点库封面（精确/模糊名称）
  try {
    const { data } = await apiClient.get('/attractions/lookup', { params: { name: text } })
    if (tagPreview.token !== token) return
    const cover = normalizePreviewUrl(data?.data?.cover_image_url || '')
    if (cover && !excludeUrls.includes(cover)) {
      tagPreview.imageUrl = cover
      tagPreview.attribution = '星际行者景点库'
      tagPreview.loading = false
      tagImageByKey.set(imageKey, cover)
      return
    }
  } catch {
    // 忽略库查询失败，继续图搜兜底
  }

  if (tagPreview.token !== token) return
  if (tagPreview.imageUrl) {
    tagImageByKey.set(imageKey, tagPreview.imageUrl)
    tagPreview.loading = false
    return
  }

  // 2) 图搜兜底：景点/人文更接近路线页 spot 检索；其余保留原 tagType
  const previewType = (tagType === 'spot' || tagType === 'culture') ? 'spot' : tagType
  try {
    const data = await resolveTagPreview({
      label: text,
      tagType: previewType,
      city,
      localImage: '',
      excludeUrls,
    })
    if (tagPreview.token !== token) return
    tagPreview.imageUrl = normalizePreviewUrl(data.image_url || '')
    tagPreview.attribution = data.attribution || ''
    tagPreview.loading = false
    if (tagPreview.imageUrl) tagImageByKey.set(imageKey, tagPreview.imageUrl)
  } catch {
    if (tagPreview.token !== token) return
    tagPreview.loading = false
    tagPreview.imageUrl = ''
    tagPreview.attribution = '暂无可用图片'
  }
}

function stripHighlightPrefix(text) {
  return String(text || '')
    .trim()
    .replace(/^(美食|人文|体验|氛围|景点|赏阅|文化)\s*[·•.\-—]\s*/u, '')
    .trim()
}

/** 抽象氛围词：无法稳定检索到对应图片，不应作为展示标签 */
function isAbstractHighlightLabel(label) {
  const text = String(label || '').trim()
  if (!text) return true
  if (text.length < 2 || text.length > 14) return true
  if (/^(抵达|入住|出发|返程|告别|行程|安排|衔接)/u.test(text)) return true
  if (/(初体验|独特体验|慢生活|城市氛围|轻松到店|深度漫步|悠闲午后|告别高原)$/u.test(text)) return true
  if (/氛围|节奏|心情|感受|体验感|打卡感|特色小吃|特色美食|人文地标|当地小吃/.test(text)) return true
  return false
}

function isPreviewableHighlight(item) {
  return Boolean(item && ['spot', 'food', 'culture'].includes(item.type) && item.label)
}

function classifyHighlightLabel(text) {
  const label = stripHighlightPrefix(text)
  if (!label || isAbstractHighlightLabel(label)) return null
  if (/火锅|米线|小吃|咖啡|甜茶|酸奶|美食|菜|饵块|乳扇|烤|鲜|包子|面|饭|酥|汤/.test(label)) {
    return { type: 'food', label }
  }
  if (/寺|庙|宫|园|街|古镇|古城|博物馆|非遗|壁画|经筒|园林|文化|民族|藏式园林/.test(label)) {
    // 具体地点优先归为景点，便于走景点库封面
    if (/寺|庙|宫|园|街|古镇|古城|博物馆|林卡|布达拉|罗布林卡|八廓/.test(label)) {
      return { type: 'spot', label }
    }
    return { type: 'culture', label }
  }
  // 默认识别为景点名（可检索实体），不再产出 vibe / 抽象 experience
  return { type: 'spot', label }
}

function normalizeHighlight(item) {
  if (!item) return null
  if (typeof item === 'string') return classifyHighlightLabel(item)

  const label = stripHighlightPrefix(item.label || item.name || item.text || '')
  if (!label || isAbstractHighlightLabel(label)) return null

  let type = ['food', 'culture', 'spot'].includes(item.type) ? item.type : ''
  if (!type || type === 'vibe' || type === 'experience') {
    return classifyHighlightLabel(label)
  }
  // AI 把景点标成 experience 时，纠偏为 spot
  if (type === 'culture' && /寺|庙|宫|园|街|古镇|古城|博物馆|林卡|布达拉|罗布林卡|八廓/.test(label)) {
    type = 'spot'
  }
  const image = item.image ? String(item.image) : ''
  return image ? { type, label, image } : { type, label }
}

function highlightRank(item) {
  if (item.type === 'spot') return 0
  if (item.type === 'food') return 1
  if (item.type === 'culture') return 2
  return 9
}

function normalizeDayHighlights(day, usedLabels = null) {
  const used = usedLabels instanceof Set ? usedLabels : null
  const fromAi = Array.isArray(day.highlights)
    ? day.highlights.map(normalizeHighlight).filter(Boolean)
    : []
  const spotTags = (day.spots || [])
    .map((spot) => {
      if (!spot) return null
      if (typeof spot === 'string') {
        const label = spot.trim()
        return label && !isAbstractHighlightLabel(label) ? { type: 'spot', label } : null
      }
      const label = String(spot.name || spot.label || '').trim()
      if (!label || isAbstractHighlightLabel(label)) return null
      return { type: 'spot', label, image: spot.image || '' }
    })
    .filter(Boolean)

  const merged = [...fromAi, ...spotTags]
  const seen = new Set()
  const unique = merged.filter((item) => {
    const key = item.label
    if (seen.has(key)) return false
    // 整程去重：前面天数已用过的标签不再出现
    if (used && used.has(key)) return false
    seen.add(key)
    return true
  })

  unique.sort((a, b) => highlightRank(a) - highlightRank(b))

  // 每天最多 5 个：优先未在前几天出现过的景点/美食/人文
  const picked = unique.slice(0, 5)
  if (used) {
    for (const item of picked) used.add(item.label)
  }
  return picked
}

/** 按天顺序规范化整份行程标签，保证跨天不重复 */
function normalizePlanHighlights(daysList) {
  const used = new Set()
  return (daysList || []).map((day) => ({
    ...day,
    highlights: normalizeDayHighlights(day, used),
  }))
}
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

  // 去掉常见思维链包装，避免污染解析
  let cleaned = String(text)
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<\/?redacted_reasoning>/gi, '')
    .trim()

  const tryParse = (raw) => {
    try {
      const obj = JSON.parse(raw)
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj
    } catch (e) { /* ignore */ }
    return null
  }

  const isPlanLike = (obj) =>
    obj && (obj.destination || obj.daysList || obj.heroTags || obj.reason)

  // 策略 1：直接整体解析
  let obj = tryParse(cleaned)
  if (obj && isPlanLike(obj)) return obj
  if (obj) return obj

  // 策略 2：markdown 代码块（取最后一个 json 块）
  const blocks = [...cleaned.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)]
  for (let i = blocks.length - 1; i >= 0; i--) {
    obj = tryParse(blocks[i][1].trim())
    if (obj && isPlanLike(obj)) return obj
    if (obj) return obj
  }

  // 策略 3：从后往前找包含 destination/daysList 的完整 {...}
  const keys = ['"daysList"', '"destination"', '"heroTags"']
  let searchFrom = cleaned.length
  while (searchFrom > 0) {
    let brace = -1
    for (const key of keys) {
      const idx = cleaned.lastIndexOf(key, searchFrom - 1)
      if (idx >= 0 && (brace < 0 || idx > brace)) brace = idx
    }
    if (brace < 0) break
    const start = cleaned.lastIndexOf('{', brace)
    if (start < 0) {
      searchFrom = brace
      continue
    }
    let depth = 0
    let inString = false
    let escape = false
    let endIdx = -1
    for (let i = start; i < cleaned.length; i++) {
      const ch = cleaned[i]
      if (escape) { escape = false; continue }
      if (ch === '\\') { escape = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) { endIdx = i; break }
      }
    }
    if (endIdx > start) {
      obj = tryParse(cleaned.slice(start, endIdx + 1))
      if (obj && isPlanLike(obj)) return obj
    }
    searchFrom = start
  }

  // 策略 4：第一个完整 {...}
  const firstBrace = cleaned.indexOf('{')
  if (firstBrace >= 0) {
    let depth = 0
    let inString = false
    let escape = false
    let endIdx = -1
    for (let i = firstBrace; i < cleaned.length; i++) {
      const ch = cleaned[i]
      if (escape) { escape = false; continue }
      if (ch === '\\') { escape = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) { endIdx = i; break }
      }
    }
    if (endIdx > firstBrace) {
      obj = tryParse(cleaned.slice(firstBrace, endIdx + 1))
      if (obj) return obj
    }
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
  if (form.origin) prompt += `- 出发地：${form.origin}\n`
  if (form.startDate) prompt += `- 出发日期：${form.startDate}\n`
  if (form.departurePeriod) prompt += `- 出发时段：${departurePeriodLabels[form.departurePeriod]}\n`
  if (form.transportPreference) prompt += `- 交通偏好：${transportPreferenceLabels[form.transportPreference]}\n`
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
5. 结果必须体现用户填写的出发信息与预算：
   - "estimateCost" 必须与用户预算范围一致：不限→灵活区间；1000元以内→800-1000元/人；1000-3000元→1000-3000元/人；3000-5000元→3000-5000元/人；5000元以上→5000元以上/人
   - Day 1 的 title/desc 必须包含去程衔接：写清从出发地、出发日期/时段、按交通偏好前往目的地并入住；抵达日只安排附近轻松活动
   - Day 2 及之后专注当地玩法，不要重复罗列出发地、出发时段或交通偏好

## 输出格式（严格遵守）

【必须】只输出一个 JSON 对象，**不要任何额外内容**：
- ❌ 不要在 JSON 前面/后面添加任何解释、问候、标题、英文思考过程
- ❌ 思考过程（若有）不得写入最终答案；最终答案只能是 JSON
- ❌ 不要在字段值里添加 emoji（如 ✨📅💰🏨💡📍）
- ❌ 不要重复字段名（如不要写"推荐理由：xxx"）
- ❌ 不要用 markdown 代码块包裹（不要写 \`\`\`json）
- ❌ 不要写"以下是JSON"等引导文字
- ❌ 不要输出 Markdown 行程正文（如 Day 1 / ## 标题）
- ✅ 直接以 \`{\` 开头，以 \`}\` 结尾
- ✅ 若模型会思考，请在思考结束后只把 JSON 作为最终可见答案

【字段值规范】
- "reason"：纯文本推荐理由，2-3 句话，**不要 emoji 也不要"推荐理由："前缀**
- "bestSeason"：纯季节描述，如 "4-10 月" 或 "6-9 月最佳"
- "estimateCost"：纯价格范围，如 "800-1000 元/人"
- "hotel"：纯住宿建议文本，**不要 emoji 也不要"住宿建议："前缀**
- "tips"：数组，每项是一条纯文本贴士，**不要 emoji 也不要数字编号**
- "daysList[].title"：纯标题，如 "Day 1 · 泰山脚下热身"（不要 emoji）
- "daysList[].desc"：纯行程描述，写清上午/下午/晚间，可点名当地美食与体验
- "daysList[].highlights"：当天可检索标签数组（3-5 个），每项为对象：
  - "type"：只能是 spot / food / culture 之一（禁止 vibe、experience）
  - "label"：具体实体名称，2-10 字，不要加前缀
  - spot：当天真实景点全名或常用名，如 "布达拉宫"、"八廓街"、"罗布林卡"
  - food：当地具体美食名，如 "藏式甜茶"、"藏式火锅"、"牦牛肉干"
  - culture：可指认的人文活动/场所，如 "大昭寺转经"、"藏戏表演"
  【硬性要求】
  - 禁止抽象词：抵达入住、独特体验、高原初体验、悠闲午后、告别高原、慢生活、城市氛围等
  - 优先使用当天 spots 里的景点名；每天至少 2 个 spot，至少 1 个 food 或 culture
  - 每个 label 都应能对应真实地点/食物/活动，便于图片检索
  - **整程 highlights 的 label 不得跨天重复**：同一景点/美食/人文标签整份行程只出现一次（例如「大昭寺」「八廓街」只能出现在一天）
  - 若某景点在多天描述中再次提到，也不要再放进后几天的 highlights；改用当天其他未出现过的景点或美食
- "daysList[].spots"：**景点对象数组**（不是字符串！），用于后续路线规划，每个对象必须包含：
  - "name"：景点规范全名（如"故宫博物院"、"慕田峪长城"、"涠洲岛"）
  - "city"：景点所在城市（如"北京"、"北海"）
  - "lat"：景点纬度（数字，保留 2-4 位小数，必须真实可用）
  - "lng"：景点经度（数字，保留 2-4 位小数，必须真实可用）
  - "province"：景点所在省份（如"北京"、"广西"）
  【关键】坐标必须真实准确，是后续地图路线规划的核心数据，请务必输出

## 输出示例（仅作格式参考，不要照抄内容）
{"destination":"大理","heroTags":["苍山洱海","白族文化","洱海风光"],"reason":"大理兼具自然风光与少数民族文化，节奏舒缓适合休闲度假。","bestSeason":"3-5月、9-11月","estimateCost":"1000-3000元/人","hotel":"建议住在古城内或才村附近，客栈为主，150-300元/晚","tips":["苍山海拔较高，注意防晒","紫外线强，备好墨镜","租电动车环洱海更方便","古城石板路多，穿平底鞋"],"days":3,"cities":1,"budget":"2000","daysList":[{"title":"Day 1 · 抵达大理","desc":"晚间从广州南站出发，按高铁建议优先前往大理；抵达后入住古城客栈，仅安排附近轻松散步，可尝尝乳扇。","highlights":[{"type":"spot","label":"大理古城"},{"type":"spot","label":"五华楼"},{"type":"food","label":"大理乳扇"}],"spots":[{"name":"大理古城","city":"大理","lat":25.69,"lng":100.16,"province":"云南"},{"name":"五华楼","city":"大理","lat":25.69,"lng":100.17,"province":"云南"}]},{"title":"Day 2 · 环洱海","desc":"包车或电动车环洱海，途经喜洲、双廊，午餐可安排白族三道茶与特色小吃。","highlights":[{"type":"spot","label":"喜洲古镇"},{"type":"spot","label":"双廊"},{"type":"food","label":"白族三道茶"},{"type":"culture","label":"白族民居"}],"spots":[{"name":"喜洲古镇","city":"大理","lat":25.84,"lng":100.13,"province":"云南"},{"name":"双廊","city":"大理","lat":25.91,"lng":100.19,"province":"云南"},{"name":"小普陀","city":"大理","lat":25.93,"lng":100.21,"province":"云南"}]},{"title":"Day 3 · 登苍山","desc":"乘坐索道上苍山，俯瞰洱海全景。","highlights":[{"type":"spot","label":"苍山"},{"type":"spot","label":"洗马潭大索道"},{"type":"food","label":"大理饵丝"}],"spots":[{"name":"苍山","city":"大理","lat":25.68,"lng":100.22,"province":"云南"},{"name":"洗马潭大索道","city":"大理","lat":25.66,"lng":100.23,"province":"云南"}]}]}
`
  prompt += `
## 每日行程真实性与路线数据规则（必须执行）
1. 每天按上午、午餐/休息、下午、晚间安排真实活动，不要把一天默认压缩成一个景点。
2. 大型景区、主题乐园、长城、国家公园、古镇深度游可以独占一天；普通博物馆、城市地标和街区通常安排 2 个左右；相邻的小型景点可合理组合为 3-4 个。
3. 抵达日、离开日和跨城市移动日要扣除交通与入住时间，减少景点数量；不要为了凑数量安排距离很远或体验重复的景点。用户已填写出发地和出发时段时，Day 1 必须先写去程衔接（出发地 + 时段 + 交通偏好），再安排抵达、入住和附近轻松游览，不要默认排满景点。
4. 同一天景点必须优先选择同一区域或交通顺路的地点，并在 daysList[].desc 中写清上午、下午、晚间安排和必要的交通衔接。Day 2 及之后不要再重复出发信息。
5. 每个 daysList[].spots[] 景点对象必须包含 name、city、province、lat、lng；lat/lng 必须是与该景点对应的真实十进制度坐标，不能使用空值、0、城市中心点或虚构坐标。没有可靠坐标的景点不要作为正式行程景点输出。
6. image 不属于 AI 输出字段；前端只使用与景点名称精确匹配的本地图片。没有对应图片时保持空值，不得使用其他景点图片代替。
7. estimateCost 必须与用户预算范围保持一致，不要输出明显超出或低于所选预算档位的费用描述。
8. 每天输出 highlights 3-5 个，类型仅限 spot/food/culture；优先当天景点名 + 具体美食/人文实体，禁止抽象氛围词（如抵达入住、独特体验、悠闲午后）。
9. 整份行程的 highlights.label 必须全局唯一，禁止跨天重复同一标签（如 Day1 已有「八廓街」，后续天不得再出现）。
`
  return prompt
}

async function generatePlan() {
  if (isGenerating.value) return

  fieldErrors.origin = !form.origin?.trim()
  fieldErrors.startDate = !form.startDate
  if (fieldErrors.origin || fieldErrors.startDate) {
    const missing = []
    if (fieldErrors.origin) missing.push('出发地')
    if (fieldErrors.startDate) missing.push('出发日期')
    showActionToast(`请先填写${missing.join('和')}`, 'error')
    const focusEl = fieldErrors.origin ? originInput.value : startDateInput.value
    focusEl?.focus?.()
    focusEl?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    return
  }

  isGenerating.value = true
  errorMsg.value = ''
  planGenerated.value = true
  tagImageByKey.clear()
  resetWeather()

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
      resp = await chatWithVision([userMessage], { maxTokens: 4096, timeoutMs: 120000 })
    } else {
      // 纯文本 → DeepSeek
      userMessage = { role: 'user', content: prompt }
      resp = await chat([userMessage], { maxTokens: 4000 })
    }

    // 解析响应
    const content = typeof resp.choices?.[0]?.message?.content === 'string'
      ? resp.choices[0].message.content.trim()
      : ''
    if (!content) throw new Error('AI 服务未返回可用文本内容')
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
    plan.transport = buildTransportSnapshot()
    syncBudgetFields()

    // 尝试获取主目的地城市图（作为 hero 背景）
    if (plan.destination) {
      const heroImg = getSpotImageByName(plan.destination)
      if (heroImg) plan.heroImage = heroImg
    }
    // 没找到时，用第一天第一个景点的图片
    if (!plan.heroImage && data.daysList?.[0]?.spots?.[0]) {
      const firstSpot = data.daysList[0].spots[0]
      const firstSpotName = typeof firstSpot === 'string' ? firstSpot : firstSpot?.name
      const firstSpotImg = getSpotImageByName(firstSpotName)
      if (firstSpotImg) plan.heroImage = firstSpotImg
    }

    // 解析每日行程，附加图片；并保证 Day 1 有去程衔接；标签整程去重
    plan.daysList = normalizePlanHighlights(
      ensureDay1InboundDesc((data.daysList || []).map(day => {
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
        return { title: day.title, desc: day.desc, spots, highlights: day.highlights || [] }
      }))
    )
    if (plan.daysList.length === 0) throw new Error('AI 返回的行程为空')

    // 行程生成后并行拉取目的地一周天气（失败不影响行程展示）
    loadTripWeather(plan.destination || inputText.value, form.startDate)

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
      loadTripWeather(plan.destination || inputText.value, form.startDate)
      showActionToast('已为你生成推荐行程', 'info')
    }
  } finally {
    isGenerating.value = false
  }
}

function fallbackGenerate() {
  plan.days = form.days
  plan.cities = Math.min(Math.max(Math.floor(form.days / 2), 1), 5)
  plan.transport = buildTransportSnapshot()
  syncBudgetFields()
  plan.destination = plan.destination || '精选目的地'
  plan.reason = plan.reason || `结合你从${form.origin || '出发地'}出发、偏好${transportPreferenceLabels[form.transportPreference]}的行程需求，已生成可执行的 ${form.days} 天方案。`

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
  const rawDays = []
  for (let i = 0; i < form.days; i++) {
    const city = pickedCities[i % pickedCities.length]
    const spotsNames = spotPool[city] || ['当地景点']
    // 给 fallback 景点也带上 imageUrl
    const spots = spotsNames.slice(0, 2 + (i % 2)).map(name => {
      // 优先精确匹配
      let url = getSpotImageByName(name)
      return { name, image: url || '' }
    })
    if (i === 0) {
      rawDays.push({
        title: `Day 1 · 抵达${city}`,
        desc: `去程衔接：${formatDepartureSummary(plan.transport)}抵达后入住并安排附近轻松游览。`,
        spots: spots.slice(0, 2),
        highlights: spots.slice(0, 2).map((s) => ({ type: 'spot', label: s.name, image: s.image || '' })),
      })
    } else {
      rawDays.push({
        title: `Day ${i + 1} · ${city}`,
        desc: `在${city}安排当地景点与特色体验。`,
        spots,
        highlights: spots.map((s) => ({ type: 'spot', label: s.name, image: s.image || '' })),
      })
    }
  }
  plan.daysList = normalizePlanHighlights(rawDays)
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
      title: `${plan.days}天${plan.cities}城行程 · ${plan.destination || '精选目的地'}`,
      destination: plan.destination,
      days: plan.days,
      cities: plan.cities,
      budget: plan.budget,
      budgetLabel: plan.budgetLabel,
      estimateCost: plan.estimateCost,
      reason: plan.reason,
      bestSeason: plan.bestSeason,
      hotel: plan.hotel,
      tips: plan.tips,
      heroImage: plan.heroImage,
      heroTags: plan.heroTags,
      daysList: plan.daysList,
      weather: weather.days?.length
        ? {
            city: weather.city,
            admin1: weather.admin1,
            mode: weather.mode,
            note: weather.note,
            days: weather.days
          }
        : null,
      userInput: savedUserInput,
      imageAnalysis: imageInsight,
      preferenceText: prefData.value ? JSON.stringify(prefData.value) : '',
      startDate: form.startDate,
      transport: plan.transport || buildTransportSnapshot()
    }

    // 保存完整行程
    const planResult = await planStore.savePlan(planData)
    if (!planResult.ok) {
      showActionToast(planResult.msg || '保存行程失败', 'error')
      return
    }

    // 同步添加到收藏（与当前旅行规划报告结构一致）
    const favoriteResult = await favoriteStore.addFavorite({
      type: '行程',
      name: planData.title,
      description: [
        plan.destination ? `目的地：${plan.destination}` : '',
        plan.estimateCost || plan.budgetLabel ? `预算：${plan.estimateCost || plan.budgetLabel}` : '',
        form.startDate ? `出发：${form.startDate}` : '',
        inputText.value ? `想法：${inputText.value}` : ''
      ].filter(Boolean).join(' · ') || `AI 生成的 ${plan.days} 天行程`,
      image: plan.heroImage || '',
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
  const departure = plan.transport ? formatDepartureSummary(plan.transport) : ''
  const header = [
    plan.destination ? `目的地：${plan.destination}` : '',
    departure ? `出发信息：${departure}` : '',
    plan.estimateCost ? `预估费用：${plan.estimateCost}` : ''
  ].filter(Boolean).join('\n')
  const body = plan.daysList.map((d, i) => {
    const highlightText = (d.highlights || []).map(h => h.label).join('、')
    return `${d.title}${i === 0 ? '（去程衔接）' : ''}\n${d.desc}\n标签：${highlightText || '无'}`
  }).join('\n\n')
  const weatherText = weather.days?.length
    ? [
        `天气预报（${weather.city || plan.destination || ''} · ${weatherModeLabel(weather.mode)}）：`,
        weather.note || '',
        ...weather.days.map((d) => {
          const pop = d.precipitation_probability != null ? `降水${d.precipitation_probability}%` : (d.precipitation_sum != null ? `降水${d.precipitation_sum}mm` : '')
          const ref = d.source === 'historical' && d.reference_date ? `（参考${d.reference_date}）` : ''
          return `${d.date} ${d.weekday} ${d.summary} ${formatTemp(d.temp_max)}/${formatTemp(d.temp_min)} ${pop}${ref}`.trim()
        })
      ].filter(Boolean).join('\n')
    : ''
  const text = [header, weatherText, body].filter(Boolean).join('\n\n')
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
.field-required { color: #C23B22; }
.day-val { color: #0D6B5C; font-weight: 600; }
.option-input { width: 100%; padding: 8px 12px; border: 1px solid #E5E0D6; border-radius: 8px; font-size: 13px; font-family: 'Noto Sans SC', sans-serif; color: #1A1A2E; background: #F8F6F0; }
.option-input:focus { outline: none; border-color: #0D6B5C; }
.option-input.is-invalid { border-color: #C23B22; background: #FFF7F5; }
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

.departure-card {
  margin-bottom: 14px; padding: 14px 16px;
  background: linear-gradient(145deg, #F6FBF8, #FFFDF8);
  border: 1px solid #DCE8E2; border-radius: 12px;
}
.departure-head {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 8px; font-size: 14px; font-weight: 700; color: #0D6B5C;
}
.departure-summary { margin: 0 0 12px; font-size: 13px; line-height: 1.7; color: #3A3A4E; }
.departure-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
.departure-item {
  padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,.82);
  border: 1px solid #E7EFEA;
}
.departure-label { display: block; margin-bottom: 4px; font-size: 11px; color: #8B8B9E; }
.departure-item strong { font-size: 13px; color: #183D36; font-weight: 700; line-height: 1.4; }
.departure-note { margin: 10px 0 0; font-size: 12px; color: #8B8B9E; line-height: 1.6; }

.weather-card {
  margin: 0 0 16px;
  padding: 14px 16px;
  background: linear-gradient(145deg, #F7FBF9, #FFFDF8);
  border: 1px solid #D7E8E1;
  border-radius: 12px;
}
.weather-head {
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
  font-size: 13px; font-weight: 700; color: #183D36;
}
.weather-city { margin-left: auto; font-size: 12px; font-weight: 600; color: #5C5C6E; }
.weather-note {
  margin: 0 0 12px; font-size: 12px; line-height: 1.6; color: #5C5C6E;
  padding: 8px 10px; background: rgba(13, 107, 92, 0.06); border-radius: 8px;
}
.weather-note.is-historical {
  background: #FFF6E8; color: #8A5A16; border: 1px solid #F0D7B0;
}
.weather-loading, .weather-error {
  margin: 0; font-size: 13px; color: #8B8B9E; line-height: 1.6;
}
.weather-error { color: #C23B22; }
.weather-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}
.weather-day {
  position: relative;
  padding: 10px 8px;
  background: #fff;
  border: 1px solid #E5E0D6;
  border-radius: 10px;
  text-align: center;
  min-width: 0;
}
.weather-day.is-ref { border-color: #E7D59A; background: #FFFDF5; }
.weather-day-top { display: flex; flex-direction: column; gap: 2px; margin-bottom: 6px; }
.weather-weekday { font-size: 12px; font-weight: 700; color: #1A1A2E; }
.weather-date { font-size: 11px; color: #8B8B9E; }
.weather-summary {
  font-size: 12px; font-weight: 600; color: #0D6B5C; margin-bottom: 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.weather-temp { font-size: 12px; color: #3A3A4E; margin-bottom: 4px; }
.weather-temp strong { color: #1A1A2E; }
.weather-temp span { color: #8B8B9E; }
.weather-meta { font-size: 10px; color: #8B8B9E; }
.weather-badge {
  margin-top: 6px; display: inline-block; padding: 1px 6px;
  border-radius: 999px; background: #FBF3DD; color: #7A5A12;
  font-size: 10px; font-weight: 700;
}

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
.days-head {
  display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
  margin: 0 0 14px; flex-wrap: wrap;
}
.days-title { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 15px; font-weight: 700; color: #0D6B5C; }
.days-title svg { flex-shrink: 0; }
.days-hint { font-size: 12px; color: #8B8B9E; font-weight: 500; line-height: 1.4; }
.day-card { display: flex; gap: 14px; margin-bottom: 14px; padding: 14px; background: #FAFAF5; border: 1px solid #F0EDE6; border-radius: 14px; transition: all 0.2s; }
.day-card:last-child { margin-bottom: 0; }
.day-card:hover { border-color: #0D6B5C; background: #fff; box-shadow: 0 2px 8px rgba(13, 107, 92, 0.06); }
.day-card.is-arrival-day { border-color: #C8DDD4; background: linear-gradient(145deg, #F7FBF9, #FFFDF8); }
.day-badge { flex-shrink: 0; width: 56px; height: 56px; border-radius: 12px; background: linear-gradient(135deg, #1A8A7A 0%, #0D6B5C 100%); color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(13, 107, 92, 0.25); }
.day-body { flex: 1; min-width: 0; }
.day-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
.day-title { margin: 0; font-size: 14.5px; font-weight: 700; color: #1A1A2E; }
.day-tag { padding: 2px 8px; border-radius: 999px; background: #E4F2EC; color: #0D6B5C; font-size: 11px; font-weight: 700; }
.day-desc { margin: 0 0 10px; font-size: 13px; line-height: 1.7; color: #5C5C6E; }
.day-highlights { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 10px; }
.day-highlight {
  padding: 4px 10px; border-radius: 14px; font-size: 12px; font-weight: 600;
  border: 1px solid transparent; line-height: 1.4;
}
.day-highlight.type-food { color: #9A5B16; background: #FFF6E8; border-color: #F0D7B0; }
.day-highlight.type-culture { color: #2F4F8A; background: #EEF3FB; border-color: #C9D7F0; }
.day-highlight.type-experience { color: #0D6B5C; background: #E8F5F1; border-color: #B9DDD4; }
.day-highlight.type-vibe { color: #7A5A12; background: #FBF3DD; border-color: #E7D59A; }
.day-highlight.type-spot { color: #3D5A80; background: #EEF2F7; border-color: #C5D0E0; }
.day-highlight.has-preview { cursor: pointer; }

.tag-preview-card {
  position: fixed;
  z-index: 9999;
  width: 220px;
  background: #fff;
  border: 1px solid #E5E0D6;
  border-radius: 12px;
  box-shadow: 0 10px 28px rgba(26, 26, 46, 0.16);
  overflow: hidden;
  pointer-events: auto;
}
.tag-preview-media {
  width: 100%;
  height: 140px;
  background: #F5F3EE;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tag-preview-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.tag-preview-state {
  font-size: 12px;
  color: #8B8B9E;
  padding: 0 12px;
  text-align: center;
}
.tag-preview-meta {
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tag-preview-meta strong {
  font-size: 13px;
  color: #1A1A2E;
  font-weight: 700;
  line-height: 1.3;
}
.tag-preview-meta span {
  font-size: 11px;
  color: #8B8B9E;
  line-height: 1.3;
}

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
  .weather-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .page-container { width: 100%; padding: 24px 16px; }
  .input-card, .result-card { padding: 20px; border-radius: 16px; }
  .preview-item { width: 80px; height: 80px; }
  .departure-grid, .info-row { grid-template-columns: 1fr; }
  .weather-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
