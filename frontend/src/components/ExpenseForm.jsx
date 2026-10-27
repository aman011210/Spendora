import { useEffect, useState } from "react";
import { X } from "lucide-react";

const initialState = { title: "", amount: "", category_id: "", expense_date: new Date().toISOString().slice(0, 10), payment_method: "Card", description: "" };
const methods = ["Card", "Credit card", "Cash", "Bank transfer", "Digital wallet"];

export default function ExpenseForm({ expense, categories, onSubmit, onClose, busy }) {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  useEffect(() => {
    setForm(expense ? { ...expense, amount: String(expense.amount), category_id: String(expense.category_id), description: expense.description || "" } : { ...initialState, category_id: categories[0] ? String(categories[0].id) : "" });
    setError("");
  }, [expense, categories]);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim()) return setError("Enter an expense title.");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Amount must be greater than zero.");
    if (!form.category_id || !form.expense_date || !form.payment_method) return setError("Complete all required fields.");
    setError("");
    await onSubmit({ ...form, title: form.title.trim(), amount, category_id: Number(form.category_id), description: form.description.trim() || null });
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="expense-form-title">
        <div className="modal-heading"><div><span className="eyebrow">{expense ? "UPDATE RECORD" : "NEW RECORD"}</span><h2 id="expense-form-title">{expense ? "Edit expense" : "Add an expense"}</h2><p>Keep your spending records up to date.</p></div><button className="modal-close" aria-label="Close form" onClick={onClose}><X size={18} /></button></div>
        <form onSubmit={submit}>
          <label className="form-label">Expense title <span>*</span><input name="title" value={form.title} onChange={change} maxLength="120" placeholder="e.g. Weekly groceries" autoFocus required /></label>
          <div className="form-grid">
            <label className="form-label">Amount <span>*</span><div className="amount-input"><b>$</b><input name="amount" type="number" step="0.01" min="0.01" value={form.amount} onChange={change} placeholder="0.00" required /></div></label>
            <label className="form-label">Category <span>*</span><select name="category_id" value={form.category_id} onChange={change} required><option value="" disabled>Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          </div>
          <div className="form-grid">
            <label className="form-label">Date <span>*</span><input name="expense_date" type="date" value={form.expense_date} onChange={change} required /></label>
            <label className="form-label">Payment method <span>*</span><select name="payment_method" value={form.payment_method} onChange={change}>{methods.map((method) => <option key={method}>{method}</option>)}</select></label>
          </div>
          <label className="form-label">Description <em>Optional</em><textarea name="description" rows="3" maxLength="1000" value={form.description} onChange={change} placeholder="Add a note about this expense..." /></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="form-actions"><button type="button" className="button button-outline" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? "Saving..." : expense ? "Save changes" : "Add expense"}</button></div>
        </form>
      </section>
    </div>
  );
}
