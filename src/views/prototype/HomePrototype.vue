<template>
  <div ref="pageRef" class="home-prototype-page is-immersive" :style="motionStyle">
    <section
      class="ip-story"
      :class="[`phase-${phase}`, `skin-${skinKey}`]"
      aria-label="星际行者沉浸开场"
      tabindex="0"
      @keydown="onStageKeydown"
      @click="onStageClick"
    >
      <div class="story-stage">
        <div class="story-media" aria-hidden="true">
          <video
            ref="idleVideoRef"
            class="story-video idle-video"
            :class="{ visible: phase === 'idle' }"
            :src="IDLE_SRC"
            muted
            loop
            playsinline
            autoplay
            preload="auto"
          ></video>

          <video
            ref="storyVideoRef"
            class="story-video story-main"
            :class="{ visible: phase !== 'idle' }"
            :src="STORY_SRC"
            :muted="isMuted"
            playsinline
            preload="auto"
            @timeupdate="onStoryTimeUpdate"
            @ended="onStoryEnded"
          ></video>

          <div class="story-shade"></div>
        </div>

        <div
          :key="`copy-${phase}-${activeScene}-${currentSkin.pos}`"
          class="story-copy story-reveal"
          :class="[`pos-${currentSkin.pos}`, `tone-${currentSkin.tone}`]"
        >
          <span
            v-if="currentSkin.eyebrow && phase !== 'playing' && phase !== 'ended'"
            class="story-eyebrow"
          >{{ currentSkin.eyebrow }}</span>

          <template v-if="phase === 'idle'">
            <p class="story-kicker">{{ idleCopy.kicker }}</p>
            <h1 class="story-title">{{ idleCopy.title }}</h1>
            <p class="story-description">{{ idleCopy.description }}</p>
            <div class="story-actions">
              <button class="story-primary" type="button" @click.stop="startStory">
                {{ idleCopy.action }}
                <span aria-hidden="true">↗</span>
              </button>
            </div>
          </template>

          <template v-else-if="phase === 'ended'">
            <p class="story-kicker">{{ endedCopy.kicker }}</p>
            <h1 class="story-title">{{ endedCopy.title }}</h1>
            <p class="story-description">{{ endedCopy.description }}</p>
            <div class="story-fact">
              <span>{{ endedCopy.factLabel }}</span>
              <strong>{{ endedCopy.fact }}</strong>
            </div>
            <div class="story-actions">
              <button class="story-primary" type="button" @click.stop="enterHome">
                进入首页
                <span aria-hidden="true">↗</span>
              </button>
              <button class="story-secondary" type="button" @click.stop="goPlan">
                开始规划
              </button>
            </div>
          </template>

          <template v-else>
            <p class="story-kicker story-kicker--scene">
              <span v-if="currentSkin.showIndex" class="kicker-index">{{ String(activeScene + 1).padStart(2, '0') }}</span>
              {{ currentScene.label }}
            </p>
            <h1 class="story-title">{{ currentScene.title }}</h1>
            <p class="story-description">{{ currentScene.description }}</p>

            <div v-if="currentSkin.showFact" class="story-fact">
              <span>{{ currentScene.factLabel }}</span>
              <strong>{{ currentScene.fact }}</strong>
            </div>
          </template>
        </div>

        <div v-if="phase === 'idle'" class="click-hint" aria-hidden="true">
          <span class="click-hint-core"></span>
          <span class="click-hint-pulse"></span>
          <span class="click-hint-pulse click-hint-pulse--late"></span>
        </div>

        <div class="story-chrome" @click.stop>
          <button
            class="chrome-btn mute-btn"
            type="button"
            :aria-pressed="!isMuted"
            :aria-label="isMuted ? '开启声音' : '关闭声音'"
            @click="toggleMute"
          >
            {{ isMuted ? '静音' : '有声' }}
          </button>

          <button
            v-if="phase !== 'ended'"
            class="chrome-btn skip-btn"
            type="button"
            @click="enterHome"
          >
            {{ phase === 'idle' ? '跳过，进入首页' : '跳过开场' }}
          </button>
        </div>

        <div
          class="story-progress"
          role="progressbar"
          :aria-valuenow="Math.round(storyProgressPercent)"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="phase === 'idle' ? '等待开始' : `开场进度 ${Math.round(storyProgressPercent)}%`"
        >
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: `${storyProgressPercent}%` }"></div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

/** 可调参数 */
const SCENE_DURATION = 5.184
const COPY_FADE_MS = 640

const IDLE_SRC = '/videos/fox/idle-loop.mp4'
const STORY_SRC = '/videos/fox/story-01-06.mp4?v=20260904-hd'

const idleCopy = {
  kicker: '白狐向导在等你',
  title: '点开这一程',
  description: '点击进入全屏，六幕短片从整理行囊走到摘下星光。',
  action: '开始观看'
}

/** 八态皮肤：待机 / 六幕 / 终幕引导。pos 按 IP 占位让出身体区域 */
const idleSkin = {
  pos: 'safe-bl',
  tone: 'idle',
  eyebrow: '',
  showFact: false,
  showIndex: false
}

const endedSkin = {
  pos: 'safe-bl',
  tone: 'ended',
  eyebrow: '',
  showFact: true,
  showIndex: false
}

const endedCopy = {
  kicker: '六幕终章',
  title: '下一颗星，在等你',
  description: '开场已结束。进入首页继续探索，或直接开始规划行程。',
  factLabel: '下一站',
  fact: '等你发现'
}

const sceneSkins = [
  {
    pos: 'safe-tl',
    tone: 'depart',
    eyebrow: '',
    showFact: true,
    showIndex: true
  },
  {
    pos: 'safe-ml',
    tone: 'plan',
    eyebrow: '',
    showFact: true,
    showIndex: true
  },
  {
    pos: 'safe-band',
    tone: 'dest',
    eyebrow: '',
    showFact: true,
    showIndex: true
  },
  {
    pos: 'safe-tr',
    tone: 'route',
    eyebrow: '',
    showFact: false,
    showIndex: true
  },
  {
    pos: 'safe-note-r',
    tone: 'journal',
    eyebrow: '',
    showFact: true,
    showIndex: true
  },
  {
    pos: 'safe-bl',
    tone: 'arrive',
    eyebrow: '',
    showFact: false,
    showIndex: true
  }
]

const scenes = [
  {
    title: '星光会回应每一次出发',
    description: '先把地图和念头摊开，下一场旅行就有了起点。',
    label: '准备出发',
    action: '开始探索',
    factLabel: '今日导航',
    fact: '从灵感开始'
  },
  {
    title: '好奇心，也能走出路线',
    description: '偏好被读懂之后，灵感会落成可执行的行程。',
    label: '规划旅程',
    action: '生成行程',
    factLabel: 'AI 行程',
    fact: '一键成形'
  },
  {
    title: '去一座还没见过的城',
    description: '热门与隐秘风景，都能成为你的下一站。',
    label: '发现目的地',
    action: '浏览目的地',
    factLabel: '目的地',
    fact: '34 个省域'
  },
  {
    title: '真实的路，慢慢走',
    description: '景点、时间、路线叠在一起，旅途就从容了。',
    label: '连接路线',
    action: '查看路线',
    factLabel: '路线规划',
    fact: '真实轨迹'
  },
  {
    title: '风景留下，故事归你',
    description: '一张照片、一段话、当下的心情，都值得记下来。',
    label: '记录旅途',
    action: '写旅行手账',
    factLabel: '旅行手账',
    fact: '留下故事'
  },
  {
    title: '下一颗星，在等你',
    description: '打开地图，向下一段未知走去。',
    label: '开启旅程',
    action: '探索地图',
    factLabel: '下一站',
    fact: '等你发现'
  }
]

const pageRef = ref(null)
const idleVideoRef = ref(null)
const storyVideoRef = ref(null)
const phase = ref('idle') // idle | playing | ended
const activeScene = ref(0)
const storyProgressPercent = ref(0)
const isMuted = ref(true)
const router = useRouter()

const currentScene = computed(() => scenes[activeScene.value])
const skinKey = computed(() => {
  if (phase.value === 'idle') return 'idle'
  if (phase.value === 'ended') return 'ended'
  return String(activeScene.value)
})
const currentSkin = computed(() => {
  if (phase.value === 'idle') return idleSkin
  if (phase.value === 'ended') return endedSkin
  return sceneSkins[activeScene.value]
})

function updateStoryProgress(video) {
  if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
    storyProgressPercent.value = phase.value === 'ended' ? 100 : 0
    return
  }
  const ratio = Math.min(1, Math.max(0, video.currentTime / video.duration))
  storyProgressPercent.value = ratio * 100
}

function stopPlayback() {
  idleVideoRef.value?.pause()
  storyVideoRef.value?.pause()
}

function isBrowserFullscreen() {
  return Boolean(
    document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
  )
}

async function enterBrowserFullscreen() {
  const el = pageRef.value
  if (!el || isBrowserFullscreen()) return
  const request =
    el.requestFullscreen?.bind(el) ||
    el.webkitRequestFullscreen?.bind(el) ||
    el.msRequestFullscreen?.bind(el)
  if (!request) return
  try {
    await request()
  } catch {
    /* 浏览器策略或设备不支持时忽略 */
  }
}

async function exitBrowserFullscreen() {
  if (!isBrowserFullscreen()) return
  const exit =
    document.exitFullscreen?.bind(document) ||
    document.webkitExitFullscreen?.bind(document) ||
    document.msExitFullscreen?.bind(document)
  if (!exit) return
  try {
    await exit()
  } catch {
    /* ignore */
  }
}

async function leaveImmersive(path) {
  stopPlayback()
  await exitBrowserFullscreen()
  router.push(path)
}

function enterHome() {
  leaveImmersive('/')
}

function goPlan() {
  leaveImmersive('/plan')
}

function sceneIndexFromTime(t) {
  const idx = Math.floor(Math.max(0, t) / SCENE_DURATION)
  return Math.min(scenes.length - 1, idx)
}

function onStoryTimeUpdate() {
  if (phase.value !== 'playing') return
  const video = storyVideoRef.value
  if (!video) return
  activeScene.value = sceneIndexFromTime(video.currentTime)
  updateStoryProgress(video)
}

async function freezeLastFrame() {
  const video = storyVideoRef.value
  if (!video) return
  try {
    if (Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = Math.max(0, video.duration - 0.05)
    }
  } catch {
    /* ignore seek errors */
  }
  video.pause()
  activeScene.value = scenes.length - 1
  storyProgressPercent.value = 100
}

async function startStory() {
  if (phase.value !== 'idle') return

  // 必须在用户手势同步链路内发起，才能占满含浏览器顶栏的系统全屏
  const fullscreenPromise = enterBrowserFullscreen()

  phase.value = 'playing'
  activeScene.value = 0
  storyProgressPercent.value = 0

  const idle = idleVideoRef.value
  const story = storyVideoRef.value
  idle?.pause()

  if (story) {
    story.currentTime = 0
    story.muted = isMuted.value
    try {
      await story.play()
    } catch {
      story.muted = true
      isMuted.value = true
      await story.play().catch(() => {})
    }
  }

  await fullscreenPromise
}

async function onStoryEnded() {
  if (phase.value !== 'playing') return
  phase.value = 'ended'
  await freezeLastFrame()
}

function onStageClick() {
  if (phase.value === 'idle') startStory()
}

function toggleMute() {
  isMuted.value = !isMuted.value
  const story = storyVideoRef.value
  if (story) story.muted = isMuted.value
}

function onStageKeydown(event) {
  if (phase.value === 'idle' && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault()
    startStory()
  }
}

function lockViewport() {
  document.documentElement.classList.add('prototype-immersive-lock')
  document.body.classList.add('prototype-immersive-lock')
}

function unlockViewport() {
  document.documentElement.classList.remove('prototype-immersive-lock')
  document.body.classList.remove('prototype-immersive-lock')
}

onMounted(() => {
  lockViewport()
  const idle = idleVideoRef.value
  if (!idle) return
  idle.muted = true
  idle.play().catch(() => {})
})

onBeforeUnmount(() => {
  unlockViewport()
  stopPlayback()
  exitBrowserFullscreen()
})

const motionStyle = {
  '--copy-fade': `${COPY_FADE_MS}ms`
}
</script>

<style scoped>
.home-prototype-page {
  --ink: #12372f;
  --muted: #6d837b;
  --accent: #e3b94f;
  --page-cream: #f6f2e9;
  --copy-fade: 640ms;
  color: var(--ink);
}

.home-prototype-page.is-immersive {
  position: fixed;
  inset: 0;
  z-index: 200;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  background: #061b1a;
}

.home-prototype-page:fullscreen,
.home-prototype-page:-webkit-full-screen {
  width: 100%;
  height: 100%;
  background: #061b1a;
}

.ip-story {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  outline: none;
  background: #061b1a;
}

/* 铺满视口，盖住顶栏；非圆角卡片 */
.story-stage {
  position: absolute;
  inset: 0;
  width: 100%;
  max-width: none;
  height: 100%;
  aspect-ratio: auto;
  margin: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: #061b1a;
  isolation: isolate;
  cursor: pointer;
  box-shadow: none;
}

.phase-playing .story-stage,
.phase-ended .story-stage {
  cursor: default;
}

.story-media {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: #061b1a;
}

.story-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
}

.idle-video,
.story-main {
  opacity: 0;
  transition: opacity 0.45s ease;
  z-index: 1;
}

.idle-video.visible,
.story-main.visible {
  opacity: 1;
}

.story-main {
  z-index: 2;
}

.story-shade {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  transition: background 0.5s ease;
}

/* —— 每幕遮罩：只压文案侧，给 IP 留亮面 —— */
.skin-idle .story-shade {
  background:
    linear-gradient(90deg, rgba(4, 22, 20, 0.55) 0%, rgba(4, 22, 20, 0.18) 38%, transparent 58%),
    linear-gradient(0deg, rgba(4, 18, 16, 0.42) 0%, transparent 34%);
}
.skin-0 .story-shade {
  background: linear-gradient(90deg, rgba(3, 28, 26, 0.62) 0%, rgba(3, 28, 26, 0.2) 36%, transparent 58%);
}
.skin-1 .story-shade {
  background:
    linear-gradient(105deg, rgba(4, 36, 40, 0.58) 0%, rgba(8, 54, 58, 0.18) 40%, transparent 62%),
    radial-gradient(ellipse at 82% 28%, rgba(120, 220, 210, 0.1), transparent 42%);
}
.skin-2 .story-shade {
  background: linear-gradient(0deg, rgba(12, 24, 20, 0.72) 0%, rgba(12, 24, 20, 0.28) 28%, transparent 52%);
}
.skin-3 .story-shade {
  background: linear-gradient(270deg, rgba(8, 30, 28, 0.6) 0%, rgba(8, 30, 28, 0.18) 34%, transparent 56%);
}
.skin-4 .story-shade {
  background:
    linear-gradient(270deg, rgba(22, 20, 14, 0.52) 0%, rgba(18, 28, 24, 0.14) 40%, transparent 60%);
}
.skin-5 .story-shade,
.skin-ended .story-shade {
  background:
    linear-gradient(90deg, rgba(4, 20, 24, 0.58) 0%, rgba(4, 20, 24, 0.16) 34%, transparent 54%),
    linear-gradient(0deg, rgba(6, 18, 22, 0.4) 0%, transparent 36%);
}

/* —— 文案安全区：按 IP 占位避开身体 —— */
.story-copy {
  position: absolute;
  z-index: 5;
  color: #f8fffc;
  pointer-events: none;
  max-width: min(420px, 38%);
}

.story-copy .story-actions {
  pointer-events: auto;
}

/* 左下安全区：待机 / 抵达 / 终幕（IP 居中或偏右） */
.pos-safe-bl {
  left: clamp(28px, 4.2vw, 56px);
  bottom: clamp(28px, 5.5vh, 56px);
  max-width: min(400px, 36%);
}

/* 左上：出发（IP 右下行李箱） */
.pos-safe-tl {
  left: clamp(28px, 4.2vw, 56px);
  top: clamp(36px, 7vh, 64px);
  max-width: min(440px, 38%);
}

/* 左中偏上：规划（IP 右侧全身） */
.pos-safe-ml {
  left: clamp(28px, 4vw, 52px);
  top: 22%;
  max-width: min(380px, 34%);
}

/* 底部横条：目的地（IP 中右指地球） */
.pos-safe-band {
  left: clamp(28px, 4vw, 52px);
  bottom: clamp(24px, 4.5vh, 48px);
  max-width: min(520px, 46%);
}

/* 右上：路线（IP 左侧指南针） */
.pos-safe-tr {
  right: clamp(28px, 4.2vw, 56px);
  top: clamp(40px, 8vh, 72px);
  text-align: right;
  max-width: min(360px, 34%);
}
.pos-safe-tr .story-eyebrow,
.pos-safe-tr .story-actions {
  justify-content: flex-end;
}
.pos-safe-tr .story-eyebrow::before {
  order: 2;
  margin-left: 10px;
}
.pos-safe-tr .story-fact {
  margin-left: auto;
}
.pos-safe-tr .story-kicker,
.pos-safe-tr .story-kicker--scene {
  justify-content: flex-end;
}
.pos-safe-tr .story-kicker--scene::before {
  order: 3;
}

/* 左上便签：手账（旧位，保留兼容） */
.pos-safe-note {
  left: clamp(24px, 3.5vw, 48px);
  top: clamp(28px, 6vh, 52px);
  max-width: min(300px, 30%);
  padding: 16px 18px 14px;
  border: 1px solid rgba(255, 236, 200, 0.16);
  border-radius: 14px;
  background: rgba(14, 18, 14, 0.48);
  backdrop-filter: blur(12px);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.24);
}

/* 右上便签：手账幕 IP 在左持相机，卡片放到右侧空景 */
.pos-safe-note-r {
  right: clamp(24px, 3.8vw, 52px);
  top: clamp(36px, 8vh, 64px);
  left: auto;
  max-width: min(300px, 30%);
  padding: 16px 18px 14px;
  border: 1px solid rgba(255, 236, 200, 0.16);
  border-radius: 14px;
  background: rgba(14, 18, 14, 0.48);
  backdrop-filter: blur(12px);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.24);
  text-align: left;
}

.story-reveal {
  animation: story-reveal var(--copy-fade) cubic-bezier(0.22, 0.75, 0.28, 1) both;
}

@keyframes story-reveal {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.pos-safe-tr.story-reveal {
  animation-name: story-reveal-right;
}
@keyframes story-reveal-right {
  from {
    opacity: 0;
    transform: translate(14px, 0);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.story-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
  color: #b5e7de;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.story-eyebrow::before {
  width: 22px;
  height: 1px;
  background: currentColor;
  opacity: 0.65;
  content: '';
}

.story-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0 8px;
  color: var(--accent);
  font: 700 12px/1.2 'Noto Sans SC', sans-serif;
  letter-spacing: 0.1em;
}

.story-kicker--scene {
  margin: 0 0 10px;
  font-size: 13px;
  letter-spacing: 0.14em;
}

.story-kicker--scene::before {
  width: 22px;
  height: 1px;
  background: currentColor;
  opacity: 0.7;
  content: '';
}

.kicker-index {
  display: inline-grid;
  place-items: center;
  min-width: 26px;
  height: 20px;
  padding: 0 5px;
  border-radius: 5px;
  color: #163d35;
  background: rgba(231, 199, 104, 0.92);
  font-size: 10px;
  letter-spacing: 0.04em;
}

.story-title {
  margin: 0;
  color: #fff;
  font-family: 'Noto Sans SC', sans-serif;
  font-size: clamp(28px, 3.4vw, 46px);
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.22;
  text-wrap: balance;
}

.story-description {
  max-width: 34em;
  margin: 12px 0 0;
  color: rgba(239, 255, 250, 0.78);
  font-size: clamp(13px, 1.15vw, 16px);
  line-height: 1.7;
}

.story-fact {
  display: grid;
  gap: 2px;
  width: fit-content;
  margin-top: 14px;
  padding: 8px 10px;
  border-left: 2px solid rgba(231, 199, 104, 0.85);
  color: rgba(236, 255, 249, 0.55);
  background: linear-gradient(90deg, rgba(9, 44, 42, 0.4), transparent);
  font-size: 10px;
  letter-spacing: 0.06em;
}

.story-fact strong {
  color: #f3d477;
  font-size: 13px;
  letter-spacing: 0.02em;
}

.story-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 14px;
  margin-top: 20px;
}

.story-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 999px;
  padding: 12px 22px;
  color: #163d35;
  background: #e7c768;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
  transition: transform 0.25s ease, background 0.25s ease, opacity 0.25s ease;
}

.story-primary span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  font-size: 15px;
  line-height: 1;
}

.story-primary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.story-primary.is-disabled,
.story-primary:disabled {
  opacity: 0.55;
  cursor: default;
  box-shadow: none;
}

.story-secondary {
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 999px;
  padding: 10px 14px;
  color: rgba(248, 255, 252, 0.92);
  background: rgba(6, 24, 22, 0.28);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.story-hint {
  color: rgba(255, 255, 255, 0.48);
  font-size: 12px;
}

/* —— 分幕字重与按钮气质 —— */
.tone-idle .story-title {
  font-size: clamp(30px, 3.6vw, 48px);
  font-weight: 800;
}
.tone-idle .story-primary {
  background: #e7c768;
}

.tone-depart .story-title {
  font-family: 'Noto Serif SC', 'Noto Sans SC', serif;
  font-size: clamp(32px, 3.8vw, 52px);
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.18;
}
.tone-depart .story-kicker {
  color: #f0d27a;
}

.tone-plan .story-title {
  font-size: clamp(26px, 3.2vw, 42px);
  font-weight: 800;
  letter-spacing: -0.02em;
}
.tone-plan .kicker-index {
  color: #043832;
  background: #7fd8cb;
}
.tone-plan .story-kicker {
  color: #7fd8cb;
}
.tone-plan .story-primary {
  border: 1.5px solid rgba(127, 216, 203, 0.85);
  border-radius: 12px;
  color: #dffaf5;
  background: rgba(10, 56, 52, 0.5);
  box-shadow: none;
}
.tone-plan .story-fact {
  border-left-color: #7fd8cb;
}
.tone-plan .story-fact strong {
  color: #9aefe4;
}

.tone-dest .story-title {
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(28px, 3.5vw, 46px);
  font-weight: 700;
  max-width: 11em;
}
.tone-dest .story-kicker {
  color: #f0b57a;
}
.tone-dest .kicker-index {
  background: #efb07a;
  color: #3a2412;
}
.tone-dest .story-primary {
  border-radius: 10px;
  color: #3a2412;
  background: linear-gradient(135deg, #efb07a, #e7c768);
}

.tone-route .story-title {
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(26px, 3.2vw, 42px);
  font-weight: 600;
  letter-spacing: 0.03em;
}
.tone-route .story-description {
  margin-left: auto;
}
.tone-route .story-kicker {
  color: #d8c078;
}
.tone-route .story-primary {
  border: 1px solid rgba(231, 199, 104, 0.75);
  color: #f8efc8;
  background: transparent;
  box-shadow: none;
}

.tone-journal .story-eyebrow {
  color: #e8d2a0;
}
.tone-journal .story-title {
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(22px, 2.6vw, 32px);
  font-weight: 600;
  line-height: 1.28;
}
.tone-journal .story-description {
  font-size: 13px;
  line-height: 1.65;
  color: rgba(255, 246, 228, 0.8);
}
.tone-journal .story-kicker {
  margin-top: 6px;
  color: #e8d2a0;
}
.tone-journal .story-primary {
  border-radius: 8px;
  color: #2c2310;
  background: #e6c978;
  box-shadow: none;
  padding: 10px 14px;
}

.tone-arrive .story-title {
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(30px, 3.6vw, 48px);
  font-weight: 700;
}
.tone-arrive .story-kicker {
  color: #f3d477;
}

.tone-ended .story-kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 10px;
  color: #f3d477;
  font-size: 13px;
  letter-spacing: 0.16em;
}
.tone-ended .story-kicker::before {
  width: 22px;
  height: 1px;
  background: currentColor;
  opacity: 0.7;
  content: '';
}
.tone-ended .story-title {
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(28px, 3.4vw, 44px);
  font-weight: 700;
}
.tone-ended .story-description {
  color: rgba(245, 252, 248, 0.86);
}
.tone-ended .story-primary {
  background: #f0d27a;
  box-shadow: 0 12px 28px rgba(240, 210, 122, 0.22);
}
.tone-ended .story-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-color: rgba(243, 212, 119, 0.5);
  color: #f8efc8;
  line-height: 1;
}

.click-hint {
  position: absolute;
  z-index: 5;
  left: 58%;
  top: 52%;
  width: 88px;
  height: 88px;
  display: grid;
  place-items: center;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.click-hint > * {
  grid-area: 1 / 1;
}

.click-hint-core {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff6c8 0%, #f0c84a 45%, #d4a017 100%);
  box-shadow:
    0 0 0 3px rgba(255, 236, 160, 0.55),
    0 0 18px 6px rgba(240, 200, 74, 0.65),
    0 0 36px 10px rgba(240, 180, 40, 0.35);
  animation: hint-core 1.4s ease-in-out infinite;
}

.click-hint-pulse {
  width: 56px;
  height: 56px;
  border: 2.5px solid rgba(255, 220, 100, 0.95);
  border-radius: 50%;
  box-shadow:
    0 0 12px rgba(255, 210, 80, 0.55),
    inset 0 0 10px rgba(255, 230, 140, 0.25);
  animation: hint-pulse 1.6s ease-out infinite;
}

.click-hint-pulse--late {
  animation-delay: 0.55s;
}

@keyframes hint-core {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.22);
    opacity: 0.88;
  }
}

@keyframes hint-pulse {
  0% {
    transform: scale(0.55);
    opacity: 0.95;
  }
  70% {
    transform: scale(1.85);
    opacity: 0;
  }
  100% {
    transform: scale(1.85);
    opacity: 0;
  }
}

.story-chrome {
  position: absolute;
  z-index: 6;
  top: max(14px, env(safe-area-inset-top, 0px) + 10px);
  right: max(14px, env(safe-area-inset-right, 0px) + 10px);
  display: flex;
  gap: 10px;
  pointer-events: auto;
}

.chrome-btn {
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 999px;
  padding: 8px 12px;
  color: rgba(248, 255, 252, 0.88);
  background: rgba(6, 27, 26, 0.45);
  backdrop-filter: blur(8px);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.chrome-btn:hover {
  border-color: rgba(231, 199, 104, 0.55);
  color: #f3d477;
}

.story-progress {
  position: absolute;
  z-index: 6;
  left: 50%;
  bottom: max(12px, env(safe-area-inset-bottom, 0px) + 10px);
  width: min(200px, 36vw);
  transform: translateX(-50%);
  pointer-events: none;
}

.progress-track {
  height: 3px;
  overflow: hidden;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.22);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.18);
}

.progress-fill {
  height: 100%;
  width: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #e7c768, #f3d477);
  box-shadow: 0 0 12px rgba(243, 212, 119, 0.55);
  transition: width 0.16s linear;
}

.skin-1 .progress-fill {
  background: linear-gradient(90deg, #5ec4b6, #9aefe4);
}
.skin-2 .progress-fill {
  background: linear-gradient(90deg, #efb07a, #e7c768);
}
.skin-4 .progress-fill {
  background: linear-gradient(90deg, #d9b56a, #f0d9a0);
}

.map-section {
  width: min(1180px, calc(100% - 80px));
  margin: 0 auto;
  padding: 110px 0 10px;
}

.section-heading {
  max-width: 620px;
  margin-bottom: 28px;
}

.section-eyebrow {
  color: #0d6b5c;
  font: 800 10px 'Inter', sans-serif;
  letter-spacing: 0.2em;
}

.section-heading h2 {
  margin: 12px 0 8px;
  color: #173e35;
  font: 700 clamp(28px, 4vw, 44px) / 1.2 'Noto Serif SC', 'Noto Sans SC', serif;
}

.section-heading p {
  color: var(--muted);
  font-size: 15px;
}

.map-layout {
  width: 100%;
  height: min(70vh, 760px);
  min-height: 480px;
  overflow: hidden;
  border: 1px solid #dfece6;
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 20px 50px rgba(19, 72, 61, 0.1);
  transform: none;
  filter: none;
  isolation: auto;
}

.map-area {
  width: 100%;
  height: 100%;
  background: #fff;
  transform: none;
  filter: none;
}

.section-width {
  width: min(1180px, calc(100% - 80px));
  margin: 40px auto 0;
}

@media (prefers-reduced-motion: reduce) {
  .story-reveal,
  .story-primary,
  .click-hint-core,
  .click-hint-pulse,
  .progress-fill {
    animation: none;
    transition: none;
  }
}

@media (max-width: 760px) {
  .story-copy,
  .pos-safe-bl,
  .pos-safe-tl,
  .pos-safe-ml,
  .pos-safe-band,
  .pos-safe-tr,
  .pos-safe-note,
  .pos-safe-note-r {
    left: 16px;
    right: 16px;
    top: auto;
    bottom: max(56px, env(safe-area-inset-bottom, 0px) + 40px);
    transform: none;
    max-width: none;
    text-align: left;
  }

  .pos-safe-note,
  .pos-safe-note-r {
    padding: 12px 14px;
    border-radius: 12px;
  }

  .pos-safe-tr .story-eyebrow,
  .pos-safe-tr .story-actions,
  .pos-safe-tr .story-kicker {
    justify-content: flex-start;
  }

  .pos-safe-tr .story-description,
  .pos-safe-tr .story-fact {
    margin-left: 0;
    margin-right: 0;
  }

  .story-title {
    font-size: clamp(22px, 6.2vw, 30px) !important;
  }

  .click-hint {
    left: 56%;
    top: 48%;
    bottom: auto;
  }

  .story-chrome {
    top: max(12px, env(safe-area-inset-top, 0px) + 8px);
    right: 12px;
  }

  .story-progress {
    bottom: max(10px, env(safe-area-inset-bottom, 0px) + 8px);
    width: min(160px, 48vw);
  }
}
</style>

<style>
html.prototype-immersive-lock,
body.prototype-immersive-lock {
  overflow: hidden !important;
  height: 100%;
  overscroll-behavior: none;
}
</style>
