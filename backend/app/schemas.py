from datetime import date, datetime
from typing import Optional, List, Any, Union
from pydantic import BaseModel, Field, EmailStr, field_validator


# ==================== 用户 ====================

class UserBase(BaseModel):
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    nickname: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    avatar_bg: Optional[str] = None


class UserResponse(UserBase):
    id: int
    avatar_bg: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    password: str


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


# ==================== 预定 ====================

class BookingCreate(BaseModel):
    province: Optional[str] = None
    keyword: Optional[str] = None
    platform: Optional[str] = None
    url: str
    order_no: Optional[str] = None
    travel_date: Optional[datetime] = None
    amount: Optional[int] = None


class BookingResponse(BaseModel):
    id: int
    province: Optional[str] = None
    keyword: Optional[str] = None
    platform: Optional[str] = None
    url: str
    order_no: Optional[str] = None
    travel_date: Optional[datetime] = None
    amount: Optional[int] = None
    created_at: datetime

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


class MapGeocodeRequest(BaseModel):
    address: str = Field(..., min_length=1, max_length=120)
    city: Optional[str] = Field(default=None, max_length=40)


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
