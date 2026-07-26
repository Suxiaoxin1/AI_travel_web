from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import schemas, models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/me", response_model=schemas.CommonResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return schemas.CommonResponse(
        data=schemas.UserResponse.model_validate(current_user).model_dump()
    )


@router.put("/me", response_model=schemas.CommonResponse)
def update_me(
    payload: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.nickname is not None:
        current_user.nickname = payload.nickname.strip()
    if payload.avatar_bg is not None:
        current_user.avatar_bg = payload.avatar_bg
    db.commit()
    db.refresh(current_user)
    return schemas.CommonResponse(
        data=schemas.UserResponse.model_validate(current_user).model_dump()
    )
