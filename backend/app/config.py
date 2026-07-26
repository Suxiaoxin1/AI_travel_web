from pydantic_settings import BaseSettings


class Settings(BaseSettings):
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
    ZHIPU_API_KEY: str = ""
    ZHIPU_API_BASE: str = "https://open.bigmodel.cn/api/paas/v4"
    AGNES_API_KEY: str = ""
    AGNES_API_BASE: str = "https://apihub.agnes-ai.com/v1"

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
    S3_FALLBACK_COOLDOWN_SECONDS: int = 60  # S3 故障后本地回退的冷却时间
    APP_PUBLIC_URL: str = "http://127.0.0.1:8081"  # 本地文件回退时使用的后端访问地址

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
