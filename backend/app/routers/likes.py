from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas, models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter()


@router.post("/{post_id}/likes", response_model=schemas.CommonResponse)
def toggle_like(
    post_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="游记不存在")

    existing = db.query(models.Like).filter(
        models.Like.post_id == post_id,
        models.Like.user_id == current_user.id,
    ).first()

    if existing:
        db.delete(existing)
        liked = False
    else:
        like = models.Like(post_id=post_id, user_id=current_user.id)
        db.add(like)
        liked = True

    db.commit()

    post.likes_count = db.query(models.Like).filter(models.Like.post_id == post_id).count()
    db.commit()
    db.refresh(post)

    return schemas.CommonResponse(data={"liked": liked, "likes_count": post.likes_count})
