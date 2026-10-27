import { useState } from "react";
import { ArrowRight, ChartNoAxesCombined, ShieldCheck, Sparkles } from "lucide-react";
import api, { getErrorMessage } from "../services/api";
import BrandLogo from "../components/BrandLogo.jsx";

export default function AuthPage({ onAuthenticated }) {
  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState({ username: "", full_name: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const demoUsername = import.meta.env.VITE_DEMO_USERNAME || "";
  const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || "";

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const path = registering ? "/auth/register" : "/auth/login";
      const payload = registering
        ? form
        : { username: form.username, password: form.password };
      const response = await api.post(path, payload);
      onAuthenticated(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-layout">
        <section className="auth-story">
          <div className="auth-brand"><BrandLogo /></div>
          <div className="story-content">
            <span className="story-kicker"><Sparkles size={14} /> YOUR MONEY, IN A BETTER LIGHT</span>
            <h1>Make room for<br />what <em>matters.</em></h1>
            <p>A calmer way to understand your spending, build good habits, and make your next move count.</p>
            <div className="story-insight"><span className="insight-icon"><ChartNoAxesCombined size={18} /></span><span><strong>See the whole picture</strong><small>Real-time insights, shaped around you.</small></span><span className="insight-spark">↗</span></div>
          </div>
          <div className="story-footer"><ShieldCheck size={15} /> Private by design <span>·</span> Yours alone</div>
          <div className="story-orbit story-orbit-one" /><div className="story-orbit story-orbit-two" />
        </section>
        <section className="auth-card">
          <span className="eyebrow">{registering ? "A FRESH START" : "GOOD TO SEE YOU"}</span>
          <h2>{registering ? "Create your account" : "Welcome back"}</h2>
          <p className="auth-subtitle">{registering ? "Your own private space for smarter spending." : "Sign in to pick up where you left off."}</p>
          <form className="auth-form" onSubmit={submit}>
            {registering && <label className="form-label">Full name<input required minLength="1" maxLength="100" autoComplete="name" value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} placeholder="Your name" /></label>}
            <label className="form-label">Username<input required minLength="3" maxLength="50" autoComplete="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder={registering ? "Choose a username" : "andrew"} /></label>
            <label className="form-label">Password<input required minLength={registering ? 8 : 1} maxLength="128" type="password" autoComplete={registering ? "new-password" : "current-password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={registering ? "At least 8 characters" : "Your password"} /></label>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button type="submit" className="button button-primary auth-submit" disabled={busy}>{busy ? "Please wait..." : registering ? "Create account" : "Sign in"}<ArrowRight size={16} /></button>
          </form>
          <div className="auth-switch">{registering ? "Already have an account?" : "New to Spendora?"}<button onClick={() => { setRegistering(!registering); setError(""); }}> {registering ? "Sign in" : "Create an account"}</button></div>
          {!registering && demoPassword && <div className="demo-hint"><strong>Exploring the demo?</strong><span>Use the shared demo account. Demo records are public and editable.</span><button type="button" className="demo-fill-button" onClick={() => setForm((current) => ({ ...current, username: demoUsername || "andrew", password: demoPassword }))}>Fill demo login</button></div>}
          <p className="auth-footer"><ShieldCheck size={13} /> Your account and spending data stay private.</p>
        </section>
      </div>
    </main>
  );
}
