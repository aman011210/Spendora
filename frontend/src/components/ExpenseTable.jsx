import { ArrowDownLeft, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const initials = (title) => title.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export default function ExpenseTable({ expenses, onEdit, onDelete, loading }) {
  if (!loading && expenses.length === 0) return <div className="table-empty"><div className="empty-icon"><ArrowDownLeft size={22} /></div><strong>No expenses found</strong><span>Try changing your filters or add a new expense.</span></div>;
  return (
    <div className="table-scroll">
      <table className="expense-table">
        <thead><tr><th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th>PAYMENT</th><th className="align-right">AMOUNT</th><th aria-label="Actions" /></tr></thead>
        <tbody>
          {loading && !expenses.length ? <tr><td colSpan="6" className="table-loading">Loading expenses...</td></tr> : expenses.map((expense) => (
            <tr key={expense.id}>
              <td><div className="transaction-cell"><div className="transaction-avatar">{initials(expense.title)}</div><div><strong>{expense.title}</strong>{expense.description && <span>{expense.description}</span>}</div></div></td>
              <td><span className="category-pill">{expense.category_name}</span></td>
              <td className="muted-cell">{new Date(`${expense.expense_date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
              <td className="muted-cell">{expense.payment_method}</td>
              <td className="align-right amount-cell">{currency.format(expense.amount)}</td>
              <td><div className="row-actions"><button title="Edit expense" aria-label={`Edit ${expense.title}`} onClick={() => onEdit(expense)}><Pencil size={15} /></button><button title="Delete expense" aria-label={`Delete ${expense.title}`} className="delete-action" onClick={() => onDelete(expense)}><Trash2 size={15} /></button><MoreHorizontal size={16} className="more-icon" /></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
