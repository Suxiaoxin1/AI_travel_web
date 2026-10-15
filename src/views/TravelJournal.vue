<template>
  <div class="page-container">
    <PageHero v-bind="activeHero" @action="focusCreationStart" />

    <div class="creation-mode-switch" role="tablist" aria-label="创作方式">
      <button
        type="button"
        role="tab"
        class="mode-chip"
        :class="{ active: creationMode === 'journal' }"
        :aria-selected="creationMode === 'journal'"
        @click="setCreationMode('journal')"
      >
        <span class="mode-chip-kicker">PAGE</span>
        手账成页
      </button>
      <button
        type="button"
        role="tab"
        class="mode-chip"
        :class="{ active: creationMode === 'volo' }"
        :aria-selected="creationMode === 'volo'"
        @click="setCreationMode('volo')"
      >
        <span class="mode-chip-kicker">FILM</span>
        VOLO 相册
      </button>
    </div>

    <!--
      FILM VOLO 成片工作区（与手账 PAGE 模式互斥）
      链路：本组件表单 → filmCompose.onStartCompose → odyssee :3000
      （上传 / 建任务 / 轮询）；主站 :8081 不参与成片。
    -->
    <VoloFilmWorkspace v-if="creationMode === 'volo'" ref="voloWorkspaceRef" />

    <template v-else>
    <div class="journal-steps" aria-label="手帐创作流程">
      <div class="journal-step active"><span>01</span><strong>选择风格</strong></div>
      <i></i>
      <div class="journal-step" :class="{ active: photos.length > 0 }"><span>02</span><strong>上传照片</strong></div>
      <i></i>
      <div class="journal-step" :class="{ active: Boolean(form.location || form.date || form.mood) }"><span>03</span><strong>填写信息</strong></div>
      <i></i>
      <div class="journal-step" :class="{ active: journalGenerated }"><span>04</span><strong>生成手帐</strong></div>
    </div>
    <div class="journal-layout">
      <div id="journal-form" class="journal-form">
        <!-- 手帐风格选择 -->
        <div class="form-section">
          <div class="section-heading">
            <div>
              <span class="section-kicker">STEP 01</span>
              <h3 class="section-title">选择手帐风格</h3>
            </div>
            <span class="section-note">{{ styleLabels[form.style] }}</span>
          </div>
          <div class="style-grid">
            <button v-for="s in journalStyles" :key="s.key"
              :class="['style-card', { active: form.style === s.key }]"
              :title="s.hint"
              @click="selectStyle(s.key)">
              <span
                class="style-swatch"
                :class="s.preview ? 'swatch-photo' : 'swatch-unified'"
                :style="s.preview ? { backgroundImage: `url(${s.preview})` } : undefined"
                aria-hidden="true"
              ></span>
              <span class="style-name">{{ s.label }}</span>
              <span class="style-hint">{{ s.hint }}</span>
            </button>
          </div>
        </div>

        <!-- 照片上传 -->
        <div class="form-section" id="journal-photos">
          <div class="section-heading compact">
            <div>
              <span class="section-kicker">STEP 02</span>
              <h3 class="section-title">放入旅途照片</h3>
            </div>
            <span class="section-note">{{ photos.length }}/9</span>
          </div>
          <div class="upload-zone" :class="{ dragging: isDragging }" @dragover.prevent="isDragging = true" @dragleave="isDragging = false" @drop.prevent="handleDrop" @click="triggerUpload">
            <svg class="upload-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#B8C5B0" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <p class="upload-text">点击或拖拽上传旅途照片</p>
            <p class="upload-hint">建议 3—9 张 · 支持 JPG / PNG</p>
            <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="handleFiles" />
          </div>
          <div class="photo-list" v-if="photos.length">
            <div v-for="(p, i) in photos" :key="i" class="photo-thumb">
              <img :src="p" alt="" />
              <button class="photo-remove" @click.stop="removePhoto(i)">×</button>
            </div>
          </div>
        </div>

        <!-- 旅行信息 -->
        <div class="form-section">
          <div class="section-heading compact">
            <div>
              <span class="section-kicker">STEP 03</span>
              <h3 class="section-title">补充旅途信息</h3>
            </div>
            <span class="section-note">可选</span>
          </div>
          <div class="info-row">
            <div class="info-group">
              <label>旅行地点</label>
              <input v-model="form.location" class="info-input" placeholder="例如：张家界" />
            </div>
            <div class="info-group">
              <label>旅行日期</label>
              <input v-model="form.date" type="date" class="info-input" />
            </div>
          </div>
          <div class="info-group full">
            <label>旅行心情（可选）</label>
            <textarea v-model="form.mood" class="info-textarea" placeholder="记录一下旅途中的心情与故事…" rows="3"></textarea>
          </div>
          <div class="info-group full">
            <label>IP 贴纸</label>
            <select v-model="form.ipSticker" class="info-input" :disabled="isGenerating || ipStickerLoading">
              <option value="auto">自动（按地点/心情匹配）</option>
              <option value="none">不使用</option>
              <option v-for="ip in ipStickerOptions" :key="ip.id" :value="ip.id">
                {{ ip.name }}（{{ (ip.stickers || []).length }} 枚）
              </option>
            </select>
          </div>
        </div>

        <div class="form-actions form-actions-row">
          <button
            class="action-btn action-purple"
            type="button"
            @click="generateJournal"
            :disabled="isGenerating"
          >
            <svg v-if="!isGenerating" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L17.18 22 12 18.27 6.82 22 8 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
            <svg v-else class="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/><polyline points="21 3 21 9 15 9"/></svg>
            {{ isGenerating ? '排版中…' : '生成手帐日记' }}
          </button>
          <button
            class="action-btn action-ghost"
            type="button"
            @click="generateTemplateInstant"
            :disabled="isGenerating"
            title="不调 AI，后端无 Key/离线也能出图（模板默认文案）"
          >
            本地模板秒出
          </button>
        </div>
        <p class="action-hint">流程：选风格 → 上传照片（3—9 张）→ 填写信息 → 生成排版。</p>
        <label class="cutout-toggle" title="AI 识别照片主体并抠成贴纸；失败时自动跳过，不影响出图">
          <input type="checkbox" v-model="form.enableCutout" :disabled="isGenerating" />
          主体贴纸（AI 抠图，约多花 10—60 秒）
        </label>
      </div>

      <!-- 右侧：预览区 -->
      <div class="journal-preview">
        <div class="preview-header">
          <div>
            <span class="section-kicker">STEP 04</span>
            <h3 class="preview-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A8A7A" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              旅行记忆预览
            </h3>
          </div>
          <span class="preview-style-label">{{ styleLabels[form.style] }}</span>
          <button type="button" class="new-journal-btn" @click="startNewJournal">
            新建手账
          </button>
        </div>
        <div class="preview-area style-retro preview-area--diary-next">
          <div v-if="isGenerating" class="preview-stage-card preview-loading">
            <svg class="loading-spinner" viewBox="0 0 40 40" aria-hidden="true">
              <circle cx="20" cy="20" r="16" class="spinner-ring" />
            </svg>
            <p class="preview-progress-label">{{ generateProgress.label || '正在排版手帐…' }}</p>
            <div
              class="preview-progress-track"
              role="progressbar"
              :aria-valuenow="generateProgress.percent"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="generateProgress.label || '手帐生成进度'"
            >
              <div class="preview-progress-fill" :style="{ width: `${generateProgress.percent}%` }"></div>
            </div>
            <span class="preview-progress-meta">{{ generateProgress.percent }}%</span>
            <ol class="preview-progress-steps" aria-hidden="true">
              <li
                v-for="step in generateProgressSteps"
                :key="step.stage"
                :class="{
                  done: generateProgress.percent >= step.doneAt,
                  active: generateProgress.stage === step.stage
                }"
              >{{ step.label }}</li>
            </ol>
          </div>
          <div v-else-if="diaryNextPreviewUrl" class="journal-canvas-shell diary-next-preview-shell">
            <img
              class="diary-next-preview-img"
              :src="diaryNextPreviewUrl"
              alt="手帐排版预览"
            />
          </div>
          <div v-else class="preview-stage-card preview-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4C8B8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <p>生成后在此预览你的手帐</p>
            <span class="empty-steps">选择风格 → 上传照片 → 填写信息 → 点击生成</span>
          </div>
        </div>
        <p v-if="diaryNextPreviewUrl" class="preview-tip diary-next-edit-tip">
          当前为模板排版成图预览，可保存到「我的手账」或导出 PNG
        </p>
        <button
          v-if="journalContent"
          class="save-journal-btn"
          @click="saveJournal"
          :disabled="isSaving"
        >
          {{ isSaving ? '保存中…' : '保存手账' }}
        </button>
        <button v-if="diaryNextPreviewUrl" class="export-journal-btn" @click="exportJournal">导出 PNG</button>
      </div>
    </div>
    </template>

  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { normalizeMediaUrl } from '../utils/mediaUrl.js'
import { generateJournalPage, generateTemplatePreview } from '../utils/journalGenerate.js'
import { normalizeVisionAnalysis } from '../utils/journalCopy.js'
import { useAuthStore } from '../stores/authStore.js'
import { useJournalStore } from '../stores/journalStore.js'
import { useShareStore } from '../stores/shareStore.js'
import { useUiStore } from '../stores/uiStore.js'
import PageHero from '../components/PageHero.vue'
import VoloFilmWorkspace from '../components/VoloFilmWorkspace.vue'
import { pageHeroConfig } from '../config/pageHeroConfig.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const journalStore = useJournalStore()
const shareStore = useShareStore()
const uiStore = useUiStore()

const form = reactive({
  style: 'retro',
  location: '',
  ipSticker: 'auto',
  enableCutout: true,
  date: '',
  mood: ''
})

const journalStyles = [
  { key: 'retro', label: '复古胶片', hint: '胶片齿孔 · 牛皮纸渍', preview: '/images/journal-styles/preview-retro.jpg' },
  { key: 'clean', label: '简约清新', hint: '活页孔 · 横线便签', preview: '/images/journal-styles/preview-clean.jpg' },
  { key: 'vivid', label: '多彩活泼', hint: '和纸胶带 · 彩色纸屑', preview: '/images/journal-styles/preview-vivid.jpg' },
  { key: 'dark', label: '暗黑质感', hint: '金线框 · 皮革底', preview: '/images/journal-styles/preview-dark.jpg' },
  { key: 'watercolor', label: '水彩手绘', hint: '淡彩晕染 · 毛边纸', preview: '/images/journal-styles/preview-watercolor.jpg' },
  { key: 'magazine', label: '杂志排版', hint: '新闻纸 · 裁切角', preview: '/images/journal-styles/preview-magazine.jpg' }
]

const photos = ref([])
const ipStickerOptions = ref([])
const ipStickerLoading = ref(true)
const creationMode = ref('journal') // journal | volo
const voloWorkspaceRef = ref(null)
const isDragging = ref(false)
const fileInput = ref(null)
const isGenerating = ref(false)
const generateProgress = ref({ stage: '', percent: 0, label: '' })
const generateProgressSteps = [
  { stage: 'aspects', label: '分析照片', doneAt: 14 },
  { stage: 'layout', label: 'AI 排版', doneAt: 70 },
  { stage: 'cutout', label: '主体抠图', doneAt: 77 },
  { stage: 'skin', label: '风格素材', doneAt: 84 },
  { stage: 'render', label: '合成预览', doneAt: 96 }
]
const diaryNextPreviewUrl = ref('')
const diaryNextLayout = ref(null)
const layoutEngine = ref('diary-layout') // diary-layout（AI 排版）| diary-template（本地模板秒出）
const activeHero = computed(() => {
  if (creationMode.value === 'volo') {
    return {
      eyebrow: 'FILM VOLO · 相册成片',
      title: '把旅途照片剪成一段能回看的小电影',
      description: '上传 3～8 张照片，填写地点与心得，约几分钟生成可回看的旅途小电影。',
      primaryLabel: '开始制作',
      primaryTo: '#volo-workspace',
      note: '3–8 张照片 · 带旁白 AI 成片 · 约 1–数分钟',
      theme: 'journal'
    }
  }
  return pageHeroConfig.journal
})
const isSaving = ref(false)
const journalContent = ref('')
const journalGenerated = ref(false)
const videoUrl = ref('')
const visionAnalysis = ref(null)
const savedJournalId = ref(null)

const styleLabels = { retro: '复古胶片', clean: '简约清新', vivid: '多彩活泼', dark: '暗黑质感', watercolor: '水彩手绘', magazine: '杂志排版' }

function triggerUpload() { fileInput.value.click() }

// IP 贴纸下拉：页面加载时读清单，失败则只剩 自动/不使用 两项
async function loadIpStickerOptions() {
  try {
    const { loadIpManifest, listIps } = await import('../modules/journal/ip-stickers.js')
    await loadIpManifest()
    ipStickerOptions.value = listIps()
    if (form.ipSticker !== 'auto' && form.ipSticker !== 'none'
      && !ipStickerOptions.value.some((ip) => ip.id === form.ipSticker)) {
      form.ipSticker = 'auto'
    }
  } catch (e) {
    console.warn('[Diary] IP 清单加载失败:', e?.message || e)
    ipStickerOptions.value = []
  } finally {
    ipStickerLoading.value = false
  }
}
loadIpStickerOptions()

function selectStyle(key) {
  form.style = key
}

async function startNewJournal() {
  const hasDraft = photos.value.length || journalContent.value || videoUrl.value || diaryNextPreviewUrl.value
  if (hasDraft && !window.confirm('当前手账内容尚未清空，确定新建一份手账吗？')) return
  form.style = 'retro'
  form.location = ''
  form.ipSticker = 'auto'
  form.date = ''
  form.mood = ''
  photos.value = []
  journalContent.value = ''
  videoUrl.value = ''
  creationMode.value = 'journal'
  visionAnalysis.value = null
  diaryNextPreviewUrl.value = ''
  diaryNextLayout.value = null
  layoutEngine.value = 'diary-layout'
  savedJournalId.value = null
  journalGenerated.value = false
  if (fileInput.value) fileInput.value.value = ''
  await router.replace({ name: 'TravelJournal', query: {} })
}

function serializeLayout() {
  return {
    version: 3,
    engine: layoutEngine.value,
    template: form.style,
    ipSticker: form.ipSticker,
    diaryNextLayout: diaryNextLayout.value || null,
    visionAnalysis: visionAnalysis.value || null
  }
}

function restoreLayout(record) {
  const layoutData = record.layout_json || {}
  layoutEngine.value = layoutData.engine || 'diary-layout'
  form.style = layoutData.template || record.style || 'retro'
  form.location = record.location || ''
  form.date = record.travel_date || ''
  form.mood = record.mood || ''
  form.ipSticker = layoutData.ipSticker || 'auto'
  photos.value = Array.isArray(record.photos)
    ? record.photos.map((src) => normalizeMediaUrl(src) || src)
    : []
  journalContent.value = record.content_html || ''
  videoUrl.value = record.video_url || ''
  visionAnalysis.value = layoutData.visionAnalysis
    ? normalizeVisionAnalysis(layoutData.visionAnalysis, {
        photoCount: Array.isArray(record.photos) ? record.photos.length : 0,
        location: record.location || '',
        mood: record.mood || '',
        style: form.style
      })
    : null
  diaryNextLayout.value = layoutData.diaryNextLayout || null
  diaryNextPreviewUrl.value = ''
  journalGenerated.value = Boolean(journalContent.value || videoUrl.value || photos.value.length || diaryNextLayout.value)
  creationMode.value = videoUrl.value ? 'volo' : (String(route.query.mode || '').toLowerCase() === 'volo' ? 'volo' : 'journal')
}

async function loadSavedJournal() {
  const id = Number(route.query.journalId)
  if (!id) return
  const result = await journalStore.getJournal(id)
  if (!result.ok) {
    alert(result.msg || '手账加载失败')
    return
  }
  savedJournalId.value = id
  restoreLayout(result.record)
  if (diaryNextLayout.value && photos.value.length) {
    try {
      const { composeDiaryNextPreview } = await import('../utils/diaryNextBridge.js')
      const composed = await composeDiaryNextPreview(diaryNextLayout.value, photos.value, { skipSkin: true })
      diaryNextPreviewUrl.value = composed.previewUrl
      diaryNextLayout.value = composed.layout
    } catch (err) {
      console.warn('恢复排版预览失败:', err)
    }
  }
}

function handleFiles(e) {
  visionAnalysis.value = null
  diaryNextPreviewUrl.value = ''
  diaryNextLayout.value = null
  journalGenerated.value = false
  journalContent.value = ''
  Array.from(e.target.files).slice(0, 9).forEach(f => {
    const r = new FileReader()
    r.onload = ev => photos.value.push(ev.target.result)
    r.readAsDataURL(f)
  })
}

function removePhoto(index) {
  photos.value.splice(index, 1)
  visionAnalysis.value = null
  diaryNextPreviewUrl.value = ''
  diaryNextLayout.value = null
  journalGenerated.value = false
  journalContent.value = ''
}

function handleDrop(e) {
  visionAnalysis.value = null
  diaryNextPreviewUrl.value = ''
  diaryNextLayout.value = null
  journalGenerated.value = false
  journalContent.value = ''
  Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).slice(0, 9 - photos.value.length).forEach(f => {
    const r = new FileReader()
    r.onload = ev => photos.value.push(ev.target.result)
    r.readAsDataURL(f)
  })
  isDragging.value = false
}

watch(() => route.query.journalId, loadSavedJournal, { immediate: true })
watch(() => route.query.mode, syncCreationModeFromRoute, { immediate: true })

function ensureLoggedIn(action = '继续操作') {
  if (authStore.currentUser) return true
  alert(`请先登录后再${action}`)
  router.push({ path: '/auth', query: { redirect: '/journal' } })
  return false
}

async function exportJournal() {
  if (!diaryNextPreviewUrl.value) {
    if (typeof uiStore.showToast === 'function') uiStore.showToast('暂无可导出成图', 'warn')
    else alert('暂无可导出成图')
    return
  }
  const link = document.createElement('a')
  link.download = `${form.location || '旅行'}-手帐.png`
  link.href = diaryNextPreviewUrl.value
  link.click()
}

/**
 * 手账生成入口：始终走 diary-layout 排版引擎。
 */
async function generateJournal() {
  await runGenerate('diary-layout', '开始生成手帐…', generateJournalPage)
}

/**
 * 本地模板秒出：不调后端，buildLayout 直接合成（无 Key/离线可出图）。
 */
async function generateTemplateInstant() {
  await runGenerate('diary-template', '本地模板排版中…', generateTemplatePreview)
}

async function runGenerate(engine, startLabel, task) {
  if (!ensureLoggedIn('生成手账')) return
  if (!photos.value.length) { alert('请先上传照片'); return }
  if (photos.value.length < 3 || photos.value.length > 9) {
    alert(`模板排版需要 3—9 张照片，当前 ${photos.value.length} 张`)
    return
  }
  isGenerating.value = true
  generateProgress.value = { stage: 'prepare', percent: 4, label: startLabel }
  journalGenerated.value = true
  journalContent.value = engine === 'diary-template' ? '本地模板排版中…' : '正在请求排版方案…'
  visionAnalysis.value = null
  diaryNextPreviewUrl.value = ''
  diaryNextLayout.value = null
  layoutEngine.value = engine

  try {
    const result = await task({
      style: form.style,
      location: form.location,
      date: form.date,
      mood: form.mood,
      photos: photos.value,
      ipSticker: form.ipSticker,
      enableCutout: form.enableCutout !== false,
      onProgress: (progress) => {
        generateProgress.value = {
          stage: progress.stage || '',
          percent: Math.max(0, Math.min(100, Number(progress.percent) || 0)),
          label: progress.label || ''
        }
        if (progress.label) journalContent.value = progress.label
      }
    })
    visionAnalysis.value = result.visionAnalysis
    journalContent.value = result.contentHtml
    diaryNextLayout.value = result.diaryNextLayout || null
    diaryNextPreviewUrl.value = result.previewUrl || ''
    generateProgress.value = { stage: 'done', percent: 100, label: '完成' }
  } catch (err) {
    console.error('生成失败:', err)
    journalContent.value = ''
    journalGenerated.value = false
    diaryNextPreviewUrl.value = ''
    diaryNextLayout.value = null
    generateProgress.value = { stage: '', percent: 0, label: '' }
    uiStore.showToast(err?.message || '生成失败，请稍后重试', 'error')
  } finally {
    isGenerating.value = false
  }
}

function resetModeWorkspace() {
  photos.value = []
  journalContent.value = ''
  videoUrl.value = ''
  visionAnalysis.value = null
  diaryNextPreviewUrl.value = ''
  diaryNextLayout.value = null
  generateProgress.value = { stage: '', percent: 0, label: '' }
  savedJournalId.value = null
  journalGenerated.value = false
  if (fileInput.value) fileInput.value.value = ''
}

function isVoloComposeBusy() {
  const busy = voloWorkspaceRef.value?.isComposeBusy
  if (typeof busy === 'boolean') return busy
  if (busy && typeof busy === 'object' && 'value' in busy) return Boolean(busy.value)
  const status = voloWorkspaceRef.value?.previewStatus
  const raw = status && typeof status === 'object' && 'value' in status ? status.value : status
  return raw === 'composing'
}

function setCreationMode(mode) {
  if (mode !== 'journal' && mode !== 'volo') return
  if (creationMode.value === mode) return
  if (isGenerating.value) {
    uiStore.showToast('请先完成当前生成后再切换', 'warn')
    return
  }
  if (creationMode.value === 'volo' && isVoloComposeBusy()) {
    uiStore.showToast('成片合成中，请稍后再切换', 'warn')
    return
  }
  // 销毁 VOLO 工作区前先释放 blob URL
  if (creationMode.value === 'volo') {
    voloWorkspaceRef.value?.resetAll?.()
  }
  creationMode.value = mode
  resetModeWorkspace()
  const nextQuery = { ...route.query }
  if (mode === 'volo') nextQuery.mode = 'volo'
  else delete nextQuery.mode
  delete nextQuery.journalId
  router.replace({ query: nextQuery }).catch(() => {})
}

function syncCreationModeFromRoute() {
  const mode = String(route.query.mode || '').toLowerCase()
  const wantVolo = mode === 'volo' || mode === 'album' || mode === 'video'
  const next = wantVolo ? 'volo' : 'journal'
  if (creationMode.value === next) {
    return
  }
  // URL 切走 VOLO 时同样拦截合成中状态
  if (creationMode.value === 'volo' && !wantVolo && isVoloComposeBusy()) {
    uiStore.showToast('成片合成中，请稍后再切换', 'warn')
    router.replace({ query: { ...route.query, mode: 'volo' } }).catch(() => {})
    return
  }
  if (creationMode.value === 'volo') {
    voloWorkspaceRef.value?.resetAll?.()
  }
  creationMode.value = next
  if (!wantVolo && !journalContent.value) {
    journalGenerated.value = false
  }
}

function focusCreationStart() {
  const target = creationMode.value === 'volo'
    ? document.getElementById('volo-workspace')
    : document.getElementById('journal-form')
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function saveJournal() {
  if (!authStore.currentUser) {
    alert(creationMode.value === 'volo' ? '请先登录后再保存成片' : '请先登录后再保存手账')
    router.push({ path: '/auth', query: { redirect: '/journal' } })
    return
  }
  isSaving.value = true
  try {
    // 本地预览使用 Data URL；保存时逐张上传，避免把多张 Base64 图片塞进
    // 手账 JSON 请求而触发网关的请求体大小限制。
    const persistedPhotos = []
    for (const [index, photo] of photos.value.entries()) {
      if (typeof photo !== 'string' || !photo.startsWith('data:image/')) {
        persistedPhotos.push(normalizeMediaUrl(photo) || photo)
        continue
      }

      const imageResponse = await fetch(photo)
      const imageBlob = await imageResponse.blob()
      if (!imageBlob.type.startsWith('image/')) {
        throw new Error(`第 ${index + 1} 张照片格式无效`)
      }
      const extension = imageBlob.type.split('/')[1] || 'jpg'
      const uploadResult = await shareStore.uploadImage(new File(
        [imageBlob],
        `journal-photo-${Date.now()}-${index + 1}.${extension}`,
        { type: imageBlob.type }
      ))
      if (!uploadResult.ok || !uploadResult.url) {
        throw new Error(uploadResult.msg || `第 ${index + 1} 张照片上传失败`)
      }
      persistedPhotos.push(normalizeMediaUrl(uploadResult.url) || uploadResult.url)
    }
    photos.value = persistedPhotos

    const title = (visionAnalysis.value?.title || '').trim()
      || (creationMode.value === 'volo'
        ? `${form.location || '旅行'}相册成片`
        : `${form.location || '旅行'}${videoUrl.value ? '视频手账' : '手账'}`)
    const journalData = {
      title,
      style: form.style,
      location: form.location,
      travelDate: form.date,
      mood: form.mood,
      photos: persistedPhotos,
      layoutJson: serializeLayout(),
      contentHtml: journalContent.value,
      videoUrl: videoUrl.value
    }
    const result = savedJournalId.value
      ? await journalStore.updateJournal(savedJournalId.value, journalData)
      : await journalStore.saveJournal(journalData)
    if (result.ok) {
      savedJournalId.value = result.record?.id || savedJournalId.value
      alert(creationMode.value === 'volo' ? '成片已保存' : '手账已保存')
    } else {
      alert(result.msg || '保存失败')
    }
  } catch (err) {
    console.error('保存手账失败:', err)
    alert('保存失败')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
/* 页面容器：宽阔的旅行创作工作台 */
.page-container { max-width: 1180px; width: calc(100% - 48px); margin: 0 auto; padding: 44px 0 72px; }

.page-header { text-align: center; margin-bottom: 20px; }
.page-eyebrow { display: inline-block; margin-bottom: 10px; color: #0D6B5C; font-size: 10px; font-weight: 800; letter-spacing: 2.4px; }
.page-title { font-size: 30px; font-weight: 800; color: #1A1A2E; margin: 0 0 8px; letter-spacing: -0.5px; font-family: 'Noto Sans SC', sans-serif; }
.page-subtitle { font-size: 13px; color: #7B827C; margin: 0; }

.journal-steps { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 0 auto 28px; color: #A3AAA3; }
.creation-mode-switch {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: -6px auto 22px;
}
.mode-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 148px;
  justify-content: center;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid #DCE3DC;
  background: #F7FAF6;
  color: #5C6B62;
  font: 700 13px 'Noto Sans SC', sans-serif;
  cursor: pointer;
  transition: border-color .2s ease, background .2s ease, color .2s ease, transform .2s ease;
}
.mode-chip-kicker {
  font-size: 10px;
  letter-spacing: .12em;
  color: #8D9B90;
}
.mode-chip:hover { transform: translateY(-1px); border-color: #B7C7BB; }
.mode-chip.active {
  background: #0D6B5C;
  border-color: #0D6B5C;
  color: #fff;
  box-shadow: 0 8px 18px rgba(13, 107, 92, 0.22);
}
.mode-chip.active .mode-chip-kicker { color: rgba(255,255,255,.78); }
.mode-chip[aria-selected="true"]:nth-child(2).active,
.mode-chip.active:nth-child(2) {
  background: #9C5A3D;
  border-color: #9C5A3D;
  box-shadow: 0 8px 18px rgba(156, 90, 61, 0.22);
}
.section-note.warn { color: #9C5A3D; font-weight: 700; }
.upload-zone.needed { border-color: #D7AE91; background: #FFF8F0; }
.action-volo-primary {
  flex: 1;
  background: #9C5A3D;
  color: #fff;
  border-color: #9C5A3D;
}
.action-volo-primary:hover:not(:disabled) {
  background: #8A4E34;
  border-color: #8A4E34;
  box-shadow: 0 4px 16px rgba(156, 90, 61, 0.35);
}
.journal-step { display: flex; align-items: center; gap: 7px; font-size: 12px; white-space: nowrap; }
.journal-step span { width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: #EDEFEA; color: #7B827C; font-size: 10px; font-weight: 700; }
.journal-step strong { font-weight: 600; }
.journal-step.active { color: #0D6B5C; }
.journal-step.active span { color: #fff; background: #0D6B5C; box-shadow: 0 4px 10px rgba(13,107,92,0.2); }
.journal-steps i { width: 34px; height: 1px; background: #DCE3DC; }

.journal-layout { display: grid; grid-template-columns: minmax(360px, 0.82fr) minmax(0, 1.18fr); gap: 24px; align-items: start; }
/* ===== 左侧表单 ===== */
.journal-form {
  background: rgba(255,255,255,0.9); border: 1px solid #E5E0D6; border-radius: 22px;
  padding: 26px; box-shadow: 0 10px 30px rgba(43,61,49,0.06);
}

.form-section { margin-bottom: 24px; padding-bottom: 22px; border-bottom: 1px solid #EEF0EB; }
.form-section:last-of-type { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
.section-heading { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 14px; }
.section-heading.compact { margin-bottom: 12px; }
.section-kicker { display: block; margin-bottom: 4px; color: #9BA89D; font-size: 9px; font-weight: 800; letter-spacing: 1.4px; }
.section-title { font-size: 15px; font-weight: 700; color: #1A1A2E; margin: 0; }
.section-note { color: #9BA89D; font-size: 11px; }

/* 风格网格：纸张缩略预览 */
.style-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.style-card {
  display: flex; flex-direction: column; align-items: stretch; gap: 6px;
  padding: 8px 8px 10px; border: 1px solid #E5E0D6; border-radius: 14px;
  background: #FBFAF7; cursor: pointer; transition: all 0.2s; text-align: left;
}
.style-card:hover { border-color: #77B4A6; transform: translateY(-1px); }
.style-card.active { border: 2px solid #0D6B5C; padding: 7px 7px 9px; background: rgba(13,107,92,0.06); box-shadow: 0 5px 14px rgba(13,107,92,0.1); }
.style-swatch {
  display: block; width: 100%; aspect-ratio: 3 / 4; border-radius: 10px;
  border: 1px solid rgba(80, 70, 50, 0.14); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.35);
  background-size: cover; background-position: center top;
  overflow: hidden;
}
/* 有样例图的风格卡铺满真实成图；其余仍用复古胶片底色 */
.swatch-unified {
  background: linear-gradient(160deg, #E9D5B4 0%, #D9C19A 55%, #CDB48A 100%);
}
.swatch-photo {
  background-color: #E8D4B0;
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
}
.style-name { font-size: 12px; color: #3D4038; font-family: 'Noto Sans SC', sans-serif; font-weight: 600; padding: 0 2px; }
.style-hint { font-size: 10px; color: #8B948A; line-height: 1.3; padding: 0 2px; }
.style-card.active .style-name { color: #0D6B5C; }

/* 上传区 */
.upload-zone {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 148px; border: 1.5px dashed #C9D5CB; border-radius: 16px; padding: 24px; cursor: pointer;
  transition: all 0.2s; background: #F8FBF7;
}
.upload-zone:hover, .upload-zone.dragging { border-color: #1A8A7A; background: rgba(26,138,122,0.03); }
.upload-icon { display: flex; margin-bottom: 10px; }
.upload-text { font-size: 13px; color: #5C5C6E; margin: 0 0 4px; }
.upload-hint { font-size: 11px; color: #8B8B9E; margin: 0; }

.photo-list { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 12px; }
.photo-thumb { position: relative; width: 100%; aspect-ratio: 1; border-radius: 10px; overflow: hidden; border: 1px solid #E5E0D6; }
.photo-thumb img { width: 100%; height: 100%; object-fit: cover; }
.photo-remove { position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; border-radius: 50%; border: none; background: rgba(0,0,0,0.5); color: #fff; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

/* 旅行信息 */
.info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.info-group label { display: block; font-size: 12px; color: #5C5C6E; margin-bottom: 6px; }
.info-input {
  width: 100%; padding: 8px 12px; border: 1px solid #E5E0D6; border-radius: 10px;
  font-size: 13px; font-family: 'Noto Sans SC', sans-serif; color: #1A1A2E; background: #F8F6F0;
}
.info-input:focus { outline: none; border-color: #1A8A7A; background: #fff; }
.info-group.full { margin-bottom: 0; }
.info-textarea {
  width: 100%; padding: 10px 12px; border: 1px solid #E5E0D6; border-radius: 10px;
  font-size: 13px; font-family: 'Noto Sans SC', sans-serif; color: #1A1A2E;
  background: #F8F6F0; resize: vertical; line-height: 1.6;
}
.info-textarea:focus { outline: none; border-color: #1A8A7A; background: #fff; }

/* 操作按钮 */
.form-actions { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
.form-actions-row { flex-wrap: wrap; }
.action-btn {
  flex: 1; min-width: 140px; padding: 12px 16px; border: none; border-radius: 12px; font-size: 14px;
  font-weight: 600; cursor: pointer; transition: all 0.25s;
  font-family: 'Noto Sans SC', sans-serif; display: flex; align-items: center;
  justify-content: center; gap: 6px;
}
.action-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
.action-purple { background: linear-gradient(135deg, #0D6B5C, #1A8A7A); color: #fff; box-shadow: 0 5px 14px rgba(13,107,92,0.18); }
.action-purple:hover:not(:disabled) { box-shadow: 0 4px 16px rgba(13,107,92,0.28); transform: translateY(-1px); }
.action-volo { background: #F7F4EE; color: #9C5A3D; border: 1px solid #E7D8CA; }
.action-ghost { background: transparent; color: #0D6B5C; border: 1px solid #BFD9D2; flex: 0 1 auto; min-width: 120px; }
.action-ghost:hover:not(:disabled) { background: #EFF6F3; transform: translateY(-1px); }
.action-volo:hover:not(:disabled) { background: #FFF8F0; border-color: #D7AE91; box-shadow: 0 4px 16px rgba(194,59,34,0.15); transform: translateY(-1px); }
.action-volo:disabled { opacity: 0.4; cursor: not-allowed; }

.spin-icon { animation: spin 1s linear infinite; }
.action-hint { margin: 10px 0 0; color: #9BA89D; font-size: 11px; text-align: center; }
.cutout-toggle { margin: 8px 0 0; display: flex; align-items: center; justify-content: center; gap: 6px; color: #6B7B6E; font-size: 12px; cursor: pointer; }
.cutout-toggle input { accent-color: #0D6B5C; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== 右侧预览 ===== */
.journal-preview { position: sticky; top: 92px; }
.preview-header { display: flex; align-items: flex-end; justify-content: space-between; margin: 0 4px 14px; }
.preview-title { font-size: 17px; font-weight: 700; color: #1A1A2E; margin: 0; display: flex; align-items: center; gap: 8px; }
.preview-style-label { padding: 5px 9px; color: #0D6B5C; background: rgba(13,107,92,0.07); border-radius: 7px; font-size: 11px; }
.new-journal-btn { margin-left: auto; padding: 7px 11px; border: 1px solid #D7E3DA; border-radius: 8px; color: #0D6B5C; background: #fff; font: 11px 'Noto Sans SC', sans-serif; cursor: pointer; }
.new-journal-btn:hover { border-color: #70AA91; background: #F1F8F3; }
.preview-area {
  position: relative; overflow: hidden; background: #FAFAF8; border: 1px solid #E5E0D6; border-radius: 22px;
  min-height: 570px; padding: 34px; display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  box-shadow: 0 14px 34px rgba(43,61,49,0.07);
}
/* 模板排版预览：外框保持原宽度，拉高以匹配手账 3:4 */
.preview-area.preview-area--diary-next {
  width: 100%;
  margin-inline: 0;
  aspect-ratio: 3 / 4;
  min-height: 0;
  height: auto;
  padding: 18px;
  justify-content: stretch;
  align-items: stretch;
}
.preview-area.preview-area--diary-next::before {
  inset: 8px;
  border-radius: 12px;
}
.preview-area.preview-area--diary-next .preview-paper-mark {
  display: none;
}
.preview-area::before { content: ''; position: absolute; inset: 14px; border: 1px solid rgba(255,255,255,0.65); border-radius: 16px; pointer-events: none; }
.preview-paper-mark { position: absolute; top: 22px; right: 28px; color: rgba(13,107,92,0.16); font-size: 26px; transform: rotate(12deg); }

/* 空态 / 生成中 / 成图共用同一 3:4 内卡，避免尺寸跳变 */
.preview-stage-card {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 28px 22px;
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(255, 252, 245, 0.92) 0%, rgba(246, 238, 224, 0.88) 100%);
  box-shadow: 0 8px 22px rgba(40, 32, 24, 0.1);
  text-align: center;
}

.preview-loading { text-align: center; }
.preview-loading .preview-progress-label {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: #3D4038;
}
.preview-progress-track {
  width: min(100%, 220px);
  height: 8px;
  margin-top: 6px;
  border-radius: 999px;
  background: rgba(13, 107, 92, 0.12);
  overflow: hidden;
}
.preview-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0D6B5C 0%, #2AA391 100%);
  transition: width 0.45s ease;
}
.preview-progress-meta {
  font-size: 12px;
  font-weight: 600;
  color: #0D6B5C;
  letter-spacing: 0.02em;
}
.preview-progress-steps {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 10px;
  width: min(100%, 240px);
  margin: 10px 0 0;
  padding: 0;
}
.preview-progress-steps li {
  position: relative;
  padding-left: 14px;
  color: #A3ADA6;
  font-size: 11px;
  text-align: left;
  transition: color 0.2s ease;
}
.preview-progress-steps li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 5px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #D2D9D4;
}
.preview-progress-steps li.done { color: #5C6B64; }
.preview-progress-steps li.done::before { background: #70AA91; }
.preview-progress-steps li.active {
  color: #0D6B5C;
  font-weight: 600;
}
.preview-progress-steps li.active::before {
  background: #0D6B5C;
  box-shadow: 0 0 0 3px rgba(13, 107, 92, 0.16);
}

.loading-spinner { width: 48px; height: 48px; }
.spinner-ring {
  fill: none; stroke: #0D6B5C; stroke-width: 3;
  stroke-dasharray: 80; stroke-dashoffset: 60;
  stroke-linecap: round;
  animation: spin 1.2s ease-in-out infinite;
}
@keyframes spin { to { stroke-dashoffset: -20; } }
.loading-hint { font-size: 12px; color: #8B8B9E; margin-top: 8px; }

.preview-content { width: 100%; text-align: left; line-height: 1.8; font-size: 14px; color: #1A1A2E; }
.preview-content h1 { font-size: 22px; margin: 0 0 8px; }
.preview-content h3 { font-size: 16px; margin: 16px 0 8px; }
.preview-content p { margin: 0 0 12px; }
.preview-content .meta { font-size: 12px; color: #8B8B9E; margin-bottom: 16px; }
.preview-content .ending { font-style: italic; color: #5C5C6E; border-top: 1px solid #E5E0D6; padding-top: 12px; }

/* diary-next 成图预览壳 */
.journal-canvas-shell { width: 100%; display: flex; justify-content: center; }
.preview-area--diary-next .journal-canvas-shell {
  height: 100%;
  align-items: stretch;
}
.diary-next-preview-shell {
  width: 100%;
  height: 100%;
  padding: 0;
  align-items: stretch;
}
.diary-next-preview-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 8px 22px rgba(40, 32, 24, 0.14);
  background: #fff;
}
.diary-next-edit-tip { margin-top: 10px; }
.preview-video { width: 100%; display: flex; flex-direction: column; align-items: center; }
.video-player { width: 100%; max-height: 400px; border-radius: 12px; background: #000; }
.preview-empty { text-align: center; }
.preview-empty svg { display: flex; margin: 0 auto 4px; }
.preview-empty p { font-size: 14px; color: #8B8B9E; margin: 0 0 8px; }
.empty-steps { font-size: 11px; color: #B8B8C8; }

/* 预览区统一复古胶片底板；风格切换只影响生成，不换外框 */
.style-retro { background: linear-gradient(160deg, #E9D5B4 0%, #D9C19A 55%, #CDB48A 100%); }
.style-volo { background: linear-gradient(160deg, #F4EFE8 0%, #E8DFD4 100%); }

.save-journal-btn {
  width: 100%;
  margin-top: 16px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #0D6B5C 0%, #1A8A7A 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: 'Noto Sans SC', sans-serif;
}
.save-journal-btn:hover:not(:disabled) { filter: brightness(1.05); transform: translateY(-1px); }
.save-journal-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.preview-tip { margin: 9px 0 0; color: #9BA89D; text-align: center; font-size: 11px; }
.export-journal-btn { width: 100%; margin-top: 8px; padding: 10px 24px; color: #0D6B5C; background: #F4FAF6; border: 1px solid #BFD8CA; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Noto Sans SC', sans-serif; }
.export-journal-btn:hover { background: #EAF5ED; }
@media (max-width: 900px) {
  .page-container { width: calc(100% - 32px); padding-top: 32px; }
  .journal-layout { grid-template-columns: 1fr; }
  .journal-preview { position: static; }
  .preview-area { min-height: 480px; }
  .preview-area.preview-area--diary-next {
    width: 100%;
    min-height: 0;
  }
}

@media (max-width: 560px) {
  .page-container { width: calc(100% - 24px); padding-top: 24px; }
  .page-title { font-size: 25px; }
  .page-subtitle { line-height: 1.6; }
  .creation-mode-switch { flex-wrap: wrap; gap: 8px; }
  .mode-chip { min-width: calc(50% - 4px); }
  .journal-steps { gap: 6px; justify-content: flex-start; overflow-x: auto; padding: 0 2px 4px; }
  .journal-step strong { display: none; }
  .journal-steps i { width: 22px; flex-shrink: 0; }
  .journal-form { padding: 18px; border-radius: 18px; }
  .style-grid { grid-template-columns: repeat(2, 1fr); }
  .info-row { grid-template-columns: 1fr; }
  .photo-list { grid-template-columns: repeat(4, 1fr); }
  .form-actions { flex-direction: column; }
  .preview-area { min-height: 400px; padding: 22px; border-radius: 18px; }
  .preview-area.preview-area--diary-next {
    width: 100%;
    min-height: 0;
    padding: 14px;
  }
}
</style>
