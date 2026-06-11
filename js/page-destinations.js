// ============ 目的地分类标签 ============
const CATEGORY_LABELS = {
  nature: { name: '自然风光', icon: 'fa-mountain-sun' },
  culture: { name: '文化古迹', icon: 'fa-landmark' },
  beach:   { name: '海滨度假', icon: 'fa-umbrella-beach' },
  city:    { name: '城市探索', icon: 'fa-city' },
  recommended: { name: '热门推荐', icon: 'fa-fire' },
};

const RECOMMENDED_COUNT = 10;
const VISIBLE_COUNT = 6;

/** 生成随机评价数 */
function randomReviews(rating) {
  const num = parseFloat(rating);
  if (num >= 4.8) return (Math.floor(Math.random() * 20) + 8) + '万 评价';
  if (num >= 4.5) return (Math.floor(Math.random() * 25) + 5) + '万 评价';
  return (Math.floor(Math.random() * 15) + 3) + '万 评价';
}

/** 根据分类获取默认标签 */
function getDestTags(d) {
  const tagMap = {
    nature:  ['自然风光', '户外探险'],
    culture: ['文化历史', '人文之旅'],
    beach:   ['海滨度假', '阳光沙滩'],
    city:    ['城市风情', '美食打卡'],
  };
  return tagMap[d.category] || ['热门景点'];
}

/** 获取目的地 Unsplash 搜索图片 URL（无需 API Key） */
function getUnsplashFallbackUrl(destName) {
  const encoded = encodeURIComponent(destName + ' 旅行 风景');
  // 使用 Unsplash Source API 的 search 端点（免费，无限次）
  return `https://source.unsplash.com/600x400/?${encoded},travel,china,landscape`;
}

/** 生成单张目的地卡片 HTML */
function renderDestCard(d, index) {
  const tags = getDestTags(d);
  const tagsHtml = tags.map(t => `<span class="dest-tag">${t}</span>`).join('');
  const reviews = randomReviews(d.rating);
  const escName = d.name.replace(/'/g, "\\'");
  const escSub  = d.sub.replace(/'/g, "\\'");
  // 使用 Unsplash 动态回退（根据目的地名称搜索相关图片）
  const fallbackUrl = getUnsplashFallbackUrl(d.name);

  return `
    <div class="dest-card" data-category="${d.category}" data-key="${d.key}" data-action="openDestDetail" style="cursor:pointer;animation-delay:${index * 0.05}s">
      <div class="dest-img-wrap">
        <img src="${d.img}" alt="${d.name}" loading="lazy"
          onerror="WANDR.handleDestImgError(this, '${escName.replace(/'/g, "\\'")}', '${fallbackUrl.replace(/'/g, "\\'")}')">
        <div class="dest-overlay">
          <span class="dest-season"><i class="fa-regular fa-calendar"></i> ${d.isHot ? '全年可游' : '小众秘境'}</span>
        </div>
      </div>
      <div class="dest-info">
        <div class="dest-tags">${tagsHtml}</div>
        <h3>${d.name}</h3>
        <p>${d.sub}</p>
        <div class="dest-meta">
          <span class="dest-rating"><i class="fa-solid fa-star"></i> ${d.rating}</span>
          <span class="dest-reviews">${reviews}</span>
          <span class="dest-price">从 <strong>${d.price}</strong>/人</span>
        </div>
      </div>
      <button class="dest-btn" data-action="navigateTo" data-dest="${escName}" data-stop="true"><i class="fa-solid fa-location-dot"></i> 导航前往</button>
      <div class="dest-card-actions" data-stop="true">
        <button class="dest-fav-btn" data-action="toggleFavorite" data-name="${escName}" data-sub="${escSub}" data-img="${d.img}" data-price="${d.price}" data-rating="${d.rating}" title="收藏"><i class="fa-regular fa-heart"></i></button>
        <button class="dest-book-btn" data-action="openBookingModal" data-name="${escName}" data-sub="${escSub}" data-img="${d.img}" data-price="${d.price}" data-rating="${d.rating}"><i class="fa-solid fa-calendar-plus"></i> 立即预定</button>
      </div>
    </div>`;
}

/** 重新绑定滚动观察器 */
function rebindDestObserver() {
  if (typeof entryObserver === 'undefined') return;
  const grids = ['#destinationsGrid', '#destPageGrid'];
  grids.forEach(sel => {
    document.querySelectorAll(`${sel} .dest-card`).forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      entryObserver.observe(el);
    });
  });
}

/** 按分类分组渲染所有目的地 */
function renderDestinations(filter) {
  const grid = document.getElementById('destinationsGrid');
  if (!grid) return;

  // 渲染前显示骨架屏占位
  showGridSkeleton(grid, 6, 'dest');

  const allDests = getAllDestinations();

  // ---- 推荐模式：展示热门景点 ----
  if (filter === 'recommended') {
    const hotDests = allDests.filter(d => d.isHot);
    // 按 rating 降序，取前 RECOMMENDED_COUNT
    hotDests.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    const showDests = hotDests.slice(0, RECOMMENDED_COUNT);

    let html = `
      <div class="dest-category-group">
        <div class="dest-category-header">
          <i class="fa-solid ${CATEGORY_LABELS.recommended.icon}"></i>
          <span>${CATEGORY_LABELS.recommended.name}</span>
          <span class="dest-category-count">${showDests.length} 个热门景点</span>
        </div>
        <div class="dest-category-cards">
          ${showDests.map((d, i) => renderDestCard(d, i)).join('')}
        </div>
      </div>`;
    grid.innerHTML = html;
    rebindDestObserver();
    return;
  }

  // ---- 分类模式 ----
  const categories = ['nature', 'culture', 'beach', 'city'];
  const activeCategories = [filter];

  let html = '';

  for (const cat of activeCategories) {
    const catDests = allDests.filter(d => d.category === cat);
    if (catDests.length === 0) continue;

    const catLabel = CATEGORY_LABELS[cat];
    const visibleCards = catDests.slice(0, VISIBLE_COUNT);
    const hiddenCards = catDests.slice(VISIBLE_COUNT);
    const collapsedId = `collapse-${cat}`;

    html += `
      <div class="dest-category-group">
        <div class="dest-category-header">
          <i class="fa-solid ${catLabel.icon}"></i>
          <span>${catLabel.name}</span>
          <span class="dest-category-count">${catDests.length} 个目的地</span>
        </div>
        <div class="dest-category-cards">
          ${visibleCards.map((d, i) => renderDestCard(d, i)).join('')}
        </div>`;

    if (hiddenCards.length > 0) {
      html += `
        <div class="dest-category-collapse" id="${collapsedId}" style="display:none">
          ${hiddenCards.map((d, i) => renderDestCard(d, i)).join('')}
        </div>
        <button class="dest-expand-btn" data-collapse="${collapsedId}" data-action="toggleCategoryExpand">
          <span>展开更多</span>
          <span class="dest-expand-count">+${hiddenCards.length}</span>
          <i class="fa-solid fa-chevron-down"></i>
        </button>`;
    }

    html += `</div>`;
  }

  if (!html) html = '<p class="dest-empty-msg">暂无对应分类的目的地数据</p>';
  grid.innerHTML = html;
  rebindDestObserver();
}

/** 展开 / 折叠当前分类 */
function toggleCategoryExpand(btn) {
  const collapseId = btn.dataset.collapse;
  const collapse = document.getElementById(collapseId);
  if (!collapse) return;

  const isExpanded = collapse.style.display !== 'none';
  if (isExpanded) {
    collapse.style.display = 'none';
    btn.classList.remove('expanded');
    btn.querySelector('span:first-child').textContent = '展开更多';
    btn.querySelector('i').classList.replace('fa-chevron-up', 'fa-chevron-down');
  } else {
    collapse.style.display = '';
    // 仅对新展开的卡片应用入场动画，不重置已可见的卡片
    collapse.querySelectorAll('.dest-card').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      entryObserver.observe(el);
    });
    btn.classList.add('expanded');
    btn.querySelector('span:first-child').textContent = '收起';
    btn.querySelector('i').classList.replace('fa-chevron-down', 'fa-chevron-up');
  }
}

// ============ 目的地筛选按钮 ============
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderDestinations(btn.dataset.filter);
    document.getElementById('destinations').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ============ 中国标签 <-> 英文 Category 映射 ============
const CHINESE_FILTER_TO_CATEGORY = {
  '自然风光': 'nature',
  '历史文化': 'culture',
  '海岛度假': 'beach',
  '城市打卡': 'city',
  '亲子游': 'family',
};

// ============ Destinations 页面专属：渲染目的地网格 + 搜索/筛选 ============
(function initDestPage() {
  const grid = document.getElementById('destPageGrid');
  if (!grid) return; // 非 destinations 页面，跳过

  const emptyEl = document.getElementById('destPageEmpty');
  const searchInput = document.getElementById('destSearchInput');
  const filterTabs = document.querySelectorAll('#destFilterTabs .dest-filter-tab');
  let currentFilter = 'all';
  let currentSearch = '';

  function getDestsForPage() {
    // 使用 getAllDestinations 合并 destDetailData + chinaDestinationsData（58条）
    // 该函数在 page-destinations.js 同文件中已定义（共享逻辑区）
    return getAllDestinations();
  }

  function renderGrid() {
    const all = getDestsForPage();
    const kw = currentSearch.toLowerCase().trim();

    // 映射中文筛选标签到英文 category
    const categoryKey = CHINESE_FILTER_TO_CATEGORY[currentFilter] || currentFilter;

    const filtered = all.filter(d => {
      // 筛选逻辑
      const matchFilter = currentFilter === 'all'
        || d.category === categoryKey
        || (d.type === currentFilter)
        || (d.isHot && currentFilter === '热门')
        || (d.type === '热门' && currentFilter === '自然风光' && d.category === 'nature');

      // 搜索逻辑：名称 / 副标题 / sub 字段 / 类型
      const matchSearch = !kw
        || d.name?.toLowerCase().includes(kw)
        || d.sub?.toLowerCase().includes(kw)
        || d.type?.includes(kw)
        || d.history?.intro?.toLowerCase().includes(kw);

      return matchFilter && matchSearch;
    });

    if (!filtered.length) {
      grid.innerHTML = '';
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';

    // 按分类分组展示（和首页一样的布局）
    let html = '';
    if (currentFilter === 'all') {
      // 全部模式：按分类分组
      const categories = ['nature', 'culture', 'beach', 'city'];
      const categoryNames = {
        nature: { name: '自然风光', icon: 'fa-mountain-sun' },
        culture: { name: '文化古迹', icon: 'fa-landmark' },
        beach:   { name: '海滨度假', icon: 'fa-umbrella-beach' },
        city:    { name: '城市探索', icon: 'fa-city' },
      };

      for (const cat of categories) {
        const catDests = filtered.filter(d => d.category === cat);
        if (!catDests.length) continue;

        const catInfo = categoryNames[cat];
        html += `
          <div class="dest-category-group">
            <div class="dest-category-header">
              <div style="display:flex;align-items:center;gap:10px">
                <i class="fa-solid ${catInfo.icon}" style="color:var(--clr-primary)"></i>
                <h3 style="font-family:var(--font-serif);font-size:1.4rem;color:var(--clr-primary);margin:0">${catInfo.name}</h3>
              </div>
              <span class="dest-category-count">${catDests.length} 个目的地</span>
            </div>
            <div class="dest-category-cards">
              ${catDests.map((d, i) => renderDestCard(d, i)).join('')}
            </div>
          </div>`;
      }
    } else {
      // 单分类模式：列出所有匹配结果
      const catName = currentFilter;
      html += `
        <div class="dest-category-group">
          <div class="dest-category-header">
            <div style="display:flex;align-items:center;gap:10px">
              <i class="fa-solid fa-map-location-dot" style="color:var(--clr-primary)"></i>
              <h3 style="font-family:var(--font-serif);font-size:1.4rem;color:var(--clr-primary);margin:0">${catName}</h3>
            </div>
            <span class="dest-category-count">${filtered.length} 个目的地</span>
          </div>
          <div class="dest-category-cards">
            ${filtered.map((d, i) => renderDestCard(d, i)).join('')}
          </div>
        </div>`;
    }

    if (!html) html = '<p class="dest-empty-msg" style="text-align:center;padding:60px;color:var(--clr-text-light)">暂无对应分类的目的地数据</p>';
    grid.innerHTML = html;
    rebindDestObserver();

    // 重新绑定事件委托（因为 grid 内容被替换）
    // shared.js 的事件委托已在 document 级别统一处理，无需额外绑定
  }

  // 筛选标签点击
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderGrid();
    });
  });

  // 搜索输入（防抖 250ms）
  let _searchTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => {
      currentSearch = searchInput.value;
      renderGrid();
    }, 250);
  });

  // 初始渲染（DOMContentLoaded 后执行，确保 getAllDestinations 可用）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderGrid);
  } else {
    renderGrid();
  }
})();

// ============ 首页目的地初始渲染 ============
if (document.getElementById('destinations') && !document.getElementById('destPageGrid')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderDestinations('all'));
  } else {
    renderDestinations('all');
  }
}

