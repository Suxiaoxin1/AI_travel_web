"""模板文字填充：纯函数单测（不打真实 API）。"""
import pytest

from app.diary_text_fill import (
    build_user_prompt,
    clamp_to_max,
    format_photo_hints,
    overlong_keys,
    parse_photo_scale,
    parse_texts_json,
)


def test_parse_texts_json_strips_fences():
    raw = '```json\n{"photo_scale": 1.05, "texts": {"t1": "海风正好"}}\n```'
    obj = parse_texts_json(raw)
    assert obj["texts"]["t1"] == "海风正好"

    with pytest.raises(ValueError, match="有效槽位文字 JSON"):
        parse_texts_json('{"nope": 1}')

    with pytest.raises(ValueError, match="未返回内容"):
        parse_texts_json("")


def test_parse_photo_scale_clamps_and_accepts_str():
    assert parse_photo_scale({"photo_scale": 1.05}) == 1.05
    assert parse_photo_scale({"photo_scale": "1.08"}) == 1.08
    assert parse_photo_scale({"photo_scale": 9.9}) == 1.18
    assert parse_photo_scale({"photo_scale": 0.1}) == 0.82
    assert parse_photo_scale({"texts": {}}) is None
    assert parse_photo_scale(None) is None


def test_clamp_to_max_breaks_at_punctuation():
    assert clamp_to_max("海风正好，灯亮了。", 20) == "海风正好，灯亮了。"
    out = clamp_to_max("海风正好，灯亮了，面包香。", 9)
    assert len(out) <= 9
    assert not out[-1] in "，,。！？；;、"


def test_overlong_keys_with_tolerance():
    slots = [{"key": "a", "max": 6}, {"key": "b", "max": 6}]
    texts = {"a": "12345678", "b": "12345678x"}  # a 超 2 以内容差，b 超出
    assert overlong_keys(texts, slots) == ["b"]


def test_format_photo_hints_and_user_prompt():
    hints = [{"index": 1, "when": "傍晚", "shape": "横图", "subject": "海", "tone": "暖"}]
    assert "照片1" in format_photo_hints(hints)
    assert format_photo_hints([]) == ""
    prompt = build_user_prompt(
        style_name="复古胶片",
        context="大理三天",
        slots=[{"key": "t1", "role": "标题", "lang": "zh", "max": 6}],
        photo_count=4,
        photo_hints=hints,
    )
    assert "复古胶片" in prompt and "photo_count：4" in prompt
