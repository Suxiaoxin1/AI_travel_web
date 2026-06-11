/* ===== 探途 WANDR — JavaScript 交互逻辑 ===== */
// DOM 缓存 & dom() → 已在 js/wandr-core.js 中定义（WANDR.dom）
// T (i18n) → 已在 js/i18n.js 中定义
// API 管理器 → 已在 js/api-key-manager.js 中定义
// showToast → 已在 js/toast-anim.js 中定义
// FavManager → 已在 js/fav-manager.js 中定义

// ---- 事件委托：统一管理所有 data-action 点击 ----
document.addEventListener('click', function(e) {
  // 内联日期选择器：点击某一天
  const dayItem = e.target.closest('.inline-day-item');
  if (dayItem && dayItem.dataset.day !== undefined) {
    const container = getDayPickerInline();
    const fav = container?._fav;
    if (fav) {
      const day = parseInt(dayItem.dataset.day);
      resetInlinePicker();
      doImportPlanDay(fav, day);
      return;
    }
  }
  // 内联日期选择器：点击目的地
  const destItem = e.target.closest('.day-picker-dest-item');
  if (destItem) {
    const container = getDayPickerInline();
    const planFavs = container?._planFavs;
    if (planFavs) {
      const favName = destItem.dataset.favName;
      const fav = planFavs.find(f => f.name === favName);
      if (fav) appendDayPickerModal(fav);
      return;
    }
  }

  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if (el.dataset.stop) e.stopPropagation();
  const d = el.dataset;
  switch (a) {
    case 'scrollTo': smoothScrollToSection(d.target); break;
    case 'triggerClick': {
      const selector = d.target;
      const el = selector.startsWith('#') ? document.getElementById(selector.slice(1)) : document.querySelector(selector);
      el?.click();
      break;
    }
    case 'addPresetText': addPresetText(d.tag); break;
    case 'toggleRecording': toggleRecording(); break;
    case 'toggleApiKeyInput': toggleApiKeyInput(); break;
    case 'saveApiKey': saveApiKey(); break;
    case 'toggleApiKeyVisibility': toggleApiKeyVisibility(); break;
    case 'toggleZhipuKeyInput': toggleZhipuKeyInput(); break;
    case 'saveZhipuKey': saveZhipuKey(); break;
    case 'toggleZhipuKeyVisibility': toggleZhipuKeyVisibility(); break;
    case 'startAnalysis': startAnalysis(); break;
    case 'toggleApiDetails': toggleApiDetails(); break;
    case 'toggleReasoning': toggleReasoning(); break;
    case 'savePlan': savePlan(); break;
    case 'showDetailModal': showDetailModal(); break;
    case 'selectMbtiType': selectMbtiType(d.type); break;
    case 'startMbtiTest': startMbtiTest(); break;
    case 'answerMbtiA': answerMbti('A'); break;
    case 'answerMbtiB': answerMbti('B'); break;
    case 'prevMbtiQ': prevMbtiQ(); break;
    case 'restartMbti': restartMbti(); break;
    case 'goToPlanning': goToPlanning(); break;
    case 'shareMbtiResult': shareMbtiResult(); break;
    case 'openExternalMap': openExternalMap(); break;
    case 'openPublishModal': openPublishModal(); break;
    case 'closeShareModal': closeShareModal(); break;
    case 'submitShare': submitShare(); break;
    case 'likeShare': likeShare(el, d.sid); break;
    case 'commentShare': toggleComments(el, d.sid); break;
    case 'submitComment': submitComment(el, d.sid); break;
    case 'carouselPrev': prevShare(); break;
    case 'carouselNext': nextShare(); break;
    case 'carouselDot': goToShare(parseInt(d.index) || 0); break;
    case 'clearSharesSearch': clearSharesSearch(); break;
    case 'closeLightbox': closeLightbox(); break;
    case 'lightboxPrev': lightboxPrev(); break;
    case 'lightboxNext': lightboxNext(); break;
    case 'pickCommentPhoto': /* handled by click listener */ break;
    case 'generateDiary': generateDiary(); break;
    case 'generateDiaryAI': generateDiaryAI(); break;
    case 'downloadDiary': downloadDiary(); break;
    case 'saveDiary': saveDiary(); break;
    case 'selectDiaryStyle': selectDiaryStyle(el); break;
    case 'openUserPanel':
      openUserPanel(d.tab);
      dom('mobileMenu')?.classList.remove('open');
      break;
    case 'openDestDetail': openDestDetail(d.key); break;
    case 'navigateTo': navigateTo(d.dest); break;
    case 'toggleFavorite': toggleFavorite(el, d.name, d.sub, d.img, d.price, d.rating); break;
    case 'openBookingModal': openBookingModal(d.name, d.sub, d.img, d.price, d.rating); break;
    case 'toggleCategoryExpand': toggleCategoryExpand(el); break;
    case 'confirmBooking': /* 预订已改为跳转飞猪 */ break;
    case 'changePeopleUp': /* 已移除人数选择器 */ break;
    case 'changePeopleDown': /* 已移除人数选择器 */ break;
    case 'switchPanelTab': switchPanelTab(d.tab); break;
    case 'closeUserPanel': closeUserPanel(); break;
    case 'closeBookingModal': closeBookingModal(null); break;
    case 'closeDestDetail': closeDestDetail(); break;
    case 'toggleDestDetailFav': toggleDestDetailFav(); break;
    case 'bookDestDetail': bookDestDetail(); break;
    case 'navDestDetail': navDestDetail(); break;
    case 'switchDestTab': switchDestTab(el, d.tab); break;
    case 'closeDetailModal': closeDetailModal(); break;
    case 'navigateCurrentDest': navigateCurrentDest(); break;
    case 'removeFavorite': removeFavorite(parseInt(d.index)); break;
    case 'importPlanToNavigate': importPlanToNavigate(parseInt(d.index)); break;
    case 'clearImportedPlan': clearImportedPlan(); break;
    case 'openImportFromFavorites': openImportFromFavorites(); break;
    case 'inlinePickerBack': handleInlinePickerBack(); break;
    case 'inlinePickerCancel': handleInlinePickerCancel(); break;
    case 'inlinePickerAll': handleInlinePickerAll(el); break;
    case 'cancelBooking': cancelBooking(parseInt(d.index)); break;
    case 'closeBookingOverlay': closeBookingModal(e); break;
    case 'closeUserPanelOverlay': closeUserPanel(e); break;
    case 'closeModalOverlay': closeModal(e); break;
    case 'closeDestDetailOverlay': closeDestDetail(e); break;
    case 'toggleFlyaiMode': /* 飞猪模式始终开启 */ break;
    case 'viewDiary': viewDiary(d.diaryId); break;
    case 'deleteDiary': deleteDiary(d.diaryId); break;
    case 'switchNavPanelMode': switchNavPanelMode(d.panel); break;
    case 'addRouteWaypoint': addRouteWaypoint(); break;
    case 'startRoutePlanning': startRoutePlanning(); break;
    case 'clearRoutePlan': clearRoutePlan(); break;
    case 'importToRoutePlan': importToRoutePlan(); break;
    case 'saveRoutePlan': saveRoutePlanToFavorites(); break;
    case 'loadRoutePlan': loadRoutePlanFromFav(parseInt(d.index)); break;
    case 'openSavedRoutes': openSavedRoutes(); break;
    case 'loadRoutePlanFromSaved': loadRoutePlanFromFav(parseInt(d.index)); break;
    case 'loadExistingRouteForDay': loadExistingRouteForDay(parseInt(d.favDay)); break;
    case 'planAllDays': planAllDays(); break;
    case 'planSingleDay': planSingleDay(parseInt(d.day)); break;
    case 'loadDayRoute': loadDayRoute(parseInt(d.day)); break;
    case 'toggleDayPanel': toggleDayPanel(parseInt(d.day)); break;
  }
});

// ============ 导航栏滚动效果（rAF 节流）============
const navbar = document.getElementById('navbar');
let _navbarScrollTicking = false;
window.addEventListener('scroll', () => {
  if (!_navbarScrollTicking) {
    requestAnimationFrame(() => {
      navbar.classList.toggle('scrolled', window.scrollY > 60);
      _navbarScrollTicking = false;
    });
    _navbarScrollTicking = true;
  }
}, { passive: true });

// 汉堡菜单 + A11y aria-expanded 同步
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  hamburger.setAttribute('aria-label', isOpen ? '关闭导航菜单' : '打开导航菜单');
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', '打开导航菜单');
  });
});

// 平滑滚动（注意：不能命名为 scrollTo，会覆盖 window.scrollTo 导致 Leaflet 地图报错）
function smoothScrollToSection(selector) {
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ============ 导航高亮（MPA 版 — 按当前页面匹配）============
(function initNavHighlight() {
  const navLinks = document.querySelectorAll('.nav-links .nav-link');
  const mobileLinks = document.querySelectorAll('.mobile-menu a');

  if (!navLinks.length) return;

  // 获取当前页面文件名
  const currentPage = location.pathname.split('/').pop() || 'index.html';

  // 首页：所有链接指向其他页面，无需高亮
  if (currentPage === 'index.html') return;

  // 子页面：匹配对应链接并高亮
  function setActive(page) {
    navLinks.forEach(a => {
      const href = (a.getAttribute('href') || '').split('/').pop();
      a.classList.toggle('active', href === page);
    });
    mobileLinks.forEach(a => {
      const href = (a.getAttribute('href') || '').split('/').pop();
      a.classList.toggle('active', href === page);
    });
  }

  setActive(currentPage);
})();

// ============ 骨架屏工具函数（Task 2）============

/**
 * 向网格容器中注入 N 个骨架屏占位卡
 * @param {HTMLElement} container - 目标容器
 * @param {number} count - 骨架卡数量
 * @param {'dest'|'mbti'|'itinerary'} type - 骨架类型
 */
function showGridSkeleton(container, count = 6, type = 'dest') {
  if (!container) return;
  let cardHtml = '';

  if (type === 'dest') {
    cardHtml = Array.from({ length: count }).map(() => `
      <div class="skeleton-card">
        <div class="skeleton-block skel-dest-img"></div>
        <div class="skel-dest-body">
          <div class="skeleton-block skel-dest-tag"></div>
          <div class="skeleton-block skel-dest-name"></div>
          <div class="skeleton-block skel-dest-meta"></div>
        </div>
      </div>`).join('');
  } else if (type === 'mbti') {
    cardHtml = Array.from({ length: count }).map(() => `
      <div class="skeleton-card">
        <div class="skeleton-block skel-mbti-img"></div>
        <div class="skel-mbti-body">
          <div class="skeleton-block skel-mbti-name"></div>
          <div class="skeleton-block skel-mbti-desc"></div>
        </div>
      </div>`).join('');
  } else if (type === 'itinerary') {
    cardHtml = Array.from({ length: count }).map(() =>
      `<div class="skeleton-block skel-itinerary-line"></div>`
    ).join('');
  }

  container.innerHTML = cardHtml;
}

/**
 * 清除骨架屏（直接替换 innerHTML 即可，此函数供外部显式调用）
 * @param {HTMLElement} container
 */
function hideGridSkeleton(container) {
  if (!container) return;
  container.innerHTML = '';
}

// ============ 焦点陷阱 trapFocus（Task 6 — A11y）============

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
let _trapHandler = null;

/**
 * 在 modal 内建立焦点陷阱，防止 Tab 键逃逸
 * @param {HTMLElement} modal
 */
function trapFocus(modal) {
  releaseFocus(); // 先解绑旧的
  const focusables = Array.from(modal.querySelectorAll(FOCUSABLE));
  if (!focusables.length) return;

  // 打开时聚焦第一个可聚焦元素
  requestAnimationFrame(() => focusables[0].focus());

  _trapHandler = function(e) {
    if (e.key !== 'Tab') return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  };
  modal.addEventListener('keydown', _trapHandler);
}

/**
 * 解除焦点陷阱
 * @param {HTMLElement} [modal] - 若提供则在其上解绑，否则全局解绑
 */
function releaseFocus(modal) {
  if (_trapHandler) {
    const el = modal || document;
    el.removeEventListener('keydown', _trapHandler);
    _trapHandler = null;
  }
}


// ============ 卡片入场动画观察器 ============
// ============ 卡片入场动画观察器 ============
const entryObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.dest-card, .upload-panel, .result-panel, .review-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  entryObserver.observe(el);
});

// ============================================================
// 我的收藏 & 预定 / 飞猪集成 / 用户面板 / 目的地详情
// ============================================================
// ============================================================
// 我的收藏 & 我的预定 模块（存储/收藏管理已提取到 js/fav-manager.js）
// ============================================================

/* ---------- 渲染收藏列表 ---------- */
function renderFavList() {
  const favs = getFavorites();
  const emptyEl = document.getElementById('favEmpty');
  const listEl = document.getElementById('favList');
  if (!listEl) return;

  if (favs.length === 0) {
    emptyEl && (emptyEl.style.display = 'block');
    listEl.innerHTML = '';
    return;
  }
  emptyEl && (emptyEl.style.display = 'none');
  listEl.innerHTML = favs.map((f, i) => {
    // AI 行程：统计已规划路线的天数
    const routedDays = f.isAiPlan && f.days
      ? f.days.filter(d => d.routeData).length
      : 0;
    const routeBadge = routedDays > 0
      ? `<span class="panel-item-tag route-tag">🛣 ${routedDays}/${f.days.length} 天已规划</span>`
      : '';

    return `
    <div class="panel-fav-item" id="fav-item-${i}">
      <img src="${f.img}" alt="${f.name}" class="panel-item-img" loading="lazy">
      <div class="panel-item-info">
        <div class="panel-item-name">${f.isRoutePlan ? '<i class="fa-solid fa-map-marked-alt" style="color:var(--clr-primary);margin-right:4px;"></i>' : ''}${f.name}</div>
        <div class="panel-item-sub">${f.sub}</div>
        <div class="panel-item-tags">
          ${f.isRoutePlan
            ? `<span class="panel-item-tag route-tag">🛣 路线规划</span><span class="panel-item-tag">${f.rating}</span><span class="panel-item-tag">收藏于 ${f.addedAt}</span>`
            : `${routeBadge}<span class="panel-item-tag">⭐ ${f.rating}</span><span class="panel-item-tag accent">${f.price}/人起</span><span class="panel-item-tag">收藏于 ${f.addedAt}</span>`
          }
        </div>
        <div class="panel-item-actions">
          ${f.isRoutePlan && f.routeData
            ? `<button class="panel-item-btn outline" data-action="loadRoutePlan" data-index="${i}">
              <i class="fa-solid fa-map"></i> 加载路线
            </button>`
            : (f.isAiPlan && f.days && f.days.length ? `<button class="panel-item-btn outline" data-action="importPlanToNavigate" data-index="${i}">
              <i class="fa-solid fa-route"></i> 导入路线
            </button>` : '')}
          <button class="panel-item-btn primary" data-action="openBookingModal" data-name="${f.name}" data-sub="${f.sub}" data-img="${f.img}" data-price="${f.price}" data-rating="${f.rating}">
            <i class="fa-solid fa-calendar-plus"></i> 立即预定
          </button>
          <button class="panel-item-btn danger" data-action="removeFavorite" data-index="${i}">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </div>
    </div>
  `}).join('');
}

// removeFavorite / toggleFavorite / FavManager 已提取到 js/fav-manager.js

function openBookingFromFav(name, sub, img, price, rating) {
  closeUserPanel();
  setTimeout(() => openBookingModal(name, sub, img, price, rating), 300);
}

/* ---------- 预定 Modal ---------- */
let currentBookingDest = null;

function openBookingModal(name, sub, img, price, rating) {
  currentBookingDest = { name, sub, img, price, rating };
  document.getElementById('bookingDestName').textContent = name;
  document.getElementById('bookingDestSub').textContent = sub;
  document.getElementById('bookingDestPrice').textContent = `从 ${price}/人`;
  document.getElementById('bookingDestImg').src = img;

  // 自动加载飞猪产品列表
  flyaiEnabled = true;
  loadFlyaiProducts();

  document.getElementById('bookingModal').classList.add('open');
  // A11y：打开 modal 时启用焦点陷阱
  trapFocus(document.getElementById('bookingModal'));
}

function closeBookingModal(e) {
  if (!e || e.target === document.getElementById('bookingModal')) {
    document.getElementById('bookingModal').classList.remove('open');
    releaseFocus(document.getElementById('bookingModal'));
  }
}

/* 以下函数因改为飞猪直跳模式已不再需要，保留空桩避免引用错误 */
function changePeople(delta) { /* 已移除人数选择器 */ }
function updateBookingPrice() { /* 已移除价格计算 */ }
async function confirmBooking() { /* 预订已改为跳转飞猪 */ }

/* ---------- 渲染预定列表 ---------- */
function renderBookList() {
  const books = getBookings();
  const emptyEl = document.getElementById('bookEmpty');
  const listEl = document.getElementById('bookList');
  if (!listEl) return;

  if (books.length === 0) {
    emptyEl && (emptyEl.style.display = 'block');
    listEl.innerHTML = '';
    return;
  }
  emptyEl && (emptyEl.style.display = 'none');

  const statusMap = { confirmed: ['confirmed', '已确认'], pending: ['pending', '待确认'], cancelled: ['cancelled', '已取消'] };

  listEl.innerHTML = books.map((b, i) => {
    const [sc, sl] = statusMap[b.status] || ['pending', '待确认'];
    return `
    <div class="panel-book-item">
      <img src="${b.img}" alt="${b.dest}" class="panel-item-img" loading="lazy">
      <div class="panel-item-info">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
          <div class="panel-item-name">${b.dest}${b._flyai ? ' <span class="booking-flyai-badge">飞猪</span>' : ''}</div>
          <span class="booking-status ${sc}">${sl}</span>
        </div>
        <div class="panel-item-sub">${b.sub}</div>
        <div class="panel-book-detail">
          📅 ${b.date} · ${b.days}天 · ${b.people}人 · ${b.travelType}<br>
          💰 ${b.totalPrice} · 订单号 <strong>${b.id}</strong>
        </div>
        <div class="panel-item-actions">
          ${b.status !== 'cancelled' ? `
          <button class="panel-item-btn primary" data-action="navigateTo" data-dest="${b.dest}">
            <i class="fa-solid fa-location-dot"></i> 导航前往
          </button>
          <button class="panel-item-btn danger" data-action="cancelBooking" data-index="${i}">取消预定</button>
          ` : '<span style="font-size:0.8rem;color:#e74c3c">此预定已取消</span>'}
        </div>
      </div>
    </div>
  `}).join('');
}

async function cancelBooking(idx) {
  let books = getBookings();
  if (!books[idx]) return;
  const book = books[idx];

  // 飞猪订单：同时取消远程订单
  if (book._flyai && book.id) {
    await flyaiCancelBooking(book.id);
  }

  books[idx].status = 'cancelled';
  saveBookings(books);
  renderBookList();
  showToast(T.bookingCancelled);
}

// ============================================================
// 飞猪 AI 开放平台集成模块 (FlyAI Integration)
// ============================================================
// 后端代理地址：默认同源 /api，开发时可改为 http://localhost:3001/api
const FLYAI_API = (() => {
  // 自动检测：如果页面在同源服务器上运行，用相对路径；否则用 localhost
  if (window.location.port === '') return '/api';      // 生产模式 (同源)
  return 'http://localhost:3001/api';                    // 开发模式
})();

/** 是否启用真实预定模式（飞猪API）— 始终开启 */
let flyaiEnabled = true;

/**
 * 检查 FlyAI 后端服务是否可用
 */
async function checkFlyAIStatus() {
  try {
    const r = await fetch(`${FLYAI_API}/health`);
    const data = await r.json();
    return data.status === 'ok';
  } catch { return false; }
}

/**
 * 搜索目的地旅行团产品
 * @returns {Promise<{products: Array, total: number}|null>}
 */
async function flyaiSearchProducts(keyword, days, people) {
  try {
    const r = await fetch(`${FLYAI_API}/products/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, days, people, type: '跟团游' })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    if (data.success && data.products?.length) return data;
    // 后端返回空结果，返回空列表
    console.warn('[FlyAI] 后端返回空结果');
    return { success: true, total: 0, products: [] };
  } catch (e) {
    console.error('[FlyAI] API 调用失败:', e.message);
    return { success: false, error: e.message, products: [] };
  }
}





/**
 * 创建真实预订订单（通过后端代理 → 飞猪 API）
 */
async function flyaiCreateBooking(bookingData) {
  try {
    const r = await fetch(`${FLYAI_API}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    const data = await r.json();
    return data;
  } catch (e) {
    console.error('[FlyAI] 创建订单失败', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * 取消真实预订订单
 */
async function flyaiCancelBooking(orderId) {
  try {
    const r = await fetch(`${FLYAI_API}/bookings/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: '用户取消' })
    });
    const data = await r.json();
    return data;
  } catch (e) {
    console.error('[FlyAI] 取消订单失败', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * 获取推荐产品并渲染到预订弹窗中（增强版：富卡片 + 筛选排序 + 详情展开）
 */

/** 缓存当前搜索结果 */
let _flyaiProducts = [];

async function loadFlyaiProducts() {
  if (!flyaiEnabled || !currentBookingDest) return;

  const container = document.getElementById('flyaiProductList');
  if (!container) return;

  container.innerHTML = '<div class="flyai-loading"><i class="fa-solid fa-spinner fa-spin"></i> 正在搜索飞猪旅行团产品...</div>';

  const destName = currentBookingDest.name?.split('·')[0] || currentBookingDest.name || '';
  const days = 5; // 默认5天
  const people = 2; // 默认2人

  const result = await flyaiSearchProducts(destName, days, people);

  if (!result || !result.products?.length) {
    container.innerHTML = '<div class="flyai-empty"><i class="fa-regular fa-face-sad-tear" style="font-size:1.5rem;margin-bottom:8px;display:block"></i>暂无匹配的旅行团产品<br><span style="font-size:0.75rem;color:#999">试试调整行程天数或出行方式</span></div>';
    _flyaiProducts = [];
    return;
  }

  _flyaiProducts = result.products;

  // 渲染筛选后的产品列表
  renderFlyaiProductList();

  // 绑定筛选/排序事件
  bindFilterSortEvents();

  updateFlyaiPrice();
}

/**
 * 根据当前筛选和排序条件渲染产品列表
 */
function renderFlyaiProductList() {
  const container = document.getElementById('flyaiProductList');
  if (!container || !_flyaiProducts.length) return;

  let products = [..._flyaiProducts];

  // 类型筛选
  const activeFilter = document.querySelector('.flyai-filter-tab.active')?.dataset.filter || 'all';
  if (activeFilter !== 'all') {
    products = products.filter(p => p.type === activeFilter);
  }

  // 排序
  const sortBy = document.getElementById('flyaiSortSelect')?.value || 'default';
  switch (sortBy) {
    case 'price_asc': products.sort((a, b) => a.price - b.price); break;
    case 'price_desc': products.sort((a, b) => b.price - a.price); break;
    case 'rating_desc': products.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    case 'sales_desc': products.sort((a, b) => (b.sales || 0) - (a.sales || 0)); break;
    case 'days_asc': products.sort((a, b) => (a.days || 0) - (b.days || 0)); break;
    default: /* 保持原始顺序 */ break;
  }

  if (!products.length) {
    container.innerHTML = '<div class="flyai-empty">当前筛选条件下没有产品，请切换筛选条件</div>';
    return;
  }

  container.innerHTML = products.map((p, i) => {
    const imgHtml = p.images?.length
      ? `<div class="flyai-card-thumb"><img src="${p.images[0]}" alt="${p.name}" loading="lazy"></div>`
      : `<div class="flyai-card-thumb flyai-no-img"><i class="fa-solid fa-image"></i></div>`;
    const tagsHtml = p.tags?.length
      ? `<div class="flyai-tags-row">${p.tags.slice(0, 3).map(t => `<span class="flyai-tag">${t}</span>`).join('')}</div>` : '';
    const infoRows = [];
    if (p.hotelLevel) infoRows.push(`<span title="住宿标准"><i class="fa-solid fa-hotel"></i>${p.hotelLevel}</span>`);
    if (p.meals) infoRows.push(`<span title="餐饮安排"><i class="fa-solid fa-utensils"></i>${p.meals}</span>`);
    if (p.groupSize) infoRows.push(`<span title="团队规模"><i class="fa-solid fa-users"></i>${p.groupSize}</span>`);

    return `
      <label class="flyai-product-card rich ${i === 0 ? 'selected' : ''}" data-pid="${p.id}">
        <input type="radio" name="flyaiProduct" value="${p.id}"
               data-name="${p.name}" data-price="${p.price}"
               data-days="${p.days || ''}" data-type="${p.type || ''}" ${i === 0 ? 'checked' : ''}>
        ${imgHtml}
        <div class="flyai-product-body">
          <div class="flyai-product-info">
            <div class="flyai-product-name">${p.name}</div>
            <div class="flyai-product-meta">
              <span class="flyai-tag type-tag">${p.type}</span>
              <span class="meta-item">${p.days}天</span>
              <span class="meta-item star">⭐${p.rating}</span>
              <span class="meta-item sales">${(p.sales || 0).toLocaleString()}人已购</span>
            </div>
            ${tagsHtml}
            ${p.highlight ? `<div class="flyai-highlight">🎯 ${p.highlight}</div>` : ''}
            ${infoRows.length ? `<div class="flyai-service-row">${infoRows.join('')}</div>` : ''}
          </div>
          <div class="flyai-product-price">
            <div class="flyai-price-num">¥<strong>${p.price.toLocaleString()}</strong></div>
            <span class="flyai-price-unit">/人起</span>
            <button type="button" class="flyai-view-detail-btn" onclick="window.open('${p.jumpUrl || '#'}','_blank')">
              查看详情 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.6rem"></i>
            </button>
          </div>
        </div>
      </label>`;
  }).join('');

  // 产品卡片选择事件
  container.querySelectorAll('.flyai-product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // 如果点击的是"查看详情"按钮，不触发选择（按钮已改为外链）
      if (e.target.closest('.flyai-view-detail-btn')) return;

      container.querySelectorAll('.flyai-product-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });

  updateFlyaiPrice();
}

/**
 * 绑定筛选和排序事件
 */
function bindFilterSortEvents() {
  // 筛选 Tab 切换
  document.querySelectorAll('.flyai-filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.flyai-filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderFlyaiProductList();
    });
  });

  // 排序下拉
  document.getElementById('flyaiSortSelect')?.addEventListener('change', () => {
    renderFlyaiProductList();
  });
}

/** 根据选中的飞猪产品更新总价（已简化，仅显示选中价格） */
function updateFlyaiPrice() {
  /* 价格直接显示在卡片上，无需额外更新总价 */
}

/* ---------- 用户面板 ---------- */
function openUserPanel(tab) {
  const overlay = document.getElementById('userPanelOverlay');
  overlay.classList.add('open');
  switchPanelTab(tab || 'favorites');
}

function closeUserPanel(e) {
  if (!e || e.target === document.getElementById('userPanelOverlay')) {
    document.getElementById('userPanelOverlay').classList.remove('open');
  }
}

function switchPanelTab(tab) {
  document.getElementById('favTab').classList.toggle('active', tab === 'favorites');
  document.getElementById('bookTab').classList.toggle('active', tab === 'bookings');
  document.getElementById('diaryTab').classList.toggle('active', tab === 'diaries');
  document.getElementById('panelFavorites').style.display = tab === 'favorites' ? 'block' : 'none';
  document.getElementById('panelBookings').style.display = tab === 'bookings' ? 'block' : 'none';
  document.getElementById('panelDiaries').style.display = tab === 'diaries' ? 'block' : 'none';

  if (tab === 'favorites') renderFavList();
  else if (tab === 'bookings') renderBookList();
  else if (tab === 'diaries') renderDiaryList();
}
// ============================================================
// 目的地详情页模块
// ============================================================

/* ---------- 6 个目的地的详情数据 ---------- */
const destDetailData = {
  zhangjiajie: {
    name: '张家界', sub: '湖南 · 世界自然遗产', rating: '4.9', price: '¥880',
    img: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&auto=format&fit=crop&q=80',
    history: {
      intro: '张家界因旅游建市，是中国最重要的旅游城市之一。1992年，由张家界国家森林公园等三大景区构成的武陵源风景名胜区被联合国教科文组织列入《世界自然遗产名录》。',
      timeline: [
        { year: '远古', text: '三亿多年前，张家界地区还是一片汪洋大海，经地壳运动逐渐抬升为陆地' },
        { year: '秦汉', text: '属黔中郡慈姑县，是土家族先民聚居之地' },
        { year: '明代', text: '张家界因"张"姓人家聚居而得名，"界"意为行政区划的边界' },
        { year: '1982', text: '张家界国家森林公园成立，成为中国第一个国家森林公园' },
        { year: '1992', text: '武陵源被联合国教科文组织列入世界自然遗产名录' },
        { year: '2004', text: '张家界地质公园入选首批世界地质公园' },
        { year: '2010', text: '电影《阿凡达》取景地，"哈利路亚山"闻名全球' },
      ],
      stories: [
        { title: '向王天子的传说', content: '相传土家族英雄向大坤自称向王天子，在此揭竿起义，带领土家族人民反抗压迫，留下了许多可歌可泣的故事。天子山因此得名。' },
        { title: '张良修仙的传说', content: '传说汉代名臣张良功成身退后，隐居张家界天门山修行，最终得道成仙。天门山的许多景点都与张良的传说有关。' },
      ]
    },
    food: {
      intro: '张家界美食融合了湘菜的辛辣和土家族的独特风味，以山珍野味和腊味最为出名。',
      items: [
        { name: '土家三下锅', desc: '张家界最负盛名的特色菜，将腊肉、豆腐、萝卜一锅炖煮，又称"合菜"，是土家族逢年过节必备的传统美食', icon: 'fa-fire-burner', tag: '必吃' },
        { name: '张家界腊肉', desc: '土家族传统腌制工艺，用松枝、茶壳熏制，肉质紧实，烟香浓郁，可直接蒸食或炒菜', icon: 'fa-bacon', tag: '传统' },
        { name: '葛根粉', desc: '取自野生葛根磨制而成的天然食品，清凉爽口，是张家界最具代表性的养生小吃', icon: 'fa-mug-hot', tag: '养生' },
        { name: '酸鱼肉', desc: '土家族传统发酵美食，将鲜鱼与糯米粉一同发酵，酸香独特，是土家人款待贵客的佳肴', icon: 'fa-fish', tag: '特色' },
        { name: '张家界莓茶', desc: '又名"藤茶"，生长于武陵山脉，富含黄酮类化合物，入口微苦回甘，被誉为"土家神茶"', icon: 'fa-leaf', tag: '特产' },
        { name: '石耳炖鸡', desc: '用武陵源高山石耳与土鸡慢炖，汤色金黄，鲜美滋补，是山珍中的上品', icon: 'fa-drumstick-bite', tag: '山珍' },
      ]
    },
    heritage: {
      intro: '张家界是土家族文化的核心区域，拥有丰富的非物质文化遗产，从音乐舞蹈到手工技艺，无不彰显着土家族人民的智慧与创造力。',
      items: [
        { name: '土家族摆手舞', desc: '土家族最古老的舞蹈，起源于祭祀仪式，以集体围圈摆手为特征，2008年被列入国家级非物质文化遗产名录', img: 'https://images.unsplash.com/photo-1504280398-module?w=400', icon: 'fa-people-group' },
        { name: '张家界阳戏', desc: '流行于湘西的地方戏曲剧种，唱腔高亢激越，表演粗犷豪放，已有300多年历史', icon: 'fa-masks-theater' },
        { name: '土家织锦（西兰卡普）', desc: '土家族女性世代传承的织锦技艺，色彩斑斓、图案精美，被誉为中国五大织锦之一，2006年入选国家级非遗', icon: 'fa-palette' },
        { name: '张家界泼水龙', desc: '每年农历六月土家族特有的祈福仪式，村民用竹木扎龙，泼水祈雨，热闹非凡', icon: 'fa-droplet' },
        { name: '土家族茅古斯舞', desc: '被称为中国舞蹈的"活化石"，模拟远古先民劳动与生活场景，是最原始的舞蹈形态之一', icon: 'fa-person-running' },
      ]
    },
    landmarks: {
      intro: '张家界的自然奇观举世闻名，石英砂岩峰林地貌在全球独一无二，是地球演化的天然博物馆。',
      items: [
        { name: '天门山·天门洞', desc: '世界最高天然穿山溶洞，海拔1260米，洞口宽28米，高131.5米，仿佛通天之门', img: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&auto=format&fit=crop&q=80', tag: '必打卡' },
        { name: '张家界国家森林公园', desc: '中国第一个国家森林公园，以独特的石英砂岩峰林地貌闻名于世，三千奇峰拔地而起', tag: '世界遗产' },
        { name: '天门山玻璃栈道', desc: '悬挂在1400米悬崖峭壁上的透明栈道，全长1600米，脚下万丈深渊，惊心动魄', tag: '极限体验' },
        { name: '百龙天梯', desc: '世界最高户外观光电梯，垂直高差335米，66秒直达峰顶，被誉为"天下第一梯"', tag: '世界之最' },
        { name: '金鞭溪', desc: '全长7.5公里的峡谷溪流，两岸翠峰夹峙，溪水清澈见底，被誉为"世界上最美丽的峡谷之一"', tag: '自然' },
        { name: '天子山', desc: '海拔1262米，因土家族领袖向大坤自称"天子"而得名，云海日出堪称一绝', tag: '观景' },
      ]
    },
    routes: {
      intro: '张家界景区面积广大，建议至少安排3-5天深度游览。以下是精选路线方案：',
      routes: [
        { name: '经典3日游', days: 3, difficulty: '适中', budget: '¥1500-2500',
          plan: [
            { day: 'Day 1', title: '张家界国家森林公园（金鞭溪 + 袁家界）', desc: '上午走金鞭溪步道，下午乘百龙天梯上袁家界，看"哈利路亚山"和天下第一桥' },
            { day: 'Day 2', title: '天子山 + 杨家界', desc: '游览天子山西海石林、贺龙公园，下午前往杨家界看天然长城和一步登天' },
            { day: 'Day 3', title: '天门山 + 天门洞', desc: '乘世界最长索道上天门山，走玻璃栈道，观天门洞，下午返回市区' },
          ]
        },
        { name: '深度5日游', days: 5, difficulty: '中等', budget: '¥2500-4000',
          plan: [
            { day: 'Day 1', title: '张家界国家森林公园·金鞭溪', desc: '金鞭溪全程漫步，沿途观赏金鞭岩、神鹰护鞭等景点' },
            { day: 'Day 2', title: '袁家界 + 天子山', desc: '乘百龙天梯，游览袁家界核心景区，下午前往天子山观日落' },
            { day: 'Day 3', title: '杨家界 + 大观台', desc: '探访杨家界天然长城、乌龙寨，下午大观台远眺西海峰林' },
            { day: 'Day 4', title: '天门山·天门洞 + 玻璃栈道', desc: '全天游览天门山，体验玻璃栈道，穿越天门洞' },
            { day: 'Day 5', title: '宝峰湖 + 黄龙洞', desc: '上午游览宝峰湖泛舟，下午探访黄龙洞地下奇观' },
          ]
        },
      ]
    }
  },
  sanya: {
    name: '三亚', sub: '海南 · 中国夏威夷', rating: '4.7', price: '¥1200',
    img: 'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=1200&auto=format&fit=crop&q=80',
    history: {
      intro: '三亚古称崖州，有2000多年的建置史。这里是中国最南端的热带滨海旅游城市，素有"东方夏威夷"之称。',
      timeline: [
        { year: '秦朝', text: '设象郡，三亚地区属象郡外徼' },
        { year: '隋朝', text: '设临振郡，三亚开始有正式的行政建置' },
        { year: '宋代', text: '设崖州，成为流放贬谪官员之地，苏轼曾谪居于此' },
        { year: '1987', text: '三亚升格为地级市，开始大规模旅游开发' },
        { year: '2020', text: '海南自由贸易港建设启动，三亚迎来新发展机遇' },
      ],
      stories: [
        { title: '鹿回头的传说', content: '相传一位黎族青年猎手追赶一只坡鹿至南海之滨，坡鹿无路可走，回头一望竟化为美丽的黎族少女。二人相恋结为夫妻，在此繁衍生息。三亚"鹿城"由此得名。' },
        { title: '天涯海角的故事', content: '古时崖州被视为天之尽头，流放至此的官员感叹"一去一万里，千之千不还"。清雍正年间，崖州知州程哲在巨石上刻下"天涯"二字，后来又有"海角"二字，遂成胜景。' },
      ]
    },
    food: {
      intro: '三亚美食以海鲜为主，融合了海南本土、粤菜和东南亚风味，热带水果更是四季不断。',
      items: [
        { name: '海鲜大餐', desc: '第一市场自选海鲜加工，龙虾、和乐蟹、基围虾、芒果螺现捞现做，鲜美至极', icon: 'fa-shrimp', tag: '必吃' },
        { name: '椰子鸡', desc: '用新鲜椰子水做汤底，加入文昌鸡慢炖，汤色清甜、鸡肉滑嫩，是三亚最火的一道菜', icon: 'fa-drumstick-bite', tag: '招牌' },
        { name: '海南粉', desc: '海南传统早餐，细粉配卤汁、花生、牛肉干、酸菜，鲜香微甜', icon: 'fa-bowl-food', tag: '早餐' },
        { name: '清补凉', desc: '海南经典甜品，椰奶打底，加入红豆、绿豆、薏米、芋头、西瓜等十余种配料，清凉解暑', icon: 'fa-ice-cream', tag: '甜品' },
        { name: '文昌鸡', desc: '海南四大名菜之首，皮薄肉嫩、骨酥味美，蘸料食用，原汁原味', icon: 'fa-drumstick-bite', tag: '名菜' },
        { name: '热带水果', desc: '芒果、菠萝蜜、莲雾、火龙果、百香果……四季不断，街头巷尾随处可见鲜切水果摊', icon: 'fa-apple-whole', tag: '水果' },
      ]
    },
    heritage: {
      intro: '三亚是黎族、苗族等少数民族聚居地，拥有独特的民族文化和非物质文化遗产。',
      items: [
        { name: '黎锦', desc: '黎族传统纺织技艺，已有3000多年历史，图案以人形纹和动物纹为主，是黎族历史文化的"活化石"', icon: 'fa-palette' },
        { name: '黎族打柴舞', desc: '黎族最古老的舞蹈之一，男女对舞，在竹竿分合间跳跃腾挪，节奏感极强', icon: 'fa-people-group' },
        { name: '三亚疍家渔歌', desc: '世代以船为家的疍家人传唱的渔歌，旋律悠扬，记录了海上人家的生活与情感', icon: 'fa-music' },
        { name: '苗族蜡染', desc: '苗族传统手工技艺，以蜂蜡绘制图案后浸染，蓝白相间，古朴典雅', icon: 'fa-paintbrush' },
      ]
    },
    landmarks: {
      intro: '三亚拥有中国最美丽的海岸线和热带雨林，是度假天堂的代名词。',
      items: [
        { name: '亚龙湾', desc: '"天下第一湾"，7公里银白色沙滩，海水清澈见底，是三亚最美海滩', tag: '海滩' },
        { name: '蜈支洲岛', desc: '中国的"马尔代夫"，海水能见度极高，是国内最佳潜水基地', tag: '潜水' },
        { name: '南山文化旅游区', desc: '108米南海观音像屹立海上，为世界最大的白衣观音造像', tag: '祈福' },
        { name: '天涯海角', desc: '浪漫代名词，"天涯""海角"刻石承载千年沧桑与诗意', tag: '地标' },
        { name: '亚特兰蒂斯水世界', desc: '亚洲顶级水上乐园，失落的空间水族馆，亲子度假首选', tag: '亲子' },
        { name: '呀诺达雨林', desc: '原始热带雨林景区，可体验溯溪、踏瀑戏水等雨林探险项目', tag: '雨林' },
      ]
    },
    routes: {
      intro: '三亚四季可游，11月至次年4月是最佳季节。推荐以下行程方案：',
      routes: [
        { name: '浪漫5日游', days: 5, difficulty: '轻松', budget: '¥3000-6000',
          plan: [
            { day: 'Day 1', title: '抵达三亚 · 亚龙湾', desc: '入住亚龙湾酒店，下午海滩日光浴，傍晚观日落' },
            { day: 'Day 2', title: '蜈支洲岛一日游', desc: '乘船前往蜈支洲岛，体验潜水、摩托艇等水上项目' },
            { day: 'Day 3', title: '南山文化 + 天涯海角', desc: '上午参观南山文化旅游区，下午游览天涯海角' },
            { day: 'Day 4', title: '呀诺达雨林探险', desc: '穿越热带雨林，体验溯溪、踏瀑戏水' },
            { day: 'Day 5', title: '免税购物 · 返程', desc: '上午海旅免税城购物，下午返程' },
          ]
        },
      ]
    }
  },
  xian: {
    name: '西安', sub: '陕西 · 丝绸之路起点', rating: '4.8', price: '¥650',
    img: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&auto=format&fit=crop&q=80',
    history: {
      intro: '西安，古称长安，是中国四大古都之一，有3100多年建城史和1100多年建都史，先后有13个王朝在此建都，是中国建都时间最长、朝代最多的都城。',
      timeline: [
        { year: '公元前11世纪', text: '西周定都镐京（今西安），开创建都之始' },
        { year: '公元前221年', text: '秦始皇统一六国，建都咸阳，修筑兵马俑' },
        { year: '公元前202年', text: '西汉定都长安，丝绸之路由此开启' },
        { year: '公元618年', text: '唐朝建都长安，成为当时世界最大城市，人口超百万' },
        { year: '652年', text: '大雁塔建成，玄奘法师在此翻译佛经' },
        { year: '2014年', text: '丝绸之路申遗成功，西安作为起点列入世界遗产' },
      ],
      stories: [
        { title: '张骞出使西域', content: '公元前138年，汉武帝派遣张骞出使西域，历经13年艰险，打通了东西方文明交流的通道——丝绸之路。长安成为丝绸之路的起点，也由此成为国际大都市。' },
        { title: '玄武门之变', content: '公元626年，秦王李世民在玄武门发动政变，击杀太子李建成和齐王李元吉，随后登基为唐太宗，开创了"贞观之治"的盛世局面。' },
      ]
    },
    food: {
      intro: '西安是联合国教科文组织认定的"世界美食之都"，面食种类繁多，小吃文化极为丰富。',
      items: [
        { name: '羊肉泡馍', desc: '西安第一名吃，掰馍入汤，配上粉丝、木耳、羊肉，汤浓馍筋，回味无穷', icon: 'fa-bowl-food', tag: '必吃' },
        { name: '肉夹馍', desc: '"中国汉堡"，腊汁肉配白吉馍，肉香馍酥，一口满足', icon: 'fa-burger', tag: '经典' },
        { name: '凉皮', desc: '西安消暑神器，面皮爽滑，配上辣椒油和醋汁，酸辣开胃', icon: 'fa-pepper-hot', tag: '解暑' },
        { name: 'biángbiáng面', desc: '一根面条宽如裤带，油泼辣子浇上去，"biáng"字写法复杂到需要口诀记忆', icon: 'fa-utensils', tag: '特色' },
        { name: '胡辣汤', desc: '西安人最爱的早餐，浓稠香辣，配上坨坨馍，是老陕的"灵魂早餐"', icon: 'fa-mug-hot', tag: '早餐' },
        { name: '甑糕', desc: '糯米与红枣层层叠放蒸制，软糯香甜，是关中地区传统甜食', icon: 'fa-cake-candles', tag: '甜品' },
      ]
    },
    heritage: {
      intro: '西安是中华文明的重要发祥地，非物质文化遗产底蕴深厚，千年传承不断。',
      items: [
        { name: '秦腔', desc: '中国最古老的戏剧之一，被誉为"百戏之祖"，高亢激昂，2006年入选国家级非遗', icon: 'fa-masks-theater' },
        { name: '西安鼓乐', desc: '始于唐代的宫廷音乐，被誉为"中国古代音乐的活化石"，2009年入选联合国非遗', icon: 'fa-drum' },
        { name: '皮影戏', desc: '起源于西汉，用牛皮雕刻人物在灯光下表演，是世界上最古老的"电影"', icon: 'fa-film' },
        { name: '蓝田玉雕', desc: '利用蓝田玉制作器物的传统技艺，"沧海月明珠有泪，蓝田日暖玉生烟"即咏此玉', icon: 'fa-gem' },
      ]
    },
    landmarks: {
      intro: '西安处处是历史，步步有故事，每一处古迹都诉说着千年过往。',
      items: [
        { name: '秦始皇兵马俑', desc: '世界第八大奇迹，8000余件真人大小的陶俑军阵，震撼人心', tag: '世界遗产' },
        { name: '西安古城墙', desc: '中国现存最完整的古代城垣，全长13.7公里，可骑行环游一周', tag: '地标' },
        { name: '大雁塔', desc: '玄奘法师翻译佛经之所，唐代建筑艺术的杰出代表', tag: '佛教' },
        { name: '华清宫', desc: '唐玄宗与杨贵妃的爱情故事发生地，温泉汤池至今仍存', tag: '历史' },
        { name: '大唐不夜城', desc: '盛唐风貌步行街，灯光璀璨，是夜游西安的必到之处', tag: '夜游' },
        { name: '回民街', desc: '西安美食地标，数百种小吃云集，是吃货的天堂', tag: '美食' },
      ]
    },
    routes: {
      intro: '西安及周边景点众多，建议至少安排4天时间，可搭配华山等周边景点。',
      routes: [
        { name: '文化4日游', days: 4, difficulty: '轻松', budget: '¥1500-2500',
          plan: [
            { day: 'Day 1', title: '兵马俑 + 华清宫', desc: '上午参观秦始皇兵马俑博物馆，下午游览华清宫' },
            { day: 'Day 2', title: '古城墙 + 回民街 + 大雁塔', desc: '上午骑行城墙，中午回民街品美食，下午参观大雁塔' },
            { day: 'Day 3', title: '陕西历史博物馆 + 大唐不夜城', desc: '上午逛陕历博，下午大唐芙蓉园，晚上大唐不夜城' },
            { day: 'Day 4', title: '华山一日游', desc: '乘高铁赴华山，索道上下，体验长空栈道' },
          ]
        },
      ]
    }
  },
  chengdu: {
    name: '成都', sub: '四川 · 天府之国', rating: '4.8', price: '¥520',
    img: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=1200&auto=format&fit=crop&q=80',
    history: {
      intro: '成都是中国十大古都之一，有"天府之国"美誉。2300多年来城名未改、城址未移，是中国唯一一座两千多年来名称和位置未曾改变的城市。',
      timeline: [
        { year: '公元前316年', text: '秦灭蜀，设蜀郡，张仪筑成都城' },
        { year: '公元前256年', text: '李冰修建都江堰，使成都平原"水旱从人"，天府之国由此而来' },
        { year: '公元221年', text: '刘备称帝建立蜀汉，定都成都' },
        { year: '唐代', text: '成都经济繁荣，有"扬一益二"之称，李白赞"九天开出一成都"' },
        { year: '2023年', text: '第31届世界大学生夏季运动会在成都举办' },
      ],
      stories: [
        { title: '都江堰的智慧', content: '战国时期蜀郡太守李冰父子主持修建都江堰水利工程，以"分水鱼嘴""飞沙堰""宝瓶口"三大工程巧妙分流岷江，至今仍在灌溉成都平原，是世界现存最古老且仍在使用的水利工程。' },
      ]
    },
    food: {
      intro: '成都是联合国教科文组织授予的"世界美食之都"，川菜博大精深，火锅更是城市的灵魂。',
      items: [
        { name: '成都火锅', desc: '麻辣鲜香的代名词，牛油锅底翻滚，涮毛肚、鸭肠、黄喉，越吃越上头', icon: 'fa-fire', tag: '必吃' },
        { name: '担担面', desc: '面条细薄，卤汁酥香，咸鲜微辣，一碗下肚意犹未尽', icon: 'fa-bowl-food', tag: '经典' },
        { name: '龙抄手', desc: '成都名小吃，皮薄馅嫩，汤鲜味美，红油味最为地道', icon: 'fa-utensils', tag: '小吃' },
        { name: '夫妻肺片', desc: '名称虽"肺"，实则以牛头皮、牛心、牛舌等为主料，麻辣鲜香', icon: 'fa-pepper-hot', tag: '名菜' },
        { name: '钟水饺', desc: '红油为底，甜辣味型独特，与北方水饺截然不同', icon: 'fa-plate-wheat', tag: '特色' },
        { name: '盖碗茶', desc: '成都慢生活的精髓，茶馆一坐一下午，掏耳朵、摆龙门阵', icon: 'fa-mug-hot', tag: '生活' },
      ]
    },
    heritage: {
      intro: '成都拥有丰富的非物质文化遗产，从蜀绣蜀锦到川剧变脸，无不体现巴蜀文化的独特魅力。',
      items: [
        { name: '川剧变脸', desc: '川剧绝技，瞬间变换脸谱，速度之快令人叹为观止，是蜀文化的标志性符号', icon: 'fa-masks-theater' },
        { name: '蜀绣', desc: '中国四大名绣之一，针法细腻、色彩艳丽，与苏绣、湘绣、粤绣齐名', icon: 'fa-palette' },
        { name: '蜀锦', desc: '"寸锦寸金"，中国四大名锦之首，成都因蜀锦又称"锦城"', icon: 'fa-scroll' },
        { name: '成都漆艺', desc: '始于商周，以雕花填彩见长，是国家级非物质文化遗产', icon: 'fa-paintbrush' },
      ]
    },
    landmarks: {
      intro: '成都有看不完的熊猫、逛不完的街巷、品不完的美食，每处都透着悠然自得的生活气息。',
      items: [
        { name: '大熊猫繁育研究基地', desc: '全球最佳大熊猫观赏地，可近距离观看国宝卖萌', tag: '必去' },
        { name: '宽窄巷子', desc: '清代古街改造的文化街区，宽巷子怀旧、窄巷子小资、井巷子市井', tag: '文化' },
        { name: '都江堰', desc: '世界文化遗产，2200年仍在使用的伟大水利工程', tag: '遗产' },
        { name: '武侯祠', desc: '中国唯一的君臣合祀祠庙，纪念诸葛亮与刘备的圣地', tag: '三国' },
        { name: '锦里古街', desc: '成都版"清明上河图"，小吃、手工艺品、川剧表演汇聚于此', tag: '逛街' },
        { name: '春熙路 + 太古里', desc: '成都时尚地标，潮流与古寺（大慈寺）的奇妙融合', tag: '购物' },
      ]
    },
    routes: {
      intro: '成都节奏悠闲，适合慢游。建议3-5天，周边可搭配都江堰、乐山大佛。',
      routes: [
        { name: '悠闲4日游', days: 4, difficulty: '轻松', budget: '¥1800-3000',
          plan: [
            { day: 'Day 1', title: '大熊猫基地 + 春熙路', desc: '上午看熊猫，下午逛春熙路、太古里，晚上吃火锅' },
            { day: 'Day 2', title: '宽窄巷子 + 武侯祠 + 锦里', desc: '上午漫步宽窄巷子，下午参观武侯祠，晚上逛锦里品小吃' },
            { day: 'Day 3', title: '都江堰 + 青城山', desc: '上午参观都江堰水利工程，下午游览青城山' },
            { day: 'Day 4', title: '人民公园 + 九眼桥', desc: '上午人民公园喝盖碗茶，下午文殊院，晚上九眼桥酒吧街' },
          ]
        },
      ]
    }
  },
  xizang: {
    name: '西藏', sub: '西藏自治区 · 世界屋脊', rating: '4.9', price: '¥2800',
    img: 'https://images.unsplash.com/photo-1603825491103-bd638b1873b0?w=1200&auto=format&fit=crop&q=80',
    history: {
      intro: '西藏是人类最后的净土，平均海拔4000米以上，被称为"世界屋脊"。藏文明延续千年，苯教与佛教交融，形成了独特的藏传佛教文化体系。',
      timeline: [
        { year: '公元前', text: '西藏地区出现部落联盟，苯教盛行' },
        { year: '7世纪', text: '松赞干布统一青藏高原，建立吐蕃王朝，迎娶文成公主' },
        { year: '8世纪', text: '莲花生大士入藏弘法，藏传佛教形成' },
        { year: '1642年', text: '五世达赖建立甘丹颇章政权' },
        { year: '1951年', text: '西藏和平解放' },
        { year: '2006年', text: '青藏铁路全线通车，"天路"通达拉萨' },
      ],
      stories: [
        { title: '文成公主入藏', content: '公元641年，唐太宗将文成公主嫁给松赞干布。公主携带佛像、经书、医典入藏，推动了藏汉文化交融，至今被藏族人民深切怀念。大昭寺就是为安置公主带去的释迦牟尼像而建。' },
      ]
    },
    food: {
      intro: '西藏美食以藏族传统饮食为主，高海拔的食材和烹饪方式充满高原特色。',
      items: [
        { name: '酥油茶', desc: '藏族人民每日必饮，以酥油、砖茶、盐打制而成，御寒提神', icon: 'fa-mug-hot', tag: '必喝' },
        { name: '糌粑', desc: '藏族主食，以青稞面加酥油茶拌匀捏成，方便快捷，营养丰富', icon: 'fa-bowl-food', tag: '主食' },
        { name: '藏式牦牛肉', desc: '高原特产，肉质紧实鲜美，风干牦牛肉是最佳伴手礼', icon: 'fa-drumstick-bite', tag: '特产' },
        { name: '甜茶', desc: '拉萨茶馆的灵魂饮品，红茶加牛奶和糖，温暖香甜', icon: 'fa-glass-water', tag: '日常' },
        { name: '藏面', desc: '以青稞面制作的汤面，配牦牛肉丁和葱花，是拉萨早餐标配', icon: 'fa-utensils', tag: '早餐' },
        { name: '青稞酒', desc: '藏族传统低度酒，以青稞发酵酿制，甘甜醇厚', icon: 'fa-wine-glass', tag: '酒饮' },
      ]
    },
    heritage: {
      intro: '藏文化是中华文明的重要组成部分，其宗教、艺术、医学体系独树一帜。',
      items: [
        { name: '藏戏', desc: '藏族传统戏剧，戴着面具表演，有600多年历史，2009年入选联合国非遗', icon: 'fa-masks-theater' },
        { name: '唐卡', desc: '藏族独特的宗教卷轴画，以矿植物颜料绘制，色彩历经百年不褪', icon: 'fa-palette' },
        { name: '藏医药', desc: '拥有2300多年历史的医学体系，《四部医典》是藏医经典，2018年入选联合国非遗', icon: 'fa-staff-snake' },
        { name: '藏族锅庄舞', desc: '藏族人民围着篝火载歌载舞的传统集体舞蹈，热情欢快', icon: 'fa-people-group' },
      ]
    },
    landmarks: {
      intro: '西藏的每一座山、每一面湖都是神灵的居所，壮美与神圣交织。',
      items: [
        { name: '布达拉宫', desc: '世界海拔最高的宫殿，藏传佛教圣地，拉萨的绝对地标', tag: '必去' },
        { name: '大昭寺', desc: '"先有大昭寺，后有拉萨城"，藏传佛教最神圣的寺庙', tag: '朝圣' },
        { name: '纳木错', desc: '西藏三大圣湖之一，海拔4718米，湖水蓝得令人窒息', tag: '圣湖' },
        { name: '珠穆朗玛峰', desc: '世界之巅，海拔8848.86米，人类终极的朝圣之地', tag: '极境' },
        { name: '冈仁波齐', desc: '藏传佛教、印度教、苯教共同认定的"世界中心"', tag: '神山' },
        { name: '八廓街', desc: '拉萨最古老的转经道，藏式建筑与信仰生活的交汇处', tag: '转经' },
      ]
    },
    routes: {
      intro: '西藏旅行需注意高反，建议先到拉萨适应1-2天再前往更高海拔地区。5-10月为最佳旅行季节。',
      routes: [
        { name: '拉萨+纳木错5日', days: 5, difficulty: '中高', budget: '¥3500-6000',
          plan: [
            { day: 'Day 1', title: '抵达拉萨 · 适应高反', desc: '到达后休息适应，可在八廓街散步，喝甜茶' },
            { day: 'Day 2', title: '布达拉宫 + 大昭寺', desc: '上午参观布达拉宫，下午朝拜大昭寺，八廓街转经' },
            { day: 'Day 3', title: '罗布林卡 + 色拉寺', desc: '上午游览夏宫罗布林卡，下午看色拉寺辩经' },
            { day: 'Day 4', title: '纳木错一日游', desc: '驱车前往纳木错圣湖，湖边远眺念青唐古拉山' },
            { day: 'Day 5', title: '哲蚌寺 · 返程', desc: '上午参观哲蚌寺，下午返程' },
          ]
        },
      ]
    }
  },
  lijiang: {
    name: '丽江', sub: '云南 · 纳西古都', rating: '4.6', price: '¥780',
    img: 'https://images.unsplash.com/photo-1537519646099-335112f03225?w=1200&auto=format&fit=crop&q=80',
    history: {
      intro: '丽江古城始建于宋末元初，已有800多年历史。纳西族先民在此创造了独特的东巴文化，丽江古城于1997年被列入世界文化遗产名录。',
      timeline: [
        { year: '南宋末年', text: '丽江古城始建，木氏土司开始统治丽江' },
        { year: '元代', text: '设丽江路，纳西族木氏土司世袭统治' },
        { year: '明代', text: '木氏土司扩建古城，万楼齐起，商贾云集' },
        { year: '1997年', text: '丽江古城被列入世界文化遗产名录' },
        { year: '2003年', text: '东巴古籍文献被列入世界记忆名录' },
      ],
      stories: [
        { title: '木氏土司的传奇', content: '纳西族木氏土司家族统治丽江长达470年（1253-1723年），历经22代。木氏土司崇尚汉文化，修建了宏伟的木府，被称为"南方的紫禁城"。' },
      ]
    },
    food: {
      intro: '丽江美食以纳西族特色菜和云南风味为主，食材取自高原，味道独特。',
      items: [
        { name: '纳西烤鱼', desc: '丽江最具代表性的美食，整条鱼腌制后炭火慢烤，外焦里嫩，香气四溢', icon: 'fa-fish', tag: '必吃' },
        { name: '丽江粑粑', desc: '纳西族传统面食，分甜咸两种，层层起酥，配酥油茶最地道', icon: 'fa-bread-slice', tag: '传统' },
        { name: '鸡豆凉粉', desc: '丽江独有小吃，用鸡豆磨制，热吃凉吃皆可，酸辣爽口', icon: 'fa-ice-cream', tag: '小吃' },
        { name: '腊排骨火锅', desc: '丽江人气最高的火锅，腊排骨熬汤，配时蔬菌菇，咸香鲜美', icon: 'fa-fire', tag: '招牌' },
        { name: '水性杨花', desc: '泸沽湖特有水生植物，茎叶滑嫩，清炒口感如莼菜', icon: 'fa-leaf', tag: '特色' },
        { name: '丽江雪茶', desc: '生长于4000米雪山的白色地衣类植物，泡茶清香回甘', icon: 'fa-mug-hot', tag: '茶饮' },
      ]
    },
    heritage: {
      intro: '纳西族创造了人类文化史上的奇迹——东巴文化，是活着的象形文字文明。',
      items: [
        { name: '东巴文', desc: '世界上唯一仍在使用的象形文字，被誉为"活着的象形文字"，纳西族祭司东巴用于书写经书', icon: 'fa-scroll' },
        { name: '纳西古乐', desc: '融合道教法事音乐、儒教典礼音乐和唐宋词牌曲调，被誉为"中国音乐的活化石"', icon: 'fa-music' },
        { name: '白沙壁画', desc: '明清时期纳西族壁画杰作，融合汉、藏、纳西三种绘画风格', icon: 'fa-palette' },
        { name: '纳西族东巴画', desc: '东巴祭司绘制的宗教画，色彩浓烈、造型古朴，充满神秘气息', icon: 'fa-paintbrush' },
      ]
    },
    landmarks: {
      intro: '丽江的自然与人文完美融合，雪山、古镇、湖泊构成了一幅绝美画卷。',
      items: [
        { name: '丽江古城', desc: '世界文化遗产，小桥流水、纳西古乐，是中国保存最完好的少数民族古城', tag: '遗产' },
        { name: '玉龙雪山', desc: '纳西族神山，海拔5596米，蓝月谷如梦似幻', tag: '必去' },
        { name: '泸沽湖', desc: '"东方女儿国"，摩梭人走婚文化举世闻名，湖水清澈如镜', tag: '秘境' },
        { name: '束河古镇', desc: '比大研古城更安静的茶马古镇，适合发呆和漫步', tag: '古镇' },
        { name: '虎跳峡', desc: '世界最深的峡谷之一，金沙江在此咆哮奔涌', tag: '探险' },
        { name: '木府', desc: '纳西族木氏土司的府邸，"南方的紫禁城"', tag: '历史' },
      ]
    },
    routes: {
      intro: '丽江适合慢游，建议至少4天，可搭配泸沽湖或香格里拉。',
      routes: [
        { name: '丽江+泸沽湖5日', days: 5, difficulty: '轻松', budget: '¥2000-3500',
          plan: [
            { day: 'Day 1', title: '丽江古城 · 木府', desc: '漫步古城，参观木府，晚上酒吧街感受丽江夜色' },
            { day: 'Day 2', title: '玉龙雪山 + 蓝月谷', desc: '乘索道登雪山，下午游览蓝月谷' },
            { day: 'Day 3', title: '前往泸沽湖', desc: '乘车前往泸沽湖，傍晚观日落，篝火晚会' },
            { day: 'Day 4', title: '泸沽湖环湖', desc: '乘猪槽船游湖，探访摩梭人村落，走婚桥' },
            { day: 'Day 5', title: '束河古镇 · 返程', desc: '返回丽江，逛束河古镇，下午返程' },
          ]
        },
      ]
    }
  }
};

/* ---------- 目的地分类映射（从 page-destinations.js 移入）---------- */
const DEST_CATEGORY_MAP = {
  // -------- 自然风光 --------
  xihu: 'nature', jiuzhaigou: 'nature', daocheng: 'nature', genie: 'nature',
  dangling: 'nature', cuokahu: 'nature', dali: 'nature', nanjiluo: 'nature',
  jingmai: 'nature', bingzhongluo: 'nature', nianhu: 'nature', chaka: 'nature',
  qinghaihu: 'nature', aikenquan: 'nature', mangya: 'nature', dongtai: 'nature',
  heidushan: 'nature', nianbaoyuze: 'nature', qiongkushitai: 'nature',
  xiaerxili: 'nature', jiangbulake: 'nature', dahaidao: 'nature', zhagana: 'nature',
  fanjingshan: 'nature', huangguoshu: 'nature', jiucaiping: 'nature', luodian: 'nature',
  guilin: 'nature', sanmenhai: 'nature', mingshi: 'nature', huangshan: 'nature',
  enshi: 'nature', luyuanping: 'nature', taishan: 'nature', zhangjiajie_park: 'nature',
  sanqingshan: 'nature', aershan: 'nature', yichun: 'nature',
  zhangjiajie: 'nature', xizang: 'nature',
  // -------- 文化古迹 --------
  gugong: 'culture', changcheng: 'culture', wuzhen: 'culture', songyang: 'culture',
  dunhuang: 'culture', hongcun: 'culture', yangchan: 'culture',
  wudangshan: 'culture', bingmayong: 'culture', budala: 'culture', zhouzhuang: 'culture',
  pingyao: 'culture', xian: 'culture', lijiang: 'culture',
  // -------- 海滨 --------
  gulangyu: 'beach', xiapu: 'beach', sisu: 'beach', changdao: 'beach', yalongwan: 'beach',
  sanya: 'beach',
  // -------- 城市 --------
  tangbuxiec: 'city', hongyadong: 'city', chengdu: 'city',
};

/** 合并 destDetailData + chinaDestinationsData，去重 */
function getAllDestinations() {
  const seen = new Set();
  const list = [];

  // 优先 destDetailData（数据更完整）
  for (const [key, d] of Object.entries(destDetailData)) {
    seen.add(key);
    list.push({ key, ...d, category: DEST_CATEGORY_MAP[key] || 'nature' });
  }
  // 补充 chinaDestinationsData 中不重复的
  if (typeof chinaDestinationsData !== 'undefined') {
    for (const [key, d] of Object.entries(chinaDestinationsData)) {
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ key, ...d, category: DEST_CATEGORY_MAP[key] || 'nature' });
      }
    }
  }
  return list;
}

/* ---------- 详情页交互 ---------- */
let currentDestKey = null;
let currentDestTab = 'history';

function openDestDetail(key) {
  const data = destDetailData[key] || (typeof chinaDestinationsData !== 'undefined' ? chinaDestinationsData[key] : null);
  if (!data) return;
  currentDestKey = key;
  currentDestTab = 'history';

  // 填充头部
  document.getElementById('destDetailHeroImg').src = data.img;
  document.getElementById('destDetailName').textContent = data.name;
  document.getElementById('destDetailSub').textContent = data.sub;
  document.getElementById('destDetailRating').innerHTML = `<i class="fa-solid fa-star"></i> ${data.rating}`;
  document.getElementById('destDetailPrice').textContent = `从 ${data.price}/人`;

  // 收藏按钮状态
  const favBtn = document.getElementById('destDetailFavBtn');
  const favs = getFavorites();
  const isFav = favs.some(f => f.name === data.name);
  favBtn.classList.toggle('active', isFav);
  favBtn.innerHTML = isFav ? '<i class="fa-solid fa-heart"></i> 已收藏' : '<i class="fa-regular fa-heart"></i> 收藏';

  // 重置Tab
  document.querySelectorAll('.dest-detail-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.dest-detail-tab[data-tab="history"]').classList.add('active');

  // 渲染内容
  renderDestTabContent(key, 'history');

  // 显示
  document.getElementById('destDetailOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDestDetail(e) {
  if (e && e.target !== document.getElementById('destDetailOverlay')) return;
  document.getElementById('destDetailOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function switchDestTab(btn, tab) {
  document.querySelectorAll('.dest-detail-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  currentDestTab = tab;
  renderDestTabContent(currentDestKey, tab);
}

function getDestData(key) {
  return destDetailData[key] || (typeof chinaDestinationsData !== 'undefined' ? chinaDestinationsData[key] : null);
}
function renderDestTabContent(key, tab) {
  const data = getDestData(key);
  if (!data) return;
  const body = document.getElementById('destDetailBody');
  const d = data[tab];
  if (!d) { body.innerHTML = '<p style="padding:40px;text-align:center;color:var(--clr-text-light)">暂无数据</p>'; return; }

  let html = '';

  if (tab === 'history') {
    html = `<div class="dest-tab-history">
      <p class="dest-tab-intro">${d.intro}</p>
      <div class="dest-timeline">
        ${d.timeline.map(t => `<div class="dest-timeline-item">
          <div class="dest-timeline-year">${t.year}</div>
          <div class="dest-timeline-dot"></div>
          <div class="dest-timeline-text">${t.text}</div>
        </div>`).join('')}
      </div>
      ${d.stories ? `<div class="dest-stories">
        <h3><i class="fa-solid fa-book-open"></i> 民间传说</h3>
        ${d.stories.map(s => `<div class="dest-story-card">
          <h4>${s.title}</h4>
          <p>${s.content}</p>
        </div>`).join('')}
      </div>` : ''}
    </div>`;
  }

  else if (tab === 'food') {
    html = `<div class="dest-tab-food">
      <p class="dest-tab-intro">${d.intro}</p>
      <div class="dest-food-grid">
        ${d.items.map(f => `<div class="dest-food-card">
          <div class="dest-food-icon"><i class="fa-solid ${f.icon}"></i></div>
          <div class="dest-food-info">
            <div class="dest-food-name">${f.name} ${f.tag ? `<span class="dest-food-tag">${f.tag}</span>` : ''}</div>
            <div class="dest-food-desc">${f.desc}</div>
          </div>
        </div>`).join('')}
      </div>
    </div>`;
  }

  else if (tab === 'heritage') {
    html = `<div class="dest-tab-heritage">
      <p class="dest-tab-intro">${d.intro}</p>
      <div class="dest-heritage-grid">
        ${d.items.map(h => `<div class="dest-heritage-card">
          <div class="dest-heritage-icon"><i class="fa-solid ${h.icon}"></i></div>
          <h4>${h.name}</h4>
          <p>${h.desc}</p>
        </div>`).join('')}
      </div>
    </div>`;
  }

  else if (tab === 'landmarks') {
    html = `<div class="dest-tab-landmarks">
      <p class="dest-tab-intro">${d.intro}</p>
      <div class="dest-landmark-grid">
        ${d.items.map(l => `<div class="dest-landmark-card">
          <div class="dest-landmark-tag">${l.tag}</div>
          <h4>${l.name}</h4>
          <p>${l.desc}</p>
        </div>`).join('')}
      </div>
    </div>`;
  }

  else if (tab === 'routes') {
    html = `<div class="dest-tab-routes">
      <p class="dest-tab-intro">${d.intro}</p>
      ${d.routes.map(r => `<div class="dest-route-card">
        <div class="dest-route-header">
          <h3>${r.name}</h3>
          <div class="dest-route-meta">
            <span><i class="fa-solid fa-calendar-days"></i> ${r.days}天</span>
            <span><i class="fa-solid fa-signal"></i> ${r.difficulty}</span>
            <span><i class="fa-solid fa-coins"></i> ${r.budget}</span>
          </div>
        </div>
        <div class="dest-route-plan">
          ${r.plan.map(p => `<div class="dest-route-day">
            <div class="dest-route-day-label">${p.day}</div>
            <div class="dest-route-day-content">
              <div class="dest-route-day-title">${p.title}</div>
              <div class="dest-route-day-desc">${p.desc}</div>
            </div>
          </div>`).join('')}
        </div>
      </div>`).join('')}
    </div>`;
  }

  body.innerHTML = html;
  body.scrollTop = 0;
}

function toggleDestDetailFav() {
  if (!currentDestKey) return;
  const data = getDestData(currentDestKey);
  if (!data) return;
  const r = FavManager.toggle(data.name, data.sub, data.img, data.price, data.rating);
  const favBtn = document.getElementById('destDetailFavBtn');
  if (favBtn) {
    favBtn.classList.toggle('active', r.added);
    favBtn.innerHTML = r.added
      ? '<i class="fa-solid fa-heart"></i> 已收藏'
      : '<i class="fa-regular fa-heart"></i> 收藏';
  }
}

function bookDestDetail() {
  if (!currentDestKey) return;
  const data = getDestData(currentDestKey);
  closeDestDetail();
  setTimeout(() => openBookingModal(data.name, data.sub, data.img, data.price, data.rating), 300);
}

function navDestDetail() {
  if (!currentDestKey) return;
  const data = getDestData(currentDestKey);
  closeDestDetail();
  navigateTo(data.name);
}
