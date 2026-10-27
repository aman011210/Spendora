from datetime import date
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.models import Category, Expense, User
from app.schemas import ExpenseCreate, ExpensePage, ExpenseRead, ExpenseUpdate
from app.security import get_current_user
from app.services.csv_export import expenses_to_csv

router = APIRouter(prefix="/api/expenses", tags=["expenses"])
DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def expense_statement(
    owner_id: int,
    category_id: int | None,
    start_date: date | None,
    end_date: date | None,
    search: str | None,
    sort_by: Literal["date", "amount"] = "date",
    sort_order: Literal["asc", "desc"] = "desc",
) -> Select:
    statement = (
        select(Expense, Category.name)
        .join(Category, Expense.category_id == Category.id)
        .where(Expense.owner_id == owner_id)
    )
    if category_id is not None:
        statement = statement.where(Expense.category_id == category_id)
    if start_date is not None:
        statement = statement.where(Expense.expense_date >= start_date)
    if end_date is not None:
        statement = statement.where(Expense.expense_date <= end_date)
    if search:
        statement = statement.where(Expense.title.ilike(f"%{search.strip()}%"))
    sort_column = Expense.amount if sort_by == "amount" else Expense.expense_date
    statement = statement.order_by(sort_column.asc() if sort_order == "asc" else sort_column.desc(), Expense.id.desc())
    return statement


def validate_date_range(start_date: date | None, end_date: date | None) -> None:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=422, detail="start_date cannot be later than end_date.")


def to_expense_read(expense: Expense, category_name: str) -> ExpenseRead:
    return ExpenseRead(
        id=expense.id,
        title=expense.title,
        amount=expense.amount,
        category_id=expense.category_id,
        category_name=category_name,
        expense_date=expense.expense_date,
        payment_method=expense.payment_method,
        description=expense.description,
        created_at=expense.created_at,
        updated_at=expense.updated_at,
    )


@router.post("", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(data: ExpenseCreate, db: DbSession, user: CurrentUser) -> ExpenseRead:
    if crud.get_category(db, data.category_id) is None:
        raise HTTPException(status_code=422, detail="The selected category does not exist.")
    expense = crud.create_expense(db, data, user.id)
    return to_expense_read(expense, expense.category.name)


@router.get("", response_model=ExpensePage)
def list_expenses(
    db: DbSession,
    user: CurrentUser,
    category_id: int | None = Query(default=None, ge=1),
    start_date: date | None = None,
    end_date: date | None = None,
    search: str | None = Query(default=None, max_length=120),
    sort_by: Literal["date", "amount"] = "date",
    sort_order: Literal["asc", "desc"] = "desc",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ExpensePage:
    validate_date_range(start_date, end_date)
    statement = expense_statement(user.id, category_id, start_date, end_date, search, sort_by, sort_order)
    filtered_ids = statement.with_only_columns(Expense.id).order_by(None).subquery()
    total = db.scalar(select(func.count()).select_from(filtered_ids)) or 0
    rows = db.execute(statement.offset((page - 1) * page_size).limit(page_size)).all()
    return ExpensePage(
        items=[to_expense_read(expense, category_name) for expense, category_name in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/export/csv")
def export_expenses_csv(
    db: DbSession,
    user: CurrentUser,
    category_id: int | None = Query(default=None, ge=1),
    start_date: date | None = None,
    end_date: date | None = None,
    search: str | None = Query(default=None, max_length=120),
    sort_by: Literal["date", "amount"] = "date",
    sort_order: Literal["asc", "desc"] = "desc",
) -> StreamingResponse:
    validate_date_range(start_date, end_date)
    content = expenses_to_csv(
        db,
        expense_statement(user.id, category_id, start_date, end_date, search, sort_by, sort_order),
    )
    return StreamingResponse(
        iter([content.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="expenses.csv"'},
    )


@router.get("/{expense_id}", response_model=ExpenseRead)
def read_expense(expense_id: int, db: DbSession, user: CurrentUser) -> ExpenseRead:
    if expense_id < 1:
        raise HTTPException(status_code=404, detail="Expense not found.")
    row = db.execute(
        select(Expense, Category.name)
        .join(Category, Expense.category_id == Category.id)
        .where(Expense.id == expense_id, Expense.owner_id == user.id)
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Expense not found.")
    return to_expense_read(*row)


@router.put("/{expense_id}", response_model=ExpenseRead)
def update_expense(expense_id: int, data: ExpenseUpdate, db: DbSession, user: CurrentUser) -> ExpenseRead:
    expense = crud.get_expense(db, expense_id, user.id) if expense_id > 0 else None
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found.")
    if crud.get_category(db, data.category_id) is None:
        raise HTTPException(status_code=422, detail="The selected category does not exist.")
    updated = crud.update_expense(db, expense, data)
    return to_expense_read(updated, updated.category.name)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: DbSession, user: CurrentUser) -> Response:
    expense = crud.get_expense(db, expense_id, user.id) if expense_id > 0 else None
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found.")
    crud.delete_expense(db, expense)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
