import { ArrowDownRight, ArrowUpRight, CreditCard, ReceiptText, Tags, Wallet } from "lucide-react";
import { formatCurrency } from "../utils/currency.js";

export default function SummaryCards({ summary }) {
  const difference = Number(summary.current_month_spending) - Number(summary.previous_month_spending);
  const change = summary.previous_month_spending
    ? (difference / Number(summary.previous_month_spending)) * 100
    : null;
  const cards = [
    { label: "Spent this month", value: formatCurrency(summary.current_month_spending), icon: Wallet, hint: change === null ? "Compared with last month" : `${Math.abs(change).toFixed(1)}% ${difference <= 0 ? "less" : "more"} than last month`, tone: difference <= 0 ? "green" : "orange", trend: difference <= 0 ? ArrowDownRight : ArrowUpRight },
    { label: "Last month", value: formatCurrency(summary.previous_month_spending), icon: CreditCard, hint: "Previous month total", tone: "blue" },
    { label: "All expenses", value: summary.expense_count.toLocaleString(), icon: ReceiptText, hint: `Avg. ${formatCurrency(summary.average_expense)} per expense`, tone: "purple" },
    { label: "Top category", value: summary.highest_spending_category || "No data yet", icon: Tags, hint: "Highest total spend", tone: "yellow" },
  ];

  return (
    <section className="summary-grid" aria-label="Spending summary">
      {cards.map(({ label, value, icon: Icon, hint, tone, trend: Trend }) => (
        <article className="summary-card" key={label}>
          <div className={`summary-icon ${tone}`}><Icon size={19} /></div>
          <div className="summary-label">{label}</div>
          <div className="summary-value" title={value}>{value}</div>
          <div className={`summary-hint ${tone}`}>{Trend && <Trend size={14} />}{hint}</div>
        </article>
      ))}
    </section>
  );
}
