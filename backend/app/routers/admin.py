from datetime import datetime, timedelta, timezone
from random import choice
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.auth import get_password_hash
from app.database import get_db
from app.dependencies import get_current_admin
from app.runtime_secrets import apply_secret_updates, describe_secrets


router = APIRouter()

_AVATAR_BACKGROUNDS = [
    "linear-gradient(135deg, #0D6B5C, #1A8A7A)",
    "linear-gradient(135deg, #7BA4D4, #5A8ABF)",
    "linear-gradient(135deg, #D4A84B, #C2960C)",
    "linear-gradient(135deg, #C23B22, #D48A7B)",
    "linear-gradient(135deg, #9B7BD4, #7B5FBF)",
]


def _request_ip(request: Request) -> Optional[str]:
    forwarded = request.headers.get("x-forwarded-for", "")
    return (forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else None)) or None


def _audit(
    db: Session,
    *,
    actor: models.User,
    action: str,
    request: Request,
    target: Optional[models.User] = None,
    target_type: Optional[str] = None,
    target_id: Optional[int] = None,
    metadata: Optional[dict] = None,
) -> None:
    db.add(models.AdminAuditLog(
        actor_id=actor.id,
        target_user_id=target.id if target else None,
        target_type=target_type or ("user" if target else None),
        target_id=target_id if target_id is not None else (target.id if target else None),
        action=action,
        metadata_json=metadata,
        ip_address=_request_ip(request),
    ))


def _pagination(query, page: int, page_size: int):
    total = query.count()
    return query.offset((page - 1) * page_size).limit(page_size).all(), total


def _serialize_user(user: models.User, db: Session) -> dict:
    return schemas.AdminUserResponse.model_validate({
        "id": user.id,
        "account": user.account,
        "nickname": user.nickname,
        "avatar_bg": user.avatar_bg,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "home_city": user.home_city,
        "last_login_at": user.last_login_at,
        "status": user.status,
        "is_admin": user.is_admin,
        "created_at": user.created_at,
        "posts_count": db.query(func.count(models.Post.id)).filter(models.Post.user_id == user.id).scalar() or 0,
        "plans_count": db.query(func.count(models.TravelPlan.id)).filter(models.TravelPlan.user_id == user.id).scalar() or 0,
        "journals_count": db.query(func.count(models.Journal.id)).filter(models.Journal.user_id == user.id).scalar() or 0,
        "routes_count": db.query(func.count(models.Route.id)).filter(models.Route.user_id == user.id).scalar() or 0,
        "favorites_count": db.query(func.count(models.Favorite.id)).filter(models.Favorite.user_id == user.id).scalar() or 0,
        "bookings_count": db.query(func.count(models.Booking.id)).filter(models.Booking.user_id == user.id).scalar() or 0,
        "comments_count": db.query(func.count(models.Comment.id)).filter(models.Comment.user_id == user.id).scalar() or 0,
    }).model_dump()


def _serialize_attraction(item: models.Attraction) -> dict:
    return {
        "id": item.id, "name": item.name, "province": item.province, "city": item.city,
        "short_desc": item.short_desc, "description": item.description, "cover_image_url": item.cover_image_url,
        "images": item.images or [], "tags": item.tags or [], "rating": item.rating,
        "best_season": item.best_season, "recommended_duration": item.recommended_duration,
        "opening_hours": item.opening_hours, "ticket_hint": item.ticket_hint,
        "longitude": item.longitude, "latitude": item.latitude, "amap_poi_id": item.amap_poi_id,
        "sort_order": item.sort_order, "is_hot": item.is_hot, "status": item.status,
        "created_at": item.created_at, "updated_at": item.updated_at,
    }


def _serialize_post(item: models.Post) -> dict:
    return {
        "id": item.id, "user_id": item.user_id,
        "author": item.user.nickname if item.user else "已注销用户",
        "author_account": item.user.account if item.user else None,
        "title": item.title, "content": item.content, "location": item.location,
        "rating": item.rating, "tags": item.tags or [], "images": item.images or [],
        "likes_count": item.likes_count or 0, "comments_count": item.comments_count or 0,
        "status": item.status, "moderated_at": item.moderated_at,
        "moderation_reason": item.moderation_reason, "created_at": item.created_at, "updated_at": item.updated_at,
    }


def _serialize_comment(item: models.Comment) -> dict:
    return {
        "id": item.id, "post_id": item.post_id, "post_title": item.post.title if item.post else None,
        "user_id": item.user_id, "author": item.user.nickname if item.user else "已注销用户",
        "author_account": item.user.account if item.user else None, "content": item.content,
        "status": item.status, "moderated_at": item.moderated_at,
        "moderation_reason": item.moderation_reason, "created_at": item.created_at,
    }


def _set_content_status(item, payload: schemas.ContentStatusUpdate, admin: models.User) -> None:
    item.status = payload.status
    item.moderated_by = admin.id
    item.moderated_at = datetime.now(timezone.utc)
    item.moderation_reason = payload.reason
    item.deleted_at = datetime.now(timezone.utc) if payload.status == "deleted" else None


@router.get("/dashboard", response_model=schemas.CommonResponse)
def dashboard(current_admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    users_total = db.query(func.count(models.User.id)).scalar() or 0
    active_users = db.query(func.count(models.User.id)).filter(models.User.status == "active").scalar() or 0
    suspended_users = db.query(func.count(models.User.id)).filter(models.User.status == "suspended").scalar() or 0
    posts_total = db.query(func.count(models.Post.id)).scalar() or 0
    published_posts = db.query(func.count(models.Post.id)).filter(models.Post.status == "published").scalar() or 0
    hidden_posts = db.query(func.count(models.Post.id)).filter(models.Post.status == "hidden").scalar() or 0
    deleted_posts = db.query(func.count(models.Post.id)).filter(models.Post.status == "deleted").scalar() or 0
    plans_total = db.query(func.count(models.TravelPlan.id)).scalar() or 0
    journals_total = db.query(func.count(models.Journal.id)).scalar() or 0
    attractions_total = db.query(func.count(models.Attraction.id)).scalar() or 0
    published_attractions = (
        db.query(func.count(models.Attraction.id)).filter(models.Attraction.status == "published").scalar() or 0
    )
    draft_attractions = (
        db.query(func.count(models.Attraction.id)).filter(models.Attraction.status == "draft").scalar() or 0
    )
    archived_attractions = (
        db.query(func.count(models.Attraction.id)).filter(models.Attraction.status == "archived").scalar() or 0
    )
    comments_total = db.query(func.count(models.Comment.id)).scalar() or 0
    published_comments = (
        db.query(func.count(models.Comment.id)).filter(models.Comment.status == "published").scalar() or 0
    )
    hidden_comments = db.query(func.count(models.Comment.id)).filter(models.Comment.status == "hidden").scalar() or 0
    deleted_comments = (
        db.query(func.count(models.Comment.id)).filter(models.Comment.status == "deleted").scalar() or 0
    )

    since = datetime.now(timezone.utc) - timedelta(days=7)
    recent_suspended_users = (
        db.query(func.count(models.User.id))
        .filter(models.User.status == "suspended", models.User.updated_at >= since)
        .scalar()
        or 0
    )

    todos = [
        {
            "key": "hidden_posts",
            "title": "待复核游记",
            "count": hidden_posts,
            "hint": "已隐藏、等待恢复或进一步处理",
            "href": "/admin/posts?status=hidden",
        },
        {
            "key": "hidden_comments",
            "title": "待复核评论",
            "count": hidden_comments,
            "hint": "已隐藏评论，可恢复或删除",
            "href": "/admin/comments?status=hidden",
        },
        {
            "key": "draft_attractions",
            "title": "草稿景点",
            "count": draft_attractions,
            "hint": "尚未发布到前台的运营景点",
            "href": "/admin/attractions?status=draft",
        },
        {
            "key": "recent_suspended",
            "title": "近期停用账号",
            "count": recent_suspended_users,
            "hint": "近 7 天内被停用的用户",
            "href": "/admin/users?status=suspended",
        },
    ]

    data = schemas.AdminDashboardResponse(
        users_total=users_total,
        active_users=active_users,
        suspended_users=suspended_users,
        posts_total=posts_total,
        plans_total=plans_total,
        journals_total=journals_total,
        attractions_total=attractions_total,
        published_attractions=published_attractions,
        draft_attractions=draft_attractions,
        archived_attractions=archived_attractions,
        published_posts=published_posts,
        hidden_posts=hidden_posts,
        deleted_posts=deleted_posts,
        comments_total=comments_total,
        published_comments=published_comments,
        hidden_comments=hidden_comments,
        deleted_comments=deleted_comments,
        recent_suspended_users=recent_suspended_users,
        content_mix=[
            {"label": "游记", "value": posts_total},
            {"label": "行程", "value": plans_total},
            {"label": "手账", "value": journals_total},
            {"label": "景点", "value": attractions_total},
        ],
        user_status_mix=[
            {"label": "正常", "value": active_users},
            {"label": "已停用", "value": suspended_users},
        ],
        attraction_status_mix=[
            {"label": "已发布", "value": published_attractions},
            {"label": "草稿", "value": draft_attractions},
            {"label": "已归档", "value": archived_attractions},
        ],
        moderation_mix=[
            {"label": "隐藏游记", "value": hidden_posts},
            {"label": "隐藏评论", "value": hidden_comments},
            {"label": "草稿景点", "value": draft_attractions},
            {"label": "近7日停用", "value": recent_suspended_users},
        ],
        todos=todos,
    )
    return schemas.CommonResponse(data=data.model_dump())


@router.get("/users", response_model=schemas.CommonResponse)
def list_users(
    keyword: str = Query(default="", max_length=100),
    status: Optional[str] = Query(default=None, pattern="^(active|suspended)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(models.User).options(joinedload(models.User.roles)).order_by(models.User.created_at.desc())
    if keyword.strip():
        needle = f"%{keyword.strip()}%"
        query = query.filter(or_(models.User.nickname.ilike(needle), models.User.account.ilike(needle)))
    if status:
        query = query.filter(models.User.status == status)
    users, total = _pagination(query, page, page_size)
    return schemas.CommonResponse(data={"items": [_serialize_user(user, db) for user in users], "total": total, "page": page, "page_size": page_size})


@router.post("/users", response_model=schemas.CommonResponse)
def create_user(
    payload: schemas.AdminUserCreate,
    request: Request,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if db.query(models.User.id).filter(models.User.account == payload.account).first():
        raise HTTPException(status_code=400, detail="该账号已被注册")

    user = models.User(
        account=payload.account,
        nickname=payload.nickname or payload.account,
        hashed_password=get_password_hash(payload.password),
        avatar_bg=choice(_AVATAR_BACKGROUNDS),
        status="active",
    )
    db.add(user)
    db.flush()

    if payload.is_admin:
        role = db.query(models.Role).filter(models.Role.key == "admin").first()
        if not role:
            role = models.Role(key="admin", name="管理员")
            db.add(role)
            db.flush()
        user.roles.append(role)

    _audit(
        db,
        actor=current_admin,
        target=user,
        action="user_created",
        request=request,
        metadata={"account": user.account, "is_admin": bool(payload.is_admin)},
    )
    db.commit()
    user = db.query(models.User).options(joinedload(models.User.roles)).filter(models.User.id == user.id).first()
    return schemas.CommonResponse(
        data=_serialize_user(user, db),
        message="管理员账号已创建" if payload.is_admin else "账号已创建",
    )


@router.get("/users/{user_id}", response_model=schemas.CommonResponse)
def get_user_detail(user_id: int, current_admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(models.User).options(joinedload(models.User.roles)).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    data = _serialize_user(user, db)
    activities = []
    for item in db.query(models.Post).filter(models.Post.user_id == user.id).order_by(models.Post.created_at.desc()).limit(5):
        activities.append({"type": "share", "title": item.title or "未命名游记", "created_at": item.created_at, "status": item.status})
    for item in db.query(models.TravelPlan).filter(models.TravelPlan.user_id == user.id).order_by(models.TravelPlan.created_at.desc()).limit(5):
        activities.append({"type": "plan", "title": item.title or "未命名行程", "created_at": item.created_at})
    for item in db.query(models.Journal).filter(models.Journal.user_id == user.id).order_by(models.Journal.created_at.desc()).limit(5):
        activities.append({"type": "journal", "title": item.title or "未命名手账", "created_at": item.created_at})
    data["recent_activity"] = sorted(activities, key=lambda entry: entry["created_at"], reverse=True)[:8]
    return schemas.CommonResponse(data=data)


@router.patch("/users/{user_id}/status", response_model=schemas.CommonResponse)
def update_user_status(user_id: int, payload: schemas.AdminUserStatusUpdate, request: Request, current_admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    if user.id == current_admin.id and payload.status != "active":
        raise HTTPException(status_code=400, detail="不能停用当前登录的管理员账号")
    before = user.status
    if before != payload.status:
        user.status = payload.status
        if payload.status == "suspended":
            db.query(models.AuthSession).filter(models.AuthSession.user_id == user.id, models.AuthSession.revoked_at.is_(None)).update({models.AuthSession.revoked_at: func.now()}, synchronize_session=False)
        _audit(db, actor=current_admin, target=user, action="user_status_updated", request=request, metadata={"before": before, "after": payload.status})
        db.commit()
    return schemas.CommonResponse(data={"id": user.id, "status": user.status}, message="账号状态已更新")


@router.patch("/users/{user_id}/admin", response_model=schemas.CommonResponse)
def update_user_admin_role(user_id: int, payload: schemas.AdminUserRoleUpdate, request: Request, current_admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(models.User).options(joinedload(models.User.roles)).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="不能修改当前登录管理员的权限")
    role = db.query(models.Role).filter(models.Role.key == "admin").first()
    if not role:
        raise HTTPException(status_code=503, detail="管理员角色尚未初始化")
    before = user.is_admin
    if payload.is_admin and not before:
        user.roles.append(role)
    elif not payload.is_admin and before:
        user.roles.remove(role)
    else:
        return schemas.CommonResponse(data={"id": user.id, "is_admin": before}, message="权限未变化")
    _audit(db, actor=current_admin, target=user, action="user_admin_role_updated", request=request, metadata={"before": before, "after": payload.is_admin})
    db.commit()
    return schemas.CommonResponse(data={"id": user.id, "is_admin": payload.is_admin}, message="管理员权限已更新")


@router.get("/attractions", response_model=schemas.CommonResponse)
def list_attractions(
    keyword: str = Query(default="", max_length=100),
    status: Optional[str] = Query(default=None, pattern="^(draft|published|archived)$"),
    province: Optional[str] = Query(default=None, max_length=80),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(models.Attraction).order_by(models.Attraction.sort_order.asc(), models.Attraction.updated_at.desc())
    if keyword.strip():
        needle = f"%{keyword.strip()}%"
        query = query.filter(or_(models.Attraction.name.ilike(needle), models.Attraction.city.ilike(needle), models.Attraction.province.ilike(needle)))
    if status:
        query = query.filter(models.Attraction.status == status)
    if province:
        query = query.filter(models.Attraction.province == province)
    items, total = _pagination(query, page, page_size)
    return schemas.CommonResponse(data={"items": [_serialize_attraction(item) for item in items], "total": total, "page": page, "page_size": page_size})


@router.post("/attractions", response_model=schemas.CommonResponse)
def create_attraction(payload: schemas.AttractionCreate, request: Request, current_admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    item = models.Attraction(**payload.model_dump(), created_by=current_admin.id, updated_by=current_admin.id)
    db.add(item)
    db.flush()
    _audit(db, actor=current_admin, action="attraction_created", request=request, target_type="attraction", target_id=item.id, metadata={"name": item.name, "status": item.status})
    db.commit()
    db.refresh(item)
    return schemas.CommonResponse(data=_serialize_attraction(item), message="景点已创建")


@router.patch("/attractions/{attraction_id}", response_model=schemas.CommonResponse)
def update_attraction(attraction_id: int, payload: schemas.AttractionUpdate, request: Request, current_admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    item = db.query(models.Attraction).filter(models.Attraction.id == attraction_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="景点不存在")
    changes = payload.model_dump(exclude_unset=True)
    before = {key: getattr(item, key) for key in changes}
    for key, value in changes.items():
        setattr(item, key, value)
    item.updated_by = current_admin.id
    _audit(db, actor=current_admin, action="attraction_updated", request=request, target_type="attraction", target_id=item.id, metadata={"before": before, "after": changes})
    db.commit()
    db.refresh(item)
    return schemas.CommonResponse(data=_serialize_attraction(item), message="景点已更新")


@router.delete("/attractions/{attraction_id}", response_model=schemas.CommonResponse)
def archive_attraction(attraction_id: int, request: Request, current_admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    item = db.query(models.Attraction).filter(models.Attraction.id == attraction_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="景点不存在")
    before = item.status
    item.status = "archived"
    item.updated_by = current_admin.id
    _audit(db, actor=current_admin, action="attraction_archived", request=request, target_type="attraction", target_id=item.id, metadata={"before": before, "after": "archived", "name": item.name})
    db.commit()
    return schemas.CommonResponse(message="景点已归档，不再在前台展示")


@router.get("/posts", response_model=schemas.CommonResponse)
def list_admin_posts(
    keyword: str = Query(default="", max_length=100),
    status: Optional[str] = Query(default=None, pattern="^(published|hidden|deleted)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(models.Post).options(joinedload(models.Post.user)).order_by(models.Post.created_at.desc())
    if keyword.strip():
        needle = f"%{keyword.strip()}%"
        query = query.join(models.User).filter(or_(models.Post.title.ilike(needle), models.Post.content.ilike(needle), models.Post.location.ilike(needle), models.User.account.ilike(needle), models.User.nickname.ilike(needle)))
    if status:
        query = query.filter(models.Post.status == status)
    items, total = _pagination(query, page, page_size)
    return schemas.CommonResponse(data={"items": [_serialize_post(item) for item in items], "total": total, "page": page, "page_size": page_size})


@router.patch("/posts/{post_id}/status", response_model=schemas.CommonResponse)
def update_post_status(post_id: int, payload: schemas.ContentStatusUpdate, request: Request, current_admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    item = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="游记不存在")
    before = item.status
    _set_content_status(item, payload, current_admin)
    _audit(db, actor=current_admin, action="post_status_updated", request=request, target_type="post", target_id=item.id, metadata={"before": before, "after": payload.status, "reason": payload.reason})
    db.commit()
    return schemas.CommonResponse(data={"id": item.id, "status": item.status}, message="游记状态已更新")


@router.get("/comments", response_model=schemas.CommonResponse)
def list_admin_comments(
    keyword: str = Query(default="", max_length=100),
    status: Optional[str] = Query(default=None, pattern="^(published|hidden|deleted)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=30, ge=1, le=100),
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(models.Comment).options(joinedload(models.Comment.user), joinedload(models.Comment.post)).order_by(models.Comment.created_at.desc())
    if keyword.strip():
        needle = f"%{keyword.strip()}%"
        query = query.join(models.User).filter(or_(models.Comment.content.ilike(needle), models.User.account.ilike(needle), models.User.nickname.ilike(needle)))
    if status:
        query = query.filter(models.Comment.status == status)
    items, total = _pagination(query, page, page_size)
    return schemas.CommonResponse(data={"items": [_serialize_comment(item) for item in items], "total": total, "page": page, "page_size": page_size})


@router.patch("/comments/{comment_id}/status", response_model=schemas.CommonResponse)
def update_comment_status(comment_id: int, payload: schemas.ContentStatusUpdate, request: Request, current_admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    item = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="评论不存在")
    before = item.status
    _set_content_status(item, payload, current_admin)
    post = db.query(models.Post).filter(models.Post.id == item.post_id).first()
    if post:
        post.comments_count = db.query(func.count(models.Comment.id)).filter(models.Comment.post_id == item.post_id, models.Comment.status == "published").scalar() or 0
    _audit(db, actor=current_admin, action="comment_status_updated", request=request, target_type="comment", target_id=item.id, metadata={"before": before, "after": payload.status, "reason": payload.reason})
    db.commit()
    return schemas.CommonResponse(data={"id": item.id, "status": item.status}, message="评论状态已更新")


@router.get("/audit-logs", response_model=schemas.CommonResponse)
def list_audit_logs(
    target_type: Optional[str] = Query(default=None, max_length=50),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=30, ge=1, le=100),
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(models.AdminAuditLog).order_by(models.AdminAuditLog.created_at.desc())
    if target_type:
        query = query.filter(models.AdminAuditLog.target_type == target_type)
    logs, total = _pagination(query, page, page_size)
    return schemas.CommonResponse(data={
        "items": [schemas.AdminAuditLogResponse(
            id=entry.id, actor_id=entry.actor_id, actor_nickname=entry.actor.nickname if entry.actor else None,
            target_user_id=entry.target_user_id, target_nickname=entry.target_user.nickname if entry.target_user else None,
            target_type=entry.target_type, target_id=entry.target_id, action=entry.action,
            metadata_json=entry.metadata_json, created_at=entry.created_at,
        ).model_dump() for entry in logs],
        "total": total, "page": page, "page_size": page_size,
    })


@router.get("/model-keys", response_model=schemas.CommonResponse)
def get_model_keys(
    _: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from app.runtime_secrets import refresh_cache
    refresh_cache(db)
    return schemas.CommonResponse(data={"items": describe_secrets()})


@router.put("/model-keys", response_model=schemas.CommonResponse)
def update_model_keys(
    payload: dict,
    request: Request,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    updates = payload.get("updates") if isinstance(payload.get("updates"), dict) else {}
    clears = payload.get("clears") if isinstance(payload.get("clears"), list) else []
    apply_secret_updates(db, updates, [str(item) for item in clears])
    changed = sorted(set(list(updates.keys()) + [str(item) for item in clears]))
    _audit(
        db,
        actor=current_admin,
        action="model_keys_updated",
        request=request,
        target_type="settings",
        metadata={"keys": changed},
    )
    db.commit()
    return schemas.CommonResponse(data={"items": describe_secrets()}, message="模型密钥已更新")
