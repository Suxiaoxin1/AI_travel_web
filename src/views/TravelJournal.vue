<template>
  <div class="page-container">
    <PageHero v-bind="pageHeroConfig.journal" />
    <div class="journal-steps" aria-label="手帐创作流程">
      <div class="journal-step active"><span>01</span><strong>选择风格</strong></div>
      <i></i>
      <div class="journal-step"><span>02</span><strong>上传照片</strong></div>
      <i></i>
      <div class="journal-step"><span>03</span><strong>填写信息</strong></div>
      <i></i>
      <div class="journal-step"><span>04</span><strong>生成手帐</strong></div>
    </div>
    <div class="journal-layout">
      <!-- 左侧：表单区 -->
      <div id="journal-form" class="journal-form">
        <!-- 手帐风格选择 -->
        <div class="form-section">
          <div class="section-heading">
            <div><span class="section-kicker">STEP 01</span><h3 class="section-title">选择手帐风格</h3></div>
            <span class="section-note">{{ styleLabels[form.style] }}</span>
          </div>
          <div class="style-grid">
            <button v-for="s in journalStyles" :key="s.key"
              :class="['style-card', { active: form.style === s.key }]"
              @click="form.style = s.key">
              <span class="style-icon" v-html="s.icon"></span>
              <span class="style-name">{{ s.label }}</span>
            </button>
          </div>
        </div>

        <!-- 照片上传 -->
        <div class="form-section">
          <div class="section-heading compact">
            <div><span class="section-kicker">STEP 02</span><h3 class="section-title">放入旅途照片</h3></div>
            <span class="section-note">{{ photos.length }}/9</span>
          </div>
          <div class="upload-zone" :class="{ dragging: isDragging }" @dragover.prevent="isDragging = true" @dragleave="isDragging = false" @drop.prevent="handleDrop" @click="triggerUpload">
            <svg class="upload-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#B8C5B0" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <p class="upload-text">点击或拖拽上传旅途照片</p>
            <p class="upload-hint">建议 3-9 张 · 支持 JPG / PNG</p>
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
            <div><span class="section-kicker">STEP 03</span><h3 class="section-title">补充旅途信息</h3></div>
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
        </div>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <button class="action-btn action-purple" @click="generateJournal" :disabled="isGenerating">
            <svg v-if="!isGenerating" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L17.18 22 12 18.27 6.82 22 8 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
            <svg v-else class="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/><polyline points="21 3 21 9 15 9"/></svg>
            {{ isGenerating ? '生成中…' : 'AI 生成手账' }}
          </button>
          <button class="action-btn action-volo" @click="createVideo" :disabled="isGenerating || !photos.length">
            <svg v-if="!isGenerating" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            <svg v-else class="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/><polyline points="21 3 21 9 15 9"/></svg>
            {{ isGenerating ? '生成中…' : 'VOLO 视频' }}
          </button>
        </div>
        <p class="action-hint">生成手帐会根据你的风格、照片数量和旅途信息组织内容</p>
      </div>

      <!-- 右侧：预览区 -->
      <div class="journal-preview">
        <div class="preview-header">
          <div>
            <span class="section-kicker">STEP 04</span>
            <h3 class="preview-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A8A7A" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              手帐预览
            </h3>
          </div>
          <span class="preview-style-label">{{ styleLabels[form.style] }}</span>
          <button type="button" class="new-journal-btn" @click="startNewJournal">新建手账</button>
        </div>
        <div class="preview-area" :class="'style-' + form.style">
          <div class="preview-paper-mark" aria-hidden="true">✦</div>
          <div v-if="isVideoGenerating" class="preview-loading">
            <svg class="loading-spinner" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" class="spinner-ring" />
            </svg>
            <p>VOLO 视频生成中…</p>
            <p class="loading-hint">通常需要 1-3 分钟，请耐心等待</p>
          </div>
          <div v-else-if="isGenerating" class="preview-loading">
            <svg class="loading-spinner" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" class="spinner-ring" />
            </svg>
            <p>AI 正在生成手帐…</p>
          </div>
          <div v-else-if="journalGenerated && photos.length && !videoUrl" class="journal-canvas-shell">
            <div ref="journalCanvas" class="journal-canvas" :class="[`canvas-${form.style}`, `photo-count-${photos.length}`]">
              <div class="canvas-header canvas-editable-text" :class="{ selected: isEditing && selectedElementId === 'title' }" :style="textElementStyle('title')" @pointerdown.stop="startElementDrag($event, 'title')" @click.stop="selectElement('title')">
                <span class="canvas-label">TRAVEL NOTES · {{ form.date || 'TODAY' }}</span>
                <h1>{{ canvasTitle }}</h1>
                <p>{{ form.location || '我的旅行手帐' }} <span v-if="form.mood">· {{ form.mood }}</span></p>
              </div>
              <div class="canvas-photo-grid">
                <div
                  v-for="(photo, index) in displayPhotos"
                  :key="photo.originalIndex"
                  class="canvas-photo"
                  :class="[`photo-${index + 1}`, { selected: isEditing && selectedPhotoIndex === photo.originalIndex }]"
                  :style="photoStyle(photo.originalIndex)"
                  @pointerdown="startPhotoDrag($event, photo.originalIndex)"
                  @click.stop="selectPhoto(photo.originalIndex)">
                  <img :src="photo.src" :alt="photo.caption || `旅行照片${index + 1}`" />
                  <span class="photo-tape" aria-hidden="true"></span>
                  <span v-if="photo.caption" class="photo-caption">{{ photo.caption }}</span>
                </div>
              </div>
              <button
                v-for="element in decorationElements"
                :key="element.id"
                class="canvas-element-decoration"
                :class="[{ selected: isEditing && selectedElementId === element.id }, `decoration-${element.type}`, `decoration-${element.type}-${element.style || 'default'}`]"
                :style="elementStyle(element)"
                type="button"
                @pointerdown.stop="startElementDrag($event, element.id)"
                @click.stop="selectElement(element.id)">
                {{ decorationSymbol(element) }}
              </button>
              <div
                v-for="element in customTextElements"
                :key="element.id"
                class="canvas-custom-text"
                :class="[`custom-text-${element.style || 'paper'}`, { selected: isEditing && selectedElementId === element.id }]"
                :style="customTextStyle(element)"
                @pointerdown.stop="startElementDrag($event, element.id)"
                @click.stop="selectElement(element.id)">
                {{ element.text }}
              </div>
              <div class="canvas-note canvas-note-left canvas-editable-text" :class="{ selected: isEditing && selectedElementId === 'note' }" :style="textElementStyle('note')" @pointerdown.stop="startElementDrag($event, 'note')" @click.stop="selectElement('note')">
                <strong>{{ visionAnalysis?.highlight || form.location || '旅途片段' }}</strong>
                <span>{{ canvasNote }}</span>
              </div>
              <div class="canvas-note canvas-note-right">
                <span>今日记录</span>
                <strong>{{ photos.length }} 张照片</strong>
              </div>
              <div class="canvas-sticker canvas-sticker-one" aria-hidden="true">✦</div>
              <div class="canvas-sticker canvas-sticker-two" aria-hidden="true">✿</div>
            </div>
          </div>
          <div v-else-if="journalGenerated && videoUrl" class="preview-video">
            <video :src="videoUrl" controls autoplay loop muted playsinline class="video-player"></video>
          </div>
          <div v-else class="preview-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4C8B8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <p>生成后在此预览你的手帐</p>
            <span class="empty-steps">选择风格 → 上传照片 → 点击生成</span>
          </div>
        </div>
        <div v-if="journalGenerated && photos.length && !videoUrl" class="editor-actions">
          <button class="edit-journal-btn" @click="toggleEditing">{{ isEditing ? '完成编辑' : '编辑手账' }}</button>
          <button v-if="isEditing" class="reset-layout-btn" @click="resetLayout">恢复默认布局</button>
        </div>
        <div v-if="isEditing && photos.length && !videoUrl" class="editor-panel">
          <div class="editor-toolbar">
            <button type="button" @click="cycleSelectedDecorationStyle" :disabled="!selectedDecoration">换样式</button>
            <button type="button" @click="addTextBox">＋文本框</button>
            <button type="button" @click="cycleSelectedTextStyle" :disabled="!selectedCustomText">文本样式</button>
            <button type="button" @click="duplicateSelectedPhoto" :disabled="selectedPhotoIndex === null || photos.length >= 9">复制照片</button>
            <button type="button" @click="addDecoration('sticker')">＋贴纸</button>
            <button type="button" @click="addDecoration('tape')">＋胶带</button>
            <button type="button" @click="addDecoration('line')">＋手绘线</button>
            <button type="button" @click="moveSelectedLayer(-1)" :disabled="!selectedElementId">下移</button>
            <button type="button" @click="moveSelectedLayer(1)" :disabled="!selectedElementId">上移</button>
            <button type="button" @click="deleteSelectedElement" :disabled="!selectedElementId || selectedElementId === 'title' || selectedElementId === 'note'">删除</button>
            <button type="button" @click="undoLayout" :disabled="!historyPast.length">撤销</button>
            <button type="button" @click="redoLayout" :disabled="!historyFuture.length">重做</button>
          </div>
          <div class="editor-fields">
            <label>手帐标题<input v-model="manualTitle" maxlength="24" /></label>
            <label>记录文字<textarea v-model="manualNote" maxlength="60" rows="2"></textarea></label>
          </div>
          <div v-if="selectedTextElement" class="editor-text-controls">
            <strong>{{ selectedTextElement.role === 'title' ? '标题样式' : '备注样式' }}</strong>
            <label>字号 <input type="range" min="10" max="48" step="1" :value="selectedTextElement.fontSize || (selectedTextElement.role === 'title' ? 36 : 14)" @input="updateSelectedText('fontSize', $event.target.value)" /></label>
            <label>颜色 <input type="color" :value="selectedTextElement.color || '#2D5B62'" @input="updateSelectedText('color', $event.target.value)" /></label>
          </div>
          <div v-if="selectedCustomText" class="editor-custom-text-controls">
            <label>文本内容
              <textarea :value="selectedCustomText.text" maxlength="120" rows="3" @input="updateSelectedText('text', $event.target.value)"></textarea>
            </label>
          </div>
          <div v-if="selectedTransform" class="editor-photo-controls">
            <strong>调整第 {{ selectedPhotoIndex + 1 }} 张照片</strong>
            <label>缩放 <input type="range" min="0.7" max="1.35" step="0.05" :value="selectedTransform.scale" @input="updateSelectedTransform('scale', $event.target.value)" /></label>
            <label>旋转 <input type="range" min="-12" max="12" step="1" :value="selectedTransform.rotation" @input="updateSelectedTransform('rotation', $event.target.value)" /></label>
          </div>
          <p v-else class="editor-help">点击画布中的照片后，可拖动、缩放和旋转</p>
        </div>
        <button
          v-if="journalGenerated && (journalContent || videoUrl)"
          class="save-journal-btn"
          @click="saveJournal"
          :disabled="isSaving"
        >
          {{ isSaving ? '保存中…' : '保存手账' }}
        </button>
        <button v-if="journalGenerated && photos.length && !videoUrl" class="export-journal-btn" @click="exportJournal">导出 PNG</button>
        <p v-if="journalGenerated && (journalContent || videoUrl)" class="preview-tip">生成完成后可以保存到“我的手账”</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import html2canvas from 'html2canvas'
import { chat, chatWithVision, generateVideo } from '../utils/agnesApi.js'
import { useAuthStore } from '../stores/authStore.js'
import { useJournalStore } from '../stores/journalStore.js'
import PageHero from '../components/PageHero.vue'
import { pageHeroConfig } from '../config/pageHeroConfig.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const journalStore = useJournalStore()

const form = reactive({
  style: 'retro',
  location: '',
  date: '',
  mood: ''
})

const journalStyles = [
  { key: 'retro', label: '复古胶片', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C2960C" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="12" cy="12" r="4"/><path d="M2 16l4-4 3 3 4-6 9 9"/></svg>` },
  { key: 'clean', label: '简约清新', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A8A7A" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15h18"/><path d="M8 8v4"/><path d="M12 8v4"/><path d="M16 8v4"/></svg>` },
  { key: 'vivid', label: '多彩活泼', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C23B22" stroke-width="1.5"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><path d="M8 12l3 3 5-5"/></svg>` },
  { key: 'dark', label: '暗黑质感', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5C5C6E" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/></svg>` },
  { key: 'watercolor', label: '水彩手绘', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7BA4D4" stroke-width="1.5"><path d="M12 2C8 6 4 10 4 14a8 8 0 0 0 16 0c0-4-4-8-8-12z"/></svg>` },
  { key: 'magazine', label: '杂志排版', icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A84B" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M9 3v18"/></svg>` }
]

const photos = ref([])
const isDragging = ref(false)
const fileInput = ref(null)
const isGenerating = ref(false)
const isVideoGenerating = ref(false)
const isSaving = ref(false)
const journalContent = ref('')
const journalGenerated = ref(false)
const videoUrl = ref('')
const journalCanvas = ref(null)
const visionAnalysis = ref(null)
const isEditing = ref(false)
const selectedPhotoIndex = ref(null)
const selectedElementId = ref(null)
const layout = ref({ version: 2, canvas: { width: 1000, height: 1400 }, elements: [] })
const manualTitle = ref('')
const manualNote = ref('')
const dragState = ref(null)
const historyPast = ref([])
const historyFuture = ref([])
const savedJournalId = ref(null)

const canvasTitle = computed(() => {
  if (manualTitle.value.trim()) return manualTitle.value.trim()
  if (visionAnalysis.value?.title) return visionAnalysis.value.title
  const title = journalContent.value.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '').trim()
  return title || `${form.location || '我的'}旅行手帐`
})
const canvasNote = computed(() => {
  if (manualNote.value.trim()) return manualNote.value.trim()
  if (visionAnalysis.value?.intro) return visionAnalysis.value.intro
  if (form.mood) return form.mood
  return '沿途的风景，被认真收藏成今天的故事。'
})
const displayPhotos = computed(() => {
  const analyzed = visionAnalysis.value?.photos || []
  const items = photos.value.map((src, originalIndex) => ({
    src,
    originalIndex,
    analysis: analyzed.find(item => Number(item.index) === originalIndex + 1) || null,
    caption: analyzed.find(item => Number(item.index) === originalIndex + 1)?.caption || ''
  }))
  if (!analyzed.length) return items
  const score = item => {
    const role = String(item.analysis?.suggestedRole || '').toLowerCase()
    const importance = Number(item.analysis?.importance) || 0
    return (role === 'hero' || role === 'main' || role === '主图') ? 1000 + importance : importance
  }
  const hero = [...items].sort((a, b) => score(b) - score(a))[0]
  return [...items].sort((a, b) => {
    if (a === hero) return -1
    if (b === hero) return 1
    const aOrder = Number(analyzed.find(item => Number(item.index) === a.originalIndex + 1)?.order) || a.originalIndex + 1
    const bOrder = Number(analyzed.find(item => Number(item.index) === b.originalIndex + 1)?.order) || b.originalIndex + 1
    return aOrder - bOrder
  })
})
const selectedTransform = computed(() => {
  if (selectedPhotoIndex.value === null) return null
  return getPhotoElement(selectedPhotoIndex.value) || defaultTransform(selectedPhotoIndex.value)
})
const decorationElements = computed(() => layout.value.elements.filter(element => ['sticker', 'tape', 'line'].includes(element.type)))
const selectedDecoration = computed(() => decorationElements.value.find(element => element.id === selectedElementId.value))
const selectedTextElement = computed(() => layout.value.elements.find(element => element.id === selectedElementId.value && element.type === 'text'))
const customTextElements = computed(() => layout.value.elements.filter(element => element.type === 'text' && element.role === 'custom'))
const selectedCustomText = computed(() => customTextElements.value.find(element => element.id === selectedElementId.value))

function triggerUpload() { fileInput.value.click() }
function defaultTransform(index) {
  return { x: 0, y: 0, scale: 1, rotation: index % 2 ? 1 : -1 }
}
function getCollageVariant(count) {
  if (count === 3) return 'hero-2-support'
  if (count === 5) return 'hero-scatter'
  if (count === 9) return 'nine-grid'
  return 'standard-grid'
}
function createDefaultLayout(count = photos.value.length) {
  return {
    version: 2,
    variant: getCollageVariant(count),
    canvas: { width: 1000, height: 1400 },
    elements: [
      { id: 'title', type: 'text', role: 'title', x: 0, y: 0, zIndex: 20 },
      { id: 'note', type: 'text', role: 'note', x: 0, y: 0, zIndex: 20 },
      ...Array.from({ length: count }, (_, index) => ({
        id: `photo-${index}`,
        type: 'photo',
        photoIndex: index,
        ...defaultTransform(index),
        zIndex: index + 1
      }))
    ]
  }
}
function getPhotoElement(index) {
  return layout.value.elements.find(element => element.type === 'photo' && element.photoIndex === index)
}
function cloneLayout(value = layout.value) {
  return JSON.parse(JSON.stringify(value))
}
function recordHistory() {
  historyPast.value.push(cloneLayout())
  if (historyPast.value.length > 30) historyPast.value.shift()
  historyFuture.value = []
}
function elementStyle(element) {
  return {
    left: `${((element.x || 0) / layout.value.canvas.width) * 100}%`,
    top: `${((element.y || 0) / layout.value.canvas.height) * 100}%`,
    transform: `rotate(${element.rotation || 0}deg) scale(${element.scale || 1})`,
    zIndex: element.zIndex || 4
  }
}
function textElementStyle(role) {
  const element = layout.value.elements.find(item => item.role === role)
  if (!element) return {}
  return {
    transform: `translate(${element.x || 0}px, ${element.y || 0}px)`,
    zIndex: element.zIndex || 20,
    '--journal-text-size': `${element.fontSize || (role === 'title' ? 36 : 14)}px`,
    '--journal-text-color': element.color || (role === 'title' ? '#2D5B62' : '#5C634F')
  }
}
function customTextStyle(element) {
  return {
    left: `${((element.x || 0) / layout.value.canvas.width) * 100}%`,
    top: `${((element.y || 0) / layout.value.canvas.height) * 100}%`,
    zIndex: element.zIndex || 20,
    fontSize: `${element.fontSize || 16}px`,
    color: element.color || '#4D5C54'
  }
}
function decorationSymbol(element) {
  if (element.type === 'tape') return '▰'
  if (element.type === 'line') return '〰'
  return element.symbol || '✦'
}
function syncPhotoElements() {
  const previous = layout.value.elements.filter(element => element.type !== 'photo')
  const photosElements = photos.value.map((_, index) => {
    const current = getPhotoElement(index)
    return current || {
      id: `photo-${index}`,
      type: 'photo',
      photoIndex: index,
      ...defaultTransform(index),
      zIndex: index + 1
    }
  })
  layout.value.elements = [...previous, ...photosElements]
}
function photoStyle(index) {
  const transform = getPhotoElement(index) || defaultTransform(index)
  return {
    transform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotation}deg) scale(${transform.scale})`,
    zIndex: transform.zIndex || 1
  }
}
function selectPhoto(index) {
  if (!isEditing.value) return
  selectedPhotoIndex.value = index
  selectedElementId.value = `photo-${index}`
  if (!getPhotoElement(index)) syncPhotoElements()
}
function startPhotoDrag(event, index) {
  if (!isEditing.value) return
  event.preventDefault()
  event.currentTarget?.setPointerCapture?.(event.pointerId)
  selectPhoto(index)
  recordHistory()
  const transform = getPhotoElement(index)
  dragState.value = { kind: 'photo', index, pointerId: event.pointerId, target: event.currentTarget, startX: event.clientX, startY: event.clientY, originX: transform.x, originY: transform.y }
  window.addEventListener('pointermove', handlePhotoDrag)
  window.addEventListener('pointerup', stopPhotoDrag)
  window.addEventListener('pointercancel', stopPhotoDrag)
}
function selectElement(id) {
  if (!isEditing.value) return
  selectedElementId.value = id
  const element = layout.value.elements.find(item => item.id === id)
  if (element?.type === 'photo') selectedPhotoIndex.value = element.photoIndex
  else selectedPhotoIndex.value = null
}
function startElementDrag(event, id) {
  if (!isEditing.value) return
  event.preventDefault()
  event.currentTarget?.setPointerCapture?.(event.pointerId)
  selectElement(id)
  const element = layout.value.elements.find(item => item.id === id)
  if (!element) return
  recordHistory()
  dragState.value = { kind: 'element', elementId: id, pointerId: event.pointerId, target: event.currentTarget, startX: event.clientX, startY: event.clientY, originX: element.x || 0, originY: element.y || 0 }
  window.addEventListener('pointermove', handleElementDrag)
  window.addEventListener('pointerup', stopElementDrag)
  window.addEventListener('pointercancel', stopElementDrag)
}
function handleElementDrag(event) {
  if (!dragState.value?.elementId) return
  if (dragState.value.pointerId !== event.pointerId) return
  const element = layout.value.elements.find(item => item.id === dragState.value.elementId)
  if (!element) return
  const deltaX = event.clientX - dragState.value.startX
  const deltaY = event.clientY - dragState.value.startY
  if (element.type === 'text' && element.role !== 'custom') {
    element.x = dragState.value.originX + deltaX
    element.y = dragState.value.originY + deltaY
    return
  }
  const rect = journalCanvas.value?.getBoundingClientRect()
  const scaleX = rect?.width ? layout.value.canvas.width / rect.width : 1
  const scaleY = rect?.height ? layout.value.canvas.height / rect.height : 1
  element.x = dragState.value.originX + deltaX * scaleX
  element.y = dragState.value.originY + deltaY * scaleY
}
function stopElementDrag() {
  const target = dragState.value?.target
  if (target?.releasePointerCapture && dragState.value?.pointerId !== undefined) {
    try { target.releasePointerCapture(dragState.value.pointerId) } catch {}
  }
  window.removeEventListener('pointermove', handleElementDrag)
  window.removeEventListener('pointerup', stopElementDrag)
  window.removeEventListener('pointercancel', stopElementDrag)
  if (dragState.value?.kind === 'element') dragState.value = null
}
function handlePhotoDrag(event) {
  if (!dragState.value || dragState.value.kind !== 'photo' || dragState.value.pointerId !== event.pointerId) return
  const { index, startX, startY, originX, originY } = dragState.value
  const transform = getPhotoElement(index)
  transform.x = originX + event.clientX - startX
  transform.y = originY + event.clientY - startY
}
function stopPhotoDrag() {
  const target = dragState.value?.target
  if (target?.releasePointerCapture && dragState.value?.pointerId !== undefined) {
    try { target.releasePointerCapture(dragState.value.pointerId) } catch {}
  }
  dragState.value = null
  window.removeEventListener('pointermove', handlePhotoDrag)
  window.removeEventListener('pointerup', stopPhotoDrag)
  window.removeEventListener('pointercancel', stopPhotoDrag)
}
function updateSelectedTransform(key, value) {
  if (selectedPhotoIndex.value === null) return
  const element = getPhotoElement(selectedPhotoIndex.value)
  if (!element) return
  recordHistory()
  element[key] = Number(value)
}
function updateSelectedText(key, value) {
  const element = selectedTextElement.value
  if (!element) return
  recordHistory()
  element[key] = key === 'fontSize' ? Number(value) : value
}
function addDecoration(type) {
  recordHistory()
  const count = layout.value.elements.filter(element => element.type === type).length
  const presets = {
    sticker: { symbol: count % 2 ? '✿' : '✦', x: 720, y: 180, scale: 1, rotation: count % 2 ? -12 : 12 },
    tape: { symbol: '▰', x: 400, y: 220, scale: 2, rotation: -8 },
    line: { symbol: '〰', x: 160, y: 500, scale: 2, rotation: count % 2 ? 4 : -4 }
  }
  layout.value.elements.push({
    id: `${type}-${Date.now()}`,
    type,
    zIndex: Math.max(5, ...layout.value.elements.map(element => element.zIndex || 1)) + 1,
    ...presets[type]
  })
  const created = layout.value.elements[layout.value.elements.length - 1]
  const styleSets = {
    sticker: [{ style: 'spark', symbol: '✦' }, { style: 'flower', symbol: '✿' }, { style: 'heart', symbol: '♡' }, { style: 'sun', symbol: '☼' }],
    tape: [{ style: 'washi' }, { style: 'grid' }, { style: 'paper' }, { style: 'stripe' }],
    line: [{ style: 'wave', symbol: '〰' }, { style: 'dotted', symbol: '···' }, { style: 'arrow', symbol: '➜' }, { style: 'brush', symbol: '〽' }]
  }
  Object.assign(created, styleSets[type][count % styleSets[type].length])
  selectedElementId.value = layout.value.elements[layout.value.elements.length - 1].id
  selectedPhotoIndex.value = null
}
function cycleSelectedDecorationStyle() {
  const element = selectedDecoration.value
  if (!element) return
  recordHistory()
  const styleSets = {
    sticker: [{ style: 'spark', symbol: '✦' }, { style: 'flower', symbol: '✿' }, { style: 'heart', symbol: '♡' }, { style: 'sun', symbol: '☼' }],
    tape: [{ style: 'washi' }, { style: 'grid' }, { style: 'paper' }, { style: 'stripe' }],
    line: [{ style: 'wave', symbol: '〰' }, { style: 'dotted', symbol: '···' }, { style: 'arrow', symbol: '➜' }, { style: 'brush', symbol: '〽' }]
  }[element.type]
  const current = Math.max(0, styleSets.findIndex(option => option.style === element.style))
  Object.assign(element, styleSets[(current + 1) % styleSets.length])
}
function addTextBox() {
  recordHistory()
  const index = customTextElements.value.length
  const element = {
    id: `text-${Date.now()}`,
    type: 'text',
    role: 'custom',
    text: '在这里写下旅行片段',
    style: ['paper', 'label', 'hand', 'marker', 'typewriter'][index % 5],
    x: 120 + (index % 2) * 360,
    y: 500 + Math.floor(index / 2) * 150,
    fontSize: 16,
    color: '#4D5C54',
    zIndex: Math.max(5, ...layout.value.elements.map(item => item.zIndex || 1)) + 1
  }
  layout.value.elements.push(element)
  selectedElementId.value = element.id
  selectedPhotoIndex.value = null
}
function cycleSelectedTextStyle() {
  const element = selectedCustomText.value
  if (!element) return
  recordHistory()
  const styles = ['paper', 'label', 'hand', 'marker', 'typewriter']
  element.style = styles[(styles.indexOf(element.style) + 1) % styles.length]
}
function deleteSelectedElement() {
  if (!selectedElementId.value || ['title', 'note'].includes(selectedElementId.value)) return
  const element = layout.value.elements.find(item => item.id === selectedElementId.value)
  if (element?.type === 'photo') {
    recordHistory()
    photos.value.splice(element.photoIndex, 1)
    layout.value = createDefaultLayout()
    selectedElementId.value = null
    selectedPhotoIndex.value = null
    return
  }
  recordHistory()
  layout.value.elements = layout.value.elements.filter(element => element.id !== selectedElementId.value)
  selectedElementId.value = null
  selectedPhotoIndex.value = null
}
function duplicateSelectedPhoto() {
  if (selectedPhotoIndex.value === null || photos.value.length >= 9) return
  const source = photos.value[selectedPhotoIndex.value]
  if (!source) return
  recordHistory()
  photos.value.push(source)
  layout.value = createDefaultLayout()
  selectedPhotoIndex.value = photos.value.length - 1
  selectedElementId.value = `photo-${selectedPhotoIndex.value}`
}
function moveSelectedLayer(direction) {
  const element = layout.value.elements.find(item => item.id === selectedElementId.value)
  if (!element) return
  recordHistory()
  const sameLayer = layout.value.elements
    .slice()
    .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))
  const currentIndex = sameLayer.findIndex(item => item.id === element.id)
  const nextIndex = currentIndex + direction
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= sameLayer.length) return
  const other = sameLayer[nextIndex]
  const currentZ = element.zIndex || 1
  element.zIndex = other.zIndex || 1
  other.zIndex = currentZ
}
function undoLayout() {
  const previous = historyPast.value.pop()
  if (!previous) return
  historyFuture.value.push(cloneLayout())
  layout.value = previous
  selectedElementId.value = null
  selectedPhotoIndex.value = null
}
function redoLayout() {
  const next = historyFuture.value.pop()
  if (!next) return
  historyPast.value.push(cloneLayout())
  layout.value = next
  selectedElementId.value = null
  selectedPhotoIndex.value = null
}
function toggleEditing() {
  isEditing.value = !isEditing.value
  if (isEditing.value) {
    manualTitle.value = canvasTitle.value
    manualNote.value = canvasNote.value
  } else {
    selectedPhotoIndex.value = null
    selectedElementId.value = null
  }
}
function resetLayout() {
  recordHistory()
  layout.value = createDefaultLayout()
  selectedPhotoIndex.value = null
  selectedElementId.value = null
  manualTitle.value = canvasTitle.value
  manualNote.value = canvasNote.value
}
async function startNewJournal() {
  const hasDraft = photos.value.length || journalContent.value || videoUrl.value
  if (hasDraft && !window.confirm('当前手账内容尚未清空，确定新建一份手账吗？')) return
  form.style = 'retro'
  form.location = ''
  form.date = ''
  form.mood = ''
  photos.value = []
  journalContent.value = ''
  videoUrl.value = ''
  visionAnalysis.value = null
  manualTitle.value = ''
  manualNote.value = ''
  layout.value = createDefaultLayout(0)
  selectedPhotoIndex.value = null
  selectedElementId.value = null
  savedJournalId.value = null
  journalGenerated.value = false
  isEditing.value = false
  historyPast.value = []
  historyFuture.value = []
  if (fileInput.value) fileInput.value.value = ''
  await router.replace({ name: 'TravelJournal', query: {} })
}
function serializeLayout() {
  syncPhotoElements()
  const elements = layout.value.elements.map(element => {
    if (element.role === 'title') return { ...element, text: manualTitle.value.trim() || canvasTitle.value }
    if (element.role === 'note') return { ...element, text: manualNote.value.trim() || canvasNote.value }
    return { ...element }
  })
  return {
    version: 2,
    template: form.style,
    variant: layout.value.variant || getCollageVariant(photos.value.length),
    heroPhotoIndex: displayPhotos.value[0]?.originalIndex ?? 0,
    canvas: { ...layout.value.canvas },
    elements,
    visionAnalysis: visionAnalysis.value || null
  }
}
function restoreLayout(record) {
  const layoutData = record.layout_json || {}
  form.style = layoutData.template || record.style || 'retro'
  form.location = record.location || ''
  form.date = record.travel_date || ''
  form.mood = record.mood || ''
  photos.value = Array.isArray(record.photos) ? [...record.photos] : []
  journalContent.value = record.content_html || ''
  videoUrl.value = record.video_url || ''
  visionAnalysis.value = layoutData.visionAnalysis || null
  const titleElement = layoutData.elements?.find(element => element.role === 'title')
  const noteElement = layoutData.elements?.find(element => element.role === 'note')
  manualTitle.value = titleElement?.text || layoutData.title || record.title || ''
  manualNote.value = noteElement?.text || layoutData.note || ''
  const savedTransforms = layoutData.photoTransforms || {}
  const savedElements = Array.isArray(layoutData.elements) ? layoutData.elements : []
  layout.value = {
    version: 2,
    variant: layoutData.variant || getCollageVariant(photos.value.length),
    canvas: layoutData.canvas || { width: 1000, height: 1400 },
    elements: savedElements.length
      ? savedElements.map(element => {
          const normalized = { ...element }
          if (normalized.role === 'title' && normalized.x === 70 && normalized.y === 70) {
            normalized.x = 0
            normalized.y = 0
          }
          if (normalized.role === 'note' && normalized.x === 70 && normalized.y === 420) {
            normalized.x = 0
            normalized.y = 0
          }
          return normalized
        })
      : createDefaultLayout(photos.value.length).elements.map(element => {
          if (element.type !== 'photo') return element
          const oldTransform = savedTransforms[String(element.photoIndex)] || savedTransforms[element.photoIndex]
          return oldTransform ? { ...element, ...oldTransform } : element
        })
  }
  syncPhotoElements()
  historyPast.value = []
  historyFuture.value = []
  journalGenerated.value = Boolean(journalContent.value || videoUrl.value || photos.value.length)
  isEditing.value = false
  selectedPhotoIndex.value = null
  selectedElementId.value = null
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
}
function handleFiles(e) {
  visionAnalysis.value = null
  journalGenerated.value = false
  journalContent.value = ''
  layout.value = createDefaultLayout()
  selectedPhotoIndex.value = null
  selectedElementId.value = null
  isEditing.value = false
  Array.from(e.target.files).slice(0, 9).forEach(f => {
    const r = new FileReader()
    r.onload = ev => photos.value.push(ev.target.result)
    r.readAsDataURL(f)
  })
}
function removePhoto(index) {
  photos.value.splice(index, 1)
  visionAnalysis.value = null
  journalGenerated.value = false
  journalContent.value = ''
  layout.value = createDefaultLayout()
  selectedPhotoIndex.value = null
  selectedElementId.value = null
  isEditing.value = false
}
function handleDrop(e) {
  visionAnalysis.value = null
  journalGenerated.value = false
  journalContent.value = ''
  layout.value = createDefaultLayout()
  selectedPhotoIndex.value = null
  selectedElementId.value = null
  isEditing.value = false
  Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).slice(0, 9 - photos.value.length).forEach(f => {
    const r = new FileReader()
    r.onload = ev => photos.value.push(ev.target.result)
    r.readAsDataURL(f)
  })
  isDragging.value = false
}

onUnmounted(() => {
  stopPhotoDrag()
  stopElementDrag()
})
watch(() => route.query.journalId, loadSavedJournal, { immediate: true })

function parseJsonResponse(content) {
  const cleaned = String(content || '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null
  }
}

async function analyzeJournalPhotos() {
  const visionPhotos = await Promise.all(photos.value.map(photo => compressVisionImage(photo)))
  const content = [
    {
      type: 'text',
      text: `你是一位旅行手帐视觉编辑。请分析下面按顺序编号的 ${photos.value.length} 张旅行照片，并只返回 JSON，不要 Markdown 代码块。

结合旅行地点“${form.location || '未指定'}”、日期“${form.date || '未指定'}”、心情“${form.mood || '未指定'}”和手帐风格“${styleLabels[form.style]}”，返回：
{
  "title": "不超过14字的手帐标题",
  "highlight": "最值得强调的一个旅行主题，不超过12字",
  "intro": "不超过35字的开篇句",
  "photos": [
    {"index": 1, "order": 1, "scene": "照片场景", "caption": "不超过12字的照片短句"}
  ]
}

要求：photos 数组必须覆盖每一张照片；order 为从 1 开始的展示顺序；不要编造照片中无法确认的人名、地点或事件。`
    },
    ...visionPhotos.map(photo => ({
      type: 'image_url',
      image_url: { url: photo }
    }))
  ]
  content[0].text += `\nFor every photo, also return category, orientation, importance (0 to 1), and suggestedRole. Use suggestedRole=hero for the strongest main image, main for secondary highlights, and support for ordinary supporting images. Choose the hero by visual storytelling value, clarity, composition, and relevance to the trip.`
  const response = await chatWithVision([{ role: 'user', content }], { maxTokens: 2048, retries: 0, timeoutMs: 120000 })
  const result = parseJsonResponse(response.choices?.[0]?.message?.content)
  if (!result || !Array.isArray(result.photos)) throw new Error('视觉分析结果格式不正确')
  return result
}

function compressVisionImage(dataUrl) {
  return new Promise(resolve => {
    const image = new Image()
    image.onload = () => {
      const maxSide = 1280
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.78))
    }
    image.onerror = () => resolve(dataUrl)
    image.src = dataUrl
  })
}

async function exportJournal() {
  if (!journalCanvas.value) return
  try {
    const canvas = await html2canvas(journalCanvas.value, {
      scale: 2,
      backgroundColor: '#F4E8D1',
      useCORS: true
    })
    const link = document.createElement('a')
    link.download = `${form.location || '旅行'}-手帐.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (err) {
    console.error('导出手帐失败:', err)
    alert('导出失败，请稍后重试')
  }
}

const styleLabels = { retro: '复古胶片', clean: '简约清新', vivid: '多彩活泼', dark: '暗黑质感', watercolor: '水彩手绘', magazine: '杂志排版' }

async function generateJournal() {
  if (!photos.value.length) { alert('请先上传照片'); return }
  isGenerating.value = true
  journalGenerated.value = true
  journalContent.value = '正在生成手帐日记…'
  visionAnalysis.value = null
  manualTitle.value = ''
  manualNote.value = ''
  layout.value = createDefaultLayout()
  selectedPhotoIndex.value = null
  selectedElementId.value = null
  isEditing.value = false

  try {
    try {
      visionAnalysis.value = await analyzeJournalPhotos()
    } catch (visionError) {
      console.warn('照片视觉分析失败，将使用基础手帐文案:', visionError)
    }

    const visualBrief = visionAnalysis.value
      ? `
视觉分析结果：
${JSON.stringify(visionAnalysis.value)}

请让日记内容具体呼应这些照片中的场景，但不要添加视觉分析中没有确认的事实。`
      : ''
    const prompt = `你是一位旅行手帐设计师。请根据以下信息生成一篇精美的旅行手帐日记内容。

旅行地点：${form.location || '未指定'}
旅行日期：${form.date || '未指定'}
旅行心情：${form.mood || '无'}
手帐风格：${styleLabels[form.style]}
照片数量：${photos.value.length} 张
${visualBrief}

请输出一篇适合手帐风格的旅行日记，包含：
1. 一个吸引人的标题
2. 一段优美的开篇
3. 按时间顺序的行程记录（2-3个片段）
4. 结尾感悟

用 HTML 格式输出（只输出 HTML，不要其他文字），使用以下结构：
<h1>标题</h1>
<p class="meta">日期 · 地点</p>
<p>开篇段落…</p>
<h3>片段标题</h3>
<p>内容…</p>
<p class="ending">感悟…</p>`

    const resp = await chat([{ role: 'user', content: prompt }], { maxTokens: 2048 })
    const content = resp.choices?.[0]?.message?.content || ''
    journalContent.value = content.trim()
  } catch (err) {
    console.error('生成失败:', err)
    journalContent.value = '生成失败，请稍后重试'
  } finally {
    isGenerating.value = false
  }
}

async function generateWithAI() {
  if (!photos.value.length) { alert('请先上传照片'); return }
  isGenerating.value = true
  journalGenerated.value = true
  journalContent.value = 'AI 正在润色生成…'

  try {
    const prompt = `你是一位旅行手帐文案专家。请根据以下信息，用文艺优美的笔触写一篇旅行手帐日记。

旅行地点：${form.location || '未指定'}
旅行日期：${form.date || '未指定'}
旅行心情：${form.mood || '无'}
手帐风格：${styleLabels[form.style]}
照片数量：${photos.value.length} 张

要求：
1. 语言优美、有画面感
2. 融入感官描写（看到的、听到的、闻到的）
3. 适当使用比喻和拟人
4. 字数 300-500 字
5. 用 HTML 格式输出，包含 <h1>、<p>、<h3> 等标签

请直接输出 HTML 内容，不要其他解释。`

    const resp = await chat([{ role: 'user', content: prompt }], { maxTokens: 2048 })
    const content = resp.choices?.[0]?.message?.content || ''
    journalContent.value = content.trim()
  } catch (err) {
    console.error('生成失败:', err)
    journalContent.value = '生成失败，请稍后重试'
  } finally {
    isGenerating.value = false
  }
}

async function createVideo() {
  if (!photos.value.length) { alert('请先上传照片'); return }
  isVideoGenerating.value = true
  videoUrl.value = ''

  try {
    const prompt = `一段关于${form.location || '旅行'}的唯美风光视频，${form.mood ? '氛围：' + form.mood + '。' : ''}画面包含${photos.value.length}张照片的精彩瞬间，镜头流畅过渡，色彩${form.style === 'retro' ? '温暖复古' : form.style === 'clean' ? '清新明亮' : form.style === 'dark' ? '深沉质感' : form.style === 'watercolor' ? '水彩梦幻' : form.style === 'vivid' ? '鲜艳活泼' : '杂志时尚'}，搭配${form.date ? '日期' + form.date + '的' : ''}美好回忆。`

    const resp = await generateVideo(prompt, { pollInterval: 5000 })
    if (resp.video_url) {
      videoUrl.value = resp.video_url
      journalGenerated.value = true
    } else {
      alert('视频生成成功但未获取到链接')
    }
  } catch (err) {
    console.error('视频生成失败:', err)
    alert('视频生成失败：' + err.message)
  } finally {
    isVideoGenerating.value = false
  }
}

async function saveJournal() {
  if (!authStore.currentUser) {
    alert('请先登录后再保存手账')
    router.push('/auth')
    return
  }
  isSaving.value = true
  try {
    const title = canvasTitle.value
      ? (journalContent.value.match(/<h1>([^<]*)<\/h1>/) || [])[1] || `${form.location || '旅行'}手账`
      : `${form.location || '旅行'}视频手账`
    const journalData = {
      title,
      style: form.style,
      location: form.location,
      travelDate: form.date,
      mood: form.mood,
      photos: photos.value,
      layoutJson: serializeLayout(),
      contentHtml: journalContent.value,
      videoUrl: videoUrl.value
    }
    const result = savedJournalId.value
      ? await journalStore.updateJournal(savedJournalId.value, journalData)
      : await journalStore.saveJournal(journalData)
    if (result.ok) {
      savedJournalId.value = result.record?.id || savedJournalId.value
      alert('手账已保存')
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

/* 风格网格 */
.style-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.style-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 15px 8px 13px; border: 1px solid #E5E0D6; border-radius: 14px;
  background: #FBFAF7; cursor: pointer; transition: all 0.2s;
}
.style-card:hover { border-color: #77B4A6; transform: translateY(-1px); }
.style-card.active { border: 2px solid #0D6B5C; padding: 14px 7px 12px; background: rgba(13,107,92,0.06); box-shadow: 0 5px 14px rgba(13,107,92,0.1); }
.style-icon { display: flex; }
.style-name { font-size: 12px; color: #5C5C6E; font-family: 'Noto Sans SC', sans-serif; }
.style-card.active .style-name { color: #7B5FBF; font-weight: 600; }

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
.form-actions { display: flex; gap: 10px; margin-top: 20px; }
.action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.action-btn {
  flex: 1; padding: 12px; border: none; border-radius: 12px; font-size: 14px;
  font-weight: 600; cursor: pointer; transition: all 0.25s;
  font-family: 'Noto Sans SC', sans-serif; display: flex; align-items: center;
  justify-content: center; gap: 6px;
}
.action-purple { background: linear-gradient(135deg, #0D6B5C, #1A8A7A); color: #fff; box-shadow: 0 5px 14px rgba(13,107,92,0.18); }
.action-purple:hover { box-shadow: 0 4px 16px rgba(155,123,212,0.4); transform: translateY(-1px); }
.action-volo { background: #F7F4EE; color: #9C5A3D; border: 1px solid #E7D8CA; }
.action-volo:hover:not(:disabled) { background: #FFF8F0; border-color: #D7AE91; }
.action-volo:hover:not(:disabled) { box-shadow: 0 4px 16px rgba(194,59,34,0.4); transform: translateY(-1px); }
.action-volo:disabled { opacity: 0.4; cursor: not-allowed; }
.spin-icon { animation: spin 1s linear infinite; }
.action-hint { margin: 10px 0 0; color: #9BA89D; font-size: 11px; text-align: center; }
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
.preview-area::before { content: ''; position: absolute; inset: 14px; border: 1px solid rgba(255,255,255,0.65); border-radius: 16px; pointer-events: none; }
.preview-paper-mark { position: absolute; top: 22px; right: 28px; color: rgba(13,107,92,0.16); font-size: 26px; transform: rotate(12deg); }

.preview-loading { text-align: center; }
.preview-loading p { font-size: 14px; color: #5C5C6E; margin-top: 16px; }
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

/* 第一阶段：固定复古拼贴手帐画布 */
.journal-canvas-shell { width: 100%; display: flex; justify-content: center; }
.journal-canvas {
  position: relative; width: min(100%, 560px); aspect-ratio: 3 / 4; overflow: hidden;
  color: #3D4038; background-color: #F4E8D1;
  background-image: linear-gradient(rgba(169,137,91,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(169,137,91,0.08) 1px, transparent 1px);
  background-size: 22px 22px; box-shadow: 0 12px 26px rgba(74,57,34,0.2);
}
.journal-canvas::after { content: ''; position: absolute; inset: 10px; border: 1px solid rgba(112,82,45,0.18); pointer-events: none; }
.canvas-header { position: absolute; z-index: 2; top: 5.5%; left: 8%; right: 8%; text-align: left; }
.canvas-label { color: #66725F; font-size: 8px; font-weight: 800; letter-spacing: 1.4px; }
.canvas-header h1 { margin: 7px 0 3px; color: #2D5B62; font-size: clamp(22px, 4vw, 36px); line-height: 1.1; font-family: 'Noto Sans SC', sans-serif; }
.canvas-header h1 { font-size: var(--journal-text-size, clamp(22px, 4vw, 36px)); color: var(--journal-text-color, #2D5B62); }
.canvas-header p { margin: 0; color: #846C50; font-size: 11px; }
.canvas-photo-grid { position: absolute; z-index: 1; top: 22%; left: 7%; right: 7%; bottom: 13%; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); gap: 9px; }
.canvas-photo { position: relative; min-width: 0; min-height: 0; padding: 5px; background: #FFFDF7; box-shadow: 0 4px 9px rgba(66,49,25,0.22); transform: rotate(-1deg); touch-action: none; will-change: transform; cursor: default; transition: box-shadow 0.18s; }
.canvas-photo.selected { outline: 2px solid #0D6B5C; outline-offset: 3px; cursor: grab; box-shadow: 0 7px 16px rgba(13,107,92,0.32); }
.canvas-photo.selected:active { cursor: grabbing; }
.canvas-photo:nth-child(2n) { transform: rotate(1.2deg); }
.canvas-photo:nth-child(3n) { transform: rotate(-0.5deg); }
.canvas-photo img { width: 100%; height: 100%; display: block; object-fit: cover; }
.photo-tape { position: absolute; z-index: 2; top: -7px; left: 26%; width: 48%; height: 14px; background: rgba(210,180,123,0.7); transform: rotate(-3deg); }
.photo-caption { position: absolute; z-index: 3; right: 7px; bottom: 6px; max-width: 80%; padding: 2px 5px; color: #4E4438; background: rgba(255,249,230,0.82); font-size: 7px; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.canvas-note { position: absolute; z-index: 3; bottom: 3.2%; display: flex; flex-direction: column; gap: 3px; max-width: 35%; color: var(--journal-text-color, #5C634F); font-size: var(--journal-text-size, 8px); line-height: 1.4; }
.canvas-note strong { color: var(--journal-text-color, #3D5B53); font-size: calc(var(--journal-text-size, 11px) * .85); }
.canvas-note-left { left: 8%; }
.canvas-note-right { right: 8%; text-align: right; }
.canvas-sticker { position: absolute; z-index: 3; color: #C89448; font-size: 24px; }
.canvas-sticker-one { top: 14%; right: 10%; transform: rotate(15deg); }
.canvas-sticker-two { bottom: 4%; left: 47%; color: #C77865; transform: rotate(-12deg); }
.canvas-element-decoration { position: absolute; width: auto; min-width: 34px; padding: 2px 6px; border: 0; background: transparent; color: #C89448; font: inherit; font-size: 27px; line-height: 1; cursor: grab; touch-action: none; will-change: left, top, transform; transform-origin: center; }
.canvas-element-decoration.selected { outline: 1px dashed rgba(13,107,92,0.65); outline-offset: 5px; }
.canvas-element-decoration:active { cursor: grabbing; }
.canvas-editable-text { touch-action: none; will-change: transform; }
.canvas-editable-text.selected { outline: 1px dashed rgba(13,107,92,0.65); outline-offset: 6px; cursor: grab; }
.canvas-editable-text:active { cursor: grabbing; }
.canvas-custom-text { position: absolute; max-width: 42%; padding: 8px 11px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; cursor: grab; touch-action: none; will-change: left, top, transform; }
.canvas-custom-text:active { cursor: grabbing; }
.canvas-custom-text.selected { outline: 1px dashed rgba(13,107,92,0.7); outline-offset: 5px; }
.custom-text-paper { background: rgba(255,250,232,.84); box-shadow: 2px 3px 0 rgba(181,147,95,.16); transform: rotate(-1.5deg); }
.custom-text-label { color: #4A6371 !important; background: #DCEBEA; border-left: 4px solid #6B9E98; transform: rotate(1deg); }
.custom-text-hand { color: #785A45 !important; font-family: 'KaiTi', 'STKaiti', serif; background: transparent; transform: rotate(-2deg); }
.custom-text-marker { color: #4E5042 !important; background: linear-gradient(transparent 48%, rgba(242,205,112,.58) 48% 88%, transparent 88%); transform: rotate(.8deg); }
.custom-text-typewriter { color: #3F4845 !important; background: #E7E4D9; border: 1px dashed #84908A; font-family: 'Courier New', monospace; font-size: .88em !important; }
.decoration-tape { width: 74px; height: 24px; min-width: 0; padding: 0; color: rgba(210,174,113,0.58); background: repeating-linear-gradient(135deg, rgba(210,174,113,0.6) 0 8px, rgba(239,218,175,0.72) 8px 16px); opacity: .8; }
.decoration-line { color: #6DA4A1; font-size: 34px; }
.decoration-sticker-spark { color: #C89448; text-shadow: 1px 1px 0 #F3D48F; }
.decoration-sticker-flower { color: #D37772; text-shadow: 1px 1px 0 #F7D7B5; }
.decoration-sticker-heart { color: #C45D67; font-size: 32px; }
.decoration-sticker-sun { color: #D39D35; font-size: 31px; }
.decoration-tape-washi { background: repeating-linear-gradient(135deg, rgba(226,153,132,.7) 0 8px, rgba(250,206,188,.8) 8px 16px); }
.decoration-tape-grid { background-color: rgba(143,183,179,.72); background-image: linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px); background-size: 8px 8px; }
.decoration-tape-paper { background: rgba(232,205,157,.86); filter: sepia(.18); }
.decoration-tape-stripe { background: repeating-linear-gradient(90deg, rgba(181,141,202,.72) 0 7px, rgba(237,206,230,.82) 7px 14px); }
.decoration-line-wave { color: #6DA4A1; }
.decoration-line-dotted { color: #C89448; letter-spacing: 5px; font-size: 22px; }
.decoration-line-arrow { color: #C77865; font-size: 30px; }
.decoration-line-brush { color: #5B8470; font-weight: 800; }
.canvas-clean { background-color: #F7F8F4; background-image: linear-gradient(rgba(100,122,111,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(100,122,111,0.07) 1px, transparent 1px); }
.canvas-clean .canvas-header h1 { color: #315D55; }
.canvas-clean .canvas-photo-grid { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(5, 1fr); gap: 12px; left: 10%; right: 10%; }
.canvas-clean .canvas-photo { transform: none; padding: 4px; box-shadow: 0 2px 7px rgba(43,61,49,0.12); }
.canvas-clean .photo-tape { display: none; }
.canvas-vivid { background-color: #F7E7D8; background-image: radial-gradient(rgba(194,59,34,0.12) 1px, transparent 1px); background-size: 16px 16px; }
.canvas-vivid .canvas-header h1 { color: #B34832; }
.canvas-vivid .canvas-photo { border-radius: 14px; border: 3px solid #FFF7E8; transform: rotate(-1.5deg); }
.canvas-vivid .canvas-photo:nth-child(2n) { transform: rotate(1.5deg); }
.canvas-vivid .canvas-photo img { border-radius: 9px; }
.canvas-vivid .photo-tape { background: rgba(224,137,107,0.7); }
.canvas-dark { color: #F1E5CE; background-color: #202D31; background-image: linear-gradient(rgba(240,220,186,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(240,220,186,0.07) 1px, transparent 1px); }
.canvas-dark .canvas-header h1, .canvas-dark .canvas-note strong { color: #F3D18B; }
.canvas-dark .canvas-header p, .canvas-dark .canvas-note { color: #D6C9B0; }
.canvas-dark .canvas-photo-grid { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(5, 1fr); gap: 10px; left: 9%; right: 9%; }
.canvas-dark .canvas-photo { padding: 3px; background: #E7D9BD; box-shadow: 0 5px 12px rgba(0,0,0,0.42); transform: none; }
.canvas-dark .canvas-photo:nth-child(2n) { transform: translateY(5px); }
.canvas-dark .photo-tape { background: rgba(74,89,89,0.75); }
.canvas-watercolor { background-color: #E8F0EA; background-image: radial-gradient(rgba(65,119,103,0.1) 18%, transparent 20%); background-size: 32px 32px; }
.canvas-watercolor .canvas-header h1 { color: #477C71; }
.canvas-watercolor .canvas-photo { padding: 7px; border-radius: 18px; background: rgba(255,255,255,0.82); box-shadow: 0 4px 10px rgba(65,119,103,0.16); transform: rotate(-1deg); }
.canvas-watercolor .canvas-photo:nth-child(2n) { transform: rotate(1deg); }
.canvas-watercolor .canvas-photo img { border-radius: 12px; }
.canvas-watercolor .photo-tape { background: rgba(157,193,183,0.65); }
.canvas-magazine { background-color: #E9E5DA; background-image: linear-gradient(135deg, rgba(38,44,41,0.08) 25%, transparent 25%); background-size: 18px 18px; }
.canvas-magazine .canvas-header h1 { color: #2D3835; text-transform: uppercase; }
.canvas-magazine .canvas-photo-grid { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); gap: 8px; left: 7%; right: 7%; }
.canvas-magazine .canvas-photo:first-child { grid-column: span 2; grid-row: span 2; }
.canvas-magazine .canvas-photo { padding: 3px; background: #252C2B; box-shadow: none; transform: none; }
.canvas-magazine .canvas-photo img { filter: saturate(0.82) contrast(1.08); }
.canvas-magazine .photo-tape { background: rgba(38,44,41,0.72); }

/* 按照片数量切换拼贴版式：主图负责叙事，其余照片形成节奏和留白。 */
.journal-canvas.photo-count-3 .canvas-photo-grid {
  grid-template-columns: 1.35fr 1fr;
  grid-template-rows: 1.45fr 1fr;
  gap: 12px;
  top: 22%;
  bottom: 16%;
}
.journal-canvas.photo-count-3 .canvas-photo:first-child { grid-column: 1 / -1; grid-row: 1; }
.journal-canvas.photo-count-3 .canvas-photo:nth-child(2) { grid-column: 1; grid-row: 2; }
.journal-canvas.photo-count-3 .canvas-photo:nth-child(3) { grid-column: 2; grid-row: 2; }

.journal-canvas.photo-count-5 .canvas-photo-grid {
  grid-template-columns: 1.15fr .85fr .9fr;
  grid-template-rows: 1.15fr 1fr 1fr;
  gap: 10px;
  top: 21%;
  bottom: 14%;
}
.journal-canvas.photo-count-5 .canvas-photo:first-child { grid-column: 1 / 3; grid-row: 1 / 3; }
.journal-canvas.photo-count-5 .canvas-photo:nth-child(2) { grid-column: 3; grid-row: 1; }
.journal-canvas.photo-count-5 .canvas-photo:nth-child(3) { grid-column: 3; grid-row: 2; }
.journal-canvas.photo-count-5 .canvas-photo:nth-child(4) { grid-column: 1; grid-row: 3; }
.journal-canvas.photo-count-5 .canvas-photo:nth-child(5) { grid-column: 2 / 4; grid-row: 3; }

.journal-canvas.photo-count-9 .canvas-photo-grid {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 9px;
  top: 22%;
  bottom: 13%;
}
.journal-canvas.photo-count-9 .canvas-photo:nth-child(3n + 1) { transform: rotate(-1.8deg); }
.journal-canvas.photo-count-9 .canvas-photo:nth-child(3n + 2) { transform: rotate(.8deg); }
.journal-canvas.photo-count-9 .canvas-photo:nth-child(3n) { transform: rotate(-.5deg); }

.preview-video { width: 100%; display: flex; flex-direction: column; align-items: center; }
.video-player { width: 100%; max-height: 400px; border-radius: 12px; background: #000; }
.preview-empty { text-align: center; }
.preview-empty svg { display: flex; margin: 0 auto 16px; }
.preview-empty p { font-size: 14px; color: #8B8B9E; margin: 0 0 8px; }
.empty-steps { font-size: 11px; color: #B8B8C8; }

/* 风格配色 */
.style-retro { background: linear-gradient(180deg, #F5ECD7 0%, #EDE0C8 100%); }
.style-clean { background: linear-gradient(180deg, #FAFAFA 0%, #F0F0F0 100%); }
.style-vivid { background: linear-gradient(180deg, #FFF5F5 0%, #FFE8E8 100%); }
.style-dark { background: linear-gradient(180deg, #2A2A3E 0%, #1A1A2E 100%); }
.style-dark .preview-empty p { color: #8B8B9E; }
.style-watercolor { background: linear-gradient(180deg, #F0F4FA 0%, #E0EAF5 100%); }
.style-magazine { background: linear-gradient(180deg, #FAFAF8 0%, #F0EDE6 100%); }

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
.editor-actions { display: flex; gap: 8px; margin-top: 10px; }
.edit-journal-btn, .reset-layout-btn { flex: 1; padding: 9px 12px; border-radius: 10px; font: 12px 'Noto Sans SC', sans-serif; font-weight: 600; cursor: pointer; }
.edit-journal-btn { color: #fff; background: #1A3A2E; border: 1px solid #1A3A2E; }
.edit-journal-btn:hover { background: #0D6B5C; }
.reset-layout-btn { color: #6F776F; background: #F8F6F0; border: 1px solid #E5E0D6; }
.reset-layout-btn:hover { color: #0D6B5C; border-color: #9CC8B9; }
.editor-panel { margin-top: 10px; padding: 14px; border: 1px solid #DCE8DE; border-radius: 13px; background: #F6FAF6; }
.editor-toolbar { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.editor-toolbar button { border: 1px solid #D9E4DB; border-radius: 7px; background: #fff; color: #386353; padding: 6px 8px; font: 11px 'Noto Sans SC', sans-serif; cursor: pointer; }
.editor-toolbar button:hover:not(:disabled) { border-color: #76AA91; color: #0D6B5C; background: #F0F8F2; }
.editor-toolbar button:disabled { opacity: .45; cursor: not-allowed; }
.editor-text-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin: 10px 0; padding: 9px; border-radius: 8px; background: #EEF7F0; color: #386353; font-size: 11px; }
.editor-text-controls label { display: inline-flex; align-items: center; gap: 5px; }
.editor-text-controls input[type="color"] { width: 28px; height: 22px; padding: 1px; border: 1px solid #D9E4DB; border-radius: 5px; background: #fff; }
.editor-custom-text-controls { margin-top: 9px; }
.editor-custom-text-controls textarea { width: 100%; box-sizing: border-box; margin-top: 5px; padding: 8px; border: 1px solid #D9E4DB; border-radius: 8px; resize: vertical; color: #354A40; background: #fff; font: 12px/1.5 'Noto Sans SC', sans-serif; }
.editor-fields { display: grid; grid-template-columns: 1fr 1.4fr; gap: 10px; }
.editor-panel label { display: flex; flex-direction: column; gap: 5px; color: #657067; font-size: 11px; }
.editor-panel input[type="text"], .editor-panel input:not([type]), .editor-panel textarea { width: 100%; box-sizing: border-box; padding: 7px 9px; border: 1px solid #DCE3DC; border-radius: 8px; outline: none; color: #25372F; background: #fff; font: 12px 'Noto Sans SC', sans-serif; resize: vertical; }
.editor-panel input:focus, .editor-panel textarea:focus { border-color: #65A58D; box-shadow: 0 0 0 2px rgba(13,107,92,0.08); }
.editor-photo-controls { display: grid; grid-template-columns: 1.1fr 1fr 1fr; align-items: center; gap: 10px; margin-top: 12px; padding-top: 11px; border-top: 1px solid #DCE8DE; color: #657067; font-size: 11px; }
.editor-photo-controls strong { color: #0D6B5C; font-size: 11px; }
.editor-photo-controls label { display: flex; flex-direction: row; align-items: center; gap: 5px; }
.editor-photo-controls input[type="range"] { min-width: 0; width: 100%; accent-color: #0D6B5C; }
.editor-help { margin: 11px 0 0; color: #8D9B90; font-size: 11px; text-align: center; }

@media (max-width: 900px) {
  .page-container { width: calc(100% - 32px); padding-top: 32px; }
  .journal-layout { grid-template-columns: 1fr; }
  .journal-preview { position: static; }
  .preview-area { min-height: 480px; }
}

@media (max-width: 560px) {
  .page-container { width: calc(100% - 24px); padding-top: 24px; }
  .page-title { font-size: 25px; }
  .page-subtitle { line-height: 1.6; }
  .journal-steps { gap: 6px; justify-content: flex-start; overflow-x: auto; padding: 0 2px 4px; }
  .journal-step strong { display: none; }
  .journal-steps i { width: 22px; flex-shrink: 0; }
  .journal-form { padding: 18px; border-radius: 18px; }
  .style-grid { grid-template-columns: repeat(2, 1fr); }
  .info-row { grid-template-columns: 1fr; }
  .photo-list { grid-template-columns: repeat(4, 1fr); }
  .form-actions { flex-direction: column; }
  .preview-area { min-height: 400px; padding: 22px; border-radius: 18px; }
  .editor-fields, .editor-photo-controls { grid-template-columns: 1fr; }
}
</style>
