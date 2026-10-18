"""手账 CRUD：保存 / 列表 / 读取 / 更新 / 删除。

手账「生成」不在本路由。旧 Agnes 视觉+文案生成已从前端移除；
后续模板排版生成将通过独立 diary 服务接入，本模块仅负责存取。
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas, models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()


@router.get("", response_model=schemas.CommonResponse)
def list_journals(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(models.Journal).filter(models.Journal.user_id == current_user.id)\
              .order_by(models.Journal.created_at.desc()).all()
    return schemas.CommonResponse(
        data=[schemas.JournalResponse.model_validate(i).model_dump() for i in items]
    )


@router.post("", response_model=schemas.CommonResponse)
def create_journal(
    payload: schemas.JournalCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    journal = models.Journal(
        user_id=current_user.id,
        title=payload.title,
        style=payload.style,
        location=payload.location,
        travel_date=payload.travel_date,
        mood=payload.mood,
        photos=payload.photos,
        layout_json=payload.layout_json,
        content_html=payload.content_html,
        video_url=payload.video_url,
        cover_url=payload.cover_url,
    )
    db.add(journal)
    db.commit()
    db.refresh(journal)
    return schemas.CommonResponse(
        data=schemas.JournalResponse.model_validate(journal).model_dump()
    )


@router.get("/{journal_id}", response_model=schemas.CommonResponse)
def get_journal(
    journal_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    journal = db.query(models.Journal).filter(
        models.Journal.id == journal_id,
        models.Journal.user_id == current_user.id
    ).first()
    if not journal:
        raise HTTPException(status_code=404, detail="手账不存在")
    return schemas.CommonResponse(
        data=schemas.JournalResponse.model_validate(journal).model_dump()
    )


@router.put("/{journal_id}", response_model=schemas.CommonResponse)
def update_journal(
    journal_id: int,
    payload: schemas.JournalCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    journal = db.query(models.Journal).filter(
        models.Journal.id == journal_id,
        models.Journal.user_id == current_user.id
    ).first()
    if not journal:
        raise HTTPException(status_code=404, detail="手账不存在")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(journal, field, value)

    db.commit()
    db.refresh(journal)
    return schemas.CommonResponse(
        data=schemas.JournalResponse.model_validate(journal).model_dump()
    )


@router.delete("/{journal_id}", response_model=schemas.CommonResponse)
def delete_journal(
    journal_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    journal = db.query(models.Journal).filter(
        models.Journal.id == journal_id,
        models.Journal.user_id == current_user.id
    ).first()
    if not journal:
        raise HTTPException(status_code=404, detail="手账不存在")
    db.delete(journal)
    db.commit()
    return schemas.CommonResponse(message="已删除手账")
