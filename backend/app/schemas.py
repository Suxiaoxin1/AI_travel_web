from datetime import date, datetime
import re
from typing import Optional, List, Any, Union, Literal
from pydantic import BaseModel, Field, field_validator


# ==================== 用户 ====================

ACCOUNT_PATTERN = r"^[A-Za-z0-9_]{4,24}$"


class UserCreate(BaseModel):
    account: str = Field(..., min_length=4, max_length=24, pattern=ACCOUNT_PATTERN)
    password: str = Field(..., min_length=6, max_length=128)
    nickname: Optional[str] = Field(default=None, min_length=1, max_length=100)

    @field_validator("account", mode="before")
    @classmethod
    def normalize_account(cls, value: str) -> str:
        return value.strip()

    @field_validator("nickname", mode="before")
    @classmethod
    def normalize_nickname(cls, value: Optional[str]) -> Optional[str]:
        return value.strip() if value else None


class UserUpdate(BaseModel):
    nickname: Optional[str] = Field(default=None, min_length=1, max_length=100)
    avatar_bg: Optional[str] = Field(default=None, max_length=255)
    avatar_url: Optional[str] = Field(default=None, max_length=2048)
    bio: Optional[str] = Field(default=None, max_length=300)
    home_city: Optional[str] = Field(default=None, max_length=100)


class UserResponse(BaseModel):
    id: int
    account: str
    nickname: str
    avatar_bg: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    home_city: Optional[str] = None
    last_login_at: Optional[datetime] = None
    status: str = "active"
    is_admin: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    account: str = Field(..., min_length=4, max_length=24, pattern=ACCOUNT_PATTERN)
    password: str = Field(..., min_length=6, max_length=128)

    @field_validator("account", mode="before")
    @classmethod
    def normalize_account(cls, value: str) -> str:
        return value.strip()


class AdminUserStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(active|suspended)$")


class AdminUserRoleUpdate(BaseModel):
    is_admin: bool


class AdminUserCreate(BaseModel):
    account: str = Field(..., min_length=4, max_length=24, pattern=ACCOUNT_PATTERN)
    password: str = Field(..., min_length=6, max_length=128)
    nickname: Optional[str] = Field(default=None, min_length=1, max_length=100)
    is_admin: bool = True

    @field_validator("account", mode="before")
    @classmethod
    def normalize_account(cls, value: str) -> str:
        return value.strip()

    @field_validator("nickname", mode="before")
    @classmethod
    def normalize_nickname(cls, value: Optional[str]) -> Optional[str]:
        return value.strip() if value else None


class AdminUserResponse(UserResponse):
    posts_count: int = 0
    plans_count: int = 0
    journals_count: int = 0
    routes_count: int = 0
    favorites_count: int = 0
    bookings_count: int = 0
    comments_count: int = 0


class AdminUserDetailResponse(AdminUserResponse):
    recent_activity: List[dict] = Field(default_factory=list)


class AdminDashboardResponse(BaseModel):
    users_total: int
    active_users: int
    suspended_users: int
    posts_total: int
    plans_total: int
    journals_total: int
    attractions_total: int = 0
    published_attractions: int = 0
    draft_attractions: int = 0
    archived_attractions: int = 0
    published_posts: int = 0
    hidden_posts: int = 0
    deleted_posts: int = 0
    comments_total: int = 0
    published_comments: int = 0
    hidden_comments: int = 0
    deleted_comments: int = 0
    recent_suspended_users: int = 0
    # 可视化序列
    content_mix: List[dict] = Field(default_factory=list)
    user_status_mix: List[dict] = Field(default_factory=list)
    attraction_status_mix: List[dict] = Field(default_factory=list)
    moderation_mix: List[dict] = Field(default_factory=list)
    # 待办
    todos: List[dict] = Field(default_factory=list)


class AdminAuditLogResponse(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor_nickname: Optional[str] = None
    target_user_id: Optional[int] = None
    target_nickname: Optional[str] = None
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    action: str
    metadata_json: Optional[dict] = None
    created_at: datetime


class AttractionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=160)
    province: str = Field(..., min_length=1, max_length=80)
    city: Optional[str] = Field(default=None, max_length=80)
    short_desc: Optional[str] = Field(default=None, max_length=1000)
    description: Optional[str] = Field(default=None, max_length=5000)
    cover_image_url: Optional[str] = Field(default=None, max_length=2048)
    images: List[str] = Field(default_factory=list, max_length=9)
    tags: List[str] = Field(default_factory=list, max_length=12)
    rating: Optional[float] = Field(default=None, ge=0, le=5)
    best_season: Optional[str] = Field(default=None, max_length=120)
    recommended_duration: Optional[str] = Field(default=None, max_length=60)
    opening_hours: Optional[str] = Field(default=None, max_length=255)
    ticket_hint: Optional[str] = Field(default=None, max_length=255)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    amap_poi_id: Optional[str] = Field(default=None, max_length=120)
    sort_order: int = Field(default=0, ge=0, le=999999)
    is_hot: bool = True
    status: str = Field(default="draft", pattern="^(draft|published|archived)$")


class AttractionCreate(AttractionBase):
    pass


class AttractionUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=160)
    province: Optional[str] = Field(default=None, min_length=1, max_length=80)
    city: Optional[str] = Field(default=None, max_length=80)
    short_desc: Optional[str] = Field(default=None, max_length=1000)
    description: Optional[str] = Field(default=None, max_length=5000)
    cover_image_url: Optional[str] = Field(default=None, max_length=2048)
    images: Optional[List[str]] = Field(default=None, max_length=9)
    tags: Optional[List[str]] = Field(default=None, max_length=12)
    rating: Optional[float] = Field(default=None, ge=0, le=5)
    best_season: Optional[str] = Field(default=None, max_length=120)
    recommended_duration: Optional[str] = Field(default=None, max_length=60)
    opening_hours: Optional[str] = Field(default=None, max_length=255)
    ticket_hint: Optional[str] = Field(default=None, max_length=255)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    amap_poi_id: Optional[str] = Field(default=None, max_length=120)
    sort_order: Optional[int] = Field(default=None, ge=0, le=999999)
    is_hot: Optional[bool] = None
    status: Optional[str] = Field(default=None, pattern="^(draft|published|archived)$")


class ContentStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(published|hidden|deleted)$")
    reason: Optional[str] = Field(default=None, max_length=300)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


# ==================== 收藏 ====================

class FavoriteCreate(BaseModel):
    type: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    plan_json: Optional[dict] = None
    external_url: Optional[str] = None


class FavoriteResponse(BaseModel):
    id: int
    type: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    plan_json: Optional[dict] = None
    external_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== 预定 / 意向收藏 ====================

BookingKind = Literal["intent", "order"]
BookingSourceType = Literal["province", "spot"]
BookingLinkType = Literal["search", "product"]
BookingPlatform = Literal["ctrip", "fliggy", "other"]


class BookingCreate(BaseModel):
    url: str = Field(..., min_length=1)
    kind: BookingKind = "intent"
    title: Optional[str] = Field(default=None, max_length=255)
    note: Optional[str] = None
    source_type: Optional[BookingSourceType] = None
    source_name: Optional[str] = Field(default=None, max_length=100)
    link_type: Optional[BookingLinkType] = None
    province: Optional[str] = Field(default=None, max_length=100)
    keyword: Optional[str] = Field(default=None, max_length=255)
    platform: Optional[str] = Field(default=None, max_length=50)
    order_no: Optional[str] = None
    travel_date: Optional[datetime] = None
    amount: Optional[int] = None

    @field_validator("url", mode="before")
    @classmethod
    def strip_url(cls, value: str) -> str:
        return (value or "").strip()

    @field_validator("title", "note", "source_name", "province", "keyword", "platform", mode="before")
    @classmethod
    def strip_optional_text(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            text = value.strip()
            return text or None
        return value


class BookingUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    note: Optional[str] = None
    url: Optional[str] = Field(default=None, min_length=1)
    link_type: Optional[BookingLinkType] = None
    platform: Optional[str] = Field(default=None, max_length=50)
    keyword: Optional[str] = Field(default=None, max_length=255)
    source_type: Optional[BookingSourceType] = None
    source_name: Optional[str] = Field(default=None, max_length=100)
    province: Optional[str] = Field(default=None, max_length=100)

    @field_validator("url", "title", "note", "source_name", "province", "keyword", "platform", mode="before")
    @classmethod
    def strip_text(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            text = value.strip()
            return text or None
        return value


class BookingResponse(BaseModel):
    id: int
    kind: str = "intent"
    title: Optional[str] = None
    note: Optional[str] = None
    source_type: Optional[str] = None
    source_name: Optional[str] = None
    link_type: Optional[str] = None
    province: Optional[str] = None
    keyword: Optional[str] = None
    platform: Optional[str] = None
    url: str
    order_no: Optional[str] = None
    travel_date: Optional[datetime] = None
    amount: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== 行程规划 ====================

class TravelPlanCreate(BaseModel):
    title: Optional[str] = None
    preference_text: Optional[str] = None
    content_json: dict
    input_text: Optional[str] = None
    input_images: Optional[List[str]] = None
    style: Optional[str] = None
    people: Optional[str] = None
    budget: Optional[str] = None
    days: Optional[int] = None
    start_date: Optional[date] = None


class TravelPlanResponse(BaseModel):
    id: int
    title: Optional[str] = None
    preference_text: Optional[str] = None
    content_json: dict
    input_text: Optional[str] = None
    input_images: Optional[List[str]] = None
    style: Optional[str] = None
    people: Optional[str] = None
    budget: Optional[str] = None
    days: Optional[int] = None
    start_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== 路线 ====================

class RouteCreate(BaseModel):
    plan_id: Optional[int] = None
    title: Optional[str] = None
    strategy: Optional[str] = None
    days_json: dict


class RouteResponse(BaseModel):
    id: int
    plan_id: Optional[int] = None
    title: Optional[str] = None
    strategy: Optional[str] = None
    days_json: dict
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Coordinate(BaseModel):
    lng: float = Field(..., ge=-180, le=180)
    lat: float = Field(..., ge=-90, le=90)


class MapDrivingRequest(BaseModel):
    origin: Coordinate
    destination: Coordinate
    waypoints: List[Coordinate] = Field(default_factory=list, max_length=16)
    strategy: int = Field(default=0, ge=0, le=4)


class MapTransitRequest(BaseModel):
    origin: Coordinate
    destination: Coordinate
    origin_city: str = Field(..., min_length=1, max_length=40)
    destination_city: str = Field(..., min_length=1, max_length=40)
    strategy: int = Field(default=0, ge=0, le=5)


class MapGeocodeRequest(BaseModel):
    address: str = Field(..., min_length=1, max_length=120)
    city: Optional[str] = Field(default=None, max_length=40)


class MapLocateRequest(BaseModel):
    """景点精定位：优先 POI 搜索，带城市约束。"""
    keyword: str = Field(..., min_length=1, max_length=120)
    city: Optional[str] = Field(default=None, max_length=40)


class MapWalkingRequest(BaseModel):
    origin: Coordinate
    destination: Coordinate


# ==================== 手账 ====================

class JournalCreate(BaseModel):
    title: Optional[str] = None
    style: Optional[str] = None
    location: Optional[str] = None
    travel_date: Optional[date] = None
    mood: Optional[str] = None
    photos: Optional[List[str]] = None
    layout_json: Optional[dict] = None
    content_html: Optional[str] = None
    video_url: Optional[str] = None
    cover_url: Optional[str] = None


class JournalResponse(BaseModel):
    id: int
    title: Optional[str] = None
    style: Optional[str] = None
    location: Optional[str] = None
    travel_date: Optional[date] = None
    mood: Optional[str] = None
    photos: Optional[List[str]] = None
    layout_json: Optional[dict] = None
    content_html: Optional[str] = None
    video_url: Optional[str] = None
    cover_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== 分享社区 ====================

class PostCreate(BaseModel):
    title: Optional[str] = None
    content: str
    location: Optional[str] = None
    rating: Optional[int] = None
    tags: Optional[List[str]] = None
    images: Optional[List[str]] = None


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: int
    user_id: int
    author: str
    author_avatar: Optional[str] = None
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class PostResponse(BaseModel):
    id: int
    user_id: int
    author: str
    author_avatar: Optional[str] = None
    title: Optional[str] = None
    content: str
    location: Optional[str] = None
    rating: Optional[int] = None
    tags: Optional[List[str]] = None
    images: Optional[List[str]] = None
    likes_count: int = 0
    comments_count: int = 0
    user_liked: bool = False
    created_at: datetime
    updated_at: datetime
    comments: Optional[List[CommentResponse]] = None

    class Config:
        from_attributes = True


class LikeResponse(BaseModel):
    id: int
    user_id: int
    post_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== 通用响应 ====================

class CommonResponse(BaseModel):
    code: int = 0
    data: Optional[Any] = None
    message: str = "success"


# ==================== AI 代理 ====================

class AIRequestOptions(BaseModel):
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=2048, ge=1, le=8192)
    timeout_ms: int = Field(default=60000, ge=1000, le=180000)


class AIChatRequest(BaseModel):
    mode: Literal["text", "vision"] = "text"
    messages: List[dict[str, Any]] = Field(..., min_length=1, max_length=12)
    options: AIRequestOptions = Field(default_factory=AIRequestOptions)


class AIImageRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)
    # 兼容旧 1K/2K；智谱 GLM-Image 使用具体像素，如 1056x1568
    size: str = Field(default="1056x1568", max_length=32)
    ratio: Optional[str] = Field(default="3:4", max_length=16)
    model: Optional[str] = Field(default=None, max_length=80)
    # 兼容旧客户端字段；智谱 GLM-Image 官方文生图不使用参考图
    images: Optional[List[str]] = Field(default=None, max_length=6)

    @field_validator("size")
    @classmethod
    def validate_size(cls, value: str) -> str:
        text = (value or "").strip()
        if re.fullmatch(r"[12]K", text, flags=re.IGNORECASE):
            return text.upper()
        if re.fullmatch(r"\d{3,4}x\d{3,4}", text, flags=re.IGNORECASE):
            return text.lower()
        raise ValueError("图片尺寸无效")

    @field_validator("ratio")
    @classmethod
    def validate_ratio(cls, value: Optional[str]) -> Optional[str]:
        if value is None or value == "":
            return None
        text = value.strip()
        if re.fullmatch(r"(1:1|3:4|4:3|16:9|9:16|2:3|3:2|21:9)", text):
            return text
        raise ValueError("图片比例无效")

    @field_validator("images")
    @classmethod
    def validate_images(cls, value: Optional[List[str]]) -> Optional[List[str]]:
        if value is None:
            return None
        cleaned: List[str] = []
        for item in value:
            if not isinstance(item, str):
                raise ValueError("参考图格式无效")
            text = item.strip()
            if not text:
                continue
            if len(text) > 6_000_000:
                raise ValueError("单张参考图过大，请先压缩")
            cleaned.append(text)
        if len(cleaned) > 6:
            raise ValueError("参考图最多 6 张")
        return cleaned or None


class AIVideoRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)
    image: Optional[str] = Field(default=None, min_length=8, max_length=2048)
    mode: Literal["ti2vid", "keyframes"] = "ti2vid"
    width: Optional[int] = Field(default=None, ge=256, le=1920)
    height: Optional[int] = Field(default=None, ge=256, le=1920)
    num_frames: Optional[int] = Field(default=None, ge=9, le=441)
    frame_rate: Optional[int] = Field(default=None, ge=1, le=60)


def _validate_album_data_urls(value: List[str]) -> List[str]:
    cleaned: List[str] = []
    for item in value:
        if not isinstance(item, str):
            raise ValueError("图片格式无效")
        text = item.strip()
        if not text.startswith("data:image/"):
            raise ValueError("请上传 data URL 格式的旅途照片")
        if len(text) > 6_000_000:
            raise ValueError("单张照片过大，请先压缩")
        cleaned.append(text)
    if len(cleaned) < 3:
        raise ValueError("至少上传 3 张照片")
    if len(cleaned) > 9:
        raise ValueError("最多上传 9 张照片")
    return cleaned


class AlbumVideoStoryRequest(BaseModel):
    images: List[str] = Field(..., min_length=3, max_length=9)
    location: Optional[str] = Field(default=None, max_length=100)
    date: Optional[str] = Field(default=None, max_length=40)
    mood: Optional[str] = Field(default=None, max_length=500)
    style: Optional[str] = Field(default=None, max_length=40)

    @field_validator("images")
    @classmethod
    def validate_album_images(cls, value: List[str]) -> List[str]:
        return _validate_album_data_urls(value)


class AlbumVideoRenderRequest(BaseModel):
    images: List[str] = Field(..., min_length=3, max_length=9)
    story: Optional[str] = Field(default=None, max_length=4000)
    seconds_per_image: float = Field(default=3.0, ge=1.5, le=6.0)

    @field_validator("images")
    @classmethod
    def validate_render_images(cls, value: List[str]) -> List[str]:
        return _validate_album_data_urls(value)

# ==================== 手账排版 ====================

class DiaryPhotoAspect(BaseModel):
    index: int = Field(..., ge=0, le=20)
    aspect: float = Field(..., gt=0, le=10)


class DiaryLayoutNextRequest(BaseModel):
    style: str = Field(..., min_length=1, max_length=40)
    description: Optional[str] = Field(default="", max_length=2000)
    context: Optional[str] = Field(default="", max_length=2000)
    photoCount: int = Field(..., ge=3, le=9)
    aspects: Optional[List[DiaryPhotoAspect]] = Field(default=None, max_length=20)


class DiaryCutoutRequest(BaseModel):
    images: List[str] = Field(..., min_length=1, max_length=6)


# ==================== 媒体图库 ====================

class TagPreviewRequest(BaseModel):

    label: str = Field(..., min_length=1, max_length=160)
    tag_type: str = Field(default="experience", max_length=40)
    city: Optional[str] = Field(default=None, max_length=80)
    local_image: Optional[str] = Field(default=None, max_length=2048)
    # 同一次行程内已占用的图片 URL，避免不同景点落到同一张图
    exclude_urls: list[str] = Field(default_factory=list, max_length=40)

    @field_validator("label", "city", mode="before")
    @classmethod
    def strip_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        text = str(value).strip()
        return text or None

    @field_validator("exclude_urls", mode="before")
    @classmethod
    def normalize_exclude_urls(cls, value):
        if not value:
            return []
        items = value if isinstance(value, list) else [value]
        out = []
        seen = set()
        for item in items:
            text = str(item or "").strip()
            if not text or text in seen:
                continue
            seen.add(text)
            out.append(text[:2048])
            if len(out) >= 40:
                break
        return out

    @field_validator("tag_type", mode="before")
    @classmethod
    def normalize_tag_type(cls, value: str) -> str:
        allowed = {"spot", "food", "culture", "experience", "vibe"}
        text = str(value or "experience").strip().lower()
        return text if text in allowed else "experience"
