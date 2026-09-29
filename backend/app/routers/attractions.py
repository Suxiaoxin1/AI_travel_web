from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db


router = APIRouter()


def serialize_attraction(item: models.Attraction) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "province": item.province,
        "city": item.city,
        "short_desc": item.short_desc,
        "description": item.description,
        "cover_image_url": item.cover_image_url,
        "images": item.images or [],
        "tags": item.tags or [],
        "rating": item.rating,
        "best_season": item.best_season,
        "recommended_duration": item.recommended_duration,
        "opening_hours": item.opening_hours,
        "ticket_hint": item.ticket_hint,
        "longitude": item.longitude,
        "latitude": item.latitude,
        "amap_poi_id": item.amap_poi_id,
        "sort_order": item.sort_order,
        "is_hot": item.is_hot,
        "status": item.status,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }


@router.get("/hot", response_model=schemas.CommonResponse)
def list_hot_attractions(
    limit: int = Query(default=12, ge=1, le=60),
    db: Session = Depends(get_db),
):
    items = (
        db.query(models.Attraction)
        .filter(models.Attraction.status == "published", models.Attraction.is_hot.is_(True))
        .order_by(models.Attraction.sort_order.asc(), models.Attraction.updated_at.desc(), models.Attraction.id.desc())
        .limit(limit)
        .all()
    )
    return schemas.CommonResponse(data=[serialize_attraction(item) for item in items])


@router.get("/lookup", response_model=schemas.CommonResponse)
def lookup_attraction(
    name: str = Query(..., min_length=1, max_length=160),
    db: Session = Depends(get_db),
):
    """按名称查找已发布景点（精确优先，其次包含匹配），供路线页详情卡片使用。"""
    query_name = name.strip()
    if not query_name:
        return schemas.CommonResponse(data=None)

    base = db.query(models.Attraction).filter(models.Attraction.status == "published")
    exact = base.filter(models.Attraction.name == query_name).first()
    if exact:
        return schemas.CommonResponse(data=serialize_attraction(exact))

    fuzzy = (
        base.filter(models.Attraction.name.contains(query_name))
        .order_by(models.Attraction.is_hot.desc(), models.Attraction.sort_order.asc(), models.Attraction.id.desc())
        .first()
    )
    if fuzzy:
        return schemas.CommonResponse(data=serialize_attraction(fuzzy))

    # 反向包含：库里是「大理古城」，查询是「大理古城南门」
    candidates = (
        base.order_by(models.Attraction.is_hot.desc(), models.Attraction.sort_order.asc())
        .limit(80)
        .all()
    )
    for item in candidates:
        if item.name and (item.name in query_name or query_name in item.name):
            return schemas.CommonResponse(data=serialize_attraction(item))

    return schemas.CommonResponse(data=None)