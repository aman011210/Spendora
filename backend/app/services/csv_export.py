import csv
from io import StringIO

from sqlalchemy import Select
from sqlalchemy.orm import Session

from app.models import Category, Expense


def expenses_to_csv(db: Session, statement: Select) -> StringIO:
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "title", "amount", "category", "expense_date", "payment_method", "description"])
    rows = db.execute(statement).all()
    for expense, category_name in rows:
        writer.writerow(
            [
                expense.id,
                expense.title,
                f"{expense.amount:.2f}",
                category_name,
                expense.expense_date.isoformat(),
                expense.payment_method,
                expense.description or "",
            ]
        )
    output.seek(0)
    return output
