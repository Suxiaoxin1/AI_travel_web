/* ===========================================================
   WANDR API Key 管理器（工厂模式）
   =========================================================== */

const DEEPSEEK_API_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-reasoner';
const ZHIPU_API_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const ZHIPU_VISION_MODEL = 'glm-4.6v';

/**
 * 创建一套 API Key 管理函数
 */
function createApiKeyManager(cfg) {
  const get = () => {
    try { return localStorage.getItem(cfg.storageKey) || ''; }
    catch { return ''; }
  };

  const save = () => {
    const input = dom(cfg.inputId);
    if (!input) return;
    const key = input.value.trim();
    if (!key) { showToast(cfg.enterToast); return; }
    if (cfg.needsSkPrefix && !key.startsWith('sk-')) { showToast(cfg.formatToast); return; }
    try { localStorage.setItem(cfg.storageKey, key); } catch(e) { showToast('存储失败，请检查浏览器存储空间'); return; }
    showToast(cfg.savedToast);
    updateStatus();
  };

  const updateStatus = () => {
    const el = document.getElementById(cfg.statusId);
    if (!el) return;
    const key = get();
    if (key) {
      const masked = key.slice(0, cfg.maskPrefix) + '***' + key.slice(-4);
      el.textContent = '已配置: ' + masked;
      el.style.color = '#27ae60';
    } else {
      el.textContent = '未配置';
      el.style.color = '#e74c3c';
    }
  };

  const toggleInput = () => {
    WANDR.toggleCollapse(cfg.wrapId, cfg.chevronId);
  };

  const toggleVisibility = () => {
    const input = dom(cfg.inputId);
    const eye = document.getElementById(cfg.eyeId);
    if (!input || !eye) return;
    if (input.type === 'password') { input.type = 'text'; eye.className = 'fa-solid fa-eye-slash'; }
    else { input.type = 'password'; eye.className = 'fa-solid fa-eye'; }
  };

  const init = () => {
    const key = get();
    if (key) {
      const input = dom(cfg.inputId);
      if (input) input.value = key;
    }
    updateStatus();
  };

  return { get, save, toggleInput, toggleVisibility, updateStatus, init };
}

// ---- DeepSeek ----
const deepseekKey = createApiKeyManager({
  storageKey: 'wandr_deepseek_key', inputId: 'deepseekApiKey',
  wrapId: 'apiKeyInputWrap', chevronId: 'apiKeyChevron', eyeId: 'apiKeyEye', statusId: 'apiKeyStatus',
  needsSkPrefix: true, maskPrefix: 5,
  enterToast: T.enterApiKey, formatToast: T.invalidKeyFormat, savedToast: T.apiKeySaved
});

// ---- 智谱 GLM-4.6V（无需 sk- 前缀校验）----
const zhipuKey = createApiKeyManager({
  storageKey: 'wandr_zhipu_key', inputId: 'zhipuApiKey',
  wrapId: 'zhipuKeyInputWrap', chevronId: 'zhipuKeyChevron', eyeId: 'zhipuKeyEye', statusId: 'zhipuKeyStatus',
  needsSkPrefix: false, maskPrefix: 5,
  enterToast: T.enterZhipuKey, formatToast: '', savedToast: T.zhipuKeySaved // formatToast 不会被调用（needsSkPrefix=false）
});

// ---- OpenAI ----
const openaiKey = createApiKeyManager({
  storageKey: 'wandr_openai_key', inputId: 'openaiApiKey',
  wrapId: 'openaiKeyInputWrap', chevronId: 'openaiKeyChevron', eyeId: 'openaiKeyEye', statusId: 'openaiKeyStatus',
  needsSkPrefix: true, maskPrefix: 7,
  enterToast: T.needOpenAIKey, formatToast: T.invalidKeyFormat, savedToast: T.openAIKeySaved
});

// 兼容全局函数名
function getApiKey() { return deepseekKey.get(); }
function saveApiKey() { deepseekKey.save(); }
function toggleApiKeyInput() { deepseekKey.toggleInput(); }
function toggleApiKeyVisibility() { deepseekKey.toggleVisibility(); }
function updateApiKeyStatus() { deepseekKey.updateStatus(); }
function getZhipuKey() { return zhipuKey.get(); }
function saveZhipuKey() { zhipuKey.save(); }
function toggleZhipuKeyInput() { zhipuKey.toggleInput(); }
function toggleZhipuKeyVisibility() { zhipuKey.toggleVisibility(); }
function updateZhipuKeyStatus() { zhipuKey.updateStatus(); }
function getOpenAIKey() { return openaiKey.get(); }
function saveOpenAIKey() { openaiKey.save(); }
function toggleOpenAIKeyInput() { openaiKey.toggleInput(); }
function toggleOpenAIKeyVisibility() { openaiKey.toggleVisibility(); }
function updateOpenAIKeyStatus() { openaiKey.updateStatus(); }

// 挂载到命名空间
WANDR.apiKeys = { deepseek: deepseekKey, zhipu: zhipuKey, openai: openaiKey };
