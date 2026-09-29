from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas, models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()


@router.post("/{post_id}/comments", response_model=schemas.CommonResponse)
def create_comment(
    post_id: int,
    payload: schemas.CommentCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(models.Post).filter(models.Post.id == post_id, models.Post.status == "published").first()
    if not post:
        raise HTTPException(status_code=404, detail="游记不存在")

    comment = models.Comment(
        post_id=post_id,
        user_id=current_user.id,
        content=payload.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    post.comments_count = db.query(models.Comment).filter(models.Comment.post_id == post_id, models.Comment.status == "published").count()
    db.commit()
    db.refresh(post)

    return schemas.CommonResponse(data=schemas.CommentResponse(
        id=comment.id,
        user_id=comment.user_id,
        author=comment.user.nickname,
        author_avatar=comment.user.avatar_bg,
        content=comment.content,
        created_at=comment.created_at,
    ).model_dump())


@router.delete("/{post_id}/comments/{comment_id}", response_model=schemas.CommonResponse)
def delete_comment(
    post_id: int,
    comment_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comment = db.query(models.Comment).filter(
        models.Comment.id == comment_id,
        models.Comment.post_id == post_id,
        models.Comment.user_id == current_user.id,
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在或无权限")

    comment.status = "deleted"
    comment.deleted_at = models.now_utc()
    db.commit()

    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if post:
        post.comments_count = db.query(models.Comment).filter(models.Comment.post_id == post_id, models.Comment.status == "published").count()
        db.commit()

    return schemas.CommonResponse(message="已删除评论")
