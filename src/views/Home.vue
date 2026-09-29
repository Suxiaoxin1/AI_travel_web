<template>
  <div class="home-page">
    <section class="ip-story" aria-label="星际行者首页故事" tabindex="0" @keydown="onStageKeydown">
      <div class="story-stage">
        <Transition name="backdrop-fade">
          <div
            :key="`backdrop-${activeScene}`"
            class="story-backdrop"
            :class="`scene-${activeScene}`"
            :style="{ '--scene-image': `url(${currentScene.background})` }"
          ></div>
        </Transition>

        <div class="story-grid">
          <div class="story-copy">
            <span class="story-eyebrow">星际行者 · AI TRAVEL COMPASS</span>
            <p class="story-kicker">{{ currentScene.label }}</p>
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

          <div :key="`visual-${activeScene}`" class="story-visual scene-transition">
            <div class="visual-aura" aria-hidden="true"></div>
            <div class="visual-route" aria-hidden="true"></div>
            <div class="visual-spark spark-one" aria-hidden="true"></div>
            <div class="visual-spark spark-two" aria-hidden="true"></div>
            <div class="visual-fact fact-top">
              <span>{{ currentScene.factLabel }}</span>
              <strong>{{ currentScene.fact }}</strong>
            </div>
            <div
              class="mascot-stage"
              :class="`motion-${currentScene.motion}`"
            >
              <img
                class="ip-mascot-static"
                :src="currentScene.mascot"
                alt="星际行者白狐提着星灯准备出发"
                fetchpriority="high"
              />
            </div>
            <div class="visual-caption">
              <span>记录每一次出发</span>
              <strong>34 个星际目的地</strong>
            </div>
          </div>
        </div>

        <div class="story-progress" aria-label="首页场景切换">
          <span
            v-for="(scene, index) in scenes"
            :key="scene.label"
            class="progress-step"
            :class="{ active: index === activeScene }"
          >
            <button
              type="button"
              :aria-label="`切换至第 ${index + 1} 幕：${scene.label}`"
              :aria-current="index === activeScene ? 'true' : undefined"
              @click="setActiveScene(index)"
            ></button>
          </span>
        </div>
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
    background: '/images/ip-scenes/scene-01.webp',
    mascot: '/images/ip/scenes/scene-01-departure.webp',
    motion: 'departure',
    factLabel: '今日导航',
    fact: '从灵感开始'
  },
  {
    title: '把好奇心，变成一条路线',
    description: 'AI 读懂你的偏好，帮你从灵感走到可执行的旅程。',
    label: '规划旅程',
    action: '生成行程',
    background: '/images/ip-scenes/scene-02.webp',
    mascot: '/images/ip/scenes/scene-02-welcome.webp',
    motion: 'welcome',
    factLabel: 'AI 行程',
    fact: '一键成形'
  },
  {
    title: '去看一座还没见过的城市',
    description: '热门目的地与隐藏风景，都可以成为你的下一站。',
    label: '发现目的地',
    action: '浏览目的地',
    background: '/images/ip-scenes/scene-03.webp',
    mascot: '/images/ip/scenes/scene-03-map.webp',
    motion: 'map',
    factLabel: '目的地',
    fact: '34 个省域'
  },
  {
    title: '沿着真实的路，慢慢走',
    description: '把景点、时间和路线放在一起，旅途会变得更从容。',
    label: '连接路线',
    action: '查看路线',
    background: '/images/ip-scenes/scene-04.webp',
    mascot: '/images/ip/scenes/scene-04-route-v3.webp',
    motion: 'route',
    factLabel: '路线规划',
    fact: '真实轨迹'
  },
  {
    title: '把风景，留成自己的故事',
    description: '照片、文字和当下的心情，都值得被好好记录。',
    label: '记录旅途',
    action: '写旅行手账',
    background: '/images/ip-scenes/scene-05.webp',
    mascot: '/images/ip/scenes/scene-05-journal.webp',
    motion: 'memory',
    factLabel: '旅行手账',
    fact: '留下故事'
  },
  {
    title: '下一颗星球，等你抵达',
    description: '准备好了吗？打开地图，向下一段未知旅程出发。',
    label: '开启旅程',
    action: '探索地图',
    background: '/images/ip-scenes/scene-06.webp',
    mascot: '/images/ip/scenes/scene-06-arrival.webp',
    motion: 'arrival',
    factLabel: '下一站',
    fact: '等你发现'
  }
]

const mapSectionRef = ref(null)
const selectedProvince = ref(null)
const activeScene = ref(0)
const router = useRouter()
const sceneIntervalMs = 2000
let sceneTimer = null
const currentScene = computed(() => scenes[activeScene.value])
const selectedProvinceData = computed(() => {
  if (!selectedProvince.value) return null
  return provinceData[selectedProvince.value] || null
})

function scrollToMap() {
  mapSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function setActiveScene(index) {
  activeScene.value = Math.min(Math.max(index, 0), scenes.length - 1)
}

function showNextScene() {
  setActiveScene((activeScene.value + 1) % scenes.length)
}

function onStageKeydown(event) {
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    setActiveScene(activeScene.value + 1 >= scenes.length ? 0 : activeScene.value + 1)
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    setActiveScene(activeScene.value - 1 < 0 ? scenes.length - 1 : activeScene.value - 1)
  }
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
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  sceneTimer = window.setInterval(showNextScene, sceneIntervalMs)
})

onBeforeUnmount(() => {
  if (sceneTimer) window.clearInterval(sceneTimer)
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
  min-height: min(820px, calc(100vh - 64px));
}

.story-stage {
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
  will-change: opacity;
  background:
    linear-gradient(90deg, rgba(2, 25, 24, .62) 0%, rgba(2, 25, 24, .30) 48%, rgba(2, 25, 24, .08) 76%),
    var(--scene-image) center / cover no-repeat;
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active { transition: opacity .72s cubic-bezier(.22, .75, .28, 1); }
.backdrop-fade-enter-from,
.backdrop-fade-leave-to { opacity: 0; }

.story-backdrop::after {
  background: linear-gradient(90deg, rgba(5, 29, 28, .82), rgba(5, 29, 28, .16) 58%, rgba(5, 29, 28, .06));
}

.scene-0 { background: linear-gradient(90deg, rgba(2, 25, 24, .62) 0%, rgba(2, 25, 24, .30) 48%, rgba(2, 25, 24, .08) 76%), var(--scene-image) center / cover no-repeat; }
.scene-1 { background: linear-gradient(90deg, rgba(5, 29, 28, .60) 0%, rgba(8, 46, 45, .28) 50%, rgba(42, 100, 95, .08) 78%), var(--scene-image) center / cover no-repeat; }
.scene-2 { background: linear-gradient(90deg, rgba(12, 34, 33, .62) 0%, rgba(31, 70, 64, .27) 48%, rgba(107, 120, 76, .08) 76%), var(--scene-image) center / cover no-repeat; }
.scene-3 { background: linear-gradient(90deg, rgba(19, 37, 36, .64) 0%, rgba(45, 77, 71, .28) 49%, rgba(119, 112, 77, .08) 77%), var(--scene-image) center / cover no-repeat; }
.scene-4 { background: linear-gradient(90deg, rgba(8, 32, 31, .64) 0%, rgba(22, 70, 66, .27) 49%, rgba(56, 119, 104, .08) 77%), var(--scene-image) center / cover no-repeat; }
.scene-5 { background: linear-gradient(90deg, rgba(25, 31, 29, .66) 0%, rgba(73, 67, 49, .29) 48%, rgba(125, 97, 53, .08) 77%), var(--scene-image) center / cover no-repeat; }

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
.story-kicker { margin: 36px 0 12px; color: var(--accent); font: 800 12px/1.2 'Noto Sans SC', sans-serif; letter-spacing: .16em; }
.story-title { max-width: 580px; margin: 0; color: #fff; font-family: 'Noto Serif SC', 'Noto Sans SC', serif; font-size: clamp(38px, 6vw, 78px); font-weight: 700; letter-spacing: .02em; line-height: 1.14; }
.story-description { max-width: 470px; margin: 24px 0 0; color: rgba(239, 255, 250, .74); font-size: clamp(15px, 1.4vw, 18px); line-height: 1.9; }
.story-reveal { animation: story-reveal .58s cubic-bezier(.22, .75, .28, 1) both; }
@keyframes story-reveal { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.story-actions { display: flex; align-items: center; gap: 20px; margin-top: 36px; }
.story-primary { border: 0; border-radius: 999px; padding: 14px 20px 14px 24px; color: #163d35; background: #e7c768; font-weight: 800; cursor: pointer; box-shadow: 0 12px 30px rgba(0,0,0,.18); transition: transform .25s ease, background .25s ease; }
.story-primary span { display: inline-block; margin-left: 15px; font-size: 18px; transition: transform .25s ease; }
.story-primary:hover { background: #f5d985; transform: translateY(-2px); }
.story-primary:hover span { transform: translate(2px, -2px); }
.story-hint { color: rgba(255,255,255,.52); font-size: 12px; }

.story-visual { position: relative; display: grid; place-items: center; min-height: 510px; }
.scene-transition { animation: scene-enter .68s cubic-bezier(.22, .75, .28, 1) both; will-change: opacity, transform; }
@keyframes scene-enter { from { opacity: 0; transform: translate3d(14px, 0, 0) scale(.99); } to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); } }
.visual-aura { position: absolute; z-index: 0; width: min(610px, 112%); aspect-ratio: 1.2; background: radial-gradient(ellipse at 50% 54%, rgba(205, 248, 239, .24), rgba(111, 218, 202, .1) 43%, transparent 72%); filter: blur(2px); transform: translate(4%, 2%); }
.visual-route { position: absolute; z-index: 1; inset: 13% -7% 7% 1%; border: 1px solid rgba(214, 249, 239, .24); border-left-color: transparent; border-bottom-color: transparent; border-radius: 47% 53% 54% 46% / 43% 44% 56% 57%; transform: rotate(-15deg); }
.visual-route::before, .visual-route::after { position: absolute; content: ''; }
.visual-route::before { width: 13px; height: 13px; top: 7%; right: 11%; border-radius: 50%; background: #f3d477; box-shadow: 0 0 20px rgba(243, 212, 119, .82); }
.visual-route::after { width: 32%; height: 1px; right: -2%; bottom: 15%; background: linear-gradient(90deg, transparent, rgba(232, 199, 104, .84)); transform: rotate(-34deg); transform-origin: right; }
.mascot-stage { position: relative; z-index: 2; display: grid; place-items: center; width: min(438px, 100%); height: min(506px, calc(100vh - 184px)); min-height: 328px; transform: translate(2%, 1%); }
.ip-mascot-static { display: block; width: 100%; height: 100%; object-fit: contain; object-position: center bottom; filter: drop-shadow(0 28px 34px rgba(0, 25, 23, .42)); }
/* 第 4 幕路线背景的高光会吞掉白狐的浅色耳朵和脸颊；只在该幕补一层分离光。 */
.motion-route { isolation: isolate; }
.motion-route::before { position: absolute; z-index: 0; top: 2%; right: 2%; width: 62%; height: 43%; border-radius: 50%; background: radial-gradient(ellipse at 48% 48%, rgba(232, 255, 250, .34) 0%, rgba(155, 231, 216, .16) 45%, transparent 74%); filter: blur(8px); content: ''; pointer-events: none; }
.motion-route .ip-mascot-static { position: relative; z-index: 1; filter: brightness(1.06) contrast(1.04) drop-shadow(0 28px 34px rgba(0, 25, 23, .48)); }
.visual-spark { position: absolute; z-index: 3; width: 7px; height: 7px; border-radius: 50%; background: #f3d477; box-shadow: 0 0 18px #f3d477; animation: spark-float 3s ease-in-out infinite; }
.spark-one { top: 18%; left: 8%; }
.spark-two { right: 9%; bottom: 22%; width: 4px; height: 4px; animation-delay: -1.4s; }
@keyframes spark-float { 50% { transform: translateY(-12px) scale(1.4); opacity: .65; } }
.visual-fact { position: absolute; z-index: 3; left: -3%; bottom: 10%; display: grid; gap: 4px; padding: 12px 15px; border-left: 2px solid #e7c768; color: rgba(236,255,249,.58); background: linear-gradient(90deg, rgba(9,44,42,.5), transparent); font-size: 10px; letter-spacing: .08em; }
.visual-fact strong { color: #f3d477; font-size: 13px; letter-spacing: .02em; }
.visual-caption { position: absolute; z-index: 3; right: 1%; bottom: 5%; display: grid; gap: 4px; color: rgba(236, 255, 249, .64); font-size: 11px; text-align: right; }
.visual-caption strong { color: #f4d377; font: 700 14px 'Noto Sans SC', sans-serif; }
.story-progress { position: absolute; z-index: 4; left: 50%; bottom: 36px; display: flex; gap: 9px; transform: translateX(-50%); }
.progress-step button { display: block; width: 8px; height: 8px; padding: 0; border: 0; border-radius: 99px; background: rgba(255,255,255,.35); cursor: pointer; transition: width .25s ease, background .25s ease; }
.progress-step.active button { width: 28px; background: var(--accent); }
.progress-step button:focus-visible { outline: 2px solid #fff; outline-offset: 4px; }
.map-section { width: min(1180px, calc(100% - 80px)); margin: 0 auto; padding: 110px 0 10px; }
.section-heading { max-width: 620px; margin-bottom: 28px; }
.section-eyebrow { color: #0d6b5c; font: 800 10px 'Inter', sans-serif; letter-spacing: .2em; }
.section-heading h2 { margin: 12px 0 8px; color: #173e35; font: 700 clamp(28px, 4vw, 44px)/1.2 'Noto Serif SC', 'Noto Sans SC', serif; }
.section-heading p { color: var(--muted); font-size: 15px; }
.map-layout { width: 100%; height: min(70vh, 760px); min-height: 480px; overflow: hidden; border: 1px solid #dfece6; border-radius: 28px; background: #fff; box-shadow: 0 20px 50px rgba(19, 72, 61, .1); }
.map-area { width: 100%; height: 100%; }
.section-width { width: min(1180px, calc(100% - 80px)); margin: 40px auto 0; }

@media (prefers-reduced-motion: reduce) {
  .story-reveal, .scene-transition, .story-primary, .story-primary span, .visual-spark, .progress-step button { animation: none; transition: none; }
}

@media (max-width: 760px) {
  .ip-story { min-height: auto; }
  .story-stage { min-height: 600px; height: calc(100vh - 58px); }
  .story-grid { display: flex; flex-direction: column; justify-content: center; align-items: stretch; width: min(100% - 40px, 560px); gap: 8px; padding: 32px 0 70px; }
  .story-kicker { margin-top: 22px; }
  .story-title { font-size: clamp(36px, 11vw, 58px); }
  .story-description { margin-top: 16px; }
  .story-actions { margin-top: 24px; }
  .story-visual { min-height: 280px; order: -1; }
  .mascot-stage { width: min(266px, 74vw); height: min(306px, 40vh); min-height: 228px; transform: translate(0, 0); }
  .visual-aura { width: min(410px, 110%); }
  .visual-route { inset: 16% -7% 8% 4%; }
  .visual-fact { left: 0; bottom: 0; }
  .visual-caption { right: 4%; bottom: 2%; }
  .story-progress { bottom: 25px; }
  .map-section, .section-width { width: min(100% - 32px, 600px); }
  .map-section { padding-top: 76px; }
  .map-layout { min-height: 420px; height: 68vh; border-radius: 20px; }
}

/* 超宽视口（包括浏览器缩小后扩大的 CSS 视口）与背景同步扩展内容尺度。 */
@media (min-width: 2200px) {
  .story-grid { grid-template-columns: minmax(580px, .95fr) minmax(520px, .85fr); gap: clamp(82px, 7vw, 180px); width: min(1800px, calc(100% - 180px)); }
  .story-title { font-size: clamp(76px, 4vw, 150px); }
  .story-description { max-width: 680px; font-size: clamp(20px, 1.1vw, 32px); }
  .story-eyebrow, .story-kicker { font-size: clamp(13px, .72vw, 22px); }
  .story-visual { min-height: 720px; }
  .mascot-stage { width: clamp(520px, 19vw, 720px); height: clamp(600px, 22vw, 820px); min-height: 600px; }
}
</style>
