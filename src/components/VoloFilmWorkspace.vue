<template>
  <!--
    FILM VOLO：左表单 / 右预览
    主链路见 script 顶部注释与 utils/filmCompose.js 文件头架构说明
  -->
  <div class="volo-workspace" id="volo-workspace">
    <div class="volo-steps" aria-label="相册成片流程">
      <div class="volo-step" :class="{ active: true }"><span>01</span><strong>上传照片</strong></div>
      <i></i>
      <div class="volo-step" :class="{ active: hasTripInfo }"><span>02</span><strong>填写信息</strong></div>
      <i></i>
      <div class="volo-step" :class="{ active: previewStatus !== 'idle' }"><span>03</span><strong>合成视频</strong></div>
    </div>

    <div class="volo-layout">
      <aside class="volo-form" id="journal-form">
        <!-- STEP 01 -->
        <section class="volo-section" id="journal-photos">
          <div class="section-head">
            <div>
              <span class="kicker">STEP 01</span>
              <h3>导入旅途照片</h3>
            </div>
            <span class="count" :class="{ warn: form.photos.length < FILM_MIN_PHOTOS }">
              已选 {{ form.photos.length }}/{{ FILM_MAX_PHOTOS }}
            </span>
          </div>

          <div
            class="upload-zone"
            :class="{ dragging, needed: form.photos.length < FILM_MIN_PHOTOS, full: form.photos.length >= FILM_MAX_PHOTOS }"
            @dragover.prevent="dragging = true"
            @dragleave="dragging = false"
            @drop.prevent="onDrop"
            @click="triggerPick"
          >
            <p class="upload-title">点击或拖拽上传旅途照片</p>
            <p class="upload-hint">{{ FILM_MIN_PHOTOS }}–{{ FILM_MAX_PHOTOS }} 张 · JPG / PNG / WebP · 单张不超过 {{ FILM_MAX_FILE_MB }}MB</p>
            <p v-if="form.photos.length >= FILM_MAX_PHOTOS" class="upload-full">已达上限，请先删除后再添加</p>
            <input
              ref="fileInput"
              type="file"
              :accept="FILM_ACCEPT"
              multiple
              hidden
              :disabled="form.photos.length >= FILM_MAX_PHOTOS"
              @change="onPickFiles"
            />
          </div>

          <div v-if="form.photos.length" class="thumb-grid" @dragover.prevent>
            <div
              v-for="(photo, index) in form.photos"
              :key="photo.id"
              class="thumb"
              :class="{ error: photo.status === 'error' }"
              draggable="true"
              @dragstart="onDragStart(index, $event)"
              @dragover.prevent
              @drop.prevent="onReorderDrop(index)"
            >
              <img :src="photo.previewUrl" alt="" />
              <span class="thumb-index">{{ index + 1 }}</span>
              <span v-if="photo.status === 'uploading'" class="thumb-mask">上传中</span>
              <span v-else-if="photo.status === 'error'" class="thumb-mask error">失败</span>
              <button type="button" class="thumb-remove" aria-label="删除" @click.stop="removePhoto(index)">×</button>
            </div>
          </div>
          <p v-if="form.photos.length && form.photos.length < FILM_MIN_PHOTOS" class="field-hint warn">
            还差 {{ FILM_MIN_PHOTOS - form.photos.length }} 张即可合成
          </p>
        </section>

        <!-- STEP 02 -->
        <section class="volo-section">
          <div class="section-head">
            <div>
              <span class="kicker">STEP 02</span>
              <h3>补充旅途信息</h3>
            </div>
            <span class="count">可选</span>
          </div>
          <div class="info-grid">
            <label class="field">
              <span>旅行地点</span>
              <input v-model="form.location" type="text" placeholder="例如：张家界" />
            </label>
            <label class="field">
              <span>旅行日期</span>
              <input v-model="form.travelDate" type="date" />
            </label>
          </div>
          <label class="field full">
            <span>旅行心得（可选）</span>
            <textarea v-model="form.travelNote" rows="3" placeholder="记录一下旅途中的心情与故事…" />
          </label>
        </section>

        <!-- STEP 02b 视频参数：默认折叠，但入口要醒目可点 -->
        <section class="volo-section params">
          <button
            type="button"
            class="params-toggle"
            :class="{ open: paramsOpen }"
            @click="paramsOpen = !paramsOpen"
            :aria-expanded="paramsOpen"
          >
            <div class="params-toggle-main">
              <span class="kicker">STEP 02b</span>
              <strong>视频参数</strong>
              <span class="params-cta">{{ paramsOpen ? '点击收起设置' : '点击展开：分辨率 / 比例 / 旁白' }}</span>
            </div>
            <div class="params-toggle-side">
              <span class="params-chip">{{ form.resolution }}</span>
              <span class="params-chip">{{ form.ratio }}</span>
              <span class="params-chip">{{ form.narrationEnabled ? '旁白开' : '无声' }}</span>
              <span class="params-chevron" aria-hidden="true">{{ paramsOpen ? '▴' : '▾' }}</span>
            </div>
          </button>

          <div v-show="paramsOpen" class="params-body">
          <div class="param-block">
            <p class="param-label">分辨率</p>
            <div class="chip-row" role="radiogroup" aria-label="分辨率">
              <button
                v-for="opt in RESOLUTION_OPTIONS"
                :key="opt.value"
                type="button"
                class="chip"
                :class="{ active: form.resolution === opt.value }"
                @click="form.resolution = opt.value"
              >
                {{ opt.label }}
                <em v-if="opt.hint">{{ opt.hint }}</em>
              </button>
            </div>
          </div>

          <div class="param-block">
            <p class="param-label">画幅比例</p>
            <div class="chip-row" role="radiogroup" aria-label="画幅比例">
              <button
                v-for="opt in RATIO_OPTIONS"
                :key="opt.value"
                type="button"
                class="chip"
                :class="{ active: form.ratio === opt.value }"
                @click="form.ratio = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div class="param-block">
            <p class="param-label">时长策略</p>
            <div class="chip-row">
              <button
                type="button"
                class="chip"
                :class="{ active: form.durationMode === 'auto' }"
                :disabled="!form.narrationEnabled"
                @click="form.durationMode = 'auto'"
              >
                自动对齐旁白
              </button>
              <button type="button" class="chip" :class="{ active: form.durationMode === 'manual' }" @click="form.durationMode = 'manual'">
                使用手动时长
              </button>
            </div>
            <p class="field-hint">
              {{ form.narrationEnabled
                ? '自动：按旁白长短均分到每张照片；手动：每张固定你填写的秒数。'
                : '旁白关闭时使用手动时长（每张固定秒数）。' }}
            </p>
          </div>

          <div class="param-block" :class="{ muted: isDurationAuto }">
            <p class="param-label">单张图片时长（秒）</p>
            <div class="stepper" :class="{ disabled: isDurationAuto }">
              <button
                type="button"
                @click="bumpDuration(-1)"
                :disabled="isDurationAuto || form.durationPerImage <= FILM_DURATION_MIN"
              >−</button>
              <input
                v-model.number="form.durationPerImage"
                type="number"
                :min="FILM_DURATION_MIN"
                :max="FILM_DURATION_MAX"
                step="1"
                :disabled="isDurationAuto"
              />
              <button
                type="button"
                @click="bumpDuration(1)"
                :disabled="isDurationAuto || form.durationPerImage >= FILM_DURATION_MAX"
              >+</button>
            </div>
            <p class="field-hint">
              {{ isDurationAuto ? '当前由旁白决定，单张时长暂不生效。' : `预计成片约 ${estimatedManualSeconds} 秒（照片数 × 单张时长）。` }}
            </p>
          </div>

          <div class="param-block">
            <div class="switch-row">
              <p class="param-label">生成旁白</p>
              <button
                type="button"
                class="switch"
                :class="{ on: form.narrationEnabled }"
                :aria-pressed="form.narrationEnabled"
                @click="toggleNarration"
              >
                <span>{{ form.narrationEnabled ? '开' : '关' }}</span>
              </button>
            </div>
            <p class="field-hint">关闭后生成无声动态成片；开启后需有旁白文案。</p>
          </div>

          <template v-if="form.narrationEnabled">
            <label class="field full">
              <span>旁白文案</span>
              <textarea
                v-model="form.narrationText"
                rows="4"
                placeholder="可留空：将优先使用旅行心得；仍为空则用「一段关于{地点}的旅途回忆。」"
              />
            </label>
            <div class="narration-actions">
              <button
                type="button"
                class="ghost-btn"
                :disabled="aiNarrationLoading || isComposeBusy"
                @click="generateNarrationDraft"
              >
                {{ aiNarrationLoading ? '生成中…' : 'AI 生成旁白' }}
              </button>
            </div>
            <div class="param-block">
              <p class="param-label">音色</p>
              <div class="chip-row">
                <button type="button" class="chip" :class="{ active: form.voice === 'female' }" @click="form.voice = 'female'">女声</button>
                <button type="button" class="chip" :class="{ active: form.voice === 'male' }" @click="form.voice = 'male'">男声</button>
              </div>
            </div>
          </template>

          <label class="field full">
            <span>补充要求（可选）</span>
            <textarea v-model="form.requirement" rows="2" placeholder="治愈风，镜头慢一点，慵懒悠闲" />
          </label>
          </div>
        </section>

        <div class="form-actions">
          <button
            type="button"
            class="primary-btn"
            :disabled="!canCompose || isComposeBusy"
            @click="startCompose"
          >
            {{ leftCtaLabel }}
          </button>
          <p class="action-hint">{{ leftHint }}</p>
        </div>
      </aside>

      <!-- STEP 03：粘滞预览，用清单/缩略图填满空白 -->
      <section class="volo-preview">
        <div class="preview-head">
          <div>
            <span class="kicker">STEP 03</span>
            <h3>成片预览</h3>
          </div>
          <button
            type="button"
            class="ghost-btn"
            :disabled="isComposeBusy"
            @click="resetResultKeepForm"
          >
            再做一条
          </button>
        </div>

        <div class="preview-frame" :class="previewStatus">
          <!-- idle -->
          <div v-if="previewStatus === 'idle'" class="preview-idle">
            <p>上传 {{ FILM_MIN_PHOTOS }}–{{ FILM_MAX_PHOTOS }} 张照片并填写信息后，点击下方按钮开始合成。</p>
            <p class="sub">成片约 1–数分钟，请耐心等待。</p>
          </div>

          <!-- composing -->
          <div v-else-if="previewStatus === 'composing'" class="preview-loading">
            <div class="spinner" aria-hidden="true"></div>
            <p>{{ stageLabel }}</p>
            <div v-if="progress != null" class="progress-bar">
              <i :style="{ width: `${progress}%` }"></i>
            </div>
            <p v-else class="sub">合成中，请勿关闭页面</p>
          </div>

          <!-- success -->
          <div v-else-if="previewStatus === 'success'" class="preview-success">
            <video
              v-if="isRealVideo"
              ref="videoEl"
              :src="resultVideoUrl"
              controls
              autoplay
              playsinline
              class="result-video"
            />
            <div v-else class="stub-frame">
              <img :src="resultVideoUrl" alt="成片预览占位" />
              <p class="stub-note">UI 联调占位：真实视频接口接入后将在此播放 MP4</p>
            </div>
            <p class="meta-line">{{ resultSummary }}</p>
          </div>

          <!-- failed -->
          <div v-else class="preview-failed">
            <p>{{ errorMessage || '合成失败，请重试' }}</p>
          </div>
        </div>

        <!-- 右栏摘要：让空闲态也有视觉重量，与左栏对齐 -->
        <div v-if="previewStatus === 'idle' || previewStatus === 'composing'" class="preview-aside">
          <div v-if="form.photos.length" class="aside-strip" aria-label="镜头顺序预览">
            <img
              v-for="(photo, index) in form.photos"
              :key="photo.id"
              :src="photo.previewUrl"
              :alt="`镜头 ${index + 1}`"
            />
          </div>
          <ul class="aside-check">
            <li :class="{ ok: form.photos.length >= FILM_MIN_PHOTOS }">
              照片 {{ form.photos.length }}/{{ FILM_MAX_PHOTOS }}
              <span>{{ form.photos.length >= FILM_MIN_PHOTOS ? '就绪' : `还差 ${FILM_MIN_PHOTOS - form.photos.length}` }}</span>
            </li>
            <li :class="{ ok: Boolean(form.location || form.travelNote || form.narrationText) }">
              旅途信息
              <span>{{ form.location || form.travelNote || form.narrationText ? '已填' : '可选' }}</span>
            </li>
            <li class="ok">
              成片规格
              <span>{{ paramsBrief }}</span>
            </li>
            <li :class="{ ok: !form.narrationEnabled || Boolean(resolveNarrationText(form)) }">
              旁白
              <span>{{ form.narrationEnabled ? (resolveNarrationText(form) ? (form.voice === 'male' ? '男声' : '女声') : '待补文案') : '关闭·无声' }}</span>
            </li>
          </ul>
        </div>

        <div class="preview-actions">
          <button
            v-if="previewStatus === 'idle' || previewStatus === 'failed'"
            type="button"
            class="primary-btn"
            :disabled="!canCompose"
            @click="startCompose"
          >
            {{ previewStatus === 'failed' ? '重试合成' : '开始合成旅途小电影' }}
          </button>
          <button v-if="previewStatus === 'composing'" type="button" class="primary-btn" disabled>
            合成中，请勿关闭页面
          </button>
          <template v-if="previewStatus === 'success'">
            <button type="button" class="ghost-btn" @click="replayVideo">重新播放</button>
            <button type="button" class="primary-btn" :disabled="downloadBusy" @click="downloadResult">
              {{ downloadBusy ? '下载中…' : '下载成片' }}
            </button>
            <button type="button" class="ghost-btn" :disabled="isComposeBusy" @click="resetResultKeepForm">再做一条</button>
          </template>
          <button
            v-if="previewStatus === 'failed'"
            type="button"
            class="ghost-btn"
            @click="scrollToParams"
          >
            修改参数后再试
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
/**
 * FILM VOLO 相册 UI
 *
 * 左栏：01 上传(3–8) → 02 旅途信息 → 02b 视频参数/旁白
 * 右栏：03 预览四态 idle | composing | success | failed
 *
 * 数据与 HTTP 都在 ../utils/filmCompose.js：
 *   - 开始合成 → onStartCompose（upload → tasks → 轮询 mp4）
 *   - AI 旁白  → generateFilmNarration（upload → analyze，失败则本地草稿）
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useUiStore } from '../stores/uiStore.js'
import {
  FILM_ACCEPT,
  FILM_DURATION_MAX,
  FILM_DURATION_MIN,
  FILM_MAX_FILE_MB,
  FILM_MAX_PHOTOS,
  FILM_MIN_PHOTOS,
  RATIO_OPTIONS,
  RESOLUTION_OPTIONS,
  STAGE_LABELS,
  createEmptyFilmForm,
  createPhotoId,
  downloadFilmVideo,
  generateFilmNarration,
  onStartCompose,
  resolveNarrationText,
  validateFilmComposeForm,
  validateFilmImageFile
} from '../utils/filmCompose.js'

const ui = useUiStore()
/** 成片表单：照片 + 地点/心得 + 分辨率/比例/时长/旁白等（见 FilmComposeForm） */
const form = reactive(createEmptyFilmForm())
const fileInput = ref(null)
const videoEl = ref(null)
const dragging = ref(false)
const dragFrom = ref(-1)
/** 右栏预览状态机：空闲 → 合成中 → 成功(可播 mp4) / 失败(可重试) */
const previewStatus = ref('idle') // idle | composing | success | failed
const progress = ref(null)
const stageKey = ref('default')
const resultVideoUrl = ref('')
const resultMeta = ref(null)
const errorMessage = ref('')
const aiNarrationLoading = ref(false)
const downloadBusy = ref(false)
/** 防重复提交：合成进行中禁止再次点「开始合成」 */
const submitLock = ref(false)
/** 视频参数默认折叠，缩短左栏、平衡左右高度 */
const paramsOpen = ref(false)
let abortController = null
let narrationAbortController = null

const hasTripInfo = computed(() => Boolean(form.location || form.travelDate || form.travelNote))
const isComposeBusy = computed(() => submitLock.value || previewStatus.value === 'composing')
const isDurationAuto = computed(() => form.narrationEnabled && form.durationMode === 'auto')
const estimatedManualSeconds = computed(() => {
  const n = form.photos.length || 0
  const sec = Number(form.durationPerImage) || 0
  return n > 0 ? n * sec : sec
})
const canCompose = computed(() => validateFilmComposeForm(form).ok)
const stageLabel = computed(() => STAGE_LABELS[stageKey.value] || STAGE_LABELS.default)
/** 非 stub 的 http(s) 地址一律当真实视频（签名 URL 可能无 .mp4 后缀） */
const isRealVideo = computed(() => {
  const url = resultVideoUrl.value || ''
  if (!url || resultMeta.value?.stub) return false
  return /^https?:\/\//i.test(url) || url.startsWith('blob:') || /\.(mp4|webm|mov)(\?|$)/i.test(url)
})
const paramsBrief = computed(() => {
  const narr = form.narrationEnabled ? '旁白开' : '无声'
  return `${form.resolution} · ${form.ratio} · ${narr}`
})
const leftCtaLabel = computed(() => {
  if (previewStatus.value === 'composing') return '合成中…'
  if (form.photos.length < FILM_MIN_PHOTOS) {
    return `先上传照片（还差 ${FILM_MIN_PHOTOS - form.photos.length} 张）`
  }
  if (!canCompose.value) return '请完善成片信息'
  return '开始合成旅途小电影'
})
const leftHint = computed(() => {
  if (form.photos.length < FILM_MIN_PHOTOS) return `请至少上传 ${FILM_MIN_PHOTOS} 张旅途照片`
  if (!canCompose.value) {
    const check = validateFilmComposeForm(form)
    return check.message || '请完善成片信息后再合成'
  }
  return '提交后约 1–数分钟；合成中请勿关闭页面'
})
const resultSummary = computed(() => {
  const meta = resultMeta.value || {}
  const parts = [
    meta.resolution || form.resolution,
    meta.ratio || form.ratio,
    `照片 ${meta.photoCount || form.photos.length} 张`,
    (meta.durationMode || form.durationMode) === 'auto' ? '自动对齐旁白' : `每张 ${meta.durationPerImage || form.durationPerImage}s`
  ]
  if (meta.narrationEnabled ?? form.narrationEnabled) parts.push('含旁白')
  else parts.push('无旁白')
  if (meta.stub) parts.push('演示占位')
  return parts.join(' · ')
})

function triggerPick() {
  if (form.photos.length >= FILM_MAX_PHOTOS) {
    ui.showToast(`最多上传 ${FILM_MAX_PHOTOS} 张照片`, 'warn')
    return
  }
  fileInput.value?.click()
}

function onPickFiles(event) {
  addFiles(Array.from(event.target.files || []))
  event.target.value = ''
}

function onDrop(event) {
  dragging.value = false
  addFiles(Array.from(event.dataTransfer?.files || []))
}

function addFiles(files) {
  const imageFiles = files.filter((f) => {
    if (f.type?.startsWith('image/')) return true
    return /\.(jpe?g|png|webp)$/i.test(f.name || '')
  })
  if (!imageFiles.length) {
    ui.showToast('请选择 JPG / PNG / WebP 图片', 'warn')
    return
  }
  const room = FILM_MAX_PHOTOS - form.photos.length
  if (room <= 0) {
    ui.showToast(`最多上传 ${FILM_MAX_PHOTOS} 张照片`, 'warn')
    return
  }
  const accepted = imageFiles.slice(0, room)
  if (imageFiles.length > room) {
    ui.showToast(`只能再添加 ${room} 张，已自动截取`, 'warn')
  }
  for (const file of accepted) {
    const check = validateFilmImageFile(file)
    if (!check.ok) {
      ui.showToast(check.message || '图片不符合要求', 'warn')
      continue
    }
    const previewUrl = URL.createObjectURL(file)
    form.photos.push({
      id: createPhotoId(),
      file,
      previewUrl,
      status: 'ready'
    })
  }
}

function removePhoto(index) {
  const [item] = form.photos.splice(index, 1)
  if (item?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl)
}

function onDragStart(index, event) {
  dragFrom.value = index
  event.dataTransfer.effectAllowed = 'move'
}

function onReorderDrop(toIndex) {
  const from = dragFrom.value
  dragFrom.value = -1
  if (from < 0 || from === toIndex) return
  const [item] = form.photos.splice(from, 1)
  form.photos.splice(toIndex, 0, item)
}

function bumpDuration(delta) {
  const next = Math.min(
    FILM_DURATION_MAX,
    Math.max(FILM_DURATION_MIN, Number(form.durationPerImage || 8) + delta)
  )
  form.durationPerImage = next
}

function toggleNarration() {
  form.narrationEnabled = !form.narrationEnabled
  if (!form.narrationEnabled) form.durationMode = 'manual'
}

async function generateNarrationDraft() {
  // 可选支路：只生成旁白文案，不创建成片任务（会真实调用 /api/analyze，可能计费）
  if (isComposeBusy.value) {
    ui.showToast('合成进行中，请稍后再生成旁白', 'warn')
    return
  }
  if (!form.photos.length) {
    ui.showToast('请先上传照片再生成旁白', 'warn')
    return
  }
  aiNarrationLoading.value = true
  narrationAbortController?.abort()
  narrationAbortController = new AbortController()
  try {
    const story = await generateFilmNarration(form, { signal: narrationAbortController.signal })
    form.narrationText = story
    ui.showToast('已生成旁白，可继续修改', 'success')
  } catch (err) {
    if (err?.name === 'AbortError') return
    // 后端不可用时降级本地草稿，避免按钮完全不可用
    const loc = form.location.trim() || '这次旅途'
    const note = form.travelNote.trim()
    form.narrationText = note
      ? `${note} 镜头慢慢掠过${loc}的风景，把回忆重新拼成一段能回看的小电影。`
      : `一段关于${loc}的旅途回忆。阳光、脚步与偶遇的风景，都收进这一卷胶片里。`
    ui.showToast(err?.message ? `AI 旁白暂不可用，已填入本地草稿：${err.message}` : '已填入本地旁白草稿', 'warn')
  } finally {
    aiNarrationLoading.value = false
    narrationAbortController = null
  }
}

function scrollToParams() {
  paramsOpen.value = true
  document.querySelector('.volo-section.params')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function startCompose() {
  // 主成片：校验 → composing → onStartCompose（上传/建任务/轮询）→ success | failed
  if (submitLock.value || previewStatus.value === 'composing') {
    ui.showToast('正在合成中，请勿重复提交', 'warn')
    return
  }
  const check = validateFilmComposeForm(form)
  if (!check.ok) {
    ui.showToast(check.message || '请完善成片信息', 'warn')
    if ((form.photos?.length || 0) < FILM_MIN_PHOTOS) {
      document.getElementById('journal-photos')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else if (form.narrationEnabled && !resolveNarrationText(form)) {
      scrollToParams()
    }
    return
  }

  // 合成开始时中止进行中的旁白请求，避免并发上传
  narrationAbortController?.abort()
  narrationAbortController = null
  aiNarrationLoading.value = false

  submitLock.value = true
  previewStatus.value = 'composing'
  progress.value = 0
  stageKey.value = 'default'
  errorMessage.value = ''
  resultVideoUrl.value = ''
  resultMeta.value = null
  abortController?.abort()
  abortController = new AbortController()

  const payload = {
    ...form,
    narrationText: resolveNarrationText(form),
    durationMode: form.narrationEnabled ? form.durationMode : 'manual',
    photos: form.photos.map((p) => ({ ...p }))
  }

  try {
    // onStage 驱动右栏「正在上传/动态画面/合并…」与进度条
    const result = await onStartCompose(payload, {
      signal: abortController.signal,
      onStage(stage, pct) {
        stageKey.value = stage
        progress.value = typeof pct === 'number' ? pct : null
      }
    })
    if (!result?.videoUrl) throw new Error('未返回成片地址')
    resultVideoUrl.value = result.videoUrl
    resultMeta.value = result.meta || null
    previewStatus.value = 'success'
    ui.showToast(result.meta?.stub ? '预览占位已生成（待接真实视频接口）' : '成片已生成', 'success')
  } catch (err) {
    if (err?.name === 'AbortError') {
      // 切 Tab / 卸载取消：不当失败，回到空闲
      previewStatus.value = 'idle'
      errorMessage.value = ''
      progress.value = null
      return
    }
    previewStatus.value = 'failed'
    errorMessage.value = err?.message || '合成失败，请重试'
    ui.showToast(errorMessage.value, 'error')
  } finally {
    submitLock.value = false
    abortController = null
  }
}

function replayVideo() {
  const el = videoEl.value
  if (el) {
    el.currentTime = 0
    el.play?.()
  }
}

async function downloadResult() {
  if (!resultVideoUrl.value || downloadBusy.value) return
  downloadBusy.value = true
  try {
    await downloadFilmVideo(resultVideoUrl.value, 'starwalk-volo-film.mp4')
    ui.showToast('已开始下载', 'success')
  } catch (err) {
    ui.showToast(
      err?.message
        ? `${err.message}。也可右键视频「另存为」`
        : '下载失败，请右键视频「另存为」',
      'warn'
    )
  } finally {
    downloadBusy.value = false
  }
}

function clearResultState() {
  previewStatus.value = 'idle'
  progress.value = null
  stageKey.value = 'default'
  resultVideoUrl.value = ''
  resultMeta.value = null
  errorMessage.value = ''
}

function resetResultKeepForm() {
  if (isComposeBusy.value) {
    ui.showToast('合成中，请稍后再试', 'warn')
    return
  }
  clearResultState()
}

function resetAll() {
  abortController?.abort()
  narrationAbortController?.abort()
  abortController = null
  narrationAbortController = null
  submitLock.value = false
  aiNarrationLoading.value = false
  downloadBusy.value = false
  form.photos.forEach((p) => {
    if (p.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(p.previewUrl)
  })
  Object.assign(form, createEmptyFilmForm())
  clearResultState()
  if (fileInput.value) fileInput.value.value = ''
}

defineExpose({ resetAll, form, previewStatus, isComposeBusy })

onBeforeUnmount(() => {
  abortController?.abort()
  narrationAbortController?.abort()
  form.photos.forEach((p) => {
    if (p.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(p.previewUrl)
  })
})
</script>

<style scoped>
.volo-workspace { margin-top: 4px; }
.volo-steps {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  margin: 0 auto 24px; color: #A39A90;
}
.volo-step { display: flex; align-items: center; gap: 7px; font-size: 12px; white-space: nowrap; }
.volo-step span {
  width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%; background: #EFE8E0; color: #7B7268; font-size: 10px; font-weight: 700;
}
.volo-step strong { font-weight: 600; }
.volo-step.active { color: #9C5A3D; }
.volo-step.active span { color: #fff; background: #9C5A3D; box-shadow: 0 4px 10px rgba(156,90,61,.22); }
.volo-steps i { width: 34px; height: 1px; background: #E4D8CC; }

.volo-layout {
  display: grid;
  grid-template-columns: minmax(320px, 0.78fr) minmax(0, 1.22fr);
  gap: 24px;
  align-items: start;
}
.volo-form, .volo-preview {
  background: #FFFCF7;
  border: 1px solid #E7D8CA;
  border-radius: 20px;
  padding: 20px;
}
.volo-preview {
  position: sticky;
  top: 88px;
  align-self: start;
}
.volo-section + .volo-section { margin-top: 22px; padding-top: 18px; border-top: 1px solid #F0E6DB; }
.section-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.section-head.tight { margin-bottom: 0; width: 100%; align-items: center; }
.kicker { display: block; font-size: 11px; letter-spacing: .08em; color: #9C5A3D; font-weight: 700; margin-bottom: 4px; }
.section-head h3, .preview-head h3 { margin: 0; font-size: 17px; color: #2F2A24; }
.count { font-size: 12px; color: #8B7B6A; }
.count.warn { color: #9C5A3D; font-weight: 700; }

.params-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1.5px solid #D7AE91;
  background: linear-gradient(180deg, #FFF8F0, #FFF3E8);
  border-radius: 14px;
  padding: 14px 16px;
  cursor: pointer;
  text-align: left;
  transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
}
.params-toggle:hover,
.params-toggle.open {
  border-color: #9C5A3D;
  box-shadow: 0 6px 16px rgba(156, 90, 61, 0.12);
  background: #FFF3E8;
}
.params-toggle-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.params-toggle-main .kicker { margin-bottom: 0; }
.params-toggle-main strong {
  font-size: 16px;
  color: #2F2A24;
  font-weight: 700;
}
.params-cta {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #9C5A3D;
}
.params-toggle-side {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-shrink: 0;
}
.params-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid #E7D8CA;
  color: #6B5B4D;
  font-size: 11px;
  font-weight: 700;
}
.params-chip.warn {
  border-color: #E8C9A8;
  color: #9C5A3D;
  background: #FFF8F0;
}
.params-chevron {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #9C5A3D;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}
.params-body {
  margin-top: 14px;
  padding-top: 4px;
}

.upload-zone {
  border: 1.5px dashed #D7AE91; border-radius: 16px; padding: 28px 18px; text-align: center;
  background: #FFF8F0; cursor: pointer; transition: .2s ease;
}
.upload-zone:hover, .upload-zone.dragging { border-color: #9C5A3D; background: #FFF3E8; }
.upload-zone.full { opacity: .7; cursor: not-allowed; }
.upload-title { margin: 0 0 6px; font-size: 14px; color: #5C4E42; font-weight: 600; }
.upload-hint, .upload-full, .field-hint, .sub { margin: 0; font-size: 12px; color: #8B7B6A; line-height: 1.5; }
.field-hint { margin-top: 8px; }
.field-hint.warn { color: #9C5A3D; }

.thumb-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 14px;
}
.thumb {
  position: relative; aspect-ratio: 1; border-radius: 12px; overflow: hidden;
  border: 1px solid #E7D8CA; background: #f5efe8; cursor: grab;
}
.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.thumb-index {
  position: absolute; left: 6px; bottom: 6px; min-width: 18px; height: 18px; padding: 0 5px;
  border-radius: 999px; background: rgba(0,0,0,.55); color: #fff; font-size: 10px;
  display: inline-flex; align-items: center; justify-content: center;
}
.thumb-remove {
  position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border: none; border-radius: 50%;
  background: rgba(0,0,0,.55); color: #fff; cursor: pointer; line-height: 1;
}
.thumb-mask {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(30,20,10,.45); color: #fff; font-size: 12px; font-weight: 600;
}
.thumb-mask.error, .thumb.error { box-shadow: inset 0 0 0 2px #C45C4A; }

.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; font-size: 12px; color: #5C4E42; }
.field.full { width: 100%; }
.field input, .field textarea {
  width: 100%; box-sizing: border-box; border: 1px solid #E7D8CA; border-radius: 10px;
  padding: 10px 12px; font: 13px/1.5 'Noto Sans SC', sans-serif; color: #2F2A24; background: #fff;
}
.field input:focus, .field textarea:focus { outline: none; border-color: #C48A66; box-shadow: 0 0 0 3px rgba(156,90,61,.12); }

.param-block { margin-bottom: 14px; }
.param-label { margin: 0 0 8px; font-size: 12px; color: #5C4E42; font-weight: 600; }
.chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  border: 1px solid #E7D8CA; background: #fff; color: #6B5B4D; border-radius: 999px;
  padding: 7px 12px; font: 600 12px 'Noto Sans SC', sans-serif; cursor: pointer;
}
.chip:disabled { opacity: 0.45; cursor: not-allowed; }
.chip em { font-style: normal; margin-left: 4px; color: #9C5A3D; font-size: 10px; }
.chip.active { background: #9C5A3D; border-color: #9C5A3D; color: #fff; }
.chip.active em { color: rgba(255,255,255,.85); }

.param-block.muted { opacity: 0.55; }
.stepper { display: inline-flex; align-items: center; gap: 0; border: 1px solid #E7D8CA; border-radius: 10px; overflow: hidden; }
.stepper.disabled { pointer-events: none; }
.stepper button {
  width: 36px; height: 36px; border: none; background: #FFF8F0; color: #9C5A3D; font-size: 16px; cursor: pointer;
}
.stepper button:disabled { opacity: 0.45; cursor: not-allowed; }
.stepper input {
  width: 56px; height: 36px; border: none; border-left: 1px solid #E7D8CA; border-right: 1px solid #E7D8CA;
  text-align: center; font: 600 13px 'Noto Sans SC', sans-serif;
}
.stepper input:disabled { color: #9A9086; background: #F5F0EA; }
.switch-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.switch {
  min-width: 52px; height: 28px; border-radius: 999px; border: none; background: #D8CFC4; color: #fff;
  padding: 0 10px; font: 700 11px 'Noto Sans SC', sans-serif; cursor: pointer;
}
.switch.on { background: #9C5A3D; }
.narration-actions { margin: -4px 0 12px; }

.form-actions { margin-top: 18px; }
.primary-btn, .ghost-btn, a.primary-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border-radius: 999px; padding: 11px 18px; font: 700 13px 'Noto Sans SC', sans-serif; cursor: pointer;
  text-decoration: none; box-sizing: border-box;
}
.primary-btn {
  width: 100%; border: none; background: #9C5A3D; color: #fff;
  box-shadow: 0 8px 18px rgba(156,90,61,.22);
}
.primary-btn:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }
.ghost-btn {
  border: 1px solid #E7D8CA; background: #fff; color: #6B5B4D;
}
.action-hint { margin: 10px 0 0; font-size: 12px; color: #8B7B6A; text-align: center; }

.preview-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.preview-frame {
  min-height: 480px; border-radius: 16px; background: #1a1612; color: #F7F1EA;
  display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 20px;
}
.preview-frame.idle, .preview-frame.failed { background: linear-gradient(160deg, #F4EFE8, #E8DFD4); color: #5C4E42; }
.preview-idle, .preview-loading, .preview-failed { text-align: center; max-width: 360px; }
.preview-idle p, .preview-failed p, .preview-loading p { margin: 0 0 8px; font-size: 14px; line-height: 1.6; font-weight: 600; }
.spinner {
  width: 42px; height: 42px; margin: 0 auto 14px; border-radius: 50%;
  border: 3px solid rgba(156,90,61,.2); border-top-color: #9C5A3D; animation: spin .8s linear infinite;
}
.progress-bar {
  width: min(260px, 70vw); height: 6px; margin: 12px auto 0; border-radius: 999px; background: rgba(255,255,255,.2); overflow: hidden;
}
.progress-bar i { display: block; height: 100%; background: #edb65f; border-radius: inherit; }
.preview-success { width: 100%; }
.result-video, .stub-frame img {
  width: 100%; max-height: 520px; object-fit: contain; background: #000; border-radius: 8px; display: block;
}
.stub-note, .meta-line { margin: 10px 0 0; font-size: 12px; color: #C9B8A6; text-align: center; }

.preview-aside {
  margin-top: 14px;
  padding: 14px;
  border-radius: 14px;
  background: #FFF8F0;
  border: 1px solid #F0E6DB;
}
.aside-strip {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}
.aside-strip img {
  width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; border: 1px solid #E7D8CA;
}
.aside-check {
  list-style: none; margin: 0; padding: 0; display: grid; gap: 8px;
}
.aside-check li {
  display: flex; justify-content: space-between; gap: 12px;
  font-size: 12px; color: #8B7B6A; padding: 8px 10px; border-radius: 10px; background: #fff;
  border: 1px solid #F0E6DB;
}
.aside-check li span { color: #6B5B4D; font-weight: 600; text-align: right; }
.aside-check li.ok { border-color: rgba(156,90,61,.25); }
.aside-check li.ok span { color: #9C5A3D; }

.preview-actions {
  display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px;
}
.preview-actions .primary-btn { width: auto; min-width: 160px; flex: 1; }
.preview-actions .linkish { color: #fff; }

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .volo-layout { grid-template-columns: 1fr; }
  .volo-preview { position: static; }
  .preview-frame { min-height: 360px; }
  .thumb-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 560px) {
  .info-grid { grid-template-columns: 1fr; }
  .volo-step strong { display: none; }
  .thumb-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
