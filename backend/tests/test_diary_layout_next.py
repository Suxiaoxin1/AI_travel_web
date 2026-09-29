"""手帐排版 v3：纯函数单测（不打真实 API）。"""
import pytest

from app.diary_layout_next import (
    build_user_prompt,
    lookup_preset,
    normalize_layout,
    parse_layout_json,
    sticker_candidates,
)


def test_lookup_preset_by_id_and_chinese_name():
    by_id = lookup_preset("vintage")
    by_name = lookup_preset("复古胶片")
    assert by_id is not None and by_name is not None
    assert by_id["id"] == "vintage"
    assert by_name["id"] == "vintage"
    assert lookup_preset("none") is None
    assert lookup_preset("") is None
    assert lookup_preset("  minimal  ")["id"] == "minimal"


def test_sticker_candidates_for_preset_and_none():
    vintage = sticker_candidates("vintage")
    assert any(s.startswith("sticker_01(相机)") for s in vintage)
    none_pool = sticker_candidates(None)
    assert any("相机" in s for s in none_pool)


def test_parse_layout_json_strips_fences_and_extracts_object():
    raw = '```json\n{"style":"复古胶片","items":[{"photo_index":0}]}\n```'
    obj = parse_layout_json(raw)
    assert obj["style"] == "复古胶片"
    assert len(obj["items"]) == 1

    wrapped = '说明文字\n{"items":[{"photo_index":1}],"bg_color":"#FFFFFF"}\n尾部'
    obj2 = parse_layout_json(wrapped)
    assert obj2["items"][0]["photo_index"] == 1

    with pytest.raises(ValueError, match="有效排版 JSON"):
        parse_layout_json("not json at all")

    with pytest.raises(ValueError, match="未返回内容"):
        parse_layout_json("")


def _sample_raw(photo_count: int = 3) -> dict:
    items = []
    for i in range(photo_count):
        items.append({
            "photo_index": i,
            "x": 40 + i * 20,
            "y": 100 + i * 40,
            "width": 300,
            "height": 280,
            "rotate": -3 + i,
            "border": "polaroid_white",
        })
    return {
        "style": "复古胶片",
        "style_variation": "测试变体",
        "bg_color": "#EFE3C8",
        "layout": "hero_center",
        "items": items,
        "decor_stickers": [
            {"id": "sticker_01", "x": 10, "y": 20, "width": 80, "height": 80, "rotate": 5},
        ],
        "tapes": [
            {"x": 50, "y": 60, "width": 140, "height": 28, "rotate": -8, "color": "washi_pink"},
        ],
        "pins": [{"x": 12, "y": 14, "size": 40, "color": "red"}],
        "doodles": [
            {"kind": "heart", "x": 1, "y": 2, "width": 60, "height": 60, "color": "#D64870", "rotate": 0},
            {"kind": "unknown_kind", "x": 0, "y": 0, "width": 10, "height": 10},
        ],
        "texts": [
            {"content": "测试标题", "x": 20, "y": 30, "font_size": 88, "color": "#6B4423", "font": "bold"},
        ],
    }


def test_normalize_layout_clamps_and_fills_defaults():
    layout = normalize_layout(_sample_raw(3), 3)
    assert layout["canvas_width"] == 1080
    assert layout["canvas_height"] == 1440
    # 与 JS 同源：规范化后强制 layout=staggered
    assert layout["layout"] == "staggered"
    assert len(layout["items"]) == 3
    assert layout["items"][0]["border"] == "polaroid_white"
    assert layout["decor_stickers"][0]["id"] == "sticker_01"
    assert layout["tapes"][0]["color"] == "washi_pink"
    assert layout["pins"][0]["color"] == "red"
    assert len(layout["doodles"]) == 1
    assert layout["doodles"][0]["kind"] == "heart"
    assert layout["texts"][0]["content"] == "测试标题"
    assert "font" not in layout["texts"][0]


def test_normalize_layout_rejects_missing_photo_index():
    raw = _sample_raw(3)
    raw["items"] = [it for it in raw["items"] if it["photo_index"] != 1]
    with pytest.raises(ValueError, match="漏掉了照片 1"):
        normalize_layout(raw, 3)


def test_normalize_layout_fixes_invalid_bg_and_border():
    raw = _sample_raw(3)
    raw["bg_color"] = "not-a-color"
    raw["items"][0]["border"] = "made_up_border"
    layout = normalize_layout(raw, 3)
    assert layout["bg_color"] == "#FFFFFF"
    assert layout["items"][0]["border"] == "thin_white"


def test_build_user_prompt_includes_preset_and_aspects():
    preset = lookup_preset("colorful")
    prompt = build_user_prompt(
        preset=preset,
        custom_desc="more pastel",
        context="厦门 · 晴天",
        photo_count=4,
        aspects=[{"index": 0, "aspect": 1.333}, {"index": 1, "aspect": 0.75}],
    )
    assert "多彩活泼" in prompt
    assert "English only" in prompt
    assert "照片总数：4" in prompt
    assert "≈ 1.33" in prompt
    assert "more pastel" in prompt
    assert "厦门" in prompt
