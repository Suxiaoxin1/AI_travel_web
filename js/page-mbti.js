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

  // ★ 持久化到 sessionStorage，支持跨页面恢复
  saveMbtiResultToStorage(type, data.name, data);

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

  // ★ 持久化到 sessionStorage，支持跨页面恢复
  saveMbtiResultToStorage(type, data.name, data);

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
  // 清除 sessionStorage 存储的旧结果
  clearMbtiResultFromStorage();
}

function goToPlanning() {
  // ★ 将完整 MBTI 数据存入 sessionStorage，供 AI 规划页读取
  if (window._mbtiType && window._mbtiData) {
    saveMbtiResultToStorage(window._mbtiType, window._mbtiName, window._mbtiData);
  }
  // 跳转时带上 mbtiType 作为 URL 参数，作为备用信号
  const typeParam = window._mbtiType ? `?mbtiType=${encodeURIComponent(window._mbtiType)}` : '';
  window.location.href = `ai-plan.html${typeParam}`;
}

/**
 * 轻量导航：跳转到 navigate.html 并传参目的地
 * （该函数定义在此是为了避免加载完整的 page-navigate.js 及 Leaflet）
 */
function navigateTo(dest) {
  if (!dest) return;
  const encoded = encodeURIComponent(dest);
  window.location.href = `navigate.html?dest=${encoded}`;
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

/* ============================================================
   sessionStorage 持久化 —— 解决跨页面丢失结果的问题
   ============================================================ */

const STORAGE_KEY = 'wandr_mbti_result';

/**
 * 存储 MBTI 结果到 sessionStorage
 */
function saveMbtiResultToStorage(type, name, data) {
  try {
    const payload = {
      type,
      name,
      desc: data.desc || '',
      travelStyles: (data.travelStyles || []).map(s => ({ icon: s.icon || 'fa-compass', text: s.text || '' })),
      destinations: (data.destinations || []).map(d => ({
        name: d.name || '',
        img: d.img || '',
        why: d.why || '',
        match: d.match || '90%',
      })),
      tips: data.tips || [],
      color: data.color || '#5882C1',
      savedAt: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('[MBTI] sessionStorage 写入失败:', e);
  }
}

/**
 * 从 sessionStorage 读取 MBTI 结果
 */
function loadMbtiResultFromStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * 清除 sessionStorage 中的 MBTI 结果
 */
function clearMbtiResultFromStorage() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
}

/**
 * 页面加载时检查 sessionStorage，有结果则自动恢复显示
 */
function restoreMbtiResultIfExists() {
  const saved = loadMbtiResultFromStorage();
  if (!saved || !saved.type) return false;

  // 恢复全局状态
  window._mbtiType = saved.type;
  window._mbtiName = saved.name;
  window._mbtiData = saved;

  // 隐藏入口+问卷，显示结果区
  dom('mbtiEntry').style.display = 'none';
  dom('mbtiQuiz').style.display = 'none';
  const resultEl = dom('mbtiResult');
  resultEl.style.display = 'block';

  const innerEl = resultEl.querySelector('.mbti-result-inner');
  if (!innerEl) return false;

  const type = saved.type;
  const data = saved;

  // ===== 渲染结果（复用渲染逻辑） =====
  const dimNames = { E:'外向', I:'内向', S:'感觉', N:'直觉', T:'思考', F:'情感', J:'计划', P:'随性' };
  const dimPairs = [
    { left: 'E', right: 'I' },
    { left: 'S', right: 'N' },
    { left: 'T', right: 'F' },
    { left: 'J', right: 'P' },
  ];

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

  const styleTags = data.travelStyles.map(s => `
    <div class="style-tag"><i class="fa-solid ${s.icon}"></i><span>${s.text}</span></div>
  `).join('');

  const destCards = data.destinations.map(d => `
    <div class="mbti-dest-card" data-action="navigateTo" data-dest="${d.name.split('·')[0]}">
      <img src="${d.img}" alt="${d.name}">
      <span class="mbti-dest-match">${d.match} 匹配</span>
      <div class="mbti-dest-card-info">
        <div class="mbti-dest-card-name">${d.name}</div>
        <div class="mbti-dest-card-why">${d.why}</div>
      </div>
    </div>`).join('');

  const tipsList = data.tips.map(t => `<li>${t}</li>`).join('');

  innerEl.innerHTML = `
    <div class="mbti-result-header">
      <div class="mbti-type-badge" id="mbtiTypeBadge">
        <span class="type-code" id="mbtiTypeCode">${type}</span>
        <span class="type-name" id="mbtiTypeName">${data.name}</span>
        <span class="mbti-ai-badge" style="display:none"><i class="fa-solid fa-sparkles"></i> 已恢复</span>
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

  return true;
}

// 页面加载时尝试恢复 MBTI 结果
document.addEventListener('DOMContentLoaded', () => {
  restoreMbtiResultIfExists();
});
