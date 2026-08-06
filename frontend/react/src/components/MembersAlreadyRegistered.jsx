import React, { useEffect, useRef, useState } from "react";
import { apiFetch } from "../services/api";
import { loadCashfreeScript } from "../utils/loadCashfree";
import {
  MEMBER_CATEGORIES,
  computeMemberFeeInr,
  formatInr,
  isValidIndianMobile,
} from "../data/badmintonChampionship";

/**
 * Members tournament — lookup + add categories (chit pairing), pay fee delta only.
 *
 * @param {{
 *   returnPath: string;
 *   categoryMeta: Record<string, { available?: boolean }>;
 *   onComplete: (registration: Record<string, unknown>) => void;
 *   onCancel: () => void;
 * }} props
 */
export default function MembersAlreadyRegistered({
  returnPath,
  categoryMeta,
  onComplete,
  onCancel,
}) {
  const [step, setStep] = useState(
    /** @type {'lookup' | 'cart' | 'checkout' | 'verifying'} */ ("lookup")
  );
  const [firstName, setFirstName] = useState("");
  const [mobile, setMobile] = useState("");
  /** @type {Record<string, unknown> | null} */
  const [registration, setRegistration] = useState(null);
  /** @type {string[]} */
  const [selectedIds, setSelectedIds] = useState([]);
  /** @type {string[]} */
  const [lockedIds, setLockedIds] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const alreadyPaid = Number(registration?.amountInr) || 0;
  const newTotal = computeMemberFeeInr(selectedIds.length);
  const deltaInr = Math.max(0, newTotal - alreadyPaid);
  const gender = String(registration?.gender || "");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isAmend = params.get("amend") === "1";
    const registrationId = String(params.get("registrationId") || "")
      .trim()
      .toUpperCase();
    const orderId = String(params.get("order_id") || "").trim();
    if (!isAmend || !registrationId) return;

    let cancelled = false;
    (async () => {
      setStep("verifying");
      setSubmitting(true);
      setError("");
      try {
        const verifyRes = await apiFetch("/api/badminton/members/amend/verify", {
          method: "POST",
          body: JSON.stringify({ registrationId, orderId }),
        });
        if (cancelled) return;
        window.history.replaceState({}, "", returnPath);
        onCompleteRef.current(verifyRes.data?.registration ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not confirm payment. If you paid, contact Evolve with your registration ID."
          );
          setStep("lookup");
        }
      } finally {
        if (!cancelled) setSubmitting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [returnPath]);

  async function handleLookup() {
    setError("");
    if (!firstName.trim() || !mobile.trim()) {
      setError("Enter first name and mobile.");
      return;
    }
    if (!isValidIndianMobile(mobile)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/badminton/members/lookup", {
        method: "POST",
        body: JSON.stringify({
          firstName: firstName.trim(),
          mobile: mobile.trim(),
        }),
      });
      const reg = res.data?.registration;
      if (!reg) {
        setError("No matching registration found.");
        return;
      }
      const ids = Array.isArray(reg.categories)
        ? reg.categories.map(String)
        : [];
      setRegistration(reg);
      setLockedIds(ids);
      setSelectedIds(ids);
      setStep("cart");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not find registration. Check first name and mobile."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function toggleCategory(id) {
    if (lockedIds.includes(id)) return;
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  function isBlocked(cat) {
    if (!gender) return false;
    if (cat.id === "womens_doubles" && gender !== "female") return true;
    if (cat.id === "mens_doubles" && gender !== "male") return true;
    return false;
  }

  async function handleSubmit() {
    setError("");
    if (selectedIds.length < 1) {
      setError("Keep at least one category.");
      return;
    }
    for (const id of lockedIds) {
      if (!selectedIds.includes(id)) {
        setError("Paid events cannot be removed.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/badminton/members/amend/checkout", {
        method: "POST",
        body: JSON.stringify({
          firstName: firstName.trim(),
          mobile: mobile.trim(),
          cart: selectedIds.map((categoryId) => ({ categoryId })),
        }),
      });

      const data = res.data;
      if (!data?.paymentRequired) {
        onComplete(data?.registration ?? null);
        return;
      }

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

      const verifyRes = await apiFetch("/api/badminton/members/amend/verify", {
        method: "POST",
        body: JSON.stringify({
          registrationId: data.registrationId,
          orderId: data.orderId,
        }),
      });
      onComplete(verifyRes.data?.registration ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Update failed. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "verifying") {
    return (
      <div className="badminton-form">
        <h2 className="badminton-form__title">Confirming payment…</h2>
        {error ? (
          <p className="badminton-banner badminton-banner--error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="badminton-form badminton-form--amend">
      <h2 className="badminton-form__title">Already registered?</h2>
      <p className="badminton-form__hint">
        Enter the first name and mobile from your members signup to add another
        event (pay only the difference).
      </p>

      {error ? (
        <p className="badminton-banner badminton-banner--error" role="alert">
          {error}
        </p>
      ) : null}

      {step === "lookup" ? (
        <>
          <div className="badminton-form__grid">
            <label>
              <span>First name *</span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </label>
            <label>
              <span>Mobile *</span>
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                inputMode="tel"
              />
            </label>
          </div>
          <div className="badminton-form__actions">
            <button
              type="button"
              className="badminton-btn badminton-btn--ghost"
              onClick={onCancel}
            >
              Back to new registration
            </button>
            <button
              type="button"
              className="badminton-btn badminton-btn--primary"
              onClick={handleLookup}
              disabled={submitting}
            >
              {submitting ? "Looking up…" : "Find my registration"}
            </button>
          </div>
        </>
      ) : null}

      {(step === "cart" || step === "checkout") && registration ? (
        <>
          <p className="badminton-banner badminton-banner--warn" role="note">
            <strong>{String(registration.registrationId)}</strong> ·{" "}
            {String(registration.fullName)} · already paid{" "}
            {formatInr(alreadyPaid)}. Max 2 events (chit pairing).
          </p>

          <div className="badminton-member-cats">
            {MEMBER_CATEGORIES.map((cat) => {
              const checked = selectedIds.includes(cat.id);
              const locked = lockedIds.includes(cat.id);
              const blocked = isBlocked(cat);
              const meta = categoryMeta[cat.id];
              const unavailable = meta && meta.available === false && !locked;
              const disabled =
                locked ||
                blocked ||
                unavailable ||
                (!checked && selectedIds.length >= 2);
              return (
                <label
                  key={cat.id}
                  className={
                    checked
                      ? "badminton-member-cat is-selected"
                      : "badminton-member-cat"
                  }
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleCategory(cat.id)}
                  />
                  <span>
                    {cat.label}
                    {locked ? " (paid)" : ""}
                    {blocked ? " — not eligible" : ""}
                    {unavailable ? " — full/closed" : ""}
                  </span>
                </label>
              );
            })}
          </div>

          <p className="badminton-fee">
            New total: <strong>{formatInr(newTotal)}</strong>
            {deltaInr > 0 ? (
              <>
                {" "}
                · pay difference <strong>{formatInr(deltaInr)}</strong>
              </>
            ) : (
              <> · no extra payment</>
            )}
          </p>

          <div className="badminton-form__actions">
            <button
              type="button"
              className="badminton-btn badminton-btn--ghost"
              onClick={() => {
                setStep("lookup");
                setRegistration(null);
              }}
            >
              Look up again
            </button>
            <button
              type="button"
              className="badminton-btn badminton-btn--primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? "Please wait…"
                : deltaInr > 0
                  ? `Pay ${formatInr(deltaInr)}`
                  : "Save"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
