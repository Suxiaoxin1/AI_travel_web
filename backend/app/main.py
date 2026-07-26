from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from fastapi.staticfiles import StaticFiles

from app.routers import auth, users, favorites, bookings, plans, routes, journals, posts, comments, likes, uploads, map_routes

# 创建数据库表（开发阶段便捷方式；生产环境建议使用 Alembic）
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="星际行者 · AI 旅行向导",
    description="FastAPI 后端服务",
    version="0.8.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(users.router, prefix="/api/users", tags=["用户"])
app.include_router(favorites.router, prefix="/api/favorites", tags=["收藏"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["预定"])
app.include_router(plans.router, prefix="/api/plans", tags=["行程规划"])
app.include_router(routes.router, prefix="/api/routes", tags=["路线"])
app.include_router(map_routes.router, prefix="/api/map", tags=["地图路线"])
app.include_router(journals.router, prefix="/api/journals", tags=["手账"])
app.include_router(posts.router, prefix="/api/posts", tags=["分享社区"])
app.include_router(comments.router, prefix="/api/posts", tags=["评论"])
app.include_router(likes.router, prefix="/api/posts", tags=["点赞"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["文件上传"])

# 本地文件回退目录（当不使用对象存储时）
import os
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/health", tags=["健康检查"])
def health_check():
    return {"status": "ok"}
