from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.config import settings
from fastapi.staticfiles import StaticFiles

from app.routers import admin, ai, attractions, auth, users, favorites, bookings, plans, routes, journals, diary, posts, comments, likes, uploads, map_routes, media, weather

# 创建数据库表（仅开发环境便捷使用；生产环境应先执行 Alembic 迁移）
if settings.AUTO_CREATE_TABLES:
    Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="星际行者 · AI 旅行向导",
    description="FastAPI 后端服务",
    version="0.8.0"
)

# CORS 配置：通过 FC 环境变量 CORS_ORIGINS 传入逗号分隔的前端公网地址
cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 本地开发：画布导出读 /uploads 图时需要可跨域取像素
@app.middleware("http")
async def uploads_cors_headers(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/uploads/"):
        response.headers.setdefault("Access-Control-Allow-Origin", "*")
        response.headers.setdefault("Access-Control-Allow-Methods", "GET, OPTIONS")
        response.headers.setdefault("Cross-Origin-Resource-Policy", "cross-origin")
    return response

app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI 服务代理"])
app.include_router(admin.router, prefix="/api/admin", tags=["管理后台"])
app.include_router(attractions.router, prefix="/api/attractions", tags=["热门景点"])
app.include_router(users.router, prefix="/api/users", tags=["用户"])
app.include_router(favorites.router, prefix="/api/favorites", tags=["收藏"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["预定"])
app.include_router(plans.router, prefix="/api/plans", tags=["行程规划"])
app.include_router(routes.router, prefix="/api/routes", tags=["路线"])
app.include_router(map_routes.router, prefix="/api/map", tags=["地图路线"])
app.include_router(journals.router, prefix="/api/journals", tags=["手账"])
app.include_router(diary.router, prefix="/api/diary", tags=["手账排版"])
app.include_router(posts.router, prefix="/api/posts", tags=["分享社区"])
app.include_router(comments.router, prefix="/api/posts", tags=["评论"])
app.include_router(likes.router, prefix="/api/posts", tags=["点赞"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["文件上传"])
app.include_router(media.router, prefix="/api/media", tags=["媒体图库"])
app.include_router(weather.router, prefix="/api/weather", tags=["天气预报"])

# 本地文件回退目录（当不使用对象存储时）
import os
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/health", tags=["健康检查"])
def health_check():
    return {"status": "ok"}
