"""旅行手帐「模板文字填充」服务（移植自旧项目 server/services/diary-text-fill.js）。

职责：固定模板（public/journal/js/diary-templates.js 6 套版式）的布局/照片
位置是定死的，本服务让 DeepSeek 只负责"文案"——
  输入：style/styleName + slots（每槽位 key/role/lang/max）+ 旅行背景 context
  输出：{ texts: { slotKey: "文字" }, photoScale }（槽位坐标颜色一律不动）

约束（写进 system prompt）：
 - 文字只换内容，绝不修改任何坐标/字号/颜色/位置；
 - 每条按 max 精简，绝不能溢出到照片上；
 - 不生成图片、不重绘照片。
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_CODE_FENCE_RE = re.compile(r"```(?:json)?", re.IGNORECASE)
_STRIP_QUOTES_RE = re.compile(r'^["\'“”「『]+|["\'“”」』]+$')
_BREAK_CHARS = "，,。！？；;、 \u3000"


def build_system_prompt() -> str:
    return """你是一位旅行手帐文案写手，专为"小红书式旅行日记手帐"写简短有温度的槽位文字。
你只输出一个 JSON 对象（不要 markdown 代码块、不要任何多余文字）：
{
  "photo_scale": 1.0,
  "texts": {
    "槽位key": "替换后的文字",
    ...
  }
}

铁律：
1. 布局、坐标、字号、颜色、照片全部由模板固定，你【只写文字内容】，一个槽位一条字符串。
2. 每条文字必须 ≤ 对应槽位标注的 max 字符上限——这是【硬性排版约束】：槽位宽度是按 max 设计的，超长会挤成多行小字、盖到照片上，属于排版事故。中文短句优先 4~9 字；宁可短一半，不要长一点。
3. 文字要贴合用户提供的旅行背景；未提供信息时不要虚构具体地名/事件，宁可写通用心情。
4. 槽位建议语言（zh/en）：中文用口语化短句，英文走手帐风（全小写、可带 & / ♥ 等）；不要中英混搭。
5. 语气：像日记主人随手写的便签，温暖、不端着；避免空泛套话（"美好的一天"之类）；可以用具体的小意象（风、灯、傍晚、海、面包香…）。
6. 标题槽位要有"手帐杂志感"：中文 2~6 字，英文 1~3 个词，耐看有辨识度。
7. 只要输出这个 JSON。若个别槽位确实没想好，宁可照原样少改，也不要硬塞超长句子。

关于 photo_scale（照片整体缩放系数）：
- 版式是「照片拼贴集中在画面中心，四周写文案」。照片张数少时画面会空，照片应该大一点；张数多时拥挤，照片应该小一点。
- 请你根据用户消息里的照片数量 photo_count 在 0.95~1.12 之间判断一个合适的 photo_scale（保留两位小数）：
  - 3~4 张：偏大（1.05~1.12），让少数照片撑起版面；
  - 5 张：略大（1.00~1.06）；
  - 6 张：正好（0.98~1.02）；
  - 7 张及以上：不缩或微缩（0.95~1.00），「小」已由分档布局体现，再缩会上下露缝。
- 这个值会围绕画面中心等比缩放所有照片（含它们之间的相对位置），只影响照片大小，不影响文字。只输出数值。"""


def format_photo_hints(hints: Any) -> str:
    """照片线索 → 一行一条（模型看不到照片，靠这些线索推想画面）。"""
    if not isinstance(hints, list) or not hints:
        return ""
    parts = []
    for h in hints:
        if not isinstance(h, dict):
            continue
        bits = [h.get("when"), h.get("shape"), h.get("subject"), h.get("tone")]
        bits = [b for b in bits if b]
        parts.append(f"照片{h.get('index')}：{' · '.join(bits) if bits else '无可用线索'}")
    return "；".join(parts)


def build_user_prompt(
    *,
    style_name: str = "",
    context: str = "",
    slots: list | None = None,
    photo_count: int = 0,
    photo_hints: Any = None,
) -> str:
    lines = [
        f"模板风格：{style_name}（文案语气请贴合该风格气质）",
        f"照片数量 photo_count：{photo_count}",
    ]
    if context:
        lines += ["", "旅行背景（写文案时尽量呼应；没有的内容不要编造）：", context]
    hint_text = format_photo_hints(photo_hints)
    if hint_text:
        lines += [
            "",
            "【照片线索 — 你看不到照片，只能靠这些线索推想画面】：",
            hint_text,
            "用户没有给出具体文字要求时，默认按「描述画面」写：每条文案尽量对应某张照片，写画面里大概有什么 / 当时在做什么；",
            "严禁写与任何照片都对不上的空泛套话（\"美好的一天\"\"记录美好\"\"享受生活\"等）。若用户旅行背景里明确给了文字要求，以用户为准。",
        ]
    lines += [
        "",
        "需要填写的文字槽位（数组元素含 key / 角色 / 建议语言 lang / 字数上限 max；内容必须自然替换，不要照抄原词）：",
        json.dumps(slots or [], ensure_ascii=False, indent=2),
        "",
        "请输出 { \"photo_scale\": 数值, \"texts\": {...} } JSON（photo_scale 按照片张数在 0.85~1.12 之间判断）。",
    ]
    return "\n".join(lines)


def parse_texts_json(text: str | None) -> dict[str, Any]:
    """清洗 markdown 包裹并解析，返回含 texts 的 dict；非法则抛 ValueError。"""
    if not text:
        raise ValueError("模型未返回内容")
    s = _CODE_FENCE_RE.sub("", str(text)).replace("```", "").strip()
    obj = None
    try:
        obj = json.loads(s)
    except (json.JSONDecodeError, ValueError):
        pass
    if not obj:
        start, end = s.find("{"), s.rfind("}")
        if start >= 0 and end > start:
            try:
                obj = json.loads(s[start:end + 1])
            except (json.JSONDecodeError, ValueError):
                pass
    if not obj or not isinstance(obj.get("texts"), dict):
        raise ValueError("模型返回的不是有效槽位文字 JSON")
    return obj


def parse_photo_scale(obj: dict[str, Any] | None) -> float | None:
    """越界/非法 → None（前端用本地兜底表）；兼容字符串数字。"""
    if not obj:
        return None
    v = obj.get("photo_scale")
    if isinstance(v, str) and v.strip() != "":
        try:
            v = float(v)
        except ValueError:
            return None
    if not isinstance(v, (int, float)) or v != v:  # NaN check
        return None
    return max(0.82, min(1.18, float(v)))


def clamp_to_max(s: Any, max_len: Any) -> str:
    """按槽位 max 裁剪（保险丝）：优先在句读处断开，去尾标点。"""
    t = _STRIP_QUOTES_RE.sub("", str(s or "").strip())
    if not max_len or max_len < 4 or len(t) <= max_len:
        return t
    parts, cur = [], ""
    for ch in t:
        cur += ch
        if ch in _BREAK_CHARS:
            parts.append(cur)
            cur = ""
    if cur:
        parts.append(cur)
    out = ""
    for p in parts:
        if len((out + p).strip()) > max_len:
            break
        out += p
    out = out.strip() or t[:max_len]
    return out.rstrip("，,。！？；;、-—…~ \u3000")


def overlong_keys(texts: dict[str, Any] | None, slots: list | None) -> list[str]:
    """找出超长槽位（超过 max + 2 容差）。"""
    max_map = {s.get("key"): s.get("max") for s in (slots or []) if isinstance(s, dict)}
    bad = []
    for k, v in (texts or {}).items():
        m = max_map.get(k)
        if m and len(str(v or "").strip()) > m + 2:
            bad.append(k)
    return bad


async def _call_deepseek(
    api_key: str,
    *,
    style_name: str,
    context: str,
    slots: list,
    photo_count: int,
    photo_hints: Any,
    base_url: str,
    model: str,
) -> dict[str, Any]:
    api_base = str(base_url or "").rstrip("/")
    model_name = str(model or "deepseek-chat").strip() or "deepseek-chat"
    async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=8.0)) as client:
        response = await client.post(
            f"{api_base}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model_name,
                "messages": [
                    {"role": "system", "content": build_system_prompt()},
                    {
                        "role": "user",
                        "content": build_user_prompt(
                            style_name=style_name,
                            context=context,
                            slots=slots,
                            photo_count=photo_count,
                            photo_hints=photo_hints,
                        ),
                    },
                ],
                "temperature": 1.0,
                "max_tokens": 1500,
                "response_format": {"type": "json_object"},
                "stream": False,
            },
        )
        response.raise_for_status()
        data = response.json()
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        raise ValueError("模型未返回内容")
    parsed = parse_texts_json(content)
    return {"texts": parsed["texts"], "photoScale": parse_photo_scale(parsed)}


async def request_diary_texts(
    *,
    api_key: str,
    base_url: str,
    model: str,
    style_name: str = "",
    context: str = "",
    photo_count: int = 0,
    slots: list | None = None,
    photo_hints: Any = None,
) -> dict[str, Any]:
    """发起模板文字填充：超长槽位收敛重试一次，仍超的按 max 硬裁剪兜底。"""
    resolved_key = str(api_key or "").strip()
    if not resolved_key:
        return {"success": False, "error": "缺少 DeepSeek API Key"}
    if not isinstance(slots, list) or not slots:
        return {"success": False, "error": "没有可填充的文字槽位"}

    logger.info(
        "[Diary Text Fill] style=%s slots=%s photos=%s model=%s",
        style_name, len(slots), photo_count, model,
    )

    first = await _call_deepseek(
        resolved_key,
        style_name=style_name, context=context, slots=slots,
        photo_count=photo_count, photo_hints=photo_hints,
        base_url=base_url, model=model,
    )
    if first["photoScale"] is not None:
        logger.info("[Diary Text Fill] photo_scale=%s (photos=%s)", first["photoScale"], photo_count)
    else:
        logger.info("[Diary Text Fill] photo_scale 未返回，前端用本地兜底")

    texts = dict(first["texts"] or {})
    over = overlong_keys(texts, slots)
    if over:
        logger.info("[Diary Text Fill] %d 个槽位超长（%s），收敛重试", len(over), "、".join(over))
        slot_map = {s.get("key"): s for s in slots if isinstance(s, dict)}
        sub = []
        for key in over:
            s = slot_map.get(key) or {}
            sub.append({
                "key": key,
                "kind": s.get("kind"),
                "role": str(s.get("role") or "文字槽位")
                + "【上一轮这条写超了、被排版截断，这次必须 ≤ max 字符，改写成更短的意象短句】",
                "lang": s.get("lang"),
                "max": s.get("max"),
                "now": str(texts.get(key) or "")[: (s.get("max") or 0)],
            })
        try:
            retry = await _call_deepseek(
                resolved_key,
                style_name=style_name, context=context, slots=sub,
                photo_count=photo_count, photo_hints=photo_hints,
                base_url=base_url, model=model,
            )
            for key in over:
                if retry["texts"].get(key):
                    texts[key] = retry["texts"][key]
        except Exception as exc:  # noqa: BLE001 — 重试失败用第一轮兜底
            logger.warning("[Diary Text Fill] 收敛重试失败，用第一轮结果兜底: %s", exc)

    max_map = {s.get("key"): s.get("max") for s in slots if isinstance(s, dict)}
    clamped = 0
    for key in list(texts.keys()):
        v = clamp_to_max(texts[key], max_map.get(key))
        if v != texts[key]:
            texts[key] = v
            clamped += 1
    if clamped:
        logger.info("[Diary Text Fill] 已按槽位上限裁剪 %d 条", clamped)

    return {"success": True, "texts": texts, "photoScale": first["photoScale"]}
