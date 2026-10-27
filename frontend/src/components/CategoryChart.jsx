import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "../utils/currency.js";

const COLORS = ["#147d70", "#d99b42", "#5a78a0", "#aa6e62", "#7d8f56", "#8568a6"];

export default function CategoryChart({ data }) {
  const chartData = data.filter((item) => Number(item.total) > 0);
  return (
    <div className="category-chart">
      {chartData.length ? (
        <>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={chartData} dataKey="total" nameKey="category" innerRadius={66} outerRadius={94} paddingAngle={3} stroke="none">
                  {chartData.map((item, index) => <Cell key={item.category_id} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center"><strong>{chartData.length}</strong><span>categories</span></div>
          </div>
          <div className="legend-list">
            {chartData.map((item, index) => (
              <div className="legend-row" key={item.category_id}>
                <span className="legend-dot" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="legend-name">{item.category}</span>
                <strong>{formatCurrency(item.total)}</strong>
              </div>
            ))}
          </div>
        </>
      ) : <div className="chart-empty">Add expenses to see your category breakdown.</div>}
    </div>
  );
}
