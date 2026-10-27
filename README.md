# Spendora — Expense Tracker with SQL Analytics

A full-stack expense management dashboard built to demonstrate CRUD APIs, relational database design, SQL analytics, and a responsive React interface. The dashboard’s totals and charts are calculated by FastAPI using SQLAlchemy queries against the database; no analytics are hardcoded in the browser.

## Architecture

```text
React + Vite (5173)
      | JSON REST / CSV download
      v
FastAPI + Pydantic (8000)
      | SQLAlchemy 2
      v
SQLite (local default) / PostgreSQL (configured)
```

The browser requests expenses, categories, and aggregated analytics from FastAPI. The API validates each request, builds SQL queries, and returns JSON (or a CSV attachment). SQLite is the friction-free development default; set `DATABASE_URL` to a PostgreSQL SQLAlchemy URL to use PostgreSQL instead.

## Features

- Create, list, search, filter, sort, edit, and delete expenses.
- Filter by category and inclusive date range; paginated API results.
- SQL-backed current/previous month totals, category breakdowns, averages, and monthly trends.
- Responsive dashboard with summary cards, Recharts charts, recent transactions, and clear loading/error/empty states.
- Amounts are displayed in Indian rupees (INR) throughout the interface, with a matching Spendora SVG favicon.
- Backend CSV export uses the active category, date, search, and sorting filters.
- Seeded categories and sample records across six months.
- Request validation, positive-amount database constraint, foreign key, missing-record 404s, CORS, and pytest API coverage.
- Account registration, Argon2 password hashing, bearer-token sessions, and per-user authorization for expenses and analytics.
- Andrew's seeded demo account owns the sample records; newly registered users start with a private empty ledger.

## Project structure

```text
backend/
  app/
    main.py                 FastAPI app, CORS, database initialization
    database.py             SQLAlchemy engine, session, declarative base
    models.py               Category and Expense relational models
    schemas.py              Pydantic request/response models
    crud.py                 CRUD helpers and sample data initialization
    routes/
      auth.py               Registration, login, signed bearer sessions
      expenses.py           Expense CRUD, search/filter/pagination, CSV
      analytics.py          Summary/category/monthly SQL analytics
      categories.py         Category lookup
    services/csv_export.py  CSV serialization
  sql/analytics_queries.sql Readable SQL examples
  tests/                    Isolated SQLite API tests
  requirements.txt
  .env.example
frontend/
  src/
    components/             Reusable forms, charts, filters, table, dialogs
    pages/Dashboard.jsx     Dashboard and API orchestration
    services/api.js         Axios client and API error formatting
    styles.css
  package.json
  vite.config.js
.gitignore
README.md
```

## Database schema

### `users`

| Column | Type | Constraints |
|---|---|---|
| `id` | Integer | Primary key |
| `username` | String(50) | Required, unique, indexed |
| `full_name` | String(100) | Required |
| `password_hash` | String(255) | Required; Argon2 hash, never plaintext |
| `created_at` | DateTime | Database initialized timestamp |

### `categories`

| Column | Type | Constraints |
|---|---|---|
| `id` | Integer | Primary key |
| `name` | String(60) | Required, unique, indexed |
| `description` | String(255) | Optional |

### `expenses`

| Column | Type | Constraints |
|---|---|---|
| `id` | Integer | Primary key |
| `title` | String(120) | Required, indexed |
| `amount` | Numeric(12,2) | Required, database check `amount > 0` |
| `category_id` | Integer | Required FK to `categories.id`, indexed with date |
| `owner_id` | Integer | Required FK to `users.id`; scopes each record to its owner |
| `expense_date` | Date | Required, indexed |
| `payment_method` | String(40) | Required |
| `description` | Text | Optional |
| `created_at`, `updated_at` | DateTime | Database initialized timestamps |

The `users` table stores a unique username, display name, Argon2 password hash, and creation timestamp. Expenses belong to one user; category lookup is shared. At startup, SQLAlchemy initializes tables, safely adds the ownership column to an older local expenses table, and assigns legacy rows to Andrew's demo account. For evolving production schemas, replace this bootstrap with Alembic migrations.

## API

All endpoints are prefixed with `/api`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | API health check |
| `POST` | `/auth/register` | Create an account and return a bearer token |
| `POST` | `/auth/login` | Verify credentials and start a session |
| `GET` | `/auth/me` | Return the authenticated account |
| `GET` | `/categories` | List available categories |
| `POST` | `/expenses` | Create an expense (`201`) |
| `GET` | `/expenses` | Search, filter, sort, and paginate expenses |
| `GET` | `/expenses/{expense_id}` | Get one expense (`404` when absent) |
| `PUT` | `/expenses/{expense_id}` | Replace an expense |
| `DELETE` | `/expenses/{expense_id}` | Delete an expense (`204`) |
| `GET` | `/expenses/export/csv` | Download CSV with the selected filters |
| `GET` | `/analytics/summary` | All-time/current/previous month metrics |
| `GET` | `/analytics/category` | Totals, count, and average by category |
| `GET` | `/analytics/monthly` | Monthly totals and monthly category totals |

All expense and analytics endpoints require `Authorization: Bearer <access_token>`. Each account can only read or modify its own expenses. Expense-list and export query parameters: `category_id`, `start_date` (`YYYY-MM-DD`), `end_date`, `search`, `sort_by` (`date` or `amount`), and `sort_order` (`asc` or `desc`). The list also accepts `page` (1-based) and `page_size` (1–100). Date ranges are inclusive and a start date later than the end date returns `422`. Monthly analytics accepts `months` (1–24, default 6).

Access tokens expire after 12 hours. The browser keeps the current token locally for the active account and clears it on sign-out. This demo uses stateless bearer tokens; production deployments should add rate limiting and consider secure, httpOnly cookie sessions and token revocation.

Interactive API documentation: `http://localhost:8000/docs`.

### Example requests

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/auth/login `
  -ContentType "application/json" -Body '{"username":"Rehaan","password":"YOUR_DEMO_PASSWORD"}'
$headers = @{ Authorization = "Bearer $($login.access_token)" }

# Create
Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/expenses `
  -ContentType "application/json" `
  -Headers $headers `
  -Body '{"title":"Coffee","amount":5.50,"category_id":1,"expense_date":"2026-10-27","payment_method":"Card","description":"Morning coffee"}'

# Search/filter
Invoke-RestMethod "http://localhost:8000/api/expenses?search=coffee&sort_by=amount&sort_order=desc" -Headers $headers

# Analytics
Invoke-RestMethod "http://localhost:8000/api/analytics/summary" -Headers $headers
Invoke-RestMethod "http://localhost:8000/api/analytics/monthly?months=6" -Headers $headers

# Download CSV
Invoke-WebRequest "http://localhost:8000/api/expenses/export/csv?category_id=1" -Headers $headers -OutFile expenses.csv
```

## Important SQL analytics

The runnable SQL examples are in [`backend/sql/analytics_queries.sql`](backend/sql/analytics_queries.sql). They include `JOIN`, `GROUP BY`, `SUM`, `COUNT`, `AVG`, ordering, and inclusive date filtering. API implementations use SQLAlchemy expressions that compile to SQL. Monthly grouping uses SQLite `strftime('%Y-%m', ...)` locally and PostgreSQL `to_char(..., 'YYYY-MM')` in PostgreSQL mode.

Key query shapes:

```sql
SELECT c.name, SUM(e.amount) AS total
FROM expenses e JOIN categories c ON c.id = e.category_id
GROUP BY c.id, c.name ORDER BY total DESC;

SELECT c.name, AVG(e.amount), COUNT(e.id)
FROM categories c LEFT JOIN expenses e ON e.category_id = c.id
GROUP BY c.id, c.name;
```

## Windows setup

Requirements: Python 3.10+ and Node.js 18+ (npm included).

### Backend

Open PowerShell in the project root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
# Replace SECRET_KEY and DEMO_USER_PASSWORD with private values before first startup.
uvicorn app.main:app --reload
```

If PowerShell blocks activation, use `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` for the current terminal and activate again. API: `http://localhost:8000`; docs: `http://localhost:8000/docs`. The SQLite file is created as `backend/expense_tracker.db`.

The backend `.env` file is ignored by Git. Generate a signing key with `python -c "import secrets; print(secrets.token_urlsafe(48))"` and set it as `SECRET_KEY`. Set a private password of at least eight characters as `DEMO_USER_PASSWORD`. On first startup, Andrew is created with that password and receives the seeded sample expenses. New users can register from the sign-in screen; their accounts start with no expenses.

### Frontend

In a second PowerShell terminal, from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite. Sign in with the Andrew demo credentials configured in `backend/.env`, or create a separate account. The frontend defaults to `http://localhost:8000/api`. To change it, create `frontend/.env.local` with `VITE_API_URL=http://localhost:8000/api` (do not commit local env files). For local frontend development, set `FRONTEND_ORIGINS` in `backend/.env` to the origin printed by Vite.

### PostgreSQL option

Create a database, install/run PostgreSQL, then set the backend `DATABASE_URL` environment variable before launching Uvicorn:

```powershell
$env:DATABASE_URL = "postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/expense_tracker"
uvicorn app.main:app --reload
```

For local frontend development, set `FRONTEND_ORIGINS` to the origin printed by Vite. Keep actual credentials local; never place them in source control. The `psycopg` driver is included in `requirements.txt`.

## Publish a public resume demo on Render

The root [`render.yaml`](./render.yaml) is a Render Blueprint for the FastAPI service, React static site, and managed PostgreSQL database. The site enables public registration and provides a shared editable demo account:

- App: `https://spendora-portfolio-web.onrender.com/`
- API: `https://spendora-lp20.onrender.com`
- Demo username: `Rehaan`
- Demo password: `Rehaan1234`

The demo password is intentionally public and is bundled into the frontend to provide a one-click **Fill demo login** action. Anyone can edit the demo account's data; do not store personal or production data in this account. New signups have independent private data. The login/signup page is designed by Amanul Haque.

1. Push this project to a GitHub repository. Ensure `backend/.env`, database files, and other local secrets are not tracked (`.gitignore` excludes them).
2. Sign in to Render and choose **New → Blueprint**; connect your GitHub repository and select the root `render.yaml`.
3. Review the resources before confirming: the API and static site are configured on free plans; the persistent PostgreSQL database uses `basic-256mb`, which is a paid plan. Confirm the current price in Render before provisioning. Free API instances may spin down while idle, causing a delay on the first request.
4. Wait for the database, API, and site deploys. The blueprint configures the API URL, CORS allowlist, health check, and database connection automatically.
5. Open the public site URL above, use **Fill demo login**, sign in, and verify the dashboard. The API is hosted at `https://spendora-lp20.onrender.com`. Use the actual URLs shown in Render if the suggested service names are unavailable; update `FRONTEND_ORIGINS` and `VITE_API_URL` in the Blueprint and redeploy if Render assigns different URLs.
6. Add the public app URL to your resume. Keep your hosting account credentials and database connection details private.

The Blueprint uses a generated signing secret in Render, and it does not depend on the local ignored `.env` file. To deploy elsewhere, configure `DATABASE_URL`, `SECRET_KEY` (at least 32 characters), `FRONTEND_ORIGINS`, `DEMO_USER_USERNAME`, `DEMO_USER_FULL_NAME`, `DEMO_USER_PASSWORD`, and the frontend build-time `VITE_API_URL` plus `VITE_DEMO_USERNAME` and `VITE_DEMO_PASSWORD`.

## Tests

From `backend` with the virtual environment active:

```powershell
pytest -q
```

Tests use a separate SQLite file named `test_expense_tracker.db`, exercise registration/login, per-user access control, CRUD/validation/404/date filtering/CSV, and verify SQL aggregation and monthly analytics.

## Screenshots

Add portfolio screenshots here after launching the app, for example:

- `docs/dashboard.png` — Dashboard overview and charts
- `docs/transactions.png` — Filtered transactions and CSV export

## Git and GitHub

Suggested commit sequence:

1. `feat: add SQLAlchemy models and seeded expense data`
2. `feat: implement expense and analytics APIs`
3. `feat: build responsive React expense dashboard`
4. `test: cover expense CRUD and SQL analytics`
5. `docs: document setup and API usage`

Initialize and publish (create an empty GitHub repository first):

```powershell
git init
git add .
git commit -m "feat: build expense tracker with SQL analytics"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git
git push -u origin main
```

`.gitignore` excludes local environment files, databases, Python virtual environments, and frontend build/dependency output. Do not commit credentials.

## Future improvements

- User authentication and per-user data isolation.
- Alembic migrations and managed PostgreSQL deployment.
- Budget goals, recurring transactions, and scheduled reports.
- Additional chart breakdowns, date presets, and accessibility review.
