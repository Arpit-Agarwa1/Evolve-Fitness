import React, { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { apiFetch } from "../../services/api";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import "../../styles/admin.css";

/**
 * Owner sign-in — uses POST /api/admin/login.
 */
export default function AdminLogin() {
  const { isAuthenticated, setToken } = useAdminAuth();
  const location = useLocation();
  const from = location.state?.from || "/admin";

  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    setErrorMessage("");
    setStatus("loading");

    try {
      const res = await apiFetch("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const token = res?.data?.token;
      if (!token) {
        throw new Error("No token returned");
      }
      setStatus("idle");
      setToken(token);
    } catch (err) {
      setStatus("idle");
      const status = err && typeof err === "object" && "status" in err ? err.status : undefined;
      let message =
        err instanceof Error ? err.message : "Sign-in failed.";
      if (status === 503) {
        message =
          "Sign-in is temporarily unavailable (server misconfiguration). Ask the host to set ADMIN_JWT_SECRET on the API.";
      }
      setErrorMessage(message);
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <p className="admin-login__eyebrow">Evolve Fitness</p>
        <h1 className="admin-login__title">Owner sign in</h1>
        <p className="admin-login__lede">
          Access registrations, messages, and membership leads.
        </p>

        <form className="admin-login__form" onSubmit={handleSubmit}>
          {errorMessage ? (
            <p className="admin-login__error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <label className="admin-login__label">
            <span>Email</span>
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              disabled={status === "loading"}
            />
          </label>
          <label className="admin-login__label">
            <span>Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={status === "loading"}
            />
          </label>

          <button
            type="submit"
            className="admin-login__submit"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="admin-login__footer">
          <Link to="/">Back to website</Link>
        </p>
      </div>
    </div>
  );
}
