-- Total spending, transaction count, and average amount by category.
SELECT c.name AS category,
       SUM(e.amount) AS total_spending,
       COUNT(e.id) AS expense_count,
       AVG(e.amount) AS average_amount
FROM expenses AS e
JOIN categories AS c ON c.id = e.category_id
GROUP BY c.id, c.name
ORDER BY total_spending DESC;

-- Number of expenses in each category, including categories with no expenses.
SELECT c.name AS category,
       COUNT(e.id) AS expense_count,
       COALESCE(SUM(e.amount), 0) AS total_spending,
       COALESCE(AVG(e.amount), 0) AS average_amount
FROM categories AS c
LEFT JOIN expenses AS e ON e.category_id = c.id
GROUP BY c.id, c.name
ORDER BY expense_count DESC, c.name;

-- Monthly spending and expense count (PostgreSQL).
SELECT DATE_TRUNC('month', expense_date)::date AS month,
       SUM(amount) AS total_spending,
       COUNT(*) AS expense_count
FROM expenses
GROUP BY DATE_TRUNC('month', expense_date)
ORDER BY month;

-- Monthly spending for each category (PostgreSQL).
SELECT DATE_TRUNC('month', e.expense_date)::date AS month,
       c.name AS category,
       SUM(e.amount) AS total_spending
FROM expenses AS e
JOIN categories AS c ON c.id = e.category_id
GROUP BY DATE_TRUNC('month', e.expense_date), c.id, c.name
ORDER BY month, category;

-- Overall average expense amount.
SELECT AVG(amount) AS average_expense
FROM expenses;

-- Compare current-month and previous-month spend (PostgreSQL).
SELECT
    COALESCE(SUM(amount) FILTER (
        WHERE expense_date >= DATE_TRUNC('month', CURRENT_DATE)::date
          AND expense_date < (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::date
    ), 0) AS current_month_spending,
    COALESCE(SUM(amount) FILTER (
        WHERE expense_date >= (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')::date
          AND expense_date < DATE_TRUNC('month', CURRENT_DATE)::date
    ), 0) AS previous_month_spending
FROM expenses;

-- Spending in a selected date range. Bind :start_date and :end_date.
SELECT e.id, e.title, e.amount, c.name AS category, e.expense_date
FROM expenses AS e
JOIN categories AS c ON c.id = e.category_id
WHERE e.expense_date BETWEEN :start_date AND :end_date
ORDER BY e.expense_date DESC;

-- Highest spending category.
SELECT c.name, SUM(e.amount) AS total_spending
FROM expenses AS e
JOIN categories AS c ON c.id = e.category_id
GROUP BY c.id, c.name
ORDER BY total_spending DESC
LIMIT 1;
