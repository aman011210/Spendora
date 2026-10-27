from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_.-]+$")
    full_name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username", "full_name")
    @classmethod
    def strip_user_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty.")
        return value


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str


class TokenRead(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None


class ExpenseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    category_id: int = Field(gt=0)
    expense_date: date
    payment_method: str = Field(min_length=1, max_length=40)
    description: str | None = Field(default=None, max_length=1000)

    @field_validator("title", "payment_method")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty.")
        return value

    @field_validator("description")
    @classmethod
    def strip_optional_description(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None


class ExpenseUpdate(ExpenseCreate):
    pass


class ExpenseRead(BaseModel):
    id: int
    title: str
    amount: Decimal
    category_id: int
    category_name: str
    expense_date: date
    payment_method: str
    description: str | None
    created_at: datetime
    updated_at: datetime


class ExpensePage(BaseModel):
    items: list[ExpenseRead]
    total: int
    page: int
    page_size: int


class CategoryTotal(BaseModel):
    category_id: int
    category: str
    total: Decimal
    expense_count: int
    average_amount: Decimal


class MonthlyTotal(BaseModel):
    month: str
    total: Decimal
    expense_count: int


class MonthlyCategoryTotal(BaseModel):
    month: str
    category: str
    total: Decimal


class Summary(BaseModel):
    total_spending: Decimal
    current_month_spending: Decimal
    previous_month_spending: Decimal
    expense_count: int
    highest_spending_category: str | None
    average_expense: Decimal


class MonthlyAnalytics(BaseModel):
    months: list[MonthlyTotal]
    categories: list[MonthlyCategoryTotal]
