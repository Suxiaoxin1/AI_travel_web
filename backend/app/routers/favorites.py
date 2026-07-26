from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas, models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()


@router.get("", response_model=schemas.CommonResponse)
def list_favorites(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(models.Favorite).filter(models.Favorite.user_id == current_user.id)\
              .order_by(models.Favorite.created_at.desc()).all()
    return schemas.CommonResponse(
        data=[schemas.FavoriteResponse.model_validate(i).model_dump() for i in items]
    )


@router.post("", response_model=schemas.CommonResponse)
def create_favorite(
    payload: schemas.FavoriteCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    favorite = models.Favorite(
        user_id=current_user.id,
        type=payload.type,
        name=payload.name,
        description=payload.description,
        image_url=payload.image_url,
        plan_json=payload.plan_json,
        external_url=payload.external_url,
    )
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return schemas.CommonResponse(
        data=schemas.FavoriteResponse.model_validate(favorite).model_dump()
    )


@router.delete("/{favorite_id}", response_model=schemas.CommonResponse)
def delete_favorite(
    favorite_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    favorite = db.query(models.Favorite).filter(
        models.Favorite.id == favorite_id,
        models.Favorite.user_id == current_user.id
    ).first()
    if not favorite:
        raise HTTPException(status_code=404, detail="收藏不存在")
    db.delete(favorite)
    db.commit()
    return schemas.CommonResponse(message="已取消收藏")
