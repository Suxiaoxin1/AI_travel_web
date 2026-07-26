<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">创作你的手帐</h1>
      <p class="page-subtitle">选择风格，上传旅途照片，AI 将生成精美的旅行日记手帐</p>
    </div>
    <div class="journal-layout">
      <!-- 左侧：表单区 -->
      <div class="journal-form">
        <!-- 手帐风格选择 -->
        <div class="form-section">
          <h3 class="section-title">选择手帐风格</h3>
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
          <div class="upload-zone" :class="{ dragging: isDragging }" @dragover.prevent="isDragging = true" @dragleave="isDragging = false" @drop.prevent="handleDrop" @click="triggerUpload">
            <svg class="upload-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#B8C5B0" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <p class="upload-text">点击或拖拽上传旅途照片</p>
            <p class="upload-hint">建议 3-9 张，支持 JPG/PNG</p>
            <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="handleFiles" />
          </div>
          <div class="photo-list" v-if="photos.length">
            <div v-for="(p, i) in photos" :key="i" class="photo-thumb">
              <img :src="p" alt="" />
              <button class="photo-remove" @click.stop="photos.splice(i, 1)">×</button>
            </div>
          </div>
        </div>

        <!-- 旅行信息 -->
        <div class="form-section">
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
      </div>

      <!-- 右侧：预览区 -->
      <div class="journal-preview">
        <h3 class="preview-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A8A7A" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          手帐预览
        </h3>
        <div class="preview-area" :class="'style-' + form.style">
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
          <div v-else-if="journalGenerated && journalContent" class="preview-content" v-html="journalContent"></div>
          <div v-else-if="journalGenerated && videoUrl" class="preview-video">
            <video :src="videoUrl" controls autoplay loop muted playsinline class="video-player"></video>
          </div>
          <div v-else class="preview-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4C8B8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <p>生成后在此预览你的手帐</p>
            <span class="empty-steps">选择风格 → 上传照片 → 点击生成</span>
          </div>
        </div>
        <button
          v-if="journalGenerated && (journalContent || videoUrl)"
          class="save-journal-btn"
          @click="saveJournal"
          :disabled="isSaving"
        >
          {{ isSaving ? '保存中…' : '保存手账' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { chat, generateVideo } from '../utils/agnesApi.js'
import { useAuthStore } from '../stores/authStore.js'
import { useJournalStore } from '../stores/journalStore.js'

const router = useRouter()
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

function triggerUpload() { fileInput.value.click() }
function handleFiles(e) {
  Array.from(e.target.files).slice(0, 9).forEach(f => {
    const r = new FileReader()
    r.onload = ev => photos.value.push(ev.target.result)
    r.readAsDataURL(f)
  })
}
function handleDrop(e) {
  Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).slice(0, 9 - photos.value.length).forEach(f => {
    const r = new FileReader()
    r.onload = ev => photos.value.push(ev.target.result)
    r.readAsDataURL(f)
  })
  isDragging.value = false
}

const styleLabels = { retro: '复古胶片', clean: '简约清新', vivid: '多彩活泼', dark: '暗黑质感', watercolor: '水彩手绘', magazine: '杂志排版' }

async function generateJournal() {
  if (!photos.value.length) { alert('请先上传照片'); return }
  isGenerating.value = true
  journalGenerated.value = true
  journalContent.value = '正在生成手帐日记…'

  try {
    const prompt = `你是一位旅行手帐设计师。请根据以下信息生成一篇精美的旅行手帐日记内容。

旅行地点：${form.location || '未指定'}
旅行日期：${form.date || '未指定'}
旅行心情：${form.mood || '无'}
手帐风格：${styleLabels[form.style]}
照片数量：${photos.value.length} 张

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
    const title = journalContent.value
      ? (journalContent.value.match(/<h1>([^<]*)<\/h1>/) || [])[1] || `${form.location || '旅行'}手账`
      : `${form.location || '旅行'}视频手账`
    const result = await journalStore.saveJournal({
      title,
      style: form.style,
      location: form.location,
      travelDate: form.date,
      mood: form.mood,
      photos: photos.value,
      contentHtml: journalContent.value,
      videoUrl: videoUrl.value
    })
    if (result.ok) {
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
/* 页面容器：与首页一致，限制横向宽度并居中 */
.page-container { max-width: 1400px; width: 70%; margin: 0 auto; padding: 40px 24px; }

.page-header { text-align: center; margin-bottom: 32px; }
.page-title { font-size: 28px; font-weight: 700; color: #1A1A2E; margin: 0 0 6px; font-family: 'Noto Sans SC', sans-serif; }
.page-subtitle { font-size: 13px; color: #8B8B9E; margin: 0; }

.journal-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }

/* ===== 左侧表单 ===== */
.journal-form {
  background: #fff; border: 1px solid #E5E0D6; border-radius: 20px;
  padding: 24px; box-shadow: 0 2px 16px rgba(0,0,0,0.06);
}

.form-section { margin-bottom: 20px; }
.section-title { font-size: 14px; font-weight: 600; color: #1A1A2E; margin: 0 0 12px; }

/* 风格网格 */
.style-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.style-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 14px 8px; border: 2px solid #E5E0D6; border-radius: 14px;
  background: #F8F6F0; cursor: pointer; transition: all 0.2s;
}
.style-card:hover { border-color: #1A8A7A; }
.style-card.active { border-color: #9B7BD4; background: rgba(155,123,212,0.08); }
.style-icon { display: flex; }
.style-name { font-size: 12px; color: #5C5C6E; font-family: 'Noto Sans SC', sans-serif; }
.style-card.active .style-name { color: #7B5FBF; font-weight: 600; }

/* 上传区 */
.upload-zone {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  border: 2px dashed #E5E0D6; border-radius: 16px; padding: 28px; cursor: pointer;
  transition: all 0.2s; background: #FAFAF8;
}
.upload-zone:hover, .upload-zone.dragging { border-color: #1A8A7A; background: rgba(26,138,122,0.03); }
.upload-icon { display: flex; margin-bottom: 10px; }
.upload-text { font-size: 13px; color: #5C5C6E; margin: 0 0 4px; }
.upload-hint { font-size: 11px; color: #8B8B9E; margin: 0; }

.photo-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.photo-thumb { position: relative; width: 72px; height: 72px; border-radius: 10px; overflow: hidden; border: 1px solid #E5E0D6; }
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
.action-purple { background: linear-gradient(135deg, #9B7BD4, #7B5FBF); color: #fff; }
.action-purple:hover { box-shadow: 0 4px 16px rgba(155,123,212,0.4); transform: translateY(-1px); }
.action-volo { background: linear-gradient(135deg, #C23B22, #E85D4A); color: #fff; }
.action-volo:hover:not(:disabled) { box-shadow: 0 4px 16px rgba(194,59,34,0.4); transform: translateY(-1px); }
.action-volo:disabled { opacity: 0.4; cursor: not-allowed; }
.spin-icon { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== 右侧预览 ===== */
.journal-preview { position: sticky; top: 100px; }
.preview-title { font-size: 16px; font-weight: 700; color: #1A1A2E; margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
.preview-area {
  background: #FAFAF8; border: 1px solid #E5E0D6; border-radius: 20px;
  min-height: 500px; padding: 24px; display: flex; flex-direction: column;
  justify-content: center; align-items: center;
}

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
</style>
