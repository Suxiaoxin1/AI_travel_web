/* ===========================================================
   WANDR i18n — Toast 消息常量（中英双语可扩展）
   =========================================================== */

const T = {
  // 上传
  uploadInvalidFormat: '请上传 JPG、PNG 或 WebP 格式的图片',
  recordDone: '录音完成，可点击 AI 分析按钮',

  // API Key
  enterZhipuKey: '请输入智谱 API Key',
  zhipuKeySaved: '智谱 API Key 已保存 ✓',
  enterApiKey: '请输入有效的 API Key',
  invalidKeyFormat: 'API Key 格式不正确，应以 sk- 开头',
  apiKeySaved: 'API Key 已保存 ✓',
  needZhipuKey: '图片分析需要配置智谱 GLM-4.6V API Key 📷',
  needDsKey: '请先配置 DeepSeek API Key 🔑',
  needOpenAIKey: '请输入 OpenAI API Key',
  openAIKeySaved: 'OpenAI API Key 已保存 ✓',
  aiNeedOpenAIKey: 'AI 手帐生成需要配置 OpenAI API Key 🤖',

  // 行程
  planSaved: '行程已保存到「我的收藏」✓',
  selectDest: '请先选择目的地',
  needAiFirst: '请先进行 AI 分析',
  noInput: '请先上传照片、输入文字描述或进行语音录音 📝',

  // 评价
  moreReviewsLoaded: '已加载更多评价',

  // 日记
  diaryGenerated: '旅行日记生成完毕！',
  diaryDownloading: '日记图片下载中...',
  diaryDownloaded: '日记已下载到本地',
  diarySaved: '日记已保存到「我的记录」',
  needPhotos: '请先上传至少 1 张旅行照片',
  needTitle: '请输入日记标题',
  aiGenerating: 'GPT 正在为你设计旅行手帐...',
  aiGenerated: 'GPT 手帐生成完毕！',
  aiGenFailed: 'GPT 生成失败，请重试',
  diaryAISaved: 'GPT 手帐已保存到「我的记录」',
  needAiContent: '请输入日记标题和内容，GPT 将为你设计手帐',

  // 分享
  linkCopied: '链接已复制到剪贴板！',

  // MBTI
  prevQuestion: '已返回上一题',
  mbtiImported: '已将你的MBTI完整画像导入 AI 规划，点击分析即可获取专属行程 ✨',
  shareCopied: '结果已复制，快去分享给朋友！',

  // 收藏 & 预定
  removedFromFav: '已从收藏中移除',
  enterName: '请输入联系人姓名 👤',
  enterPhone: '请输入有效的手机号码 📱',
  enterDate: '请选择出发日期 📅',
  bookingCancelled: '预定已取消',

  // 模板函数
  photosSelected: n => `已选择 ${n} 张照片，AI 将深度分析照片内容`,
  apiError: m => `API 调用失败: ${m}`,
  recommended: (n, s) => `已为你推荐：${n}，匹配度 ${s}%`,
  searching: q => `搜索"${q}"中...`,
  searchDone: q => `已找到"${q}"相关景点，请在地图上查看`,
  navigating: d => `正在打开 ${d} 地图导航...`,
  vidPhotosPicked: n => `已选择 ${n} 张照片`,
  musicPlaying: t => `正在播放"${t}"预览`,
  mbtiReady: (t, n) => `AI 已为 ${t}（${n}）生成专属旅行推荐 ✨`,
  mbtiDone: (t, n) => `测试完成！你是 ${t} ${n} 🎉`,
  mbtiDoneAi: (t, n) => `测试完成！AI 已为 ${t}（${n}）生成专属旅行推荐 ✨`,
  favAdded: n => `❤️ 已收藏「${n}」`,
  favRemoved: n => `已取消收藏「${n}」`,
  bookingOk: id => `🎉 预定成功！订单号 ${id}，等您出发！`,
};

window.T = T;
WANDR.T = T;
