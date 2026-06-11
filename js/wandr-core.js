/* ===========================================================
   WANDR 核心命名空间 & 全局状态管理
   =========================================================== */

window.WANDR = window.WANDR || {};

// ---------- 全局 DOM 缓存 ----------
const DOM = {};
function dom(id) { return DOM[id] || (DOM[id] = document.getElementById(id)); }
WANDR.dom = dom;

// ---------- 全局状态（集中管理所有跨模块共享变量）----------
WANDR.state = {
  // 目的地详情
  currentDestKey: null,
  currentDestTab: 'overview',

  // 路线规划
  route: {
    panelMode: 'single',          // 'single' | 'route'
    waypoints: [],
    polyline: null,
    markers: [],
    lastPlanData: null,
    source: null,                 // 路线规划来源
    activeTool: 'addWaypoint',
  },

  // 地图
  map: {
    leafletMap: null,
    selectedSpot: null,
    provinceLayer: null,
    provincePopup: null,
    selectedProvince: null,
    geocoderCache: {},           // 地理编码缓存
    styleMode: 'default',
    importMarkers: [],
  },

  // 分享
  shares: {
    all: [],
    currentIndex: 0,
    editingId: null,
    commentPhotoData: null,
    photoInputEl: null,
    scrollDebounceTimer: null,
    trackScrollHandler: null,
  },

  // 旅行日记
  diary: {
    photos: [],
    currentHTML: '',
    isGenerating: false,
    finalImageUrl: '',
  },

  // MBTI
  mbti: {
    currentCategory: null,
    currentQuestion: 0,
    answers: [],
  },

  // 预定
  booking: { currentDest: null },

  // 语音
  isRecording: false,
  mediaRecorder: null,
  recordedChunks: [],

  // 飞猪
  flyai: {
    currentResults: null,
    currentKeyword: '',
    currentSort: 'default',
    currentFilters: {},
  },
};

// 向后兼容别名 — 避免旧代码大量修改
window.currentDestKey = null;      // getter/setter 在下面覆盖
window.currentDestTab = 'overview';

// 同步 window 变量与 WANDR.state 的双向绑定（通过 Proxy 简化迁移）
function _syncGlobal(key, obj, prop) {
  let _val = obj[prop];
  Object.defineProperty(window, key, {
    get() { return obj[prop]; },
    set(v) { obj[prop] = v; },
    enumerable: true,
    configurable: true,
  });
  obj[prop] = _val;
}

_syncGlobal('currentDestKey', WANDR.state, 'currentDestKey');
_syncGlobal('currentDestTab', WANDR.state, 'currentDestTab');

// ---------- 通用工具函数 ----------

/** 防抖 */
WANDR.debounce = function(fn, delay = 200) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
};

/** 节流（requestAnimationFrame） */
WANDR.throttleRAF = function(fn) {
  let ticking = false;
  return function(...args) {
    if (!ticking) {
      requestAnimationFrame(() => { fn.apply(this, args); ticking = false; });
      ticking = true;
    }
  };
};

/** 切换元素 display（替代重复的 display:none 判断） */
WANDR.toggleDisplay = function(el, show) {
  if (typeof el === 'string') el = dom(el);
  if (!el) return;
  el.style.display = show ? '' : 'none';
};

/** 折叠/展开通用方法 */
WANDR.toggleCollapse = function(wrapId, chevronId) {
  const wrap = document.getElementById(wrapId);
  const chevron = document.getElementById(chevronId);
  if (!wrap) return;
  const isOpen = wrap.style.display !== 'none';
  wrap.style.display = isOpen ? 'none' : 'block';
  if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
};

/** 安全 HTML 设置（防 XSS） */
WANDR.escapeHtml = function(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/** 安全设置 innerHTML（带警告限制，保留原有功能） */
WANDR.setHTML = function(el, html) {
  if (typeof el === 'string') el = dom(el);
  if (!el) return;
  el.innerHTML = html;
};

/** 格式化日期 */
WANDR.formatDate = function(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// 同时挂载为全局函数（向后兼容现有代码）
window.escapeHtml = WANDR.escapeHtml;
window.formatDate = WANDR.formatDate;

/** 等待容器内所有图片加载完成（替代硬编码 setTimeout，用于 html2canvas 等场景） */
WANDR.waitForImages = async function(container) {
  const imgs = container.querySelectorAll('img');
  if (imgs.length === 0) return;
  await Promise.all(
    Array.from(imgs)
      .filter(img => !img.complete)
      .map(img => new Promise((resolve) => { img.onload = img.onerror = resolve; }))
  );
};

/** LRU 缓存（限制容量，用于地理编码等） */
WANDR.LRUCache = class {
  constructor(max = 200) {
    this._max = max;
    this._cache = new Map();
  }
  get(key) {
    if (!this._cache.has(key)) return undefined;
    const val = this._cache.get(key);
    this._cache.delete(key);
    this._cache.set(key, val);
    return val;
  }
  set(key, val) {
    if (this._cache.has(key)) this._cache.delete(key);
    else if (this._cache.size >= this._max) {
      const first = this._cache.keys().next().value;
      this._cache.delete(first);
    }
    this._cache.set(key, val);
  }
  has(key) { return this._cache.has(key); }
};

/** API 端点集中配置 */
WANDR.API = {
  BASE: '/api',
  get SHARES() { return `${this.BASE}/shares`; },
  get FLYAI_SEARCH() { return `${this.BASE}/flyai/search`; },
  get FLYAI_RECOMMEND() { return `${this.BASE}/flyai/recommend`; },
  get OPENAI_GENERATE() { return `${this.BASE}/openai/generate`; },
  get OPENAI_PROXY() { return `${this.BASE}/openai`; },
};

// ============ 智能图片回退（Unsplash Source API，无需 API Key）============
const IMG_FAILED_SET = new Set();
/**
 * 目的地图片加载失败时，自动从 Unsplash 搜索相关图片回退
 * @param {HTMLImageElement} img - 出错的 img 元素
 * @param {string} destName - 目的地名称
 * @param {string} fallbackUrl - Unsplash 回退 URL
 */
WANDR.handleDestImgError = function(img, destName, fallbackUrl) {
  const srcKey = img.getAttribute('data-original-src') || img.src;

  // 已经尝试过 Unsplash 回退但仍然失败 → 显示纯色占位
  if (IMG_FAILED_SET.has(srcKey) || img.getAttribute('data-unsplash-tried') === '1') {
    _showImgPlaceholder(img, destName);
    return;
  }

  // 第一次失败 → 尝试 Unsplash 回退
  img.setAttribute('data-original-src', img.src);
  img.setAttribute('data-unsplash-tried', '1');
  img.classList.add('dest-img-loading');

  // 构造多个 Unsplash 回退 URL（增加成功率）
  const sources = [
    fallbackUrl,
    `https://source.unsplash.com/600x400/?${encodeURIComponent(destName)},scenery`,
    `https://source.unsplash.com/600x400/?china,travel,nature`,
  ];

  let tryIndex = 0;
  function tryNext() {
    if (tryIndex >= sources.length) {
      IMG_FAILED_SET.add(srcKey);
      img.classList.remove('dest-img-loading');
      _showImgPlaceholder(img, destName);
      return;
    }
    img.src = sources[tryIndex];
    tryIndex++;
  }

  // 监听回退图片的加载结果
  img.onerror = tryNext;
  img.onload = () => {
    img.classList.remove('dest-img-loading');
  };

  tryNext();
};

function _showImgPlaceholder(img, destName) {
  const parent = img.parentElement;
  if (!parent) return;

  // 获取图标（根据目的地类型）
  const iconMap = { '🏔️': 'mountain', '🏯': 'culture', '🏖️': 'beach', '🌆': 'city' };
  const icon = '🏞️';

  const fallback = document.createElement('div');
  fallback.className = 'dest-img-fallback';
  fallback.innerHTML = `
    <div style="text-align:center">
      <div style="font-size:2.5rem;margin-bottom:8px">${icon}</div>
      <div style="font-size:0.85rem;color:var(--clr-text-light)">${destName}</div>
    </div>`;
  img.replaceWith(fallback);
}

window.WANDR = WANDR;
