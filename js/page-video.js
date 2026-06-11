// ============ 旅行日记（DeepSeek 驱动）============
let _diaryPhotos = [];
let _currentDiaryHTML = '';
let _isDiaryGenerating = false;
let _diaryFinalImageUrl = '';  // html2canvas 合成后的最终图片 dataURL

// ---- 初始化：表单字段同步 + 照片上传 ----
function syncDiaryFields() {
  const titleEl = document.getElementById('diaryTitle');
  const contentEl = document.getElementById('diaryContent');
  const tagsEl = document.getElementById('diaryTags');
  const destInput = document.getElementById('diaryDestInput');
  const moodInput = document.getElementById('diaryMoodInput');
  if (titleEl && destInput) titleEl.value = destInput.value.trim();
  if (contentEl && moodInput) contentEl.value = moodInput.value.trim();
  // tags 自动从地点提取关键词
  if (tagsEl && destInput) {
    const v = destInput.value.trim();
    tagsEl.value = v ? v.replace(/[，,]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 5).join(' ') : '';
  }
}

// 实时同步
const diaryDestInput = document.getElementById('diaryDestInput');
const diaryMoodInput = document.getElementById('diaryMoodInput');
if (diaryDestInput) diaryDestInput.addEventListener('input', syncDiaryFields);
if (diaryMoodInput) diaryMoodInput.addEventListener('input', syncDiaryFields);
syncDiaryFields();

const diaryPhotoInput = document.getElementById('diaryPhotoInput');
if (diaryPhotoInput) {
  diaryPhotoInput.addEventListener('change', e => {
    const grid = document.getElementById('diaryPhotoGrid');
    if (!grid) return;
    grid.innerHTML = '';
    _diaryPhotos = [];
    Array.from(e.target.files).slice(0, 12).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        _diaryPhotos.push(ev.target.result);
        const img = document.createElement('img');
        img.src = ev.target.result;
        img.className = 'diary-photo-thumb';
        grid.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
    if (e.target.files.length > 0) showToast(`已选择 ${Math.min(e.target.files.length, 12)} 张照片`);
  });
}

// 日记风格选择
document.querySelectorAll('[data-diary-style]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-diary-style]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

function selectDiaryStyle(el) {
  document.querySelectorAll('[data-diary-style]').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

function getSelectedDiaryStyle() {
  const active = document.querySelector('[data-diary-style].active');
  return active ? active.dataset.diaryStyle : 'fresh';
}

/**
 * 核心：DeepSeek 生成旅行日记
 * 流程：收集数据 → 调后端代理 DeepSeek → 获得 HTML → 替换照片占位 → html2canvas 合成图片
 */
async function generateDiaryAI() {
  if (_isDiaryGenerating) return;
  syncDiaryFields();

  const title = document.getElementById('diaryTitle')?.value.trim();
  const content = document.getElementById('diaryContent')?.value.trim();
  if (!title && !content) { showToast(T.needAiContent); return; }

  const deepseekKey = getApiKey();
  if (!deepseekKey) { showToast(T.aiNeedDeepSeekKey); return; }

  _isDiaryGenerating = true;
  _diaryFinalImageUrl = '';

  // —— UI 进入加载状态 ——
  const placeholder = document.getElementById('diaryPlaceholder');
  const generating = document.getElementById('diaryGenerating');
  const templateResult = document.getElementById('diaryResult');
  const aiResult = document.getElementById('diaryAIResult');
  const aiImage = document.getElementById('diaryAIImage');
  const aiLoading = document.getElementById('diaryAILoading');
  const aiError = document.getElementById('diaryAIError');
  const resultActions = document.getElementById('diaryResultActions');

  [placeholder, generating, templateResult, resultActions, aiError].forEach(el => el && (el.style.display = 'none'));
  if (aiImage) aiImage.style.display = 'none';
  if (aiResult) aiResult.style.display = 'flex';
  if (aiLoading) aiLoading.style.display = 'flex';

  document.getElementById('btnGenerateDiary')?.setAttribute('disabled', '');
  document.getElementById('btnGenerateDiaryAI')?.setAttribute('disabled', '');

  // 同时初始化生成进度条（用于后续合成阶段）
  if (generating) generating.style.display = 'none';

  // —— 收集表单数据 ——
  const dateVal = document.getElementById('diaryDate')?.value;
  const dateStr = dateVal || formatDate(new Date());
  const style = getSelectedDiaryStyle();
  const tagsStr = document.getElementById('diaryTags')?.value.trim();
  const tags = tagsStr ? tagsStr.split(/\s+/).filter(t => t) : [];

  const API_BASE = window.location.port === '' ? '/api' : 'http://localhost:3001/api';

  try {
    // —— 阶段 1：调用 DeepSeek 生成日记 HTML ——
    updateGenStatus('正在连接 DeepSeek 设计手帐布局...', 20);

    const resp = await fetch(`${API_BASE}/openai/generate-diary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: deepseekKey,
        title: title || '旅行日记',
        date: dateStr,
        style: style,
        content: content,
        tags: tags,
        photoCount: _diaryPhotos.length,
      }),
    });

    const result = await resp.json();
    if (!result.success) throw new Error(result.error || 'DeepSeek 生成失败');

    // —— 阶段 2：替换照片占位 ——
    updateGenStatus('正在嵌入旅行照片...', 50);

    let diaryHTML = result.html;
    // 替换 GPT 返回的照片 src 占位符 {{PHOTO_N}} 为真实图片 URL
    // GPT 应已生成完整的照片 HTML（含相框、旋转、阴影等样式），只把 src 留成占位符
    for (let i = 0; i < _diaryPhotos.length; i++) {
      const placeholder = new RegExp(`\\{\\{PHOTO_${i}\\}\\}`, 'g');
      diaryHTML = diaryHTML.replace(placeholder, _diaryPhotos[i]);
    }

    // 包裹完整结构
    _currentDiaryHTML = `<div class="diary-page" id="diaryPage">${diaryHTML}</div>`;

    // —— 阶段 3：离屏渲染 canvas 并合成图片（避免布局闪烁）——
    updateGenStatus('正在合成最终手帐图片...', 70);

    // 创建一个离屏容器，不影响页面布局
    // 不设宽度上限，让内容完全展开，避免任何 overflow:hidden 导致裁剪
    const offScreen = document.createElement('div');
    offScreen.style.cssText = 'position:fixed;left:-9999px;top:0;width:auto;overflow:visible;z-index:-1;';
    offScreen.innerHTML = _currentDiaryHTML;
    document.body.appendChild(offScreen);

    // 等待图片加载
    await new Promise(r => setTimeout(r, 500));

    // —— 阶段 4：html2canvas 渲染 ——
    updateGenStatus('正在渲染高清晰度图片...', 85);

    const page = offScreen.querySelector('#diaryPage') || offScreen.firstElementChild;
    if (!page) {
      document.body.removeChild(offScreen);
      throw new Error('HTML 渲染失败');
    }

    // 等待所有图片加载完成
    await Promise.all(
      Array.from(page.querySelectorAll('img'))
        .filter(img => !img.complete)
        .map(img => new Promise(r => { img.onload = img.onerror = r; }))
    );

    // 强制所有子元素 overflow:visible，防止 DeepSeek 生成的内部容器裁剪内容
    const originalOverflows = new Map();
    originalOverflows.set(page, page.style.overflow);
    page.style.overflow = 'visible';
    page.querySelectorAll('*').forEach(el => {
      const computed = window.getComputedStyle(el);
      if (computed.overflow !== 'visible' || computed.overflowX !== 'visible' || computed.overflowY !== 'visible') {
        originalOverflows.set(el, el.style.cssText);
        el.style.overflow = 'visible';
        el.style.overflowX = 'visible';
        el.style.overflowY = 'visible';
      }
    });

    const compositeCanvas = await html2canvas(page, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    });

    // 恢复原始 overflow 样式
    originalOverflows.forEach((orig, el) => {
      if (orig !== undefined && orig !== '') el.style.overflow = orig;
      else el.style.removeProperty('overflow');
    });

    _diaryFinalImageUrl = compositeCanvas.toDataURL('image/png');

    // 清理离屏容器
    document.body.removeChild(offScreen);

    // —— 阶段 5：显示最终结果 ——
    updateGenStatus('生成完成！', 100);

    if (aiLoading) aiLoading.style.display = 'none';
    if (aiResult) aiResult.style.display = 'flex';
    if (aiImage) {
      aiImage.src = _diaryFinalImageUrl;
      aiImage.style.display = 'block';
    }
    if (resultActions) resultActions.style.display = 'flex';
    showToast(T.deepseekDiaryGenerated);

  } catch (err) {
    console.error('[AI Diary]', err);
    if (aiLoading) aiLoading.style.display = 'none';
    if (aiError) aiError.style.display = 'flex';
    const errMsg = document.getElementById('diaryAIErrorMsg');
    if (errMsg) {
      const detail = err.message || '未知错误';
      if (detail.includes('Failed to fetch') || detail.includes('NetworkError')) {
        errMsg.textContent = '无法连接后端服务，请确认 server 已启动（npm run dev）';
      } else if (detail.includes('ENOTFOUND') || detail.includes('ECONNREFUSED') || detail.includes('ECONNRESET') || detail.includes('无法连接')) {
        errMsg.textContent = '无法连接 DeepSeek API，请检查网络（DeepSeek 国内可直接访问，无需代理）';
      } else if (detail.includes('401') || detail.includes('auth') || detail.includes('Incorrect API key')) {
        errMsg.textContent = 'DeepSeek API Key 无效，请检查是否正确配置';
      } else if (detail.includes('429')) {
        errMsg.textContent = 'API 请求过于频繁，请稍后再试';
      } else if (detail.includes('insufficient') || detail.includes('quota') || detail.includes('billing')) {
        errMsg.textContent = 'DeepSeek API 额度不足，请检查账户余额（新用户赠送 10M tokens）';
      } else if (detail.includes('timeout') || detail.includes('超时')) {
        errMsg.textContent = '请求超时，AI 响应较慢，请稍后重试';
      } else {
        errMsg.textContent = detail.length > 150 ? detail.slice(0, 150) + '...' : '生成失败：' + detail;
      }
    }
    showToast(T.deepseekDiaryGenFailed);
  } finally {
    _isDiaryGenerating = false;
    document.getElementById('btnGenerateDiary')?.removeAttribute('disabled');
    document.getElementById('btnGenerateDiaryAI')?.removeAttribute('disabled');
  }
}

/** 更新生成状态文字和进度条 */
function updateGenStatus(text, progress) {
  const genStep = document.getElementById('diaryGenStep');
  const genText = document.getElementById('diaryGenText');
  const genBar = document.getElementById('diaryGenBar');
  if (genStep) genStep.textContent = text;
  if (genText) genText.textContent = `DeepSeek 正在为你设计旅行手帐... ${progress}%`;
  if (genBar) genBar.style.width = progress + '%';
}

// ---------- 保留模板模式（快速生成用）----------
function generateDiary() {
  if (_isDiaryGenerating) return;
  syncDiaryFields();
  const title = document.getElementById('diaryTitle')?.value.trim();
  if (!title) { showToast(T.needTitle); return; }
  if (_diaryPhotos.length === 0) { showToast(T.needPhotos); return; }

  _isDiaryGenerating = true;
  _diaryFinalImageUrl = '';

  const placeholder = document.getElementById('diaryPlaceholder');
  const generating = document.getElementById('diaryGenerating');
  const result = document.getElementById('diaryResult');
  const aiResult = document.getElementById('diaryAIResult');
  const resultActions = document.getElementById('diaryResultActions');

  if (placeholder) placeholder.style.display = 'none';
  if (result) result.style.display = 'none';
  if (aiResult) aiResult.style.display = 'none';
  if (resultActions) resultActions.style.display = 'none';
  if (generating) generating.style.display = 'flex';

  // 简单拼贴渲染
  const dateVal = document.getElementById('diaryDate')?.value;
  const dateStr = dateVal || formatDate(new Date());
  const content = document.getElementById('diaryContent')?.value.trim() || '';
  const tagsStr = document.getElementById('diaryTags')?.value.trim() || '';
  const tags = tagsStr ? tagsStr.split(/\s+/).filter(t => t) : [];
  const style = getSelectedDiaryStyle();
  const photosHTML = _diaryPhotos.map(src => `<div class="diary-photo"><img src="${src}" alt=""></div>`).join('');
  const tagsHTML = tags.map(t => `<span class="diary-tag">${escapeHtml(t)}</span>`).join('');

  _currentDiaryHTML = `
    <div class="diary-page ${style}" id="diaryPage">
      <div class="diary-header">
        <h2>${escapeHtml(title)}</h2>
        <div class="diary-header-meta">
          <span><i class="fa-regular fa-calendar"></i> ${dateStr}</span>
          <span><i class="fa-solid fa-location-dot"></i> 旅行日记</span>
        </div>
      </div>
      ${tagsHTML ? `<div class="diary-tags">${tagsHTML}</div>` : ''}
      ${content ? `<div class="diary-body-text">${escapeHtml(content)}</div>` : ''}
      <div class="diary-photos">${photosHTML}</div>
      <div class="diary-footer">探途 WANDR · 旅行日记</div>
    </div>
  `;

  const canvas = document.getElementById('diaryCanvas');
  if (canvas) canvas.innerHTML = _currentDiaryHTML;

  setTimeout(() => {
    if (generating) generating.style.display = 'none';
    if (result) result.style.display = 'flex';
    if (resultActions) resultActions.style.display = 'flex';
    _isDiaryGenerating = false;
    showToast(T.diaryGenerated);
  }, 800);
}

// ---------- 下载日记 ----------
function downloadDiary() {
  const aiResult = document.getElementById('diaryAIResult');
  const isAiMode = aiResult && aiResult.style.display !== 'none';

  if (isAiMode) {
    if (!_diaryFinalImageUrl) { showToast('请先生成日记'); return; }
    showToast(T.diaryDownloading);
    const link = document.createElement('a');
    link.download = `AI旅行手帐_${document.getElementById('diaryTitle')?.value?.trim() || 'untitled'}.png`;
    link.href = _diaryFinalImageUrl;
    link.click();
    showToast(T.diaryDownloaded);
    return;
  }

  const page = document.getElementById('diaryPage');
  if (!page) { showToast('请先生成日记'); return; }
  showToast(T.diaryDownloading);

  // 离屏克隆避免容器 overflow:hidden 裁剪
  const clone = page.cloneNode(true);
  const offScreen = document.createElement('div');
  offScreen.style.cssText = 'position:fixed;left:-9999px;top:0;width:auto;overflow:visible;z-index:-1;';
  offScreen.appendChild(clone);
  document.body.appendChild(offScreen);

  // 强制所有子元素 overflow:visible，防止内部容器裁剪
  clone.style.overflow = 'visible';
  clone.querySelectorAll('*').forEach(el => {
    const computed = window.getComputedStyle(el);
    if (computed.overflow !== 'visible' || computed.overflowX !== 'visible' || computed.overflowY !== 'visible') {
      el.style.overflow = 'visible';
      el.style.overflowX = 'visible';
      el.style.overflowY = 'visible';
    }
  });

  // 等待字体和图片渲染
  setTimeout(async () => {
    try {
      const canvas = await html2canvas(clone, { scale: 3, useCORS: true, backgroundColor: null, logging: false });
      document.body.removeChild(offScreen);
      const link = document.createElement('a');
      link.download = `旅行日记_${document.getElementById('diaryTitle')?.value?.trim() || 'untitled'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast(T.diaryDownloaded);
    } catch (err) {
      document.body.removeChild(offScreen);
      console.error(err);
      showToast('下载失败，请重试');
    }
  }, 300);
}

// ---------- 保存日记到本地 ----------
async function saveDiary() {
  console.log('[saveDiary] triggered');
  try {
    const aiResult = document.getElementById('diaryAIResult');
    const isAiMode = aiResult && aiResult.style.display !== 'none';
    console.log('[saveDiary] isAiMode=', isAiMode, '_diaryFinalImageUrl=', !!_diaryFinalImageUrl);

    if (isAiMode) {
      if (!_diaryFinalImageUrl) { showToast('请先生成日记'); return; }
      const diaries = getDiaries();
      // 压缩缩略图（400px宽+JPEG 0.5质量→约30-80KB，原始PNG有3-8MB）
      const compressed = await compressDataUrl(_diaryFinalImageUrl, 400, 0.5);
      diaries.unshift({
        id: 'DAI' + Date.now(),
        title: document.getElementById('diaryTitle')?.value?.trim() || 'AI手帐',
        date: document.getElementById('diaryDate')?.value || formatDate(new Date()),
        style: getSelectedDiaryStyle(),
        thumb: compressed,
        html: _currentDiaryHTML,
        createdAt: new Date().toISOString(),
      });
      saveDiaries(diaries.slice(0, 20));
      showToast(T.diaryAISaved);
      refreshDiaryBadge();
      renderDiaryList();
      console.log('[saveDiary] AI diary saved, count=', diaries.length);
      return;
    }

    const page = document.getElementById('diaryPage');
    if (!page) { showToast('请先生成日记'); return; }

    if (typeof html2canvas === 'function') {
      // 离屏克隆避免预览容器 overflow:hidden 裁剪
      const clone = page.cloneNode(true);
      const offScreen = document.createElement('div');
      offScreen.style.cssText = 'position:fixed;left:-9999px;top:0;width:auto;overflow:visible;z-index:-1;';
      offScreen.appendChild(clone);
      document.body.appendChild(offScreen);

      // 强制所有子元素 overflow:visible
      clone.style.overflow = 'visible';
      clone.querySelectorAll('*').forEach(el => {
        const computed = window.getComputedStyle(el);
        if (computed.overflow !== 'visible' || computed.overflowX !== 'visible' || computed.overflowY !== 'visible') {
          el.style.overflow = 'visible';
          el.style.overflowX = 'visible';
          el.style.overflowY = 'visible';
        }
      });

      setTimeout(async () => {
        try {
          const canvas = await html2canvas(clone, { scale: 3, useCORS: true, backgroundColor: null, logging: false });
          document.body.removeChild(offScreen);
          const thumb = await compressDataUrl(canvas.toDataURL('image/jpeg', 0.6), 400, 0.5);
          const diaries = getDiaries();
          diaries.unshift({
            id: 'D' + Date.now(),
            title: document.getElementById('diaryTitle')?.value?.trim() || '未命名日记',
            date: document.getElementById('diaryDate')?.value || formatDate(new Date()),
            style: getSelectedDiaryStyle(),
            thumb: thumb,
            html: _currentDiaryHTML,
            createdAt: new Date().toISOString(),
          });
          saveDiaries(diaries.slice(0, 20));
          showToast(T.diarySaved);
          refreshDiaryBadge();
          renderDiaryList();
          console.log('[saveDiary] template diary saved, count=', diaries.length);
        } catch (err) {
          document.body.removeChild(offScreen);
          console.error('[saveDiary] html2canvas error:', err);
          showToast('保存失败，请重试');
        }
      }, 300);
    } else {
      // html2canvas 未加载，直接保存 HTML（没有缩略图）
      console.warn('[saveDiary] html2canvas not loaded, saving without thumbnail');
      const diaries = getDiaries();
      diaries.unshift({
        id: 'D' + Date.now(),
        title: document.getElementById('diaryTitle')?.value?.trim() || '未命名日记',
        date: document.getElementById('diaryDate')?.value || formatDate(new Date()),
        style: getSelectedDiaryStyle(),
        thumb: '',
        html: _currentDiaryHTML,
        createdAt: new Date().toISOString(),
      });
      saveDiaries(diaries.slice(0, 50));
      showToast(T.diarySaved);
      refreshDiaryBadge();
      renderDiaryList();
    }
  } catch (err) {
    console.error('[saveDiary] unexpected error:', err);
    showToast('保存出错：' + (err.message || '未知错误'));
  }
}

// ---------- 图片压缩 ----------
function compressDataUrl(dataUrl, maxWidth = 400, quality = 0.5) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round(h * (maxWidth / w)); w = maxWidth; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch { resolve(dataUrl); }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ---------- 日记本地存储 ----------
function getDiaries() {
  try { return JSON.parse(localStorage.getItem('wandr_diaries') || '[]'); }
  catch { return []; }
}
function saveDiaries(arr) {
  try {
    localStorage.setItem('wandr_diaries', JSON.stringify(arr));
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      console.warn('[saveDiaries] quota exceeded, purging oldest diaries...');
      // 删一半最旧的记录腾空间，再试一次
      const half = Math.floor(arr.length / 2) || 1;
      const trimmed = arr.slice(0, arr.length - half);
      try {
        localStorage.setItem('wandr_diaries', JSON.stringify(trimmed));
        showToast('存储空间不足，已自动清理旧日记');
      } catch {
        // 还是不行，清空所有
        try { localStorage.setItem('wandr_diaries', '[]'); } catch {}
        showToast('存储空间不足，已清空所有日记');
      }
    } else {
      console.error('[saveDiaries]', err);
    }
  }
}
function refreshDiaryBadge() {
  const diaries = getDiaries();
  const diaryBadge = document.getElementById('diaryBadge');
  const diaryCount = document.getElementById('diaryCount');
  if (diaryBadge) { diaryBadge.textContent = diaries.length; diaryBadge.style.display = diaries.length ? 'inline-flex' : 'none'; }
  if (diaryCount) diaryCount.textContent = diaries.length;
}

// ---------- 渲染日记列表 ----------
function renderDiaryList() {
  const list = document.getElementById('diaryList');
  const empty = document.getElementById('diaryEmpty');
  if (!list || !empty) return;

  const diaries = getDiaries();
  if (diaries.length === 0) {
    empty.style.display = 'flex';
    list.innerHTML = '';
    return;
  }
  empty.style.display = 'none';

  list.innerHTML = diaries.map(d => `
    <div class="diary-panel-item" data-diary-id="${d.id}">
      <img src="${d.thumb}" alt="" class="diary-panel-thumb">
      <div class="diary-panel-info">
        <div class="diary-panel-title">${escapeHtml(d.title)}</div>
        <div class="diary-panel-date">${d.date}</div>
      </div>
      <div class="diary-panel-actions">
        <button class="panel-item-btn primary" data-action="viewDiary" data-diary-id="${d.id}">查看</button>
        <button class="panel-item-btn ghost" data-action="deleteDiary" data-diary-id="${d.id}">删除</button>
      </div>
    </div>
  `).join('');
}

function viewDiary(id) {
  const diaries = getDiaries();
  const d = diaries.find(x => x.id === id);
  if (!d) return;

  // 首页等不含日记 Editor 的页面仅做轻量预览（弹出 toast），不操作 DOM
  const diaryPlaceholder = document.getElementById('diaryPlaceholder');
  if (!diaryPlaceholder) {
    showToast('查看日记详情请前往「旅行日记」页面');
    return;
  }

  diaryPlaceholder.style.display = 'none';
  const diaryGenerating = document.getElementById('diaryGenerating');
  if (diaryGenerating) diaryGenerating.style.display = 'none';
  const diaryResult = document.getElementById('diaryResult');
  if (diaryResult) diaryResult.style.display = 'none';
  const diaryAIResult = document.getElementById('diaryAIResult');
  if (diaryAIResult) diaryAIResult.style.display = 'none';

  const diaryTitle = document.getElementById('diaryTitle');
  if (diaryTitle) diaryTitle.value = d.title;
  const diaryDate = document.getElementById('diaryDate');
  if (diaryDate) diaryDate.value = d.date;
  const actions = document.getElementById('diaryResultActions');
  if (actions) actions.style.display = 'flex';

  _diaryFinalImageUrl = d.thumb;
  _currentDiaryHTML = d.html;

  // 显示为 AI 结果图
  const aiImage = document.getElementById('diaryAIImage');
  const aiLoading = document.getElementById('diaryAILoading');
  const aiError = document.getElementById('diaryAIError');
  if (aiLoading) aiLoading.style.display = 'none';
  if (aiError) aiError.style.display = 'none';
  if (aiImage) {
    aiImage.src = d.thumb;
    aiImage.style.display = 'block';
  }
  if (diaryAIResult) diaryAIResult.style.display = 'flex';

  // 回填照片
  _diaryPhotos = [];
  const grid = document.getElementById('diaryPhotoGrid');
  if (grid) {
    grid.innerHTML = '';
    const temp = document.createElement('div');
    temp.innerHTML = d.html || '';
    temp.querySelectorAll('.diary-photo img').forEach(img => {
      _diaryPhotos.push(img.src);
      const el = document.createElement('img');
      el.src = img.src;
      grid.appendChild(el);
    });
  }

  document.getElementById('diary').scrollIntoView({ behavior: 'smooth' });
  closeUserPanel();
}

function deleteDiary(id) {
  const diaries = getDiaries().filter(x => x.id !== id);
  saveDiaries(diaries);
  renderDiaryList();
  refreshDiaryBadge();
  showToast('日记已删除');
}

// showToast / toastTimer / scrollObserver → 已在 js/toast-anim.js 中定义

// ---- 页面初始化 ----
(function initDiaryPage() {
  deepseekKey.init();
  refreshDiaryBadge();
})();

// 确保全局可访问（供 shared.js 事件委托调用）
window.saveDiary = saveDiary;
window.downloadDiary = downloadDiary;
window.generateDiary = generateDiary;
window.generateDiaryAI = generateDiaryAI;
window.selectDiaryStyle = selectDiaryStyle;

console.log('[page-video] loaded, saveDiary=', typeof window.saveDiary, ', downloadDiary=', typeof window.downloadDiary);

