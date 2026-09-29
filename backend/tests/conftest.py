import os

os.environ["DATABASE_URL"] = "postgresql+psycopg://postgres:postgres@localhost:5432/starwalk_test"
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["APP_ENV"] = "test"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app import models
from app.auth import get_password_hash

engine = create_engine(os.environ["DATABASE_URL"])
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="session")
def client():
    return TestClient(app)


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session")
def auth_headers(client):
    # 创建测试用户
    db = TestingSessionLocal()
    user = models.User(
        account="tester_01",
        nickname="tester",
        hashed_password=get_password_hash("123456"),
        avatar_bg="linear-gradient(135deg, #0D6B5C, #1A8A7A)",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()

    resp = client.post("/api/auth/login", json={"account": "tester_01", "password": "123456"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
