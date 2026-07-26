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
