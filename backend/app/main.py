import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError

from app.database import Base, SessionLocal, engine
from app.crud import seed_database
from app.routes import analytics, auth, categories, expenses
from app import models
from app.security import get_secret_key

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    get_secret_key()
    Base.metadata.create_all(bind=engine)
    if "owner_id" not in {column["name"] for column in inspect(engine).get_columns("expenses")}:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE expenses ADD COLUMN owner_id INTEGER REFERENCES users(id)"))
            connection.execute(text("CREATE INDEX IF NOT EXISTS ix_expenses_owner_date ON expenses (owner_id, expense_date)"))
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(title="Expense Tracker with SQL Analytics", version="1.0.0", lifespan=lifespan)
origins = [origin.strip() for origin in os.getenv("FRONTEND_ORIGINS", "https://spendora-lp20.onrender.com").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(expenses.router)
app.include_router(analytics.router)
app.include_router(categories.router)
app.include_router(auth.router)


@app.exception_handler(SQLAlchemyError)
async def database_error_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    logger.exception("Database request failed: %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "A database error occurred. Please try again."})


@app.get("/api/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
