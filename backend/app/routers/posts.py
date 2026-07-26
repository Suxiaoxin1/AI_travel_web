from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import schemas, models
from app.database import get_db
from app.dependencies import get_current_user, get_current_user_optional

router = APIRouter()


def _post_response(post: models.Post, current_user: Optional[models.User] = None) -> dict:
    user_liked = False
    if current_user:
        user_liked = any(like.user_id == current_user.id for like in post.likes)
    return schemas.PostResponse(
        id=post.id,
        user_id=post.user_id,
        author=post.user.nickname,
        author_avatar=post.user.avatar_bg,
        title=post.title,
        content=post.content,
        location=post.location,
        rating=post.rating,
        tags=post.tags or [],
        images=post.images or [],
        likes_count=post.likes_count,
        comments_count=post.comments_count,
        user_liked=user_liked,
        created_at=post.created_at,
        updated_at=post.updated_at,
        comments=[schemas.CommentResponse(
            id=c.id,
            user_id=c.user_id,
            author=c.user.nickname,
            author_avatar=c.user.avatar_bg,
            content=c.content,
            created_at=c.created_at,
        ) for c in post.comments],
    ).model_dump()


@router.get("", response_model=schemas.CommonResponse)
def list_posts(
    search: Optional[str] = Query(None, description="搜索标题/内容/地点/标签"),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    query = db.query(models.Post).order_by(models.Post.created_at.desc())
    if search:
        q = f"%{search}%"
        query = query.filter(
            or_(
                models.Post.title.ilike(q),
                models.Post.content.ilike(q),
                models.Post.location.ilike(q),
                models.Post.tags.contains([search]),
            )
        )
    posts = query.all()
    return schemas.CommonResponse(data=[_post_response(p, current_user) for p in posts])


@router.get("/{post_id}", response_model=schemas.CommonResponse)
def get_post(
    post_id: int,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="游记不存在")
    return schemas.CommonResponse(data=_post_response(post, current_user))


@router.post("", response_model=schemas.CommonResponse)
def create_post(
    payload: schemas.PostCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = models.Post(
        user_id=current_user.id,
        title=payload.title,
        content=payload.content,
        location=payload.location,
        rating=payload.rating,
        tags=payload.tags or [],
        images=payload.images or [],
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return schemas.CommonResponse(data=_post_response(post, current_user))


@router.delete("/{post_id}", response_model=schemas.CommonResponse)
def delete_post(
    post_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(models.Post).filter(
        models.Post.id == post_id,
        models.Post.user_id == current_user.id,
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="游记不存在或无权限")
    db.delete(post)
    db.commit()
    return schemas.CommonResponse(message="已删除游记")
