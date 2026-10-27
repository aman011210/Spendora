import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpRight, CalendarDays, ChevronDown, CirclePlus, Command, LogOut, Menu } from "lucide-react";
import api, { getErrorMessage } from "../services/api";
import SummaryCards from "../components/SummaryCards";
import CategoryChart from "../components/CategoryChart";
import MonthlyTrendChart from "../components/MonthlyTrendChart";
import ExpenseFilters from "../components/ExpenseFilters";
import ExpenseTable from "../components/ExpenseTable";
import ExpenseForm from "../components/ExpenseForm";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";
import LoadingIndicator from "../components/LoadingIndicator";
import ErrorMessage from "../components/ErrorMessage";
import { exportExpenses } from "../components/ExportCSVButton";
import BrandLogo from "../components/BrandLogo.jsx";

const blankFilters = { search: "", category_id: "", start_date: "", end_date: "", sort_by: "date", sort_order: "desc", page: 1, page_size: 10 };
export default function Dashboard({ user, onLogout }) {
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState({ months: [], categories: [] });
  const [categories, setCategories] = useState([]);
  const [expensePage, setExpensePage] = useState({ items: [], total: 0, page: 1 });
  const [filters, setFilters] = useState(blankFilters);
  const [initialLoading, setInitialLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [busy, setBusy] = useState(false);
  const query = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "")), [filters]);

  const loadDashboard = useCallback(async () => {
    setError("");
    setListLoading(true);
    try {
      const [summaryResponse, categoryResponse, monthlyResponse, expensesResponse] = await Promise.all([
        api.get("/analytics/summary"),
        api.get("/analytics/category"),
        api.get("/analytics/monthly", { params: { months: 6 } }),
        api.get("/expenses", { params: { ...query, page_size: query.page_size || 10 } }),
      ]);
      setSummary(summaryResponse.data);
      setCategoryData(categoryResponse.data);
      setMonthlyData(monthlyResponse.data);
      setExpensePage((current) => query.page > 1
        ? {
          ...expensesResponse.data,
          items: [
            ...current.items,
            ...expensesResponse.data.items.filter((item) => !current.items.some((existing) => existing.id === item.id)),
          ],
        }
        : expensesResponse.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setInitialLoading(false);
      setListLoading(false);
    }
  }, [query]);

  useEffect(() => {
    api.get("/categories").then((response) => setCategories(response.data)).catch((requestError) => setError(getErrorMessage(requestError)));
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(loadDashboard, filters.search ? 250 : 0);
    return () => window.clearTimeout(timeout);
  }, [loadDashboard, filters.search]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const saveExpense = async (payload) => {
    setBusy(true);
    try {
      if (editingExpense) await api.put(`/expenses/${editingExpense.id}`, payload);
      else await api.post("/expenses", payload);
      setFormOpen(false);
      setEditingExpense(null);
      setToast(editingExpense ? "Expense updated successfully." : "Expense added successfully.");
      setFilters((current) => ({ ...current, page: 1, page_size: 10 }));
    } catch (requestError) {
      setToast(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const deleteExpense = async () => {
    setBusy(true);
    try {
      await api.delete(`/expenses/${deletingExpense.id}`);
      setDeletingExpense(null);
      setToast("Expense deleted successfully.");
      setFilters((current) => ({ ...current, page: 1, page_size: 10 }));
    } catch (requestError) {
      setToast(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const exportFiltered = async () => {
    try {
      await exportExpenses(filters);
    } catch (requestError) {
      setToast(getErrorMessage(requestError));
    }
  };

  if (initialLoading) return <div className="app-loading"><LoadingIndicator /></div>;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Spendora home"><BrandLogo /></a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="sidebar-nav"><a className="nav-item active" href="#overview"><span className="nav-square"><Command size={17} /></span>Overview</a><a className="nav-item" href="#transactions"><span className="nav-square"><ArrowDownToLine size={17} /></span>Transactions</a></nav>
        <div className="sidebar-bottom"><div className="help-card"><div className="help-orb">?</div><strong>Private workspace</strong><span>Your records are only visible to your account.</span></div><div className="profile-card"><div className="profile-avatar">{user.full_name.slice(0, 1).toUpperCase()}</div><div className="profile-info"><strong>{user.full_name}</strong><span>@{user.username}</span></div><button className="logout-button" onClick={onLogout} aria-label="Sign out" title="Sign out"><LogOut size={15} /></button></div></div>
      </aside>
      <main className="main-content">
        <header className="topbar"><a className="mobile-brand" href="#overview" aria-label="Spendora home"><BrandLogo /></a><div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div><div className="topbar-actions"><div className="date-chip"><CalendarDays size={15} />{new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div><span className="signed-in-user">{user.full_name}</span><button className="icon-button signout-top" onClick={onLogout} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button><button className="mobile-menu" aria-label="Sign out" onClick={onLogout}><LogOut size={20} /></button></div></header>
        <div className="dashboard-content" id="overview">
          <div className="page-heading"><div><span className="eyebrow">YOUR FINANCES AT A GLANCE</span><h1>Welcome, {user.full_name.split(" ")[0]} <span>✦</span></h1><p>Here’s what’s happening with your money.</p></div><button className="button button-primary add-button" onClick={() => { setEditingExpense(null); setFormOpen(true); }}><CirclePlus size={17} />Add expense</button></div>
          {error && <ErrorMessage message={error} onRetry={loadDashboard} />}
          {summary && <SummaryCards summary={summary} />}
          <section className="analytics-grid">
            <article className="panel trend-panel"><div className="panel-heading"><div><h2>Spending overview</h2><p>A look at your spending over time</p></div><span className="panel-period">Last 6 months <ChevronDown size={14} /></span></div><MonthlyTrendChart data={monthlyData.months} /></article>
            <article className="panel category-panel"><div className="panel-heading"><div><h2>By category</h2><p>Where your money goes</p></div><button className="more-button" aria-label="Category options">•••</button></div><CategoryChart data={categoryData} /></article>
          </section>
          <section className="panel transactions-panel" id="transactions">
            <div className="transactions-heading"><div><div className="title-with-icon"><h2>Recent transactions</h2><span className="count-badge">{expensePage.total}</span></div><p>Track and manage your latest expenses</p></div><button className="button button-text" onClick={() => setFilters({ ...blankFilters, page: 1, page_size: 100 })}>View all <ArrowUpRight size={15} /></button></div>
            <ExpenseFilters filters={filters} categories={categories} onChange={setFilters} onExport={exportFiltered} />
            <ExpenseTable expenses={expensePage.items} loading={listLoading} onEdit={(expense) => { setEditingExpense(expense); setFormOpen(true); }} onDelete={setDeletingExpense} />
            <div className="table-footer"><span>Showing <strong>{expensePage.items.length}</strong> of <strong>{expensePage.total}</strong> expenses</span>{expensePage.items.length < expensePage.total && <button className="button button-outline pagination-button" onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} disabled={listLoading}>Load more</button>}</div>
          </section>
          <footer className="footer-note"><span>Made for mindful spending.</span><span>Data updated just now <i /></span></footer>
        </div>
      </main>
      {formOpen && <ExpenseForm expense={editingExpense} categories={categories} onSubmit={saveExpense} onClose={() => { setFormOpen(false); setEditingExpense(null); }} busy={busy} />}
      <ConfirmDeleteDialog expense={deletingExpense} onCancel={() => setDeletingExpense(null)} onConfirm={deleteExpense} busy={busy} />
      {toast && <div className={`toast ${toast.toLowerCase().includes("successfully") ? "toast-success" : "toast-error"}`} role="status">{toast}</div>}
    </div>
  );
}
