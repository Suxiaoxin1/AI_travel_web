"""旅行手帐 v3「排版 JSON」服务（Python 移植自 diary-layout-next.js）。

职责：根据预设风格 + 自定义描述，调用 DeepSeek 只输出 1080×1440 扁平排版 JSON。
"""
from __future__ import annotations

import json
import logging
import math
import re
from typing import Any

import httpx

logger = logging.getLogger(__name__)

CANVAS_W = 1080
CANVAS_H = 1440

PRESETS: list[dict[str, Any]] = [
    {
        "id": "vintage",
        "name": "复古胶片",
        "bg_color_list": ["#F5EFE6", "#EFE3C8", "#D8C9A8", "#E8D7B8"],
        "border_types": ["polaroid_white", "film_border", "thin_white"],
        "rotate_range": [-9, 9],
        "sticker_ids": ["sticker_01", "sticker_02", "sticker_05", "sticker_06"],
        "text_color_list": ["#6B4423", "#8B5A2B", "#5C2E0F"],
        "guide": (
            "布局 staggered 或 diagonal_line。米黄/旧纸底色，照片用拍立得+胶片边框混合，"
            "必须互相重叠 15~30%、rotate 差异明显；推荐 1~2 张拍立得带 caption 文字（年份/季节）。"
            "胶带用 washi_pink / 焦糖橙横贴；图钉红/黄。贴纸 4~6 枚（相机/胶片/飞机/地图）；"
            "涂鸦 2~4 个（underline/arrow/heart）。文字 3~4 条：1 条主标题 font_size 80~100 + 2~3 条手写短注释。"
        ),
    },
    {
        "id": "minimal",
        "name": "简约清新",
        "bg_color_list": ["#5B6A4B", "#586848", "#4F5C42", "#6B785C"],
        "border_types": ["thin_white", "none"],
        "rotate_range": [-6, 6],
        "sticker_ids": ["sticker_04", "sticker_02"],
        "text_color_list": ["#F5F2E6", "#FFFFFF", "#DCE6CF", "#EAE4D3"],
        "guide": (
            "布局 cluster_organic 或 staggered（5~7 张错落分布、四周留白 ≥35%，不要排成规整网格）。"
            "**背景必须是灰墨绿毡布底色**（从 #5B6A4B / #586848 / #4F5C42 里挑），安静克制。"
            "边框用 thin_white 细白边或 none，照片 rotate -6~6° 轻微错落、互相重叠 ≤8%。"
            "胶带 0~1 条（米白/浅绿）、图钉 0~1、涂鸦 0~1、decor_stickers 0~1 枚（越小越好，实物贴纸由前端另贴）。"
            "文字 2~3 条**浅色手写体**（font=hand）：颜色用 #F5F2E6/#FFFFFF/#DCE6CF 这类奶油白；"
            "1 条 8~16 字小标题 font_size 30~40 + 1~2 条 5~12 字短注释 font_size 20~26；"
            "内容必须结合用户提供的地点/日期/心情写实，不要用占位词。整体像一页\"墨绿底的留白手帐\"。"
        ),
    },
    {
        "id": "colorful",
        "name": "多彩活泼",
        "bg_color_list": ["#D4DFC9", "#F3D6D4", "#F7EDCB", "#4275A4"],
        "border_types": ["thin_white"],
        "rotate_range": [-10, 10],
        "sticker_ids": ["sticker_01", "sticker_03", "sticker_06"],
        "text_color_list": ["#3F5A3C", "#8A4550", "#8A6A24", "#5C7A55", "#A8606A"],
        "text_lang": "en",
        "guide": (
            "布局 staggered 散落 + 大面积留白（≥35%）。照片**大小不一**：挑 1~2 张放大当主角、其余小一号"
            "（照片越多差异越明显），互相重叠 8~20%、rotate 差异中等（叠多了显乱）。"
            "**所有照片边框统一 thin_white（白色细边框），不要 color_frame / thick_white / 彩色框**"
            "（前端还会强制覆盖成白细边）。**背景实际由前端从 4 套 pastel（雾蓝/薄荷绿/藕粉/奶油黄）"
            "随机选一套覆盖**，你只要给一张浅色底当 fallback 即可，不要用深色 / 渐变 / 网格。"
            "**胶带**也由前端按主题色权重新生成（tapes 输出空数组或干脆不输出即可）。"
            "留白要够（照片越多留白越大），供前端贴 5~11 枚大小不一的实物贴纸 + 2~4 条飘落胶带。"
            "图钉 0~1 枚。贴纸 0~1 枚（其余由前端贴实物）。文字 3~4 条手写体（font=hand，颜色给浅一点的 fallback，"
            "深色也行，前端会按主题改色）。整体元气满满但不拥挤。"
        ),
    },
    {
        "id": "dark",
        "name": "暗黑质感",
        "bg_color_list": ["#121212", "#1B1B1B", "#2B1F1F", "#0F0F1E"],
        "border_types": ["thick_white", "rect_border"],
        "rotate_range": [-5, 5],
        "sticker_ids": ["sticker_01", "sticker_02", "sticker_05"],
        "text_color_list": ["#FFFFFF", "#E74C3C", "#FFD700", "#00F0FF"],
        "guide": (
            "布局 hero_center：1 张主图占中央偏上 60~70% 面积 + 2~3 张小图散布下方/侧边。"
            "照片厚白边或双线框；旋转小、布局规整但不死板。胶带 0~1、图钉 0~1 枚银色。"
            "贴纸 1~3 枚（星星/弯月/闪光）。涂鸦 1~2 个（underline/arrow/circle 红色）。"
            "文字 2~3 条：1 条主标题白色 90~110 + 1~2 条短注释白色或红色 24~30px。电影感。"
        ),
    },
    {
        "id": "watercolor",
        "name": "水彩手绘",
        "bg_color_list": ["#FAF7F2", "#FCEEF0", "#EEF4FB", "#F4F0E6"],
        "border_types": ["soft_white", "thin_white"],
        "rotate_range": [-5, 5],
        "sticker_ids": ["sticker_04", "sticker_02", "sticker_03"],
        "text_color_list": ["#707880", "#A88B5F", "#9C7B6B"],
        "guide": (
            "布局 cluster_organic 或 staggered。照片柔和白边，旋转小、错落而不堆叠。"
            "胶带 1~2 条淡彩半透明（粉/蓝/米），图钉 0~1。贴纸 2~4 枚淡彩（樱花/蝴蝶/郁金香/花朵）。"
            "涂鸦 2~3 个（scribble/heart/swirl 淡色细线）。文字 3~4 条淡灰/淡棕手写体 26~36px，font=hand 温柔纤细。"
        ),
    },
    {
        "id": "magazine",
        "name": "杂志排版",
        "bg_color_list": ["#F2EFE6", "#EDE8DC", "#E8E4D8", "#F5F2EA", "#E9E6DE"],
        "border_types": ["rect_border"],
        "rotate_range": [-1.2, 1.2],
        "sticker_ids": ["sticker_03", "sticker_04", "sticker_02", "sticker_01", "sticker_05", "sticker_06"],
        "text_color_list": ["#222222", "#1A1A1A", "#C8281C", "#5A5148"],
        "guide": (
            "编辑式杂志排版：在硬朗网格基础上做出层次，不要空白得像没排完。"
            "布局 grid_2x2 或 grid_3，border=rect_border 保持不变。"
            "照片允许 rotate 在 -1.2~1.2 微旋转（让画面不死板），同栏照片允许 ±8px 错位，"
            "栏与栏可高低差（配页式），但禁止 2×2 等距对齐。"
            "背景取新闻纸/牛皮纸暖灰，禁止纯白 #FFFFFF（会显得单薄）。"
            "贴纸 3~6 枚（黑方块/红圆点/白圆点/菱形/图钉等几何），要分布到栏间空隙与页面四角，"
            "不能只挤在角落。胶带 1~2 条细的（宽 60~120，压在照片窄边做分区）。"
            "涂鸦 1~3 个细线条（arrow / underline），只做视线引导，别用圆胖涂鸦。"
            "文字 2~4 条：1 条大字标题（VOL.01 秋日特辑）font_size 100~140 + 1~2 条副标题/页码注解。"
            "留白 12%~25%，让栏与栏之间有内容，但整体仍是规整的编辑版式。"
        ),
    },
]

STICKER_POOL: dict[str, dict[str, list[str]]] = {
    "vintage": {
        "sticker_01": ["1F4F7", "相机"],
        "sticker_02": ["1F39E", "胶片"],
        "sticker_03": ["1F3AB", "票根"],
        "sticker_04": ["1F9ED", "指南针"],
        "sticker_05": ["2708", "飞机"],
        "sticker_06": ["1F5FA", "地图"],
    },
    "minimal": {
        "sticker_01": ["1F343", "落叶"],
        "sticker_02": ["1F331", "嫩芽"],
        "sticker_03": ["2601", "云朵"],
        "sticker_04": ["1F338", "樱花"],
        "sticker_05": ["270F", "铅笔"],
        "sticker_06": ["26AA", "白圆点"],
    },
    "colorful": {
        "sticker_01": ["1F388", "气球"],
        "sticker_02": ["1F308", "彩虹"],
        "sticker_03": ["2B50", "星星"],
        "sticker_04": ["1F366", "冰淇淋"],
        "sticker_05": ["2728", "闪光"],
        "sticker_06": ["1F496", "闪耀心"],
    },
    "dark": {
        "sticker_01": ["2B50", "星星"],
        "sticker_02": ["1F319", "弯月"],
        "sticker_03": ["2B1B", "黑色方块"],
        "sticker_04": ["1F303", "星空夜景"],
        "sticker_05": ["1F5A4", "黑心"],
        "sticker_06": ["1F306", "城市夜景"],
    },
    "watercolor": {
        "sticker_01": ["1F338", "樱花"],
        "sticker_02": ["1F98B", "蝴蝶"],
        "sticker_03": ["2601", "云朵"],
        "sticker_04": ["1F337", "郁金香"],
        "sticker_05": ["1F33C", "花朵"],
        "sticker_06": ["270F", "铅笔"],
    },
    "magazine": {
        "sticker_01": ["26AB", "黑圆点"],
        "sticker_02": ["26AA", "白圆点"],
        "sticker_03": ["1F534", "红圆点"],
        "sticker_04": ["2B1B", "黑色方块"],
        "sticker_05": ["1F536", "菱形"],
        "sticker_06": ["1F4CD", "图钉"],
    },
    "_default": {
        "sticker_01": ["1F4F7", "相机"],
        "sticker_02": ["1F39E", "胶片"],
        "sticker_03": ["2708", "飞机"],
        "sticker_04": ["1F338", "樱花"],
        "sticker_05": ["2B50", "星星"],
        "sticker_06": ["2764", "红心"],
    },
}

PRESET_BY_ID = {p["id"]: p for p in PRESETS}
PRESET_BY_NAME = {p["name"]: p for p in PRESETS}

BORDER_WHITELIST = frozenset({
    "none", "thin_white", "polaroid_white", "film_border",
    "thick_white", "color_frame", "soft_white", "rect_border",
})

DOODLE_KINDS = frozenset({
    "arrow", "underline", "circle", "heart", "star", "swirl", "scribble", "check",
})

HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")

SCHEMA_V3 = """画布固定 1080(宽) × 1440(高)，原点在左上角，x 向右、y 向下。
只输出一个 JSON 对象（不要 markdown 代码块、不要任何多余文字），结构如下：
{
  "style": "风格名称",
  "style_variation": "本次变体名（2~8字，如：胶片旧时光）",
  "canvas_width": 1080,
  "canvas_height": 1440,
  "bg_color": "#RRGGBB",
  "bg_gradient": { "type":"linear"|"radial", "x":0, "y":0, "w":1080, "h":1440, "angle":180, "from":"#RRGGBB", "to":"#RRGGBB" } | null,
  "layout": "staggered | hero_center | grid_2x2 | grid_3 | cluster_organic | diagonal_line",
  "items": [
    { "photo_index": 0, "x": 数字, "y": 数字, "width": 数字, "height": 数字, "rotate": 数字, "border": "边框类型", "border_color": "#RRGGBB" | null, "caption": "拍立得底部手写文字" | null }
  ],
  "decor_stickers": [
    { "id": "sticker_xx", "x": 数字, "y": 数字, "width": 数字, "height": 数字, "rotate": 数字 }
  ],
  "tapes": [
    { "x": 数字, "y": 数字, "width": 数字, "height": 数字, "rotate": 数字, "color": "#RRGGBB" | "stripe" | "polka" | "washi_pink" | "washi_blue" | "washi_yellow" }
  ],
  "pins": [
    { "x": 数字, "y": 数字, "size": 数字, "color": "#RRGGBB" | "red" | "blue" | "yellow" | "black" | "white" }
  ],
  "doodles": [
    { "kind": "arrow | underline | circle | heart | star | swirl | scribble | check", "x": 数字, "y": 数字, "width": 数字, "height": 数字, "color": "#RRGGBB" | null, "rotate": 数字 }
  ],
  "texts": [
    { "content": "手帐随笔文字", "x": 数字, "y": 数字, "font_size": 数字, "color": "#RRGGBB", "font": "hand | bold | script | print" | null }
  ]
}
坐标锚点与渲染约定：
- items 中 photo 的 (x,y,width,height) = 照片画面区【左上角】及尺寸，边框向画面四周外扩；
  rotate 以画面中心为轴（度，顺时针为正）。
- decor_stickers / tapes / pins / doodles 的 (x,y,width,height) = 元素【左上角】及尺寸。
- texts 的 (x,y) = 文本块【左上角】，font_size 字号；texts 无自动宽度换行，故每条内容必须短（4~20 汉字）。
- 可选扩展字段：items 每项可带 "border_color":"#RRGGBB"（仅 color_frame 边框时用于指定彩色框颜色）；
  若省略则由渲染端按色板循环，不要担心。
规则：
1. items 的数量必须恰好等于照片总数 N；photo_index 取 0..N-1，每个下标必须出现且只出现一次，禁止漏用、重复。
2. 照片 w:h 尽量贴近请求给出的自然宽高比（0.8~1.3 倍），保证只做等比缩放、不做明显裁切。
3. 错位排布（除 magazine 外）：照片【禁止排成整齐网格】，必须错落堆叠、互相轻微重叠
   （覆盖率 10~30%），否则没有手帐感；rotate 必须在风格旋转范围内。
   magazine 例外：允许干净的栏式排版，但同一栏内的照片之间允许 ±1° 微旋转
   与 ±8px 错位，栏与栏允许高低差（配页式），禁止 2×2 等距死板对齐。
4. 画面主体（照片画面区域）应完整在画布内（0≤x，x+width≤1080，0≤y，y+height≤1440）；边框外扩可略微越界。
5. 贴纸 2~8 枚、胶带 0~4 条、图钉 0~3 枚、涂鸦 0~5 个；
   胶带应横贴/斜贴在照片边角、像在「粘」着照片；图钉钉在照片角上；涂鸦放在空隙/边角做点缀。
6. 文字 2~5 条（minimal/magazine 2~3 条、colorful/watercolor 3~5 条、其它 2~3 条）；
   颜色从风格文字色池取；可包含一个主标题（font_size 60~110、bold=true）+ 多个短手帐注释（font_size 22~36、hand）。
7. 元素 id/color 必须从风格候选里取，禁止自创；贴纸 id 用 sticker_xx，胶带 color 可用风格主题色。
8. bg_color 从风格背景色池中取 1 个；如用户描述指定了颜色/底纹，以描述为准。
9. 同一风格不同次生成差异要明显（背景/边框/旋转/贴纸种类/位置/文字内容都要换）。"""


def lookup_preset(style_key: str | None) -> dict[str, Any] | None:
    if not style_key:
        return None
    key = str(style_key).strip()
    return PRESET_BY_ID.get(key) or PRESET_BY_NAME.get(key)


def sticker_candidates(style_key: str | None) -> list[str]:
    preset = lookup_preset(style_key)
    pool = STICKER_POOL.get(preset["id"], STICKER_POOL["_default"]) if preset else STICKER_POOL["_default"]
    ids = (
        list(preset["sticker_ids"])
        if preset and isinstance(preset.get("sticker_ids"), list) and preset["sticker_ids"]
        else list(STICKER_POOL["_default"].keys())
    )
    result: list[str] = []
    for sid in ids:
        hit = pool.get(sid) or STICKER_POOL["_default"].get(sid)
        result.append(f"{sid}({hit[1]})" if hit else sid)
    return result


def build_system_prompt() -> str:
    return f"""你是一位旅行手帐排版架构师，专做小红书式高密度拼贴手帐。你不生成任何图片，只负责输出布局 JSON，照片画面由渲染器原样粘贴用户上传的真实照片（绝不重绘、绝不让 AI 换画面）。

{SCHEMA_V3}

【高密度手帐核心原则 — 必读】
- 「错落 + 重叠 + 多元素」= 手帐味。死板网格 = 失败品。
- 照片必须互相轻微叠加（覆盖率 10~30%）、旋转差异、绝对禁止 2×2 等距对齐。
- 主视觉（最大那张照片）建议占画布宽度 55~70%，其余照片围绕它错落、贴在它边缘或角落。
- 元素密度参考：5~9 张图 + 4~8 枚贴纸 + 1~4 条胶带 + 1~3 枚图钉 + 2~5 个涂鸦 + 2~5 条文字。
- 标题文字用 font_size 80~110、加粗、font="bold" 或 "script"；注释文字 font_size 22~36、font="hand"、简短 6~14 字。
- 同一风格不同次：背景/边框/旋转/贴纸种类/位置/文字内容都要换，禁止复刻历史输出。

【布局范式（按风格选用）】
- staggered 错落拼贴：默认。照片全部有 rotate、互相重叠、贴纸/胶带散落。
- hero_center 中心大图：1 张主图占画布中上部 70%，2~3 张小图散布在下方/侧边。
- grid_2x2 严格网格：仅限 magazine 风格用。所有照片 border=rect_border、rotate 限 -1.2~1.2 微旋转、贴纸 3~6 枚，背景必须用新闻纸/暖灰不用纯白。
- grid_3 三栏：3 张照片垂直三栏并排（横长形），可被 colorful/vintage/watercolor 选用做变体。
- cluster_organic 群组聚集：5~7 张照片扎堆在画布中央，周围大量留白（适合 minimal/korean_cream/forest）。
- diagonal_line 对角线斜排：照片沿对角线由大到小排列，胶带/图钉贯穿（适合 jp_film/vintage）。

【元素用法速查】
- tapes 胶带：宽 100~200、高 22~40，rotate ±15°~45°，横贴在照片边角；color 必填（如 #F5A623、washi_pink）。
- pins 图钉：size 36~50，钉在照片四角之一；color 用风格主题色。
- doodles 涂鸦：arrow 用于引导视线、underline 强调手写注释、circle 圈出重点、heart/star 点缀；
  width 80~220、height 50~120，rotate ±10°，color 用风格文字色或 #444。
- texts 文字：主标题居中或偏左（x 50~300），短注释贴在照片之间的空隙。

【复古胶片 · 完美输出示例（仅参考结构，不要复用文字）】
{{
  "style": "复古胶片", "style_variation": "暖橙旧时光",
  "bg_color": "#EFE3C8", "layout": "staggered",
  "items": [
    {{ "photo_index": 0, "x": 60, "y": 220, "width": 480, "height": 360, "rotate": -6, "border": "polaroid_white", "caption": "2026 春" }},
    {{ "photo_index": 1, "x": 480, "y": 120, "width": 360, "height": 360, "rotate": 4, "border": "film_border" }},
    {{ "photo_index": 2, "x": 120, "y": 700, "width": 420, "height": 420, "rotate": 3, "border": "film_border" }},
    {{ "photo_index": 3, "x": 540, "y": 580, "width": 380, "height": 380, "rotate": -3, "border": "thin_white" }}
  ],
  "decor_stickers": [
    {{ "id": "sticker_01", "x": 50, "y": 120, "width": 110, "height": 110, "rotate": 8 }},
    {{ "id": "sticker_02", "x": 920, "y": 100, "width": 100, "height": 100, "rotate": -10 }},
    {{ "id": "sticker_05", "x": 880, "y": 920, "width": 130, "height": 130, "rotate": 5 }},
    {{ "id": "sticker_06", "x": 420, "y": 1140, "width": 120, "height": 120, "rotate": -8 }},
    {{ "id": "sticker_01", "x": 240, "y": 460, "width": 90, "height": 90, "rotate": 12 }}
  ],
  "tapes": [
    {{ "x": 320, "y": 200, "width": 140, "height": 30, "rotate": -8, "color": "#F5A623" }},
    {{ "x": 460, "y": 1100, "width": 160, "height": 28, "rotate": 12, "color": "washi_pink" }}
  ],
  "pins": [
    {{ "x": 110, "y": 200, "size": 40, "color": "red" }},
    {{ "x": 600, "y": 600, "size": 36, "color": "yellow" }}
  ],
  "doodles": [
    {{ "kind": "underline", "x": 280, "y": 1100, "width": 200, "height": 40, "color": "#8B5A2B", "rotate": -4 }},
    {{ "kind": "arrow", "x": 880, "y": 480, "width": 120, "height": 80, "color": "#6B4423", "rotate": 160 }},
    {{ "kind": "heart", "x": 60, "y": 1240, "width": 60, "height": 60, "color": "#D64870" }}
  ],
  "texts": [
    {{ "content": "澳门旧时光", "x": 60, "y": 60, "font_size": 88, "color": "#6B4423", "font": "bold" }},
    {{ "content": "街角光影，岁月静好", "x": 80, "y": 1300, "font_size": 32, "color": "#8B5A2B", "font": "hand" }},
    {{ "content": "暖阳如初", "x": 800, "y": 1060, "font_size": 28, "color": "#6B4423", "font": "hand" }}
  ]
}}

请严格按当前用户选择的风格 + 描述执行，同一风格请输出与历史不同（背景/边框/位置/贴纸/文字内容都要换）。"""


def build_user_prompt(
    *,
    preset: dict[str, Any] | None,
    custom_desc: str,
    context: str,
    photo_count: int,
    aspects: list[dict[str, Any]] | None,
) -> str:
    lines: list[str] = []
    is_none = preset is None

    if is_none:
        lines.append(
            "当前风格：无（完全自定义）—— 不使用任何预设风格库，背景、边框、布局、贴纸、文字完全按用户描述执行；"
            "描述未提及的细节按简约平衡原则自由发挥。"
        )
    else:
        lines.append(f"当前风格：{preset['name']}")
        lines.append(
            f"背景色池（只能从中选一个作 bg_color，除非用户描述另有指定）：{'、'.join(preset['bg_color_list'])}"
        )
        lines.append(f"允许的照片边框：{'、'.join(preset['border_types'])}")
        lines.append(f"照片旋转范围：{preset['rotate_range'][0]}° ~ {preset['rotate_range'][1]}°")
        lines.append(f"文字色池：{'、'.join(preset['text_color_list'])}")
        lines.append(f"排版基调：{preset['guide']}")
        if preset.get("text_lang") == "en":
            lines.append("")
            lines.append("【文字语言 — 最高优先级，必须遵守】本风格所有文案一律用英文（English only）：")
            lines.append(
                "- texts[].content、items[].caption、style_variation 全部必须是英文，禁止出现任何中文汉字、日文假名或韩文。"
            )
            lines.append(
                "- 主标题 2~4 个单词（Title Case 或全小写随性风），短注释 2~6 个单词，caption 1~3 个单词，style_variation 2~3 个单词。"
            )
            lines.append("- 每条文字总长 ≤ 26 个字符（含空格）——画布无自动换行，超长会溢出。")
            lines.append(
                "- 用户描述/旅行背景若是中文，先理解含义再用自然的英文表达；"
                "中国地名用英文习惯拼写（如 厦门→Xiamen、西湖→West Lake、外滩→The Bund）。"
            )
            lines.append(
                '- 文案风格：轻快的手帐随笔感（如 "Sunshine day!" / "Sea breeze & laughter" / "Little joys"），不要生硬直译。'
            )
        if custom_desc:
            lines.append("")
            lines.append("用户自定义描述（优先级高于上面预设，必须逐条落实；与预设冲突时以用户描述为准）：")
            lines.append(custom_desc)

    if is_none:
        lines.append("")
        lines.append("用户自定义描述（唯一依据，必须逐条落实）：")
        lines.append(custom_desc)

    if context:
        lines.append("")
        lines.append("用户提供的旅行背景（写随笔文字时可适度引用；用户未提供的信息不要虚构）：")
        lines.append(context)

    lines.append("")
    lines.append(f"照片总数：{photo_count}（下标 0..{photo_count - 1}，必须全部用上且各用一次）")
    if isinstance(aspects, list) and aspects:
        lines.append("照片自然宽高比（w/h，请把每张照片 width/height 控制在它的 0.8~1.3 倍内避免明显裁切）：")
        parts = []
        for a in aspects:
            idx = a.get("index")
            aspect = a.get("aspect")
            try:
                aspect_f = float(aspect) if aspect is not None else 1.0
            except (TypeError, ValueError):
                aspect_f = 1.0
            parts.append(f"照片{idx}（photo_index:{idx}）≈ {aspect_f:.2f}")
        lines.append("；".join(parts))
    lines.append("")
    lines.append(
        f"贴纸候选（decor_stickers 只能从中选 id）："
        f"{'、'.join(sticker_candidates(None if is_none else preset['id']))}"
    )
    lines.append("")
    lines.append("请只输出上述 JSON 对象。")
    return "\n".join(lines)


def parse_layout_json(text: str | None) -> dict[str, Any]:
    if not text:
        raise ValueError("模型未返回内容")
    s = str(text).strip()
    s = re.sub(r"```(?:json)?", "", s, flags=re.IGNORECASE).replace("```", "").strip()
    try:
        obj = json.loads(s)
        if obj and isinstance(obj, dict) and obj.get("items") is not None:
            return obj
    except (json.JSONDecodeError, TypeError):
        pass
    start = s.find("{")
    end = s.rfind("}")
    if start >= 0 and end > start:
        try:
            obj = json.loads(s[start : end + 1])
            if obj and isinstance(obj, dict) and obj.get("items") is not None:
                return obj
        except (json.JSONDecodeError, TypeError):
            pass
    raise ValueError("模型返回的不是有效排版 JSON")


def _num(value: Any, default: float = 0) -> float:
    try:
        n = float(value)
        if n != n:  # NaN
            return default
        return n
    except (TypeError, ValueError):
        return default


def _js_mod(value: float, modulus: float) -> float:
    """Match JavaScript remainder (sign follows dividend)."""
    if modulus == 0:
        return value
    return value - math.trunc(value / modulus) * modulus


def normalize_layout(raw: dict[str, Any], photo_count: int) -> dict[str, Any]:
    layout = dict(raw)
    layout["canvas_width"] = CANVAS_W
    layout["canvas_height"] = CANVAS_H
    layout["layout"] = "staggered"
    if not isinstance(layout.get("items"), list):
        raise ValueError("排版缺少 items 数组")
    bg = layout.get("bg_color")
    if not bg or not HEX_COLOR_RE.match(str(bg)):
        layout["bg_color"] = "#FFFFFF"

    used: set[int] = set()
    items: list[dict[str, Any]] = []
    for it in layout["items"]:
        if not it or not isinstance(it, dict):
            continue
        idx = int(_num(it.get("photo_index"), -1))
        if idx < 0:
            continue
        used.add(idx)
        w = round(_num(it.get("width"))) or 0
        h = round(_num(it.get("height"))) or 0
        if w <= 0 or h <= 0:
            continue
        item: dict[str, Any] = {
            "photo_index": idx,
            "x": round(_num(it.get("x"))) or 0,
            "y": round(_num(it.get("y"))) or 0,
            "width": min(max(w, 40), CANVAS_W),
            "height": min(max(h, 40), CANVAS_H),
            "rotate": _js_mod(_num(it.get("rotate")), 360),
            "border": it.get("border") if it.get("border") in BORDER_WHITELIST else "thin_white",
        }
        border_color = it.get("border_color")
        if border_color and HEX_COLOR_RE.match(str(border_color)):
            item["border_color"] = border_color
        items.append(item)
    layout["items"] = items

    for i in range(photo_count):
        if i not in used:
            raise ValueError(f"排版漏掉了照片 {i}，请重试")

    if isinstance(layout.get("decor_stickers"), list):
        stickers = []
        for s in layout["decor_stickers"]:
            if not s or not isinstance(s, dict) or not s.get("id"):
                continue
            if _num(s.get("width")) <= 0 or _num(s.get("height")) <= 0:
                continue
            stickers.append({
                "id": str(s["id"]).strip(),
                "x": round(_num(s.get("x"))) or 0,
                "y": round(_num(s.get("y"))) or 0,
                "width": min(max(round(_num(s.get("width"))), 16), 420),
                "height": min(max(round(_num(s.get("height"))), 16), 420),
                "rotate": _num(s.get("rotate")),
            })
            if len(stickers) >= 12:
                break
        layout["decor_stickers"] = stickers
    else:
        layout["decor_stickers"] = []

    if isinstance(layout.get("tapes"), list):
        tapes = []
        for t in layout["tapes"]:
            if not t or not isinstance(t, dict):
                continue
            if _num(t.get("width")) <= 0 and _num(t.get("height")) <= 0:
                continue
            tapes.append({
                "x": round(_num(t.get("x"))) or 0,
                "y": round(_num(t.get("y"))) or 0,
                "width": min(max(round(_num(t.get("width"), 120)), 30), 600),
                "height": min(max(round(_num(t.get("height"), 28)), 8), 120),
                "rotate": _num(t.get("rotate")),
                "color": t["color"] if isinstance(t.get("color"), str) else "washi_pink",
            })
            if len(tapes) >= 6:
                break
        layout["tapes"] = tapes
    else:
        layout["tapes"] = []

    if isinstance(layout.get("pins"), list):
        pins = []
        for p in layout["pins"]:
            if not p or not isinstance(p, dict) or _num(p.get("size")) <= 0:
                continue
            pins.append({
                "x": round(_num(p.get("x"))) or 0,
                "y": round(_num(p.get("y"))) or 0,
                "size": min(max(round(_num(p.get("size"), 40)), 16), 120),
                "color": p["color"] if isinstance(p.get("color"), str) else "red",
            })
            if len(pins) >= 4:
                break
        layout["pins"] = pins
    else:
        layout["pins"] = []

    if isinstance(layout.get("doodles"), list):
        doodles = []
        for d in layout["doodles"]:
            if not d or not isinstance(d, dict):
                continue
            kind = str(d.get("kind") or "")
            if kind not in DOODLE_KINDS:
                continue
            color = d.get("color")
            doodles.append({
                "kind": kind,
                "x": round(_num(d.get("x"))) or 0,
                "y": round(_num(d.get("y"))) or 0,
                "width": min(max(round(_num(d.get("width"), 120)), 30), 600),
                "height": min(max(round(_num(d.get("height"), 80)), 20), 400),
                "color": color if isinstance(color, str) and HEX_COLOR_RE.match(color) else None,
                "rotate": _num(d.get("rotate")),
            })
            if len(doodles) >= 8:
                break
        layout["doodles"] = doodles
    else:
        layout["doodles"] = []

    if isinstance(layout.get("texts"), list):
        texts = []
        for t in layout["texts"]:
            if not t or not isinstance(t, dict) or not t.get("content"):
                continue
            color = t.get("color")
            texts.append({
                "content": str(t["content"]).strip()[:40],
                "x": round(_num(t.get("x"))) or 0,
                "y": round(_num(t.get("y"))) or 0,
                "font_size": min(max(round(_num(t.get("font_size"))) or 24, 12), 140),
                "color": color if isinstance(color, str) and HEX_COLOR_RE.match(color) else "#444444",
            })
            if len(texts) >= 6:
                break
        layout["texts"] = texts
    else:
        layout["texts"] = []

    return layout


async def request_diary_layout_next(
    *,
    api_key: str,
    base_url: str,
    model: str,
    style: str,
    description: str = "",
    context: str = "",
    photo_count: int = 0,
    aspects: list | None = None,
) -> dict[str, Any]:
    resolved_key = str(api_key or "").strip()
    if not resolved_key:
        return {"success": False, "error": "缺少 DeepSeek API Key"}

    preset = lookup_preset(style)
    custom_desc = str(description or "").strip()
    if not preset and not custom_desc:
        return {"success": False, "error": "请选择手帐风格，或者填写自定义风格描述"}
    if not (3 <= photo_count <= 9):
        return {"success": False, "error": "新版 AI 排版需要 3-9 张照片"}

    aspect_list: list[dict[str, Any]] | None = None
    if isinstance(aspects, list) and aspects:
        aspect_list = []
        for a in aspects:
            if isinstance(a, dict):
                aspect_list.append(a)
            else:
                # Pydantic model support
                aspect_list.append({
                    "index": getattr(a, "index", None),
                    "aspect": getattr(a, "aspect", None),
                })

    user_prompt = build_user_prompt(
        preset=preset,
        custom_desc=custom_desc,
        context=str(context or "").strip(),
        photo_count=photo_count,
        aspects=aspect_list,
    )

    api_base = str(base_url or "").rstrip("/")
    api_url = f"{api_base}/chat/completions"
    model_name = str(model or "deepseek-chat").strip() or "deepseek-chat"

    logger.info(
        "[Diary Layout v3] style=%s photos=%s desc=%s context=%s model=%s",
        preset["id"] if preset else "none",
        photo_count,
        len(custom_desc),
        len(str(context or "")),
        model_name,
    )

    async with httpx.AsyncClient(timeout=httpx.Timeout(150.0, connect=8.0)) as client:
        response = await client.post(
            api_url,
            headers={
                "Authorization": f"Bearer {resolved_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model_name,
                "messages": [
                    {"role": "system", "content": build_system_prompt()},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 1.1 if preset else 1.2,
                "max_tokens": 4096,
                "response_format": {"type": "json_object"},
                "stream": False,
            },
        )
        response.raise_for_status()
        data = response.json()

    content = None
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        return {"success": False, "error": "模型未返回内容"}

    try:
        raw = parse_layout_json(content)
        layout = normalize_layout(raw, photo_count)
    except ValueError as exc:
        return {"success": False, "error": str(exc)}

    return {"success": True, "layout": layout}
