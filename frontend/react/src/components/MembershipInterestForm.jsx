import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MEMBERSHIP_PLANS } from "../data/membershipPlans";
import { apiFetch } from "../services/api";

/**
 * Captures membership interest (POST /api/membership/leads) — populates admin **Membership leads**.
 * Plan pre-selects from `?plan=` when it matches a published plan id.
 */
export default function MembershipInterestForm() {
  const [searchParams] = useSearchParams();
  const validPlanIds = useMemo(
    () => new Set(MEMBERSHIP_PLANS.map((p) => p.id)),
    []
  );
  const planFromUrl = searchParams.get("plan");

  const [plan, setPlan] = useState(
    () =>
      planFromUrl && validPlanIds.has(planFromUrl)
        ? planFromUrl
        : MEMBERSHIP_PLANS[0].id
  );
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  /** @param {React.SyntheticEvent<HTMLFormElement>} e */
  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const notes = String(fd.get("notes") ?? "").trim();

    setErrorMessage("");
    setStatus("loading");

    try {
      await apiFetch("/api/membership/leads", {
        method: "POST",
        body: JSON.stringify({
          name: name || undefined,
          email,
          phone: phone || undefined,
          plan,
          notes: notes || undefined,
        }),
      });
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("idle");
      setErrorMessage(
        err instanceof Error ? err.message : "Could not send your details."
      );
    }
  }

  return (
    <section
      className="membership-lead-section"
      id="interest"
      aria-labelledby="membership-lead-heading"
    >
      <h2 id="membership-lead-heading" className="membership-lead-title">
        Express interest
      </h2>
      <p className="membership-lead-lede">
        Not ready to register online? Leave your email and we&apos;ll follow up
        about your plan.
      </p>

      {status === "sent" ? (
        <p className="membership-lead-success" role="status">
          Thanks — we&apos;ve received your interest and will be in touch soon.
        </p>
      ) : (
        <form
          className="membership-lead-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {errorMessage ? (
            <p className="membership-lead-error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <label className="membership-lead-label">
            <span className="membership-lead-label-text">Plan</span>
            <select
              name="plan"
              className="membership-lead-select"
              value={plan}
              onChange={(ev) => setPlan(ev.target.value)}
              aria-label="Membership plan"
            >
              {MEMBERSHIP_PLANS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} — {p.priceLabel}
                </option>
              ))}
            </select>
          </label>

          <label className="membership-lead-label">
            <span className="membership-lead-label-text">Email *</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>

          <label className="membership-lead-label">
            <span className="membership-lead-label-text">Name</span>
            <input
              type="text"
              name="name"
              autoComplete="name"
              maxLength={120}
              placeholder="Your name"
            />
          </label>

          <label className="membership-lead-label">
            <span className="membership-lead-label-text">Phone</span>
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              maxLength={32}
              placeholder="+91 …"
            />
          </label>

          <label className="membership-lead-label">
            <span className="membership-lead-label-text">Notes (optional)</span>
            <textarea
              name="notes"
              maxLength={2000}
              rows={3}
              placeholder="Best time to call, questions…"
            />
          </label>

          <button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Sending…" : "Send interest"}
          </button>
        </form>
      )}
    </section>
  );
}
