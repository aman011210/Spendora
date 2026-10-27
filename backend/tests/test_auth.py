from app.database import SessionLocal
from app.crud import seed_database


def test_registration_login_and_current_session(client):
    registration = client.post(
        "/api/auth/register",
        json={"username": "new.person", "full_name": "New Person", "password": "SecurePassword123"},
    )
    assert registration.status_code == 201
    credentials = registration.json()
    assert credentials["user"]["username"] == "new.person"

    login = client.post(
        "/api/auth/login",
        json={"username": "NEW.PERSON", "password": "SecurePassword123"},
    )
    assert login.status_code == 200
    authenticated = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )
    assert authenticated.status_code == 200
    assert authenticated.json()["full_name"] == "New Person"


def test_invalid_login_and_duplicate_username(client):
    invalid = client.post(
        "/api/auth/login",
        json={"username": "andrew", "password": "not-the-demo-password"},
    )
    assert invalid.status_code == 401

    duplicate = client.post(
        "/api/auth/register",
        json={"username": "ANDREW", "full_name": "Other Andrew", "password": "AnotherPassword123"},
    )
    assert duplicate.status_code == 409


def test_seed_renames_existing_demo_account_and_updates_password(client, monkeypatch):
    existing_expense_count = client.get("/api/expenses").json()["total"]
    monkeypatch.setenv("DEMO_USER_USERNAME", "rehaan")
    monkeypatch.setenv("DEMO_USER_FULL_NAME", "Rehaan")
    monkeypatch.setenv("DEMO_USER_PREVIOUS_USERNAME", "andrew")
    monkeypatch.setenv("DEMO_USER_PASSWORD", "Rehaan1234")

    with SessionLocal() as db:
        seed_database(db)

    login = client.post(
        "/api/auth/login",
        json={"username": "Rehaan", "password": "Rehaan1234"},
    )
    assert login.status_code == 200
    assert login.json()["user"]["full_name"] == "Rehaan"
    assert client.post(
        "/api/auth/login",
        json={"username": "andrew", "password": "AndrewTestPassword2026"},
    ).status_code == 401

    expenses = client.get(
        "/api/expenses",
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )
    assert expenses.json()["total"] == existing_expense_count
