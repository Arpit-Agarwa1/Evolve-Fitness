import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import BadmintonWhatsAppInvite from "../components/BadmintonWhatsAppInvite";
import { apiFetch } from "../services/api";
import { loadCashfreeScript } from "../utils/loadCashfree";
import {
  MEMBER_CATEGORIES,
  MEMBER_FEE_LADDER,
  MEMBER_PLAYER_LEVEL_OPTIONS,
  BADMINTON_MEMBER_PATH,
  REGISTRATION_CLOSES_LABEL,
  computeMemberFeeInr,
  formatInr,
  getCategoryById,
  isValidIndianMobile,
} from "../data/badmintonChampionship";
import "../styles/badminton.css";

const EMPTY = {
  fullName: "",
  mobile: "",
  gender: "",
  dateOfBirth: "",
  playerLevel: "beginner",
};

/**
 * Whether a member category is blocked for the selected gender.
 * @param {{ id: string }} cat
 * @param {string} gender
 */
function isCategoryBlockedForGender(cat, gender) {
  if (!cat || !gender) return false;
  if (cat.id === "womens_doubles" && gender !== "female") return true;
  if (cat.id === "mens_doubles" && gender !== "male") return true;
  return false;
}

/**
 * Poster 1 — Evolve Members Tournament (QR → /badminton/members).
 * MD / WD / Mixed Doubles cart (chit pairing) → Cashfree checkout.
 */
export default function BadmintonMembers() {
  const [step, setStep] = useState(
    /** @type {'details' | 'cart' | 'checkout' | 'done'} */ ("details")
  );
  const [form, setForm] = useState(EMPTY);
  /** @type {string[]} */
  const [selectedIds, setSelectedIds] = useState([]);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await apiFetch("/api/badminton/status?type=member");
      setStatus(res.data);
    } catch {
      /* non-blocking for cart UI */
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Return from Cashfree redirect — verify payment.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const registrationId = String(params.get("registrationId") || "")
      .trim()
      .toUpperCase();
    const orderId = String(params.get("order_id") || "").trim();
    if (!registrationId) return;

    let cancelled = false;
    (async () => {
      setSubmitting(true);
      setError("");
      try {
        const verifyRes = await apiFetch("/api/badminton/members/verify", {
          method: "POST",
          body: JSON.stringify({ registrationId, orderId }),
        });
        if (cancelled) return;
        setConfirmed(verifyRes.data?.registration ?? null);
        setStep("done");
        await loadStatus();
        window.history.replaceState({}, "", BADMINTON_MEMBER_PATH);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not confirm payment. If you paid, contact Evolve with your registration ID."
          );
        }
      } finally {
        if (!cancelled) setSubmitting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadStatus]);

  const feeInr = computeMemberFeeInr(selectedIds.length);

  const categoryMeta = useMemo(() => {
    /** @type {Record<string, { available: boolean; count: number; closed: boolean }>} */
    const map = {};
    for (const c of status?.categories ?? []) {
      map[c.id] = {
        available: Boolean(c.available),
        count: c.count ?? 0,
        closed: Boolean(c.closed),
      };
    }
    return map;
  }, [status]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateDetails() {
    if (!form.fullName.trim() || !form.mobile.trim()) {
      return "Name and mobile are required.";
    }
    if (!isValidIndianMobile(form.mobile)) {
      return "Enter a valid 10-digit Indian mobile number.";
    }
    if (!form.gender) {
      return "Select gender.";
    }
    if (!form.dateOfBirth) {
      return "Date of birth is required.";
    }
    return "";
  }

  function goToCart() {
    const err = validateDetails();
    if (err) {
      setError(err);
      return;
    }
    // Drop categories that no longer match gender (e.g. switched male → female).
    setSelectedIds((prev) =>
      prev.filter((id) => {
        const cat = getCategoryById(id, "member");
        return cat && !isCategoryBlockedForGender(cat, form.gender);
      })
    );
    setError("");
    setStep("cart");
  }

  function toggleCategory(categoryId) {
    setError("");
    const cat = getCategoryById(categoryId, "member");
    if (!cat) return;
    if (isCategoryBlockedForGender(cat, form.gender)) {
      setError(
        cat.id === "womens_doubles"
          ? "Women's Doubles is for female players only."
          : "Men's Doubles is for male players only."
      );
      return;
    }
    const meta = categoryMeta[categoryId];
    if (meta && !meta.available) {
      setError(`${cat.label} is full or closed.`);
      return;
    }

    setSelectedIds((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      if (prev.length >= 3) {
        setError("Maximum 3 events.");
        return prev;
      }
      return [...prev, categoryId];
    });
  }

  async function handleCheckout() {
    setError("");
    if (selectedIds.length < 1) {
      setError("Select at least one category.");
      return;
    }
    if (!status?.cashfreeEnabled && !status?.razorpayEnabled) {
      setError(
        "Payment is not configured yet. Add Cashfree keys on the server."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/badminton/members/checkout", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          mobile: form.mobile.trim(),
          gender: form.gender,
          dateOfBirth: form.dateOfBirth,
          playerLevel: form.playerLevel,
          categories: selectedIds,
        }),
      });

      const data = res.data;
      const Cashfree = await loadCashfreeScript();
      const cashfree = Cashfree({
        mode: data.mode === "production" ? "production" : "sandbox",
      });

      const result = await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_modal",
      });

      if (result?.error) {
        throw new Error(
          result.error.message || "Payment cancelled. You can try again."
        );
      }

      const verifyRes = await apiFetch("/api/badminton/members/verify", {
        method: "POST",
        body: JSON.stringify({
          registrationId: data.registrationId,
          orderId: data.orderId,
        }),
      });
      setConfirmed(verifyRes.data?.registration ?? null);
      setStep("done");
      await loadStatus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Checkout failed. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SEO
        title="EVOLVE Members Badminton Tournament 2026"
        description="Register for the EVOLVE Members Badminton Tournament — Men's, Women's & Mixed Doubles. Pay online via Cashfree. Pairing via chit system."
        path={BADMINTON_MEMBER_PATH}
      />
      <Navbar />
      <div className="badminton-page">
        <section className="badminton-hero badminton-hero--compact">
          <p className="badminton-eyebrow">Poster 1 · Members only</p>
          <h1 className="badminton-hero__title">
            Evolve Members Tournament
          </h1>
          <p className="badminton-hero__lede">
            Men&apos;s, Women&apos;s &amp; Mixed Doubles — up to 3 events.
            Pairing via <strong>chit system</strong>. Closes{" "}
            {REGISTRATION_CLOSES_LABEL}.
          </p>
        </section>

        <section className="badminton-register">
          {step !== "done" ? (
            <ol className="badminton-steps" aria-label="Progress">
              {["Details", "Events", "Pay"].map((label, i) => {
                const idx = step === "details" ? 0 : step === "cart" ? 1 : 2;
                return (
                  <li
                    key={label}
                    className={
                      i === idx ? "is-active" : i < idx ? "is-done" : undefined
                    }
                  >
                    <span>{i + 1}</span>
                    {label}
                  </li>
                );
              })}
            </ol>
          ) : null}

          {error ? (
            <p className="badminton-banner badminton-banner--error" role="alert">
              {error}
            </p>
          ) : null}

          {step === "details" ? (
            <form
              className="badminton-form"
              onSubmit={(e) => {
                e.preventDefault();
                goToCart();
              }}
            >
              <h2 className="badminton-form__title">Your details</h2>
              <p className="badminton-form__hint">
                Evolve members only. Pairing via chit system — no partner at
                signup.
              </p>

              <div className="badminton-form__grid">
                <label>
                  <span>Name *</span>
                  <input
                    value={form.fullName}
                    onChange={(e) => setField("fullName", e.target.value)}
                    autoComplete="name"
                    required
                  />
                </label>
                <label>
                  <span>Mobile *</span>
                  <input
                    value={form.mobile}
                    onChange={(e) => setField("mobile", e.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                    required
                  />
                </label>
                <label>
                  <span>Gender *</span>
                  <select
                    value={form.gender}
                    onChange={(e) => setField("gender", e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label>
                  <span>Date of birth *</span>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setField("dateOfBirth", e.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>Player level *</span>
                  <select
                    value={form.playerLevel}
                    onChange={(e) => setField("playerLevel", e.target.value)}
                    required
                  >
                    {MEMBER_PLAYER_LEVEL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="badminton-form__actions">
                <button
                  type="submit"
                  className="badminton-btn badminton-btn--primary"
                >
                  Continue to events
                </button>
              </div>
            </form>
          ) : null}

          {step === "cart" ? (
            <div className="badminton-form">
              <h2 className="badminton-form__title">Select events</h2>
              <p className="badminton-form__hint">
                Choose 1–3 categories. Partners are drawn by chit — do not enter
                a partner here.
              </p>

              <ul className="badminton-cart-list" style={{ listStyle: "none", padding: 0 }}>
                {MEMBER_CATEGORIES.map((c) => {
                  const meta = categoryMeta[c.id];
                  const blocked = isCategoryBlockedForGender(c, form.gender);
                  const unavailable = meta ? !meta.available : false;
                  const checked = selectedIds.includes(c.id);
                  const disabled = blocked || unavailable;

                  return (
                    <li key={c.id} className="badminton-cart-item">
                      <label
                        style={{
                          display: "flex",
                          gap: "0.75rem",
                          alignItems: "flex-start",
                          cursor: disabled && !checked ? "not-allowed" : "pointer",
                          opacity: disabled && !checked ? 0.55 : 1,
                          width: "100%",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled && !checked}
                          onChange={() => toggleCategory(c.id)}
                          style={{ marginTop: "0.35rem" }}
                        />
                        <div>
                          <strong>
                            {c.label} ({c.shortLabel})
                          </strong>
                          <span>
                            {blocked
                              ? c.id === "womens_doubles"
                                ? "Female players only"
                                : "Male players only"
                              : unavailable
                                ? "Full or closed"
                                : "Chit pairing · no partner needed"}
                            {meta
                              ? ` · ${meta.count}/${status?.categories?.find((x) => x.id === c.id)?.max ?? 16}`
                              : ""}
                          </span>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>

              <p className="badminton-fee" style={{ marginTop: "1rem" }}>
                {selectedIds.length === 0
                  ? "Select events to see fee"
                  : `${selectedIds.length} event${selectedIds.length > 1 ? "s" : ""} · ${formatInr(feeInr)}`}
              </p>
              <p className="badminton-form__hint">
                Fees:{" "}
                {MEMBER_FEE_LADDER.map(
                  (row) =>
                    `${row.events} event${row.events > 1 ? "s" : ""} ${formatInr(row.amountInr)}`
                ).join(" · ")}
              </p>

              <div className="badminton-form__actions">
                <button
                  type="button"
                  className="badminton-btn badminton-btn--ghost"
                  onClick={() => setStep("details")}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="badminton-btn badminton-btn--primary"
                  onClick={() => {
                    if (selectedIds.length < 1) {
                      setError("Select at least one event.");
                      return;
                    }
                    setError("");
                    setStep("checkout");
                  }}
                >
                  Review & pay
                </button>
              </div>
            </div>
          ) : null}

          {step === "checkout" ? (
            <div className="badminton-form badminton-form--review">
              <h2 className="badminton-form__title">Checkout</h2>
              <dl className="badminton-review">
                <div>
                  <dt>Name</dt>
                  <dd>{form.fullName}</dd>
                </div>
                <div>
                  <dt>Mobile</dt>
                  <dd>{form.mobile}</dd>
                </div>
                <div>
                  <dt>Gender / DOB</dt>
                  <dd>
                    {form.gender} · {form.dateOfBirth}
                  </dd>
                </div>
                <div>
                  <dt>Player level</dt>
                  <dd>{form.playerLevel}</dd>
                </div>
                <div>
                  <dt>Events ({selectedIds.length})</dt>
                  <dd>
                    {selectedIds.map((id) => {
                      const cat = getCategoryById(id, "member");
                      return (
                        <div key={id}>
                          {cat?.label ?? id} — chit system
                        </div>
                      );
                    })}
                  </dd>
                </div>
                <div>
                  <dt>Amount</dt>
                  <dd className="badminton-review__amount">
                    {formatInr(feeInr)}
                  </dd>
                </div>
              </dl>
              <p className="badminton-form__hint">
                Fees: 1 event ₹500 · 2 ₹800 · 3 ₹1,000. Pay securely via
                Cashfree.
              </p>
              <p className="badminton-payee-note">
                Payment will be collected by Tuff Lad Pro Limited (legal
                subsidiary of Evolve Fitness).
              </p>
              <div className="badminton-form__actions">
                <button
                  type="button"
                  className="badminton-btn badminton-btn--ghost"
                  onClick={() => setStep("cart")}
                >
                  Back to events
                </button>
                <button
                  type="button"
                  className="badminton-btn badminton-btn--primary"
                  onClick={handleCheckout}
                  disabled={submitting}
                >
                  {submitting ? "Please wait…" : `Pay ${formatInr(feeInr)}`}
                </button>
              </div>
            </div>
          ) : null}

          {step === "done" && confirmed ? (
            <div className="badminton-confirm" role="status">
              <p className="badminton-eyebrow">Paid & confirmed</p>
              <h2 className="badminton-confirm__title">Registration complete</h2>
              <p className="badminton-confirm__id">
                Registration ID: <strong>{confirmed.registrationId}</strong>
              </p>
              <dl className="badminton-review">
                <div>
                  <dt>Name</dt>
                  <dd>{confirmed.fullName}</dd>
                </div>
                <div>
                  <dt>Mobile</dt>
                  <dd>{confirmed.mobile}</dd>
                </div>
                <div>
                  <dt>Events</dt>
                  <dd>
                    {(confirmed.events || []).map((ev) => (
                      <div key={ev.categoryId}>
                        {ev.categoryLabel || ev.categoryId} — chit system
                      </div>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt>Amount paid</dt>
                  <dd>{formatInr(confirmed.amountInr ?? 0)}</dd>
                </div>
              </dl>
              <p className="badminton-form__hint">
                Pairing is by chit system — no partner needed at registration.
              </p>
              <p className="badminton-payee-note">
                Paid to Tuff Lad Pro Limited (legal subsidiary of Evolve Fitness).
              </p>
              <BadmintonWhatsAppInvite />
            </div>
          ) : null}

          {step !== "done" ? (
            <p className="badminton-form__hint" style={{ marginTop: "1.25rem" }}>
              Looking for the Open tournament?{" "}
              <Link to="/badminton/open">Go to Open registration</Link>
            </p>
          ) : null}
        </section>
      </div>
      <Footer />
    </>
  );
}
