"""出行天气：Open-Meteo 实时预报 + 超范围往年同期参考。"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from typing import Any, Optional

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

HTTP_TIMEOUT = httpx.Timeout(12.0, connect=5.0)
USER_AGENT = "StarwalkTravelBot/1.0 (weather; travel planning)"
GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
# Open-Meteo 日常预报大约覆盖未来 16 天
FORECAST_HORIZON_DAYS = 15
WEEKDAY_CN = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]

# Open-Meteo 对部分中文地名检索不稳定，补充英文别名与常用坐标兜底
CITY_ALIASES: dict[str, list[str]] = {
    "林芝": ["Nyingchi", "Linzhi", "林芝市"],
    "拉萨": ["Lhasa", "拉萨市"],
    "日喀则": ["Shigatse", "Xigaze"],
    "大理": ["Dali Yunnan", "Dali City", "大理市", "大理白族自治州"],
    "丽江": ["Lijiang", "丽江市"],
    "香格里拉": ["Shangri-La Yunnan", "Shangri-La", "Zhongdian", "香格里拉市", "迪庆"],
    "西双版纳": ["Xishuangbanna", "Jinghong"],
    "张家界": ["Zhangjiajie"],
    "九寨沟": ["Jiuzhaigou"],
    "黄山": ["Huangshan"],
    "桂林": ["Guilin"],
    "阳朔": ["Yangshuo"],
    "三亚": ["Sanya"],
    "厦门": ["Xiamen"],
    "青岛": ["Qingdao"],
    "成都": ["Chengdu"],
    "重庆": ["Chongqing"],
    "西安": ["Xi'an", "Xian"],
    "杭州": ["Hangzhou"],
    "苏州": ["Suzhou"],
    "上海": ["Shanghai"],
    "北京": ["Beijing"],
    "广州": ["Guangzhou"],
    "深圳": ["Shenzhen"],
    "昆明": ["Kunming"],
    "贵阳": ["Guiyang"],
    "乌鲁木齐": ["Urumqi"],
    "呼和浩特": ["Hohhot"],
    "哈尔滨": ["Harbin"],
    "西藏": ["Lhasa", "拉萨"],
    "新疆": ["Urumqi", "乌鲁木齐"],
    "云南": ["Kunming", "昆明"],
}

# 常用旅行城市坐标兜底（当地理编码失败时）
CITY_COORDS: dict[str, dict[str, Any]] = {
    "林芝": {"name": "林芝", "latitude": 29.65, "longitude": 94.36, "admin1": "西藏", "country": "中国"},
    "拉萨": {"name": "拉萨", "latitude": 29.65, "longitude": 91.13, "admin1": "西藏", "country": "中国"},
    "大理": {"name": "大理", "latitude": 25.69, "longitude": 100.23, "admin1": "云南", "country": "中国"},
    "丽江": {"name": "丽江", "latitude": 26.87, "longitude": 100.23, "admin1": "云南", "country": "中国"},
    "香格里拉": {"name": "香格里拉", "latitude": 27.83, "longitude": 99.70, "admin1": "云南", "country": "中国"},
    "成都": {"name": "成都", "latitude": 30.67, "longitude": 104.07, "admin1": "四川", "country": "中国"},
    "北京": {"name": "北京", "latitude": 39.90, "longitude": 116.41, "admin1": "北京", "country": "中国"},
    "上海": {"name": "上海", "latitude": 31.23, "longitude": 121.47, "admin1": "上海", "country": "中国"},
    "杭州": {"name": "杭州", "latitude": 30.27, "longitude": 120.15, "admin1": "浙江", "country": "中国"},
    "西安": {"name": "西安", "latitude": 34.27, "longitude": 108.95, "admin1": "陕西", "country": "中国"},
    "厦门": {"name": "厦门", "latitude": 24.48, "longitude": 118.09, "admin1": "福建", "country": "中国"},
    "重庆": {"name": "重庆", "latitude": 29.56, "longitude": 106.55, "admin1": "重庆", "country": "中国"},
    "三亚": {"name": "三亚", "latitude": 18.25, "longitude": 109.51, "admin1": "海南", "country": "中国"},
    "昆明": {"name": "昆明", "latitude": 25.04, "longitude": 102.71, "admin1": "云南", "country": "中国"},
    "西藏": {"name": "拉萨", "latitude": 29.65, "longitude": 91.13, "admin1": "西藏", "country": "中国"},
}


def _normalize_city_key(name: str) -> str:
    text = (name or "").strip()
    for suffix in ("市", "地区", "州", "盟", "县", "区", "自治州", "特别行政区"):
        if text.endswith(suffix) and len(text) > len(suffix):
            text = text[: -len(suffix)]
    return text


def _pick_best_result(results: list[dict[str, Any]], prefer_name: str) -> Optional[dict[str, Any]]:
    if not results:
        return None
    cn = [r for r in results if (r.get("country_code") or "").upper() == "CN"]
    pool = cn or results
    prefer = _normalize_city_key(prefer_name)

    # 大理 / 香格里拉优先云南，避免命中同名村镇社区
    if prefer in ("大理", "香格里拉", "丽江", "西双版纳"):
        for r in pool:
            admin = str(r.get("admin1") or "")
            if "云南" in admin or "Yunnan" in admin:
                return r
    if prefer in ("林芝", "拉萨", "日喀则", "西藏"):
        for r in pool:
            admin = str(r.get("admin1") or "")
            if "西藏" in admin or "Xizang" in admin or "Tibet" in admin:
                return r

    # 名称完全匹配优先
    for r in pool:
        if _normalize_city_key(str(r.get("name") or "")) == prefer:
            return r
    return pool[0]


async def _geocode_amap(client: httpx.AsyncClient, city: str) -> Optional[dict[str, Any]]:
    key = (settings.AMAP_WEB_SERVICE_KEY or "").strip()
    if not key:
        return None
    try:
        resp = await client.get(
            f"{settings.AMAP_WEB_SERVICE_BASE.rstrip('/')}/geocode/geo",
            params={"address": city, "key": key},
            headers={"User-Agent": USER_AGENT},
        )
        resp.raise_for_status()
        data = resp.json() or {}
        if str(data.get("status")) != "1":
            return None
        geos = data.get("geocodes") or []
        if not geos:
            return None
        loc = str(geos[0].get("location") or "")
        if "," not in loc:
            return None
        lng_s, lat_s = loc.split(",", 1)
        return {
            "name": geos[0].get("city") or geos[0].get("district") or city,
            "latitude": float(lat_s),
            "longitude": float(lng_s),
            "admin1": geos[0].get("province") or "",
            "country": "中国",
        }
    except Exception as exc:  # noqa: BLE001
        logger.warning("amap geocode failed for %s: %s", city, exc)
        return None


async def _geocode_city(client: httpx.AsyncClient, city: str) -> dict[str, Any]:
    name = (city or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="city 不能为空")

    key = _normalize_city_key(name)
    # 热门目的地直接使用校验过的坐标，避免 Open-Meteo 中文检索偏差
    if key in CITY_COORDS:
        return dict(CITY_COORDS[key])

    candidates: list[str] = []
    for item in [name, key, *(CITY_ALIASES.get(key) or [])]:
        if item and item not in candidates:
            candidates.append(item)

    last_error = None
    for query in candidates:
        try:
            resp = await client.get(
                GEOCODE_URL,
                params={
                    "name": query,
                    "count": 10,
                    "language": "zh",
                    "format": "json",
                    "countryCode": "CN",
                },
                headers={"User-Agent": USER_AGENT},
            )
            resp.raise_for_status()
            results = (resp.json() or {}).get("results") or []
            pick = _pick_best_result(results, key)
            if not pick:
                continue
            return {
                "name": pick.get("name") or key,
                "latitude": float(pick["latitude"]),
                "longitude": float(pick["longitude"]),
                "admin1": pick.get("admin1") or "",
                "country": pick.get("country") or "",
            }
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            logger.warning("geocode failed for %s: %s", query, exc)

    amap = await _geocode_amap(client, name)
    if amap:
        return amap

    raise HTTPException(
        status_code=404,
        detail=f"找不到城市「{name}」的坐标，无法查询天气",
    ) from last_error


WMO_TEXT = {
    0: "晴",
    1: "大体晴朗",
    2: "多云",
    3: "阴天",
    45: "有雾",
    48: "雾凇",
    51: "小毛毛雨",
    53: "毛毛雨",
    55: "大毛毛雨",
    56: "冻毛毛雨",
    57: "强冻毛毛雨",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    66: "冻雨",
    67: "强冻雨",
    71: "小雪",
    73: "中雪",
    75: "大雪",
    77: "雪粒",
    80: "小阵雨",
    81: "阵雨",
    82: "强阵雨",
    85: "小阵雪",
    86: "强阵雪",
    95: "雷阵雨",
    96: "雷阵雨伴冰雹",
    99: "强雷暴伴冰雹",
}


def _weather_summary(code: Optional[int]) -> str:
    if code is None:
        return "天气未知"
    return WMO_TEXT.get(int(code), f"天气代码 {code}")


def _parse_date(value: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="start_date 格式应为 YYYY-MM-DD") from exc


def _shift_year(d: date, years: int) -> date:
    try:
        return d.replace(year=d.year + years)
    except ValueError:
        # 2/29 → 2/28
        return d.replace(month=2, day=28, year=d.year + years)


def _daily_params() -> str:
    return ",".join(
        [
            "weathercode",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_probability_max",
            "precipitation_sum",
        ]
    )


def _safe_float(value: Any) -> Optional[float]:
    try:
        if value is None:
            return None
        return round(float(value), 1)
    except (TypeError, ValueError):
        return None


def _safe_int(value: Any) -> Optional[int]:
    try:
        if value is None:
            return None
        return int(value)
    except (TypeError, ValueError):
        return None


async def _fetch_daily(
    client: httpx.AsyncClient,
    *,
    url: str,
    lat: float,
    lng: float,
    start: date,
    end: date,
) -> dict[str, dict[str, Any]]:
    params: dict[str, Any] = {
        "latitude": lat,
        "longitude": lng,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "daily": _daily_params(),
        "timezone": "Asia/Shanghai",
    }
    if "archive" in url:
        params["daily"] = ",".join(
            [
                "weathercode",
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_sum",
            ]
        )

    resp = await client.get(url, params=params, headers={"User-Agent": USER_AGENT})
    resp.raise_for_status()
    daily = (resp.json() or {}).get("daily") or {}
    dates = daily.get("time") or []
    codes = daily.get("weathercode") or []
    tmax = daily.get("temperature_2m_max") or []
    tmin = daily.get("temperature_2m_min") or []
    pop = daily.get("precipitation_probability_max") or []
    precip = daily.get("precipitation_sum") or []
    out: dict[str, dict[str, Any]] = {}
    for i, day_str in enumerate(dates):
        out[day_str] = {
            "weather_code": _safe_int(codes[i] if i < len(codes) else None),
            "temp_max": _safe_float(tmax[i] if i < len(tmax) else None),
            "temp_min": _safe_float(tmin[i] if i < len(tmin) else None),
            "precipitation_probability": _safe_int(pop[i] if i < len(pop) else None),
            "precipitation_sum": _safe_float(precip[i] if i < len(precip) else None),
        }
    return out


@router.get("/trip")
async def trip_weather(
    city: str = Query(..., min_length=1, max_length=80, description="目的地城市"),
    start_date: str = Query(..., description="出行开始日期 YYYY-MM-DD"),
    days: int = Query(7, ge=1, le=14, description="展示天数，默认一周"),
):
    """按出行日期返回一周天气：可预报范围内用实时预报，超出用往年同期。"""
    trip_start = _parse_date(start_date)
    trip_end = trip_start + timedelta(days=days - 1)
    today = date.today()
    forecast_limit = today + timedelta(days=FORECAST_HORIZON_DAYS)

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        place = await _geocode_city(client, city)
        lat = place["latitude"]
        lng = place["longitude"]

        forecast_days: list[date] = []
        historical_days: list[date] = []
        for offset in range(days):
            d = trip_start + timedelta(days=offset)
            if d < today or d > forecast_limit:
                historical_days.append(d)
            else:
                forecast_days.append(d)

        forecast_map: dict[str, dict[str, Any]] = {}
        historical_map: dict[str, dict[str, Any]] = {}

        try:
            if forecast_days:
                forecast_map = await _fetch_daily(
                    client,
                    url=FORECAST_URL,
                    lat=lat,
                    lng=lng,
                    start=min(forecast_days),
                    end=max(forecast_days),
                )
        except Exception as exc:  # noqa: BLE001
            logger.warning("forecast fetch failed: %s", exc)
            historical_days = [trip_start + timedelta(days=i) for i in range(days)]
            forecast_days = []

        if historical_days:
            ref_start = _shift_year(min(historical_days), -1)
            ref_end = _shift_year(max(historical_days), -1)
            year_delta = 1
            if ref_end >= today - timedelta(days=5):
                ref_start = _shift_year(min(historical_days), -2)
                ref_end = _shift_year(max(historical_days), -2)
                year_delta = 2
            try:
                raw_hist = await _fetch_daily(
                    client,
                    url=ARCHIVE_URL,
                    lat=lat,
                    lng=lng,
                    start=ref_start,
                    end=ref_end,
                )
                for d in historical_days:
                    ref = _shift_year(d, -year_delta)
                    historical_map[d.isoformat()] = {
                        **(raw_hist.get(ref.isoformat()) or {}),
                        "reference_date": ref.isoformat(),
                    }
            except Exception as exc:  # noqa: BLE001
                logger.exception("historical weather fetch failed")
                raise HTTPException(status_code=502, detail="天气服务暂时不可用，请稍后再试") from exc

    day_items = []
    for offset in range(days):
        d = trip_start + timedelta(days=offset)
        key = d.isoformat()
        if d in forecast_days and key in forecast_map:
            src = "forecast"
            row = forecast_map[key]
            reference_date = None
        else:
            src = "historical"
            row = historical_map.get(key) or {}
            reference_date = row.get("reference_date")

        code = row.get("weather_code")
        day_items.append(
            {
                "date": key,
                "weekday": WEEKDAY_CN[d.weekday()],
                "temp_max": row.get("temp_max"),
                "temp_min": row.get("temp_min"),
                "precipitation_probability": row.get("precipitation_probability"),
                "precipitation_sum": row.get("precipitation_sum"),
                "weather_code": code,
                "summary": _weather_summary(code),
                "source": src,
                "reference_date": reference_date,
            }
        )

    has_forecast = any(item["source"] == "forecast" for item in day_items)
    has_historical = any(item["source"] == "historical" for item in day_items)
    if has_forecast and has_historical:
        mode = "mixed"
        note = (
            f"部分日期超出未来约 {FORECAST_HORIZON_DAYS} 天可预报范围或早于今天，"
            "已用往年同期实测数据估算，非正式实时预报，仅供参考。"
        )
    elif has_historical:
        mode = "historical"
        note = (
            f"出行日期超出未来约 {FORECAST_HORIZON_DAYS} 天天气预报范围（或早于今天），"
            "以下为往年同期天气参考，非正式预报，请出行前再次确认。"
        )
    else:
        mode = "forecast"
        note = "以下为目的地未来天气预报（来源 Open-Meteo），出行前请以当地最新预报为准。"

    return {
        "city": place["name"],
        "query_city": city.strip(),
        "admin1": place.get("admin1") or "",
        "latitude": lat,
        "longitude": lng,
        "start_date": trip_start.isoformat(),
        "end_date": trip_end.isoformat(),
        "mode": mode,
        "note": note,
        "days": day_items,
    }
