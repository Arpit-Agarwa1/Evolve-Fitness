import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../styles/register.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiFetch } from "../services/api";

const PLANS = [
  { value: "essential", label: "Essential" },
  { value: "premium", label: "Premium" },
  { value: "elite", label: "Elite" },
  { value: "unknown", label: "Not sure yet" },
];

/**
 * Member signup — collects details and POSTs to the API.
 */
export default function Register() {
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get("plan");

  const defaultPlan = useMemo(() => {
    const p = planFromUrl?.toLowerCase();
    if (p === "essential" || p === "premium" || p === "elite") return p;
    return "unknown";
  }, [planFromUrl]);

  const [plan, setPlan] = useState(defaultPlan);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setPlan(defaultPlan);
  }, [defaultPlan]);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const fullName = String(fd.get("fullName") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const confirmPassword = String(fd.get("confirmPassword") ?? "");
    const dateOfBirth = String(fd.get("dateOfBirth") ?? "").trim();
    const city = String(fd.get("city") ?? "").trim();
    const planValue = String(fd.get("plan") ?? plan);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setErrorMessage("");
    setStatus("loading");

    try {
      await apiFetch("/api/members/register", {
        method: "POST",
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          confirmPassword,
          plan: planValue,
          dateOfBirth: dateOfBirth || undefined,
          city: city || undefined,
        }),
      });
      setStatus("success");
      form.reset();
      setPlan("unknown");
    } catch (err) {
      setStatus("idle");
      setErrorMessage(
        err instanceof Error ? err.message : "Registration failed."
      );
    }
  }

  return (
    <div className="register-page">
      <Navbar />

      <section className="register-hero">
        <p className="register-eyebrow">Join Evolve</p>
        <h1 className="register-title">Create your membership</h1>
        <p className="register-lede">
          Register your details to get started. Our team will confirm your plan
          and next steps.
        </p>
      </section>

      <section className="register-section">
        <div className="register-layout">
          {status === "success" ? (
            <div className="register-success-card">
              <h2 className="register-success-title">You&apos;re registered</h2>
              <p className="register-success-copy">
                Thank you for signing up. We&apos;ll reach out shortly with
                membership confirmation and onboarding details.
              </p>
              <div className="register-success-actions">
                <Link to="/" className="register-btn register-btn--primary">
                  Back to home
                </Link>
                <Link to="/membership" className="register-btn register-btn--ghost">
                  View plans
                </Link>
              </div>
            </div>
          ) : (
            <form className="register-form" onSubmit={handleSubmit}>
              <h2 className="register-form-title">Your details</h2>
              {errorMessage ? (
                <p className="register-form-error" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              <label className="register-label">
                <span className="register-label-text">Full name</span>
                <input
                  type="text"
                  name="fullName"
                  placeholder="As on your ID"
                  required
                  autoComplete="name"
                  disabled={status === "loading"}
                />
              </label>

              <label className="register-label">
                <span className="register-label-text">Email</span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  disabled={status === "loading"}
                />
              </label>

              <label className="register-label">
                <span className="register-label-text">Phone</span>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+91 …"
                  required
                  autoComplete="tel"
                  disabled={status === "loading"}
                />
              </label>

              <label className="register-label">
                <span className="register-label-text">City (optional)</span>
                <input
                  type="text"
                  name="city"
                  placeholder="Jaipur"
                  autoComplete="address-level2"
                  disabled={status === "loading"}
                />
              </label>

              <label className="register-label">
                <span className="register-label-text">
                  Date of birth (optional)
                </span>
                <input
                  type="date"
                  name="dateOfBirth"
                  disabled={status === "loading"}
                />
              </label>

              <label className="register-label">
                <span className="register-label-text">Plan interest</span>
                <select
                  name="plan"
                  value={plan}
                  onChange={(ev) => setPlan(ev.target.value)}
                  disabled={status === "loading"}
                >
                  {PLANS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="register-label">
                <span className="register-label-text">Password</span>
                <input
                  type="password"
                  name="password"
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={status === "loading"}
                />
              </label>

              <label className="register-label">
                <span className="register-label-text">Confirm password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Repeat password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={status === "loading"}
                />
              </label>

              <button
                type="submit"
                className="register-submit"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Creating account…" : "Complete signup"}
              </button>

              <p className="register-footnote">
                Already exploring plans?{" "}
                <Link to="/membership">Compare membership tiers</Link>
                {" · "}
                <Link to="/contact">Contact us</Link>
              </p>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
