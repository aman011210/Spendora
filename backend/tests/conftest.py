import os

os.environ["DATABASE_URL"] = "sqlite:///./test_expense_tracker.db"
os.environ["SECRET_KEY"] = "test-only-signing-key-that-is-at-least-32-characters"
os.environ["DEMO_USER_PASSWORD"] = "AndrewTestPassword2026"

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        response = test_client.post(
            "/api/auth/login",
            json={"username": "andrew", "password": os.environ["DEMO_USER_PASSWORD"]},
        )
        assert response.status_code == 200
        test_client.headers.update({"Authorization": f"Bearer {response.json()['access_token']}"})
        yield test_client
