# Python 后端

本目录是“星际行者”当前项目的 Python 后端，技术栈为 FastAPI、SQLAlchemy、Alembic 和 PostgreSQL。

## 依赖文件

- `requirements.txt`：本地开发与测试依赖，包含 pytest。
- `requirements.fc.txt`：部署运行时依赖，不包含测试依赖，供函数计算或精简运行环境使用。
- `.env.example`：环境变量模板。真实的 `backend/.env` 仅保留在本地或部署平台，不提交到 Git。

## 本地运行

```powershell
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\alembic upgrade head
.venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8081 --reload
```

健康检查：`http://127.0.0.1:8081/health`

## 部署注意事项

部署时需要配置数据库、JWT、AI 服务、高德 Web 服务和对象存储环境变量。请使用部署平台的环境变量管理，不要把密钥写入源码、压缩包或 Git 提交。

当前仓库未发现 Java 源码、Maven `pom.xml` 或 Gradle 构建文件；如后续引入 Java 服务，应建立独立的 `java/` 模块，并单独维护其 Maven/Gradle 依赖。
