from datetime import date
from decimal import Decimal
import os

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Category, Expense, User
from app.schemas import ExpenseCreate, ExpenseUpdate
from app.security import hash_password


def get_category(db: Session, category_id: int) -> Category | None:
    return db.get(Category, category_id)


def get_expense(db: Session, expense_id: int, owner_id: int) -> Expense | None:
    return db.scalar(select(Expense).where(Expense.id == expense_id, Expense.owner_id == owner_id))


def create_expense(db: Session, data: ExpenseCreate, owner_id: int) -> Expense:
    expense = Expense(**data.model_dump(), owner_id=owner_id)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def update_expense(db: Session, expense: Expense, data: ExpenseUpdate) -> Expense:
    for field, value in data.model_dump().items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, expense: Expense) -> None:
    db.delete(expense)
    db.commit()


def seed_database(db: Session) -> None:
    if not db.scalar(select(func.count()).select_from(Category)):
        db.add_all([
            Category(name="Food & Dining", description="Restaurants, groceries, and coffee"),
            Category(name="Transport", description="Public transit, fuel, and rides"),
            Category(name="Shopping", description="Personal and household purchases"),
            Category(name="Bills & Utilities", description="Recurring bills and utilities"),
            Category(name="Health", description="Healthcare and wellbeing"),
            Category(name="Entertainment", description="Events, subscriptions, and hobbies"),
        ])
        db.flush()

    demo_password = os.getenv("DEMO_USER_PASSWORD", "")
    if len(demo_password) < 8:
        raise RuntimeError("Set DEMO_USER_PASSWORD (at least 8 characters) to initialize Andrew's demo account.")

    demo_username = os.getenv("DEMO_USER_USERNAME", "andrew").strip().lower()
    demo_user = db.scalar(select(User).where(User.username == demo_username))
    if demo_user is None:
        demo_user = User(
            username=demo_username,
            full_name=os.getenv("DEMO_USER_FULL_NAME", "Andrew"),
            password_hash=hash_password(demo_password),
        )
        db.add(demo_user)
        db.flush()

    db.execute(
        Expense.__table__.update()
        .where(Expense.owner_id.is_(None))
        .values(owner_id=demo_user.id)
    )
    db.flush()

    if db.scalar(select(func.count()).select_from(Expense).where(Expense.owner_id == demo_user.id)):
        db.commit()
        return

    categories = db.scalars(select(Category)).all()
    category_ids = {category.name: category.id for category in categories}

    today = date.today()
    samples = [
        ("Weekly groceries", Decimal("68.40"), "Food & Dining", 2, "Card"),
        ("Metro pass", Decimal("32.00"), "Transport", 3, "Card"),
        ("Streaming subscription", Decimal("14.99"), "Entertainment", 7, "Credit card"),
        ("Pharmacy", Decimal("21.75"), "Health", 11, "Cash"),
        ("Electricity bill", Decimal("86.20"), "Bills & Utilities", 15, "Bank transfer"),
        ("Dinner with friends", Decimal("54.60"), "Food & Dining", 18, "Credit card"),
        ("Home essentials", Decimal("42.30"), "Shopping", 22, "Card"),
        ("Fuel", Decimal("47.00"), "Transport", 27, "Card"),
    ]
    expenses = []
    for month_offset in range(5, -1, -1):
        year = today.year
        month = today.month - month_offset
        while month <= 0:
            year -= 1
            month += 12
        for title, amount, category, day, payment in samples:
            safe_day = min(day, 28)
            expense_date = date(year, month, safe_day)
            if expense_date <= today:
                expenses.append(
                    Expense(
                        title=title,
                        amount=amount + Decimal(month_offset * 2),
                        category_id=category_ids[category],
                        owner_id=demo_user.id,
                        expense_date=expense_date,
                        payment_method=payment,
                        description=None,
                    )
                )
    db.add_all(expenses)
    db.commit()
