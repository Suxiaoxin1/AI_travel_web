from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, JSON, ARRAY
from sqlalchemy.orm import relationship

from app.database import Base


def now_utc():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(20), unique=True, nullable=True)
    email = Column(String(255), unique=True, nullable=True)
    nickname = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    avatar_bg = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    travel_plans = relationship("TravelPlan", back_populates="user", cascade="all, delete-orphan")
    routes = relationship("Route", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    journals = relationship("Journal", back_populates="user", cascade="all, delete-orphan")


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
    province = Column(String(100), nullable=True)
    keyword = Column(String(255), nullable=True)
    platform = Column(String(50), nullable=True)
    url = Column(Text, nullable=False)
    order_no = Column(String(100), nullable=True)
    travel_date = Column(DateTime, nullable=True)
    amount = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=now_utc)

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
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

    user = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=now_utc)

    post = relationship("Post", back_populates="comments")
    user = relationship("User", back_populates="comments")


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
