from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas, models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()


@router.get("", response_model=schemas.CommonResponse)
def list_plans(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(models.TravelPlan).filter(models.TravelPlan.user_id == current_user.id)\
              .order_by(models.TravelPlan.created_at.desc()).all()
    return schemas.CommonResponse(
        data=[schemas.TravelPlanResponse.model_validate(i).model_dump() for i in items]
    )


@router.post("", response_model=schemas.CommonResponse)
def create_plan(
    payload: schemas.TravelPlanCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = models.TravelPlan(
        user_id=current_user.id,
        title=payload.title,
        preference_text=payload.preference_text,
        content_json=payload.content_json,
        input_text=payload.input_text,
        input_images=payload.input_images,
        style=payload.style,
        people=payload.people,
        budget=payload.budget,
        days=payload.days,
        start_date=payload.start_date,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return schemas.CommonResponse(
        data=schemas.TravelPlanResponse.model_validate(plan).model_dump()
    )


@router.get("/{plan_id}", response_model=schemas.CommonResponse)
def get_plan(
    plan_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(models.TravelPlan).filter(
        models.TravelPlan.id == plan_id,
        models.TravelPlan.user_id == current_user.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="行程不存在")
    return schemas.CommonResponse(
        data=schemas.TravelPlanResponse.model_validate(plan).model_dump()
    )


@router.put("/{plan_id}", response_model=schemas.CommonResponse)
def update_plan(
    plan_id: int,
    payload: schemas.TravelPlanCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(models.TravelPlan).filter(
        models.TravelPlan.id == plan_id,
        models.TravelPlan.user_id == current_user.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="行程不存在")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)

    db.commit()
    db.refresh(plan)
    return schemas.CommonResponse(
        data=schemas.TravelPlanResponse.model_validate(plan).model_dump()
    )


@router.delete("/{plan_id}", response_model=schemas.CommonResponse)
def delete_plan(
    plan_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(models.TravelPlan).filter(
        models.TravelPlan.id == plan_id,
        models.TravelPlan.user_id == current_user.id
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="行程不存在")
    db.delete(plan)
    db.commit()
    return schemas.CommonResponse(message="已删除行程")
