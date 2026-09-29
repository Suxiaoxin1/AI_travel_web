from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException

from app import schemas, models
from app.config import settings
from app.dependencies import get_current_user

router = APIRouter()


def format_point(point: schemas.Coordinate) -> str:
    return f"{point.lng:.6f},{point.lat:.6f}"


def parse_polyline(polyline: str) -> list[list[float]]:
    path = []
    for pair in (polyline or '').split(';'):
        try:
            lng, lat = pair.split(',', 1)
            path.append([float(lng), float(lat)])
        except (ValueError, TypeError):
            continue
    return path


def normalize_route(payload: dict[str, Any]) -> dict[str, Any]:
    paths = payload.get('route', {}).get('paths') or []
    if not paths:
        raise HTTPException(status_code=502, detail='高德未返回可行驶路线')

    selected = paths[0]
    path = []
    for step in selected.get('steps') or []:
        path.extend(parse_polyline(step.get('polyline', '')))

    if len(path) < 2:
        raise HTTPException(status_code=502, detail='高德返回的路线轨迹为空')

    return {
        'path': path,
        'distance': float(selected.get('distance') or 0),
        'time': float(selected.get('duration') or 0),
    }


def normalize_geocode(payload: dict[str, Any]) -> dict[str, Any]:
    geocodes = payload.get('geocodes') or []
    if not geocodes or not geocodes[0].get('location'):
        raise HTTPException(status_code=404, detail='高德未找到该景点的位置')
    lng, lat = geocodes[0]['location'].split(',', 1)
    return {
        'lng': float(lng),
        'lat': float(lat),
        'formatted_address': geocodes[0].get('formatted_address') or '',
        'source': 'amap_geocode',
    }


def _poi_name_score(keyword: str, poi_name: str) -> int:
    kw = (keyword or '').strip()
    name = (poi_name or '').strip()
    if not kw or not name:
        return 0
    if kw == name:
        return 100
    if kw in name or name in kw:
        return 80 + min(len(kw), 19)
    # 公共子串粗分
    overlap = sum(1 for ch in set(kw) if ch in name)
    return overlap


def normalize_poi_locate(payload: dict[str, Any], keyword: str = '') -> dict[str, Any]:
    pois = payload.get('pois') or []
    if not pois:
        raise HTTPException(status_code=404, detail='高德未找到该景点的位置')
    ranked = []
    for poi in pois:
        location = poi.get('location') or ''
        if ',' not in location:
            continue
        score = _poi_name_score(keyword, poi.get('name') or '')
        ranked.append((score, poi))
    if not ranked:
        raise HTTPException(status_code=404, detail='高德未找到该景点的位置')
    ranked.sort(key=lambda item: item[0], reverse=True)
    poi = ranked[0][1]
    lng_s, lat_s = poi['location'].split(',', 1)
    address_parts = [
        poi.get('pname') or '',
        poi.get('cityname') or '',
        poi.get('adname') or '',
        poi.get('address') or '',
    ]
    formatted = ''.join(address_parts) or (poi.get('name') or '')
    return {
        'lng': float(lng_s),
        'lat': float(lat_s),
        'name': poi.get('name') or keyword,
        'formatted_address': formatted,
        'source': 'amap_poi',
    }


def normalize_transit(payload: dict[str, Any]) -> dict[str, Any]:
    transits = payload.get('route', {}).get('transits') or []
    if not transits:
        raise HTTPException(status_code=502, detail='高德未返回可用公交方案')

    selected = transits[0]
    segments = selected.get('segments') or []
    steps: list[str] = []
    for segment in segments:
        walking = segment.get('walking') or {}
        if walking.get('distance'):
            steps.append(f"步行 {walking['distance']} 米")
        for bus in segment.get('bus', {}).get('buslines') or []:
            name = bus.get('name') or '公交/地铁'
            duration = int(float(bus.get('duration') or 0) / 60)
            steps.append(f"乘坐 {name}{f'（约 {duration} 分钟）' if duration else ''}")
        railway = segment.get('railway') or {}
        if railway.get('name'):
            steps.append(f"乘坐 {railway['name']}")
    return {
        'mode': 'transit',
        'distance': float(selected.get('distance') or 0),
        'time': float(selected.get('duration') or 0),
        'cost': float(selected.get('cost') or 0),
        'walking_distance': float(selected.get('walking_distance') or 0),
        'transfers': max(len(segments) - 1, 0),
        'steps': steps,
    }


@router.post('/driving', response_model=schemas.CommonResponse)
async def driving_route(
    payload: schemas.MapDrivingRequest,
    _: models.User = Depends(get_current_user),
):
    if not settings.AMAP_WEB_SERVICE_KEY:
        raise HTTPException(status_code=503, detail='高德 Web 服务路线 Key 尚未配置')

    params = {
        'key': settings.AMAP_WEB_SERVICE_KEY,
        'origin': format_point(payload.origin),
        'destination': format_point(payload.destination),
        'strategy': payload.strategy,
        'extensions': 'all',
        'output': 'json',
    }
    if payload.waypoints:
        params['waypoints'] = ';'.join(format_point(point) for point in payload.waypoints)

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(12.0, connect=3.0)) as client:
            response = await client.get(f"{settings.AMAP_WEB_SERVICE_BASE}/direction/driving", params=params)
            response.raise_for_status()
            amap_payload = response.json()
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail='高德路线服务请求超时') from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail='高德路线服务暂时不可用') from exc

    if amap_payload.get('status') != '1':
        info = amap_payload.get('info') or '高德路线服务请求失败'
        raise HTTPException(status_code=502, detail=f'高德路线服务失败：{info}')

    return schemas.CommonResponse(data=normalize_route(amap_payload))


@router.post('/transit', response_model=schemas.CommonResponse)
async def transit_route(
    payload: schemas.MapTransitRequest,
    _: models.User = Depends(get_current_user),
):
    if not settings.AMAP_WEB_SERVICE_KEY:
        raise HTTPException(status_code=503, detail='高德 Web 服务路线 Key 尚未配置')

    params = {
        'key': settings.AMAP_WEB_SERVICE_KEY,
        'origin': format_point(payload.origin),
        'destination': format_point(payload.destination),
        'city': payload.origin_city,
        'cityd': payload.destination_city,
        'strategy': payload.strategy,
        'output': 'json',
    }
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(12.0, connect=3.0)) as client:
            response = await client.get(
                f"{settings.AMAP_WEB_SERVICE_BASE}/direction/transit/integrated", params=params
            )
            response.raise_for_status()
            amap_payload = response.json()
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail='高德公交路线服务请求超时') from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail='高德公交路线服务暂时不可用') from exc

    if amap_payload.get('status') != '1':
        info = amap_payload.get('info') or '高德公交路线服务请求失败'
        raise HTTPException(status_code=502, detail=f'高德公交路线服务失败：{info}')
    return schemas.CommonResponse(data=normalize_transit(amap_payload))


@router.post('/geocode', response_model=schemas.CommonResponse)
async def geocode_spot(
    payload: schemas.MapGeocodeRequest,
    _: models.User = Depends(get_current_user),
):
    if not settings.AMAP_WEB_SERVICE_KEY:
        raise HTTPException(status_code=503, detail='高德 Web 服务路线 Key 尚未配置')

    params = {
        'key': settings.AMAP_WEB_SERVICE_KEY,
        'address': payload.address,
        'output': 'json',
    }
    if payload.city:
        params['city'] = payload.city

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=3.0)) as client:
            response = await client.get(f"{settings.AMAP_WEB_SERVICE_BASE}/geocode/geo", params=params)
            response.raise_for_status()
            amap_payload = response.json()
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail='高德地理编码请求超时') from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail='高德地理编码服务暂时不可用') from exc

    if amap_payload.get('status') != '1':
        info = amap_payload.get('info') or '高德地理编码请求失败'
        raise HTTPException(status_code=502, detail=f'高德地理编码失败：{info}')

    return schemas.CommonResponse(data=normalize_geocode(amap_payload))


@router.post('/locate', response_model=schemas.CommonResponse)
async def locate_spot(
    payload: schemas.MapLocateRequest,
    _: models.User = Depends(get_current_user),
):
    """景点精定位：POI 关键字搜索（城市约束）→ 地理编码兜底。"""
    if not settings.AMAP_WEB_SERVICE_KEY:
        raise HTTPException(status_code=503, detail='高德 Web 服务路线 Key 尚未配置')

    base = settings.AMAP_WEB_SERVICE_BASE.rstrip('/')
    keyword = payload.keyword.strip()
    city = (payload.city or '').strip() or None

    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=3.0)) as client:
        # 1) POI 文本搜索
        poi_params: dict[str, Any] = {
            'key': settings.AMAP_WEB_SERVICE_KEY,
            'keywords': keyword,
            'offset': 8,
            'page': 1,
            'extensions': 'base',
            'output': 'json',
        }
        if city:
            poi_params['city'] = city
            poi_params['citylimit'] = 'true'
        try:
            resp = await client.get(f'{base}/place/text', params=poi_params)
            resp.raise_for_status()
            poi_payload = resp.json()
            if str(poi_payload.get('status')) == '1' and (poi_payload.get('pois') or []):
                return schemas.CommonResponse(data=normalize_poi_locate(poi_payload, keyword))
        except HTTPException:
            raise
        except Exception:
            pass

        # 城市限制过严时放宽一次
        if city:
            try:
                loose = dict(poi_params)
                loose.pop('citylimit', None)
                resp = await client.get(f'{base}/place/text', params=loose)
                resp.raise_for_status()
                poi_payload = resp.json()
                if str(poi_payload.get('status')) == '1' and (poi_payload.get('pois') or []):
                    return schemas.CommonResponse(data=normalize_poi_locate(poi_payload, keyword))
            except Exception:
                pass

        # 2) 地理编码兜底
        geo_params: dict[str, Any] = {
            'key': settings.AMAP_WEB_SERVICE_KEY,
            'address': f'{city}{keyword}' if city else keyword,
            'output': 'json',
        }
        if city:
            geo_params['city'] = city
        try:
            resp = await client.get(f'{base}/geocode/geo', params=geo_params)
            resp.raise_for_status()
            geo_payload = resp.json()
        except httpx.TimeoutException as exc:
            raise HTTPException(status_code=504, detail='高德定位请求超时') from exc
        except (httpx.HTTPError, ValueError) as exc:
            raise HTTPException(status_code=502, detail='高德定位服务暂时不可用') from exc

        if geo_payload.get('status') != '1':
            info = geo_payload.get('info') or '高德定位失败'
            raise HTTPException(status_code=404, detail=f'未找到景点位置：{info}')
        return schemas.CommonResponse(data=normalize_geocode(geo_payload))


@router.post('/walking', response_model=schemas.CommonResponse)
async def walking_route(
    payload: schemas.MapWalkingRequest,
    _: models.User = Depends(get_current_user),
):
    if not settings.AMAP_WEB_SERVICE_KEY:
        raise HTTPException(status_code=503, detail='高德 Web 服务路线 Key 尚未配置')

    params = {
        'key': settings.AMAP_WEB_SERVICE_KEY,
        'origin': format_point(payload.origin),
        'destination': format_point(payload.destination),
        'output': 'json',
    }
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(12.0, connect=3.0)) as client:
            response = await client.get(
                f"{settings.AMAP_WEB_SERVICE_BASE.rstrip('/')}/direction/walking",
                params=params,
            )
            response.raise_for_status()
            amap_payload = response.json()
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail='高德步行路线请求超时') from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail='高德步行路线服务暂时不可用') from exc

    if amap_payload.get('status') != '1':
        info = amap_payload.get('info') or '高德步行路线请求失败'
        raise HTTPException(status_code=502, detail=f'高德步行路线失败：{info}')

    data = normalize_route(amap_payload)
    data['mode'] = 'walk'
    return schemas.CommonResponse(data=data)
