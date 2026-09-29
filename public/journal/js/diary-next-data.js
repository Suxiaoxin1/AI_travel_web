/* ================================================================
 * 探途 WANDR — 新版旅行手帐「风格元数据模块」
 *
 * 用途：为「新版旅游手帐」提供 12 套预设风格的元数据（背景色板、可选
 * 边框、旋转范围、贴纸别名、文字配色），以及贴纸别名(sticker_01..N)
 * → OpenMoji hex 的解析。后续 DeepSeek 排版阶段与渲染器共用本目录，
 * 保证「模型输出别名 → 渲染器找到同一张贴纸」。
 *
 * 坐标/画布约定（与 diary-next-render.js 保持同步）：
 *  - 画布固定 1080(宽) × 1440(高)；
 *  - photo item 的 (x,y,width,height) = 照片画面区【左上角】及尺寸，
 *    边框向画面四周外扩，rotate 以画面中心为轴（度，顺时针为正）；
 *  - decor_stickers 的 (x,y,width,height) = 贴纸图【左上角】及尺寸；
 *  - texts 的 (x,y) = 文本块【左上角】，font_size 字号。
 *
 * 红线：贴纸一律走 OpenMoji 公网 CDN（cdn.jsdelivr.net，CORS 全开，
 * crossOrigin=anonymous，canvas 不被污染）；绝不生成/重绘用户照片。
 * ================================================================ */
(function (global) {
  'use strict';

  const OM_BASE = 'https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji@17.0.0/color/618x618/';
  const CANVAS_W = 1080;
  const CANVAS_H = 1440;

  /* ---------- 12 套预设风格元数据（产品定义，勿随意改） ----------
   * stickers 为风格允许的贴纸别名子集（渲染/提示词使用）；
   * 别名到底指向哪枚 OpenMoji 由下方 POOL 决定。
   */
  const PRESETS = [
    {
      id: 'vintage', name: '复古胶片', icon: '📜',
      desc: '米黄旧纸底 · 拍立得/胶片框 · 复古贴纸 · 棕色手写',
      bg_color_list: ['#F5EFE6', '#EFE3C8', '#D8C9A8'],
      border_types: ['polaroid_white', 'film_border', 'thin_white'],
      rotate_range: [-8, 8],
      sticker_ids: ['sticker_01', 'sticker_02', 'sticker_05', 'sticker_06'],
      text_color_list: ['#6B4423', '#8B5A2B']
    },
    {
      id: 'minimal', name: '简约清新', icon: '⬜',
      desc: '白/浅冷底 · 细白边/无边 · 灰绿小字 · 大量留白',
      bg_color_list: ['#FFFFFF', '#F1F7F2', '#EDF4F7'],
      border_types: ['thin_white', 'none'],
      rotate_range: [-3, 3],
      sticker_ids: ['sticker_03', 'sticker_04', 'sticker_02'],
      text_color_list: ['#445544', '#666666']
    },
    {
      id: 'colorful', name: '多彩活泼', icon: '🌈',
      desc: '马卡龙撞色底 · 彩色圆角框 · 大旋转 · 元气贴纸',
      bg_color_list: ['#FFE8F0', '#FFF4D6', '#E8FFF5'],
      border_types: ['color_frame'],
      rotate_range: [-7, 7],
      sticker_ids: ['sticker_01', 'sticker_03', 'sticker_06'],
      text_color_list: ['#D64870', '#E67E22']
    },
    {
      id: 'dark', name: '暗黑质感', icon: '🌙',
      desc: '深暗底 · 厚白边 · 星星贴纸 · 白字可红强调',
      bg_color_list: ['#121212', '#1B1B1B', '#2B1F1F'],
      border_types: ['thick_white'],
      rotate_range: [-6, 6],
      sticker_ids: ['sticker_01', 'sticker_02'],
      text_color_list: ['#FFFFFF', '#E74C3C']
    },
    {
      id: 'watercolor', name: '水彩手绘', icon: '🎨',
      desc: '浅柔淡彩底 · 柔和白边 · 小花枝叶 · 淡色手写',
      bg_color_list: ['#FAF7F2', '#FCEEF0', '#EEF4FB'],
      border_types: ['soft_white'],
      rotate_range: [-4, 4],
      sticker_ids: ['sticker_04', 'sticker_02'],
      text_color_list: ['#707880']
    },
    {
      id: 'magazine', name: '杂志排版', icon: '📰',
      desc: '白/浅灰底 · 规整矩形框 · 不旋转 · 黑白标题字',
      bg_color_list: ['#FFFFFF', '#F5F5F5'],
      border_types: ['rect_border'],
      rotate_range: [0, 0],
      sticker_ids: ['sticker_03', 'sticker_04'],
      text_color_list: ['#222222']
    },
    ];

  /* 画布全部可用边框类型（渲染器必须逐一实现） */
  const BORDER_TYPES = [
    'none',
    'thin_white',      // 细白边
    'polaroid_white',  // 拍立得（底部留白）
    'film_border',     // 胶片（左右齿孔带）
    'thick_white',     // 厚白边
    'color_frame',     // 彩色圆角框
    'soft_white',      // 柔和白边（圆角+柔光）
    'rect_border'      // 杂志矩形描边框
  ];

  /* ---------- 贴纸别名池 ----------
   * 每套风格一个池：'sticker_01'…'sticker_06' → [openmoji hex, 中文标签]。
   * 风格元数据里出现的别名一定在本池中；渲染时按 JSON 顶层的 style
   * 名称/ID 定位池，定位不到则回退全局默认池。数字 id（旧目录）与裸
   * hex（如 '1F4F7'）也支持，保证与旧 catalog 互通。
   */
  const POOL = {
    vintage: {
      'sticker_01': ['1F4F7', '相机'], 'sticker_02': ['1F39E', '胶片'],
      'sticker_03': ['1F3AB', '票根'], 'sticker_04': ['1F9ED', '指南针'],
      'sticker_05': ['2708', '飞机'],   'sticker_06': ['1F5FA', '地图']
    },
    minimal: {
      'sticker_01': ['1F343', '落叶'], 'sticker_02': ['1F331', '嫩芽'],
      'sticker_03': ['2601', '云朵'],  'sticker_04': ['1F338', '樱花'],
      'sticker_05': ['270F', '铅笔'],  'sticker_06': ['26AA', '白圆点']
    },
    colorful: {
      'sticker_01': ['1F388', '气球'], 'sticker_02': ['1F308', '彩虹'],
      'sticker_03': ['2B50', '星星'],  'sticker_04': ['1F366', '冰淇淋'],
      'sticker_05': ['2728', '闪光'],  'sticker_06': ['1F496', '闪耀心']
    },
    dark: {
      'sticker_01': ['2B50', '星星'],   'sticker_02': ['1F319', '弯月'],
      'sticker_03': ['2B1B', '黑色方块'], 'sticker_04': ['1F303', '星空夜景'],
      'sticker_05': ['1F5A4', '黑心'],  'sticker_06': ['1F306', '城市夜景']
    },
    watercolor: {
      'sticker_01': ['1F338', '樱花'], 'sticker_02': ['1F98B', '蝴蝶'],
      'sticker_03': ['2601', '云朵'],  'sticker_04': ['1F337', '郁金香'],
      'sticker_05': ['1F33C', '花朵'], 'sticker_06': ['270F', '铅笔']
    },
    magazine: {
      'sticker_01': ['26AB', '黑圆点'], 'sticker_02': ['26AA', '白圆点'],
      'sticker_03': ['1F534', '红圆点'], 'sticker_04': ['2B1B', '黑色方块'],
      'sticker_05': ['1F536', '菱形'],  'sticker_06': ['1F4CD', '图钉']
    },
    // 全局默认池（自定义描述/无风格时兜底）
    _default: {
      'sticker_01': ['1F4F7', '相机'], 'sticker_02': ['1F39E', '胶片'],
      'sticker_03': ['2708', '飞机'],  'sticker_04': ['1F338', '樱花'],
      'sticker_05': ['2B50', '星星'],  'sticker_06': ['2764', '红心']
    }
  };

  /* ---------- 工具 ---------- */

  // 优先用旧目录的标签（label 与 hex 一一对应）
  const LABEL_BY_HEX = {};
  const _old = global.DIARY_DATA;
  if (_old && Array.isArray(_old.STICKERS)) {
    _old.STICKERS.forEach(function (s) {
      if (s && s.hex) LABEL_BY_HEX[s.hex] = s.label || '';
    });
  }

  const PRESET_BY_ID = {};
  const PRESET_BY_NAME = {};
  PRESETS.forEach(function (p) {
    PRESET_BY_ID[p.id] = p;
    PRESET_BY_NAME[p.name] = p;
  });

  function lookupPreset(styleKey) {
    if (!styleKey) return null;
    const k = String(styleKey).trim();
    return PRESET_BY_ID[k] || PRESET_BY_NAME[k] || null;
  }

  // 别名 id → [hex, label]；styleKey 命中风格池优先，否则全局默认池
  function aliasInfo(styleKey, aliasKey) {
    const preset = lookupPreset(styleKey);
    const pool = (preset && POOL[preset.id]) || POOL._default;
    const hit = pool[aliasKey] || POOL._default[aliasKey];
    if (!hit) return null;
    const label = LABEL_BY_HEX[hit[0]] || hit[1] || '';
    return { hex: hit[0], label: label, alias: aliasKey };
  }

  /**
   * 解析任意贴纸引用 → OpenMoji hex（小写字母统一大写）
   * 支持：
   *  - 别名 'sticker_01'（按风格池 + 全局兜底）
   *  - 数字 id（旧 DIARY_DATA 目录，1..113）
   *  - 裸 hex '1F4F7' / '1f4f7'
   */
  function resolveStickerHex(styleKey, stickerKey) {
    if (stickerKey == null) return null;
    const s = String(stickerKey).trim();

    const m = s.match(/^sticker_(\d+)$/i);
    if (m) {
      const info = aliasInfo(styleKey, 'sticker_' + m[1]);
      return info ? info.hex : null;
    }
    if (/^[0-9a-fA-F]{3,6}$/.test(s)) {
      // 可能是旧目录数字 id（纯数字且 ≤ 目录长度）
      if (/^\d+$/.test(s)) {
        const old = global.DIARY_DATA;
        if (old && old.STICKER_BY_ID && old.STICKER_BY_ID[s]) {
          return old.STICKER_BY_ID[s].hex || null;
        }
        return null;
      }
      return s.toUpperCase(); // 裸 hex
    }
    // 宽松：旧目录 id 字符串如 '3' 已在上面覆盖
    return null;
  }

  function stickerUrl(styleKey, stickerKey) {
    const hex = resolveStickerHex(styleKey, stickerKey);
    return hex ? OM_BASE + hex + '.png' : null;
  }

  // 复古贴纸库的本地底座：贴纸透明 PNG 已放在 journal/assets/stickers/<style>/ 下（离线，无 CORS/公网依赖）
  function libraryBase(styleKey) {
    const dir = String(styleKey || '').trim();
    return '/journal/assets/stickers/' + dir + '/';
  }

  // 供后续 DeepSeek 提示词使用的贴纸候选（别名 + 标签），默认 6 项起
  function stickerOptionsForPrompt(styleKey) {
    const preset = lookupPreset(styleKey);
    const ids = (preset && Array.isArray(preset.sticker_ids) && preset.sticker_ids.length)
      ? preset.sticker_ids.slice()
      : Object.keys(POOL._default);
    const seen = {};
    const out = [];
    ids.forEach(function (alias) {
      if (seen[alias]) return;
      seen[alias] = 1;
      const info = aliasInfo(styleKey, alias);
      if (info) out.push({ id: alias, label: info.label, hex: info.hex });
    });
    return out;
  }

  global.DIARY_NEXT_DATA = {
    CANVAS_W: CANVAS_W,
    CANVAS_H: CANVAS_H,
    OM_BASE: OM_BASE,
    PRESETS: PRESETS,
    BORDER_TYPES: BORDER_TYPES,
    PRESET_BY_ID: PRESET_BY_ID,
    PRESET_BY_NAME: PRESET_BY_NAME,
    lookupPreset: lookupPreset,
    aliasInfo: aliasInfo,
    resolveStickerHex: resolveStickerHex,
    stickerUrl: stickerUrl,
    libraryBase: libraryBase,
    stickerOptionsForPrompt: stickerOptionsForPrompt
  };
})(window);