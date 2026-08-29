<template>
  <div class="routes-page">
    <PageHero v-bind="pageHeroConfig.routes" @action="panelMode = 'import'" />
    <div id="route-panel" class="navigate-layout">
    <!-- 左侧控制面板 -->
    <div class="nav-panel">
      <div class="nav-panel-header">
        <h2 class="nav-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A84B" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          景点导航
        </h2>
        <!-- 模式切换 Tab -->
        <div class="mode-tabs">
          <button :class="['mode-tab', { active: panelMode === 'import' }]" @click="panelMode = 'import'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            导入行程
          </button>
          <button :class="['mode-tab', { active: panelMode === 'single' }]" @click="panelMode = 'single'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            行程路线
          </button>
          <button :class="['mode-tab', { active: panelMode === 'route' }]" @click="panelMode = 'route'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            路线调整
          </button>
        </div>
      </div>

      <!-- ===== 导入行程面板 ===== -->
      <div v-if="panelMode === 'import'" class="panel-body">
        <p class="panel-hint">从收藏中选择已保存的行程，快速生成游览路线</p>
        <!-- 收藏行程列表 -->
        <div v-if="favoritePlans.length > 0" class="fav-plan-list">
          <div
            v-for="fp in favoritePlans"
            :key="fp.id"
            class="fav-plan-item"
            @click="selectPlan(fp)"
          >
            <div class="fp-color" :style="{ background: fp.color || 'linear-gradient(135deg, #0D6B5C, #1A8A7A)' }"></div>
            <div class="fp-info">
              <span class="fp-name">{{ fp.name }}</span>
              <span class="fp-meta">{{ fp.plan?.days }}天 · {{ fp.plan?.cities }}城 · {{ fp.date }}</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8B9E" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
        <div v-else class="route-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4D0C8" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <p>暂无收藏的行程</p>
          <p class="panel-hint">请先在"旅行规划"中生成并保存行程</p>
        </div>
      </div>

      <!-- ===== 行程路线面板（按天展示） ===== -->
      <div v-if="panelMode === 'single'" class="panel-body">
        <!-- 未选择行程时提示 -->
        <div v-if="!selectedPlan" class="route-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4D0C8" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <p>请先从"导入行程"选择行程</p>
        </div>
        <!-- 已选择行程：按天展示 -->
        <div v-else class="day-list">
          <!-- 行程标题 -->
          <div class="plan-header">
            <span class="plan-title">{{ selectedPlan.name }}</span>
            <span class="plan-meta">{{ selectedPlan.plan?.days }}天 · {{ selectedPlan.plan?.cities }}城</span>
          </div>
          <!-- 每天的景点 -->
          <div v-for="(day, dayIdx) in selectedPlan.plan?.daysList || []" :key="dayIdx" class="day-group">
            <div class="day-header">
              <span class="day-tag" :style="{ background: dayColors[dayIdx % dayColors.length] }">Day {{ dayIdx + 1 }}</span>
              <span class="day-title">{{ day.title }}</span>
            </div>
            <div class="day-spots">
              <div v-for="(spot, spotIdx) in day.spots || []" :key="spotIdx" class="day-spot">
                <div class="ds-dot" :style="{ background: dayColors[dayIdx % dayColors.length] }"></div>
                <span class="ds-name">{{ typeof spot === 'string' ? spot : spot.name }}</span>
              </div>
            </div>
          </div>
          <!-- 路线规划偏好：规划前必须先选择 -->
          <div v-if="selectedPlan.plan?.daysList?.length >= 1" class="route-strategy-section">
            <div class="route-strategy-title">选择路线规划偏好</div>
            <div class="route-strategies">
              <label v-for="s in strategies" :key="s.key" :class="['strat-label', { active: strategy === s.key }]">
                <input type="radio" :value="s.key" v-model="strategy" />
                <span>{{ s.icon }} {{ s.label }}</span>
              </label>
            </div>
            <p v-if="!strategy" class="strategy-required-hint">请选择一种偏好后再规划路线</p>
          </div>
          <!-- 规划路线按钮 -->
          <button class="btn-plan-route" :disabled="planning || !strategy" @click="generateRouteFromPlan">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            {{ planning ? '规划中...' : '规划路线' }}
          </button>
          <!-- 在外部地图打开 -->
          <button class="btn-outline-full" @click="openExternalMap" style="margin-top:4px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            在高德 / 腾讯地图中打开
          </button>
        </div>
      </div>

      <!-- ===== 路线调整面板 ===== -->
      <div v-if="panelMode === 'route'" class="panel-body">
        <!-- 未选择行程时提示 -->
        <div v-if="!selectedPlan" class="route-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4D0C8" stroke-width="1.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          <p>请先从"导入行程"选择行程并规划路线</p>
        </div>
        <!-- 按天展示路线详情 -->
        <div v-else class="day-list">
          <div class="plan-header">
            <span class="plan-title">{{ selectedPlan.name }}</span>
            <span class="plan-meta">{{ selectedPlan.plan?.days }}天 · {{ selectedPlan.plan?.cities }}城</span>
          </div>
          <div v-for="(day, dayIdx) in selectedPlan.plan?.daysList || []" :key="dayIdx" class="day-group">
            <div class="day-header">
              <span class="day-tag" :style="{ background: dayColors[dayIdx % dayColors.length] }">Day {{ dayIdx + 1 }}</span>
              <span class="day-title">{{ day.title }}</span>
            </div>
            <div class="day-spots">
              <div v-for="(spot, spotIdx) in day.spots || []" :key="spotIdx" class="day-spot">
                <div class="ds-dot" :style="{ background: dayColors[dayIdx % dayColors.length] }"></div>
                <span class="day-spot-order">{{ spotIdx + 1 }}</span>
                <span class="ds-name">{{ typeof spot === 'string' ? spot : spot.name }}</span>
                <div class="day-spot-actions">
                  <button class="ds-move" :disabled="spotIdx === 0" @click="moveSpotInDay(dayIdx, spotIdx, -1)" title="上移">↑</button>
                  <button class="ds-move" :disabled="spotIdx === (day.spots?.length || 0) - 1" @click="moveSpotInDay(dayIdx, spotIdx, 1)" title="下移">↓</button>
                  <button class="ds-del" @click="removeSpotFromDay(dayIdx, spotIdx)" title="删除此景点">✕</button>
                </div>
              </div>
              <!-- 添加景点输入框 -->
              <div v-if="editingDayIdx === dayIdx" class="add-spot-row">
                <input
                  v-model="newSpotName"
                  class="add-spot-input"
                  placeholder="输入景点名称"
                  @keyup.enter="addSpotToDay(dayIdx)"
                />
                <select v-model.number="addSpotInsertIndex" class="add-spot-position" title="选择插入位置">
                  <option :value="0">插入最前</option>
                  <option v-for="(existingSpot, existingIdx) in day.spots || []" :key="existingIdx" :value="existingIdx + 1">
                    {{ existingIdx === (day.spots?.length || 0) - 1 ? '添加到最后' : `放在${typeof existingSpot === 'string' ? existingSpot : existingSpot.name}后` }}
                  </option>
                </select>
                <button class="add-spot-confirm" @click="addSpotToDay(dayIdx)">添加</button>
                <button class="add-spot-cancel" @click="cancelAddSpot">取消</button>
              </div>
              <button v-else class="add-spot-btn" @click="startAddSpot(dayIdx)">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                添加景点
              </button>
            </div>
          </div>
          <!-- 操作按钮 -->
          <div class="route-action-btns">
            <button class="btn-plan" :disabled="planning || !strategy" @click="generateRouteFromPlan">
              <span v-if="planning" class="btn-spinner"></span>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {{ planning ? '规划中...' : '重新规划' }}
            </button>
            <button class="btn-clear-sm" @click="clearRoute" title="清空路线">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <!-- 保存 -->
          <button class="btn-save" @click="saveRoute">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            保存路线
          </button>
        </div>
      </div>
    </div>

    <!-- 右侧地图 -->
    <div class="map-container">
      <!-- 静态默认状态 -->
      <div v-if="!mapActive" class="map-static" @click="activateMap">
        <img class="map-static-img" src="/images/china-map.png" alt="中国地图" />
        <div class="map-static-overlay">
          <div class="map-static-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <p>点击开启交互地图</p>
          </div>
        </div>
      </div>
      <!-- 交互地图 -->
      <div v-else class="map-interactive">
        <div ref="mapEl" class="amap-container"></div>
        <!-- 地图工具 -->
        <div class="map-toolbar">
          <button class="map-btn" @click="fitAll" title="聚焦全部">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>
          <button class="map-btn" @click="resetView" title="重置">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4m10-10h-4M6 12H2"/></svg>
          </button>
        </div>
      </div>
      <!-- 底部信息栏 -->
      <div class="map-info-bar">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D4A84B" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span>{{ mapInfoText }}</span>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast" :class="[toast.type, { visible: toast.visible }]">{{ toast.message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount, onMounted } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import { getRouteCache, setRouteCache } from '../utils/routeCache'
import apiClient from '../utils/apiClient.js'
import { chat } from '../utils/agnesApi.js'
import { useAuthStore } from '../stores/authStore.js'
import { usePlanStore } from '../stores/planStore.js'
import { useRouteStore } from '../stores/routeStore.js'
import PageHero from '../components/PageHero.vue'
import { pageHeroConfig } from '../config/pageHeroConfig.js'

const authStore = useAuthStore()
const planStore = usePlanStore()
const routeStore = useRouteStore()

// ========== 面板模式 ==========
const panelMode = ref('import') // import | single | route

// ========== 地图 ==========
const mapActive = ref(false)
const mapEl = ref(null)
let amapInstance = null
let routeRequestId = 0
// 多天路线：每天一条折线和一组标记
let dayPolylines = []
let dayMarkers = []
const mapInfoText = ref('点击景点查看位置')

// ========== 行程路线 ==========
const routeStops = ref([])

// ========== 收藏行程 ==========
const favoritePlans = ref([])   // 从 localStorage 读取的收藏行程列表
const selectedPlan = ref(null)  // 当前选中的行程
// 每天路线使用不同颜色
const dayColors = ['#0D6B5C', '#D4A84B', '#C23B22', '#4ECDC4', '#6C5CE7', '#E17055', '#00B894', '#FDCB6E']

// ========== 路线编辑状态 ==========
const editingDayIdx = ref(-1)   // 当前正在编辑哪一天（-1 表示无）
const newSpotName = ref('')     // 新景点的名称输入
const addSpotInsertIndex = ref(0) // 新景点插入位置

// ========== 路线调整 ==========
const strategy = ref('')
const optimizeOrder = ref(false)
const planning = ref(false)
const routeResult = ref(null)
const strategies = [
  { key: 'time', label: '时间优先', icon: '⏱' },
  { key: 'distance', label: '路程优先', icon: '📏' },
  { key: 'smooth', label: '顺利优先', icon: '🛤' },
  { key: 'cost', label: '费用优先', icon: '💰' },
]

// ========== 保存路线 ==========
const savedRoutes = computed(() => routeStore.routes)
const showSavedRoutes2 = ref(false)

// ========== 初始化：加载收藏行程 ==========
loadFavoritePlans()
async function loadFavoritePlans() {
  if (!authStore.currentUser) {
    favoritePlans.value = []
    return
  }
  const result = await planStore.loadPlans()
  if (result.ok) {
    // 将后端行程转换为组件需要的格式
    favoritePlans.value = planStore.plans
      .filter(p => p.content_json && p.content_json.daysList)
      .map(p => ({
        id: p.id,
        name: p.title || `${p.days}天行程`,
        plan: p.content_json,
        preference_text: p.preference_text || '',
        input_text: p.input_text || '',
        input_images: p.input_images || null,
        style: p.style || '',
        people: p.people || '',
        budget: p.budget || '',
        start_date: p.start_date || null
      }))
  } else {
    console.error('加载收藏行程失败:', result.msg)
  }
}

onMounted(() => {
  loadFavoritePlans()
})

// ========== 景点数据库 ==========
const allSpots = [
  { name: '张家界', province: '湖南', lat: 29.13, lng: 110.45, rating: 4.9, price: 880, tag: '小众秘境', category: 'nature', image: '/images/landmarks/张家界.jpg', desc: '世界自然遗产，阿凡达取景地' },
  { name: '九寨沟', province: '阿坝', lat: 33.25, lng: 103.92, rating: 4.9, price: 900, tag: '全年可游', category: 'nature', image: '/images/landmarks/九寨沟.jpg', desc: '九寨归来不看水' },
  { name: '黄山', province: '安徽', lat: 30.13, lng: 118.16, rating: 4.8, price: 650, tag: '全年可游', category: 'nature', image: '/images/landmarks/黄山.jpg', desc: '黄山归来不看岳' },
  { name: '桂林漓江', province: '广西', lat: 24.89, lng: 110.31, rating: 4.8, price: 600, tag: '全年可游', category: 'nature', image: '/images/landmarks/桂林.jpg', desc: '桂林山水甲天下' },
  { name: '北海银滩', province: '广西', lat: 21.40, lng: 109.12, rating: 4.7, price: 0, tag: '热门景点', category: 'nature', image: '/images/landmarks/北海.jpg', desc: '天下第一滩' },
  { name: '涠洲岛', province: '广西', lat: 21.04, lng: 109.13, rating: 4.7, price: 110, tag: '热门景点', category: 'nature', image: '/images/landmarks/涠洲岛.jpg', desc: '中国最大火山岛' },
  { name: '鳄鱼山火山公园', province: '广西', lat: 21.03, lng: 109.13, rating: 4.6, price: 98, tag: '热门景点', category: 'nature', image: '/images/landmarks/涠洲岛.jpg', desc: '涠洲岛核心景区' },
  { name: '北海老城', province: '广西', lat: 21.48, lng: 109.12, rating: 4.5, price: 0, tag: '热门景点', category: 'culture', image: '/images/landmarks/北海.jpg', desc: '百年老街' },
  { name: '滴水丹屏', province: '广西', lat: 21.04, lng: 109.13, rating: 4.6, price: 0, tag: '热门景点', category: 'nature', image: '/images/landmarks/涠洲岛.jpg', desc: '涠洲岛看日落最佳处' },
  { name: '涠洲岛天主教堂', province: '广西', lat: 21.04, lng: 109.13, rating: 4.5, price: 20, tag: '热门景点', category: 'culture', image: '/images/landmarks/涠洲岛.jpg', desc: '百年法式教堂' },
  { name: '贝壳沙滩', province: '广西', lat: 21.05, lng: 109.14, rating: 4.5, price: 0, tag: '热门景点', category: 'nature', image: '/images/landmarks/涠洲岛.jpg', desc: '涠洲岛最美沙滩' },
  { name: '稻城亚丁', province: '甘孜', lat: 28.29, lng: 100.06, rating: 4.6, price: 900, tag: '小众秘境', category: 'nature', image: '/images/landmarks/稻城亚丁.jpg', desc: '蓝色星球上最后一片净土' },
  { name: '青海湖', province: '青海', lat: 36.60, lng: 100.47, rating: 4.8, price: 1500, tag: '全年可游', category: 'nature', image: '/images/landmarks/青海湖.jpg', desc: '中国最大内陆湖' },
  { name: '茶卡盐湖', province: '青海', lat: 36.69, lng: 99.09, rating: 4.9, price: 1500, tag: '全年可游', category: 'nature', image: '/images/landmarks/茶卡盐湖.jpg', desc: '天空之镜' },
  { name: '纳木错', province: '西藏', lat: 30.49, lng: 90.99, rating: 4.7, price: 2800, tag: '小众秘境', category: 'nature', image: '/images/landmarks/纳木错.jpg', desc: '天湖纳木错' },
  { name: '长白山', province: '吉林', lat: 41.70, lng: 128.18, rating: 4.7, price: 800, tag: '全年可游', category: 'nature', image: '/images/landmarks/长白山.jpg', desc: '东北第一高峰' },
  { name: '峨眉山', province: '四川', lat: 29.53, lng: 103.34, rating: 4.6, price: 700, tag: '全年可游', category: 'nature', image: '/images/landmarks/峨眉山.jpg', desc: '峨眉天下秀' },
  { name: '武夷山', province: '福建', lat: 27.72, lng: 117.93, rating: 4.5, price: 600, tag: '全年可游', category: 'nature', image: '/images/landmarks/武夷山.jpg', desc: '九曲溪竹筏漂流' },
  { name: '庐山', province: '江西', lat: 29.58, lng: 115.97, rating: 4.5, price: 500, tag: '全年可游', category: 'nature', image: '/images/landmarks/庐山.jpg', desc: '不识庐山真面目' },
  { name: '故宫', province: '北京', lat: 39.92, lng: 116.40, rating: 4.9, price: 60, tag: '热门景点', category: 'culture', image: '/images/landmarks/故宫.jpg', desc: '世界最大宫殿建筑群' },
  { name: '兵马俑', province: '陕西', lat: 34.38, lng: 109.28, rating: 4.9, price: 120, tag: '热门景点', category: 'culture', image: '/images/landmarks/秦始皇兵马俑.jpg', desc: '世界第八大奇迹' },
  { name: '平遥古城', province: '山西', lat: 37.20, lng: 112.48, rating: 4.7, price: 125, tag: '热门景点', category: 'culture', image: '/images/landmarks/平遥古城.jpg', desc: '保存最完整的古代县城' },
  { name: '苏州园林', province: '江苏', lat: 31.32, lng: 120.62, rating: 4.8, price: 80, tag: '全年可游', category: 'culture', image: '/images/landmarks/苏州园林.jpg', desc: '江南园林甲天下' },
  { name: '布达拉宫', province: '西藏', lat: 29.65, lng: 91.14, rating: 4.9, price: 200, tag: '热门景点', category: 'culture', image: '/images/landmarks/布达拉宫.jpg', desc: '世界屋脊上的宫殿' },
  { name: '敦煌莫高窟', province: '甘肃', lat: 40.14, lng: 94.66, rating: 4.9, price: 238, tag: '小众秘境', category: 'culture', image: '/images/landmarks/莫高窟.jpg', desc: '千年壁画艺术宝库' },
  { name: '西安城墙', province: '陕西', lat: 34.26, lng: 108.94, rating: 4.7, price: 54, tag: '热门景点', category: 'culture', image: '/images/landmarks/西安城墙.jpg', desc: '中国最完整古城墙' },
  { name: '成都宽窄巷子', province: '四川', lat: 30.67, lng: 104.06, rating: 4.5, price: 0, tag: '热门景点', category: 'food', image: '/images/landmarks/宽窄巷子.jpg', desc: '老成都生活缩影' },
  { name: '西安回民街', province: '陕西', lat: 34.27, lng: 108.95, rating: 4.4, price: 0, tag: '热门景点', category: 'food', image: '/images/landmarks/回民街.jpg', desc: '肉夹馍羊肉泡馍' },
  { name: '广州上下九', province: '广东', lat: 23.12, lng: 113.25, rating: 4.3, price: 0, tag: '热门景点', category: 'food', image: '/images/landmarks/上下九.jpg', desc: '早茶点心一条龙' },
  { name: '厦门中山路', province: '福建', lat: 24.45, lng: 118.08, rating: 4.4, price: 0, tag: '热门景点', category: 'food', image: '/images/landmarks/中山路.jpg', desc: '闽南小吃荟萃' },
  { name: '长沙坡子街', province: '湖南', lat: 28.20, lng: 112.98, rating: 4.5, price: 0, tag: '热门景点', category: 'food', image: '/images/landmarks/坡子街.jpg', desc: '湘菜美食一条街' },
  { name: '四姑娘山', province: '四川', lat: 31.05, lng: 102.82, rating: 4.6, price: 700, tag: '小众秘境', category: 'adventure', image: '/images/landmarks/四姑娘山.jpg', desc: '东方阿尔卑斯' },
  { name: '虎跳峡', province: '云南', lat: 27.18, lng: 100.11, rating: 4.7, price: 65, tag: '小众秘境', category: 'adventure', image: '/images/landmarks/虎跳峡.jpg', desc: '世界最深峡谷之一' },
  { name: '鸣沙山月牙泉', province: '甘肃', lat: 40.53, lng: 94.66, rating: 4.6, price: 110, tag: '小众秘境', category: 'adventure', image: '/images/landmarks/鸣沙山.jpg', desc: '大漠中的绿洲奇迹' },
  { name: '喀纳斯', province: '新疆', lat: 48.81, lng: 86.05, rating: 4.8, price: 160, tag: '小众秘境', category: 'adventure', image: '/images/landmarks/喀纳斯.jpg', desc: '上帝的后花园' },
  { name: '张掖丹霞', province: '甘肃', lat: 38.93, lng: 100.08, rating: 4.7, price: 75, tag: '小众秘境', category: 'adventure', image: '/images/landmarks/张掖丹霞.jpg', desc: '大自然的调色板' },
  { name: '漠河北极村', province: '黑龙江', lat: 53.49, lng: 122.54, rating: 4.5, price: 600, tag: '小众秘境', category: 'adventure', image: '/images/landmarks/漠河.jpg', desc: '中国最北端' },
  { name: '大昭寺', province: '西藏', lat: 29.65, lng: 91.13, rating: 4.9, price: 85, tag: '热门景点', category: 'temple', image: '/images/landmarks/大昭寺.jpg', desc: '藏传佛教最神圣的寺庙' },
  { name: '灵隐寺', province: '浙江', lat: 30.24, lng: 120.10, rating: 4.6, price: 75, tag: '热门景点', category: 'temple', image: '/images/landmarks/灵隐寺.jpg', desc: '江南名刹' },
  { name: '少林寺', province: '河南', lat: 34.51, lng: 112.94, rating: 4.5, price: 80, tag: '热门景点', category: 'temple', image: '/images/landmarks/少林寺.jpg', desc: '天下武功出少林' },
  { name: '五台山', province: '山西', lat: 38.71, lng: 113.56, rating: 4.7, price: 135, tag: '热门景点', category: 'temple', image: '/images/landmarks/五台山.jpg', desc: '四大佛教名山之首' },
  { name: '普陀山', province: '浙江', lat: 30.01, lng: 122.39, rating: 4.6, price: 160, tag: '热门景点', category: 'temple', image: '/images/landmarks/普陀山.jpg', desc: '海天佛国' },
  { name: '南普陀寺', province: '福建', lat: 24.44, lng: 118.09, rating: 4.5, price: 0, tag: '热门景点', category: 'temple', image: '/images/landmarks/南普陀寺.jpg', desc: '闽南佛教胜地' },
]

// ========== 地图功能 ==========
function activateMap() {
  mapActive.value = true
  nextTick(async () => {
    await initMap()
    await renderRoute()
  })
}

function configureAMapSecurity() {
  const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_CODE
  if (securityJsCode && typeof window !== 'undefined') {
    window._AMapSecurityConfig = { securityJsCode }
  }
}

async function initMap() {
  if (!mapEl.value || amapInstance) return
  
  // 加载高德地图
  configureAMapSecurity()
  const AMap = await AMapLoader.load({
    key: import.meta.env.VITE_AMAP_KEY || '',
    securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE || undefined,
    version: '2.0',
    plugins: ['AMap.ToolBar', 'AMap.Scale', 'AMap.DistrictSearch', 'AMap.Driving']
  })

  // 初始化地图实例
  amapInstance = new AMap.Map(mapEl.value, {
    zoom: 4,
    center: [104.5, 35],
    mapStyle: 'amap://styles/blank',
    resizeEnable: true,
    showLabel: true,
    suppressMapPluginBlock: true
  })

  // 添加图层叠加层（与首页一致）
  amapInstance.once('complete', () => {
    const tileLayer = new AMap.TileLayer({ opacity: 0.3 })
    tileLayer.setMap(amapInstance)
  })

  // 添加缩放工具
  amapInstance.add(new AMap.ToolBar())
  // 添加比例尺
  amapInstance.add(new AMap.Scale())

  // 添加省份名称标签（与首页一致）
  const district = new AMap.DistrictSearch({ extensions: 'all', level: 'province' })
  district.search('中国', (status, result) => {
    const allProvinces = result.districtList[0]?.subDistricts?.districtList || []
    allProvinces.forEach((province) => {
      const center = province.center
      if (center && province.name) {
        const textMarker = new AMap.Text({
          text: province.name,
          anchor: 'center',
          style: {
            'background-color': 'transparent',
            'border': 'none',
            'color': '#1A1A2E',
            'font-size': '13px',
            'font-weight': '600',
            'font-family': '"Noto Sans SC", sans-serif',
            'text-shadow': '0 0 4px rgba(255,255,255,0.9)'
          },
          center
        })
        amapInstance.add(textMarker)
      }
    })
  })

  // 隐藏高德地图 logo
  const hideLogo = () => {
    const style = document.createElement('style')
    style.textContent = `
      .amap-logo, .amap-copyright, .aui-page-header,
      .aui-bar-top, .aui-bar-bottom, .aui-bar-center,
      .AMapLogo, .amap-controlcontainer + img,
      [class*="amap-logo"], [class*="amap-copyright"],
      [class*="aui-bar"] {
        display: none !important;
        visibility: hidden !important;
      }
    `
    document.head.appendChild(style)
  }
  hideLogo()
  setTimeout(hideLogo, 3000)

  // ResizeObserver 监听容器尺寸变化
  if (window.ResizeObserver && mapEl.value) {
    const ro = new ResizeObserver(() => amapInstance?.resize())
    ro.observe(mapEl.value)
    onBeforeUnmount(() => ro.disconnect())
  }
}

// 解析景点坐标。没有真实坐标时不再随机放置，否则无法保证路线是真实路线。
function resolveRouteSpot(spot) {
  const spotName = typeof spot === 'string' ? spot.trim() : String(spot?.name || '').trim()
  if (!spotName) return null

  const lat = Number(spot?.lat)
  const lng = Number(spot?.lng)
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
    return { name: spotName, lat, lng }
  }

  const spotData = allSpots.find(s => s.name === spotName)
    || allSpots.find(s => spotName.includes(s.name) || s.name.includes(spotName))
  return spotData ? { name: spotData.name, lat: spotData.lat, lng: spotData.lng } : null
}

function createDayMarker(AMap, spot, dayIdx, spotIdx) {
  const color = dayColors[dayIdx % dayColors.length]
  const el = document.createElement('div')
  el.style.cssText = `
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; color: #fff;
    background: ${color}; box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    border: 2.5px solid #fff; cursor: pointer;
  `
  el.textContent = String(spotIdx + 1)
  el.title = `Day ${dayIdx + 1} · ${spotIdx + 1}. ${spot.name}`
  el.setAttribute('aria-label', `Day ${dayIdx + 1} 第${spotIdx + 1}个景点：${spot.name}`)
  return new AMap.Marker({
    content: el,
    anchor: 'center',
    position: [spot.lng, spot.lat],
    title: `Day ${dayIdx + 1} · ${spotIdx + 1}. ${spot.name}`,
    extData: { dayIndex: dayIdx, spotIndex: spotIdx, name: spot.name },
    map: amapInstance
  })
}

async function requestDrivingRoute(spots, policy) {
  const points = spots.map(spot => ({ lng: spot.lng, lat: spot.lat }))
  const { data } = await apiClient.post('/map/driving', {
    origin: points[0],
    destination: points[points.length - 1],
    waypoints: points.slice(1, -1),
    strategy: policy
  })
  if (!data?.data?.path?.length) throw new Error('后端未返回有效路线轨迹')
  return data.data
}

async function geocodeSpot(name) {
  const localSpot = resolveRouteSpot({ name, lat: null, lng: null })
  if (localSpot) return localSpot

  const city = typeof selectedPlan.value?.plan?.city === 'string' ? selectedPlan.value.plan.city : ''
  const { data } = await apiClient.post('/map/geocode', { address: name, city })
  const point = data?.data
  if (!point || !Number.isFinite(Number(point.lat)) || !Number.isFinite(Number(point.lng))) {
    throw new Error(`无法定位景点“${name}”`)
  }
  return { name, lat: Number(point.lat), lng: Number(point.lng), location: point.formatted_address || '' }
}

// 使用高德驾车规划返回的道路轨迹，按天绘制不同颜色的真实路线。
async function renderRoute() {
  if (!amapInstance) return
  const requestId = ++routeRequestId
  dayPolylines.forEach(p => amapInstance.remove(p)); dayPolylines = []
  dayMarkers.forEach(m => amapInstance.remove(m)); dayMarkers = []

  if (!selectedPlan.value || !selectedPlan.value.plan?.daysList) return

  configureAMapSecurity()
  const AMap = await AMapLoader.load({
    key: import.meta.env.VITE_AMAP_KEY || '',
    securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE || undefined,
    version: '2.0',
    plugins: ['AMap.Driving']
  })
  // 高德驾车策略：速度优先、费用优先、距离优先、躲避拥堵。
  const policyMap = { time: 0, cost: 1, distance: 2, smooth: 4 }
  const policy = policyMap[strategy.value] ?? 0
  const daysList = selectedPlan.value.plan.daysList
  const planId = selectedPlan.value.id || selectedPlan.value.plan?.id || selectedPlan.value.name || 'draft'
  let totalDistance = 0
  let totalTime = 0

  for (let dayIdx = 0; dayIdx < daysList.length; dayIdx++) {
    const day = daysList[dayIdx]
    const rawSpots = day.spots || []
    const spots = rawSpots.map(resolveRouteSpot)
    if (spots.some(spot => !spot)) {
      const unresolved = rawSpots.filter((spot, index) => !spots[index]).map(spot => typeof spot === 'string' ? spot : spot?.name).filter(Boolean)
      showToast(`Day ${dayIdx + 1} 有景点缺少坐标：${unresolved.join('、')}，请重新添加`, 'error')
      continue
    }
    spots.forEach((spot, spotIdx) => dayMarkers.push(createDayMarker(AMap, spot, dayIdx, spotIdx)))

    if (spots.length < 2) continue
    try {
      const cacheParams = {
        planId,
        dayIndex: dayIdx,
        strategy: strategy.value,
        spots
      }
      let route = getRouteCache(cacheParams)
      if (!route) {
        route = await requestDrivingRoute(spots, policy)
        setRouteCache(cacheParams, route)
      }
      if (requestId !== routeRequestId || !amapInstance) return
      const color = dayColors[dayIdx % dayColors.length]
      dayPolylines.push(new AMap.Polyline({
        path: route.path,
        strokeColor: color,
        strokeWeight: 5,
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
        lineJoin: 'round',
        lineCap: 'round',
        map: amapInstance
      }))
      totalDistance += route.distance
      totalTime += route.time
    } catch (err) {
      showToast(`Day ${dayIdx + 1} 路线规划失败：${err.message}`, 'error')
    }
  }

  if (requestId === routeRequestId && (totalDistance > 0 || totalTime > 0)) {
    const minutes = Math.round(totalTime / 60)
    routeResult.value = {
      distance: Math.round(totalDistance / 1000),
      time: minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60}m` : `${minutes}min`
    }
  }
  if (requestId === routeRequestId) fitRouteView()
}

// 只适配当前行程的景点和真实路线，避免把省份文字等其他覆盖物纳入范围。
function fitRouteView() {
  if (!amapInstance || dayMarkers.length === 0) return
  const overlays = [...dayMarkers, ...dayPolylines]
  amapInstance.setFitView(overlays, false, [60, 60, 60, 60], 15)
}

// 适配当前路线范围
function fitAll() {
  fitRouteView()
}

// 重置视图到中国中心
function resetView() {
  if (amapInstance) amapInstance.setZoomAndCenter(4, [105, 35])
}

// ========== 景点交互 ==========
// 点击景点聚焦
function clickSpot(spot) {
  if (mapActive.value && amapInstance) {
    amapInstance.setZoomAndCenter(10, [spot.lng, spot.lat])
  }
  mapInfoText.value = spot.name + ' · ' + spot.province
}

function isInRoute(spot) { return routeStops.value.some(s => s.name === spot.name) }

function toggleRoute(spot) {
  const idx = routeStops.value.findIndex(s => s.name === spot.name)
  if (idx >= 0) {
    routeStops.value.splice(idx, 1)
  } else {
    if (routeStops.value.length >= 10) { showToast('路线最多包含 10 个景点', 'info'); return }
    routeStops.value.push({ ...spot })
  }
  routeResult.value = null
  if (mapActive.value) renderRoute()
}

// ========== 路线操作 ==========
function removeStop(idx) {
  routeStops.value.splice(idx, 1)
  routeResult.value = null
  if (mapActive.value) renderRoute()
}

function moveStop(idx, dir) {
  const nIdx = idx + dir
  if (nIdx < 0 || nIdx >= routeStops.value.length) return
  const arr = [...routeStops.value]
  ;[arr[idx], arr[nIdx]] = [arr[nIdx], arr[idx]]
  routeStops.value = arr
  routeResult.value = null
  if (mapActive.value) renderRoute()
}

function clearRoute() {
  selectedPlan.value = null
  routeStops.value = []
  routeResult.value = null
  editingDayIdx.value = -1
  newSpotName.value = ''
  // 清除地图上的路线
  if (amapInstance) {
    dayPolylines.forEach(p => amapInstance.remove(p)); dayPolylines = []
    dayMarkers.forEach(m => amapInstance.remove(m)); dayMarkers = []
  }
  mapInfoText.value = '点击景点查看位置'
  showToast('路线已清空', 'info')
}

// ========== 路线编辑：删除/添加景点 ==========
// 从指定天中删除一个景点
function removeSpotFromDay(dayIdx, spotIdx) {
  if (!selectedPlan.value?.plan?.daysList?.[dayIdx]) return
  const spots = selectedPlan.value.plan.daysList[dayIdx].spots
  if (!spots || spotIdx < 0 || spotIdx >= spots.length) return
  const removed = spots.splice(spotIdx, 1)
  showToast(`已删除：${typeof removed[0] === 'string' ? removed[0] : removed[0]?.name}`, 'info')
  // 立即重新渲染地图
  if (amapInstance) {
    renderRoute()
  }
}

// 调整同一天内景点的顺序
function moveSpotInDay(dayIdx, spotIdx, direction) {
  const day = selectedPlan.value?.plan?.daysList?.[dayIdx]
  if (!day?.spots || spotIdx < 0 || spotIdx >= day.spots.length) return
  const targetIdx = spotIdx + direction
  if (targetIdx < 0 || targetIdx >= day.spots.length) return
  const spots = [...day.spots]
  ;[spots[spotIdx], spots[targetIdx]] = [spots[targetIdx], spots[spotIdx]]
  day.spots = spots
  routeResult.value = null
  showToast(`已调整为第${targetIdx + 1}个途经点`, 'success')
  if (amapInstance) renderRoute()
}

// 开始添加景点（打开输入框）
function startAddSpot(dayIdx) {
  editingDayIdx.value = dayIdx
  newSpotName.value = ''
  addSpotInsertIndex.value = selectedPlan.value?.plan?.daysList?.[dayIdx]?.spots?.length || 0
}

// 取消添加
function cancelAddSpot() {
  editingDayIdx.value = -1
  newSpotName.value = ''
  addSpotInsertIndex.value = 0
}

// 确认添加景点到指定天
async function addSpotToDay(dayIdx) {
  const name = newSpotName.value.trim()
  if (!name) {
    showToast('请输入景点名称', 'info')
    return
  }
  if (!selectedPlan.value?.plan?.daysList?.[dayIdx]) return
  if (!selectedPlan.value.plan.daysList[dayIdx].spots) {
    selectedPlan.value.plan.daysList[dayIdx].spots = []
  }
  let resolvedSpot
  try {
    resolvedSpot = await geocodeSpot(name)
  } catch (err) {
    showToast(err.message || '景点定位失败，请检查景点名称', 'error')
    return
  }
  const spots = selectedPlan.value.plan.daysList[dayIdx].spots
  const insertIndex = Math.max(0, Math.min(Number(addSpotInsertIndex.value), spots.length))
  spots.splice(insertIndex, 0, resolvedSpot)
  showToast(`已添加：${name}（第${insertIndex + 1}个途经点，点击"重新规划"生成位置）`, 'success')
  // 关闭输入框
  cancelAddSpot()
  routeResult.value = null
  // 立即重新渲染地图
  if (amapInstance) {
    renderRoute()
  }
}

// Haversine 距离
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// 规划路线
async function planRoute() {
  if (planning.value || routeStops.value.length < 2) return
  planning.value = true
  try {
    // 如果勾选智能优化，先调用 AI
    if (optimizeOrder.value && routeStops.value.length >= 3) {
      const names = routeStops.value.map(s => s.name)
      const messages = [
        { role: 'system', content: '你是资深旅行路线规划师。根据景点名称推断地理位置，优化访问顺序。仅输出JSON。' },
        { role: 'user', content: `景点：${names.map((n, i) => `${i}.${n}`).join('、')}\n返回 {"order":[索引数组],"reason":"说明"}` }
      ]
      const data = await chat(messages, { temperature: 0.3, maxTokens: 512 })
      const content = data?.choices?.[0]?.message?.content || ''
      const m = content.match(/\{[\s\S]*\}/)
      if (m) {
        const result = JSON.parse(m[0])
        if (Array.isArray(result.order) && result.order.length === names.length) {
          const sorted = [...result.order].sort((a, b) => a - b)
          let valid = true
          for (let i = 0; i < sorted.length; i++) if (sorted[i] !== i) { valid = false; break }
          if (valid) {
            routeStops.value = result.order.map(i => routeStops.value[i])
            showToast(`路线已优化${result.reason ? '：' + result.reason : ''}`, 'success')
          }
        }
      }
    }
    // 计算距离和时间
    let totalDist = 0
    for (let i = 0; i < routeStops.value.length - 1; i++) {
      const a = routeStops.value[i]; const b = routeStops.value[i + 1]
      totalDist += haversine(a.lat, a.lng, b.lat, b.lng) * 1.4
    }
    const dist = Math.round(totalDist)
    // 根据策略调整时间估算
    const speedMap = { time: 90, distance: 80, smooth: 70, cost: 60 }
    const speed = speedMap[strategy.value] || 80
    const hours = dist / speed; const h = Math.floor(hours); const min = Math.round((hours - h) * 60)
    const timeStr = h > 0 ? `${h}h${min}m` : `${min}min`
    routeResult.value = { distance: dist, time: timeStr }
    if (mapActive.value) await renderRoute()
  } catch (err) {
    showToast('规划失败：' + err.message, 'error')
  } finally {
    planning.value = false
  }
}

// ========== 保存路线 ==========
async function saveRoute() {
  const daysList = selectedPlan.value?.plan?.daysList || []
  const savedDays = daysList.map((day, dayIdx) => ({
    ...day,
    day: day.day || dayIdx + 1,
    spots: (day.spots || []).map(spot => typeof spot === 'string' ? { name: spot, lat: null, lng: null } : {
      name: spot.name,
      lat: spot.lat == null || spot.lat === '' ? null : (Number.isFinite(Number(spot.lat)) ? Number(spot.lat) : null),
      lng: spot.lng == null || spot.lng === '' ? null : (Number.isFinite(Number(spot.lng)) ? Number(spot.lng) : null),
      location: spot.location || ''
    })
  }))
  const savedStops = savedDays.flatMap(day => day.spots)
  if (savedStops.length < 2) {
    showToast('至少需要两个途经点才能保存路线', 'warn')
    return
  }
  if (!authStore.currentUser) {
    showToast('请先登录后再保存路线', 'warn')
    return
  }
  let totalDist = 0
  for (const day of savedDays) {
    for (let i = 0; i < day.spots.length - 1; i++) {
      const a = day.spots[i]; const b = day.spots[i + 1]
      if (Number.isFinite(a.lat) && Number.isFinite(a.lng) && Number.isFinite(b.lat) && Number.isFinite(b.lng)) {
        totalDist += haversine(a.lat, a.lng, b.lat, b.lng) * 1.4
      }
    }
  }
  const title = `${selectedPlan.value.name} · ${strategies.find(s => s.key === strategy.value)?.label || '自定义顺序'}`
  const result = await routeStore.saveRoute({
    plan_id: selectedPlan.value.id || null,
    title,
    strategy: strategy.value,
    days_json: {
      name: selectedPlan.value.name,
      daysList: savedDays,
      stops: savedStops,
      distance: Math.round(totalDist)
    }
  })
  if (result.ok) {
    // 同步更新原始行程，避免重新进入“行程路线”时重新加载旧的景点顺序。
    let planUpdate = { ok: true }
    if (selectedPlan.value.id) {
      const updatedPlan = {
        ...selectedPlan.value.plan,
        days: savedDays.length,
        daysList: savedDays
      }
      planUpdate = await planStore.updatePlan(selectedPlan.value.id, {
        title: selectedPlan.value.name,
        preference_text: selectedPlan.value.preference_text,
        content_json: updatedPlan,
        input_text: selectedPlan.value.input_text,
        input_images: selectedPlan.value.input_images,
        style: selectedPlan.value.style,
        people: selectedPlan.value.people,
        budget: selectedPlan.value.budget,
        start_date: selectedPlan.value.start_date,
        days: savedDays.length
      })
      if (planUpdate.ok) {
        selectedPlan.value.plan = updatedPlan
        const favorite = favoritePlans.value.find(plan => plan.id === selectedPlan.value.id)
        if (favorite) favorite.plan = updatedPlan
      }
    }
    if (planUpdate.ok) {
      showToast('路线和行程顺序已保存', 'success')
    } else {
      showToast(`路线已保存，但行程同步失败：${planUpdate.msg}`, 'error')
    }
  } else {
    showToast(result.msg || '保存失败', 'error')
  }
}

function loadSavedRoute(sr) {
  const stops = sr.days_json?.stops || sr.stops || []
  routeStops.value = stops.map(s => ({ name: s.name, lat: s.lat, lng: s.lng }))
  panelMode.value = 'route'
  routeResult.value = null
  if (mapActive.value) renderRoute()
  showSavedRoutes.value = false
  showSavedRoutes2.value = false
}

async function deleteSavedRoute(id) {
  await routeStore.removeRoute(id)
}

// ========== 选择行程 ==========
async function selectPlan(fp) {
  selectedPlan.value = fp
  strategy.value = ''
  panelMode.value = 'single'
  showToast(`已选择：${fp.name}`, 'success')
}

// 兼容历史上已保存但没有经纬度的景点，重新规划前补齐坐标。
async function ensurePlanCoordinates() {
  const daysList = selectedPlan.value?.plan?.daysList || []
  for (let dayIdx = 0; dayIdx < daysList.length; dayIdx++) {
    const spots = daysList[dayIdx].spots || []
    for (let spotIdx = 0; spotIdx < spots.length; spotIdx++) {
      const spot = spots[spotIdx]
      const name = typeof spot === 'string' ? spot.trim() : String(spot?.name || '').trim()
      if (!name) continue
      const resolved = resolveRouteSpot(spot)
      if (resolved) {
        if (typeof spot === 'string' || spot.lat == null || spot.lng == null) {
          spots[spotIdx] = { ...(typeof spot === 'string' ? {} : spot), ...resolved }
        }
        continue
      }
      try {
        spots[spotIdx] = await geocodeSpot(name)
      } catch (err) {
        throw new Error(`Day ${dayIdx + 1} 的“${name}”无法定位，请修改景点名称后重试`)
      }
    }
  }
}

// ========== 从选中行程生成路线 ==========
async function generateRouteFromPlan() {
  if (!selectedPlan.value || planning.value) return
  if (!strategy.value) {
    showToast('请先选择路线规划偏好', 'warn')
    return
  }
  planning.value = true
  try {
    await ensurePlanCoordinates()

    // 激活地图
    mapActive.value = true
    await nextTick()
    await initMap()

    // 等待地图容器完成布局后，等待真实路线返回，再按路线覆盖物适配视野
    await new Promise(resolve => setTimeout(resolve, 500))
    await renderRoute()
    if (amapInstance && dayMarkers.length > 0) {
      fitRouteView()
    }
    // 更新底部信息栏
    const days = selectedPlan.value.plan?.daysList?.length || 0
    const totalSpots = selectedPlan.value.plan?.daysList?.reduce((sum, d) => sum + (d.spots?.length || 0), 0) || 0
    mapInfoText.value = `${days}天行程 · ${totalSpots}个景点`
  } catch (err) {
    showToast(err.message || '路线规划失败', 'error')
  }
  planning.value = false
}

// 从标题中提取省份名称（支持城市名映射到省份）
function extractProvinceFromTitle(title) {
  // 城市到省份的映射（包含知名景点对应的城市）
  const cityToProvince = {
    '北京': '北京', '天津': '天津', '上海': '上海', '重庆': '重庆',
    // 广西
    '北海': '广西', '涠洲岛': '广西', '桂林': '广西', '阳朔': '广西', '南宁': '广西',
    // 四川
    '成都': '四川', '绵阳': '四川', '德阳': '四川', '乐山': '四川', '峨眉山': '四川',
    '九寨沟': '四川', '黄龙': '四川', '稻城': '四川', '亚丁': '四川', '都江堰': '四川',
    '四姑娘山': '四川', '海螺沟': '四川', '青城山': '四川',
    // 云南
    '昆明': '云南', '大理': '云南', '丽江': '云南', '香格里拉': '云南', '西双版纳': '云南',
    '泸沽湖': '云南', '玉龙雪山': '云南', '虎跳峡': '云南', '普达措': '云南',
    // 贵州
    '贵阳': '贵州', '遵义': '贵州', '安顺': '贵州', '黄果树': '贵州', '荔波': '贵州', '镇远': '贵州',
    // 广东
    '广州': '广东', '深圳': '广东', '珠海': '广东', '佛山': '广东', '东莞': '广东',
    '中山': '广东', '惠州': '广东', '汕头': '广东', '潮州': '广东', '南澳岛': '广东',
    // 浙江
    '杭州': '浙江', '宁波': '浙江', '温州': '浙江', '绍兴': '浙江', '嘉兴': '浙江',
    '舟山': '浙江', '普陀山': '浙江', '千岛湖': '浙江', '乌镇': '浙江', '西塘': '浙江',
    // 江苏
    '南京': '江苏', '苏州': '江苏', '无锡': '江苏', '常州': '江苏', '扬州': '江苏',
    '镇江': '江苏', '周庄': '江苏', '同里': '江苏', '连云港': '江苏',
    // 安徽
    '合肥': '安徽', '芜湖': '安徽', '黄山': '安徽', '宏村': '安徽', '西递': '安徽', '九华山': '安徽',
    // 福建
    '福州': '福建', '厦门': '福建', '泉州': '福建', '武夷山': '福建', '土楼': '福建', '霞浦': '福建',
    // 山东
    '济南': '山东', '青岛': '山东', '烟台': '山东', '泰安': '山东', '泰山': '山东', '曲阜': '山东', '威海': '山东',
    // 河南
    '郑州': '河南', '洛阳': '河南', '开封': '河南', '少林寺': '河南', '云台山': '河南', '龙门石窟': '河南',
    // 湖北
    '武汉': '湖北', '宜昌': '湖北', '恩施': '湖北', '神农架': '湖北', '武当山': '湖北', '三峡': '湖北',
    // 湖南
    '长沙': '湖南', '张家界': '湖南', '凤凰': '湖南', '衡阳': '湖南', '岳阳': '湖南', '韶山': '湖南',
    // 河北
    '石家庄': '河北', '保定': '河北', '承德': '河北', '秦皇岛': '河北', '北戴河': '河北', '山海关': '河北',
    // 山西
    '太原': '山西', '大同': '山西', '平遥': '山西', '五台山': '山西', '乔家大院': '山西', '云冈石窟': '山西',
    // 辽宁
    '沈阳': '辽宁', '大连': '辽宁', '丹东': '辽宁', '本溪': '辽宁', '鞍山': '辽宁',
    // 吉林
    '长春': '吉林', '吉林': '吉林', '延边': '吉林', '长白山': '吉林', '雾凇岛': '吉林', '集安': '吉林',
    // 黑龙江
    '哈尔滨': '黑龙江', '牡丹江': '黑龙江', '漠河': '黑龙江', '伊春': '黑龙江', '五大连池': '黑龙江', '雪乡': '黑龙江',
    // 陕西
    '西安': '陕西', '咸阳': '陕西', '延安': '陕西', '汉中': '陕西', '华山': '陕西', '宝鸡': '陕西', '兵马俑': '陕西',
    // 甘肃
    '兰州': '甘肃', '敦煌': '甘肃', '张掖': '甘肃', '嘉峪关': '甘肃', '莫高窟': '甘肃', '鸣沙山': '甘肃', '月牙泉': '甘肃',
    // 青海
    '西宁': '青海', '青海湖': '青海', '茶卡': '青海', '可可西里': '青海', '格尔木': '青海',
    // 西藏
    '拉萨': '西藏', '林芝': '西藏', '日喀则': '西藏', '纳木错': '西藏', '羊卓雍措': '西藏', '珠峰': '西藏',
    // 内蒙古
    '呼和浩特': '内蒙古', '呼伦贝尔': '内蒙古', '鄂尔多斯': '内蒙古', '锡林郭勒': '内蒙古', '额济纳': '内蒙古', '阿尔山': '内蒙古',
    // 宁夏
    '银川': '宁夏', '中卫': '宁夏', '沙坡头': '宁夏',
    // 新疆
    '乌鲁木齐': '新疆', '喀什': '新疆', '伊犁': '新疆', '喀纳斯': '新疆', '吐鲁番': '新疆', '那拉提': '新疆', '赛里木湖': '新疆',
    // 海南
    '海口': '海南', '三亚': '海南', '万宁': '海南', '蜈支洲岛': '海南', '天涯海角': '海南', '分界洲岛': '海南',
    // 台湾
    '台北': '台湾', '高雄': '台湾', '花莲': '台湾', '垦丁': '台湾', '日月潭': '台湾', '阿里山': '台湾',
    // 香港 / 澳门
    '香港': '香港', '澳门': '澳门'
  }
  
  // 先直接匹配省份
  const provinceList = ['北京', '天津', '上海', '重庆', '河北', '山西', '辽宁', '吉林', '黑龙江', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '海南', '四川', '贵州', '云南', '陕西', '甘肃', '青海', '台湾', '内蒙古', '广西', '西藏', '宁夏', '新疆', '香港', '澳门']
  for (const p of provinceList) {
    if (title.includes(p)) return p
  }
  
  // 再尝试匹配城市名（优先匹配长的，避免"乐"被"乐山"截断）
  const sortedCities = Object.keys(cityToProvince).sort((a, b) => b.length - a.length)
  for (const city of sortedCities) {
    if (title.includes(city)) return cityToProvince[city]
  }
  
  return ''
}

// 获取省份中心坐标
function getProvinceCenter(province) {
  const centers = {
    '北京': { lat: 39.90, lng: 116.40 },
    '天津': { lat: 39.13, lng: 117.20 },
    '上海': { lat: 31.23, lng: 121.47 },
    '重庆': { lat: 29.56, lng: 106.55 },
    '河北': { lat: 38.04, lng: 114.51 },
    '山西': { lat: 37.87, lng: 112.55 },
    '辽宁': { lat: 41.80, lng: 123.43 },
    '吉林': { lat: 43.88, lng: 125.32 },
    '黑龙江': { lat: 45.80, lng: 126.53 },
    '江苏': { lat: 32.06, lng: 118.79 },
    '浙江': { lat: 30.27, lng: 120.15 },
    '安徽': { lat: 31.86, lng: 117.28 },
    '福建': { lat: 26.08, lng: 119.30 },
    '江西': { lat: 28.68, lng: 115.86 },
    '山东': { lat: 36.67, lng: 116.99 },
    '河南': { lat: 34.76, lng: 113.65 },
    '湖北': { lat: 30.58, lng: 114.29 },
    '湖南': { lat: 28.23, lng: 112.94 },
    '广东': { lat: 23.13, lng: 113.27 },
    '海南': { lat: 20.02, lng: 110.35 },
    '四川': { lat: 30.57, lng: 104.07 },
    '贵州': { lat: 26.65, lng: 106.63 },
    '云南': { lat: 25.04, lng: 102.68 },
    '陕西': { lat: 34.26, lng: 108.94 },
    '甘肃': { lat: 36.06, lng: 103.83 },
    '青海': { lat: 36.62, lng: 101.78 },
    '台湾': { lat: 25.03, lng: 121.56 },
    '内蒙古': { lat: 40.84, lng: 111.75 },
    '广西': { lat: 22.82, lng: 108.37 },
    '西藏': { lat: 29.65, lng: 91.13 },
    '宁夏': { lat: 38.49, lng: 106.23 },
    '新疆': { lat: 43.83, lng: 87.62 },
    '香港': { lat: 22.30, lng: 114.17 },
    '澳门': { lat: 22.20, lng: 113.55 }
  }
  return centers[province] || null
}

// ========== 外部地图 ==========
function openExternalMap() {
  if (routeStops.value.length >= 2) {
    const o = routeStops.value[0]; const d = routeStops.value[routeStops.value.length - 1]
    const via = routeStops.value.slice(1, -1).map(s => `${s.lng},${s.lat}`).join('|')
    window.open(`https://uri.amap.com/path?from=${o.lng},${o.lat}&to=${d.lng},${d.lat}&via=${via}&mode=car`, '_blank')
  } else {
    window.open('https://uri.amap.com/map?position=116.397,39.909&name=北京&callnative=1', '_blank')
  }
}

// ========== Toast ==========
const toast = ref({ visible: false, message: '', type: 'info' })
let toastTimer = null
function showToast(message, type = 'info') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { visible: true, message, type }
  toastTimer = setTimeout(() => { toast.value.visible = false }, 3000)
}

onBeforeUnmount(() => {
  // 销毁高德地图实例
  if (amapInstance) { amapInstance.destroy(); amapInstance = null }
  if (toastTimer) clearTimeout(toastTimer)
  dayPolylines = []
  dayMarkers = []
})
</script>

<style scoped>
/* ===== 页面容器（与其他页面保持一致） ===== */
.routes-page { width: 100%; padding-top: 24px; }
.routes-page > .page-hero { width: min(1220px, calc(100% - 48px)); margin: 0 auto 24px; }
.navigate-layout {
  max-width: 1400px; width: 70%; margin: 0 auto;
  padding: 24px 24px 40px;
  display: flex; gap: 20px;
  /* 内容区最小高度，避免地图区域塌陷 */
  min-height: calc(100vh - 64px - 64px);
}

/* ===== 左侧面板 ===== */
.nav-panel {
  width: 380px; flex-shrink: 0; background: #fff;
  border-right: 1px solid #E5E0D6; display: flex; flex-direction: column;
  overflow: hidden; z-index: 10;
  box-shadow: 4px 0 20px rgba(26,58,42,0.08);
}
.nav-panel-header { padding: 20px 20px 0; border-bottom: 1px solid #E5E0D6; }
.nav-title {
  font-size: 1.2rem; font-weight: 600; color: #1A3A2A;
  margin: 0 0 12px; display: flex; align-items: center; gap: 8px;
}

/* 模式 Tab */
.mode-tabs { display: flex; gap: 4px; margin-bottom: 16px; }
.mode-tab {
  flex: 1; padding: 8px 4px; border-radius: 6px; font-size: 0.78rem; font-weight: 500;
  border: 1.5px solid #E5E0D6; background: transparent; color: #8B8B9E;
  cursor: pointer; transition: all 0.2s; font-family: 'Noto Sans SC', sans-serif;
  display: flex; align-items: center; justify-content: center; gap: 4px;
}
.mode-tab:hover { border-color: #0D6B5C; color: #0D6B5C; }
.mode-tab.active { border-color: #0D6B5C; background: #0D6B5C; color: #fff; }

/* 面板主体 */
.panel-body {
  padding: 16px 20px; display: flex; flex-direction: column; gap: 12px;
  flex: 1; overflow-y: auto;
}
.panel-hint { font-size: 0.88rem; color: #8B8B9E; margin: 0; line-height: 1.5; }

/* 通用按钮 */
.btn-primary-full {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 10px; border-radius: 6px; border: none;
  background: #0D6B5C; color: #fff; font-size: 0.88rem; font-weight: 500;
  cursor: pointer; transition: opacity 0.2s; font-family: 'Noto Sans SC', sans-serif;
}
.btn-primary-full:hover { opacity: 0.9; }
.btn-outline-full {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 10px; border-radius: 6px;
  border: 1.5px solid #E5E0D6; background: transparent; color: #0D6B5C;
  font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s;
  font-family: 'Noto Sans SC', sans-serif;
}
.btn-outline-full:hover { background: rgba(13,107,92,0.06); }

/* 收藏行程列表 */
.fav-plan-list { display: flex; flex-direction: column; gap: 8px; }
.fav-plan-item {
  display: flex; align-items: center; gap: 10px;
  padding: 12px; border-radius: 8px; background: #F8F6F0;
  cursor: pointer; transition: all 0.2s; border: 1.5px solid transparent;
}
.fav-plan-item:hover { border-color: #0D6B5C; background: rgba(13,107,92,0.04); }
.fp-color {
  width: 6px; height: 36px; border-radius: 3px; flex-shrink: 0;
}
.fp-info { flex: 1; display: flex; flex-direction: column; gap: 3px; overflow: hidden; }
.fp-name { font-size: 13px; font-weight: 600; color: #1A1A2E; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fp-meta { font-size: 11px; color: #8B8B9E; }

/* 按天展示行程 */
.day-list { display: flex; flex-direction: column; gap: 12px; }
.plan-header { display: flex; flex-direction: column; gap: 2px; padding-bottom: 8px; border-bottom: 1px solid #E5E0D6; }
.plan-title { font-size: 14px; font-weight: 600; color: #1A1A2E; }
.plan-meta { font-size: 12px; color: #8B8B9E; }
.day-group { display: flex; flex-direction: column; gap: 6px; }
.day-header { display: flex; align-items: center; gap: 8px; }
.day-tag {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: #fff;
}
.day-title { font-size: 13px; font-weight: 500; color: #1A1A2E; }
.day-spots { display: flex; flex-direction: column; gap: 4px; padding-left: 12px; border-left: 2px solid #E5E0D6; margin-left: 18px; }
.day-spot { display: flex; align-items: center; gap: 6px; }
.ds-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.day-spot-order {
  width: 16px; height: 16px; border-radius: 50%; flex: 0 0 16px;
  display: inline-flex; align-items: center; justify-content: center;
  background: #F2EFE7; color: #8B8B9E; font-size: 10px;
}
.ds-name { font-size: 12px; color: #5C5C6E; flex: 1; }
.day-spot-actions { display: flex; align-items: center; gap: 2px; margin-left: auto; }
.ds-move, .ds-del {
  width: 18px; height: 18px; border: none; background: transparent;
  color: #8B8B9E; cursor: pointer; font-size: 10px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 3px; transition: all 0.15s;
  margin-left: 2px;
}
.ds-move:disabled { color: #D8D3C8; cursor: not-allowed; }
.ds-move:hover:not(:disabled) { color: #0D6B5C; background: rgba(13,107,92,0.08); }
.ds-del:hover { color: #C53030; background: rgba(197,48,48,0.08); }

.add-spot-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 4px; border: 1px dashed #C8C2B5;
  background: transparent; color: #8B8B9E; font-size: 11px; font-weight: 500;
  cursor: pointer; transition: all 0.2s; margin-top: 4px; align-self: flex-start;
}
.add-spot-btn:hover { color: #0D6B5C; border-color: #0D6B5C; background: rgba(13,107,92,0.04); }

.add-spot-row { display: flex; gap: 4px; margin-top: 4px; align-items: center; }
.add-spot-input {
  flex: 1; padding: 5px 8px; border: 1.5px solid #0D6B5C; border-radius: 4px;
  font-size: 12px; outline: none; background: #fff; min-width: 0;
  font-family: 'Noto Sans SC', sans-serif;
}
.add-spot-input:focus { box-shadow: 0 0 0 2px rgba(13,107,92,0.15); }
.add-spot-position {
  max-width: 112px; padding: 5px 4px; border: 1px solid #E5E0D6;
  border-radius: 4px; background: #fff; color: #5C5C6E; font-size: 10px; outline: none;
}
.add-spot-position:focus { border-color: #0D6B5C; }
.add-spot-confirm {
  padding: 5px 10px; border: none; border-radius: 4px; background: #0D6B5C; color: #fff;
  font-size: 11px; font-weight: 600; cursor: pointer; transition: opacity 0.2s;
}
.add-spot-confirm:hover { opacity: 0.9; }
.add-spot-cancel {
  padding: 5px 8px; border: 1px solid #E5E0D6; border-radius: 4px; background: transparent;
  color: #8B8B9E; font-size: 11px; cursor: pointer; transition: all 0.2s;
}
.add-spot-cancel:hover { color: #5C5C6E; border-color: #C8C2B5; }

/* 规划路线按钮 */
.btn-plan-route {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 12px; border-radius: 8px; border: none;
  background: linear-gradient(135deg, #0D6B5C, #1A8A7A); color: #fff;
  font-size: 0.92rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
  font-family: 'Noto Sans SC', sans-serif;
  margin-top: 4px;
}
.btn-plan-route:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(13,107,92,0.3); }
.btn-plan-route:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }

/* 导航定位按钮 */
.btn-nav-locate {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px; border-radius: 6px; border: none;
  background: #0D6B5C; color: #fff; font-size: 0.88rem; font-weight: 500;
  cursor: pointer; transition: opacity 0.2s; font-family: 'Noto Sans SC', sans-serif;
}
.btn-nav-locate:hover { opacity: 0.9; }

/* ===== 路线调整 ===== */
.route-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 32px; gap: 8px;
}
.route-empty p { font-size: 13px; color: #8B8B9E; margin: 0; }

.route-stop-list { display: flex; flex-direction: column; gap: 0; }
.route-stop-row { display: flex; align-items: flex-start; gap: 8px; }
.rs-timeline { display: flex; flex-direction: column; align-items: center; width: 32px; }
.rs-tag {
  width: 32px; height: 22px; border-radius: 4px; font-size: 10px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  background: #5C5C6E; color: #fff;
}
.rs-tag.origin { background: #0D6B5C; }
.rs-tag.dest { background: #D4A84B; }
.rs-connector { width: 2px; height: 24px; background: #E5E0D6; }
.rs-content { flex: 1; padding: 2px 0; display: flex; flex-direction: column; gap: 2px; }
.rs-name { font-size: 13px; font-weight: 600; color: #1A1A2E; }
.rs-prov { font-size: 11px; color: #8B8B9E; }
.rs-btns { display: flex; gap: 2px; flex-shrink: 0; }
.rs-btn {
  width: 22px; height: 22px; border-radius: 3px; border: 1px solid #E5E0D6;
  background: #FAFAF8; color: #8B8B9E; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; transition: all 0.15s;
}
.rs-btn:hover { color: #0D6B5C; border-color: #0D6B5C; }
.rs-btn-del:hover { color: #C53030; border-color: #C53030; }

/* 添加途经点 */
.btn-add-waypoint {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px; border-radius: 6px; border: 1.5px solid #E5E0D6;
  background: #FAFAF8; color: #0D6B5C; font-size: 0.85rem; font-weight: 500;
  cursor: pointer; transition: all 0.2s; font-family: 'Noto Sans SC', sans-serif;
}
.btn-add-waypoint:hover { background: rgba(13,107,92,0.06); }

/* 路线策略 */
.route-strategy-section {
  padding: 10px 0 2px;
  border-top: 1px solid #E5E0D6;
}
.route-strategy-title {
  margin-bottom: 8px;
  color: #1A3A2A;
  font-size: 0.82rem;
  font-weight: 600;
}
.route-strategies {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}
.strat-label {
  display: flex; align-items: center; justify-content: center; gap: 4px; padding: 7px 8px;
  border-radius: 6px; border: 1.5px solid #E5E0D6; font-size: 0.76rem;
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.strat-label input { display: none; }
.strat-label:hover { border-color: #0D6B5C; }
.strat-label.active { border-color: #0D6B5C; background: rgba(13,107,92,0.06); }
.strategy-required-hint { margin: 7px 0 0; color: #B07822; font-size: 0.74rem; }

/* 智能优化 */
.optimize-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.82rem; color: #8B8B9E; cursor: pointer;
}

/* 操作按钮 */
.route-action-btns { display: flex; gap: 8px; }
.btn-plan {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 14px; border-radius: 6px; border: none;
  background: #D4A84B; color: #fff; font-size: 0.88rem; font-weight: 500;
  cursor: pointer; transition: opacity 0.2s; font-family: 'Noto Sans SC', sans-serif;
}
.btn-plan:hover { opacity: 0.9; }
.btn-plan:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-clear-sm {
  padding: 10px 12px; border-radius: 6px; border: 1.5px solid #E5E0D6;
  background: transparent; color: #8B8B9E; cursor: pointer; transition: all 0.2s;
}
.btn-clear-sm:hover { border-color: #C53030; color: #C53030; }

/* 路线结果 */
.route-result-info { background: #F8F6F0; border-radius: 6px; padding: 12px; }
.result-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center; }
.result-label { display: block; font-size: 0.72rem; color: #8B8B9E; margin-bottom: 2px; }
.result-value { display: block; font-size: 0.95rem; font-weight: 700; color: #0D6B5C; }

/* 保存按钮 */
.route-save-btns { display: flex; gap: 8px; }
.btn-save {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 14px; border-radius: 6px; border: none;
  background: #0D6B5C; color: #fff; font-size: 0.85rem; font-weight: 500;
  cursor: pointer; transition: opacity 0.2s; font-family: 'Noto Sans SC', sans-serif;
}
.btn-save:hover { opacity: 0.9; }

/* 已保存路线 */
.saved-routes { display: flex; flex-direction: column; gap: 6px; }
.saved-route-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border-radius: 6px; background: #F8F6F0; cursor: pointer;
  transition: background 0.15s;
}
.saved-route-item:hover { background: rgba(13,107,92,0.06); }
.sr-info { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
.sr-name { font-size: 12px; font-weight: 600; color: #1A1A2E; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sr-meta { font-size: 10px; color: #8B8B9E; }
.sr-del {
  width: 20px; height: 20px; border: none; background: transparent;
  color: #8B8B9E; cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 10px;
}
.sr-del:hover { color: #C53030; }

/* ===== 地图区域 ===== */
.map-container {
  flex: 1; min-width: 0;
  position: relative; z-index: 1;
  /* 显式高度：让内部 height: 100% 生效 */
  height: calc(100vh - 64px - 64px - 40px);  /* 视口高 - 顶栏 - 底栏 - 容器padding */
  min-height: 520px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  background: #F8F6F0;  /* 加载中底色 */
}
.map-static { width: 100%; height: 100%; cursor: pointer; position: relative; }
.map-static-img { width: 100%; height: 100%; object-fit: cover; background: #F8F6F0; }
.map-static-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.15);
  display: flex; align-items: center; justify-content: center; transition: background 0.3s;
}
.map-static:hover .map-static-overlay { background: rgba(0,0,0,0.25); }
.map-static-center { text-align: center; color: #fff; }
.map-static-center p { font-size: 14px; margin: 8px 0 0; }

.map-interactive { width: 100%; height: 100%; position: relative; }
.amap-container { width: 100%; height: 100%; }
.map-toolbar {
  position: absolute; top: 12px; left: 12px; z-index: 1000;
  display: flex; flex-direction: column; gap: 4px;
}
.map-btn {
  width: 32px; height: 32px; border-radius: 6px; border: none;
  background: rgba(255,255,255,0.95); color: #5C5C6E; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.15s;
}
.map-btn:hover { color: #0D6B5C; }
.map-info-bar {
  position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
  z-index: 1000; background: rgba(255,255,255,0.94); border-radius: 20px;
  padding: 8px 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  font-size: 0.85rem; color: #1A3A2A; font-weight: 500; white-space: nowrap;
  display: flex; align-items: center; gap: 6px;
}

/* ===== 响应式 ===== */
@media (max-width: 1024px) {
  /* 与其他页面断点一致：768-1024 区间宽度自适应 */
  .navigate-layout { width: 90%; }
}
@media (max-width: 768px) {
  .routes-page { padding-top: 16px; }
  .routes-page > .page-hero { width: calc(100% - 32px); }
  .navigate-layout { width: 100%; padding: 16px; flex-direction: column; min-height: auto; }
  .nav-panel { width: 100%; border-right: none; border-bottom: 1px solid #E5E0D6; max-height: 420px; }
  .map-container { height: 55vw; min-height: 260px; }
}

/* ===== 通用 ===== */
@keyframes spin { to { transform: rotate(360deg); } }
.btn-spinner {
  display: inline-block; width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
.toast {
  position: fixed; top: 80px; left: 50%;
  transform: translateX(-50%) translateY(-20px);
  padding: 12px 24px; border-radius: 12px;
  background: #1A1A2E; color: #fff; font-size: 13px;
  opacity: 0; pointer-events: none; transition: opacity 0.3s, transform 0.3s;
  z-index: 9999; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  font-family: 'Noto Sans SC', sans-serif;
}
.toast.visible { opacity: 1; transform: translateX(-50%) translateY(0); }
.toast.success { background: #0D6B5C; }
.toast.error { background: #C53030; }
.toast.info { background: #1A1A2E; }
</style>
