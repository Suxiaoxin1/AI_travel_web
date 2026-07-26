from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas, models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()


def _detect_platform(url: str) -> str:
    if 'ctrip.com' in url or '携程' in url:
        return 'ctrip'
    if 'fliggy.com' in url or 'taobao.com' in url or '飞猪' in url:
        return 'fliggy'
    return 'other'


@router.get("", response_model=schemas.CommonResponse)
def list_bookings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(models.Booking).filter(models.Booking.user_id == current_user.id)\
              .order_by(models.Booking.created_at.desc()).all()
    return schemas.CommonResponse(
        data=[schemas.BookingResponse.model_validate(i).model_dump() for i in items]
    )


@router.post("", response_model=schemas.CommonResponse)
def create_booking(
    payload: schemas.BookingCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = models.Booking(
        user_id=current_user.id,
        province=payload.province,
        keyword=payload.keyword,
        platform=payload.platform or _detect_platform(payload.url),
        url=payload.url,
        order_no=payload.order_no,
        travel_date=payload.travel_date,
        amount=payload.amount,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return schemas.CommonResponse(
        data=schemas.BookingResponse.model_validate(booking).model_dump()
    )


@router.delete("/{booking_id}", response_model=schemas.CommonResponse)
def delete_booking(
    booking_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.user_id == current_user.id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="预定不存在")
    db.delete(booking)
    db.commit()
    return schemas.CommonResponse(message="已删除预定")
