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
