import { Download } from "lucide-react";
import api from "../services/api";

export async function exportExpenses(filters) {
  const params = Object.fromEntries(Object.entries(filters).filter(([key, value]) => ["category_id", "start_date", "end_date", "search", "sort_by", "sort_order"].includes(key) && value !== ""));
  const response = await api.get("/expenses/export/csv", { params, responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = "expenses.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ExportCSVButton({ onClick, disabled = false }) {
  return (
    <button type="button" className="button button-outline export-button" onClick={onClick} disabled={disabled}>
      <Download size={16} />
      <span>Export CSV</span>
    </button>
  );
}
