import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // check for valid JWT, then skip
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    fetch(`${API_BASE}/admin-auth/verify/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.ok) navigate("/admin/dashboard", { replace: true });
        else localStorage.removeItem("admin_token");
      })
      .catch(() => {});
  }, [navigate]);

  // handle the submit for password entry
  // password locally stored @ .env
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin-auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }
      const { token } = await res.json();
      localStorage.setItem("admin_token", token);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adminLoginPage">
      <main className="adminLoginContent">
        <div className="adminLoginCard">
          <h1 className="adminLoginTitle">Admin Panel</h1>
          <p className="adminLoginSubtitle">Enter your password to continue</p>
          <form onSubmit={handleSubmit} className="adminLoginForm">
            <div className="adminFormGroup">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                placeholder="Enter admin password"
              />
            </div>
            {error && <p className="adminLoginError">{error}</p>}
            <button type="submit" className="adminLoginBtn" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
