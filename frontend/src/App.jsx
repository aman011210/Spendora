import { useEffect, useState } from "react";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import LoadingIndicator from "./components/LoadingIndicator.jsx";
import api from "./services/api";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("expense_tracker_token");
    if (!token) {
      setCheckingSession(false);
      return;
    }
    api.get("/auth/me")
      .then((response) => setUser(response.data))
      .catch(() => localStorage.removeItem("expense_tracker_token"))
      .finally(() => setCheckingSession(false));
  }, []);

  const signIn = (response) => {
    localStorage.setItem("expense_tracker_token", response.access_token);
    setUser(response.user);
  };

  const signOut = () => {
    localStorage.removeItem("expense_tracker_token");
    setUser(null);
  };

  if (checkingSession) return <div className="app-loading"><LoadingIndicator /></div>;
  return user
    ? <Dashboard user={user} onLogout={signOut} />
    : <AuthPage onAuthenticated={signIn} />;
}
