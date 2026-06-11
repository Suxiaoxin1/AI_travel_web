/* ===========================================================
   WANDR 收藏 & 收藏管理器
   =========================================================== */

/* ---------- localStorage 封装 ---------- */
function getFavorites() {
  try { return JSON.parse(localStorage.getItem('wandr_favorites') || '[]'); }
  catch { return []; }
}
function saveFavorites(arr) {
  try { localStorage.setItem('wandr_favorites', JSON.stringify(arr)); }
  catch(e) { showToast('收藏保存失败，请检查浏览器存储空间'); }
}
function getBookings() {
  try { return JSON.parse(localStorage.getItem('wandr_bookings') || '[]'); }
  catch { return []; }
}
function saveBookings(arr) {
  try { localStorage.setItem('wandr_bookings', JSON.stringify(arr)); }
  catch(e) { showToast('预定保存失败，请检查浏览器存储空间'); }
}

/* ========== 收藏管理器（统一核心逻辑）========== */
const FavManager = {
  toggle(name, sub, img, price, rating) {
    let favs = getFavorites();
    const idx = favs.findIndex(f => f.name === name);
    if (idx === -1) {
      favs.push({ name, sub, img, price, rating, addedAt: new Date().toLocaleDateString() });
      saveFavorites(favs);
      this._syncUI(name, true);
      showToast(T.favAdded(name));
      return { added: true, name };
    } else {
      favs.splice(idx, 1);
      saveFavorites(favs);
      this._syncUI(name, false);
      showToast(T.favRemoved(name));
      return { added: false, name };
    }
  },

  isFav(name) { return getFavorites().some(f => f.name === name); },

  _syncUI(name, isActive) {
    refreshBadges();
    // renderFavList 在 shared.js 中定义，延迟调用时确保已加载
    if (typeof renderFavList === 'function') renderFavList();
    // 同步卡片按钮
    document.querySelectorAll('.dest-fav-btn').forEach(btn => {
      const nameAttr = btn.dataset.name || '';
      if (nameAttr === name) btn.classList.toggle('active', isActive);
    });
    // 详情面板按钮
    const detailBtn = document.getElementById('destDetailFavBtn');
    if (detailBtn && WANDR.state.currentDestKey) {
      // getDestData 在 shared.js 中定义，延迟调用时确保已加载
      if (typeof getDestData === 'function') {
        const data = getDestData(WANDR.state.currentDestKey);
        if (data && data.name === name) {
          detailBtn.classList.toggle('active', isActive);
          detailBtn.innerHTML = isActive
            ? '<i class="fa-solid fa-heart"></i> 已收藏'
            : '<i class="fa-regular fa-heart"></i> 收藏';
        }
      }
    }
  }
};

/* ---------- 徽标刷新 ---------- */
function refreshBadges() {
  const favs = getFavorites();
  const books = getBookings();
  // getDiaries 在 page-video.js 中定义，延迟调用时确保已加载
  const diaries = typeof getDiaries === 'function' ? getDiaries() : [];

  const favBadge = document.getElementById('favBadge');
  const bookBadge = document.getElementById('bookBadge');
  const diaryBadge = document.getElementById('diaryBadge');
  const favCount = document.getElementById('favCount');
  const bookCount = document.getElementById('bookCount');
  const diaryCount = document.getElementById('diaryCount');

  if (favBadge) { favBadge.textContent = favs.length; favBadge.style.display = favs.length ? 'inline-flex' : 'none'; }
  if (bookBadge) { bookBadge.textContent = books.length; bookBadge.style.display = books.length ? 'inline-flex' : 'none'; }
  if (diaryBadge) { diaryBadge.textContent = diaries.length; diaryBadge.style.display = diaries.length ? 'inline-flex' : 'none'; }
  if (favCount) favCount.textContent = favs.length;
  if (bookCount) bookCount.textContent = books.length;
  if (diaryCount) diaryCount.textContent = diaries.length;
}

/* ---------- 初始化已收藏按钮状态 ---------- */
function initFavButtons() {
  const favs = getFavorites();
  document.querySelectorAll('.dest-fav-btn').forEach(btn => {
    if (btn.dataset.action === 'toggleFavorite') {
      const name = btn.dataset.name;
      if (name && favs.some(f => f.name === name)) btn.classList.add('active');
    }
  });
}

/* ---------- 收藏切换 ---------- */
function toggleFavorite(btn, name, sub, img, price, rating) {
  const r = FavManager.toggle(name, sub, img, price, rating);
  btn.classList.toggle('active', r.added);
}

/* ---------- 从收藏移除 ---------- */
function removeFavorite(idx) {
  let favs = getFavorites();
  const name = favs[idx]?.name || '';
  favs.splice(idx, 1);
  saveFavorites(favs);
  FavManager._syncUI(name, false);
  showToast(T.removedFromFav);
}

// 挂载到命名空间
WANDR.FavManager = FavManager;
WANDR.getFavorites = getFavorites;
WANDR.saveFavorites = saveFavorites;
WANDR.getBookings = getBookings;
WANDR.saveBookings = saveBookings;
WANDR.refreshBadges = refreshBadges;
