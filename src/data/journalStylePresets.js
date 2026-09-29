/**
 * 手账风格配置表：版式类型 + 装饰语言。
 * createDefaultLayout / 画布 class 都读这里，避免六种风格只换底色。
 */

export const JOURNAL_STYLE_PRESETS = {
  retro: {
    label: '复古胶片',
    layoutMode: 'scattered',
    frame: 'polaroid',
    showTape: true,
    paper: {
      base: '#E8D4B0',
      texture: '/images/journal-styles/bg-retro.svg?v=2',
      hint: '胶片齿孔 · 牛皮纸渍',
    },
    titleColor: '#2D5B62',
    noteColor: '#5C634F',
    titleSize: 36,
    noteSize: 13,
    rotationAmp: 3.2,
    photoJitter: 14,
    copyTone: {
      voice: '温暖怀旧，像胶片旁注，短句有余韵',
      diaryHint: '用胶片感、旧时光口吻写，少用网络流行语；标题偏诗意但不空洞',
      fallbackTitles: ['胶片里的那天', '暖色旅途', '旧时光一页'],
      fallbackIntros: ['光影偏暖，脚步也慢下来。', '把那天的温度，收进纸页里。'],
      fallbackCaptions: ['风刚好路过', '光影刚刚好', '想再看一眼', '慢慢收藏起来', '心口微微发暖'],
      fallbackHighlight: '胶片记忆',
    },
    caption: {
      variant: 'note',
      maxChars: 10,
      corners: ['bc', 'br', 'bl', 'bc', 'tr'],
      rotations: [-3, 4, -2, 5, -4],
    },
    photoShape: {
      shape: 'polaroid',
      clip: 'torn',
      fit: 'cover',
      ratio: '4/5',
      ratioPool: ['4/5', '1/1', '4/5', '3/4', '1/1'],
      positionPool: ['50% 38%', '45% 55%', '55% 42%', '50% 60%', '40% 45%'],
      heroRatio: '4/5',
      heroPosition: '50% 36%',
    },
    decorations: [
      { type: 'tape', style: 'paper', x: 140, y: 260, scale: 1.9, rotation: -14 },
      { type: 'tape', style: 'washi', x: 720, y: 520, scale: 1.6, rotation: 10 },
      { type: 'sticker', style: 'spark', symbol: '✦', x: 860, y: 170, scale: 1, rotation: 16 },
      { type: 'sticker', style: 'flower', symbol: '✿', x: 480, y: 1180, scale: 1, rotation: -12 },
    ],
  },
  clean: {
    label: '简约清新',
    layoutMode: 'grid',
    frame: 'rect',
    showTape: false,
    paper: {
      base: '#F4F7F4',
      texture: '/images/journal-styles/bg-clean.svg?v=4',
      hint: '活页孔 · 横线便签',
    },
    titleColor: '#315D55',
    noteColor: '#4F6B63',
    titleSize: 34,
    noteSize: 13,
    rotationAmp: 0,
    photoJitter: 0,
    copyTone: {
      voice: '干净克制，像清爽便签，少形容词堆砌',
      diaryHint: '语句简短清楚，留白感强；避免煽情和过多比喻',
      fallbackTitles: ['清风一程', '留白的旅行', '轻装出发'],
      fallbackIntros: ['少一点喧闹，多一点看清。', '把行程写得干净，也把心情留白。'],
      fallbackCaptions: ['一眼就记住', '空气很干净', '停一下也好', '路径很清楚', '今天刚刚好'],
      fallbackHighlight: '清爽记录',
    },
    caption: {
      variant: 'tag',
      maxChars: 8,
      corners: ['bl', 'br', 'bl', 'br'],
      rotations: [0, 0, 0, 0],
      // 每隔一张隐藏，避免贴满
      hideEvery: 3,
    },
    photoShape: {
      shape: 'rect',
      clip: null,
      fit: 'cover',
      ratio: '1/1',
      ratioPool: ['1/1', '1/1', '4/5', '1/1', '1/1'],
      positionPool: ['50% 50%', '50% 50%', '50% 48%', '50% 50%', '50% 52%'],
      heroRatio: '4/5',
      heroPosition: '50% 45%',
    },
    decorations: [
      { type: 'line', style: 'dotted', symbol: '···', x: 780, y: 210, scale: 1, rotation: 0 },
    ],
  },
  vivid: {
    label: '多彩活泼',
    layoutMode: 'bubble',
    frame: 'rounded',
    showTape: true,
    paper: {
      base: '#FFE8D6',
      texture: '/images/journal-styles/bg-vivid.svg?v=3',
      hint: '和纸胶带 · 彩色纸屑',
    },
    titleColor: '#B34832',
    noteColor: '#8A4B3A',
    titleSize: 36,
    noteSize: 13,
    rotationAmp: 4.5,
    photoJitter: 18,
    copyTone: {
      voice: '活泼跳脱，像贴纸旁注，口语但有画面',
      diaryHint: '节奏轻快，可带一点感叹；避免沉重抒情',
      fallbackTitles: ['彩色打卡日', '今日好热闹', '开心暴击'],
      fallbackIntros: ['颜色先到，快乐紧随其后。', '这一天像贴纸一样贴满了开心。'],
      fallbackCaptions: ['太好玩了', '阳光超准时', '打卡成功', '气氛拉满', '再来一张'],
      fallbackHighlight: '快乐瞬间',
    },
    caption: {
      variant: 'bubble',
      maxChars: 6,
      corners: ['tr', 'bl', 'br', 'tl', 'br'],
      rotations: [-6, 5, -4, 7, -3],
    },
    photoShape: {
      shape: 'rounded',
      clip: null,
      fit: 'cover',
      ratio: '4/5',
      ratioPool: ['4/5', '1/1', '3/4', '1/1', '4/5'],
      // 第 3 张接近 pill
      shapePool: ['rounded', 'rounded', 'pill', 'rounded', 'rounded'],
      positionPool: ['30% 40%', '70% 55%', '50% 30%', '40% 65%', '60% 45%'],
      heroRatio: '3/4',
      heroPosition: '50% 32%',
    },
    decorations: [
      { type: 'tape', style: 'stripe', x: 160, y: 300, scale: 1.7, rotation: -18 },
      { type: 'tape', style: 'washi', x: 760, y: 640, scale: 1.5, rotation: 12 },
      { type: 'sticker', style: 'heart', symbol: '💗', x: 860, y: 200, scale: 1.05, rotation: 8 },
      { type: 'sticker', style: 'sun', symbol: '☀️', x: 120, y: 1100, scale: 1.05, rotation: -6 },
      { type: 'sticker', style: 'spark', symbol: '✨', x: 520, y: 1240, scale: 0.95, rotation: 20 },
    ],
  },
  dark: {
    label: '暗黑质感',
    layoutMode: 'stack',
    frame: 'thin',
    showTape: true,
    paper: {
      base: '#1A2428',
      texture: '/images/journal-styles/bg-dark.svg?v=3',
      hint: '金线框 · 皮革底',
    },
    titleColor: '#F3D18B',
    noteColor: '#D6C9B0',
    titleSize: 34,
    noteSize: 13,
    rotationAmp: 0.6,
    photoJitter: 4,
    copyTone: {
      voice: '沉静克制，像夜间笔记，留一点金属冷感',
      diaryHint: '语气冷静、质感强；少用可爱语气词，可写光影与距离感',
      fallbackTitles: ['夜色里的城', '低光旅行', '影子与路径'],
      fallbackIntros: ['灯光压低，故事反而清楚。', '把喧闹收进暗处，只留下轮廓。'],
      fallbackCaptions: ['低光很好看', '轮廓刚好', '安静一点', '夜色收紧', '远处有声'],
      fallbackHighlight: '质感瞬间',
    },
    caption: {
      variant: 'bar',
      maxChars: 8,
      corners: ['br', 'bl', 'br', 'bl'],
      rotations: [0, 0, -1, 1],
    },
    photoShape: {
      shape: 'rect',
      clip: null,
      fit: 'cover',
      ratio: '3/4',
      ratioPool: ['3/4', '3/4', '4/5', '3/4', '1/1'],
      positionPool: ['50% 62%', '48% 58%', '52% 65%', '50% 55%', '45% 60%'],
      heroRatio: '3/4',
      heroPosition: '50% 58%',
    },
    decorations: [
      { type: 'line', style: 'brush', symbol: '—', x: 820, y: 240, scale: 1.2, rotation: 0 },
      { type: 'tape', style: 'grid', x: 180, y: 980, scale: 1.4, rotation: -4 },
    ],
  },
  watercolor: {
    label: '水彩手绘',
    layoutMode: 'soft',
    frame: 'soft',
    showTape: true,
    paper: {
      base: '#EEF4EF',
      texture: '/images/journal-styles/bg-watercolor.svg?v=2',
      hint: '淡彩晕染 · 毛边纸',
    },
    titleColor: '#477C71',
    noteColor: '#5A7A70',
    titleSize: 36,
    noteSize: 13,
    rotationAmp: 2.2,
    photoJitter: 10,
    copyTone: {
      voice: '柔和手绘感，像淡彩日记，轻声细语',
      diaryHint: '柔和、流动，可带一点水彩意象；避免硬朗口号',
      fallbackTitles: ['淡彩旅行页', '水色日记', '慢慢晕开的路'],
      fallbackIntros: ['颜色轻轻晕开，心情也跟着软下来。', '把风景画成一页柔和的日记。'],
      fallbackCaptions: ['颜色在呼吸', '轻轻停一下', '风里有水汽', '软软的光', '慢慢走就好'],
      fallbackHighlight: '柔和一幕',
    },
    caption: {
      variant: 'soft',
      maxChars: 10,
      corners: ['br', 'tl', 'bl', 'tr', 'br'],
      rotations: [-5, 4, -3, 6, -2],
    },
    photoShape: {
      shape: 'soft',
      clip: 'soft-wave',
      fit: 'cover',
      ratio: '4/5',
      ratioPool: ['4/5', '1/1', '4/5', '3/4', '4/5'],
      positionPool: ['50% 42%', '42% 50%', '58% 38%', '48% 55%', '52% 45%'],
      heroRatio: '4/5',
      heroPosition: '50% 40%',
    },
    decorations: [
      { type: 'sticker', style: 'flower', symbol: '🌸', x: 850, y: 190, scale: 1.05, rotation: 12 },
      { type: 'tape', style: 'washi', x: 200, y: 340, scale: 1.5, rotation: -8 },
      { type: 'line', style: 'wave', symbol: '〰', x: 700, y: 1120, scale: 1, rotation: -4 },
    ],
  },
  magazine: {
    label: '杂志排版',
    layoutMode: 'magazine',
    frame: 'editorial',
    showTape: false,
    paper: {
      base: '#E6E2D8',
      texture: '/images/journal-styles/bg-magazine.svg?v=3',
      hint: '新闻纸 · 裁切角',
    },
    titleColor: '#2D3835',
    noteColor: '#4A5552',
    titleSize: 38,
    noteSize: 12,
    rotationAmp: 0,
    photoJitter: 0,
    copyTone: {
      voice: '编辑部口吻，像旅行杂志短栏，信息清晰',
      diaryHint: '标题更像杂志栏目名；正文干脆有观点，少抒情堆砌',
      fallbackTitles: ['城市速写', '今日封面故事', '旅行编辑页'],
      fallbackIntros: ['主图先说话，文字只做注释。', '把一天裁成一页可读的版面。'],
      fallbackCaptions: ['封面主图', '侧栏细节', '现场纪实', '构图到位', '值得留版'],
      fallbackHighlight: '封面瞬间',
    },
    caption: {
      variant: 'editorial',
      maxChars: 4,
      corners: ['tl', 'tr', 'tl', 'br'],
      rotations: [0, 0, 0, 0],
      hideHero: true,
    },
    photoShape: {
      shape: 'bleed',
      clip: null,
      fit: 'cover',
      ratio: '1/1',
      ratioPool: ['1/1', '1/1', '3/4', '1/1', '1/1'],
      positionPool: ['50% 50%', '50% 48%', '50% 52%', '48% 50%', '52% 50%'],
      heroRatio: '3/4',
      heroPosition: '50% 35%',
      heroFit: 'cover',
    },
    decorations: [
      { type: 'line', style: 'arrow', symbol: '→', x: 860, y: 220, scale: 1, rotation: 0 },
    ],
  },
}

export function getStylePreset(style) {
  return JOURNAL_STYLE_PRESETS[style] || JOURNAL_STYLE_PRESETS.retro
}

/** 按风格生成照片默认位移/旋转（叠在 CSS grid 之上） */
export function buildPhotoTransform(index, style = 'retro') {
  const preset = getStylePreset(style)
  const amp = Number(preset.rotationAmp) || 0
  const jitter = Number(preset.photoJitter) || 0
  if (!amp && !jitter) {
    return { x: 0, y: 0, scale: 1, rotation: 0 }
  }
  const ox = ((index * 17) % 7 - 3) * (jitter / 3)
  const oy = ((index * 13) % 5 - 2) * (jitter / 3)
  const rot = (index % 2 ? 1 : -1) * (0.5 + (index % 3) * 0.55) * Math.max(amp / 2.2, 0)
  return {
    x: Math.round(ox),
    y: Math.round(oy),
    scale: 1,
    rotation: Math.round(rot * 10) / 10,
  }
}

export function buildStyleDecorations(style = 'retro') {
  const preset = getStylePreset(style)
  return (preset.decorations || []).map((item, index) => ({
    id: `style-deco-${style}-${index}`,
    type: item.type,
    style: item.style || 'default',
    symbol: item.symbol,
    x: item.x || 0,
    y: item.y || 0,
    scale: item.scale || 1,
    rotation: item.rotation || 0,
    zIndex: 8 + index,
  }))
}

const DEFAULT_CAPTION = {
  variant: 'note',
  maxChars: 10,
  corners: ['br'],
  rotations: [0],
}

/**
 * 按风格 + 照片序号生成旁注呈现：形态 / 角位 / 旋转 / 是否隐藏。
 * @param {number} index 展示序号（0-based，displayPhotos 中的顺序）
 * @param {string} style
 * @param {{ role?: string }} [opts]
 */
export function buildCaptionPresentation(index, style = 'retro', opts = {}) {
  const preset = getStylePreset(style)
  const cap = { ...DEFAULT_CAPTION, ...(preset.caption || {}) }
  const role = String(opts.role || '').toLowerCase()
  const corners = cap.corners?.length ? cap.corners : DEFAULT_CAPTION.corners
  const rotations = cap.rotations?.length ? cap.rotations : DEFAULT_CAPTION.rotations

  let hidden = false
  if (cap.hideHero && (role === 'hero' || role === '主图')) hidden = true
  if (Number(cap.hideEvery) > 1 && (index + 1) % Number(cap.hideEvery) === 0) hidden = true

  return {
    hidden,
    variant: cap.variant || 'note',
    corner: corners[index % corners.length] || 'br',
    rotation: Number(rotations[index % rotations.length]) || 0,
    maxChars: Number(cap.maxChars) || 10,
  }
}

export function clipCaptionText(text, maxChars = 10) {
  const value = String(text || '').replace(/\s+/g, ' ').trim()
  if (!value) return ''
  const limit = Math.max(2, Number(maxChars) || 10)
  return value.length > limit ? value.slice(0, limit) : value
}

const DEFAULT_PHOTO_SHAPE = {
  shape: 'rect',
  clip: null,
  fit: 'cover',
  ratio: 'auto',
  positionPool: ['50% 50%'],
}

const RATIO_CSS = {
  auto: '',
  '1/1': '1 / 1',
  '4/5': '4 / 5',
  '3/4': '3 / 4',
  '16/9': '16 / 9',
}

/**
 * 按风格生成照片形状 / 裁切呈现（object-fit + position + aspect-ratio + clip）。
 * @param {number} index 展示序号（0-based）
 * @param {string} style
 * @param {{ role?: string, orientation?: string }} [opts]
 */
export function buildPhotoShapeMeta(index, style = 'retro', opts = {}) {
  const preset = getStylePreset(style)
  const cfg = { ...DEFAULT_PHOTO_SHAPE, ...(preset.photoShape || {}) }
  const role = String(opts.role || '').toLowerCase()
  const isHero = role === 'hero' || role === '主图'
  const orientation = String(opts.orientation || '').toLowerCase()

  const shapePool = cfg.shapePool?.length ? cfg.shapePool : null
  const shape = shapePool
    ? (shapePool[index % shapePool.length] || cfg.shape)
    : cfg.shape

  const ratioPool = cfg.ratioPool?.length ? cfg.ratioPool : [cfg.ratio || 'auto']
  let ratioKey = isHero && cfg.heroRatio
    ? cfg.heroRatio
    : (ratioPool[index % ratioPool.length] || cfg.ratio || 'auto')

  // 竖图优先落到竖比例槽（无 hero 覆盖时）
  if (!isHero && (orientation === 'portrait' || orientation === 'vertical')) {
    if (!String(ratioKey).includes('4') && ratioKey !== '3/4') ratioKey = '3/4'
  }

  const positionPool = cfg.positionPool?.length ? cfg.positionPool : DEFAULT_PHOTO_SHAPE.positionPool
  const position = isHero && cfg.heroPosition
    ? cfg.heroPosition
    : (positionPool[index % positionPool.length] || '50% 50%')

  const fit = isHero && cfg.heroFit
    ? cfg.heroFit
    : (cfg.fit || 'cover')

  const clip = cfg.clip || null
  const aspectRatio = RATIO_CSS[ratioKey] || (ratioKey === 'auto' ? '' : String(ratioKey).replace('/', ' / '))

  return {
    shape: shape || 'rect',
    clip,
    fit,
    position,
    ratioKey,
    aspectRatio,
    isHero,
  }
}


