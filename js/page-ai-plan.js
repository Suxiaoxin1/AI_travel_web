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

  validFiles.forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const base64 = ev.target.result;
      uploadedPhotoBase64.push(base64);

      const item = document.createElement('div');
      item.className = 'photo-preview-item';
      item.innerHTML = `
        <img src="${base64}" alt="上传照片 ${idx + 1}">
        <span class="photo-preview-remove" data-action="removePhoto" data-index="${idx}" title="移除照片"><i class="fa-solid fa-xmark"></i></span>
      `;
      photoPreview.appendChild(item);

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
const charProgressFill = document.getElementById('charProgressFill');
const charCounterWrap = document.getElementById('charCounterWrap');
textInput.addEventListener('input', () => {
  const len = Math.min(textInput.value.length, 500);
  charCount.textContent = len;
  if (charProgressFill) {
    charProgressFill.style.width = (len / 500 * 100) + '%';
  }
  if (charCounterWrap) {
    charCounterWrap.classList.toggle('warn', len > 400);
  }
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

// ============ 语音录音（Web Speech API 真实识别） ============
let isRecording = false;
let recordTimer = null;
let recordSeconds = 0;
let recognition = null;
let finalTranscript = ''; // 累积的最终识别文本

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

function initRecognition() {
  if (!SpeechRecognitionAPI) return null;
  const rec = new SpeechRecognitionAPI();
  rec.lang = 'zh-CN';
  rec.interimResults = true;  // 实时中间结果
  rec.continuous = true;      // 连续识别
  rec.maxAlternatives = 1;
  return rec;
}

function toggleRecording() {
  const btn = document.getElementById('recordBtn');
  const icon = document.getElementById('recordIcon');
  const visualizer = document.getElementById('voiceVisualizer');
  const hintEl = document.getElementById('recordHint');
  const timerEl = document.getElementById('recordTimer');
  const transcriptEl = document.getElementById('voiceTranscript');
  const transcriptText = document.getElementById('transcriptText');

  if (!isRecording) {
    // 检查 API 支持
    if (!SpeechRecognitionAPI) {
      showToast('您的浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器');
      return;
    }

    isRecording = true;
    btn.classList.add('recording');
    icon.className = 'fa-solid fa-stop';
    visualizer.classList.add('recording');
    hintEl.textContent = '正在录音...说出你想去哪里旅行';
    recordSeconds = 0;
    timerEl.style.display = 'block';
    timerEl.textContent = '00:00';
    transcriptText.textContent = '';
    finalTranscript = '';

    // 创建识别实例
    recognition = initRecognition();
    if (!recognition) return;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      // 实时显示：最终结果 + 中间结果（灰色表示非最终）
      transcriptEl.style.display = 'block';
      const displayText = finalTranscript + (interim ? `<span style="color:var(--clr-text-light);opacity:0.6">${interim}</span>` : '');
      transcriptText.innerHTML = displayText || '<span style="color:var(--clr-text-light);opacity:0.5">正在听...</span>';
    };

    recognition.onerror = (event) => {
      console.warn('语音识别错误:', event.error, event.message);
      if (event.error === 'no-speech') {
        hintEl.textContent = '未检测到语音，请重试';
      } else if (event.error === 'aborted') {
        // 用户主动停止，忽略
      } else if (event.error === 'not-allowed') {
        showToast('请允许使用麦克风权限后重试');
        stopRecordingUI(btn, icon, visualizer, hintEl, timerEl, transcriptEl, transcriptText);
      } else {
        hintEl.textContent = '识别出错，点击重新录音';
      }
    };

    recognition.onend = () => {
      // 如果仍处于录音状态（非用户主动停止），自动重启
      if (isRecording) {
        try { recognition.start(); } catch (e) { /* ignore */ }
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.warn('启动语音识别失败:', e);
      hintEl.textContent = '启动失败，请重试';
    }

    // 计时器
    recordTimer = setInterval(() => {
      recordSeconds++;
      const m = Math.floor(recordSeconds / 60).toString().padStart(2, '0');
      const s = (recordSeconds % 60).toString().padStart(2, '0');
      timerEl.textContent = `${m}:${s}`;
    }, 1000);
  } else {
    // 停止录音
    stopRecordingUI(btn, icon, visualizer, hintEl, timerEl, transcriptEl, transcriptText);
  }
}

function stopRecordingUI(btn, icon, visualizer, hintEl, timerEl, transcriptEl, transcriptText) {
  isRecording = false;
  btn.classList.remove('recording');
  icon.className = 'fa-solid fa-microphone';
  visualizer.classList.remove('recording');
  clearInterval(recordTimer);
  recordTimer = null;
  timerEl.style.display = 'none';

  // 停止识别实例
  if (recognition) {
    try { recognition.abort(); } catch (e) { /* ignore */ }
    recognition = null;
  }

  // 清理中间结果的 HTML 标签
  transcriptText.textContent = finalTranscript || '';

  if (finalTranscript.trim()) {
    hintEl.textContent = '录音完成，点击重新录制';
    transcriptEl.style.display = 'block';
    showToast(T.recordDone);
  } else {
    hintEl.textContent = '未识别到内容，点击重新录音';
    transcriptEl.style.display = 'none';
  }
}

// API 端点常量（DEEPSEEK_API_ENDPOINT/DEEPSEEK_MODEL/ZHIPU_API_ENDPOINT/ZHIPU_VISION_MODEL）
// → 已在 js/api-key-manager.js 中定义

// API Key 管理器已提取到 js/api-key-manager.js（createApiKeyManager 工厂 + 全局函数）
// 全局函数 getApiKey/saveApiKey/toggleApiKeyInput/getZhipuKey/... 仍然可用

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // ★ 优先级最高：处理来自 MBTI 页面的跨页数据传递
  // （必须在任何可能抛错的调用之前执行，确保数据导入不受其他模块缺失影响）
  handleMbtiUrlParams();

  deepseekKey.init();
  zhipuKey.init();
  openaiKey.init();

  // 初始化 Leaflet 交互地图（仅 navigate.html 有此函数，其他页面跳过）
  setTimeout(() => {
    if (typeof initLeafletMap === 'function') initLeafletMap();
  }, 300);
  // 绑定底图样式切换
  setTimeout(() => {
    if (typeof initMapStyleToggle === 'function') initMapStyleToggle();
  }, 500);
  // 渲染热门目的地初始内容（仅 destinations 相关页面有此函数）
  try { renderDestinations('recommended'); } catch (e) { /* 非 destinations 页面跳过 */ }
  // 刷新日记徽标
  try { refreshDiaryBadge(); } catch (e) { /* 非 video 相关页面跳过 */ }
});

/**
 * 读取 sessionStorage 中的 MBTI 数据（由 mbti.html 存入），
 * 自动切换到文字 Tab 并填入 MBTI 性格描述（含完整的风格/目的地/贴士信息）
 */
function handleMbtiUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const mbtiType = params.get('mbtiType');

  // ★ 优先从 sessionStorage 读取完整数据
  let savedData = null;
  try {
    const raw = sessionStorage.getItem('wandr_mbti_result');
    if (raw) savedData = JSON.parse(raw);
  } catch (e) { /* ignore */ }

  const type = savedData?.type || mbtiType;
  if (!type) return;

  const textarea = document.getElementById('textInput');
  if (!textarea) return;

  const name = savedData?.name || '';

  // 拼接丰富的 MBTI 分析结果文本（含旅行风格 + 目的地偏好）
  const lines = ['【我的MBTI旅行性格】', `类型：${type}（${name}）`];

  if (savedData?.desc) {
    lines.push('', `性格分析：${savedData.desc}`);
  }
  if (savedData?.travelStyles?.length) {
    const styleTexts = savedData.travelStyles.map(s => s.text).join('、');
    lines.push(`旅行风格：${styleTexts}`);
  }
  if (savedData?.destinations?.length) {
    const destNames = savedData.destinations.map(d => d.name).join('、');
    lines.push(`偏好目的地类型：${destNames}`);
  }
  if (savedData?.tips?.length) {
    lines.push(`旅行偏好：${savedData.tips.join('；')}`);
  }

  lines.push('', '请基于以上MBTI性格特点和旅行偏好，为我规划一份最合适的旅行行程，包含目的地推荐、每日安排和注意事项。');

  textarea.value = lines.join('\n');

  // 更新字符计数
  const charCount = document.getElementById('charCount');
  if (charCount) charCount.textContent = textarea.value.length;

  // 切换到文字 Tab
  setTimeout(() => {
    document.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const textTabBtn = document.querySelector('[data-tab="text"]');
    const textTabContent = document.getElementById('tab-text');
    if (textTabBtn) textTabBtn.classList.add('active');
    if (textTabContent) textTabContent.classList.add('active');
  }, 200);
}

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
  const reasoningContentEl = dom('reasoningContent');
  if (reasoningContentEl) reasoningContentEl.classList.remove('open');
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
        reasoningContent.classList.add('open');
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
  const body = dom('reasoningContent');
  const chevron = dom('reasoningChevron');
  if (!body) return;
  if (body.classList.contains('open')) {
    body.classList.remove('open');
    if (chevron) chevron.style.transform = 'rotate(0deg)';
  } else {
    body.classList.add('open');
    if (chevron) chevron.style.transform = 'rotate(180deg)';
  }
}

// 切换 API 详情展开/折叠
function toggleApiDetails() {
  const section = document.getElementById('apiDetailsSection');
  if (!section) return;
  section.style.display = section.style.display === 'none' ? 'block' : 'none';
}

function collectUserInput() {
  const parts = [];

  // 文字输入
  const text = textInput.value.trim();
  if (text) parts.push(text);

  // 语音识别文字
  if (finalTranscript && finalTranscript.trim()) {
    parts.push(finalTranscript.trim());
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
  const systemPrompt = `你是"探途 WANDR"的资深旅行规划师，拥有 10 年以上旅行产品设计经验。你的核心能力是：深度理解用户画像 → 精准匹配目的地 → 设计可落地的行程方案。

## 你的规划方法论

### 1. 用户画像分析
从用户输入中提取关键维度，形成清晰的用户画像：
- **旅行类型**：用户明确提到的偏好（海滨/山野/古城/都市/美食/探险/文艺等）
- **出行人群**：独自游需关注安全与社交；情侣游重浪漫与私密；家庭游重亲子友好与便利；朋友游重互动与性价比
- **预算敏感度**：经济实惠（≤3000/人）→ 性价比优先、公共交通为主；适中（3000-8000）→ 舒适体验、特色住宿；品质（8000-15000）→ 精选酒店、包车/自驾；奢华（15000+）→ 高端度假村、私人定制
- **时间约束**：1-3天→周边短途；3-5天→省内/邻省；5-7天→跨省深度；7-14天→多城串联

### 2. 目的地匹配逻辑
- 当用户没有指定具体目的地时，根据画像从中国境内目的地中匹配最佳选项
- 考虑当前季节的适宜性（如夏季推草原/海滨/高原避暑，冬季推三亚/雪山/温泉）
- 小众偏好→推相对冷门但品质高的替代（如不要所有人都推三亚，可推万宁/北海/惠州）

### 3. 行程设计原则
- **时间合理**：景点间交通时间需留足（同城景点间30-60分钟），不要把5个景点塞在下午
- **地理聚类**：同一天的景点应在同一片区，减少无谓奔波
- **节奏把控**：每天安排 3-5 个核心活动，留有自由探索时间；避免连续高强度日
- **餐饮嵌入**：每天至少推荐 1 个地道美食点
- **首尾日特殊处理**：第一天考虑抵达时间，最后一天预留返程

## 输出格式

你必须严格按照以下 JSON 格式返回（不要包含 markdown 代码块标记）：

{
  "input_analysis": "深度用户画像分析，200字左右，包含：1)从输入中提取的关键偏好 2)用户画像总结 3)匹配逻辑——为什么这个目的地最适合他/她",
  "name": "目的地名称（格式：城市·特色，如 三亚·亚龙湾、大理·洱海畔）",
  "location": "所在省/自治区/直辖市",
  "tags": ["标签1", "标签2", "标签3"],
  "score": 95,
  "why_this_place": "推荐理由，80字以内，说明这个目的地的独特魅力和匹配度",
  "best_travel_months": "最佳旅行月份，如 3-5月、9-11月",
  "budget_estimate": "预估人均总花费范围，如 3000-5000元/人",
  "accommodation_style": "住宿风格建议，30字以内，如 建议入住古城内的精品民宿，闹中取静",
  "travel_tips": ["实用贴士1", "实用贴士2", "实用贴士3"],
  "days": [
    {
      "title": "第1天主题（如：初见三亚·椰梦长廊）",
      "desc": "第1天简短描述，含当天行程亮点",
      "acts": [
        { "time": "09:00", "icon": "fa-plane-arrival", "name": "景点/活动名称", "desc": "具体做什么、看什么、体验什么", "addr": "真实完整地址" }
      ]
    }
  ]
}

## 字段规范

| 字段 | 要求 |
|------|------|
| input_analysis | 必须真实反映用户输入，不能泛泛而谈；要体现你对用户需求的"理解"而非复述 |
| score | 0-100 匹配度评分，需有区分度（不是所有推荐都是 90+）；完美匹配 95-98，良好匹配 85-94，勉强匹配 70-84 |
| tags | 3 个标签，分别代表：目的地类型 / 核心体验 / 氛围调性，如 ["海滨度假", "潜水天堂", "浪漫治愈"] |
| icon | FontAwesome 6 类名，常用：fa-umbrella-beach 海滩 / fa-mountain 山 / fa-landmark 古迹 / fa-water 湖河 / fa-tree 森林 / fa-city 都市 / fa-pagoda 寺庙 / fa-camera 观景 / fa-utensils 美食 / fa-hotel 住宿 / fa-spa 温泉 / fa-person-hiking 徒步 / fa-ship 游船 / fa-train 火车 / fa-plane-arrival 抵达 / fa-moon 夜景 / fa-music 演出 / fa-bowl-food 餐饮 / fa-martini-glass 酒吧 |
| addr | 真实可搜索的完整地址（省市区+街道门牌号），如"浙江省杭州市西湖区龙井路1号"；无明确地址的活动留空字符串 "" |
| time | 24小时制，活动时间需考虑交通衔接，相邻活动间隔至少 30 分钟 |
| why_this_place | 打动用户的一句话推荐语，突出目的地与用户画像的契合点 |
| budget_estimate | 为人均总花费给出合理范围，需与用户预算匹配 |
| travel_tips | 3-5 条实用贴士，如穿衣建议、预订提醒、避坑指南、交通提示等 |

## 硬性约束
1. 只推荐中国境内真实存在的城市/景点
2. 行程天数为用户指定的天数范围（字符串可能包含"X-Y 天"格式），取中间值作为规划天数
3. 只返回 JSON，不要任何额外文字
4. 不要编造不存在的景点地址`;

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
  const systemPrompt = `你是"探途 WANDR"的资深旅行规划师，同时具备专业的视觉分析能力。用户上传了旅行照片，你将通过「视觉识别 → 偏好推断 → 目的地匹配 → 行程设计」四步法完成规划。

## 第一步：视觉识别（从照片提取信息）

请仔细观察每张照片，从以下维度分析：

### 场景与自然元素
- **地形地貌**：海边/山地/草原/沙漠/湖泊/城市/乡村/古镇？
- **植被特征**：热带棕榈/温带针叶/竹林/花海/秋叶/雪山植被？
- **水体**：海水颜色（蓝绿/深蓝/碧绿）、湖泊/河流/瀑布、清澈度
- **天空与天气**：晴朗/多云/阴雨/雾气、蓝天白云还是灰蒙

### 建筑与人文元素
- **建筑风格**：现代都市/传统中式/徽派/藏式/欧式/东南亚/日式/工业风
- **街景氛围**：繁华商业/安静小巷/文艺街区/市井烟火/度假感
- **人物线索**：照片中是否有人的着装（夏装/冬装/泳装/户外装备）、活动状态（徒步/拍照/用餐/休息）

### 色彩与氛围
- **主导色调**：暖棕复古/蓝白清新/绿意自然/金橙日落/灰蓝冷峻/粉紫梦幻
- **整体氛围**：浪漫/宁静/热闹/冒险/慵懒/治愈/文艺/奢华

## 第二步：偏好推断（从视觉到需求）

将视觉分析转化为用户的旅行偏好信号：
- 多张海边照片 → 用户可能喜欢海岛度假、水上活动
- 古镇小巷+美食摊位 → 喜欢深度文化体验、在地美食探索
- 雪山/徒步装备 → 热爱户外探险、追求自然奇观
- 精致咖啡店/设计酒店 → 注重品质生活、文艺打卡
- 日出/日落/星空 → 追求摄影和浪漫时刻
- 骑行/公路照 → 喜欢自由探索、自驾旅行

结合用户文字描述中的预算、天数、出行方式等信息，形成完整的用户画像。

## 第三步：目的地匹配

根据分析出的偏好，从中国境内选出最佳匹配的目的地：
- 预算必须匹配：不要给"经济实惠"用户推荐三亚五星度假村
- 季节适宜：考虑当前实际季节下的目的地体验
- 若偏好小众，优先推相对冷门但品质高的替代

## 第四步：行程设计

- 每天 3-5 个核心活动，景点间需考虑交通时间（同片区 30-60 分钟缓冲）
- 同一天的景点应地理聚类，减少奔波
- 每天至少嵌入 1 个地道美食体验
- 首日考虑抵达时间，末日预留返程

## 输出格式

你必须严格按照以下 JSON 格式返回（不要包含 markdown 代码块标记）：

{
  "input_analysis": "200字左右，分两段：1)【照片分析】从每张照片中看到了什么场景、建筑、氛围、色彩 2)【偏好推断】这些视觉特征折射出用户怎样的旅行偏好，以及为什么推荐该目的地",
  "name": "目的地名称（格式：城市·特色，如 三亚·亚龙湾）",
  "location": "所在省/自治区/直辖市",
  "tags": ["标签1", "标签2", "标签3"],
  "score": 95,
  "why_this_place": "推荐理由，80字以内",
  "best_travel_months": "最佳旅行月份",
  "budget_estimate": "预估人均总花费范围",
  "accommodation_style": "住宿风格建议，30字以内",
  "travel_tips": ["实用贴士1", "实用贴士2", "实用贴士3"],
  "days": [
    {
      "title": "第1天主题",
      "desc": "第1天简短描述",
      "acts": [
        { "time": "09:00", "icon": "fa-plane-arrival", "name": "景点/活动名称", "desc": "具体做什么、看什么", "addr": "真实完整地址" }
      ]
    }
  ]
}

## 字段规范（同文本模式，重点是以下视觉相关差异）

| 字段 | 视觉分析特殊要求 |
|------|-----------------|
| input_analysis | 必须先描述照片中的视觉信息（场景、颜色、氛围），再推导偏好 |
| score | 照片特征与目的地的视觉/氛围匹配度越高，分数越高 |
| tags | 第三个标签建议反映照片中体现的氛围调性 |

## 硬性约束
1. 只推荐中国境内真实存在的城市/景点
2. 只返回 JSON，不要任何额外文字
3. 不要编造不存在的景点地址
4. addr 为真实可搜索完整地址，无明确地址留空 ""`;

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

  // 新增字段默认值（向后兼容旧版 AI 输出）
  parsed.why_this_place = parsed.why_this_place || '';
  parsed.best_travel_months = parsed.best_travel_months || '';
  parsed.budget_estimate = parsed.budget_estimate || '';
  parsed.accommodation_style = parsed.accommodation_style || '';
  parsed.travel_tips = Array.isArray(parsed.travel_tips) ? parsed.travel_tips : [];

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

  // 渲染推荐目的地（含打字机光标）
  document.getElementById('recommendedDest').innerHTML = `
    <div class="rec-dest-card">
      <img src="${dest.img || getDefaultImage(dest.tags)}" alt="${dest.name}" loading="lazy">
      <div class="rec-dest-overlay">
        <div class="rec-dest-name typing-cursor" id="recDestName">${dest.name}</div>
        <div class="rec-dest-tags">${(dest.tags || []).map(t => `<span class="rec-dest-tag">${t}</span>`).join('')}</div>
      </div>
    </div>
  `;
  // 打字机光标 1.5 秒后自动消失
  setTimeout(() => {
    document.getElementById('recDestName')?.classList.add('done');
  }, 1500);

  // 渲染旅行洞察（推荐理由 / 最佳季节 / 预算 / 住宿 / 贴士）
  renderTravelInsights(dest);

  // 渲染行程预览（先显示骨架屏，短暂后替换）
  const itin = document.getElementById('itineraryPreview');
  showGridSkeleton(itin, 3, 'itinerary');
  setTimeout(() => {
    itin.innerHTML = dest.days.slice(0, 3).map((d, i) => `
      <div class="itin-day">
        <div class="itin-day-num">Day${i + 1}</div>
        <div class="itin-day-content">
          <div class="itin-day-title">${d.title || '第' + (i+1) + '天行程'}</div>
          <div class="itin-day-desc">${d.desc || getDaySummary(d)}</div>
        </div>
      </div>
    `).join('');
  }, 350);

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

  // ---- 流式渐入动画 ----
  const resultContent = dom('resultContent');
  resultContent.style.display = 'block';

  // 为直接子面板设置 --i 索引，触发 CSS fade-stagger 动画
  resultContent.classList.remove('fade-stagger');
  void resultContent.offsetWidth; // 强制 reflow，重启动画
  resultContent.classList.add('fade-stagger');
  Array.from(resultContent.children).forEach((child, i) => {
    child.style.setProperty('--i', i);
  });
}

/** 渲染旅行洞察：推荐理由 / 最佳季节 / 预算 / 住宿 / 贴士 */
function renderTravelInsights(dest) {
  const container = document.getElementById('travelInsights');
  if (!container) return;

  const sections = [];

  // 推荐理由
  if (dest.why_this_place) {
    sections.push(`
      <div class="insight-row">
        <div class="insight-icon"><i class="fa-solid fa-lightbulb"></i></div>
        <div class="insight-body">
          <div class="insight-label">推荐理由</div>
          <div class="insight-text">${dest.why_this_place}</div>
        </div>
      </div>
    `);
  }

  // 最佳季节 + 预估预算
  if (dest.best_travel_months || dest.budget_estimate) {
    let metaItems = '';
    if (dest.best_travel_months) {
      metaItems += `<div class="insight-meta-item"><i class="fa-solid fa-calendar-days"></i> 最佳季节：${dest.best_travel_months}</div>`;
    }
    if (dest.budget_estimate) {
      metaItems += `<div class="insight-meta-item"><i class="fa-solid fa-coins"></i> 预估花费：${dest.budget_estimate}</div>`;
    }
    sections.push(`
      <div class="insight-row insight-meta-row">
        <div class="insight-icon"><i class="fa-solid fa-circle-info"></i></div>
        <div class="insight-body">
          <div class="insight-meta-grid">${metaItems}</div>
        </div>
      </div>
    `);
  }

  // 住宿建议
  if (dest.accommodation_style) {
    sections.push(`
      <div class="insight-row">
        <div class="insight-icon"><i class="fa-solid fa-hotel"></i></div>
        <div class="insight-body">
          <div class="insight-label">住宿建议</div>
          <div class="insight-text">${dest.accommodation_style}</div>
        </div>
      </div>
    `);
  }

  // 旅行贴士
  if (dest.travel_tips && dest.travel_tips.length > 0) {
    const tipsHtml = dest.travel_tips.map(t => `<li><i class="fa-solid fa-check"></i> ${t}</li>`).join('');
    sections.push(`
      <div class="insight-row">
        <div class="insight-icon"><i class="fa-solid fa-clipboard-list"></i></div>
        <div class="insight-body">
          <div class="insight-label">旅行贴士</div>
          <ul class="insight-tips-list">${tipsHtml}</ul>
        </div>
      </div>
    `);
  }

  if (sections.length > 0) {
    container.innerHTML = sections.join('');
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
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
  // A11y：打开 modal 时启用焦点陷阱
  trapFocus(dom('detailModal'));
}

function closeDetailModal() {
  dom('detailModal').classList.remove('open');
  releaseFocus(dom('detailModal'));
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
