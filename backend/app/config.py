from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # 运行环境
    APP_ENV: str = "development"

    # 数据库
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/starwalk"

    # JWT
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # AI
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_API_BASE: str = "https://api.deepseek.com/v1"
    DEEPSEEK_MODEL: str = "deepseek-chat"
    ZHIPU_API_KEY: str = ""
    ZHIPU_API_BASE: str = "https://open.bigmodel.cn/api/paas/v4"
    # 手账图片分析：智谱视觉模型（官方 open.bigmodel.cn）
    ZHIPU_VISION_MODEL: str = "glm-5.3-flash"
    # 手账生图：智谱 GLM-Image（官方文生图，不经中转站）
    ZHIPU_IMAGE_MODEL: str = "glm-image"
    AGNES_API_KEY: str = ""
    AGNES_API_BASE: str = "https://api.kabuai.cn/v1"
    # VOLO 成片（odyssee）与万相；后台可覆盖，留空则用这里的环境变量
    FILM_API_BASE: str = "http://127.0.0.1:3000"
    DASHSCOPE_API_KEY: str = ""
    BAILIAN_WORKSPACE_ID: str = ""

    # 高德 Web 服务路线规划（仅后端使用，不暴露给浏览器）
    AMAP_WEB_SERVICE_KEY: str = ""
    AMAP_WEB_SERVICE_BASE: str = "https://restapi.amap.com/v3"

    # 对象存储（S3 兼容：MinIO / 阿里云 OSS / AWS S3）
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET: str = "starwalk"
    S3_REGION: str = "us-east-1"
    S3_PUBLIC_URL: str = ""  # 自定义 CDN 域名，为空时使用 S3_ENDPOINT + bucket
    S3_ENABLED: bool = True  # 生产单机部署可关闭，直接使用持久化本地上传目录
    S3_FALLBACK_COOLDOWN_SECONDS: int = 60  # S3 故障后本地回退的冷却时间
    APP_PUBLIC_URL: str = "http://127.0.0.1:8081"  # 本地文件回退时使用的后端访问地址

    # 部署配置：生产环境通过 FC 环境变量覆盖，不把公网地址写死在代码中
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"
    AUTO_CREATE_TABLES: bool = True  # 生产环境使用 Alembic 后应设置为 false

    # 首个管理员仅通过部署环境变量按账号引导创建。使用一次后应清空。
    ADMIN_BOOTSTRAP_ACCOUNT: str = ""

    # 图搜（可选）。未配置时回退 Wikimedia / Openverse。
    PEXELS_API_KEY: str = ""
    UNSPLASH_ACCESS_KEY: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
