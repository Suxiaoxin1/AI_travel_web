from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import schemas, models
from app.booking_links import (
    default_booking_title,
    is_allowed_booking_url,
    normalize_booking_url,
    normalize_platform,
)
from app.database import get_db
from app.dependencies import get_current_user
from app.models import now_utc

router = APIRouter()


def _serialize(booking: models.Booking) -> dict:
    return schemas.BookingResponse.model_validate(booking).model_dump()


def _require_allowed_url(url: str) -> str:
    normalized = normalize_booking_url(url)
    if not is_allowed_booking_url(normalized):
        raise HTTPException(status_code=400, detail="仅支持保存携程/飞猪等旅行平台商品链接")
    return normalized


def _resolve_source_name(payload: schemas.BookingCreate) -> Optional[str]:
    return payload.source_name or payload.province


def _find_by_url(db: Session, user_id: int, url: str) -> Optional[models.Booking]:
    return (
        db.query(models.Booking)
        .filter(models.Booking.user_id == user_id, models.Booking.url == url)
        .first()
    )


@router.get("", response_model=schemas.CommonResponse)
def list_bookings(
    kind: Optional[str] = Query(default=None, pattern="^(intent|order)$"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.Booking).filter(models.Booking.user_id == current_user.id)
    if kind:
        query = query.filter(models.Booking.kind == kind)
    items = query.order_by(models.Booking.created_at.desc()).all()
    return schemas.CommonResponse(data=[_serialize(i) for i in items])


@router.post("", response_model=schemas.CommonResponse)
def create_booking(
    payload: schemas.BookingCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    url = _require_allowed_url(payload.url)
    platform = normalize_platform(payload.platform, url)
    source_name = _resolve_source_name(payload)
    title = (payload.title or "").strip() or default_booking_title(source_name, platform)
    link_type = payload.link_type or "search"
    kind = payload.kind or "intent"

    existing = _find_by_url(db, current_user.id, url)
    if existing:
        existing.title = title
        if payload.note is not None:
            existing.note = payload.note
        existing.kind = kind
        existing.platform = platform
        existing.link_type = link_type
        existing.source_type = payload.source_type or existing.source_type
        existing.source_name = source_name or existing.source_name
        existing.province = payload.province or existing.province or source_name
        existing.keyword = payload.keyword or existing.keyword
        if payload.order_no is not None:
            existing.order_no = payload.order_no
        if payload.travel_date is not None:
            existing.travel_date = payload.travel_date
        if payload.amount is not None:
            existing.amount = payload.amount
        existing.updated_at = now_utc()
        db.commit()
        db.refresh(existing)
        return schemas.CommonResponse(
            message="已在收藏中，已更新信息",
            data=_serialize(existing),
        )

    booking = models.Booking(
        user_id=current_user.id,
        kind=kind,
        title=title,
        note=payload.note,
        source_type=payload.source_type,
        source_name=source_name,
        link_type=link_type,
        province=payload.province or source_name,
        keyword=payload.keyword,
        platform=platform,
        url=url,
        order_no=payload.order_no,
        travel_date=payload.travel_date,
        amount=payload.amount,
        updated_at=now_utc(),
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return schemas.CommonResponse(
        message="已添加到我的预定",
        data=_serialize(booking),
    )


@router.patch("/{booking_id}", response_model=schemas.CommonResponse)
def update_booking(
    booking_id: int,
    payload: schemas.BookingUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = (
        db.query(models.Booking)
        .filter(models.Booking.id == booking_id, models.Booking.user_id == current_user.id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="预定不存在")

    data = payload.model_dump(exclude_unset=True)
    if "url" in data and data["url"] is not None:
        new_url = _require_allowed_url(data["url"])
        conflict = _find_by_url(db, current_user.id, new_url)
        if conflict and conflict.id != booking.id:
            raise HTTPException(status_code=409, detail="该链接已在收藏中")
        booking.url = new_url
        if "platform" not in data or data.get("platform") is None:
            # Re-detect from the new URL; ignore previous platform label.
            booking.platform = normalize_platform(None, new_url)
        data.pop("url", None)

    if "platform" in data and data["platform"] is not None:
        booking.platform = normalize_platform(data["platform"], booking.url)
        data.pop("platform", None)

    for key, value in data.items():
        setattr(booking, key, value)

    booking.updated_at = now_utc()
    db.commit()
    db.refresh(booking)
    return schemas.CommonResponse(message="已更新", data=_serialize(booking))


@router.delete("/{booking_id}", response_model=schemas.CommonResponse)
def delete_booking(
    booking_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.user_id == current_user.id,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="预定不存在")
    db.delete(booking)
    db.commit()
    return schemas.CommonResponse(message="已删除预定")
