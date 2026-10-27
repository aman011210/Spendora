import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const monthLabel = (month) => new Date(`${month}-02T00:00:00`).toLocaleDateString("en-US", { month: "short" });

export default function MonthlyTrendChart({ data }) {
  const chartData = data.map((item) => ({ ...item, label: monthLabel(item.month), total: Number(item.total) }));
  return chartData.length ? (
    <div className="trend-chart">
      <ResponsiveContainer width="100%" height={256}>
        <LineChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#edf0f5" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#98a1b2", fontSize: 12 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#98a1b2", fontSize: 11 }} tickFormatter={(value) => `$${value}`} width={48} />
          <Tooltip formatter={(value) => currency.format(value)} labelFormatter={(label) => `${label} spending`} />
          <Line type="monotone" dataKey="total" name="Spending" stroke="#147d70" strokeWidth={3} dot={{ r: 4, fill: "#147d70", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  ) : <div className="chart-empty">Your monthly trend will appear when expenses are recorded.</div>;
}
