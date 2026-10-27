import { Search, SlidersHorizontal } from "lucide-react";
import ExportCSVButton from "./ExportCSVButton.jsx";

export default function ExpenseFilters({ filters, categories, onChange, onExport }) {
  const update = (key, value) => onChange({ ...filters, [key]: value, page: 1, page_size: 10 });
  return (
    <div className="filters-row">
      <label className="search-field">
        <Search size={17} />
        <input aria-label="Search expenses" placeholder="Search expenses..." value={filters.search} onChange={(event) => update("search", event.target.value)} />
      </label>
      <label className="filter-select"><SlidersHorizontal size={16} /><select aria-label="Filter by category" value={filters.category_id} onChange={(event) => update("category_id", event.target.value)}><option value="">All categories</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
      <label className="filter-date"><span>From</span><input aria-label="Start date" type="date" value={filters.start_date} onChange={(event) => update("start_date", event.target.value)} /></label>
      <label className="filter-date"><span>To</span><input aria-label="End date" type="date" value={filters.end_date} onChange={(event) => update("end_date", event.target.value)} /></label>
      <label className="filter-select sort-select"><select aria-label="Sort expenses" value={`${filters.sort_by}-${filters.sort_order}`} onChange={(event) => { const [sort_by, sort_order] = event.target.value.split("-"); onChange({ ...filters, sort_by, sort_order, page: 1, page_size: 10 }); }}><option value="date-desc">Newest first</option><option value="date-asc">Oldest first</option><option value="amount-desc">Amount: high to low</option><option value="amount-asc">Amount: low to high</option></select></label>
      <ExportCSVButton onClick={onExport} />
    </div>
  );
}
