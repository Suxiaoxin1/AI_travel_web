from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas, models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()


@router.get("", response_model=schemas.CommonResponse)
def list_routes(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(models.Route).filter(models.Route.user_id == current_user.id)\
              .order_by(models.Route.created_at.desc()).all()
    return schemas.CommonResponse(
        data=[schemas.RouteResponse.model_validate(i).model_dump() for i in items]
    )


@router.post("", response_model=schemas.CommonResponse)
def create_route(
    payload: schemas.RouteCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 如果传了 plan_id，校验该行程属于当前用户
    if payload.plan_id:
        plan = db.query(models.TravelPlan).filter(
            models.TravelPlan.id == payload.plan_id,
            models.TravelPlan.user_id == current_user.id
        ).first()
        if not plan:
            raise HTTPException(status_code=404, detail="关联行程不存在")

    route = models.Route(
        user_id=current_user.id,
        plan_id=payload.plan_id,
        title=payload.title,
        strategy=payload.strategy,
        days_json=payload.days_json,
    )
    db.add(route)
    db.commit()
    db.refresh(route)
    return schemas.CommonResponse(
        data=schemas.RouteResponse.model_validate(route).model_dump()
    )


@router.get("/{route_id}", response_model=schemas.CommonResponse)
def get_route(
    route_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    route = db.query(models.Route).filter(
        models.Route.id == route_id,
        models.Route.user_id == current_user.id
    ).first()
    if not route:
        raise HTTPException(status_code=404, detail="路线不存在")
    return schemas.CommonResponse(
        data=schemas.RouteResponse.model_validate(route).model_dump()
    )


@router.put("/{route_id}", response_model=schemas.CommonResponse)
def update_route(
    route_id: int,
    payload: schemas.RouteCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    route = db.query(models.Route).filter(
        models.Route.id == route_id,
        models.Route.user_id == current_user.id
    ).first()
    if not route:
        raise HTTPException(status_code=404, detail="路线不存在")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(route, field, value)

    db.commit()
    db.refresh(route)
    return schemas.CommonResponse(
        data=schemas.RouteResponse.model_validate(route).model_dump()
    )


@router.delete("/{route_id}", response_model=schemas.CommonResponse)
def delete_route(
    route_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    route = db.query(models.Route).filter(
        models.Route.id == route_id,
        models.Route.user_id == current_user.id
    ).first()
    if not route:
        raise HTTPException(status_code=404, detail="路线不存在")
    db.delete(route)
    db.commit()
    return schemas.CommonResponse(message="已删除路线")
