from decimal import Decimal


def test_category_analytics_returns_sql_aggregates(client):
    response = client.get("/api/analytics/category")
    assert response.status_code == 200
    rows = response.json()
    assert rows
    assert all({"category", "total", "expense_count", "average_amount"} <= row.keys() for row in rows)
    assert any(row["expense_count"] > 0 for row in rows)
    assert all(Decimal(row["total"]) >= 0 and Decimal(row["average_amount"]) >= 0 for row in rows)


def test_monthly_and_summary_analytics(client):
    monthly = client.get("/api/analytics/monthly", params={"months": 6})
    summary = client.get("/api/analytics/summary")
    assert monthly.status_code == 200
    assert monthly.json()["months"]
    assert monthly.json()["categories"]
    assert all({"month", "category", "total"} <= row.keys() for row in monthly.json()["categories"])
    assert summary.status_code == 200
    assert summary.json()["expense_count"] > 0
    assert summary.json()["highest_spending_category"]
