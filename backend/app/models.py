from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, Float, Integer, String, Text, DateTime, Date, ForeignKey, JSON, ARRAY, Table, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


def now_utc():
    return datetime.now(timezone.utc)


user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    key = Column(String(50), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=now_utc)

    users = relationship("User", secondary=user_roles, back_populates="roles")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    account = Column(String(24), unique=True, nullable=False, index=True)
    nickname = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=True)
    avatar_bg = Column(String(255), nullable=True)
    avatar_url = Column(Text, nullable=True)
    bio = Column(String(300), nullable=True)
    home_city = Column(String(100), nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    travel_plans = relationship("TravelPlan", back_populates="user", cascade="all, delete-orphan")
    routes = relationship("Route", back_populates="user", cascade="all, delete-orphan")
    # Post/Comment 同时保存内容作者与审核人，必须明确内容归属外键，避免 ORM 将审核外键误判为作者关联。
    posts = relationship("Post", foreign_keys="Post.user_id", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", foreign_keys="Comment.user_id", back_populates="user", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    journals = relationship("Journal", back_populates="user", cascade="all, delete-orphan")
    auth_sessions = relationship("AuthSession", back_populates="user", cascade="all, delete-orphan")
    auth_events = relationship("AuthEvent", back_populates="user", cascade="all, delete-orphan")
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    admin_actions = relationship("AdminAuditLog", foreign_keys="AdminAuditLog.actor_id", back_populates="actor")
    admin_audit_targets = relationship("AdminAuditLog", foreign_keys="AdminAuditLog.target_user_id", back_populates="target_user")

    @property
    def is_admin(self) -> bool:
        return any(role.key == "admin" for role in self.roles)


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id = Column(String(36), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    refresh_jti_hash = Column(String(64), nullable=False, unique=True)
    device_id = Column(String(128), nullable=True)
    user_agent = Column(String(512), nullable=True)
    ip_address = Column(String(64), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=now_utc)
    last_seen_at = Column(DateTime, default=now_utc)

    user = relationship("User", back_populates="auth_sessions")


class AuthEvent(Base):
    __tablename__ = "auth_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(64), nullable=False)
    subject_hash = Column(String(64), nullable=True, index=True)
    ip_address = Column(String(64), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=now_utc)

    user = relationship("User", back_populates="auth_events")


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    target_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    target_type = Column(String(50), nullable=True, index=True)
    target_id = Column(Integer, nullable=True, index=True)
    action = Column(String(100), nullable=False)
    metadata_json = Column(JSON, nullable=True)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=now_utc)

    actor = relationship("User", foreign_keys=[actor_id], back_populates="admin_actions")
    target_user = relationship("User", foreign_keys=[target_user_id], back_populates="admin_audit_targets")


class Attraction(Base):
    __tablename__ = "attractions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False, index=True)
    province = Column(String(80), nullable=False, index=True)
    city = Column(String(80), nullable=True, index=True)
    short_desc = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    cover_image_url = Column(Text, nullable=True)
    images = Column(ARRAY(Text), nullable=True)
    tags = Column(ARRAY(String(100)), nullable=True)
    rating = Column(Float, nullable=True)
    best_season = Column(String(120), nullable=True)
    recommended_duration = Column(String(60), nullable=True)
    opening_hours = Column(String(255), nullable=True)
    ticket_hint = Column(String(255), nullable=True)
    longitude = Column(Float, nullable=True)
    latitude = Column(Float, nullable=True)
    amap_poi_id = Column(String(120), nullable=True, unique=True)
    sort_order = Column(Integer, nullable=False, default=0)
    is_hot = Column(Boolean, nullable=False, default=True)
    status = Column(String(20), nullable=False, default="draft", index=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    plan_json = Column(JSON, nullable=True)
    external_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc)

    user = relationship("User", back_populates="favorites")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # intent = 商品/搜索链接收藏；order = 正式订单（二期）
    kind = Column(String(20), nullable=False, default="intent", index=True)
    title = Column(String(255), nullable=True)
    note = Column(Text, nullable=True)
    source_type = Column(String(20), nullable=True)  # province | spot
    source_name = Column(String(100), nullable=True)
    link_type = Column(String(20), nullable=True)  # search | product
    province = Column(String(100), nullable=True)
    keyword = Column(String(255), nullable=True)
    platform = Column(String(50), nullable=True)  # ctrip | fliggy | other
    url = Column(Text, nullable=False)
    order_no = Column(String(100), nullable=True)
    travel_date = Column(DateTime, nullable=True)
    amount = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

    user = relationship("User", back_populates="bookings")


class TravelPlan(Base):
    __tablename__ = "travel_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=True)
    preference_text = Column(Text, nullable=True)
    content_json = Column(JSON, nullable=False)
    input_text = Column(Text, nullable=True)
    input_images = Column(ARRAY(Text), nullable=True)
    style = Column(String(50), nullable=True)
    people = Column(String(50), nullable=True)
    budget = Column(String(50), nullable=True)
    days = Column(Integer, nullable=True)
    start_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

    user = relationship("User", back_populates="travel_plans")
    routes = relationship("Route", back_populates="plan")


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_id = Column(Integer, ForeignKey("travel_plans.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=True)
    strategy = Column(String(50), nullable=True)
    days_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

    user = relationship("User", back_populates="routes")
    plan = relationship("TravelPlan", back_populates="routes")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    images = Column(ARRAY(Text), nullable=True)
    rating = Column(Integer, nullable=True)
    tags = Column(ARRAY(String(100)), nullable=True)
    location = Column(String(255), nullable=True)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    status = Column(String(20), nullable=False, default="published", index=True)
    moderated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    moderated_at = Column(DateTime, nullable=True)
    moderation_reason = Column(String(300), nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

    user = relationship("User", foreign_keys=[user_id], back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="published", index=True)
    moderated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    moderated_at = Column(DateTime, nullable=True)
    moderation_reason = Column(String(300), nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=now_utc)

    post = relationship("Post", back_populates="comments")
    user = relationship("User", foreign_keys=[user_id], back_populates="comments")


class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=now_utc)

    post = relationship("Post", back_populates="likes")
    user = relationship("User", back_populates="likes")


class Journal(Base):
    __tablename__ = "journals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=True)
    style = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    travel_date = Column(Date, nullable=True)
    mood = Column(Text, nullable=True)
    photos = Column(ARRAY(Text), nullable=True)
    layout_json = Column(JSON, nullable=True)
    content_html = Column(Text, nullable=True)
    video_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

    user = relationship("User", back_populates="journals")


class MediaGalleryItem(Base):
    """标签悬停图库：本地优先，缺失时从图搜拉取并落地。"""
    __tablename__ = "media_gallery_items"
    __table_args__ = (
        UniqueConstraint("cache_key", name="uq_media_gallery_cache_key"),
    )

    id = Column(Integer, primary_key=True, index=True)
    cache_key = Column(String(255), nullable=False, index=True)
    label = Column(String(160), nullable=False)
    tag_type = Column(String(40), nullable=False, default="experience")
    city = Column(String(80), nullable=True)
    image_url = Column(Text, nullable=False)
    source = Column(String(40), nullable=False, default="remote")
    source_page = Column(Text, nullable=True)
    attribution = Column(String(255), nullable=True)
    hit_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)


class AppSetting(Base):
    """管理员可改的运行时配置。密钥类字段优先于 .env。"""
    __tablename__ = "app_settings"

    key = Column(String(80), primary_key=True)
    value = Column(Text, nullable=False, default="")
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)
