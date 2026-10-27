import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDeleteDialog({ expense, onCancel, onConfirm, busy }) {
  if (!expense) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <button className="modal-close" aria-label="Close dialog" onClick={onCancel}><X size={18} /></button>
        <div className="dialog-icon"><AlertTriangle size={21} /></div>
        <h2 id="delete-title">Delete this expense?</h2>
        <p><strong>{expense.title}</strong> will be permanently removed. This action cannot be undone.</p>
        <div className="dialog-actions"><button className="button button-outline" onClick={onCancel} disabled={busy}>Cancel</button><button className="button button-danger" onClick={onConfirm} disabled={busy}>{busy ? "Deleting..." : "Delete expense"}</button></div>
      </section>
    </div>
  );
}
