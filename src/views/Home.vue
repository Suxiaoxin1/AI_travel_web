<template>
  <div class="home-page">
    <section ref="storyRef" class="ip-story" aria-label="星际行者首页故事">
      <div class="story-stage">
        <div class="story-backdrop" :class="`scene-${activeScene}`"></div>

        <div class="story-grid">
          <div class="story-copy">
            <span class="story-eyebrow">星际行者 · AI TRAVEL COMPASS</span>
            <p class="story-index">0{{ activeScene + 1 }} <span>/ 06</span></p>
            <h1 :key="activeScene" class="story-title story-reveal">
              {{ currentScene.title }}
            </h1>
            <p :key="`${activeScene}-description`" class="story-description story-reveal">
              {{ currentScene.description }}
            </p>
            <div class="story-actions">
              <button class="story-primary" type="button" @click="handleSceneAction">
                {{ currentScene.action }}
                <span aria-hidden="true">↗</span>
              </button>
              <span class="story-hint">向下滚动探索</span>
            </div>
          </div>

          <div class="story-visual scene-transition" :class="{ 'is-loading': videoLoading && !frameMode }">
            <div class="visual-orbit orbit-one"></div>
            <div class="visual-orbit orbit-two"></div>
            <div class="visual-spark spark-one"></div>
            <div class="visual-spark spark-two"></div>
            <div class="visual-label">
              <span class="label-dot"></span>
              {{ currentScene.label }}
            </div>
            <div class="visual-fact fact-top">
              <span>{{ currentScene.factLabel }}</span>
              <strong>{{ currentScene.fact }}</strong>
            </div>
            <div v-if="frameLoading && !frameMode" class="video-placeholder" aria-live="polite">
              <span class="placeholder-ring"></span>
              <span>正在加载滚动动画</span>
            </div>
            <canvas
              ref="canvasRef"
              class="ip-mascot-canvas"
              :class="{ 'is-visible': frameMode }"
              aria-label="可随滚动控制的星际旅行小狐狸动画"
            ></canvas>
            <video
                v-if="!frameMode"
                :key="currentScene.video"
                class="ip-mascot-video"
                autoplay
                muted
                playsinline
                preload="metadata"
                aria-label="星际旅行小狐狸动态形象"
              @loadstart="videoLoading = true"
                @canplay="videoLoading = false"
                @error="videoLoading = false"
              >
                <source :src="currentScene.webm" type="video/webm" />
                <source :src="currentScene.video" type="video/mp4" />
            </video>
            <div class="visual-caption">
              <span>记录每一次出发</span>
              <strong>34 个星际目的地</strong>
            </div>
          </div>
        </div>

        <div class="story-progress" aria-label="故事进度">
          <span
            v-for="(scene, index) in scenes"
            :key="scene.label"
            class="progress-step"
            :class="{ active: index === activeScene, passed: index < activeScene }"
          >
            <button type="button" :aria-label="`跳转到${scene.label}`" @click="jumpToScene(index)"></button>
          </span>
        </div>
        <div class="scroll-cue" aria-hidden="true"><span></span>SCROLL TO EXPLORE</div>
      </div>
    </section>

    <section ref="mapSectionRef" class="map-section" aria-labelledby="map-title">
      <div class="section-heading">
        <span class="section-eyebrow">YOUR NEXT DESTINATION</span>
        <h2 id="map-title">从地图出发，找到下一站</h2>
        <p>点击地图上的省份，查看当地值得收藏的旅行灵感。</p>
      </div>
      <div class="map-layout">
        <div class="map-area">
          <AMapChina @province-click="onProvinceClick" />
        </div>
      </div>
    </section>

    <ProvincePanel
      v-if="selectedProvince"
      :province="selectedProvince"
      :data="selectedProvinceData"
      @close="selectedProvince = null"
    />
    <div class="section-width">
      <FeatureEntriesSection />
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AMapChina from '../components/AMapChina.vue'
import ProvincePanel from '../components/ProvincePanel.vue'
import FeatureEntriesSection from '../components/FeatureEntries.vue'
import { provinceData } from '../data/provinces.js'

const scenes = [
  {
    title: '让每一次出发，都有星光回应',
    description: '从一张地图、一段想法，开始整理属于你的下一场旅行。',
    label: '准备出发',
    action: '开始探索',
    video: '/videos/ip-01.mp4',
    webm: '/videos/ip-01.webm',
    frames: '/frames/ip-01/frame-',
    frameCount: 32,
    factLabel: '今日导航',
    fact: '从灵感开始'
  },
  {
    title: '把好奇心，变成一条路线',
    description: 'AI 读懂你的偏好，帮你从灵感走到可执行的旅程。',
    label: '规划旅程',
    action: '生成行程',
    video: '/videos/ip-02.mp4',
    webm: '/videos/ip-02.webm',
    frames: '/frames/ip-02/frame-',
    frameCount: 32,
    factLabel: 'AI 行程',
    fact: '一键成形'
  },
  {
    title: '去看一座还没见过的城市',
    description: '热门目的地与隐藏风景，都可以成为你的下一站。',
    label: '发现目的地',
    action: '浏览目的地',
    video: '/videos/ip-03.mp4',
    webm: '/videos/ip-03.webm',
    frames: '/frames/ip-03/frame-',
    frameCount: 32,
    factLabel: '目的地',
    fact: '34 个省域'
  },
  {
    title: '沿着真实的路，慢慢走',
    description: '把景点、时间和路线放在一起，旅途会变得更从容。',
    label: '连接路线',
    action: '查看路线',
    video: '/videos/ip-04.mp4',
    webm: '/videos/ip-04.webm',
    frames: '/frames/ip-04/frame-',
    frameCount: 32,
    factLabel: '路线规划',
    fact: '真实轨迹'
  },
  {
    title: '把风景，留成自己的故事',
    description: '照片、文字和当下的心情，都值得被好好记录。',
    label: '记录旅途',
    action: '写旅行手账',
    video: '/videos/ip-05.mp4',
    webm: '/videos/ip-05.webm',
    frames: '/frames/ip-05/frame-',
    frameCount: 32,
    factLabel: '旅行手账',
    fact: '留下故事'
  },
  {
    title: '下一颗星球，等你抵达',
    description: '准备好了吗？打开地图，向下一段未知旅程出发。',
    label: '开启旅程',
    action: '探索地图',
    video: '/videos/ip-06.mp4',
    webm: '/videos/ip-06.webm',
    frames: '/frames/ip-06/frame-',
    frameCount: 32,
    factLabel: '下一站',
    fact: '等你发现'
  }
]

const storyRef = ref(null)
const mapSectionRef = ref(null)
const activeScene = ref(0)
const videoLoading = ref(true)
const frameLoading = ref(true)
const frameMode = ref(false)
const selectedProvince = ref(null)
const canvasRef = ref(null)
const router = useRouter()
let scrollFrame = 0
let frameLoadToken = 0
const sceneProgress = ref(0)
const frameCache = new Map()

const currentScene = computed(() => scenes[activeScene.value])
const selectedProvinceData = computed(() => {
  if (!selectedProvince.value) return null
  return provinceData[selectedProvince.value] || null
})

function updateStoryProgress() {
  if (!storyRef.value) return
  const rect = storyRef.value.getBoundingClientRect()
  const travelDistance = Math.max(storyRef.value.offsetHeight - window.innerHeight, 1)
  const progress = Math.min(Math.max(-rect.top / travelDistance, 0), 1)
  const scenePosition = progress * scenes.length
  const nextScene = Math.min(scenes.length - 1, Math.floor(scenePosition))
  activeScene.value = nextScene
  sceneProgress.value = nextScene === scenes.length - 1 ? 1 : scenePosition - nextScene
  drawSceneFrame(nextScene, sceneProgress.value)
}

function drawSceneFrame(index, progress) {
  const frames = frameCache.get(index)
  const canvas = canvasRef.value
  if (!frames?.length || !canvas) return
  const image = frames[Math.min(frames.length - 1, Math.round(progress * (frames.length - 1)))]
  const rect = canvas.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.round(rect.width * ratio))
  canvas.height = Math.max(1, Math.round(rect.height * ratio))
  const context = canvas.getContext('2d')
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, rect.width, rect.height)
  context.drawImage(image, 0, 0, rect.width, rect.height)
}

function loadSceneFrames(index) {
  const scene = scenes[index]
  const cached = frameCache.get(index)
  if (cached) {
    frameLoading.value = false
    frameMode.value = true
    requestAnimationFrame(() => drawSceneFrame(index, sceneProgress.value))
    return
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    frameLoading.value = false
    frameMode.value = false
    return
  }

  const token = ++frameLoadToken
  frameLoading.value = true
  frameMode.value = false
  Promise.all(Array.from({ length: scene.frameCount }, (_, frameIndex) => new Promise((resolve) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = `${scene.frames}${String(frameIndex + 1).padStart(2, '0')}.webp`
  }))).then((frames) => {
    if (token !== frameLoadToken) return
    if (frames.some((frame) => !frame)) {
      frameLoading.value = false
      frameMode.value = false
      return
    }
    frameCache.set(index, frames)
    frameLoading.value = false
    frameMode.value = true
    requestAnimationFrame(() => drawSceneFrame(index, sceneProgress.value))
  })
}

function onScroll() {
  if (scrollFrame) return
  scrollFrame = window.requestAnimationFrame(() => {
    updateStoryProgress()
    scrollFrame = 0
  })
}

function jumpToScene(index) {
  if (!storyRef.value) return
  const travelDistance = storyRef.value.offsetHeight - window.innerHeight
  const target = storyRef.value.offsetTop + (travelDistance * (index / scenes.length))
  window.scrollTo({ top: target, behavior: 'smooth' })
}

function scrollToMap() {
  mapSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function handleSceneAction() {
  const routes = ['/plan', '/plan', '/destinations', '/routes', '/journal']
  const target = routes[activeScene.value]
  if (target) {
    router.push(target)
    return
  }
  scrollToMap()
}

function onProvinceClick(code) {
  selectedProvince.value = code
}

onMounted(() => {
  updateStoryProgress()
  loadSceneFrames(0)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', updateStoryProgress)
})

watch(activeScene, (index) => {
  loadSceneFrames(index)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', updateStoryProgress)
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
  frameLoadToken += 1
})
</script>

<style scoped>
.home-page {
  --ink: #12372f;
  --muted: #6d837b;
  --mint: #b8eee5;
  --accent: #e3b94f;
  background: #f7fbf8;
  color: var(--ink);
  padding-bottom: 70px;
}

.ip-story {
  position: relative;
  height: 520vh;
}

.story-stage {
  position: sticky;
  top: 0;
  height: calc(100vh - 64px);
  min-height: 620px;
  overflow: hidden;
  background: #0b2c2a;
  isolation: isolate;
}

.story-backdrop,
.story-backdrop::before,
.story-backdrop::after {
  position: absolute;
  inset: 0;
  content: '';
}

.story-backdrop {
  z-index: -3;
  background: radial-gradient(circle at 76% 50%, rgba(122, 226, 213, .3), transparent 28%), linear-gradient(118deg, #0b2c2a 0%, #0d4842 48%, #6aa9a0 100%);
  transition: background 700ms ease;
}

.story-backdrop::before {
  opacity: .34;
  background-image: radial-gradient(circle, rgba(255,255,255,.8) 0 1px, transparent 1.5px);
  background-size: 48px 48px;
  mask-image: linear-gradient(90deg, transparent, #000 40%, transparent 100%);
}

.story-backdrop::after {
  background: linear-gradient(90deg, rgba(5, 29, 28, .82), rgba(5, 29, 28, .16) 58%, rgba(5, 29, 28, .06));
}

.scene-1 { background: radial-gradient(circle at 72% 44%, rgba(122, 226, 213, .32), transparent 30%), linear-gradient(118deg, #092b2b, #12625a 55%, #72b5a8); }
.scene-2 { background: radial-gradient(circle at 76% 48%, rgba(226, 193, 91, .28), transparent 30%), linear-gradient(118deg, #122e30, #286b67 55%, #a5c6ac); }
.scene-3 { background: radial-gradient(circle at 73% 43%, rgba(238, 198, 92, .3), transparent 28%), linear-gradient(118deg, #16302f, #507d72 58%, #c1d8c4); }
.scene-4 { background: radial-gradient(circle at 78% 50%, rgba(120, 219, 206, .3), transparent 28%), linear-gradient(118deg, #102f30, #1e5c58 55%, #7fc0b1); }
.scene-5 { background: radial-gradient(circle at 73% 45%, rgba(244, 207, 115, .3), transparent 28%), linear-gradient(118deg, #242d2d, #655d4d 58%, #c4ae79); }

.story-grid {
  display: grid;
  grid-template-columns: minmax(0, .95fr) minmax(360px, .85fr);
  gap: clamp(28px, 6vw, 110px);
  align-items: center;
  width: min(1180px, calc(100% - 80px));
  height: 100%;
  margin: 0 auto;
  padding: 42px 0 78px;
}

.story-copy { max-width: 580px; color: #f8fffc; }
.story-eyebrow { display: inline-flex; align-items: center; gap: 12px; color: #b5e7de; font-size: 11px; font-weight: 800; letter-spacing: .2em; }
.story-eyebrow::before { width: 30px; height: 1px; background: var(--accent); content: ''; }
.story-index { margin: 36px 0 12px; color: var(--accent); font: 700 14px/1 'Inter', sans-serif; letter-spacing: .1em; }
.story-index span { color: rgba(255,255,255,.44); font-size: 11px; }
.story-title { max-width: 580px; margin: 0; color: #fff; font-family: 'Noto Serif SC', 'Noto Sans SC', serif; font-size: clamp(38px, 6vw, 78px); font-weight: 700; letter-spacing: .02em; line-height: 1.14; }
.story-description { max-width: 470px; margin: 24px 0 0; color: rgba(239, 255, 250, .74); font-size: clamp(15px, 1.4vw, 18px); line-height: 1.9; }
.story-reveal { animation: story-reveal .65s ease both; }
@keyframes story-reveal { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
.story-actions { display: flex; align-items: center; gap: 20px; margin-top: 36px; }
.story-primary { border: 0; border-radius: 999px; padding: 14px 20px 14px 24px; color: #163d35; background: #e7c768; font-weight: 800; cursor: pointer; box-shadow: 0 12px 30px rgba(0,0,0,.18); transition: transform .25s ease, background .25s ease; }
.story-primary span { display: inline-block; margin-left: 15px; font-size: 18px; transition: transform .25s ease; }
.story-primary:hover { background: #f5d985; transform: translateY(-2px); }
.story-primary:hover span { transform: translate(2px, -2px); }
.story-hint { color: rgba(255,255,255,.52); font-size: 12px; }

.story-visual { position: relative; display: grid; place-items: center; min-height: 470px; }
.scene-transition { animation: scene-enter .7s cubic-bezier(.22,.8,.25,1) both; }
@keyframes scene-enter { from { opacity: 0; transform: translate3d(34px, 0, 0) scale(.96); } to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); } }
.ip-mascot-video { position: relative; z-index: 2; width: min(420px, 80%); aspect-ratio: 1; object-fit: cover; border: 1px solid rgba(235, 255, 249, .5); border-radius: 44% 56% 48% 52%; background: rgba(191, 241, 231, .2); box-shadow: 0 28px 80px rgba(0, 21, 22, .28), 0 0 0 14px rgba(207, 245, 235, .08); transition: filter .3s ease; }
.ip-mascot-canvas { display: none; position: relative; z-index: 2; width: min(420px, 80%); aspect-ratio: 1; object-fit: cover; border: 1px solid rgba(235, 255, 249, .5); border-radius: 44% 56% 48% 52%; background: rgba(191, 241, 231, .2); box-shadow: 0 28px 80px rgba(0, 21, 22, .28), 0 0 0 14px rgba(207, 245, 235, .08); }
.ip-mascot-canvas.is-visible { display: block; }
.story-visual.is-loading .ip-mascot-video { filter: saturate(.7); }
.video-placeholder { position: absolute; z-index: 4; display: grid; place-items: center; gap: 12px; width: 180px; color: rgba(236,255,249,.72); font-size: 12px; text-align: center; }
.placeholder-ring { width: 34px; height: 34px; border: 2px solid rgba(231,199,104,.28); border-top-color: #e7c768; border-radius: 50%; animation: ring-spin 1s linear infinite; }
@keyframes ring-spin { to { transform: rotate(360deg); } }
.visual-orbit { position: absolute; z-index: 1; border: 1px solid rgba(213, 249, 239, .34); border-radius: 50%; transform: rotate(-20deg); }
.orbit-one { width: 92%; height: 42%; }
.orbit-two { width: 75%; height: 70%; transform: rotate(62deg); }
.visual-spark { position: absolute; z-index: 3; width: 7px; height: 7px; border-radius: 50%; background: #f3d477; box-shadow: 0 0 18px #f3d477; animation: spark-float 3s ease-in-out infinite; }
.spark-one { top: 23%; left: 17%; }
.spark-two { right: 20%; bottom: 17%; width: 4px; height: 4px; animation-delay: -1.4s; }
@keyframes spark-float { 50% { transform: translateY(-12px) scale(1.4); opacity: .65; } }
.visual-label { position: absolute; z-index: 3; top: 9%; right: 8%; display: inline-flex; align-items: center; gap: 8px; padding: 9px 13px; border: 1px solid rgba(255,255,255,.24); border-radius: 999px; color: #ecfff9; background: rgba(12, 62, 58, .38); backdrop-filter: blur(8px); font-size: 11px; letter-spacing: .08em; }
.label-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 12px var(--accent); }
.visual-fact { position: absolute; z-index: 3; left: 1%; bottom: 11%; display: grid; gap: 4px; padding: 12px 15px; border-left: 2px solid #e7c768; color: rgba(236,255,249,.58); background: linear-gradient(90deg, rgba(9,44,42,.5), transparent); font-size: 10px; letter-spacing: .08em; }
.visual-fact strong { color: #f3d477; font-size: 13px; letter-spacing: .02em; }
.visual-caption { position: absolute; z-index: 3; right: 7%; bottom: 8%; display: grid; gap: 4px; color: rgba(236, 255, 249, .64); font-size: 11px; text-align: right; }
.visual-caption strong { color: #f4d377; font: 700 14px 'Noto Sans SC', sans-serif; }
.story-progress { position: absolute; z-index: 4; left: 50%; bottom: 36px; display: flex; gap: 9px; transform: translateX(-50%); }
.progress-step button { display: block; width: 8px; height: 8px; padding: 0; border: 0; border-radius: 99px; background: rgba(255,255,255,.35); cursor: pointer; transition: width .3s ease, background .3s ease; }
.progress-step.active button { width: 28px; background: var(--accent); }
.progress-step.passed button { background: rgba(255,255,255,.72); }
.scroll-cue { position: absolute; right: 36px; bottom: 34px; display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,.48); font: 700 9px 'Inter', sans-serif; letter-spacing: .16em; writing-mode: vertical-rl; }
.scroll-cue span { width: 1px; height: 34px; background: linear-gradient(var(--accent), transparent); }

.map-section { width: min(1180px, calc(100% - 80px)); margin: 0 auto; padding: 110px 0 10px; }
.section-heading { max-width: 620px; margin-bottom: 28px; }
.section-eyebrow { color: #0d6b5c; font: 800 10px 'Inter', sans-serif; letter-spacing: .2em; }
.section-heading h2 { margin: 12px 0 8px; color: #173e35; font: 700 clamp(28px, 4vw, 44px)/1.2 'Noto Serif SC', 'Noto Sans SC', serif; }
.section-heading p { color: var(--muted); font-size: 15px; }
.map-layout { width: 100%; height: min(70vh, 760px); min-height: 480px; overflow: hidden; border: 1px solid #dfece6; border-radius: 28px; background: #fff; box-shadow: 0 20px 50px rgba(19, 72, 61, .1); }
.map-area { width: 100%; height: 100%; }
.section-width { width: min(1180px, calc(100% - 80px)); margin: 40px auto 0; }

@media (prefers-reduced-motion: reduce) {
  .story-reveal, .scene-transition, .story-primary, .story-primary span, .progress-step button, .visual-spark, .placeholder-ring { animation: none; transition: none; }
  .ip-mascot-canvas { display: none !important; }
  .story-stage { position: relative; }
  .ip-story { height: auto; }
  .story-backdrop { transition: none; }
}

@media (max-width: 760px) {
  .ip-story { height: 420vh; }
  .story-stage { min-height: 600px; height: calc(100vh - 58px); }
  .story-grid { display: flex; flex-direction: column; justify-content: center; align-items: stretch; width: min(100% - 40px, 560px); gap: 8px; padding: 32px 0 70px; }
  .story-index { margin-top: 22px; }
  .story-title { font-size: clamp(36px, 11vw, 58px); }
  .story-description { margin-top: 16px; }
  .story-actions { margin-top: 24px; }
  .story-visual { min-height: 270px; order: -1; }
  .ip-mascot-video { width: min(260px, 64vw); border-radius: 42% 58% 46% 54%; }
  .visual-label { top: 0; right: 4%; }
  .visual-fact { left: 2%; bottom: 0; }
  .visual-caption { right: 4%; bottom: 2%; }
  .scroll-cue { display: none; }
  .story-progress { bottom: 25px; }
  .map-section, .section-width { width: min(100% - 32px, 600px); }
  .map-section { padding-top: 76px; }
  .map-layout { min-height: 420px; height: 68vh; border-radius: 20px; }
}
</style>
