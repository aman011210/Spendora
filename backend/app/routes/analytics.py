from calendar import monthrange
from datetime import date
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db, engine
from app.models import Category, Expense, User
from app.schemas import CategoryTotal, MonthlyAnalytics, MonthlyCategoryTotal, MonthlyTotal, Summary
from app.security import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])
DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def month_bounds(today: date) -> tuple[date, date, date, date]:
    current_start = today.replace(day=1)
    previous_end = current_start.fromordinal(current_start.toordinal() - 1)
    previous_start = previous_end.replace(day=1)
    current_end = today.replace(day=monthrange(today.year, today.month)[1])
    return current_start, current_end, previous_start, previous_end


@router.get("/summary", response_model=Summary)
def get_summary(db: DbSession, user: CurrentUser) -> Summary:
    today = date.today()
    current_start, current_end, previous_start, previous_end = month_bounds(today)
    total, count, average = db.execute(
        select(func.coalesce(func.sum(Expense.amount), 0), func.count(Expense.id), func.coalesce(func.avg(Expense.amount), 0))
        .where(Expense.owner_id == user.id)
    ).one()
    current_total = db.scalar(
        select(func.coalesce(func.sum(Expense.amount), 0))
        .where(Expense.owner_id == user.id, Expense.expense_date.between(current_start, current_end))
    )
    previous_total = db.scalar(
        select(func.coalesce(func.sum(Expense.amount), 0))
        .where(Expense.owner_id == user.id, Expense.expense_date.between(previous_start, previous_end))
    )
    highest = db.execute(
        select(Category.name)
        .join(Expense, Expense.category_id == Category.id)
        .where(Expense.owner_id == user.id)
        .group_by(Category.id, Category.name)
        .order_by(func.sum(Expense.amount).desc(), Category.name)
        .limit(1)
    ).scalar_one_or_none()
    return Summary(
        total_spending=Decimal(total),
        current_month_spending=Decimal(current_total or 0),
        previous_month_spending=Decimal(previous_total or 0),
        expense_count=count,
        highest_spending_category=highest,
        average_expense=Decimal(average),
    )


@router.get("/category", response_model=list[CategoryTotal])
def get_category_analytics(db: DbSession, user: CurrentUser) -> list[CategoryTotal]:
    rows = db.execute(
        select(
            Category.id,
            Category.name,
            func.coalesce(func.sum(Expense.amount), 0),
            func.count(Expense.id),
            func.coalesce(func.avg(Expense.amount), 0),
        )
        .outerjoin(Expense, (Expense.category_id == Category.id) & (Expense.owner_id == user.id))
        .group_by(Category.id, Category.name)
        .order_by(func.sum(Expense.amount).desc().nulls_last(), Category.name)
    ).all()
    return [
        CategoryTotal(
            category_id=category_id,
            category=name,
            total=Decimal(total),
            expense_count=count,
            average_amount=Decimal(average),
        )
        for category_id, name, total, count, average in rows
    ]


def month_expression():
    if engine.dialect.name == "sqlite":
        return func.strftime("%Y-%m", Expense.expense_date)
    return func.to_char(Expense.expense_date, "YYYY-MM")


@router.get("/monthly", response_model=MonthlyAnalytics)
def get_monthly_analytics(
    db: DbSession,
    user: CurrentUser,
    months: int = Query(default=6, ge=1, le=24),
) -> MonthlyAnalytics:
    month_key = month_expression()
    totals = db.execute(
        select(month_key, func.sum(Expense.amount), func.count(Expense.id))
        .where(Expense.owner_id == user.id)
        .group_by(month_key)
        .order_by(month_key.desc())
        .limit(months)
    ).all()
    category_totals = db.execute(
        select(month_key, Category.name, func.sum(Expense.amount))
        .join(Category, Expense.category_id == Category.id)
        .where(Expense.owner_id == user.id)
        .group_by(month_key, Category.id, Category.name)
        .order_by(month_key, Category.name)
    ).all()
    ordered_months = sorted((row[0], row[1], row[2]) for row in totals)
    included = {month for month, _, _ in ordered_months}
    return MonthlyAnalytics(
        months=[MonthlyTotal(month=month, total=Decimal(total), expense_count=count) for month, total, count in ordered_months],
        categories=[
            MonthlyCategoryTotal(month=month, category=category, total=Decimal(total))
            for month, category, total in category_totals
            if month in included
        ],
    )
