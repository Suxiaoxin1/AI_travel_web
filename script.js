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
    case 'toggleOpenAIKeyInput': toggleOpenAIKeyInput(); break;
    case 'saveOpenAIKey': saveOpenAIKey(); break;
    case 'toggleOpenAIKeyVisibility': toggleOpenAIKeyVisibility(); break;
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

// 汉堡菜单
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
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

// ============ 上传 Tabs ============
document.querySelectorAll('.upload-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const id = tab.dataset.tab;
    document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + id).classList.add('active');
  });
});

// ============ 照片上传 & 预览 ============
const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');
const photoDropZone = document.getElementById('photoDropZone');

// 存储上传照片的 base64 数据，供 VL 视觉模型使用
let uploadedPhotoBase64 = [];

photoInput.addEventListener('change', e => handlePhotoFiles(e.target.files));

['dragenter', 'dragover'].forEach(evt => {
  photoDropZone.addEventListener(evt, e => { e.preventDefault(); photoDropZone.classList.add('dragover'); });
});
['dragleave', 'drop'].forEach(evt => {
  photoDropZone.addEventListener(evt, e => { e.preventDefault(); photoDropZone.classList.remove('dragover'); });
});
photoDropZone.addEventListener('drop', e => handlePhotoFiles(e.dataTransfer.files));

function handlePhotoFiles(files) {
  photoPreview.innerHTML = '';
  uploadedPhotoBase64 = []; // 重置
  const validFiles = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 4); // VL 模型最多4张
  let loadedCount = 0;

  validFiles.forEach((file) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const base64 = ev.target.result;
      uploadedPhotoBase64.push(base64);

      const img = document.createElement('img');
      img.src = base64;
      img.className = 'preview-img';
      photoPreview.appendChild(img);

      loadedCount++;
      if (loadedCount === validFiles.length) {
        showToast(T.photosSelected(validFiles.length));
      }
    };
    reader.readAsDataURL(file);
  });

  if (validFiles.length === 0 && files.length > 0) {
    showToast(T.uploadInvalidFormat);
  }
}

// 获取上传照片的 base64 数据（供 API 调用）
function getUploadedPhotos() {
  return uploadedPhotoBase64.slice(); // 返回副本
}

// ============ 文字输入字数统计 ============
const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
textInput.addEventListener('input', () => {
  const len = Math.min(textInput.value.length, 500);
  charCount.textContent = len;
  if (textInput.value.length > 500) textInput.value = textInput.value.slice(0, 500);
});

function addPresetText(tag) {
  const current = textInput.value.trim();
  if (!current.includes(tag)) {
    textInput.value = current ? current + '，' + tag : tag;
    charCount.textContent = textInput.value.length;
    textInput.focus();
  }
}

// ============ 出行方式按钮 ============
document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// ============ 语音录音 ============
let isRecording = false;
let recordTimer = null;
let recordSeconds = 0;
const sampleTranscripts = [
  '我想去海边旅游，最好是比较安静的地方，喜欢看日出日落，预算在五千元左右，希望有好的海鲜餐厅',
  '想找一个有文化底蕴的城市旅行，对历史和古建筑感兴趣，喜欢走走看看，不太喜欢人多的地方',
  '最近压力有点大，想去山里放松一下，希望有徒步路线，空气好，风景美，能够好好休息',
];

function toggleRecording() {
  const btn = document.getElementById('recordBtn');
  const icon = document.getElementById('recordIcon');
  const visualizer = document.getElementById('voiceVisualizer');
  const statusEl = document.getElementById('voiceStatus');
  const timerEl = document.getElementById('voiceTimer');
  const transcriptText = document.getElementById('transcriptText');

  if (!isRecording) {
    isRecording = true;
    btn.classList.add('recording');
    icon.className = 'fa-solid fa-stop';
    visualizer.classList.add('recording');
    statusEl.querySelector('.voice-hint').textContent = '正在录音...';
    statusEl.querySelector('.voice-sub').textContent = '请说出你想去哪里旅行';
    recordSeconds = 0;
    recordTimer = setInterval(() => {
      recordSeconds++;
      const m = Math.floor(recordSeconds / 60).toString().padStart(2, '0');
      const s = (recordSeconds % 60).toString().padStart(2, '0');
      timerEl.textContent = `${m}:${s}`;
      if (recordSeconds === 3) transcriptText.textContent = '正在识别...';
      if (recordSeconds === 5) {
        transcriptText.textContent = sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)];
      }
    }, 1000);
  } else {
    isRecording = false;
    btn.classList.remove('recording');
    icon.className = 'fa-solid fa-microphone';
    visualizer.classList.remove('recording');
    clearInterval(recordTimer);
    statusEl.querySelector('.voice-hint').textContent = '录音完成';
    statusEl.querySelector('.voice-sub').textContent = '点击重新录制或进行 AI 分析';
    showToast(T.recordDone);
  }
}

// API 端点常量（DEEPSEEK_API_ENDPOINT/DEEPSEEK_MODEL/ZHIPU_API_ENDPOINT/ZHIPU_VISION_MODEL）
// → 已在 js/api-key-manager.js 中定义

// API Key 管理器已提取到 js/api-key-manager.js（createApiKeyManager 工厂 + 全局函数）
// 全局函数 getApiKey/saveApiKey/toggleApiKeyInput/getZhipuKey/... 仍然可用

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  deepseekKey.init();
  zhipuKey.init();
  openaiKey.init();

  // 初始化 Leaflet 交互地图
  setTimeout(initLeafletMap, 300);
  // 绑定底图样式切换
  setTimeout(initMapStyleToggle, 500);
  // 渲染热门目的地初始内容（推荐标签）
  renderDestinations('recommended');
  // 刷新日记徽标
  refreshDiaryBadge();
});

// ============ AI 分析推荐 ============

function startAnalysis() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const resultPlaceholder = document.getElementById('resultPlaceholder');
  const resultContent = document.getElementById('resultContent');
  const analyzingOverlay = document.getElementById('analyzingOverlay');
  const loadingText = document.getElementById('loadingText');
  const loadingSteps = document.querySelectorAll('.load-step');

  // 收集用户输入
  const userInput = collectUserInput();
  const photos = getUploadedPhotos();
  const hasPhotos = photos.length > 0;

  // 如果没有文字也没有图片，提示用户
  if (!userInput && !hasPhotos) {
    showToast(T.noInput);
    return;
  }

  // 检查对应的 API Key
  if (hasPhotos) {
    const zhipuKey = getZhipuKey();
    if (!zhipuKey) {
      showToast(T.needZhipuKey);
      dom('zhipuApiKey').focus();
      return;
    }
  } else {
    const apiKey = getApiKey();
    if (!apiKey) {
      showToast(T.needDsKey);
      toggleApiKeyInput();
      document.getElementById('apiKeyInputWrap').style.display = 'block';
      document.getElementById('apiKeyChevron').style.transform = 'rotate(180deg)';
      dom('deepseekApiKey').focus();
      return;
    }
  }

  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> AI 分析中...';

  resultPlaceholder.style.display = 'none';
  resultContent.style.display = 'none';
  analyzingOverlay.style.display = 'flex';

  // 重置思考链展示区
  dom('reasoningSection').style.display = 'none';
  dom('reasoningBody').style.display = 'none';
  dom('reasoningContent').textContent = '';
  dom('reasoningChevron').style.transform = 'rotate(0deg)';

  const steps = hasPhotos
    ? ['正在分析你的照片内容...', '智谱 GLM-4.6V 视觉识别中...', '匹配视觉特征+偏好...', '生成个性化行程方案...']
    : ['正在解析你的内容...', 'DeepSeek 推理模型中...', '匹配最适合的目的地...', '生成个性化行程方案...'];
  let stepIndex = 0;

  loadingSteps.forEach(s => s.className = 'load-step');
  loadingSteps[0].classList.add('active');
  loadingText.textContent = steps[0];

  const stepInterval = setInterval(() => {
    if (stepIndex < loadingSteps.length - 1) {
      loadingSteps[stepIndex].classList.remove('active');
      loadingSteps[stepIndex].classList.add('done');
      stepIndex++;
      loadingSteps[stepIndex].classList.add('active');
      loadingText.textContent = steps[stepIndex];
    }
  }, 1500);

  // 有照片用智谱视觉 API，无照片用 DeepSeek 推理 API
  const apiPromise = hasPhotos
    ? callZhipuVisionAPI(userInput, getZhipuKey(), photos)
    : callDeepSeekAPI(userInput, getApiKey());

  apiPromise
    .then(dest => {
      clearInterval(stepInterval);
      loadingSteps.forEach(s => { s.classList.add('done'); s.classList.remove('active'); });

      // 如果有思考链，显示思考链展示区
      if (dest._meta && dest._meta.reasoning) {
        const reasoningSection = dom('reasoningSection');
        const reasoningContent = dom('reasoningContent');
        reasoningSection.style.display = 'block';
        // 逐段显示思考内容（打字机效果）
        typeWriter(reasoningContent, dest._meta.reasoning, 15);
      }

      setTimeout(() => {
        analyzingOverlay.style.display = 'none';
        renderResult(dest);
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i><span>AI 智能分析推荐</span>';
        showToast(T.recommended(dest.name, dest.score));
      }, 400);
    })
    .catch(err => {
      clearInterval(stepInterval);
      analyzingOverlay.style.display = 'none';
      resultPlaceholder.style.display = 'flex';
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i><span>AI 智能分析推荐</span>';
      showToast(T.apiError(err.message || '请检查网络与 API Key'));
      console.error('API Error:', err);
    });
}

// 打字机效果展示思考链
function typeWriter(element, text, speed) {
  element.textContent = '';
  let i = 0;
  const timer = setInterval(() => {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
    } else {
      clearInterval(timer);
    }
  }, speed);
}

// 切换思考链展开/折叠
function toggleReasoning() {
  const body = dom('reasoningBody');
  const chevron = dom('reasoningChevron');
  if (body.style.display === 'none') {
    body.style.display = 'block';
    chevron.style.transform = 'rotate(180deg)';
  } else {
    body.style.display = 'none';
    chevron.style.transform = 'rotate(0deg)';
  }
}

// 切换 API 详情展开/折叠
function toggleApiDetails() {
  const body = document.getElementById('apiDetailsBody');
  const chevron = document.getElementById('apiDetailsChevron');
  if (body.style.display === 'none') {
    body.style.display = 'block';
    chevron.style.transform = 'rotate(180deg)';
  } else {
    body.style.display = 'none';
    chevron.style.transform = 'rotate(0deg)';
  }
}

function collectUserInput() {
  const parts = [];

  // 文字输入
  const text = textInput.value.trim();
  if (text) parts.push(text);

  // 语音识别文字
  const transcriptEl = dom('transcriptText');
  const transcript = transcriptEl?.textContent;
  if (transcript && transcript !== '等待录音...' && transcript !== '正在识别...') {
    parts.push(transcript);
  }

  // 出行偏好
  const travelTime = document.getElementById('travelTime')?.value || '3-5 天';
  const budget = document.getElementById('budget')?.value || '适中';
  const travelType = document.querySelector('.type-btn.active')?.dataset?.type || 'solo';
  const typeMap = { solo: '独自旅行', couple: '情侣出行', family: '家庭出游', friends: '朋友结伴' };

  parts.push(`出行时间: ${travelTime}, 预算: ${budget}, 出行方式: ${typeMap[travelType] || travelType}`);

  // 如果有照片，添加简要提示（实际图片数据将通过智谱视觉 API 传递）
  const hasPhotos = uploadedPhotoBase64.length > 0;
  if (hasPhotos) {
    parts.push('【用户已上传 ' + uploadedPhotoBase64.length + ' 张照片，智谱 GLM-4.6V 将进行视觉分析】');
  }

  return parts.join('\n');
}

async function callDeepSeekAPI(userInput, apiKey) {
  const systemPrompt = `你是一个专业的旅行规划 AI 助手，名为"探途 WANDR"。请你根据用户的偏好和描述，推荐最合适的旅行目的地并制定详细行程。

你必须严格按照以下 JSON 格式返回（不要包含 markdown 代码块标记）：
{
  "input_analysis": "你从用户输入中提取的关键信息摘要，用中文一句话说明：用户想去什么类型的目的地、有什么偏好、预算如何、出行人数等",
  "name": "目的地名称（格式：城市·特色，如 三亚·亚龙湾）",
  "location": "所在省/自治区/直辖市",
  "tags": ["标签1", "标签2", "标签3"],
  "score": 95,
  "days": [
    {
      "title": "第1天主题",
      "desc": "第1天简短描述",
      "acts": [
        { "time": "09:00", "icon": "fa-plane-arrival", "name": "景点/活动名称", "desc": "活动描述", "addr": "真实地址（省市区+街道门牌号，用于地图导航）" }
      ]
    }
  ]
}

注意：
1. 推荐的目的地必须是中国境内真实存在的城市或景点
2. 行程天数应与用户偏好的出行时间匹配
3. 每天安排 3-5 个活动，时间从早到晚合理分布
4. score 是匹配度（0-100），根据用户偏好和目的地特征的匹配程度给出
5. icon 使用 FontAwesome 6 图标类名，如：fa-hotel, fa-utensils, fa-landmark, fa-umbrella-beach, fa-person-hiking, fa-water, fa-mountain, fa-camera, fa-ship, fa-bicycle, fa-pagoda, fa-moon, fa-star, fa-music, fa-martini-glass, fa-bowl-food, fa-train, fa-bus, fa-tree, fa-fish, fa-spa, fa-crown 等
6. tags 是 3 个简短的目的地特征标签
7. input_analysis 字段必须真实反映用户输入的内容，不能泛泛而谈
8. addr 字段必须是真实可搜索的完整地址（用于高德/百度地图导航），如"北京市东城区景山前街4号"；若活动无明确地址（如"酒店休息""自由活动"），addr 留空字符串 ""
9. 只返回 JSON，不要任何额外文字`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  const startTime = Date.now();

  try {
    const response = await fetch(DEEPSEEK_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.8,
        max_tokens: 4096,
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 401) throw new Error('API Key 无效，请检查后重试');
      if (response.status === 402) throw new Error('账户余额不足，请充值后重试');
      if (response.status === 429) throw new Error('请求过于频繁，请稍后重试');
      throw new Error(errData.error?.message || `请求失败 (${response.status})`);
    }

    const data = await response.json();
    const endTime = Date.now();
    const responseTime = ((endTime - startTime) / 1000).toFixed(1);

    const reasoning = data.choices?.[0]?.message?.reasoning_content || '';
    const usage = data.usage || {};
    const modelUsed = data.model || DEEPSEEK_MODEL;
    const content = data.choices?.[0]?.message?.content || '';

    const parsed = parseAIResponse(content);
    enhanceParsedResult(parsed, modelUsed, responseTime, usage, reasoning, false);
    return parsed;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('请求超时，请检查网络连接');
    throw err;
  }
}

// ============ 智谱 GLM-4.6V 视觉分析 API ============
async function callZhipuVisionAPI(userInput, apiKey, images) {
  const systemPrompt = `你是一个专业的旅行规划 AI 助手，名为"探途 WANDR"。用户上传了照片，请你仔细观察照片中的场景、建筑风格、自然环境、天气、氛围等视觉信息，结合用户的文字描述，推荐最合适的中国境内旅行目的地并制定详细行程。

你必须严格按照以下 JSON 格式返回（不要包含 markdown 代码块标记）：
{
  "input_analysis": "详细说明你从照片中看到了什么（景色类型、建筑风格、自然元素、氛围色调等），以及如何结合用户偏好推导出推荐目的地的分析过程，用中文描述",
  "name": "目的地名称（格式：城市·特色，如 三亚·亚龙湾）",
  "location": "所在省/自治区/直辖市",
  "tags": ["标签1", "标签2", "标签3"],
  "score": 95,
  "days": [
    {
      "title": "第1天主题",
      "desc": "第1天简短描述",
      "acts": [
        { "time": "09:00", "icon": "fa-plane-arrival", "name": "景点/活动名称", "desc": "活动描述", "addr": "真实地址（省市区+街道门牌号，用于地图导航）" }
      ]
    }
  ]
}

注意：
1. 推荐的必须是中国境内真实存在的城市或景点
2. 行程天数应与用户偏好匹配
3. 每天安排 3-5 个活动，时间从早到晚合理分布
4. score 是匹配度（0-100），根据照片特征和用户偏好的匹配程度给出
5. icon 使用 FontAwesome 6 图标类名
6. tags 是 3 个简短的目的地特征标签
7. input_analysis 是你从图片中看到的视觉信息+用户文字的综合分析，要真实具体
8. addr 字段必须是真实可搜索的完整地址（用于高德/百度地图导航），如"浙江省杭州市西湖区龙井路1号"；若活动无明确地址（如"酒店休息""自由活动"），addr 留空字符串 ""
9. 只返回 JSON，不要任何额外文字`;

  // 多模态格式：content 数组包含 text + image_url
  const userContent = [
    { type: 'text', text: userInput || '请分析这些照片，推荐相似的旅行目的地' },
    ...images.map(b64 => ({ type: 'image_url', image_url: { url: b64 } }))
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);
  const startTime = Date.now();

  try {
    const response = await fetch(ZHIPU_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: ZHIPU_VISION_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.8,
        max_tokens: 4096,
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 401) throw new Error('智谱 API Key 无效，请检查后重试');
      if (response.status === 429) throw new Error('智谱请求过于频繁，请稍后重试');
      throw new Error(errData.error?.message || `智谱 API 请求失败 (${response.status})`);
    }

    const data = await response.json();
    const endTime = Date.now();
    const responseTime = ((endTime - startTime) / 1000).toFixed(1);

    const usage = data.usage || {};
    const modelUsed = data.model || ZHIPU_VISION_MODEL;
    const content = data.choices?.[0]?.message?.content || '';

    const parsed = parseAIResponse(content);
    enhanceParsedResult(parsed, modelUsed, responseTime, usage, '', true);
    return parsed;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('请求超时，请检查网络连接');
    throw err;
  }
}

// 解析 AI 返回的 JSON 响应
function parseAIResponse(content) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[1]);
    } else {
      const braceMatch = content.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        parsed = JSON.parse(braceMatch[0]);
      } else {
        throw new Error('AI 返回格式错误，无法解析');
      }
    }
  }
  if (!parsed.name || !parsed.days || !Array.isArray(parsed.days)) {
    throw new Error('AI 返回数据不完整');
  }
  return parsed;
}

// 补充缺失字段 + 附加元信息
function enhanceParsedResult(parsed, model, responseTime, usage, reasoning, usedVision) {
  parsed.score = parsed.score || Math.floor(Math.random() * 10 + 88);
  parsed.location = parsed.location || '中国';
  parsed.tags = parsed.tags || ['特色旅行', '值得一游', '推荐'];
  parsed.img = getDefaultImage(parsed.tags);

  parsed.days = parsed.days.map(day => ({
    ...day,
    acts: (day.acts || []).map(act => ({
      ...act,
      icon: act.icon || 'fa-map-pin',
      time: act.time || '09:00',
      addr: act.addr || ''
    }))
  }));

  parsed._meta = {
    reasoning: reasoning,
    model: model,
    responseTime: responseTime,
    promptTokens: usage.prompt_tokens || 0,
    completionTokens: usage.completion_tokens || 0,
    totalTokens: usage.total_tokens || 0,
    inputAnalysis: parsed.input_analysis || '',
    usedVisionModel: usedVision
  };

  return parsed;
}

function getDefaultImage(tags) {
  const tagStr = (tags || []).join('');
  if (tagStr.includes('海') || tagStr.includes('滩') || tagStr.includes('滨')) {
    return 'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=600&auto=format&fit=crop&q=80';
  }
  if (tagStr.includes('山') || tagStr.includes('自然') || tagStr.includes('林')) {
    return 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&auto=format&fit=crop&q=80';
  }
  if (tagStr.includes('历史') || tagStr.includes('文化') || tagStr.includes('古')) {
    return 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&auto=format&fit=crop&q=80';
  }
  if (tagStr.includes('城') || tagStr.includes('都市') || tagStr.includes('现代')) {
    return 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=600&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop&q=80';
}

function renderResult(dest) {
  document.getElementById('matchScore').textContent = (dest.score || 90) + '%';

  // 渲染「AI 如何理解你的需求」
  const analysisSection = document.getElementById('aiAnalysisSection');
  const analysisBody = document.getElementById('aiAnalysisBody');
  const inputAnalysis = dest._meta?.inputAnalysis || dest.input_analysis || '';
  const isVision = dest._meta?.usedVisionModel;

  if (inputAnalysis) {
    analysisSection.style.display = 'block';
    // 视觉模型的标题带相机图标
    const headerHtml = isVision
      ? '<div class="ai-analysis-header"><i class="fa-solid fa-camera-retro"></i><span>AI 从照片中看到了什么</span></div>'
      : '<div class="ai-analysis-header"><i class="fa-solid fa-magnifying-glass"></i><span>AI 如何理解你的需求</span></div>';
    analysisBody.innerHTML = `${headerHtml}<p class="ai-analysis-text">${inputAnalysis}</p>`;
  } else {
    analysisSection.style.display = 'none';
  }

  // 渲染推荐目的地
  document.getElementById('recommendedDest').innerHTML = `
    <div class="rec-dest-card">
      <img src="${dest.img || getDefaultImage(dest.tags)}" alt="${dest.name}" loading="lazy">
      <div class="rec-dest-overlay">
        <div class="rec-dest-name">${dest.name}</div>
        <div class="rec-dest-tags">${(dest.tags || []).map(t => `<span class="rec-dest-tag">${t}</span>`).join('')}</div>
      </div>
    </div>
  `;

  // 渲染行程预览
  const itin = document.getElementById('itineraryPreview');
  itin.innerHTML = dest.days.slice(0, 3).map((d, i) => `
    <div class="itin-day">
      <div class="itin-day-num">Day${i + 1}</div>
      <div class="itin-day-content">
        <div class="itin-day-title">${d.title || '第' + (i+1) + '天行程'}</div>
        <div class="itin-day-desc">${d.desc || getDaySummary(d)}</div>
      </div>
    </div>
  `).join('');

  // 渲染「API 调用详情」
  const meta = dest._meta || {};
  const apiSection = document.getElementById('apiDetailsSection');
  if (meta.model || meta.totalTokens) {
    apiSection.style.display = 'block';
    // 视觉模型添加标识
    const modelLabel = meta.usedVisionModel
      ? '智谱 ' + meta.model + ' 📷（视觉识别）'
      : (meta.model || '—');
    document.getElementById('apiModel').textContent = modelLabel;
    document.getElementById('apiPromptTokens').textContent = meta.promptTokens ? meta.promptTokens.toLocaleString() : '—';
    document.getElementById('apiCompletionTokens').textContent = meta.completionTokens ? meta.completionTokens.toLocaleString() : '—';
    document.getElementById('apiTotalTokens').textContent = meta.totalTokens ? meta.totalTokens.toLocaleString() : '—';
    document.getElementById('apiResponseTime').textContent = meta.responseTime ? meta.responseTime + 's' : '—';
    document.getElementById('apiStatus').textContent = '调用成功 ✓';
    document.getElementById('apiStatus').className = 'api-detail-value api-status-ok';
  } else {
    apiSection.style.display = 'none';
  }

  window._currentDest = dest;
  dom('resultContent').style.display = 'block';
}

function getDaySummary(day) {
  if (!day.acts || day.acts.length === 0) return '自由探索';
  return day.acts.map(a => a.name).join(' → ');
}

// ============ 详细行程 Modal ============
function showDetailModal() {
  const dest = window._currentDest;
  if (!dest) return;
  document.getElementById('modalDestName').textContent = dest.name + ' · ' + dest.location;
  const daysEl = document.getElementById('itineraryDays');
  daysEl.innerHTML = dest.days.map((d, i) => `
    <div class="day-block">
      <div class="day-header">
        <span>第 ${i + 1} 天 · ${d.title}</span>
        <span>${d.acts.length} 个行程项</span>
      </div>
      <div class="day-items">
        ${d.acts.map(a => `
          <div class="day-item">
            <div class="day-item-time">${a.time}</div>
            <div class="day-item-icon"><i class="fa-solid ${a.icon}"></i></div>
            <div class="day-item-info">
              <div class="day-item-name">${a.name}</div>
              <div class="day-item-desc">${a.desc}</div>
              ${a.addr ? `<div class="day-item-addr"><i class="fa-solid fa-location-dot"></i> ${a.addr}</div>` : ''}
            </div>
            ${a.addr ? `<button class="day-item-nav-btn" data-action="navigateTo" data-dest="${a.name.replace(/"/g, '&quot;')}" data-stop="true"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
  dom('detailModal').classList.add('open');
}

function closeDetailModal() {
  dom('detailModal').classList.remove('open');
}
function closeModal(e) {
  if (e.target === dom('detailModal')) closeDetailModal();
}

function savePlan() {
  // 将当前AI推荐的目的地存入收藏（含完整行程数据）
  const dest = window._currentDest;
  const destNameEl = document.querySelector('.rec-dest-name');
  if (destNameEl && dest) {
    const destName = destNameEl.textContent;
    const destImgEl = document.querySelector('.rec-dest-card img');
    const destImg = destImgEl ? destImgEl.src : '';
    let favs = getFavorites();
    if (!favs.some(f => f.name === destName)) {
      favs.push({
        name: destName,
        sub: 'AI 推荐行程 · ' + (dest.location || ''),
        img: destImg,
        price: '¥800',
        rating: '4.8',
        addedAt: new Date().toLocaleDateString(),
        days: dest.days || [],
        location: dest.location || '',
        tags: dest.tags || [],
        isAiPlan: true
      });
      saveFavorites(favs);
      refreshBadges();
    }
  }
  showToast(T.planSaved);
  closeDetailModal();
}

// ============ 目的地分类映射 ============
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

const CATEGORY_LABELS = {
  nature: { name: '自然风光', icon: 'fa-mountain-sun' },
  culture: { name: '文化古迹', icon: 'fa-landmark' },
  beach:   { name: '海滨度假', icon: 'fa-umbrella-beach' },
  city:    { name: '城市探索', icon: 'fa-city' },
  recommended: { name: '热门推荐', icon: 'fa-fire' },
};

const RECOMMENDED_COUNT = 10;
const VISIBLE_COUNT = 6;

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

/** 生成单张目的地卡片 HTML */
function renderDestCard(d, index) {
  const tags = getDestTags(d);
  const tagsHtml = tags.map(t => `<span class="dest-tag">${t}</span>`).join('');
  const reviews = randomReviews(d.rating);
  const escName = d.name.replace(/'/g, "\\'");
  const escSub  = d.sub.replace(/'/g, "\\'");

  return `
    <div class="dest-card" data-category="${d.category}" data-key="${d.key}" data-action="openDestDetail" data-key="${d.key}" style="cursor:pointer;animation-delay:${index * 0.05}s">
      <div class="dest-img-wrap">
        <img src="${d.img}" alt="${d.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop&q=80'">
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
  document.querySelectorAll('#destinationsGrid .dest-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    entryObserver.observe(el);
  });
}

/** 按分类分组渲染所有目的地 */
function renderDestinations(filter) {
  const grid = document.getElementById('destinationsGrid');
  if (!grid) return;

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

// ============ 导航功能 ============
let selectedSpot = null;

// ============ Leaflet 实时地图 ============
let leafletMap = null;
let leafletMarkers = [];       // 所有目的地标记
let activeMarker = null;      // 当前选中的标记

/** 目的地坐标数据库（key → [lat, lng, displayAddr]） */
const DEST_COORDS = {
  // === destDetailData === (WGS-84，使用时经 wgs84ToGcj02 转换为高德 GCJ-02)
  zhangjiajie: [29.115, 110.473, '湖南·张家界'],
  sanya:       [18.251, 109.506, '海南·三亚'],
  xian:        [34.340, 108.933, '陕西·西安'],
  chengdu:     [30.570, 104.061, '四川·成都'],
  xizang:      [29.648, 91.166, '西藏·拉萨'],
  // === chinaDestinationsData - 热门 === (WGS-84)
  gugong:      [39.916, 116.397, '北京'],
  changcheng:  [40.431, 116.569, '北京'],
  xihu:        [30.237, 120.141, '浙江·杭州'],
  wuzhen:      [30.742, 120.488, '浙江·乌镇'],
  jiuzhaigou:  [33.263, 103.918, '四川·阿坝'],
  daocheng:    [28.451, 100.391, '四川·甘孜'],
  lijiang:     [26.872, 100.230, '云南·丽江'],
  dali:        [25.606, 100.267, '云南·大理'],
  chaka:       [36.797, 99.085, '青海'],
  qinghaihu:   [36.894, 100.192, '青海'],
  dunhuang:    [40.037, 94.805, '甘肃·敦煌'],
  fanjingshan: [27.920, 108.701, '贵州·铜仁'],
  huangguoshu: [25.993, 105.669, '贵州·安顺'],
  guilin:      [25.234, 110.519, '广西·桂林'],
  // === chinaDestinationsData - 小众秘境 ===
  songyang:    [28.449, 119.487, '浙江·丽水'],
  genie:       [29.832, 99.598, '四川·甘孜'],
  dangling:    [30.975, 101.308, '四川·甘孜'],
  cuokahu:     [31.186, 100.602, '四川·甘孜'],
  nanjiluo:    [27.944, 99.663, '云南·迪庆'],
  jingmai:     [22.238, 100.055, '云南·普洱'],
  bingzhongluo:[28.021, 98.622,  '云南·怒江'],
  nianhu:      [26.566, 103.510, '云南·曲靖'],
  aikenquan:   [38.240, 91.079,  '青海·海西'],
  mangya:      [38.253, 90.861,  '青海·海西'],
  dongtai:     [37.370, 93.866,  '青海·海西'],
  heidushan:   [38.428, 90.554,  '青海·海西'],
  nianbaoyuze: [33.290, 100.699, '青海·果洛'],
  qiongkushitai:[43.033, 81.878,'新疆·伊犁'],
  xiaerxili:   [45.090, 82.050,  '新疆·博乐'],
  jiangbulake: [43.683, 89.691,  '新疆·昌吉'],
  dahaidao:    [42.550, 93.200,  '新疆·哈密'],
  zhagana:     [34.231, 103.190, '甘肃·甘南'],
  jiucaiping:  [26.984, 104.722, '贵州·毕节'],
  luodian:     [25.504, 106.760, '贵州·黔南'],
  sanmenhai:   [24.547, 107.048, '广西·河池'],
  mingshi:     [22.634, 106.967, '广西·崇左'],
  gulangyu:    [24.448, 118.067, '福建·厦门'],
  xiapu:       [26.882, 120.005, '福建·宁德'],
  sisu:        [26.713, 120.325, '福建·宁德'],
  huangshan:   [30.134, 118.167, '安徽·黄山'],
  hongcun:     [30.003, 117.986, '安徽·宏村'],
  yangchan:    [29.920, 118.642, '安徽·黄山'],
  wudangshan:  [32.401, 111.004, '湖北·十堰'],
  enshi:       [30.396, 109.484, '湖北·恩施'],
  luyuanping:  [30.338, 109.420, '湖北·恩施'],
  taishan:     [36.252, 117.107, '山东·泰安'],
  changdao:    [37.919, 120.738, '山东·烟台'],
  bingmayong:  [34.385, 109.273, '陕西·西安'],
  tangbuxiec:  [34.215, 108.960, '陕西·西安'],
  budala:      [29.658, 91.117, '西藏·拉萨'],
  zhangjiajie_park: [29.327, 110.412, '湖南·张家界'],
  sanqingshan: [28.908, 118.072, '江西·上饶'],
  hongyadong:  [29.565, 106.587, '重庆'],
  zhouzhuang:  [31.112, 120.844, '江苏·苏州'],
  pingyao:     [37.202, 112.178, '山西·晋中'],
  yalongwan:   [18.228, 109.640, '海南·三亚'],
};

/** WGS-84 → GCJ-02 坐标转换（高德地图需要火星坐标系） */
function wgs84ToGcj02(lng, lat) {
  const a = 6378245.0;
  const ee = 0.00669342162296594323;
  function transformLat(x, y) {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320.0 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
    return ret;
  }
  function transformLng(x, y) {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
    return ret;
  }
  // 国外坐标不需要转换
  if (lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271) {
    return { lng, lat };
  }
  const dLat = transformLat(lng - 105.0, lat - 35.0);
  const dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = lat / 180.0 * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  const dLatFinal = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
  const dLngFinal = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);
  return { lng: lng + dLngFinal, lat: lat + dLatFinal };
}

/** 预缓存 geocoder 结果 — LRU 限制 200 条（防止无限增长） */
const geocoderCache = new WANDR.LRUCache(200);

/** Nominatim 地理编码（免费，限速 1 req/s） */
async function geocodeAddress(query) {
  const cached = geocoderCache.get(query);
  if (cached !== undefined) return cached;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)},中国&limit=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length > 0) {
      // Nominatim 返回 WGS-84，转换为 GCJ-02 适配高德地图瓦片
      const gcj = wgs84ToGcj02(parseFloat(data[0].lon), parseFloat(data[0].lat));
      const result = { lat: gcj.lat, lng: gcj.lng, addr: data[0].display_name || '' };
      geocoderCache.set(query, result);
      return result;
    }
    return null;
  } catch {
    return null;
  }
}

/** 根据 key 或 name 获取坐标 */
function getDestCoord(keyOrName) {
  // 精确 key 匹配
  if (DEST_COORDS[keyOrName]) {
    const gcj = wgs84ToGcj02(DEST_COORDS[keyOrName][1], DEST_COORDS[keyOrName][0]);
    return { lat: gcj.lat, lng: gcj.lng, addr: DEST_COORDS[keyOrName][2] };
  }
  // name 模糊匹配（去前缀如"丽江"匹配"丽江古城"）
  for (const [k, v] of Object.entries(DEST_COORDS)) {
    const allDests = getAllDestinations();
    const d = allDests.find(a => a.key === k);
    if (d && d.name === keyOrName) {
      const gcj = wgs84ToGcj02(v[1], v[0]);
      return { lat: gcj.lat, lng: gcj.lng, addr: v[2] };
    }
  }
  return null;
}

/** 创建自定义 DivIcon - 支持 hot/big/small/selected */
function createMarkerIcon(isHot, isSelected, markerType) {
  let cls = '';
  let iconSize, iconAnchor, popupAnchorY;
  let iconHtml = '';

  if (isSelected) {
    cls = 'selected';
    iconSize = [36, 36];
    iconAnchor = [9, 34];
    popupAnchorY = 38;
    iconHtml = '<i class="fa-solid fa-location-dot"></i>';
  } else if (markerType === 'big') {
    cls = 'big';
    iconSize = [14, 14];
    iconAnchor = [4, 13];
    popupAnchorY = 16;
    iconHtml = '<i class="fa-solid fa-location-dot"></i>';
  } else if (markerType === 'small') {
    cls = 'small';
    iconSize = [8, 8];
    iconAnchor = [4, 4];
    popupAnchorY = 6;
    iconHtml = '';
  } else if (isHot) {
    cls = 'hot';
    iconSize = [28, 28];
    iconAnchor = [7, 26];
    popupAnchorY = 28;
    iconHtml = '<i class="fa-solid fa-location-dot"></i>';
  } else {
    iconSize = [28, 28];
    iconAnchor = [7, 26];
    popupAnchorY = 28;
    iconHtml = '<i class="fa-solid fa-location-dot"></i>';
  }

  return L.divIcon({
    className: '',
    html: `<div class="custom-marker ${cls}">${iconHtml}</div>`,
    iconSize: iconSize,
    iconAnchor: iconAnchor,
    popupAnchor: [0, -popupAnchorY],
  });
}

// ============ 省份边界 GeoJSON 叠加层 ============
let provinceLayer = null;       // 省份边界图层
let provinceGeoData = null;     // 缓存的 GeoJSON 数据

/**
 * 加载并渲染中国省份边界
 * 数据源：阿里云 DataV（国内 CDN，稳定可靠）
 */
async function loadProvinceBoundaries() {
  if (provinceLayer || !leafletMap) return;
  // 首次加载显示轻量提示
  const loadingEl = document.createElement('div');
  loadingEl.className = 'map-loading-hint';
  loadingEl.textContent = '正在加载地区边界...';
  document.getElementById('mapContainer').appendChild(loadingEl);

  try {
    if (!provinceGeoData) {
      // 使用阿里云 DataV 全国省份边界（简化后 ~1.5MB）
      const resp = await fetch(
        'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
        { signal: AbortSignal.timeout(15000) }
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      provinceGeoData = await resp.json();
    }

    provinceLayer = L.geoJSON(provinceGeoData, {
      style: (feature) => ({
        color: '#8B7355',           // 棕褐色边界线
        weight: 2,                   // 线宽
        opacity: 0.55,              // 边界透明度
        fillColor: feature.properties.name === '南海诸岛' ? '#ddeeff' : 'transparent',
        fillOpacity: 0.06,
        dashArray: null,
        lineCap: 'round',
        lineJoin: 'round',
      }),
      onEachFeature: (feature, layer) => {
        // 省份名作为 tooltip
        if (feature.properties.name) {
          layer.bindTooltip(feature.properties.name, {
            permanent: false,
            sticky: true,
            opacity: 0.85,
            className: 'province-tooltip',
            offset: [0, -8],
          });
        }
        // hover 高亮
        layer.on('mouseover', function () {
          this.setStyle({
            color: '#5C3D2E',
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.12,
          });
        });
        layer.on('mouseout', function () {
          provinceLayer.resetStyle(this);
        });
      },
    }).addTo(leafletMap);

    // 将边界层置于标记之下
    provinceLayer.bringToBack();
  } catch (err) {
    console.warn('[地图] 省份边界加载失败:', err.message);
  } finally {
    loadingEl.remove();
  }
}

/** ============ 全国省份景点标记 ============ */
let provinceSpotsLoaded = false;
const CATEGORY_COLORS = {
  '自然风光': '#10B981', '历史人文': '#F59E0B', '古镇村落': '#8B5CF6',
  '宗教圣地': '#EF4444', '现代城市': '#3B82F6', '文化艺术': '#EC4899',
  '民族文化': '#F97316',
};

/**
 * 加载全国各省景点标记到地图
 * - 大标记（big）：橙色水滴，60%大小，每省≥5个主要景点
 * - 小标记（small）：黑色水滴，60%大小，每省≥10个次级景点
 */
function loadAllProvinceSpots() {
  if (!leafletMap || provinceSpotsLoaded) return;
  provinceSpotsLoaded = true;

  // 延迟加载确保地图就绪，先清除所有旧标记
  setTimeout(() => {
    clearAllMarkers();

    if (!window.ALL_PROVINCE_SPOTS) {
      console.warn('[地图] ALL_PROVINCE_SPOTS 数据未加载');
      return;
    }

    for (const spot of ALL_PROVINCE_SPOTS) {
      const markerType = spot.type;
      const marker = L.marker([spot.lat, spot.lng], {
        icon: createMarkerIcon(false, false, markerType),
        opacity: markerType === 'small' ? 0.75 : 1,
        zIndexOffset: markerType === 'big' ? 100 : 0,
      }).addTo(leafletMap);

      const catColor = CATEGORY_COLORS[spot.category] || '#64748B';
      marker.bindPopup(`
        <div class="dest-popup" style="min-width:160px;">
          <div class="popup-name" style="font-size:0.92rem;">${spot.name}</div>
          <div class="popup-addr" style="font-size:0.78rem;">
            <span style="display:inline-block;background:${catColor};color:#fff;padding:1px 6px;border-radius:3px;font-size:0.68rem;margin-right:4px;">${spot.category}</span>
            ${spot.province}
          </div>
          <div class="popup-rating" style="margin-top:4px;">⭐ ${spot.rating} · ${spot.type === 'big' ? '主要景点' : '推荐景点'}</div>
          <div style="font-size:0.72rem;color:#666;margin-top:3px;line-height:1.4;">${spot.desc}</div>
        </div>
      `);

      marker._spotData = spot;

      // 点击标记时更新底部信息栏
      marker.on('click', () => {
        document.getElementById('mapDestName').innerHTML = `
          <i class="fa-solid fa-map-pin"></i>
          <span>${spot.name}</span>
        `;
        selectedSpot = { name: spot.name, addr: spot.province, lat: spot.lat, lng: spot.lng };
      });

      leafletMarkers.push(marker);
    }

    console.log(`[地图] 已加载 ${ALL_PROVINCE_SPOTS.length} 个全国景点标记`);
  }, 500);
}

/** ============ 底图与地图初始化 ============ */

/** 初始化 Leaflet 地图 */
function initLeafletMap() {
  const mapEl = document.getElementById('leafletMap');
  if (!mapEl || leafletMap) return;

  leafletMap = L.map('leafletMap', {
    center: [35.86, 104.19],
    zoom: 5,
    minZoom: 4,
    maxZoom: 18,          /* 路线规划时可放大看清细节 */
    zoomControl: true,
    attributionControl: false,
  });

  // 底图策略：高德地图（国内优先）→ CartoDB Voyager → CartoDB Positron → OSM
  tryAddTileLayer(
    'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    (tl) => { currentTileLayer = tl; mapEl.style.backgroundColor = '#f8f4ec'; },
    () => {
      tryAddTileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        (tl) => {
          currentTileLayer = tl;
          mapEl.style.backgroundColor = '#f5f0e8';
        },
        () => {
          tryAddTileLayer(
            'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            (tl) => { currentTileLayer = tl; mapEl.style.backgroundColor = '#f2efe9'; },
            () => {
              tryAddTileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                (tl) => { currentTileLayer = tl; },
                () => {
                  mapEl.style.background = '#e8e3dc';
                  console.warn('[地图] 所有瓦片源加载失败');
                }
              );
            }
          );
        }
      );
    },
    '1'   // 高德子域名用数字 1-4，testSubdomain='1'
  );

  // 加载标记和边界
  // loadHotDestMarkers();  // 已停用旧标记，统一使用省份景点标记
  // loadAllProvinceSpots();  // 已停用：不再显示景点标记
  // setTimeout(() => loadProvinceBoundaries(), 800);  // 已停用：不再显示省份边界
}

/**
 * 尝试添加瓦片图层，支持成功/失败回调
 */
function tryAddTileLayer(url, onSuccess, onFail, testSubdomain = 'a') {
  const tileLayer = L.tileLayer(url, {
    maxZoom: 18,
    subdomains: testSubdomain === '1' ? '1234' : 'abcd',
    crossOrigin: true,
  });

  const testImg = new Image();
  testImg.crossOrigin = 'anonymous';
  testImg.onload = () => {
    if (!leafletMap.hasLayer(tileLayer)) {
      tileLayer.addTo(leafletMap);
      if (onSuccess) onSuccess(tileLayer);
    }
  };
  testImg.onerror = () => { if (onFail) onFail(); };
  testImg.src = url.replace('{s}', testSubdomain).replace('{z}','5').replace('{x}','16').replace('{y}','10');
  return tileLayer;
}

/** ============ 底图风格切换 ============ */
let currentTileLayer = null;
let currentMapStyle = 'light';

const MAP_STYLES = {
  light: {
    tiles: [
      // 高德地图（国内优先）
      { url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', sub: '1234' },
      { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', sub: 'abcd' },
      { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', sub: 'abcd' },
      { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', sub: 'abcd' },
    ],
    bgColor: '#f8f4ec',
    provinceColor: '#8B7355',
    provinceOpacity: 0.55,
  },
  dark: {
    tiles: [
      { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', sub: 'abcd' },
      { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', sub: 'abcd' },
    ],
    bgColor: '#1a1a2e',
    provinceColor: '#C0A060',
    provinceOpacity: 0.65,
  },
};

/** 切换地图底图风格 */
function switchMapStyle(style) {
  if (!leafletMap || currentMapStyle === style) return;
  currentMapStyle = style;
  const cfg = MAP_STYLES[style];

  // 移除旧瓦片层
  if (currentTileLayer) {
    leafletMap.removeLayer(currentTileLayer);
  }

  // 更新背景色
  document.getElementById('leafletMap').style.backgroundColor = cfg.bgColor;

  // 加载新瓦片：逐级尝试
  let tileIdx = 0;
  function tryNext() {
    if (tileIdx >= cfg.tiles.length) return;
    const t = cfg.tiles[tileIdx];
    const tileLayer = L.tileLayer(t.url, {
      maxZoom: 18,
      subdomains: t.sub,
      crossOrigin: true,
    });

    const testImg = new Image();
    testImg.crossOrigin = 'anonymous';
    testImg.onload = () => {
      currentTileLayer = tileLayer;
      tileLayer.addTo(leafletMap);
    };
    testImg.onerror = () => {
      tileIdx++;
      tryNext();
    };
    const testSub = t.sub[0]; // 取第一个子域用于探测
    testImg.src = t.url.replace('{s}', testSub).replace('{z}', '5').replace('{x}', '16').replace('{y}', '10');
  }
  tryNext();

  // 同步更新省份边界颜色
  if (provinceLayer) {
    provinceLayer.setStyle({
      color: cfg.provinceColor,
      opacity: cfg.provinceOpacity,
    });
  }

  // 更新按钮状态
  document.querySelectorAll('.map-style-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.style === style);
  });
}

/** 绑定底图切换按钮事件 */
function initMapStyleToggle() {
  const bar = document.getElementById('mapStyleBar');
  if (!bar) return;
  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.map-style-btn');
    if (!btn) return;
    switchMapStyle(btn.dataset.style);
  });
}

/** 加载热门目的地标记到地图 */
function loadHotDestMarkers() {
  if (!leafletMap) return;
  clearAllMarkers();

  const allDests = getAllDestinations();
  for (const d of allDests) {
    const coord = DEST_COORDS[d.key];
    if (!coord) continue;
    const gcj = wgs84ToGcj02(coord[1], coord[0]);
    const { lat, lng } = gcj;
    const addr = coord[2];

    const marker = L.marker([lat, lng], {
      icon: createMarkerIcon(d.isHot, false),
    }).addTo(leafletMap);

    marker.bindPopup(`
      <div class="dest-popup">
        <div class="popup-name">${d.name}</div>
        <div class="popup-addr">${addr}</div>
        <div class="popup-rating">⭐ ${d.rating || '4.5'}</div>
      </div>
    `);

    marker._destData = { key: d.key, name: d.name, addr, lat, lng, isHot: d.isHot };

    // 点击地图标记
    marker.on('click', () => {
      highlightMapMarker(marker);
      selectedSpot = { name: d.name, addr };
      document.getElementById('mapDestName').innerHTML = `<i class="fa-solid fa-map-pin"></i><span>${d.name}</span>`;
    });

    leafletMarkers.push(marker);
  }
}

/** 清除所有标记 */
function clearAllMarkers() {
  leafletMarkers.forEach(m => leafletMap.removeLayer(m));
  leafletMarkers = [];
  activeMarker = null;
}

/** 高亮指定标记，取消之前的 */
function highlightMapMarker(marker) {
  if (activeMarker && activeMarker._destData) {
    const d = activeMarker._destData;
    activeMarker.setIcon(createMarkerIcon(d.isHot, false));
  }
  if (marker && marker._destData) {
    marker.setIcon(createMarkerIcon(marker._destData.isHot, true));
    marker.openPopup();
  }
  activeMarker = marker;
}

/** 通过目的地名称定位地图标记 */
async function locateOnMap(name, addr) {
  if (!leafletMap) return;

  // 尝试本地坐标
  let coord = getDestCoord(name);
  if (!coord) {
    // AI 搜索结果走 geocoding
    const geo = await geocodeAddress(name);
    if (geo) coord = geo;
  }

  if (!coord) {
    console.warn('[地图] 无法定位:', name);
    return;
  }

  const { lat, lng } = coord;

  // 找到已有标记或创建新标记
  let foundMarker = null;
  for (const m of leafletMarkers) {
    if (m._destData && m._destData.name === name) {
      foundMarker = m;
      break;
    }
  }

  if (!foundMarker) {
    // 为 AI 搜索结果创建临时标记
    foundMarker = L.marker([lat, lng], {
      icon: createMarkerIcon(false, true),
    }).addTo(leafletMap);

    foundMarker.bindPopup(`
      <div class="dest-popup">
        <div class="popup-name">${name}</div>
        <div class="popup-addr">${addr || coord.addr || ''}</div>
      </div>
    `);

    foundMarker._destData = { name, addr, lat, lng, isHot: false, temp: true };
    leafletMarkers.push(foundMarker);
  }

  // 移动视图并高亮
  leafletMap.setView([lat, lng], Math.min(Math.max(leafletMap.getZoom(), 7), 10), { animate: true });
  highlightMapMarker(foundMarker);
}
function openExternalMap(destName) {
  const name = destName || (selectedSpot ? selectedSpot.name : '');
  if (!name) { showToast(T.selectDest); return; }

  // 高德地图（国内手机端首选）
  const gaodeUrl = `https://uri.amap.com/search?keyword=${encodeURIComponent(name)}&callnative=1`;
  // 百度地图
  const baiduUrl = `https://api.map.baidu.com/geocoder?address=${encodeURIComponent(name)}&output=html&src=wandr`;

  // PC 端优先百度、移动端优先高德
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const url = isMobile ? gaodeUrl : baiduUrl;
  window.open(url, '_blank');
}

function navigateTo(dest) {
  showToast(T.navigating(dest));
  setTimeout(() => openExternalMap(dest), 400);
}

function navigateCurrentDest() {
  const dest = window._currentDest;
  if (!dest) { showToast(T.needAiFirst); return; }
  const name = dest.name.split('·')[0].trim();
  navigateTo(name);
}

// ============ 从收藏导入行程到路线规划 ============
function importPlanToNavigate(index) {
  const favs = getFavorites();
  const fav = favs[index];
  if (!fav || !fav.isAiPlan || !fav.days || !fav.days.length) {
    showToast('该收藏没有可导入的行程数据');
    return;
  }

  // 关闭用户面板
  closeUserPanel();

  // 如果只有一天，直接导入
  if (fav.days.length === 1) {
    doImportPlanDay(fav, 0);
    return;
  }

  // 多天行程：弹出日期选择 Modal
  showDayPickerModal(fav, index);
}

/** 获取内联日期选择容器 */
function getDayPickerInline() {
  return document.getElementById('dayPickerInline');
}

/** 显示/隐藏导入按钮区域 */
function toggleImportSection(show) {
  const section = document.getElementById('navImportSection');
  if (section) section.style.display = show ? '' : 'none';
}

/** 在内联面板渲染天数选择 */
function renderInlineDayPicker(fav, onBack) {
  const container = getDayPickerInline();
  if (!container) return;

  // 隐藏导入按钮，显示选择器
  toggleImportSection(false);
  container.style.display = '';

  container.innerHTML = `
    <div class="inline-picker-header">
      <button class="inline-picker-back" data-action="inlinePickerBack">
        <i class="fa-solid fa-arrow-left"></i> 返回
      </button>
      <div class="inline-picker-title">
        <i class="fa-solid fa-route"></i> 「${fav.name}」行程路线
      </div>
      <div class="inline-picker-sub">行程共 ${fav.days.length} 天，选择要导入哪一天的路线</div>
    </div>
    <div class="inline-picker-list">
      ${fav.days.map((d, i) => {
        const addrCount = (d.acts || []).filter(a => a.addr).length;
        const hasRoute = !!d.routeData;
        const routeInfo = hasRoute
          ? ` · ${formatDistance(d.routeData.summary.totalDistance)} · ${formatDuration(d.routeData.summary.totalTime)}`
          : '';
        return `
          <button class="day-picker-item inline-day-item ${hasRoute ? 'has-route' : ''}" data-day="${i}">
            <div class="day-picker-item-num">Day ${i + 1}${hasRoute ? ' 🛣' : ''}</div>
            <div class="day-picker-item-info">
              <div class="day-picker-item-title">${d.title || '第' + (i + 1) + '天'}</div>
              <div class="day-picker-item-desc">${d.desc || getDaySummary(d)}</div>
              <div class="day-picker-item-meta">
                <span><i class="fa-solid fa-list-check"></i> ${d.acts.length} 个行程</span>
                <span><i class="fa-solid fa-location-dot"></i> ${addrCount} 个可导航地址</span>
                ${hasRoute ? `<span style="color:var(--clr-primary);"><i class="fa-solid fa-map-marked-alt"></i> 已规划${routeInfo}</span>` : ''}
              </div>
            </div>
            <i class="fa-solid fa-chevron-right"></i>
          </button>`;
      }).join('')}
    </div>
    <div class="inline-picker-footer">
      <button class="inline-picker-btn secondary" data-action="inlinePickerCancel">取消</button>
      <button class="inline-picker-btn primary" data-day="-1" data-action="inlinePickerAll">
        <i class="fa-solid fa-layer-group"></i> 导入全部天数
      </button>
    </div>
  `;

  container._onBack = onBack;
  container._fav = fav;
}

/** 在内联面板渲染目的地选择 */
function renderInlineDestPicker(planFavs, onBack) {
  const container = getDayPickerInline();
  if (!container) return;

  toggleImportSection(false);
  container.style.display = '';

  container.innerHTML = `
    <div class="inline-picker-header">
      <button class="inline-picker-back" data-action="inlinePickerBack">
        <i class="fa-solid fa-arrow-left"></i> 返回
      </button>
      <div class="inline-picker-title">
        <i class="fa-solid fa-file-import"></i> 从 AI 收藏导入路线
      </div>
      <div class="inline-picker-sub">选择一个已保存的行程方案</div>
    </div>
    <div class="inline-picker-list">
      ${planFavs.map(f => `
        <button class="day-picker-item inline-day-item day-picker-dest-item" data-fav-name="${f.name.replace(/"/g, '&quot;')}">
          <img src="${f.img}" alt="${f.name}" class="day-picker-thumb" loading="lazy">
          <div class="day-picker-item-info">
            <div class="day-picker-item-title">${f.name}</div>
            <div class="day-picker-item-desc">${f.location || ''} · ${f.days.length} 天行程</div>
          </div>
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      `).join('')}
    </div>
    <div class="inline-picker-footer">
      <button class="inline-picker-btn secondary" data-action="inlinePickerCancel">取消</button>
    </div>
  `;

  container._onBack = onBack;
  container._planFavs = planFavs;
}

/** 重置内联选择器到初始状态 */
function resetInlinePicker() {
  const container = getDayPickerInline();
  if (container) {
    container.style.display = 'none';
    container.innerHTML = '';
    delete container._fav;
    delete container._planFavs;
    delete container._onBack;
  }
  toggleImportSection(true);
}

function handleInlinePickerBack() {
  const container = getDayPickerInline();
  if (container && container._onBack) {
    container._onBack();
  } else {
    resetInlinePicker();
  }
}

function handleInlinePickerCancel() {
  resetInlinePicker();
}

function handleInlinePickerAll(el) {
  const container = getDayPickerInline();
  const fav = container?._fav;
  if (fav) {
    resetInlinePicker();
    doImportPlanDay(fav, -1);
  }
}

function showDayPickerModal(fav) {
  renderInlineDayPicker(fav, resetInlinePicker);
}

function doImportPlanDay(fav, day) {
  // 存储路线来源：规划后可回存到原行程的对应天数
  window._routePlanSource = { favName: fav.name, day: day };

  // 提取地址
  let addrs = [];
  if (day === -1) {
    // 导入全部天数
    fav.days.forEach(d => {
      (d.acts || []).forEach(a => {
        if (a.addr) addrs.push({ name: a.name, addr: a.addr, time: a.time });
      });
    });
  } else {
    // 导入指定天
    const dayData = fav.days[day];
    if (dayData && dayData.acts) {
      addrs = dayData.acts.filter(a => a.addr).map(a => ({ name: a.name, addr: a.addr, time: a.time }));
    }
  }

  // 去重：同一地址在不同天数可能重复出现，按地址精确去重保留首次出现
  const seenAddrs = new Set();
  addrs = addrs.filter(a => {
    const key = a.addr.replace(/\s+/g, '');
    if (seenAddrs.has(key)) return false;
    seenAddrs.add(key);
    return true;
  });

  if (addrs.length === 0) {
    showToast('所选行程中没有可导航的地址');
    return;
  }

  // 渲染到左侧景点列表
  const spotList = document.getElementById('spotList');

  // 构建标题
  const dayLabel = day === -1 ? '全部行程' : `第${day + 1}天`;

  // 检查该天是否已有保存的路线规划
  const dayDataForRoute = day >= 0 && fav.days ? fav.days[day] : null;
  const existingRoute = dayDataForRoute?.routeData;
  const routeSummaryHTML = existingRoute ? `
    <div class="existing-route-alert">
      <i class="fa-solid fa-circle-info"></i>
      <span>此行程已保存路线规划：${formatDistance(existingRoute.summary.totalDistance)} · ${formatDuration(existingRoute.summary.totalTime)}</span>
      <button class="existing-route-load-btn" data-action="loadExistingRouteForDay" data-fav-day="${day}">
        <i class="fa-solid fa-map"></i> 加载路线
      </button>
    </div>
  ` : '';

  spotList.innerHTML = `
    <div class="import-plan-header">
      <div class="import-plan-title">
        <i class="fa-solid fa-route"></i> ${fav.name} · ${dayLabel}
      </div>
      <div class="import-plan-desc">${addrs.length} 个目的地已导入</div>
    </div>
    ${routeSummaryHTML}
    <div class="import-select-all">
      <label class="import-checkbox-wrap">
        <input type="checkbox" id="importSelectAll" checked onchange="toggleAllImportSpots(this)">
        <span>全选</span>
      </label>
      <span class="import-selected-count" id="importSelectedCount">已选 ${addrs.length} 个</span>
    </div>
    <button class="btn-import-to-route" data-action="importToRoutePlan" style="width:100%; margin-bottom:8px; padding:8px; border-radius:var(--radius-sm); border:1.5px solid var(--clr-primary); background:rgba(46,139,87,0.06); color:var(--clr-primary); font-size:0.82rem; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.2s;">
      <i class="fa-solid fa-arrows-turn-to-dots"></i> 转入多点路线规划
    </button>
    ${addrs.map((a, i) => `
      <label class="spot-item import-spot-item import-spot-label">
        <input type="checkbox" class="import-spot-checkbox" checked data-name="${a.name.replace(/"/g, '&quot;')}" data-addr="${a.addr.replace(/"/g, '&quot;')}" onchange="updateImportSelectedCount()">
        <div class="spot-item-left">
          <div class="spot-item-num">${a.time || (i + 1)}</div>
          <div class="spot-item-content">
            <div class="spot-item-title">${a.name}</div>
            <div class="spot-item-addr"><i class="fa-solid fa-location-dot"></i> ${a.addr}</div>
          </div>
        </div>
      </label>
    `).join('')}
    <button class="btn-import-clear" data-action="clearImportedPlan"><i class="fa-solid fa-xmark"></i> 清除导入</button>
  `;

  // 更新地图标记
  addImportMarkers(addrs);

  // 滚动到导航区域
  document.getElementById('navigate').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * 从 ALL_PROVINCE_SPOTS 本地数据查找景点坐标
 * 先按名称精确匹配，再按地址模糊匹配
 */
function findSpotInAllData(name, addr) {
  const spots = window.ALL_PROVINCE_SPOTS || [];
  if (!spots.length) return null;

  // 精确名称匹配
  let match = spots.find(s => s.name === name);
  if (match) return match;

  // 名称包含匹配（如 "回民街美食巡礼" 匹配 "回民街"）
  match = spots.find(s => name.includes(s.name) || s.name.includes(name));
  if (match) return match;

  // 通过地址中的关键词匹配（如提取省份、城市、区县）
  if (addr) {
    const keywords = extractLocationKeywords(addr);
    for (const kw of keywords) {
      match = spots.find(s => s.province && s.province.includes(kw));
      if (match) return match;
    }
  }

  return null;
}

/** 从地址中提取省份/城市关键词 */
function extractLocationKeywords(addr) {
  const keywords = [];
  // 提取省份
  const provMatch = addr.match(/(北京|天津|上海|重庆|河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|海南|四川|贵州|云南|陕西|甘肃|青海|台湾|内蒙古|广西|西藏|宁夏|新疆|香港|澳门)/);
  if (provMatch) keywords.push(provMatch[0]);
  // 提取地级市（取前2-3个汉字+市）
  const cityMatch = addr.match(/([\u4e00-\u9fa5]{2,3})(?:市|州|地区|盟)/);
  if (cityMatch) keywords.push(cityMatch[1]);
  return keywords;
}

/** 在地图上放置单个导入标记 */
function placeImportMarker(spot, lat, lng, index) {
  const marker = L.marker([lat, lng], {
    icon: L.divIcon({
      className: 'import-marker',
      html: `<div class="import-marker-num">${index + 1}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    })
  }).addTo(leafletMap)
    .bindPopup(`<b>${spot.name}</b><br>${spot.addr}`);

  window._importMarkers.push(marker);
  return marker;
}

function addImportMarkers(addrs) {
  if (!leafletMap) return;

  // 清除旧标记
  clearImportMarkers();

  window._importMarkers = [];

  // 优先从本地 ALL_PROVINCE_SPOTS 数据查找坐标（速度快，不走网络）
  const remainingAddrs = [];
  addrs.forEach((spot, i) => {
    const localSpot = findSpotInAllData(spot.name, spot.addr);
    if (localSpot) {
      // 本地数据为 WGS-84，需转为 GCJ-02 适配高德地图瓦片
      const gcj = wgs84ToGcj02(localSpot.lng, localSpot.lat);
      placeImportMarker(spot, gcj.lat, gcj.lng, i);
    } else {
      remainingAddrs.push({ spot, index: i });
    }
  });

  // 本地未匹配的地址，通过服务端 AMAP API 批量地理编码
  if (remainingAddrs.length > 0) {
    fetch('/api/address/batch-geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addresses: remainingAddrs.map(a => ({
          address: a.spot.addr,
          city: extractCityFromAddress(a.spot.addr)
        }))
      })
    })
    .then(res => res.json())
    .then(json => {
      if (json.success && json.data) {
        json.data.forEach((result, idx) => {
          if (result && result.longitude && result.latitude) {
            const { spot, index } = remainingAddrs[idx];
            placeImportMarker(spot, result.latitude, result.longitude, index);
          }
        });
      }
    })
    .catch(err => {
      console.warn('[导入标记] 服务端地理编码失败:', err.message);
    })
    .finally(() => {
      // 调整地图视野
      const allMarkers = window._importMarkers;
      if (allMarkers && allMarkers.length > 0) {
        const bounds = allMarkers.map(m => [m.getLatLng().lat, m.getLatLng().lng]);
        leafletMap.fitBounds(bounds, { padding: [40, 40] });
      }
    });
  } else {
    // 全部从本地匹配成功，直接调整视野
    const allMarkers = window._importMarkers;
    if (allMarkers && allMarkers.length > 0) {
      const bounds = allMarkers.map(m => [m.getLatLng().lat, m.getLatLng().lng]);
      leafletMap.fitBounds(bounds, { padding: [40, 40] });
    }
  }
}

function clearImportMarkers() {
  if (window._importMarkers) {
    window._importMarkers.forEach(m => leafletMap.removeLayer(m));
    window._importMarkers = [];
  }
}

function clearImportedPlan() {
  clearImportMarkers();
  document.getElementById('spotList').innerHTML = '';
  selectedSpot = null;
  document.getElementById('mapDestName').innerHTML = '<i class="fa-solid fa-map-pin"></i><span>点击景点查看位置</span>';
  window._routePlanSource = null;  // 清除路线来源引用
}

function openImportFromFavorites() {
  const favs = getFavorites();
  const planFavs = favs.filter(f => f.isAiPlan && f.days && f.days.length);

  if (planFavs.length === 0) {
    showToast('暂无 AI 生成的行程收藏，请先使用 AI 规划并保存行程');
    return;
  }

  // 如果只有一个，直接进入天数选择
  if (planFavs.length === 1) {
    appendDayPickerModal(planFavs[0]);
    return;
  }

  // 多个收藏：先选目的地
  showFavDestinationPicker(planFavs);
}

/** 打开已保存的路线规划列表 */
function openSavedRoutes() {
  const favs = getFavorites();
  const routePlans = favs.filter(f => f.isRoutePlan && f.routeData);

  if (routePlans.length === 0) {
    showToast('暂无已保存的路线规划，请先在路线规划中完成规划并保存');
    return;
  }

  // 在内联区域渲染路线列表
  renderSavedRoutesList(routePlans);
}

/** 在内联区域渲染已保存路线列表 */
function renderSavedRoutesList(routePlans) {
  const container = document.getElementById('spotList');
  if (!container) return;

  toggleImportSection(false);

  // 构建索引映射：从完整收藏列表中获取实际索引
  const allFavs = getFavorites();
  const routeIndices = routePlans.map(rp => allFavs.indexOf(rp));

  container.innerHTML = `
    <div class="import-controls">
      <button class="import-ctrl-btn" data-action="inlinePickerBack">
        <i class="fa-solid fa-arrow-left"></i> 返回
      </button>
      <span class="import-filter-hint">共 ${routePlans.length} 条已保存路线</span>
    </div>
    <div class="import-spot-list">
      ${routePlans.map((f, i) => `
        <div class="import-spot-item">
          <div class="import-spot-info">
            <div class="import-spot-name">
              <i class="fa-solid fa-map-marked-alt" style="color:var(--clr-primary);margin-right:4px;"></i>${f.name}
            </div>
            <div class="import-spot-addr">${f.sub}</div>
            <div class="import-spot-time">${f.addedAt}</div>
          </div>
          <div class="import-spot-actions">
            <button class="import-spot-btn primary" data-action="loadRoutePlanFromSaved" data-index="${routeIndices[i]}" title="加载此路线进行编辑或导航">
              <i class="fa-solid fa-map"></i> 加载路线
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function showFavDestinationPicker(planFavs) {
  renderInlineDestPicker(planFavs, resetInlinePicker);
}

function appendDayPickerModal(fav) {
  window._importFav = fav;
  renderInlineDayPicker(fav, function() {
    // 返回时重新显示目的地选择
    const favs = getFavorites().filter(f => f.isAiPlan && f.days && f.days.length);
    if (favs.length > 1) {
      renderInlineDestPicker(favs, resetInlinePicker);
    } else {
      resetInlinePicker();
    }
  });
}

// ============ 多点路线规划 ============
let routePanelMode = 'single';        // 'single' | 'route'
let routePanelWaypoints = [];         // 途经点 DOM 行引用
let routePlanPolyline = null;         // 地图上的路线
let routePlanOutline = null;          // 路线白色描边
let routePlanHighlight = null;        // 路线高光内层
let routePlanMarkers = [];            // 规划标记
let lastRoutePlanData = null;         // 最近一次成功的路线规划结果（可保存到收藏）

/** 切换导航面板模式 */
function switchNavPanelMode(panel) {
  routePanelMode = panel;
  document.querySelectorAll('.nav-panel-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.nav-panel-tab[data-panel="${panel}"]`)?.classList.add('active');
  
  const singlePanel = document.getElementById('singleNavPanel');
  const routePanel = document.getElementById('routePlanPanel');
  
  if (panel === 'single') {
    singlePanel.style.display = '';
    routePanel.style.display = 'none';
  } else {
    singlePanel.style.display = 'none';
    routePanel.style.display = '';
  }
}

/** 添加途经点行 */
function addRouteWaypoint() {
  const list = document.getElementById('routeAddressList');
  const wpCount = list.querySelectorAll('.route-addr-row[data-type="waypoint"]').length;
  if (wpCount >= 30) { showToast('最多支持30个途经点'); return; }
  
  const row = document.createElement('div');
  row.className = 'route-addr-row';
  row.dataset.type = 'waypoint';
  row.innerHTML = `
    <span class="route-addr-tag waypoint">途经</span>
    <input type="text" class="route-addr-input" placeholder="输入途经点地址..." oninput="searchRouteAddress(this)">
    <div class="route-addr-suggestions" style="display:none"></div>
    <button class="route-addr-remove" onclick="removeRouteWaypoint(this)" title="移除">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  
  // 插入到终点行之前
  const destRow = list.querySelector('.route-addr-row[data-type="destination"]');
  list.insertBefore(row, destRow);
  routePanelWaypoints.push(row);
}

/** 移除途经点行 */
function removeRouteWaypoint(btn) {
  const row = btn.closest('.route-addr-row');
  routePanelWaypoints = routePanelWaypoints.filter(r => r !== row);
  row.remove();
}

/** 搜索地址联想 */
let routeSearchTimers = {};
function searchRouteAddress(input) {
  const row = input.closest('.route-addr-row');
  const suggestionsDiv = row.querySelector('.route-addr-suggestions');
  const keyword = input.value.trim();
  
  if (routeSearchTimers[row]) clearTimeout(routeSearchTimers[row]);
  
  if (keyword.length < 2) {
    suggestionsDiv.style.display = 'none';
    return;
  }
  
  routeSearchTimers[row] = setTimeout(async () => {
    try {
      const resp = await fetch(`/api/address/search?keyword=${encodeURIComponent(keyword)}&limit=5`);
      const json = await resp.json();
      if (json.success && json.data && json.data.results && json.data.results.length > 0) {
        suggestionsDiv.innerHTML = json.data.results.map(r => `
          <div class="route-addr-sug-item" data-name="${r.name.replace(/"/g, '&quot;')}" data-addr="${(r.address || r.name).replace(/"/g, '&quot;')}">
            <div class="route-addr-sug-name">${r.name}</div>
            <div class="route-addr-sug-addr">${r.address || r.district || ''}</div>
          </div>
        `).join('');
        suggestionsDiv.style.display = 'block';
        
        suggestionsDiv.querySelectorAll('.route-addr-sug-item').forEach(item => {
          item.addEventListener('click', function() {
            input.value = this.dataset.name;
            input.dataset.selectedAddr = this.dataset.addr;
            suggestionsDiv.style.display = 'none';
          });
        });
      } else {
        suggestionsDiv.style.display = 'none';
      }
    } catch (e) {
      suggestionsDiv.style.display = 'none';
    }
  }, 400);
}

// 点击外部关闭搜索联想
document.addEventListener('click', function(e) {
  if (!e.target.closest('.route-addr-row')) {
    document.querySelectorAll('.route-addr-suggestions').forEach(d => d.style.display = 'none');
  }
});

/** 从完整地址中提取市级行政区，提升地理编码精度 */
function extractCityFromAddress(addr) {
  if (!addr) return '';
  // 去掉省级前缀，再提取市/州/盟级行政区
  const withoutProvince = addr.replace(/^[^省]+?省/, '');
  const match = withoutProvince.match(/^(.+?[州市盟])/);
  return match ? match[1] : '';
}

/** 开始路线规划 */
async function startRoutePlanning() {
  const btn = document.getElementById('startRouteBtn');

  // 收集所有地址
  const rows = document.querySelectorAll('#routeAddressList .route-addr-row');
  const addresses = [];

  rows.forEach(row => {
    const input = row.querySelector('.route-addr-input');
    const addr = input.value.trim();
    if (addr) {
      addresses.push({
        address: addr,
        fullAddress: addr,
        type: row.dataset.type,
        city: extractCityFromAddress(addr)
      });
    }
  });
  
  if (addresses.length < 2) {
    showToast('至少需要输入起点和终点地址');
    return;
  }
  
  // 按钮禁用+加载态
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 规划中...';
  
  try {
    // 策略映射：HTML radio 字符串值 → 高德 drivingStrategy 整数
    const strategyMap = { time: 0, distance: 2, smooth: 4, cost: 1 };
    const checkedStrategy = document.querySelector('input[name="routeStrategy"]:checked');
    const options = {
      strategy: checkedStrategy ? (strategyMap[checkedStrategy.value] ?? 0) : 0,
      optimizeOrder: document.getElementById('optimizeOrder').checked,
      optimizationStrategy: 'balanced'
    };
    
    const resp = await fetch('/api/route/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresses, options })
    });
    
    const json = await resp.json();
    
    if (!json.success) {
      const errMsg = json.error?.message || '路线规划失败';
      if (errMsg.includes('INVALID_USER_KEY') || errMsg.includes('key') || json.error?.code === 'INVALID_KEY' || json.error?.suggestion) {
        showToast('高德地图 API Key 未配置，请在 server/.env 中设置 AMAP_API_KEY');
        console.warn('[路线规划] 需要配置 AMAP_API_KEY → https://console.amap.com/dev/key/app');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-play"></i> 开始规划';
        return;
      }
      throw new Error(errMsg);
    }
    
    const data = json.data;
    
    // 隐藏原有标记，聚焦路线
    hideOriginalMarkers();
    
    // 绘制路线
    drawRouteOnMap(data);
    
    // 显示结果摘要
    document.getElementById('routePlanDist').textContent = formatDistance(data.summary.totalDistance);
    document.getElementById('routePlanTime').textContent = formatDuration(data.summary.totalTime);
    document.getElementById('routePlanToll').textContent = data.summary.totalTollFee > 0 ? `¥${data.summary.totalTollFee}` : '免费';
    document.getElementById('routeSummary').style.display = '';
    
    // 存储本次路线数据，以便保存到收藏
    const strategyText = checkedStrategy ? checkedStrategy.value : 'time';
    lastRoutePlanData = {
      addresses: addresses.map(a => ({ address: a.address, type: a.type })),
      strategy: strategyText,
      optimizeOrder: document.getElementById('optimizeOrder').checked,
      summary: {
        totalDistance: data.summary.totalDistance,
        totalTime: data.summary.totalTime,
        totalTollFee: data.summary.totalTollFee
      },
      origin: data.origin,
      destination: data.destination,
      waypoints: data.waypoints || [],
      routes: data.routes || [],
      polyline: data.routes && data.routes.length > 0 ? data.routes[0].polyline : null
    };
    
    showToast('路线规划完成！');
    
  } catch (err) {
    console.error('[路线规划] 失败:', err);
    const msg = err.message || '';
    if (msg.includes('INVALID_USER_KEY') || msg.includes('INVALID_KEY')) {
      showToast('高德地图 API Key 未配置，请在 server/.env 中设置 AMAP_API_KEY');
    } else {
      showToast('路线规划失败: ' + (msg || '服务暂不可用'));
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-play"></i> 开始规划';
  }
}

/** 格式化距离 */
function formatDistance(meters) {
  if (meters >= 1000) return (meters / 1000).toFixed(1) + ' 公里';
  return meters + ' 米';
}

/** 格式化时长 */
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return h + ' 小时 ' + m + ' 分钟';
  return m + ' 分钟';
}

/** 解码高德 polyline 加密字符串 */
function decodePolyline(encoded) {
  if (!encoded || encoded.length === 0) return [];
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0, lng = 0;
  
  while (index < len) {
    let shift = 0, result = 0;
    let b;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;
    
    shift = 0; result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;
    
    points.push([lat / 1e6, lng / 1e6]);
  }
  return points;
}

/** 在地图上绘制路线（导航风格，按顺序连接途经点） */
function drawRouteOnMap(data) {
  if (!leafletMap) return;
  
  // 清除旧路线
  clearRoutePlanOnMap();
  
  // --- 1. 构建有序点列表：起点 → 途经点A,B,C… → 终点 ---
  const orderedPoints = [];
  
  if (data.origin && data.origin.latitude && data.origin.longitude) {
    orderedPoints.push({ lat: data.origin.latitude, lng: data.origin.longitude, label: '起', type: 'origin', info: data.origin });
  }
  if (data.waypoints) {
    data.waypoints.forEach((wp, idx) => {
      if (wp.latitude && wp.longitude) {
        orderedPoints.push({ lat: wp.latitude, lng: wp.longitude, label: String.fromCharCode(65 + idx), type: 'waypoint', info: wp });
      }
    });
  }
  if (data.destination && data.destination.latitude && data.destination.longitude) {
    orderedPoints.push({ lat: data.destination.latitude, lng: data.destination.longitude, label: '终', type: 'dest', info: data.destination });
  }
  
  if (orderedPoints.length < 2) return;
  
  // --- 2. 绘制标记 ---
  const markerIcons = {
    origin: L.divIcon({
      className: 'nav-pin origin',
      html: '<div class="nav-pin-circle">起</div><div class="nav-pin-arrow"></div>',
      iconSize: [46, 60], iconAnchor: [23, 52]
    }),
    dest: L.divIcon({
      className: 'nav-pin dest',
      html: '<div class="nav-pin-circle">终</div><div class="nav-pin-arrow"></div>',
      iconSize: [46, 60], iconAnchor: [23, 52]
    }),
    waypoint: (label) => L.divIcon({
      className: 'nav-pin waypoint',
      html: `<div class="nav-pin-circle">${label}</div><div class="nav-pin-arrow"></div>`,
      iconSize: [38, 52], iconAnchor: [19, 44]
    })
  };
  
  orderedPoints.forEach((pt) => {
    let icon, popup;
    if (pt.type === 'origin') {
      icon = markerIcons.origin;
      popup = '<b>起点</b><br>' + (pt.info.fullAddress || '');
    } else if (pt.type === 'dest') {
      icon = markerIcons.dest;
      popup = '<b>终点</b><br>' + (pt.info.fullAddress || '');
    } else {
      icon = markerIcons.waypoint(pt.label);
      popup = `<b>途经点 ${pt.label}</b><br>${pt.info.fullAddress || ''}`;
    }
    const m = L.marker([pt.lat, pt.lng], { icon }).addTo(leafletMap).bindPopup(popup);
    routePlanMarkers.push(m);
  });
  
  // --- 3. 按顺序连接相邻点（主线用 AMap polyline，顺序线段作为高亮连接） ---
  const route = data.routes && data.routes[0];
  let allCoords = [];
  
  if (route && route.polyline) {
    // 解码 AMap 道路折线
    const segments = route.polyline.split(';');
    segments.forEach(seg => {
      if (seg && seg.trim()) {
        try {
          allCoords = allCoords.concat(decodePolyline(seg.trim()));
        } catch (e) {
          const coordPairs = seg.split('|');
          allCoords = allCoords.concat(coordPairs.map(pair => {
            const [lng, lat] = pair.split(',').map(Number);
            return [lat, lng];
          }));
        }
      }
    });
    
    if (allCoords.length > 1) {
      // 白色外描边
      routePlanOutline = L.polyline(allCoords, {
        color: '#ffffff', weight: 14, opacity: 0.92,
        interactive: false, className: 'route-outline'
      }).addTo(leafletMap);

      // 蓝色主路线（流动虚线）
      routePlanPolyline = L.polyline(allCoords, {
        color: '#007AFF', weight: 7, opacity: 1.0,
        lineJoin: 'round', lineCap: 'round', className: 'route-polyline'
      }).addTo(leafletMap);

      // 内层高光
      routePlanHighlight = L.polyline(allCoords, {
        color: '#60A5FA', weight: 3, opacity: 0.55,
        interactive: false, className: 'route-highlight'
      }).addTo(leafletMap);
      
      // 方向箭头
      addRouteArrows(allCoords);
    }
  }
  
  // --- 4. 绘制顺序连接线段（起→A→B→...→终），使途经点顺序一目了然 ---
  for (let i = 0; i < orderedPoints.length - 1; i++) {
    const from = orderedPoints[i];
    const to = orderedPoints[i + 1];
    const segCoords = [[from.lat, from.lng], [to.lat, to.lng]];
    
    // 顺序连接虚线
    const segLine = L.polyline(segCoords, {
      color: '#FF6B35',
      weight: 4,
      opacity: 0.85,
      dashArray: '10 6',
      interactive: false,
      className: 'route-segment-connector'
    }).addTo(leafletMap);
    routePlanMarkers.push(segLine);
    
    // 线段中点方向标
    const midLat = (from.lat + to.lat) / 2;
    const midLng = (from.lng + to.lng) / 2;
    const angle = Math.atan2(to.lat - from.lat, to.lng - from.lng) * 180 / Math.PI;
    const arrowIcon = L.divIcon({
      className: '',
      html: `<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid #FF6B35;transform:rotate(${angle}deg);transform-origin:center;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));"></div>`,
      iconSize: [12, 10], iconAnchor: [6, 5]
    });
    const arrowM = L.marker([midLat, midLng], { icon: arrowIcon, interactive: false }).addTo(leafletMap);
    routePlanMarkers.push(arrowM);
  }
  
  // --- 5. 自动缩放到路线视野 ---
  if (routePlanMarkers.length > 0) {
    const group = new L.featureGroup(routePlanMarkers);
    if (routePlanPolyline) group.addLayer(routePlanPolyline);
    if (routePlanOutline) group.addLayer(routePlanOutline);
    if (routePlanHighlight) group.addLayer(routePlanHighlight);
    leafletMap.fitBounds(group.getBounds(), { padding: [60, 60], maxZoom: 16 });
  }
}

/** 路线方向箭头 */
function addRouteArrows(coords) {
  if (!coords || coords.length < 4) return;
  const step = Math.max(2, Math.floor(coords.length / 12));
  for (let i = step; i < coords.length - step; i += step) {
    const p1 = coords[i], p2 = coords[i + 1] || coords[i - 1];
    const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180 / Math.PI;
    const arrowIcon = L.divIcon({
      className: '',
      html: `<div class="route-arrow" style="transform:rotate(${angle}deg);transform-origin:center;"></div>`,
      iconSize: [10, 10], iconAnchor: [5, 5]
    });
    const marker = L.marker(p1, { icon: arrowIcon, interactive: false }).addTo(leafletMap);
    routePlanMarkers.push(marker);
  }
}

/** 清除地图上的路线 */
function clearRoutePlanOnMap() {
  if (routePlanOutline) {
    leafletMap.removeLayer(routePlanOutline);
    routePlanOutline = null;
  }
  if (routePlanPolyline) {
    leafletMap.removeLayer(routePlanPolyline);
    routePlanPolyline = null;
  }
  if (routePlanHighlight) {
    leafletMap.removeLayer(routePlanHighlight);
    routePlanHighlight = null;
  }
  routePlanMarkers.forEach(m => leafletMap.removeLayer(m));
  routePlanMarkers = [];
}

/** 清除路线规划 */
function clearRoutePlan() {
  clearRoutePlanOnMap();
  restoreOriginalMarkers();  // 恢复原有景点标记
  document.getElementById('routeSummary').style.display = 'none';
  document.getElementById('routePlanDist').textContent = '-';
  document.getElementById('routePlanTime').textContent = '-';
  document.getElementById('routePlanToll').textContent = '-';
  lastRoutePlanData = null;  // 清除缓存路线数据
  window._routePlanSource = null;  // 清除路线来源引用
}

/** 将当前路线规划结果保存到收藏 */
function saveRoutePlanToFavorites() {
  if (!lastRoutePlanData) {
    showToast('没有可保存的路线，请先完成路线规划');
    return;
  }

  const data = lastRoutePlanData;
  const addrs = data.addresses || [];
  const source = window._routePlanSource;

  // ----- 情况1：从AI行程导入的路线 → 回存到原行程的对应天数 -----
  if (source && source.favName && source.day >= 0) {
    const favs = getFavorites();
    const favIndex = favs.findIndex(f => f.name === source.favName && f.isAiPlan);

    if (favIndex === -1) {
      showToast('未找到原行程收藏，路线将保存为独立路线');
      saveAsStandaloneRoute(data, addrs);
      return;
    }

    const fav = favs[favIndex];
    const dayIndex = source.day;
    if (!fav.days || !fav.days[dayIndex]) {
      showToast('原行程数据异常，路线将保存为独立路线');
      saveAsStandaloneRoute(data, addrs);
      return;
    }

    const dayData = fav.days[dayIndex];

    // 将路线规划结果存入当日行程
    dayData.routeData = {
      orderedAddresses: addrs.map(a => ({ address: a.address, type: a.type })),
      strategy: data.strategy,
      optimizeOrder: data.optimizeOrder,
      summary: {
        totalDistance: data.summary.totalDistance,
        totalTime: data.summary.totalTime,
        totalTollFee: data.summary.totalTollFee
      },
      origin: data.origin,
      destination: data.destination,
      waypoints: data.waypoints,
      polyline: data.polyline,
      savedAt: new Date().toLocaleString()
    };

    // 将规划后的有序地址同步回当日 acts（按顺序重排，保留名称/时间）
    syncRouteToDayActs(dayData, addrs);

    saveFavorites(favs);
    refreshBadges();
    renderFavList();
    window._routePlanSource = null;  // 已消费来源引用

    const dayLabel = `第${dayIndex + 1}天`;
    const distStr = formatDistance(data.summary.totalDistance);
    const timeStr = formatDuration(data.summary.totalTime);
    showToast(`路线已保存到「${fav.name}」${dayLabel} ✓\n${distStr} · ${timeStr}`);
    return;
  }

  // ----- 情况2：手动规划的路线 → 创建独立路线收藏 -----
  saveAsStandaloneRoute(data, addrs);
}

/** 将路线规划结果保存为独立的路线收藏条目 */
function saveAsStandaloneRoute(data, addrs) {
  // 生成路线名称
  const firstAddr = addrs.length > 0 ? addrs[0].address : '未命名';
  const lastAddr = addrs.length > 1 ? addrs[addrs.length - 1].address : '';
  const defaultName = lastAddr
    ? `${firstAddr.slice(0, 8)} → ${lastAddr.slice(0, 8)}`
    : firstAddr.slice(0, 15);

  // 弹出简易输入框让用户自定义路线名称
  const routeName = prompt('为这条路线取个名字：', defaultName);
  if (!routeName || !routeName.trim()) return;

  const favs = getFavorites();

  // 生成副标题
  const wpCount = addrs.filter(a => a.type === 'waypoint').length;
  const distStr = formatDistance(data.summary.totalDistance);
  const timeStr = formatDuration(data.summary.totalTime);
  const subParts = [];
  if (wpCount > 0) subParts.push(`途经${wpCount}个点`);
  subParts.push(`${distStr} · ${timeStr}`);
  const sub = subParts.join(' · ');

  // 使用第一个地址尝试查找图片
  let img = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80'; // 默认路线图
  const firstAddrInput = addrs[0]?.address || '';
  const localSpot = findSpotInAllData(firstAddrInput, firstAddrInput);
  if (localSpot && localSpot.img) {
    img = localSpot.img;
  }

  favs.push({
    name: routeName.trim(),
    sub: sub,
    img: img,
    price: data.summary.totalTollFee > 0 ? `¥${data.summary.totalTollFee}` : '免费',
    rating: `${addrs.length}个点`,
    addedAt: new Date().toLocaleDateString(),
    isRoutePlan: true,
    routeData: {
      addresses: addrs,
      strategy: data.strategy,
      optimizeOrder: data.optimizeOrder,
      summary: data.summary,
      origin: data.origin,
      destination: data.destination,
      waypoints: data.waypoints,
      polyline: data.polyline
    }
  });

  saveFavorites(favs);
  refreshBadges();
  renderFavList();
  showToast(`路线「${routeName.trim()}」已保存到收藏 ✓`);
}

/** 将规划后的地址顺序同步回当日 acts 数组 */
function syncRouteToDayActs(dayData, addrs) {
  if (!dayData || !dayData.acts) return;

  // 创建地址→原始act的映射
  const addrToAct = new Map();
  dayData.acts.forEach(act => {
    if (act.addr) {
      const key = act.addr.replace(/\s+/g, '');
      addrToAct.set(key, act);
    }
  });

  // 按规划顺序重建 acts（保留原始 name/time）
  const reordered = [];
  addrs.forEach(a => {
    const key = a.address.replace(/\s+/g, '');
    const orig = addrToAct.get(key);
    if (orig) {
      reordered.push({ ...orig });  // 浅拷贝，保留原始 name/time
    } else {
      // 用户手动添加的地址（不在原行程中）
      reordered.push({ name: a.address.slice(0, 8), addr: a.address, time: '' });
    }
  });

  // 追加原行程中但不在规划路线中的活动（排到最后）
  dayData.acts.forEach(act => {
    if (act.addr) {
      const key = act.addr.replace(/\s+/g, '');
      const alreadyIn = addrs.some(a => a.address.replace(/\s+/g, '') === key);
      if (!alreadyIn) {
        reordered.push({ ...act });
      }
    }
  });

  dayData.acts = reordered;
}

/** 加载已保存到某天的路线规划（从导入列表触发） */
function loadExistingRouteForDay(dayIndex) {
  const source = window._routePlanSource;
  if (!source || !source.favName) {
    showToast('无法定位原行程');
    return;
  }

  const favs = getFavorites();
  const fav = favs.find(f => f.name === source.favName && f.isAiPlan);
  if (!fav || !fav.days || !fav.days[dayIndex] || !fav.days[dayIndex].routeData) {
    showToast('该天没有已保存的路线规划');
    return;
  }

  const routeData = fav.days[dayIndex].routeData;

  // 切换到路线规划面板
  switchNavPanelMode('route');

  // 清除现有途经点
  routePanelWaypoints.forEach(r => r.remove());
  routePanelWaypoints = [];

  const addrs = routeData.orderedAddresses || routeData.addresses || [];
  if (addrs.length < 2) {
    showToast('路线数据不完整');
    return;
  }

  // 预填地址
  const originAddr = addrs.find(a => a.type === 'origin');
  const destAddr = addrs.find(a => a.type === 'destination');
  const waypoints = addrs.filter(a => a.type === 'waypoint');

  const originInput = document.querySelector('#routeAddressList .route-addr-row[data-type="origin"] .route-addr-input');
  if (originInput && originAddr) originInput.value = originAddr.address;

  const destInput = document.querySelector('#routeAddressList .route-addr-row[data-type="destination"] .route-addr-input');
  if (destInput && destAddr) destInput.value = destAddr.address;

  waypoints.forEach(wp => {
    addRouteWaypoint();
    const rows = document.querySelectorAll('#routeAddressList .route-addr-row[data-type="waypoint"]');
    const lastRow = rows[rows.length - 1];
    if (lastRow) lastRow.querySelector('.route-addr-input').value = wp.address;
  });

  // 恢复策略
  if (routeData.strategy) {
    const radio = document.querySelector(`input[name="routeStrategy"][value="${routeData.strategy}"]`);
    if (radio) radio.checked = true;
  }
  const optimizeCheckbox = document.getElementById('optimizeOrder');
  if (optimizeCheckbox) optimizeCheckbox.checked = !!routeData.optimizeOrder;

  // 显示路线摘要
  document.getElementById('routePlanDist').textContent = formatDistance(routeData.summary.totalDistance);
  document.getElementById('routePlanTime').textContent = formatDuration(routeData.summary.totalTime);
  document.getElementById('routePlanToll').textContent = routeData.summary.totalTollFee > 0 ? `¥${routeData.summary.totalTollFee}` : '免费';
  document.getElementById('routeSummary').style.display = '';

  // 存储为 lastRoutePlanData（再次保存会覆盖）
  lastRoutePlanData = {
    addresses: addrs,
    strategy: routeData.strategy,
    optimizeOrder: routeData.optimizeOrder,
    summary: routeData.summary,
    origin: routeData.origin,
    destination: routeData.destination,
    waypoints: routeData.waypoints,
    polyline: routeData.polyline
  };

  // 绘制路线
  if (routeData.polyline && routeData.origin && routeData.destination) {
    hideOriginalMarkers();
    drawRouteOnMap({
      origin: routeData.origin,
      destination: routeData.destination,
      waypoints: routeData.waypoints || [],
      summary: routeData.summary,
      routes: [{ polyline: routeData.polyline }]
    });
  }

  showToast(`已加载「${fav.name}」第${dayIndex + 1}天的路线`);
  smoothScrollToSection('#navigate');
}

/** 策略文本映射（供加载时显示） */
const STRATEGY_LABEL_MAP = { time: '时间优先', distance: '路程优先', smooth: '顺利程度', cost: '花费价格' };

/** 从收藏加载路线规划到导航面板 */
function loadRoutePlanFromFav(index) {
  const favs = getFavorites();
  const fav = favs[index];
  if (!fav || !fav.isRoutePlan || !fav.routeData) {
    showToast('该收藏没有可加载的路线数据');
    return;
  }

  closeUserPanel();

  // 切换到路线规划面板
  switchNavPanelMode('route');

  const data = fav.routeData;
  const addrs = data.addresses || [];

  // 清除现有途经点
  routePanelWaypoints.forEach(r => r.remove());
  routePanelWaypoints = [];

  if (addrs.length < 2) {
    showToast('路线数据不完整，至少需要起点和终点');
    return;
  }

  // 预填起点（找到 origin 行）
  const originInput = document.querySelector('#routeAddressList .route-addr-row[data-type="origin"] .route-addr-input');
  const originAddr = addrs.find(a => a.type === 'origin');
  if (originInput && originAddr) originInput.value = originAddr.address;

  // 预填终点
  const destInput = document.querySelector('#routeAddressList .route-addr-row[data-type="destination"] .route-addr-input');
  const destAddr = addrs.find(a => a.type === 'destination');
  if (destInput && destAddr) destInput.value = destAddr.address;

  // 预填途经点
  const waypoints = addrs.filter(a => a.type === 'waypoint');
  waypoints.forEach(wp => {
    addRouteWaypoint();
    const rows = document.querySelectorAll('#routeAddressList .route-addr-row[data-type="waypoint"]');
    const lastRow = rows[rows.length - 1];
    if (lastRow) lastRow.querySelector('.route-addr-input').value = wp.address;
  });

  // 恢复策略和优化选项
  if (data.strategy) {
    const radio = document.querySelector(`input[name="routeStrategy"][value="${data.strategy}"]`);
    if (radio) radio.checked = true;
  }
  const optimizeCheckbox = document.getElementById('optimizeOrder');
  if (optimizeCheckbox) optimizeCheckbox.checked = !!data.optimizeOrder;

  // 显示路线摘要（使用保存的数据，不重新规划）
  document.getElementById('routePlanDist').textContent = formatDistance(data.summary.totalDistance);
  document.getElementById('routePlanTime').textContent = formatDuration(data.summary.totalTime);
  document.getElementById('routePlanToll').textContent = data.summary.totalTollFee > 0 ? `¥${data.summary.totalTollFee}` : '免费';
  document.getElementById('routeSummary').style.display = '';

  // 存储为 lastRoutePlanData，支持再次保存（修改后覆盖）
  lastRoutePlanData = {
    addresses: addrs,
    strategy: data.strategy,
    optimizeOrder: data.optimizeOrder,
    summary: data.summary,
    origin: data.origin,
    destination: data.destination,
    waypoints: data.waypoints,
    polyline: data.polyline
  };

  // 如果有保存的 polyline，直接绘制路线
  if (data.polyline && data.origin && data.destination) {
    hideOriginalMarkers();
    drawRouteOnMap({
      origin: data.origin,
      destination: data.destination,
      waypoints: data.waypoints || [],
      summary: data.summary,
      routes: [{ polyline: data.polyline }]
    });
  }

  showToast(`已加载路线「${fav.name}」，可修改后重新规划或保存`);
  // 滚动到导航区域
  smoothScrollToSection('#navigate');
}

/** 隐藏地图上所有原有标记（路线规划时调用） */
function hideOriginalMarkers() {
  // 标记已隐藏状态，避免重复操作
  if (window._markersHidden) return;
  window._markersHidden = true;

  // 隐藏省份景点标记
  leafletMarkers.forEach(m => {
    if (leafletMap.hasLayer(m)) leafletMap.removeLayer(m);
  });

  // 隐藏省份边界
  if (provinceLayer && leafletMap.hasLayer(provinceLayer)) {
    leafletMap.removeLayer(provinceLayer);
  }

  // 隐藏导入标记
  if (window._importMarkers && window._importMarkers.length) {
    window._importMarkers.forEach(m => {
      if (leafletMap.hasLayer(m)) leafletMap.removeLayer(m);
    });
  }
}

/** 恢复地图上所有原有标记（清除路线规划时调用） */
function restoreOriginalMarkers() {
  if (!window._markersHidden) return;
  window._markersHidden = false;

  // 恢复省份景点标记
  leafletMarkers.forEach(m => {
    if (!leafletMap.hasLayer(m)) m.addTo(leafletMap);
  });

  // 恢复省份边界
  if (provinceLayer && !leafletMap.hasLayer(provinceLayer)) {
    provinceLayer.addTo(leafletMap);
  }

  // 恢复导入标记
  if (window._importMarkers && window._importMarkers.length) {
    window._importMarkers.forEach(m => {
      if (!leafletMap.hasLayer(m)) m.addTo(leafletMap);
    });
  }
}

/** 从收藏导入到路线规划（预填表单） */
function toggleAllImportSpots(checkbox) {
  document.querySelectorAll('.import-spot-checkbox').forEach(cb => cb.checked = checkbox.checked);
  updateImportSelectedCount();
}

function updateImportSelectedCount() {
  const count = document.querySelectorAll('.import-spot-checkbox:checked').length;
  const total = document.querySelectorAll('.import-spot-checkbox').length;
  const el = document.getElementById('importSelectedCount');
  if (el) el.textContent = `已选 ${count} / ${total} 个`;
  const allEl = document.getElementById('importSelectAll');
  if (allEl) allEl.checked = count === total && total > 0;
}

function importToRoutePlan() {
  // 切换到路线规划面板
  switchNavPanelMode('route');

  // 获取选中的地点
  const checked = document.querySelectorAll('.import-spot-checkbox:checked');
  if (checked.length === 0) {
    showToast('请至少选择一个地点');
    return;
  }

  // 提取地址（去重：同一地址只保留一份）
  const seenAddrs = new Set();
  const addrs = [];
  checked.forEach(cb => {
    const name = cb.dataset.name;
    const addr = cb.dataset.addr;
    const key = addr.replace(/\s+/g, '');
    if (name && addr && !seenAddrs.has(key)) {
      seenAddrs.add(key);
      addrs.push({ name, addr });
    }
  });

  if (addrs.length < 2) {
    showToast('选中的地址不足2个，无法进行路线规划');
    return;
  }

  // 清除现有途经点
  routePanelWaypoints.forEach(r => r.remove());
  routePanelWaypoints = [];

  // 预填起点
  document.querySelector('#routeAddressList .route-addr-row[data-type="origin"] .route-addr-input').value = addrs[0].addr;

  // 预填终点
  document.querySelector('#routeAddressList .route-addr-row[data-type="destination"] .route-addr-input').value = addrs[addrs.length - 1].addr;

  // 预填中间为途经点
  for (let i = 1; i < addrs.length - 1; i++) {
    addRouteWaypoint();
    const rows = document.querySelectorAll('#routeAddressList .route-addr-row[data-type="waypoint"]');
    const lastRow = rows[rows.length - 1];
    if (lastRow) lastRow.querySelector('.route-addr-input').value = addrs[i].addr;
  }

  showToast(`已导入 ${addrs.length} 个地址到路线规划`);
}

/** 在新版 importPlanToNavigate 中增加「转入路线规划」按钮的入口 */
// 在已有的 doImportPlanDay 末尾，添加一个提示按钮到 spotList

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
  _currentShareIndex = 0;
  renderSharesCarousel(_allShares);
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
  input.value = '';
  document.getElementById('sharesSearchClear').style.display = 'none';
  loadShares();
  input.focus();
}

// 搜索输入监听
document.getElementById('sharesSearch')?.addEventListener('input', e => {
  const val = e.target.value.trim();
  document.getElementById('sharesSearchClear').style.display = val ? 'block' : 'none';
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

/** HTML 转义 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** 格式化日期 */
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 初始化用户分享
loadShares();

// 窗口 resize 时重新自适应轮播卡片高度
let _resizeCarouselDebounce = null;
window.addEventListener('resize', () => {
  clearTimeout(_resizeCarouselDebounce);
  _resizeCarouselDebounce = setTimeout(() => adjustCarouselHeight(), 200);
});

// ============ 旅行日记（GPT-4o 驱动）============
let _diaryPhotos = [];
let _currentDiaryHTML = '';
let _isDiaryGenerating = false;
let _diaryFinalImageUrl = '';  // html2canvas 合成后的最终图片 dataURL

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
 * 核心：GPT-4o 生成旅行日记
 * 流程：收集数据 → 调后端代理 OpenAI → 获得 HTML → 替换照片占位 → html2canvas 合成图片
 */
async function generateDiaryAI() {
  if (_isDiaryGenerating) return;

  const title = document.getElementById('diaryTitle')?.value.trim();
  const content = document.getElementById('diaryContent')?.value.trim();
  if (!title && !content) { showToast(T.needAiContent); return; }

  const openaiKey = getOpenAIKey();
  if (!openaiKey) { showToast(T.aiNeedOpenAIKey); return; }

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
    // —— 阶段 1：调用 GPT-4o 生成日记 HTML ——
    updateGenStatus('正在连接 GPT-4o 设计手帐布局...', 20);

    const resp = await fetch(`${API_BASE}/openai/generate-diary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: openaiKey,
        title: title || '旅行日记',
        date: dateStr,
        style: style,
        content: content,
        tags: tags,
        photoCount: _diaryPhotos.length,
      }),
    });

    const result = await resp.json();
    if (!result.success) throw new Error(result.error || 'GPT 生成失败');

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

    // —— 阶段 3：注入到 canvas 并合成图片 ——
    updateGenStatus('正在合成最终手帐图片...', 70);

    const canvasWrap = document.getElementById('diaryCanvas');
    if (canvasWrap) canvasWrap.innerHTML = _currentDiaryHTML;

    // 等待图片加载
    await new Promise(r => setTimeout(r, 500));

    // —— 阶段 4：html2canvas 渲染 ——
    updateGenStatus('正在渲染高清晰度图片...', 85);

    const page = document.getElementById('diaryPage');
    if (!page) throw new Error('HTML 渲染失败');

    // 短暂隐藏 AI 加载动画，临时显示 canvas
    if (aiResult) aiResult.style.display = 'none';
    if (templateResult) templateResult.style.display = 'flex';

    // 等待所有图片加载完成（替代硬编码 setTimeout）
    await Promise.all(
      Array.from(page.querySelectorAll('img'))
        .filter(img => !img.complete)
        .map(img => new Promise(r => { img.onload = img.onerror = r; }))
    );

    const compositeCanvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    });
    _diaryFinalImageUrl = compositeCanvas.toDataURL('image/png');

    // 清理临时显示
    if (templateResult) templateResult.style.display = 'none';

    // —— 阶段 5：显示最终结果 ——
    updateGenStatus('生成完成！', 100);

    if (aiLoading) aiLoading.style.display = 'none';
    if (aiResult) aiResult.style.display = 'flex';
    if (aiImage) {
      aiImage.src = _diaryFinalImageUrl;
      aiImage.style.display = 'block';
    }
    if (resultActions) resultActions.style.display = 'flex';
    showToast(T.aiGenerated);

  } catch (err) {
    console.error('[GPT Diary]', err);
    if (aiLoading) aiLoading.style.display = 'none';
    if (aiError) aiError.style.display = 'flex';
    const errMsg = document.getElementById('diaryAIErrorMsg');
    if (errMsg) {
      const detail = err.message || '未知错误';
      if (detail.includes('Failed to fetch') || detail.includes('NetworkError')) {
        errMsg.textContent = '无法连接后端服务，请确认 server 已启动（npm run dev）';
      } else if (detail.includes('ENOTFOUND') || detail.includes('ECONNREFUSED') || detail.includes('ECONNRESET') || detail.includes('无法连接')) {
        errMsg.textContent = '无法连接 OpenAI API，国内用户需在 server/.env 中配置 OPENAI_BASE_URL 代理地址';
      } else if (detail.includes('401') || detail.includes('auth') || detail.includes('Incorrect API key')) {
        errMsg.textContent = 'OpenAI API Key 无效，请检查是否正确配置';
      } else if (detail.includes('429')) {
        errMsg.textContent = 'API 请求过于频繁，请稍后再试';
      } else if (detail.includes('insufficient') || detail.includes('quota') || detail.includes('billing')) {
        errMsg.textContent = 'OpenAI API 额度不足，请检查账户余额';
      } else if (detail.includes('timeout') || detail.includes('超时')) {
        errMsg.textContent = '请求超时，AI 响应较慢，请稍后重试';
      } else {
        errMsg.textContent = detail.length > 150 ? detail.slice(0, 150) + '...' : '生成失败：' + detail;
      }
    }
    showToast(T.aiGenFailed);
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
  if (genText) genText.textContent = `GPT 正在为你设计旅行手帐... ${progress}%`;
  if (genBar) genBar.style.width = progress + '%';
}

// ---------- 保留模板模式（快速生成用）----------
function generateDiary() {
  if (_isDiaryGenerating) return;
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
    link.download = `GPT旅行手帐_${document.getElementById('diaryTitle')?.value?.trim() || 'untitled'}.png`;
    link.href = _diaryFinalImageUrl;
    link.click();
    showToast(T.diaryDownloaded);
    return;
  }

  const page = document.getElementById('diaryPage');
  if (!page) { showToast('请先生成日记'); return; }
  showToast(T.diaryDownloading);

  html2canvas(page, { scale: 2, useCORS: true, backgroundColor: null, logging: false })
    .then(canvas => {
      const link = document.createElement('a');
      link.download = `旅行日记_${document.getElementById('diaryTitle')?.value?.trim() || 'untitled'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast(T.diaryDownloaded);
    }).catch(err => {
      console.error(err);
      showToast('下载失败，请重试');
    });
}

// ---------- 保存日记到本地 ----------
function saveDiary() {
  const aiResult = document.getElementById('diaryAIResult');
  const isAiMode = aiResult && aiResult.style.display !== 'none';

  if (isAiMode) {
    if (!_diaryFinalImageUrl) { showToast('请先生成日记'); return; }
    const diaries = getDiaries();
    diaries.unshift({
      id: 'DAI' + Date.now(),
      title: document.getElementById('diaryTitle')?.value?.trim() || 'GPT手帐',
      date: document.getElementById('diaryDate')?.value || formatDate(new Date()),
      style: getSelectedDiaryStyle(),
      thumb: _diaryFinalImageUrl,
      html: _currentDiaryHTML,
      createdAt: new Date().toISOString(),
    });
    saveDiaries(diaries.slice(0, 50));
    showToast(T.diaryAISaved);
    refreshDiaryBadge();
    return;
  }

  const page = document.getElementById('diaryPage');
  if (!page) { showToast('请先生成日记'); return; }

  html2canvas(page, { scale: 2, useCORS: true, backgroundColor: null, logging: false })
    .then(canvas => {
      const thumb = canvas.toDataURL('image/png');
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
      saveDiaries(diaries.slice(0, 50));
      showToast(T.diarySaved);
      refreshDiaryBadge();
    }).catch(err => {
      console.error(err);
      showToast('保存失败，请重试');
    });
}

// ---------- 日记本地存储 ----------
function getDiaries() {
  try { return JSON.parse(localStorage.getItem('wandr_diaries') || '[]'); }
  catch { return []; }
}
function saveDiaries(arr) {
  localStorage.setItem('wandr_diaries', JSON.stringify(arr));
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

  document.getElementById('diaryPlaceholder').style.display = 'none';
  document.getElementById('diaryGenerating').style.display = 'none';
  document.getElementById('diaryResult').style.display = 'none';
  document.getElementById('diaryAIResult').style.display = 'none';

  document.getElementById('diaryTitle').value = d.title;
  document.getElementById('diaryDate').value = d.date;
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
  document.getElementById('diaryAIResult').style.display = 'flex';

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
// MBTI 性格测试模块
// ============================================================

/* ---------- 20 道 MBTI 测试题 ---------- */
const mbtiQuestions = [
  // E vs I (外向 vs 内向) ×5
  { dim: 'EI', dimLabel: 'E 外向 vs I 内向',
    q: '在旅行中，你更倾向于...',
    a: { text: '主动结交当地人和其他旅行者，分享彼此的故事', score: 'E' },
    b: { text: '静静观察当地生活，独自感受旅行的氛围', score: 'I' } },
  { dim: 'EI', dimLabel: 'E 外向 vs I 内向',
    q: '旅行结束后，你通常会...',
    a: { text: '迫不及待地和朋友分享每一段精彩经历', score: 'E' },
    b: { text: '独自整理旅行笔记和照片，细细回味', score: 'I' } },
  { dim: 'EI', dimLabel: 'E 外向 vs I 内向',
    q: '面对一座陌生的城市，你首先想做的是...',
    a: { text: '跟着当地人的脚步，融入热闹的街头生活', score: 'E' },
    b: { text: '找一个安静的咖啡馆，从容地规划游览路线', score: 'I' } },
  { dim: 'EI', dimLabel: 'E 外向 vs I 内向',
    q: '旅行中的理想住宿是...',
    a: { text: '热闹的青年旅社或民宿，可以认识来自各地的旅人', score: 'E' },
    b: { text: '安静私密的精品酒店或独栋民宿，享受私人空间', score: 'I' } },
  { dim: 'EI', dimLabel: 'E 外向 vs I 内向',
    q: '长途旅行中，你更享受哪种状态？',
    a: { text: '参加各种旅行团活动，和陌生人一起探索', score: 'E' },
    b: { text: '一个人按自己节奏慢慢走，想停就停', score: 'I' } },

  // S vs N (感觉 vs 直觉) ×5
  { dim: 'SN', dimLabel: 'S 感觉 vs N 直觉',
    q: '规划旅行时，你更注重...',
    a: { text: '详细的行程安排：具体景点、开放时间、路线', score: 'S' },
    b: { text: '整体的旅行感受：氛围、故事、独特体验', score: 'N' } },
  { dim: 'SN', dimLabel: 'S 感觉 vs N 直觉',
    q: '参观博物馆时，你倾向于...',
    a: { text: '认真看每件展品的文字说明，了解具体历史背景', score: 'S' },
    b: { text: '跟着感觉走，在最触动你的展品前久久驻足', score: 'N' } },
  { dim: 'SN', dimLabel: 'S 感觉 vs N 直觉',
    q: '你描述一段旅行经历时，更习惯...',
    a: { text: '讲述具体发生的事：去了哪里、吃了什么、看到什么', score: 'S' },
    b: { text: '描述感受和意义：那段旅程让你对世界的看法改变了什么', score: 'N' } },
  { dim: 'SN', dimLabel: 'S 感觉 vs N 直觉',
    q: '面对一处风景，你会...',
    a: { text: '关注眼前的实际美景：光线、色彩、构图', score: 'S' },
    b: { text: '联想起许多关于这片土地的故事和可能性', score: 'N' } },
  { dim: 'SN', dimLabel: 'S 感觉 vs N 直觉',
    q: '选择旅行目的地时，最打动你的是...',
    a: { text: '真实的用户评价和具体的景点介绍', score: 'S' },
    b: { text: '一句让你心动的文案或一张充满意境的照片', score: 'N' } },

  // T vs F (思考 vs 情感) ×5
  { dim: 'TF', dimLabel: 'T 思考 vs F 情感',
    q: '选择旅行目的地时，你更看重...',
    a: { text: '性价比、交通便利度、景点密度等客观因素', score: 'T' },
    b: { text: '和旅伴的情感连接，以及对自己的特殊意义', score: 'F' } },
  { dim: 'TF', dimLabel: 'T 思考 vs F 情感',
    q: '旅行遇到问题（如航班延误），你的第一反应是...',
    a: { text: '立即分析备选方案，冷静处理', score: 'T' },
    b: { text: '先感受一下情绪，然后寻求帮助或安慰同行者', score: 'F' } },
  { dim: 'TF', dimLabel: 'T 思考 vs F 情感',
    q: '旅行中最难忘的往往是...',
    a: { text: '那些极具挑战性的经历，考验了你的应对能力', score: 'T' },
    b: { text: '与陌生人之间发生的温暖故事和深刻情感', score: 'F' } },
  { dim: 'TF', dimLabel: 'T 思考 vs F 情感',
    q: '为旅伴推荐目的地时，你会...',
    a: { text: '列出优缺点对比，给出最优选择的理由', score: 'T' },
    b: { text: '考虑他们的喜好和情感需求，推荐最适合他们的', score: 'F' } },
  { dim: 'TF', dimLabel: 'T 思考 vs F 情感',
    q: '如何看待"打卡"式旅行？',
    a: { text: '合理高效，能在有限时间内覆盖更多景点', score: 'T' },
    b: { text: '更希望慢下来，感受一个地方的灵魂而非数量', score: 'F' } },

  // J vs P (判断 vs 知觉) ×5
  { dim: 'JP', dimLabel: 'J 计划 vs P 随性',
    q: '出发前，你的旅行准备是...',
    a: { text: '提前几周详细规划：订好酒店、列出景点、准备备选方案', score: 'J' },
    b: { text: '只买好机票，其他的到了当地再说', score: 'P' } },
  { dim: 'JP', dimLabel: 'J 计划 vs P 随性',
    q: '旅行行程被临时打乱时，你会...',
    a: { text: '感到不适，并尽快重建新的计划', score: 'J' },
    b: { text: '欣然接受，甚至觉得意外之喜才是旅行的精髓', score: 'P' } },
  { dim: 'JP', dimLabel: 'J 计划 vs P 随性',
    q: '你更理想的旅行节奏是...',
    a: { text: '每天都有清晰的行程安排，充分利用每一小时', score: 'J' },
    b: { text: '漫无目的地游荡，跟着感觉走进任何一条小巷', score: 'P' } },
  { dim: 'JP', dimLabel: 'J 计划 vs P 随性',
    q: '旅行预算管理上，你...',
    a: { text: '提前做好详细预算，并严格执行', score: 'J' },
    b: { text: '大概知道总花销，遇到喜欢的就花，不太在意细节', score: 'P' } },
  { dim: 'JP', dimLabel: 'J 计划 vs P 随性',
    q: '旅行结束后，对于下一次旅行你会...',
    a: { text: '已经开始调研，准备着手规划下次目的地', score: 'J' },
    b: { text: '等有心情再说，也许下周就能出发也说不定', score: 'P' } },
];

/* ---------- 16 种 MBTI 旅行推荐数据 ---------- */
const mbtiTravelData = {
  INTJ: {
    name: '建筑师', color: '#5882C1',
    desc: '你是极具远见与独立性的思考者。旅行对你而言是一次深度探索而非消遣，你会提前研究目的地的历史与文化，制定精密计划，并从中获得真正的知识满足感。',
    travelStyles: [
      { icon: 'fa-book', text: '文化深度游，热衷历史遗址' },
      { icon: 'fa-route', text: '独立自由行，厌恶跟团模式' },
      { icon: 'fa-brain', text: '偏好博物馆、古迹、遗址' },
      { icon: 'fa-calendar-check', text: '旅行前严格规划，万全准备' },
    ],
    destinations: [
      { name: '京都·古都', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop&q=80', why: '千年寺庙与精密茶道文化，契合你对深度的追求', match: '97%' },
      { name: '雅典·遗址', img: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&auto=format&fit=crop&q=80', why: '古希腊文明遗址，激活你对历史体系的探索欲', match: '94%' },
      { name: '西安·古都', img: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&auto=format&fit=crop&q=80', why: '兵马俑与千年历史，完美满足你的知识探索欲', match: '91%' },
    ],
    tips: ['出发前阅读目的地历史背景，旅行会更有深度', '预留独处时间消化体验，避免信息过载', '让自己偶尔脱离计划，随机探索也有惊喜']
  },
  INTP: {
    name: '逻辑学家', color: '#5882C1',
    desc: '充满好奇心的你，把旅行当成一场知识实验。你会把一切都当成值得研究的有趣系统——从当地的语言到建筑逻辑，每个细节都令你着迷。',
    travelStyles: [
      { icon: 'fa-microscope', text: '科学/探索类目的地最感兴趣' },
      { icon: 'fa-map-marked', text: '喜欢自行规划路线，偶尔迷路也不在意' },
      { icon: 'fa-question', text: '随时提出问题，乐于和当地人深聊' },
      { icon: 'fa-camera', text: '拍摄有趣细节，而非打卡合影' },
    ],
    destinations: [
      { name: '冰岛·极光', img: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&auto=format&fit=crop&q=80', why: '地质奇观与极端自然现象，能激发你无尽的好奇心', match: '96%' },
      { name: '成都·大熊猫', img: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=600&auto=format&fit=crop&q=80', why: '珍稀物种研究与多元文化交融，满足知识探索欲', match: '90%' },
      { name: '黄山·奇景', img: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&auto=format&fit=crop&q=80', why: '云雾变幻莫测，自然系统的随机性令你着迷', match: '88%' },
    ],
    tips: ['带一本空白笔记本，随时记录想法和观察', '允许自己花大量时间在感兴趣的地方', '和当地专家或学者交流，往往收获最大']
  },
  ENTJ: {
    name: '指挥官', color: '#5882C1',
    desc: '你是天生的领袖，旅行也不例外。你擅长组织群体旅行，高效规划，充分利用每一分钟，并以惊人的效率完成你的旅行目标清单。',
    travelStyles: [
      { icon: 'fa-list-check', text: '高效率旅行，绝不浪费时间' },
      { icon: 'fa-users', text: '擅长组织团体出行，天然导游' },
      { icon: 'fa-trophy', text: '挑战型旅行，攀登、极限、标志性体验' },
      { icon: 'fa-star', text: '追求旅行中的最佳体验，不将就' },
    ],
    destinations: [
      { name: '西藏·布达拉', img: 'https://images.unsplash.com/photo-1603825491103-bd638b1873b0?w=600&auto=format&fit=crop&q=80', why: '极具挑战性的朝圣之旅，完美挑战你的意志力极限', match: '95%' },
      { name: '北京·故宫', img: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&auto=format&fit=crop&q=80', why: '宏大的政治历史中心，与你的领袖气质天然契合', match: '92%' },
      { name: '上海·都市', img: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=600&auto=format&fit=crop&q=80', why: '全球金融中心，快节奏现代都市与你的效率感匹配', match: '89%' },
    ],
    tips: ['为团队制定清晰的行程，但保留弹性时间', '学会放慢脚步，旅行不是效率竞赛', '听取旅伴意见，你的计划可能不适合所有人']
  },
  ENTP: {
    name: '辩论家', color: '#5882C1',
    desc: '你是旅行中的点子王，总能找到最出乎意料的体验。你热爱打破规则，探索大多数旅行者不会涉足的小众角落，并将每次旅行变成一场智识冒险。',
    travelStyles: [
      { icon: 'fa-lightbulb', text: '小众目的地，避开所有热门打卡点' },
      { icon: 'fa-dice', text: '即兴旅行，随时改变计划' },
      { icon: 'fa-comments', text: '与当地人辩论文化差异，乐此不疲' },
      { icon: 'fa-fire', text: '喜欢有争议、有话题的目的地' },
    ],
    destinations: [
      { name: '大理·苍洱', img: 'https://images.unsplash.com/photo-1537519646099-335112f03225?w=600&auto=format&fit=crop&q=80', why: '文艺小众聚集地，充满有趣的灵魂和奇思妙想', match: '94%' },
      { name: '柏林·创意', img: 'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=600&auto=format&fit=crop&q=80', why: '前卫艺术与历史碰撞，给你的思维带来激烈冲击', match: '91%' },
      { name: '重庆·魔幻', img: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&auto=format&fit=crop&q=80', why: '魔幻立体都市结构，打破你对城市的一切认知', match: '88%' },
    ],
    tips: ['记录每次旅行中最意外的收获，这才是你的旅行精华', '带一颗开放的心，甚至考虑那些"坏掉"的计划', '可能的话，和当地人住一起，获取最真实的视角']
  },
  INFJ: {
    name: '提倡者', color: '#4EA064',
    desc: '你是敏锐而有深度的理想主义者，旅行对你而言是精神层面的探索。你不追求数量，而是那种能触动灵魂、改变内心的旅行体验。',
    travelStyles: [
      { icon: 'fa-heart', text: '寻找有意义的旅行，而非打卡' },
      { icon: 'fa-seedling', text: '注重旅行的可持续性与责任感' },
      { icon: 'fa-yin-yang', text: '冥想静修、自然疗愈类旅行' },
      { icon: 'fa-pen', text: '旅行中写作、绘画、记录感受' },
    ],
    destinations: [
      { name: '不丹·幸福国', img: 'https://images.unsplash.com/photo-1560721682-1a8bd3286e75?w=600&auto=format&fit=crop&q=80', why: '全球幸福指数最高国，与你对灵魂满足的追求完全契合', match: '98%' },
      { name: '丽江·古镇', img: 'https://images.unsplash.com/photo-1537519646099-335112f03225?w=600&auto=format&fit=crop&q=80', why: '纳西文化与悠然时光，给你的内心提供深度滋养', match: '93%' },
      { name: '西藏·心灵', img: 'https://images.unsplash.com/photo-1603825491103-bd638b1873b0?w=600&auto=format&fit=crop&q=80', why: '净土精神与极致自然，触发你对生命意义的深刻思考', match: '96%' },
    ],
    tips: ['给自己设定一个旅行的精神主题', '不必见每一个景点，见一个见得彻底', '记得给自己独处时间，旅行也需要充电']
  },
  INFP: {
    name: '调停者', color: '#4EA064',
    desc: '你是充满诗意的理想主义者，旅行是你表达自我、寻找故事的方式。你特别容易被那些充满人文气息、艺术氛围的地方所打动。',
    travelStyles: [
      { icon: 'fa-palette', text: '艺术与创意类旅行，画廊、工作室' },
      { icon: 'fa-cloud', text: '随心所欲，不按计划，跟随内心' },
      { icon: 'fa-book-open', text: '文学之旅，探访作家、诗人的故居' },
      { icon: 'fa-cat', text: '猫咪咖啡馆、手工市集等特色场所' },
    ],
    destinations: [
      { name: '巴黎·艺术', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&auto=format&fit=crop&q=80', why: '全球艺术之都，博物馆与街头画作融为一体，触动你的诗意灵魂', match: '97%' },
      { name: '苏州·园林', img: 'https://images.unsplash.com/photo-1549060890-81428791aeef?w=600&auto=format&fit=crop&q=80', why: '精致的古典园林如诗如画，最适合你的审美情趣', match: '94%' },
      { name: '大理·创意', img: 'https://images.unsplash.com/photo-1537519646099-335112f03225?w=600&auto=format&fit=crop&q=80', why: '文艺聚集地，你能在这里遇见无数有故事的人', match: '91%' },
    ],
    tips: ['带上你的速写本或日记本，旅途中灵感最丰富', '不必强迫自己去"热门"景点，跟随内心才是你的方式', '允许自己花一整天在同一个地方，细细感受']
  },
  ENFJ: {
    name: '主人公', color: '#4EA064',
    desc: '你是充满魅力的天然领袖，旅行是你连接世界的方式。你特别擅长组织旅行、照顾旅伴，并在旅途中建立真实而深刻的人际关系。',
    travelStyles: [
      { icon: 'fa-people-group', text: '团体旅行，照顾每个人的需求' },
      { icon: 'fa-handshake', text: '与当地人建立真实联系' },
      { icon: 'fa-globe-asia', text: '文化交流与志愿旅行' },
      { icon: 'fa-smile', text: '打造让所有人都满意的旅行体验' },
    ],
    destinations: [
      { name: '成都·美食', img: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=600&auto=format&fit=crop&q=80', why: '开朗热情的成都人与丰富美食文化，完美契合你的社交能量', match: '95%' },
      { name: '云南·多彩', img: 'https://images.unsplash.com/photo-1537519646099-335112f03225?w=600&auto=format&fit=crop&q=80', why: '多民族文化交融，给你无数建立跨文化连接的机会', match: '92%' },
      { name: '三亚·度假', img: 'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=600&auto=format&fit=crop&q=80', why: '团体度假胜地，你能让所有旅伴都玩得尽兴', match: '89%' },
    ],
    tips: ['也给自己留一点独处时间，你照顾别人很好，也要照顾自己', '跟团或组团出行最适合你', '学习一两句目的地的语言，你会因此收获更深的连接']
  },
  ENFP: {
    name: '竞选者', color: '#4EA064',
    desc: '热情洋溢、充满创意的你，把每次旅行都变成一场奇遇。你会在陌生的街头认识新朋友，发现别人注意不到的美丽角落，并把这种热情分享给身边所有人。',
    travelStyles: [
      { icon: 'fa-bolt', text: '冲动旅行者，说走就走' },
      { icon: 'fa-star', text: '追求独特体验，不走寻常路' },
      { icon: 'fa-camera-retro', text: '热衷记录并分享，天然的旅行博主' },
      { icon: 'fa-music', text: '喜欢音乐节、市集、当地节庆活动' },
    ],
    destinations: [
      { name: '曼谷·活力', img: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&auto=format&fit=crop&q=80', why: '24小时不眠城市，无限可能与惊喜，和你的能量完全匹配', match: '96%' },
      { name: '重庆·夜景', img: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&auto=format&fit=crop&q=80', why: '魔幻立体城市充满视觉冲击，Ins绝美素材等你发现', match: '93%' },
      { name: '厦门·文艺', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop&q=80', why: '咖啡、海风、文艺小巷，处处是令你惊喜的新发现', match: '90%' },
    ],
    tips: ['旅行前做少量调研，避免错过真正值得的体验', '随时准备说"是"，最好的故事往往来自意料之外', '记得给手机充电，你的灵感爆发时需要记录']
  },
  ISTJ: {
    name: '物流师', color: '#C88C32',
    desc: '你是可靠而尽责的旅行者，对细节的把控令人放心。你偏好经过充分准备、行程紧凑的旅行，并且总能从中挖掘出最实际的收获。',
    travelStyles: [
      { icon: 'fa-clipboard-list', text: '详尽的旅行攻略，提前踩好每个点' },
      { icon: 'fa-shield', text: '注重安全与稳妥，选择口碑好的线路' },
      { icon: 'fa-hotel', text: '偏好熟悉的连锁酒店和稳定服务' },
      { icon: 'fa-landmark', text: '传统景点、历史遗址是首选' },
    ],
    destinations: [
      { name: '北京·历史', img: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&auto=format&fit=crop&q=80', why: '经典历史名胜，清晰的参观指引，完全符合你对稳定的需求', match: '96%' },
      { name: '张家界·自然', img: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&auto=format&fit=crop&q=80', why: '成熟的景区服务体系，让你放心享受壮美风景', match: '91%' },
      { name: '西安·文化', img: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&auto=format&fit=crop&q=80', why: '系统完善的历史文化遗址，满足你对知识体系的追求', match: '94%' },
    ],
    tips: ['制作详细的旅行清单，出发前逐项检查', '提前预订热门景点门票，避免排队浪费时间', '旅行结束后整理照片和费用，建立旅行档案']
  },
  ISFJ: {
    name: '守护者', color: '#C88C32',
    desc: '温柔体贴的你，把旅行当作和心爱之人共享美好时光的方式。你特别注重旅行中的舒适与和谐，并用心为旅伴创造温馨的体验。',
    travelStyles: [
      { icon: 'fa-home', text: '家庭旅行或双人旅行最享受' },
      { icon: 'fa-utensils', text: '美食之旅，发现当地特色菜肴' },
      { icon: 'fa-spa', text: '温泉、SPA、休闲度假型旅行' },
      { icon: 'fa-gift', text: '喜欢为家人挑选当地特产' },
    ],
    destinations: [
      { name: '婺源·田园', img: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&auto=format&fit=crop&q=80', why: '油菜花与粉墙黛瓦，如诗如画的田园风光，最适合温馨家庭游', match: '95%' },
      { name: '三亚·亲子', img: 'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=600&auto=format&fit=crop&q=80', why: '设施完善的海滨度假区，照顾好所有家庭成员', match: '93%' },
      { name: '苏州·园林', img: 'https://images.unsplash.com/photo-1549060890-81428791aeef?w=600&auto=format&fit=crop&q=80', why: '古典园林的精致与宁静，给你带来内心的温暖与平静', match: '90%' },
    ],
    tips: ['优先考虑旅伴的需求，但也别忘了表达自己的想法', '为旅行准备一份"惊喜"，会让旅伴感动', '记录下旅行中的温馨时刻，将来是最珍贵的回忆']
  },
  ESTJ: {
    name: '总经理', color: '#C88C32',
    desc: '你是高效的旅行组织者，每次旅行都是一个精心管理的项目。你对质量和效率的追求让你的旅行总能在规定时间内完成最多的体验。',
    travelStyles: [
      { icon: 'fa-tasks', text: '严格按照计划执行，几乎不偏离' },
      { icon: 'fa-crown', text: '追求高品质服务，住宿绝不将就' },
      { icon: 'fa-business-time', text: '商务旅行与休闲旅行游刃有余' },
      { icon: 'fa-check-double', text: '旅行中依然保持高效状态' },
    ],
    destinations: [
      { name: '上海·摩登', img: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=600&auto=format&fit=crop&q=80', why: '国际化大都市的高效节奏与顶级服务，完全符合你的标准', match: '96%' },
      { name: '香港·效率', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop&q=80', why: '全球最高效城市之一，密集的景点与美食让你物超所值', match: '93%' },
      { name: '成都·美食', img: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=600&auto=format&fit=crop&q=80', why: '完善的旅游服务体系，大量知名景点，高效率旅行的理想之地', match: '89%' },
    ],
    tips: ['制作旅行效率清单，提前规划每天的游览顺序', '接受旅行中的意外，最好的体验往往在计划外', '为旅伴留出自由时间，不是每个人都喜欢你的效率']
  },
  ESFJ: {
    name: '执政官', color: '#C88C32',
    desc: '你是温暖有爱的旅行组织者，最擅长让所有旅伴都开心满意。你会关注每个人的需求，并用心营造让大家都难忘的旅行氛围。',
    travelStyles: [
      { icon: 'fa-heart-pulse', text: '最在意旅伴的感受与体验' },
      { icon: 'fa-camera', text: '热爱为大家拍照留念' },
      { icon: 'fa-bowl-food', text: '美食分享，探访当地特色餐厅' },
      { icon: 'fa-map', text: '跟团游或精心规划的家庭自驾游' },
    ],
    destinations: [
      { name: '桂林·漓江', img: 'https://images.unsplash.com/photo-1513553404607-988bf2703777?w=600&auto=format&fit=crop&q=80', why: '山水画般的美景，适合所有年龄层的团体游', match: '94%' },
      { name: '成都·宽窄', img: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=600&auto=format&fit=crop&q=80', why: '美食与热情的城市文化，让你的旅伴感受到满满的幸福感', match: '92%' },
      { name: '三亚·海滨', img: 'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=600&auto=format&fit=crop&q=80', why: '全家适合的度假胜地，完美的旅行配置让你安心照顾大家', match: '90%' },
    ],
    tips: ['出发前做一个小调查，了解所有旅伴的期待', '帮大家记录最美好的瞬间，你的照片会被反复回看', '也记得享受自己的旅行，不只是服务他人']
  },
  ISTP: {
    name: '鉴赏家', color: '#C83C3C',
    desc: '你是冷静果敢的实用主义者，热爱技能型旅行——驾车穿越公路、骑行探索山野、潜水观鱼。你享受用双手和身体去感知旅行的一切。',
    travelStyles: [
      { icon: 'fa-motorcycle', text: '公路旅行、骑行、自驾探险' },
      { icon: 'fa-tools', text: '喜欢亲手参与，DIY体验' },
      { icon: 'fa-person-hiking', text: '户外运动：攀岩、潜水、徒步' },
      { icon: 'fa-eye', text: '观察者，低调的独行侠' },
    ],
    destinations: [
      { name: '新藏线·极限', img: 'https://images.unsplash.com/photo-1603825491103-bd638b1873b0?w=600&auto=format&fit=crop&q=80', why: '中国最险峻的公路之一，对喜欢挑战极限的你是终极诱惑', match: '97%' },
      { name: '张家界·攀登', img: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&auto=format&fit=crop&q=80', why: '垂直的悬崖峭壁与探险路线，完美展示你的身体技能', match: '93%' },
      { name: '三亚·潜水', img: 'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=600&auto=format&fit=crop&q=80', why: '丰富的潜水资源，让你用行动而非语言探索海底世界', match: '91%' },
    ],
    tips: ['学习目的地相关的专业技能，如骑马、潜水证', '带上你的工具或摄影装备，这是你的旅行语言', '允许自己不做详细计划，你的本能判断很可靠']
  },
  ISFP: {
    name: '探险家', color: '#C83C3C',
    desc: '你是充满感性的自由灵魂，旅行中的每一刻都能触发你内心深处的感动。你偏好以自己的节奏去探索，用心感受每个角落散发的独特美感。',
    travelStyles: [
      { icon: 'fa-paintbrush', text: '探索街头艺术、手工艺市集' },
      { icon: 'fa-paw', text: '动物亲近型旅行，自然保护区' },
      { icon: 'fa-leaf', text: '沉浸自然，享受当下每个瞬间' },
      { icon: 'fa-music', text: '喜欢当地音乐与自发性文化活动' },
    ],
    destinations: [
      { name: '云南·秘境', img: 'https://images.unsplash.com/photo-1537519646099-335112f03225?w=600&auto=format&fit=crop&q=80', why: '原始森林与少数民族村落，你能在这里找到触动内心的美', match: '96%' },
      { name: '鼓浪屿·艺术', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop&q=80', why: '音乐与建筑交融的岛屿，每条小路都有令你心动的发现', match: '93%' },
      { name: '黄山·徒步', img: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&auto=format&fit=crop&q=80', why: '云雾与松石的奇妙美学，与你的感性审美高度契合', match: '90%' },
    ],
    tips: ['随身携带素描本或相机，捕捉那些转瞬即逝的美', '不必严格按照计划，跟着感觉走往往有最好的结果', '选择当地人居住的区域，感受真实的生活气息']
  },
  ESTP: {
    name: '企业家', color: '#C83C3C',
    desc: '行动力超强的你是天生的冒险家，在旅行中总是第一个冲进未知领域的那个。你热爱刺激体验，高速公路、蹦极、赛车——这些才是属于你的旅行方式。',
    travelStyles: [
      { icon: 'fa-parachute-box', text: '极限运动：蹦极、跳伞、冲浪' },
      { icon: 'fa-fire-flame-curved', text: '夜生活丰富的城市，派对达人' },
      { icon: 'fa-bolt-lightning', text: '说走就走，当天订票当天出发' },
      { icon: 'fa-person-running', text: '行动派，永远比别人快一步' },
    ],
    destinations: [
      { name: '曼谷·夜生活', img: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&auto=format&fit=crop&q=80', why: '全球顶级夜生活城市，刺激体验从不停歇，和你完美匹配', match: '96%' },
      { name: '海南·冲浪', img: 'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=600&auto=format&fit=crop&q=80', why: '冲浪和各种水上极限运动，你需要这种肾上腺素飙升的体验', match: '93%' },
      { name: '张家界·极限', img: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&auto=format&fit=crop&q=80', why: '玻璃栈道和高空项目，满足你对刺激的永无止境的渴望', match: '90%' },
    ],
    tips: ['出发前了解极限运动的安全守则，刺激和安全同样重要', '给自己留出"无计划时间"，你的最佳故事来自这里', '带上可靠的旅伴，你的冒险精神需要一个人欣赏']
  },
  ESFP: {
    name: '表演者', color: '#C83C3C',
    desc: '你是旅途中最闪耀的那颗星！热情、活泼的你总能把旅行变成一场盛大的表演，认识最多的朋友，品尝最多的美食，享受当下的每一分钟。',
    travelStyles: [
      { icon: 'fa-champagne-glasses', text: '节庆、美食节、音乐节爱好者' },
      { icon: 'fa-selfie', text: '热爱分享，旅行内容创作达人' },
      { icon: 'fa-ship', text: '邮轮、度假村、全包型旅行' },
      { icon: 'fa-shopping-bag', text: '购物达人，探索当地特色市集' },
    ],
    destinations: [
      { name: '成都·火锅', img: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=600&auto=format&fit=crop&q=80', why: '热情好客的城市文化与丰富美食，你会立刻爱上这里的每个人', match: '97%' },
      { name: '三亚·派对', img: 'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=600&auto=format&fit=crop&q=80', why: '阳光沙滩派对与丰富的度假娱乐，为你提供持续的欢乐能量', match: '95%' },
      { name: '丽江·古镇', img: 'https://images.unsplash.com/photo-1537519646099-335112f03225?w=600&auto=format&fit=crop&q=80', why: '酒吧街上的音乐与欢笑，古镇里充满有趣灵魂等你结识', match: '91%' },
    ],
    tips: ['提前关注目的地的节庆活动，选择最热闹的时候去', '你的热情会感染所有人，这是你旅行的超能力', '记录旅行的当下，你的内容会让粉丝们羡慕不已']
  }
};

/* ---------- DeepSeek API 动态生成 MBTI 旅行推荐 ---------- */

// 16 种 MBTI 类型的简短描述，用于构造 Prompt
const MBTI_TYPE_PROFILES = {
  INTJ:  { name: '建筑师', traits: '独立、理性、善于长远规划、热衷于系统性知识' },
  INTP:  { name: '逻辑学家', traits: '好奇、分析型、热爱抽象理论、喜欢独立思考' },
  ENTJ:  { name: '指挥官', traits: '果断、领导力强、追求效率与成就、目标导向' },
  ENTP:  { name: '辩论家', traits: '思维敏捷、热衷辩论、喜欢新想法、不按常理出牌' },
  INFJ:  { name: '提倡者', traits: '理想主义、富有同理心、重视深层意义、追求和谐' },
  INFP:  { name: '调停者', traits: '敏感、富有创造力、重视内心价值、追求真实体验' },
  ENFJ:  { name: '主人公', traits: '热情、富有感染力、善于激励他人、关注集体感受' },
  ENFP:  { name: '竞选者', traits: '自由奔放、富有想象力、热爱社交与新奇体验' },
  ISTJ:  { name: '检查官', traits: '踏实可靠、注重细节、尊重传统、做事有条不紊' },
  ISFJ:  { name: '守卫者', traits: '温柔、忠诚、乐于助人、享受熟悉的舒适感' },
  ESTJ:  { name: '总经理', traits: '高效务实、组织能力强、注重规则与结果' },
  ESFJ:  { name: '执政官', traits: '热情好客、善于协调、重视群体和谐与社交' },
  ISTP:  { name: '鉴赏家', traits: '冷静、动手能力强、喜欢探索事物运作原理' },
  ISFP:  { name: '探险家', traits: '感性、审美敏锐、追求当下美感、享受感官体验' },
  ESTP:  { name: '企业家', traits: '精力充沛、行动力强、喜欢冒险刺激与即时反馈' },
  ESFP:  { name: '表演家', traits: '热情开朗、享受当下、热爱成为焦点与社交互动' },
};

/**
 * 调用 DeepSeek API 动态生成指定 MBTI 类型的旅行推荐数据
 * @param {string} mbtiType - MBTI 类型代码，如 "INTJ"
 * @returns {Promise<object>} - 返回与 mbtiTravelData 格式一致的推荐数据
 *   格式：{ name, color, desc, travelStyles: [{icon, text}], destinations: [{name, img, why, match}], tips: string[] }
 */
async function getMbtiTravelRecommendation(mbtiType) {
  const profile = MBTI_TYPE_PROFILES[mbtiType];
  if (!profile) {
    throw new Error(`未知的 MBTI 类型: ${mbtiType}`);
  }

  // 1. 检查 API Key
  const apiKey = getApiKey();
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API_KEY_MISSING');
  }

  // 2. 构造专属 Prompt
  const systemPrompt = `你是一个专业的旅行心理学规划师，你的任务是根据用户的 MBTI 人格类型，为其量身定制旅行推荐方案。

你需要深刻理解每种 MBTI 类型的性格特征、行为偏好、旅行动机，然后给出高度个性化的推荐。

你必须严格按照以下 JSON 格式返回（不要包含 markdown 代码块标记 \`\`\`json，直接返回纯 JSON）：

{
  "desc": "一段 80-120 字的中文描述，概括该 MBTI 类型在旅行中的性格表现、核心偏好和旅行哲学",
  "travelStyles": [
    { "icon": "fa-xxx", "text": "旅行风格描述，12字以内" }
  ],
  "destinations": [
    {
      "name": "目的地名称（格式：城市·特色，如 京都·古都禅意）",
      "img": "留空字符串，由前端填充",
      "why": "一句话解释为什么适合该类型，20字以内",
      "match": 匹配度数字(85-99)
    }
  ],
  "tips": ["旅行贴士1", "旅行贴士2", "旅行贴士3"]
}

严格要求：
1. desc 必须精准反映该 MBTI 类型的真实旅行偏好，要有温度、有洞察力
2. travelStyles 必须包含 4 个旅行风格标签，icon 使用 FontAwesome 6 图标类名，如：fa-book, fa-route, fa-brain, fa-calendar-check, fa-microscope, fa-map-marked, fa-question, fa-camera, fa-users, fa-music, fa-palette, fa-mountain-sun, fa-umbrella-beach, fa-person-hiking, fa-compass, fa-binoculars, fa-utensils, fa-spa, fa-crown, fa-tree, fa-water, fa-landmark
3. destinations 必须包含 3 个推荐目的地，均为中国境内真实存在的城市或景点，match 按匹配度从高到低排列
4. tips 必须包含 3 条针对该类型的实用旅行建议，每条 20 字以内
5. img 字段统一返回空字符串 ""
6. 只返回 JSON，不要任何额外文字、注释或解释`;

  const userMessage = `请为 MBTI 类型 **${mbtiType}（${profile.name}）** 生成个性化旅行推荐。

该类型的核心性格特征：${profile.traits}

请根据这些特征，推荐最适合 ${mbtiType} 型人格的旅行风格、目的地和实用建议。`;

  // 3. 发起请求（60秒超时）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(DEEPSEEK_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.9,
        max_tokens: 2048,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 4. 处理 HTTP 错误状态码
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('API Key 无效，请在设置中重新配置');
      }
      if (response.status === 402) {
        throw new Error('API 账户余额不足，请充值后重试');
      }
      if (response.status === 429) {
        throw new Error('请求过于频繁，请稍后重试');
      }
      if (response.status >= 500) {
        throw new Error('DeepSeek 服务器繁忙，请稍后重试');
      }
      throw new Error(errData.error?.message || `API 请求失败 (${response.status})`);
    }

    // 5. 解析响应 JSON
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    if (!content || content.trim() === '') {
      throw new Error('API 返回了空内容，请重试');
    }

    // 6. 提取 JSON（兼容模型可能包裹 markdown 代码块的情况）
    let jsonStr = content.trim();

    // 去掉可能的 markdown 代码块标记
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    // 尝试解析 JSON
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      // 如果标准 JSON 解析失败，尝试更宽松的提取
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (retryErr) {
          throw new Error('AI 返回的数据格式异常，请重试');
        }
      } else {
        throw new Error('AI 返回的数据格式异常，请重试');
      }
    }

    // 7. 校验必要字段
    if (!parsed.desc || typeof parsed.desc !== 'string') {
      throw new Error('AI 返回数据缺少描述信息，请重试');
    }

    // 8. 组装标准格式并补充字段
    const colorMap = {
      INTJ: '#5882C1', INTP: '#5882C1', ENTJ: '#5882C1', ENTP: '#5882C1',
      INFJ: '#8E6BB0', INFP: '#8E6BB0', ENFJ: '#8E6BB0', ENFP: '#8E6BB0',
      ISTJ: '#4A90A4', ISFJ: '#4A90A4', ESTJ: '#4A90A4', ESFJ: '#4A90A4',
      ISTP: '#D4A748', ISFP: '#D4A748', ESTP: '#D4A748', ESFP: '#D4A748',
    };

    // 为没有 img 的目的地补充占位图
    const fallbackImages = [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80',
    ];

    const result = {
      name: profile.name,
      color: colorMap[mbtiType] || '#5882C1',
      desc: parsed.desc,
      travelStyles: Array.isArray(parsed.travelStyles)
        ? parsed.travelStyles.slice(0, 4).map((s, i) => ({
            icon: s.icon || 'fa-compass',
            text: s.text || `旅行风格 ${i + 1}`,
          }))
        : [],
      destinations: Array.isArray(parsed.destinations)
        ? parsed.destinations.slice(0, 3).map((d, i) => ({
            name: d.name || `推荐目的地 ${i + 1}`,
            img: d.img || fallbackImages[i],
            why: d.why || '完美契合你的旅行偏好',
            match: typeof d.match === 'number' ? d.match + '%' : (d.match || '90%'),
          }))
        : [],
      tips: Array.isArray(parsed.tips)
        ? parsed.tips.slice(0, 3)
        : ['提前规划行程，预留弹性时间', '带上好心情和好奇心', '记录旅途中的美好瞬间'],
    };

    return result;

  } catch (err) {
    clearTimeout(timeoutId);

    // 超时错误
    if (err.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接后重试');
    }

    // 网络错误
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络后重试');
    }

    // 透传已处理的错误
    throw err;
  }
}

/* ---------- 测试状态 ---------- */
let mbtiAnswers = {}; // { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
let currentQIndex = 0;

/* 直接选择 MBTI 类型（跳过测试，调用 AI 动态生成结果，失败时降级本地数据） */
async function selectMbtiType(type) {
  // 高亮选中的芯片
  document.querySelectorAll('.mbti-type-chip').forEach(chip => chip.classList.remove('selected'));
  const chips = document.querySelectorAll('.mbti-type-chip');
  chips.forEach(chip => {
    if (chip.querySelector('span:first-child')?.textContent === type) {
      chip.classList.add('selected');
    }
  });

  // 隐藏入口和问卷
  dom('mbtiEntry').style.display = 'none';
  dom('mbtiQuiz').style.display = 'none';
  const resultEl = dom('mbtiResult');
  resultEl.style.display = 'block';

  // ---------- 显示 Loading 状态 ----------
  const innerEl = resultEl.querySelector('.mbti-result-inner');
  innerEl.innerHTML = `
    <div class="mbti-loading-container">
      <div class="mbti-loading-spinner"></div>
      <div class="mbti-loading-text">AI 正在为你生成 <strong>${type}</strong> 专属旅行推荐...</div>
      <div class="mbti-loading-hint">正在分析 ${MBTI_TYPE_PROFILES[type]?.name || ''} 型人格的旅行偏好</div>
    </div>
  `;
  innerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // ---------- 尝试调用 AI，失败则降级 ----------
  let data = null;
  let isApiData = false;
  let fallbackReason = '';

  try {
    data = await getMbtiTravelRecommendation(type);
    isApiData = true;
  } catch (err) {
    console.warn('[MBTI] DeepSeek API 调用失败，降级使用本地数据:', err.message);
    fallbackReason = err.message;

    // 使用本地 mbtiTravelData 降级
    data = mbtiTravelData[type];
    if (!data) {
      // 极端情况：类型数据完全不存在
      innerEl.innerHTML = '<div class="mbti-loading-error">数据加载失败，请返回重试</div>';
      return;
    }
  }

  if (!data) return;

  // ---------- 渲染结果 ----------
  const dimNames = { E:'外向', I:'内向', S:'感觉', N:'直觉', T:'思考', F:'情感', J:'计划', P:'随性' };
  const dimPairs = [
    { left: 'E', right: 'I' },
    { left: 'S', right: 'N' },
    { left: 'T', right: 'F' },
    { left: 'J', right: 'P' },
  ];

  const destCards = data.destinations.map(d => `
    <div class="mbti-dest-card" data-action="navigateTo" data-dest="${d.name.split('·')[0]}">
      <img src="${d.img}" alt="${d.name}">
      <span class="mbti-dest-match">${d.match} 匹配</span>
      <div class="mbti-dest-card-info">
        <div class="mbti-dest-card-name">${d.name}</div>
        <div class="mbti-dest-card-why">${d.why}</div>
      </div>
    </div>`).join('');

  const styleTags = data.travelStyles.map(s => `
    <div class="style-tag"><i class="fa-solid ${s.icon}"></i><span>${s.text}</span></div>
  `).join('');

  const tipsList = data.tips.map(t => `<li>${t}</li>`).join('');

  const scoresHTML = dimPairs.map(({ left, right }) => {
    const isLeft = type.includes(left);
    const pct = isLeft ? 75 : 25;
    const dominant = isLeft ? left : right;
    return `
      <div class="score-dim">
        <div class="score-dim-labels">
          <span style="color:${isLeft?'var(--clr-accent)':'rgba(255,255,255,0.5)'}">${left} ${dimNames[left]}</span>
          <span style="color:${!isLeft?'var(--clr-accent)':'rgba(255,255,255,0.5)'}">${right} ${dimNames[right]}</span>
        </div>
        <div class="score-dim-bar">
          <div class="score-dim-fill ${isLeft?'':'right'}" style="width:${pct}%"></div>
        </div>
        <div class="score-dim-pct">${dominant} ${pct}%</div>
      </div>
    `;
  }).join('');

  // 降级提示条（仅在降级时显示）
  const fallbackBanner = !isApiData ? `
    <div class="mbti-fallback-banner">
      <i class="fa-solid fa-circle-info"></i>
      <span>AI 服务暂不可用 · 已展示本地推荐数据</span>
      <span class="mbti-fallback-reason" title="${fallbackReason}">${fallbackReason === 'API_KEY_MISSING' ? '原因：未配置 API Key' : '原因：网络或服务异常'}</span>
    </div>
  ` : '';

  // 重建完整的 result-inner 结构（保持所有 ID 与原始 HTML 一致）
  innerEl.innerHTML = `
    ${fallbackBanner}
    <div class="mbti-result-header">
      <div class="mbti-type-badge" id="mbtiTypeBadge">
        <span class="type-code" id="mbtiTypeCode">${type}</span>
        <span class="type-name" id="mbtiTypeName">${data.name}</span>
        ${isApiData ? '<span class="mbti-ai-badge"><i class="fa-solid fa-sparkles"></i> AI 生成</span>' : ''}
      </div>
      <div class="mbti-type-desc" id="mbtiTypeDesc">${data.desc}</div>
      <div class="mbti-scores" id="mbtiScores">${scoresHTML}</div>
    </div>

    <div class="mbti-travel-style">
      <h3><i class="fa-solid fa-suitcase-rolling"></i> 你的旅行风格</h3>
      <div class="travel-style-grid" id="travelStyleGrid">${styleTags}</div>
    </div>

    <div class="mbti-destinations">
      <h3><i class="fa-solid fa-map-location-dot"></i> 为你推荐的目的地</h3>
      <div class="mbti-dest-cards" id="mbtiDestCards">${destCards}</div>
    </div>

    <div class="mbti-tips">
      <h3><i class="fa-solid fa-lightbulb"></i> 旅行小贴士</h3>
      <ul class="mbti-tips-list" id="mbtiTipsList">${tipsList}</ul>
    </div>

    <div class="mbti-result-actions">
      <button class="btn-mbti-restart" data-action="restartMbti">
        <i class="fa-solid fa-rotate-left"></i> 重新测试
      </button>
      <button class="btn-mbti-plan" data-action="goToPlanning">
        <i class="fa-solid fa-wand-magic-sparkles"></i> 用 AI 规划旅行
      </button>
      <button class="btn-mbti-share" data-action="shareMbtiResult">
        <i class="fa-solid fa-share-nodes"></i> 分享结果
      </button>
    </div>
  `;

  window._mbtiType = type;
  window._mbtiName = data.name;
  window._mbtiData = data;

  // 滚动回结果区域
  setTimeout(() => {
    innerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 150);

  if (isApiData) {
    showToast(T.mbtiReady(type, data.name));
  }
  // 降级时不弹重复 toast，banner 已提供说明
}

function startMbtiTest() {
  mbtiAnswers = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  currentQIndex = 0;
  dom('mbtiEntry').style.display = 'none';
  dom('mbtiResult').style.display = 'none';
  dom('mbtiQuiz').style.display = 'block';
  renderMbtiQuestion();
}

function renderMbtiQuestion() {
  const q = mbtiQuestions[currentQIndex];
  const total = mbtiQuestions.length;
  const pct = ((currentQIndex / total) * 100).toFixed(0);

  document.getElementById('mbtiProgressFill').style.width = Math.max(5, pct) + '%';
  document.getElementById('mbtiProgressText').textContent = `${currentQIndex + 1} / ${total}`;
  document.getElementById('mbtiQNum').textContent = `问题 ${currentQIndex + 1}`;
  document.getElementById('mbtiQText').textContent = q.q;
  document.getElementById('mbtiOptAText').textContent = q.a.text;
  document.getElementById('mbtiOptBText').textContent = q.b.text;
  document.getElementById('dimBadge').textContent = q.dim;
  document.getElementById('dimLabel').textContent = q.dimLabel;

  // 重置选中状态
  document.querySelectorAll('.mbti-opt').forEach(o => o.classList.remove('selected'));

  // 返回按钮
  document.getElementById('mbtiBackBtn').style.display = currentQIndex > 0 ? 'flex' : 'none';

  // 卡片动画
  const card = document.getElementById('mbtiQuestionCard');
  card.style.animation = 'none';
  card.offsetHeight; // reflow
  card.style.animation = 'mbtiSlideIn 0.4s ease';
}

function answerMbti(choice) {
  const q = mbtiQuestions[currentQIndex];
  const selectedScore = choice === 'A' ? q.a.score : q.b.score;

  // 高亮选择
  const optEl = document.getElementById('mbtiOpt' + choice);
  optEl.classList.add('selected');

  // 记录答案
  if (mbtiAnswers.hasOwnProperty(selectedScore)) {
    mbtiAnswers[selectedScore]++;
  }

  setTimeout(() => {
    if (currentQIndex < mbtiQuestions.length - 1) {
      currentQIndex++;
      renderMbtiQuestion();
    } else {
      // 完成测试
      showMbtiResult();
    }
  }, 350);
}

function prevMbtiQ() {
  if (currentQIndex > 0) {
    // 回退时减去已记录的分数（需重新推算，简化处理：直接减1对应维度）
    currentQIndex--;
    renderMbtiQuestion();
    showToast(T.prevQuestion);
  }
}

async function showMbtiResult() {
  // 计算4个维度
  const E = mbtiAnswers.E, I = mbtiAnswers.I;
  const S = mbtiAnswers.S, N = mbtiAnswers.N;
  const T = mbtiAnswers.T, F = mbtiAnswers.F;
  const J = mbtiAnswers.J, P = mbtiAnswers.P;

  const type =
    (E >= I ? 'E' : 'I') +
    (S >= N ? 'S' : 'N') +
    (T >= F ? 'T' : 'F') +
    (J >= P ? 'J' : 'P');

  // 隐藏问卷，显示结果区域（先显示 Loading）
  dom('mbtiQuiz').style.display = 'none';
  const resultEl = dom('mbtiResult');
  resultEl.style.display = 'block';

  // ---------- 显示 Loading 状态 ----------
  const innerEl = resultEl.querySelector('.mbti-result-inner');
  innerEl.innerHTML = `
    <div class="mbti-loading-container">
      <div class="mbti-loading-spinner"></div>
      <div class="mbti-loading-text">测试完成！AI 正在为你生成 <strong>${type}</strong> 专属旅行推荐...</div>
      <div class="mbti-loading-hint">根据你的问卷回答，定制化分析 ${MBTI_TYPE_PROFILES[type]?.name || ''} 型人格的旅行偏好</div>
    </div>
  `;
  innerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // ---------- 尝试调用 AI，失败则降级 ----------
  let data = null;
  let isApiData = false;
  let fallbackReason = '';

  try {
    data = await getMbtiTravelRecommendation(type);
    isApiData = true;
  } catch (err) {
    console.warn('[MBTI] DeepSeek API 调用失败，降级使用本地数据:', err.message);
    fallbackReason = err.message;
    data = mbtiTravelData[type] || mbtiTravelData['INFP'];
  }

  if (!data) return;

  // ---------- 渲染结果 ----------
  // 维度分数条（使用实际问卷得分，保留精准度）
  const total4 = [E+I, S+N, T+F, J+P];
  const dims = [
    { left: 'E', right: 'I', lv: E, rv: I, t: total4[0] },
    { left: 'S', right: 'N', lv: S, rv: N, t: total4[1] },
    { left: 'T', right: 'F', lv: T, rv: F, t: total4[2] },
    { left: 'J', right: 'P', lv: J, rv: P, t: total4[3] },
  ];
  const dimNames = { E:'外向', I:'内向', S:'感觉', N:'直觉', T:'思考', F:'情感', J:'计划', P:'随性' };

  const scoresHTML = dims.map(d => {
    const dominant = d.lv >= d.rv ? d.left : d.right;
    const pct = d.t > 0 ? Math.round((Math.max(d.lv, d.rv) / d.t) * 100) : 50;
    const isLeft = d.lv >= d.rv;
    return `
      <div class="score-dim">
        <div class="score-dim-labels">
          <span style="color:${isLeft?'var(--clr-accent)':'rgba(255,255,255,0.5)'}">${d.left} ${dimNames[d.left]}</span>
          <span style="color:${!isLeft?'var(--clr-accent)':'rgba(255,255,255,0.5)'}">${d.right} ${dimNames[d.right]}</span>
        </div>
        <div class="score-dim-bar">
          <div class="score-dim-fill ${isLeft?'':'right'}" style="width:${pct}%"></div>
        </div>
        <div class="score-dim-pct">${dominant} ${pct}%</div>
      </div>
    `;
  }).join('');

  const styleTags = data.travelStyles.map(s => `
    <div class="style-tag"><i class="fa-solid ${s.icon}"></i><span>${s.text}</span></div>
  `).join('');

  const destCards = data.destinations.map(d => `
    <div class="mbti-dest-card" data-action="navigateTo" data-dest="${d.name.split('·')[0]}">
      <img src="${d.img}" alt="${d.name}" loading="lazy">
      <span class="mbti-dest-match">${d.match} 匹配</span>
      <div class="mbti-dest-card-info">
        <div class="mbti-dest-card-name">${d.name}</div>
        <div class="mbti-dest-card-why">${d.why}</div>
      </div>
    </div>
  `).join('');

  const tipsList = data.tips.map(t => `<li>${t}</li>`).join('');

  // 降级提示条
  const fallbackBanner = !isApiData ? `
    <div class="mbti-fallback-banner">
      <i class="fa-solid fa-circle-info"></i>
      <span>AI 服务暂不可用 · 已展示本地推荐数据</span>
      <span class="mbti-fallback-reason" title="${fallbackReason}">${fallbackReason === 'API_KEY_MISSING' ? '原因：未配置 API Key' : '原因：网络或服务异常'}</span>
    </div>
  ` : '';

  // 重建完整的 result-inner 结构
  innerEl.innerHTML = `
    ${fallbackBanner}
    <div class="mbti-result-header">
      <div class="mbti-type-badge" id="mbtiTypeBadge">
        <span class="type-code" id="mbtiTypeCode">${type}</span>
        <span class="type-name" id="mbtiTypeName">${data.name}</span>
        ${isApiData ? '<span class="mbti-ai-badge"><i class="fa-solid fa-sparkles"></i> AI 生成</span>' : ''}
      </div>
      <div class="mbti-type-desc" id="mbtiTypeDesc">${data.desc}</div>
      <div class="mbti-scores" id="mbtiScores">${scoresHTML}</div>
    </div>

    <div class="mbti-travel-style">
      <h3><i class="fa-solid fa-suitcase-rolling"></i> 你的旅行风格</h3>
      <div class="travel-style-grid" id="travelStyleGrid">${styleTags}</div>
    </div>

    <div class="mbti-destinations">
      <h3><i class="fa-solid fa-map-location-dot"></i> 为你推荐的目的地</h3>
      <div class="mbti-dest-cards" id="mbtiDestCards">${destCards}</div>
    </div>

    <div class="mbti-tips">
      <h3><i class="fa-solid fa-lightbulb"></i> 旅行小贴士</h3>
      <ul class="mbti-tips-list" id="mbtiTipsList">${tipsList}</ul>
    </div>

    <div class="mbti-result-actions">
      <button class="btn-mbti-restart" data-action="restartMbti">
        <i class="fa-solid fa-rotate-left"></i> 重新测试
      </button>
      <button class="btn-mbti-plan" data-action="goToPlanning">
        <i class="fa-solid fa-wand-magic-sparkles"></i> 用 AI 规划旅行
      </button>
      <button class="btn-mbti-share" data-action="shareMbtiResult">
        <i class="fa-solid fa-share-nodes"></i> 分享结果
      </button>
    </div>
  `;

  // 存储结果
  window._mbtiType = type;
  window._mbtiName = data.name;
  window._mbtiData = data;

  // 滚动到结果
  setTimeout(() => {
    innerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 150);

  if (isApiData) {
    showToast(T.mbtiDoneAi(type, data.name));
  } else {
    showToast(T.mbtiDone(type, data.name));
  }
}

function restartMbti() {
  dom('mbtiResult').style.display = 'none';
  dom('mbtiEntry').style.display = 'block';
  mbtiAnswers = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  currentQIndex = 0;
}

function goToPlanning() {
  document.querySelector('#upload').scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => {
    if (window._mbtiType) {
      const textarea = textInput;
      // 优先使用实际展示的完整数据（含AI生成结果），降级到本地数据
      const data = window._mbtiData || mbtiTravelData[window._mbtiType];
      if (textarea && data) {
        const styleTexts = (data.travelStyles || []).map(s => s.text).join('、');
        textarea.value = [
          `【我的MBTI旅行性格】`,
          `类型：${window._mbtiType}（${data.name}）`,
          ``,
          `性格特点：${data.desc}`,
          ``,
          `旅行风格：${styleTexts || '未定义'}`,
          ``,
          `请基于以上MBTI性格特点和旅行偏好，为我规划一份最合适的旅行行程，包含目的地推荐、每日安排和注意事项。`,
        ].join('\n');
        charCount.textContent = textarea.value.length;
        // 切换到文字Tab
        document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector('[data-tab="text"]').classList.add('active');
        document.getElementById('tab-text').classList.add('active');
        showToast(T.mbtiImported);
      }
    }
  }, 800);
}

function shareMbtiResult() {
  const type = window._mbtiType || 'INFP';
  const name = window._mbtiName || '调停者';
  const msg = `我的旅行性格是 ${type} ${name}！快来测测你的吧 → 探途 WANDR`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(msg).then(() => showToast(T.shareCopied));
  } else {
    showToast(T.shareCopied);
  }
}

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
}

function closeBookingModal(e) {
  if (!e || e.target === document.getElementById('bookingModal')) {
    document.getElementById('bookingModal').classList.remove('open');
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
    const data = await r.json();
    return data.success ? data : null;
  } catch (e) {
    console.warn('[FlyAI] 搜索产品失败', e.message);
    return null;
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
