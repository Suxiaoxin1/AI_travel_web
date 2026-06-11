// ============ 用户分享 API 客户端 ============
const SHARES_API = (() => {
  if (window.location.port === '') return '/api';
  return 'http://localhost:3001/api';
})();

/** 获取所有分享 */
async function fetchShares(keyword = '') {
  try {
    const url = keyword
      ? `${SHARES_API}/shares?keyword=${encodeURIComponent(keyword)}`
      : `${SHARES_API}/shares`;
    const resp = await fetch(url);
    const json = await resp.json();
    return json.success ? json.shares : [];
  } catch (err) {
    console.warn('[Shares] 获取分享失败:', err.message);
    return getLocalShares();
  }
}

/** 创建分享 */
async function createShare(shareData) {
  try {
    const body = JSON.stringify(shareData);
    console.log('[createShare] 发送请求，body 大小:', (body.length / 1024).toFixed(1), 'KB');
    const resp = await fetch(`${SHARES_API}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    const json = await resp.json();
    console.log('[createShare] 服务器响应:', { status: resp.status, success: json.success });
    return json.success ? json.share : null;
  } catch (err) {
    console.warn('[createShare] 请求失败，降级到本地存储:', err.message);
    const share = { id: 'L' + Date.now(), ...shareData, date: formatDate(new Date()), likes: 0, comments: [], userLiked: false };
    const local = getLocalShares();
    local.unshift(share);
    saveLocalShares(local);
    return share;
  }
}

/** 点赞/取消点赞 */
async function toggleLikeShare(shareId) {
  try {
    await fetch(`${SHARES_API}/shares/${shareId}/like`, { method: 'POST' });
  } catch {
    updateLocalLike(shareId);
  }
}

/** 添加评论 */
async function addShareComment(shareId, comment) {
  try {
    const resp = await fetch(`${SHARES_API}/shares/${shareId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment)
    });
    const json = await resp.json();
    return json.success ? json.comment : null;
  } catch {
    const c = { id: 'c' + Date.now(), ...comment, date: formatDate(new Date()) };
    updateLocalComment(shareId, c);
    return c;
  }
}

// ============ 本地存储降级 ============
function getLocalShares() {
  try { return JSON.parse(localStorage.getItem('wandr_shares') || '[]'); }
  catch { return []; }
}
function saveLocalShares(shares) {
  localStorage.setItem('wandr_shares', JSON.stringify(shares.slice(0, 100)));
}
function updateLocalLike(sid) {
  const shares = getLocalShares();
  const s = shares.find(x => x.id === sid);
  if (s) { s.userLiked = !s.userLiked; s.likes += s.userLiked ? 1 : -1; saveLocalShares(shares); }
}
function updateLocalComment(sid, comment) {
  const shares = getLocalShares();
  const s = shares.find(x => x.id === sid);
  if (s) { s.comments = s.comments || []; s.comments.push(comment); saveLocalShares(shares); }
}

// ============ 分享状态 ============
let _allShares = [];
let _currentShareIndex = 0;
let _editingShareId = null;
let _shareRating = 0;
let _shareTags = [];
let _sharePhotos = [];
let _commentPhotoData = null;
let _lightboxPhotos = [];
let _lightboxIndex = 0;

// ============ 渲染分享列表 ============
async function loadShares(keyword = '') {
  const carousel = document.getElementById('sharesCarousel');
  if (!carousel) return;

  const track = document.getElementById('sharesCarouselTrack');
  if (track) track.innerHTML = '<div class="shares-empty"><i class="fa-solid fa-spinner fa-spin"></i><p>加载中...</p></div>';

  _allShares = await fetchShares(keyword);
  // 按 点赞数 + 评论数 降序排列，最多展示前 100 条
  _allShares.sort((a, b) =>
    ((b.likes || 0) + (b.comments?.length || 0)) -
    ((a.likes || 0) + (a.comments?.length || 0))
  );
  if (_allShares.length > 100) _allShares = _allShares.slice(0, 100);
  _currentShareIndex = 0;
  renderSharesCarousel(_allShares);
  // 同时渲染全部评价列表
  renderSharesList(_allShares);
  // 等待 DOM 渲染后自适应高度
  setTimeout(() => adjustCarouselHeight(), 100);
}

function buildShareCardHTML(s) {
  const isLiked = s.userLiked;
  const starsHtml = s.rating ? Array.from({ length: 5 }, (_, i) =>
    `<i class="fa-${i < s.rating ? 'solid' : 'regular'} fa-star"></i>`
  ).join('') : '';
  const tagsHtml = (s.tags || []).map(t => `<span class="share-card-tag">${escapeHtml(t)}</span>`).join('');
  const photos = s.photos || [];
  const photosHtml = photos.length ? renderSharePhotosHtml(photos, s.id) : '';
  const comments = s.comments || [];
  // 只展示第一条评论
  const firstComment = comments.length > 0 ? comments[comments.length - 1] : null;
  const commentCountMore = comments.length > 1 ? comments.length - 1 : 0;

  return `<div class="share-card" data-share-index>
    <div class="share-card-header">
      <div class="share-card-avatar">${(s.userName || '旅')[0]}</div>
      <div class="share-card-user-info">
        <div class="share-card-username">${escapeHtml(s.userName || '旅行者')}</div>
        <div class="share-card-date">${s.date || ''}</div>
      </div>
    </div>
    ${s.dest ? `<div class="share-card-dest"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(s.dest)}</div>` : ''}
    ${s.title ? `<div class="share-card-title">${escapeHtml(s.title)}</div>` : ''}
    <div class="share-card-content">${escapeHtml(s.content || '')}</div>
    ${photosHtml}
    ${starsHtml ? `<div class="share-card-stars">${starsHtml}</div>` : ''}
    ${tagsHtml ? `<div class="share-card-tags">${tagsHtml}</div>` : ''}
    <div class="share-card-actions">
      <button class="share-action-btn ${isLiked ? 'liked' : ''}" data-action="likeShare" data-sid="${s.id}">
        <span class="unliked-icon"><i class="fa-regular fa-heart"></i></span>
        <span class="liked-icon"><i class="fa-solid fa-heart"></i></span>
        <span>${s.likes || 0}</span>
      </button>
      <button class="share-action-btn" data-action="commentShare" data-sid="${s.id}">
        <i class="fa-regular fa-comment"></i> <span>${comments.length}</span>
      </button>
    </div>
    <div class="share-comments-section open" data-cid="${s.id}">
      ${firstComment ? `
        <div class="share-comment-item">
          <div class="share-comment-avatar">${(firstComment.userName || '匿')[0]}</div>
          <div class="share-comment-body">
            <span class="share-comment-user">${escapeHtml(firstComment.userName || '匿名用户')}</span>
            <div class="share-comment-text">${escapeHtml(firstComment.text)}</div>
            ${firstComment.photo ? `<img class="comment-photo-img" src="${firstComment.photo}" alt="评论图片" onclick="openLightbox(['${firstComment.photo}'], 0)" loading="lazy">` : ''}
          </div>
        </div>
      ` : `<div class="share-comment-item" style="color:var(--clr-muted);font-size:0.78rem;padding:4px 0;">暂无评论，来第一个发表吧~</div>`}
      ${commentCountMore > 0 ? `<div class="share-comment-more" onclick="event.stopPropagation();toggleShareAllComments('${s.id}')" style="cursor:pointer;font-size:0.76rem;color:var(--clr-primary);padding:4px 0 4px 38px;">查看全部 ${comments.length} 条评论 <i class="fa-solid fa-chevron-down"></i></div>
      <div class="share-comments-all" data-cid-all="${s.id}" style="display:none">
        ${comments.slice(0, -1).map(c => `
          <div class="share-comment-item">
            <div class="share-comment-avatar">${(c.userName || '匿')[0]}</div>
            <div class="share-comment-body">
              <span class="share-comment-user">${escapeHtml(c.userName || '匿名用户')}</span>
              <div class="share-comment-text">${escapeHtml(c.text)}</div>
              ${c.photo ? `<img class="comment-photo-img" src="${c.photo}" alt="评论图片" onclick="event.stopPropagation();openLightbox(['${c.photo}'], 0)" loading="lazy">` : ''}
            </div>
          </div>
        `).join('')}
      </div>` : ''}
      <div class="share-comment-input-wrap">
        <label class="comment-photo-btn" title="添加照片" data-sid="${s.id}" data-action="pickCommentPhoto">
          <i class="fa-solid fa-image"></i>
        </label>
        <input type="text" placeholder="写下你的评论..." data-sid="${s.id}">
        <button class="share-comment-submit" data-action="submitComment" data-sid="${s.id}">发送</button>
      </div>
    </div>
  </div>`;
}

function toggleShareAllComments(sid) {
  const allDiv = document.querySelector(`[data-cid-all="${sid}"]`);
  if (!allDiv) return;
  const btn = document.querySelector(`.share-comment-more[onclick*="${sid}"]`);
  const isHidden = allDiv.style.display === 'none' || !allDiv.style.display;
  allDiv.style.display = isHidden ? 'block' : 'none';
  if (btn) {
    btn.innerHTML = isHidden ? '收起评论 <i class="fa-solid fa-chevron-up"></i>' : `查看全部评论 <i class="fa-solid fa-chevron-down"></i>`;
  }
}

function renderSharesCarousel(shares) {
  const track = document.getElementById('sharesCarouselTrack');
  const bgCards = document.getElementById('carouselBgCards');
  const dots = document.getElementById('carouselDots');
  const counter = document.getElementById('carouselCounter');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  const stage = document.getElementById('sharesCarouselStage');

  if (!track || !stage) return;

  // 重置内联高度，让卡片自适应
  stage.style.height = '';
  track.style.height = '';

  if (!shares.length) {
    stage.innerHTML = `<div class="shares-empty" style="width:100%;">
      <i class="fa-solid fa-map-location-dot"></i>
      <p>还没有人分享旅行故事</p>
      <button class="btn-publish-share" data-action="openPublishModal" style="margin:0 auto"><i class="fa-solid fa-feather-pointed"></i> 成为第一个分享的人</button>
    </div>`;
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (dots) dots.innerHTML = '';
    if (counter) counter.textContent = '';
    if (bgCards) bgCards.innerHTML = '';
    return;
  }

  // 恢复导航按钮
  if (prevBtn) prevBtn.style.display = '';
  if (nextBtn) nextBtn.style.display = '';

  // 渲染背景卡片堆叠效果
  if (bgCards) {
    bgCards.innerHTML = `<div class="carousel-bg-card"></div><div class="carousel-bg-card"></div>`;
  }

  // 所有卡片横向排列
  track.innerHTML = shares.map(s => buildShareCardHTML(s)).join('');
  // scroll-snap 轮播：重置到当前卡片位置
  updateCarouselPosition(false);

  // 指示器圆点
  if (dots) {
    dots.innerHTML = shares.map((_, i) =>
      `<button class="carousel-dot${i === _currentShareIndex ? ' active' : ''}" data-action="carouselDot" data-index="${i}" aria-label="第${i+1}个分享"></button>`
    ).join('');
  }
  if (counter) {
    counter.textContent = `${_currentShareIndex + 1} / ${shares.length}`;
  }

  // 更新导航按钮状态
  updateNavButtons(shares.length);

  // 绑定 scroll 事件同步当前位置
  bindCarouselScrollEvents();
}

function updateCarouselPosition(animate = true) {
  const track = document.getElementById('sharesCarouselTrack');
  if (!track) return;
  // 使用 scrollTo，先临时关闭 smooth 行为以便即时跳转
  if (!animate) track.style.scrollBehavior = 'auto';
  track.scrollTo({ left: _currentShareIndex * track.clientWidth, behavior: animate ? 'smooth' : 'auto' });
  if (!animate) track.style.scrollBehavior = '';
  // 同步更新 UI 状态
  syncCarouselUI();
}

function goToShare(index) {
  const len = _allShares.length;
  if (len === 0) return;
  if (index < 0) index = 0;
  if (index >= len) index = len - 1;
  if (index === _currentShareIndex) return;

  _currentShareIndex = index;
  updateCarouselPosition(true);
}

function syncCarouselUI() {
  const dots = document.getElementById('carouselDots');
  if (dots) {
    dots.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === _currentShareIndex);
    });
  }
  const counter = document.getElementById('carouselCounter');
  if (counter) counter.textContent = `${_currentShareIndex + 1} / ${_allShares.length}`;
  updateNavButtons(_allShares.length);
  adjustCarouselHeight();
}

function nextShare() { goToShare(_currentShareIndex + 1); }
function prevShare() { goToShare(_currentShareIndex - 1); }

function updateNavButtons(total) {
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  if (prevBtn) {
    prevBtn.style.opacity = _currentShareIndex === 0 ? '0.3' : '1';
    prevBtn.style.pointerEvents = _currentShareIndex === 0 ? 'none' : '';
  }
  if (nextBtn) {
    nextBtn.style.opacity = _currentShareIndex >= total - 1 ? '0.3' : '1';
    nextBtn.style.pointerEvents = _currentShareIndex >= total - 1 ? 'none' : '';
  }
}

/** 根据当前活跃卡片的内容自适应调整轮播舞台高度 */
function adjustCarouselHeight() {
  const stage = document.getElementById('sharesCarouselStage');
  const track = document.getElementById('sharesCarouselTrack');
  if (!stage || !track || !_allShares.length) return;

  // 用 requestAnimationFrame 等 DOM 布局稳定后再测量
  requestAnimationFrame(() => {
    // 找到当前活跃的卡片
    const cards = track.querySelectorAll('.share-card');
    const activeCard = cards[_currentShareIndex];
    if (!activeCard) return;

    // 测量策略：创建一个不可见的 clone 来独立测量自然高度
    const clone = activeCard.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.visibility = 'hidden';
    clone.style.width = track.clientWidth + 'px';
    clone.style.height = 'auto';
    clone.style.flex = 'none';
    clone.style.animation = 'none';
    stage.appendChild(clone);

    // 读取 clone 的自然高度
    const naturalHeight = clone.scrollHeight;
    clone.remove();

    // 限制高度范围：220px ~ 620px，匹配 CSS min/max-height
    const clamped = Math.max(220, Math.min(620, naturalHeight));
    stage.style.height = clamped + 'px';
    track.style.height = clamped + 'px';
  });
}

// scroll 事件：同步 UI 指示器
let _scrollDebounceTimer = null;
function bindCarouselScrollEvents() {
  const track = document.getElementById('sharesCarouselTrack');
  if (!track) return;
  // 移除旧的 listener 防止重复
  track.removeEventListener('scroll', _trackScrollHandler);
  track.addEventListener('scroll', _trackScrollHandler, { passive: true });
}

function _trackScrollHandler() {
  const track = document.getElementById('sharesCarouselTrack');
  if (!track || !_allShares.length) return;
  clearTimeout(_scrollDebounceTimer);
  _scrollDebounceTimer = setTimeout(() => {
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    if (idx >= 0 && idx < _allShares.length && idx !== _currentShareIndex) {
      _currentShareIndex = idx;
      syncCarouselUI();
    }
  }, 80);
}

// ============ 全部评价列表渲染 ============
function renderSharesList(shares) {
  const list = document.getElementById('sharesList');
  const empty = document.getElementById('sharesEmpty');
  if (!list || !empty) return;

  if (!shares || !shares.length) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  list.innerHTML = shares.map(s => buildShareListItemHTML(s)).join('');
}

function buildShareListItemHTML(s) {
  const isLiked = s.userLiked;
  const starsHtml = s.rating ? Array.from({ length: 5 }, (_, i) =>
    `<i class="fa-${i < s.rating ? 'solid' : 'regular'} fa-star"></i>`
  ).join('') : '';
  const photos = s.photos || [];
  const firstPhoto = photos.length > 0 ? (typeof photos[0] === 'string' ? photos[0] : (photos[0].url || photos[0].dataUrl || '')) : '';
  const dateStr = s.date || '';

  return `<div class="share-list-card">
    <div class="share-list-card-avatar">${(s.userName || '旅')[0]}</div>
    <div class="share-list-card-body">
      <div class="share-list-card-header">
        <span class="share-list-card-user">${escapeHtml(s.userName || '旅行者')}</span>
        ${s.dest ? `<span class="share-list-card-dest"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(s.dest)}</span>` : ''}
        <span class="share-list-card-date">${dateStr}</span>
      </div>
      ${s.title ? `<div class="share-list-card-title">${escapeHtml(s.title)}</div>` : ''}
      <div class="share-list-card-content">${escapeHtml(s.content || '').substring(0, 150)}${(s.content || '').length > 150 ? '...' : ''}</div>
      ${firstPhoto ? `<div class="share-list-card-photo"><img src="${firstPhoto}" alt="旅行照片" loading="lazy" onclick="openLightbox(${JSON.stringify(photos.map(p => typeof p === 'string' ? p : (p.url || p.dataUrl || '')))}, 0)"></div>` : ''}
      ${starsHtml ? `<div class="share-list-card-stars">${starsHtml}</div>` : ''}
      ${(s.tags && s.tags.length) ? `<div class="share-list-card-tags">${s.tags.map(t => `<span class="share-list-card-tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
      <div class="share-list-card-actions">
        <button class="share-action-btn ${isLiked ? 'liked' : ''}" data-action="likeShare" data-sid="${s.id}">
          <span class="unliked-icon"><i class="fa-regular fa-heart"></i></span>
          <span class="liked-icon"><i class="fa-solid fa-heart"></i></span>
          <span>${s.likes || 0}</span>
        </button>
        <button class="share-action-btn" data-action="commentShare" data-sid="${s.id}">
          <i class="fa-regular fa-comment"></i> <span>${(s.comments || []).length}</span>
        </button>
      </div>
    </div>
  </div>`;
}

// ============ 照片渲染 ============
function renderSharePhotosHtml(photos, shareId) {
  if (!photos || !photos.length) return '';
  const count = photos.length;
  let colClass = count === 2 ? 'col2' : count === 1 ? 'col1' : '';
  const displayPhotos = photos.slice(0, 6);
  const urls = displayPhotos.map(p => typeof p === 'string' ? p : (p.url || p.dataUrl || ''));
  const extra = count > 6 ? count - 6 : 0;
  return `<div class="share-card-photos ${colClass}">${displayPhotos.map((p, i) => {
    const src = urls[i];
    return `<div class="share-card-photo" onclick="openLightbox(${JSON.stringify(urls)}, ${i})">
      <img src="${src}" alt="旅行照片${i+1}" loading="lazy">
      ${extra && i === 5 ? `<div class="photo-count-overlay">+${extra}</div>` : ''}
    </div>`;
  }).join('')}</div>`;
}

// ============ 灯箱 ============
function openLightbox(urls, index) {
  _lightboxPhotos = urls || [];
  _lightboxIndex = Math.max(0, Math.min(index, _lightboxPhotos.length - 1));
  showLightboxImage();
  document.getElementById('photoLightbox').classList.add('open');
}
function closeLightbox() {
  document.getElementById('photoLightbox').classList.remove('open');
}
function lightboxPrev() {
  if (_lightboxPhotos.length <= 1) return;
  _lightboxIndex = (_lightboxIndex - 1 + _lightboxPhotos.length) % _lightboxPhotos.length;
  showLightboxImage();
}
function lightboxNext() {
  if (_lightboxPhotos.length <= 1) return;
  _lightboxIndex = (_lightboxIndex + 1) % _lightboxPhotos.length;
  showLightboxImage();
}
function showLightboxImage() {
  document.getElementById('lightboxImg').src = _lightboxPhotos[_lightboxIndex] || '';
}

// ============ 发布分享弹窗 ============
function openPublishModal() {
  _editingShareId = null;
  _shareRating = 0;
  _shareTags = [];
  _sharePhotos = [];
  document.getElementById('shareModalTitle').textContent = '发布旅行分享';
  document.getElementById('shareDest').value = '';
  document.getElementById('shareTitle').value = '';
  document.getElementById('shareContent').value = '';
  document.getElementById('shareTagsList').innerHTML = '';
  document.getElementById('shareTagInput').value = '';
  document.getElementById('shareCharCount').textContent = '0/2000';
  document.getElementById('sharePhotoGrid').innerHTML = '';
  document.getElementById('sharePhotoInput').value = '';
  renderStarInput();
  document.getElementById('shareModalOverlay').classList.add('open');
}

function closeShareModal() {
  document.getElementById('shareModalOverlay').classList.remove('open');
}

function renderStarInput() {
  const container = document.getElementById('shareRatingInput');
  container.querySelectorAll('i').forEach((star, i) => {
    star.className = i < _shareRating ? 'fa-solid fa-star active' : 'fa-regular fa-star';
  });
}

// 星星点击
document.addEventListener('click', e => {
  const star = e.target.closest('#shareRatingInput i');
  if (star) {
    _shareRating = parseInt(star.dataset.star);
    renderStarInput();
  }
});

// 标签输入
const tagInput = document.getElementById('shareTagInput');
if (tagInput) {
  tagInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = tagInput.value.trim();
      if (val && _shareTags.length < 5 && !_shareTags.includes(val)) {
        _shareTags.push(val);
        renderTagsList();
        tagInput.value = '';
      }
    }
  });
}

function removeTag(index) {
  _shareTags.splice(index, 1);
  renderTagsList();
}

function renderTagsList() {
  const list = document.getElementById('shareTagsList');
  list.innerHTML = _shareTags.map((t, i) =>
    `<span class="share-tag-item">${escapeHtml(t)}<span class="share-tag-remove" onclick="removeTag(${i})">✕</span></span>`
  ).join('');
}

// 字数统计
document.getElementById('shareContent')?.addEventListener('input', e => {
  document.getElementById('shareCharCount').textContent = `${e.target.value.length}/2000`;
});

// 关闭弹窗（点击遮罩）
document.getElementById('shareModalOverlay')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeShareModal();
});

/** 提交分享 */
async function submitShare() {
  try {
    const destEl = document.getElementById('shareDest');
    const contentEl = document.getElementById('shareContent');
    if (!destEl || !contentEl) {
      console.error('[submitShare] 表单元素未找到');
      showToast('系统错误，请刷新页面重试');
      return;
    }
    const dest = destEl.value.trim();
    const content = contentEl.value.trim();
    if (!dest || !content) {
      showToast('请至少填写目的地和分享内容');
      return;
    }

    const btn = document.querySelector('.btn-submit-share');
    if (!btn) {
      console.error('[submitShare] 提交按钮未找到');
      showToast('系统错误，请刷新页面重试');
      return;
    }
    btn.disabled = true;
    btn.textContent = '发布中...';

    const shareData = {
      dest,
      title: document.getElementById('shareTitle')?.value?.trim() || '',
      content,
      rating: _shareRating,
      tags: _shareTags,
      photos: _sharePhotos,
      userName: localStorage.getItem('wandr_username') || '旅行者' + Math.floor(Math.random() * 9000 + 1000)
    };

    console.log('[submitShare] 正在发布分享...', { dest, photosCount: _sharePhotos.length });

    const result = await createShare(shareData);
    
    // 重置照片数据
    _sharePhotos = [];
    
    if (result) {
      showToast('分享发布成功！🎉');
      closeShareModal();
      await loadShares();
    } else {
      showToast('发布失败，请重试');
    }
    btn.disabled = false;
    btn.textContent = '发布分享';
  } catch (err) {
    console.error('[submitShare] 发布异常:', err);
    showToast('发布失败：' + (err.message || '未知错误'));
    const btn = document.querySelector('.btn-submit-share');
    if (btn) {
      btn.disabled = false;
      btn.textContent = '发布分享';
    }
  }
}

/** 点赞 */
async function likeShare(el, sid) {
  const btn = el.closest('.share-action-btn');
  const isLiked = btn.classList.contains('liked');
  const countSpan = btn.querySelector('span:last-child');
  const currentCount = parseInt(countSpan.textContent) || 0;

  // 乐观更新
  btn.classList.toggle('liked');
  countSpan.textContent = isLiked ? Math.max(0, currentCount - 1) : currentCount + 1;

  await toggleLikeShare(sid);

  // 更新本地数据
  const share = _allShares.find(s => s.id === sid);
  if (share) {
    share.userLiked = !isLiked;
    share.likes = isLiked ? Math.max(0, (share.likes || 0) - 1) : (share.likes || 0) + 1;
  }
}

/** 聚焦评论输入框 */
function toggleComments(el, sid) {
  const card = el.closest('.share-card');
  const section = card.querySelector('.share-comments-section');
  if (section) {
    if (!section.classList.contains('open')) section.classList.add('open');
    section.querySelector('input')?.focus();
  }
}

/** 提交评论 */
async function submitComment(el, sid) {
  const card = el.closest('.share-card');
  const input = card.querySelector(`.share-comment-input-wrap input[data-sid="${sid}"]`);
  const text = input?.value.trim();
  if (!text && !_commentPhotoData) return;

  input.disabled = true;
  el.disabled = true;
  const comment = {
    userName: localStorage.getItem('wandr_username') || '旅行者' + Math.floor(Math.random() * 9000 + 1000),
    text,
    photo: _commentPhotoData || ''
  };

  const result = await addShareComment(sid, comment);
  if (result) {
    // 更新本地数据
    const share = _allShares.find(s => s.id === sid);
    if (share) {
      share.comments = share.comments || [];
      share.comments.push(result);
    }
    _commentPhotoData = null;
    // 重新渲染轮播（保持当前位置），更新评论预览
    renderSharesCarousel(_allShares);
    setTimeout(() => adjustCarouselHeight(), 100);
  }
  // 重置按钮状态（需要重新查找，因为 DOM 已重建）
  const newInput = document.querySelector(`.share-comment-input-wrap input[data-sid="${sid}"]`);
  if (newInput) newInput.disabled = false;
  const newBtn = document.querySelector(`.share-comment-submit[data-sid="${sid}"]`);
  if (newBtn) newBtn.disabled = false;
}

/** 搜索 */
function clearSharesSearch() {
  const input = document.getElementById('sharesSearch');
  if (!input) return;
  input.value = '';
  const clearBtn = document.getElementById('sharesSearchClear');
  if (clearBtn) clearBtn.style.display = 'none';
  loadShares();
  input.focus();
}

// 搜索输入监听
document.getElementById('sharesSearch')?.addEventListener('input', e => {
  const val = e.target.value.trim();
  const clearBtn = document.getElementById('sharesSearchClear');
  if (clearBtn) clearBtn.style.display = val ? 'flex' : 'none';
});
document.getElementById('sharesSearch')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    loadShares(e.target.value.trim());
  }
});

// ============ 照片处理 ============
document.getElementById('sharePhotoInput')?.addEventListener('change', e => {
  const files = Array.from(e.target.files || []);
  const remaining = 6 - _sharePhotos.length;
  const toProcess = files.slice(0, remaining);
  toProcess.forEach(file => {
    if (file.size > 5 * 1024 * 1024) { showToast('单张照片不能超过5MB'); return; }
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => {
      _sharePhotos.push(ev.target.result);
      renderPhotoGrid();
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
});
function renderPhotoGrid() {
  const grid = document.getElementById('sharePhotoGrid');
  grid.innerHTML = _sharePhotos.map((src, i) => `
    <div class="share-photo-thumb">
      <img src="${src}" alt="照片${i+1}">
      <button class="share-photo-remove" onclick="removeSharePhoto(${i})">✕</button>
    </div>
  `).join('');
}
function removeSharePhoto(index) {
  _sharePhotos.splice(index, 1);
  renderPhotoGrid();
}

// ============ 评论照片 ============
let _photoInputEl = null;
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action="pickCommentPhoto"]');
  if (!btn) return;
  _photoInputEl = btn;
  const fid = 'commentPhotoInput_' + btn.dataset.sid;
  let fileInput = document.getElementById(fid);
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.id = fid;
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleCommentPhotoPicked);
    document.body.appendChild(fileInput);
  }
  fileInput.value = '';
  fileInput.click();
});
function handleCommentPhotoPicked(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('照片不能超过5MB'); return; }
  const reader = new FileReader();
  reader.onload = ev => {
    _commentPhotoData = ev.target.result;
    if (_photoInputEl) {
      _photoInputEl.classList.add('has-photo');
      _photoInputEl.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    }
  };
  reader.readAsDataURL(file);
}

// ============ 灯箱事件 ============
document.getElementById('photoLightbox')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeLightbox();
});
document.addEventListener('keydown', e => {
  if (!document.getElementById('photoLightbox').classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') lightboxPrev();
  if (e.key === 'ArrowRight') lightboxNext();
});

// ============ 页面初始化 ============
document.addEventListener('DOMContentLoaded', () => {
  // 仅在本页运作
  if (!document.getElementById('sharesCarousel')) return;
  loadShares();
  console.log('[Reviews] 口碑评价页面初始化完成');
});
