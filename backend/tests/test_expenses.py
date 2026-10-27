def payload(client):
    category = client.get("/api/categories").json()[0]
    return {
        "title": "Test lunch",
        "amount": "18.50",
        "category_id": category["id"],
        "expense_date": "2026-10-12",
        "payment_method": "Card",
        "description": "Test record",
    }


def test_create_list_update_delete_expense(client):
    response = client.post("/api/expenses", json=payload(client))
    assert response.status_code == 201
    expense = response.json()
    assert expense["title"] == "Test lunch"
    assert expense["category_name"]

    listed = client.get("/api/expenses", params={"search": "Test lunch"})
    assert listed.status_code == 200
    assert listed.json()["total"] == 1

    updated_payload = payload(client)
    updated_payload["title"] = "Updated lunch"
    updated = client.put(f"/api/expenses/{expense['id']}", json=updated_payload)
    assert updated.status_code == 200
    assert updated.json()["title"] == "Updated lunch"

    deleted = client.delete(f"/api/expenses/{expense['id']}")
    assert deleted.status_code == 204
    assert client.get(f"/api/expenses/{expense['id']}").status_code == 404


def test_invalid_amount_and_missing_expense(client):
    bad_payload = payload(client)
    bad_payload["amount"] = 0
    assert client.post("/api/expenses", json=bad_payload).status_code == 422
    assert client.get("/api/expenses/999999").status_code == 404


def test_invalid_date_range(client):
    response = client.get("/api/expenses", params={"start_date": "2026-10-20", "end_date": "2026-10-01"})
    assert response.status_code == 422


def test_csv_export_respects_filters(client):
    response = client.get("/api/expenses/export/csv", params={"search": "Weekly groceries"})
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert response.text.startswith("id,title,amount,category,expense_date,payment_method,description")
    assert "Weekly groceries" in response.text
    assert "Metro pass" not in response.text


def test_unknown_category_and_bad_amount_are_rejected(client):
    bad_category = payload(client)
    bad_category["category_id"] = 999999
    assert client.post("/api/expenses", json=bad_category).status_code == 422

    bad_amount = payload(client)
    bad_amount["amount"] = "-1.00"
    assert client.post("/api/expenses", json=bad_amount).status_code == 422


def test_user_cannot_access_another_users_expenses(client):
    registration = client.post(
        "/api/auth/register",
        json={"username": "privateuser", "full_name": "Private User", "password": "SecurePassword123"},
    )
    assert registration.status_code == 201
    own_token = registration.json()["access_token"]
    own_headers = {"Authorization": f"Bearer {own_token}"}

    demo_expense = client.get("/api/expenses", params={"page_size": 1}).json()["items"][0]
    hidden = client.get(f"/api/expenses/{demo_expense['id']}", headers=own_headers)
    assert hidden.status_code == 404
    assert client.put(
        f"/api/expenses/{demo_expense['id']}",
        json=payload(client),
        headers=own_headers,
    ).status_code == 404
    assert client.delete(f"/api/expenses/{demo_expense['id']}", headers=own_headers).status_code == 404
    assert client.get("/api/expenses", headers=own_headers).json()["total"] == 0
    assert client.get("/api/analytics/summary", headers=own_headers).json()["expense_count"] == 0
    assert client.get(f"/api/expenses/{demo_expense['id']}").status_code == 200


def test_authentication_required_for_expenses():
    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as unauthenticated_client:
        assert unauthenticated_client.get("/api/expenses").status_code == 401
