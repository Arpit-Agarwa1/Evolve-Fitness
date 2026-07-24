import React, { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import { apiFetch } from "../services/api";
import { loadRazorpayScript } from "../utils/loadRazorpay";
import {
  BADMINTON_CATEGORIES,
  PLAYER_LEVEL_OPTIONS,
  REGISTRATION_CLOSES_LABEL,
  MAX_ENTRIES_PER_CATEGORY,
  ageAsOf,
  computeRegistrationFeeInr,
  formatInr,
  getCategoryById,
  isValidIndianMobile,
  selectionNeedsPartner,
} from "../data/badmintonChampionship";
import "../styles/badminton.css";

const EMPTY_FORM = {
  fullName: "",
  mobile: "",
  email: "",
  gender: "",
  dateOfBirth: "",
  city: "",
  state: "",
  emergencyContact: "",
  isEvolveMember: false,
  membershipId: "",
  playerLevel: "amateur",
  clubName: "",
  partnerName: "",
  partnerMobile: "",
  categories: /** @type {string[]} */ ([]),
  acceptedRules: false,
};

/**
 * EVOLVE Badminton Championship 2026 — landing + multi-step registration.
 */
export default function Badminton() {
  const [view, setView] = useState(/** @type {'landing' | 'register'} */ ("landing"));
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState("");
  const [statusLoading, setStatusLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError("");
    try {
      const res = await apiFetch("/api/badminton/status");
      setStatus(res.data);
    } catch (err) {
      setStatus(null);
      setStatusError(
        err instanceof Error ? err.message : "Could not load tournament status."
      );
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const registrationOpen = Boolean(status?.open);
  const statusReady = !statusLoading && Boolean(status) && !statusError;
  const canStartRegister = statusReady && registrationOpen;
  const razorpayReady = Boolean(status?.razorpayEnabled);
  const needsPartner = selectionNeedsPartner(form.categories);

  const categoryMeta = useMemo(() => {
    /** @type {Record<string, { available: boolean; count: number; closed: boolean; full: boolean }>} */
    const map = {};
    for (const c of status?.categories ?? []) {
      map[c.id] = {
        available: Boolean(c.available),
        count: c.count ?? 0,
        closed: Boolean(c.closed),
        full: Boolean(c.full),
      };
    }
    return map;
  }, [status]);

  const visibleCategories = useMemo(() => {
    const group = form.isEvolveMember ? "member" : "open";
    return BADMINTON_CATEGORIES.filter((c) => c.group === group);
  }, [form.isEvolveMember]);

  const feeInr = computeRegistrationFeeInr(
    form.isEvolveMember,
    form.categories.length
  );

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCategory(id) {
    setForm((prev) => {
      const has = prev.categories.includes(id);
      if (has) {
        return {
          ...prev,
          categories: prev.categories.filter((c) => c !== id),
        };
      }
      if (prev.categories.length >= 3) return prev;
      return { ...prev, categories: [...prev.categories, id] };
    });
  }

  function validateDetails() {
    if (!form.fullName.trim() || !form.mobile.trim() || !form.email.trim()) {
      return "Name, mobile, and email are required.";
    }
    if (!isValidIndianMobile(form.mobile)) {
      return "Enter a valid 10-digit Indian mobile number.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Enter a valid email address.";
    }
    if (!form.gender) return "Select gender.";
    if (!form.dateOfBirth) return "Date of birth is required.";
    if (!form.city.trim() || !form.state.trim()) {
      return "City and state are required.";
    }
    if (!form.emergencyContact.trim()) {
      return "Emergency contact is required.";
    }
    if (form.playerLevel === "professional") {
      return "Professional players are not eligible.";
    }
    if (form.playerLevel === "semi_pro" && !form.clubName.trim()) {
      return "Semi-professional players must enter their club name.";
    }
    return "";
  }

  function validateCategories() {
    if (!statusReady) {
      return "Tournament status is unavailable. Refresh and try again.";
    }
    if (!registrationOpen) {
      return "Registration is closed.";
    }
    if (form.categories.length < 1) return "Select at least one category.";
    if (form.categories.length > 3) return "Maximum 3 categories.";

    const age = ageAsOf(form.dateOfBirth);
    for (const id of form.categories) {
      const meta = categoryMeta[id];
      if (!meta || !meta.available) {
        return "One of your categories is full or closed. Please update your selection.";
      }
      const cat = getCategoryById(id);
      if (cat?.minAge != null && age < cat.minAge) {
        return `${cat.label} requires age ${cat.minAge}+ (as of ${REGISTRATION_CLOSES_LABEL}).`;
      }
    }

    if (needsPartner) {
      if (!form.partnerName.trim()) {
        return "Partner name is required for doubles categories.";
      }
      if (!isValidIndianMobile(form.partnerMobile)) {
        return "Enter a valid 10-digit partner mobile number.";
      }
    }
    return "";
  }

  function validateReview() {
    if (!form.acceptedRules) {
      return "Please accept the tournament rules to continue.";
    }
    if (feeInr > 0 && !razorpayReady) {
      return "Online payment is temporarily unavailable. Please try again later or contact Evolve.";
    }
    return "";
  }

  function goNextFromDetails() {
    const err = validateDetails();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError("");
    setStep(1);
  }

  function goNextFromCategories() {
    const err = validateCategories();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError("");
    setStep(2);
  }

  async function handleCheckout() {
    const dErr = validateDetails();
    const cErr = validateCategories();
    const rErr = validateReview();
    if (dErr || cErr || rErr) {
      setFormError(dErr || cErr || rErr);
      if (dErr) setStep(0);
      else if (cErr) setStep(1);
      return;
    }

    if (!statusReady) {
      setFormError(
        statusError ||
          "Could not verify tournament status. Refresh the page and try again."
      );
      return;
    }
    if (!registrationOpen) {
      setFormError("Registration is closed.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const payload = {
        fullName: form.fullName.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        city: form.city.trim(),
        state: form.state.trim(),
        emergencyContact: form.emergencyContact.trim(),
        isEvolveMember: form.isEvolveMember,
        membershipId: form.membershipId.trim(),
        playerLevel: form.playerLevel,
        clubName: form.clubName.trim(),
        partnerName: needsPartner ? form.partnerName.trim() : "",
        partnerMobile: needsPartner ? form.partnerMobile.trim() : "",
        categories: form.categories,
      };

      const res = await apiFetch("/api/badminton/register/initiate", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = res.data;

      if (data?.free && data.registration) {
        setConfirmed(data.registration);
        setStep(3);
        await loadStatus();
        return;
      }

      const Razorpay = await loadRazorpayScript();
      await new Promise((resolve, reject) => {
        const options = {
          key: data.keyId,
          amount: data.amountPaise,
          currency: data.currency || "INR",
          name: "EVOLVE Fitness",
          description: `Badminton Championship — ${data.registrationId}`,
          order_id: data.orderId,
          prefill: data.prefill,
          theme: { color: "#0d9488" },
          handler: async (response) => {
            try {
              const verifyRes = await apiFetch("/api/badminton/register/verify", {
                method: "POST",
                body: JSON.stringify({
                  registrationId: data.registrationId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
              setConfirmed(verifyRes.data?.registration ?? null);
              setStep(3);
              await loadStatus();
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled. You can try again."));
            },
          },
        };
        const rzp = new Razorpay(options);
        rzp.on("payment.failed", (resp) => {
          reject(
            new Error(
              resp?.error?.description ||
                "Payment failed. Please try again."
            )
          );
        });
        rzp.open();
      });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Registration failed. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function startRegister() {
    if (!canStartRegister) return;
    setView("register");
    setStep(0);
    setFormError("");
    setConfirmed(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function categoryLabel(id) {
    return BADMINTON_CATEGORIES.find((c) => c.id === id)?.label ?? id;
  }

  const payDisabled =
    submitting ||
    !statusReady ||
    !registrationOpen ||
    (feeInr > 0 && !razorpayReady);

  return (
    <>
      <SEO
        title="EVOLVE Badminton Championship 2026 — Register"
        description="Register for the EVOLVE Badminton Championship 2026 at Evolve Fitness, Vivacity Mall Jaipur. Limited entries per category. Registration closes 6 August 2026."
        path="/badminton"
      />
      <Navbar />
      <div className="badminton-page">
        {view === "landing" ? (
          <>
            <section className="badminton-hero" aria-labelledby="badminton-hero-title">
              <div className="badminton-hero__glow" aria-hidden="true" />
              <p className="badminton-eyebrow">Championship 2026</p>
              <h1 id="badminton-hero-title" className="badminton-hero__title">
                EVOLVE Badminton Championship
              </h1>
              <p className="badminton-hero__lede">
                Premium court competition at Evolve Fitness. Registration confirmed
                only after successful payment. First come, first served —
                {MAX_ENTRIES_PER_CATEGORY} entries per category.
              </p>
              <div className="badminton-hero__actions">
                <button
                  type="button"
                  className="badminton-btn badminton-btn--primary"
                  onClick={startRegister}
                  disabled={!canStartRegister}
                >
                  Register now
                </button>
                <a href="#rules" className="badminton-btn badminton-btn--ghost">
                  Tournament rules
                </a>
              </div>
              {!statusLoading && statusError ? (
                <p className="badminton-banner badminton-banner--error" role="alert">
                  {statusError}{" "}
                  <button
                    type="button"
                    className="badminton-link-btn"
                    onClick={loadStatus}
                  >
                    Retry
                  </button>
                </p>
              ) : null}
              {!statusLoading && statusReady && !registrationOpen ? (
                <p className="badminton-banner badminton-banner--warn" role="status">
                  Registration is closed.
                </p>
              ) : null}
              {!statusLoading &&
              statusReady &&
              registrationOpen &&
              !razorpayReady ? (
                <p className="badminton-banner badminton-banner--warn" role="status">
                  Member (free) registration is open. Online payment for open
                  categories is being configured — check back shortly.
                </p>
              ) : null}
            </section>

            <section className="badminton-details" aria-labelledby="event-details">
              <h2 id="event-details" className="badminton-section-title">
                Event details
              </h2>
              <ul className="badminton-detail-list">
                <li>
                  <span>Venue</span>
                  <strong>Evolve Fitness — Vivacity Mall, Jaipur</strong>
                </li>
                <li>
                  <span>Registration closes</span>
                  <strong>{REGISTRATION_CLOSES_LABEL}</strong>
                </li>
                <li>
                  <span>Capacity</span>
                  <strong>
                    Max {MAX_ENTRIES_PER_CATEGORY} entries / category (FCFS)
                  </strong>
                </li>
                <li>
                  <span>Fees</span>
                  <strong>
                    EVOLVE members free · Open: 1 event ₹500 · 2 ₹750 · 3 ₹1,000
                  </strong>
                </li>
              </ul>
            </section>

            <section id="rules" className="badminton-rules" aria-labelledby="rules-heading">
              <h2 id="rules-heading" className="badminton-section-title">
                Tournament rules
              </h2>
              <ol className="badminton-rules-list">
                <li>Maximum {MAX_ENTRIES_PER_CATEGORY} entries per category — first come, first served.</li>
                <li>
                  Registration closes on {REGISTRATION_CLOSES_LABEL}, or earlier if a
                  category fills.
                </li>
                <li>
                  EVOLVE members may enter Men&apos;s / Mixed / Women&apos;s Doubles at no
                  charge (membership ID required; inactive online accounts are blocked).
                </li>
                <li>
                  Open categories: Men&apos;s age groups (60+/70+/80+/90+), Mixed Doubles
                  (55+/70+), and Women&apos;s Doubles. Age is checked as of{" "}
                  {REGISTRATION_CLOSES_LABEL}.
                </li>
                <li>Professional players are not eligible. Semi-pro entries require a club name.</li>
                <li>Doubles entries require partner name and mobile.</li>
                <li>Registration is confirmed only after successful Razorpay payment (members: free confirmation).</li>
              </ol>
              <button
                type="button"
                className="badminton-btn badminton-btn--primary"
                onClick={startRegister}
                disabled={!canStartRegister}
              >
                Register now
              </button>
            </section>
          </>
        ) : (
          <section
            className="badminton-register"
            aria-labelledby="register-heading"
          >
            <header className="badminton-register__header">
              <button
                type="button"
                className="badminton-back"
                onClick={() => {
                  if (step === 3) {
                    setView("landing");
                    setStep(0);
                    setForm(EMPTY_FORM);
                    setConfirmed(null);
                  } else if (step > 0) {
                    setStep((s) => s - 1);
                    setFormError("");
                  } else {
                    setView("landing");
                  }
                }}
              >
                ← Back
              </button>
              <h1 id="register-heading" className="badminton-register__title">
                Championship registration
              </h1>
              {step < 3 ? (
                <ol className="badminton-steps" aria-label="Progress">
                  {["Details", "Events", "Pay"].map((label, i) => (
                    <li
                      key={label}
                      className={
                        i === step
                          ? "is-active"
                          : i < step
                            ? "is-done"
                            : undefined
                      }
                    >
                      <span>{i + 1}</span>
                      {label}
                    </li>
                  ))}
                </ol>
              ) : null}
            </header>

            {formError ? (
              <p className="badminton-banner badminton-banner--error" role="alert">
                {formError}
              </p>
            ) : null}

            {step === 0 ? (
              <div className="badminton-form">
                <h2 className="badminton-form__title">Personal details</h2>
                <div className="badminton-form__grid">
                  <label>
                    <span>Full name *</span>
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
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="10-digit mobile"
                      required
                    />
                  </label>
                  <label>
                    <span>Email *</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      autoComplete="email"
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
                    <span>City *</span>
                    <input
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      autoComplete="address-level2"
                      required
                    />
                  </label>
                  <label>
                    <span>State *</span>
                    <input
                      value={form.state}
                      onChange={(e) => setField("state", e.target.value)}
                      autoComplete="address-level1"
                      required
                    />
                  </label>
                  <label className="badminton-form__span2">
                    <span>Emergency contact *</span>
                    <input
                      value={form.emergencyContact}
                      onChange={(e) =>
                        setField("emergencyContact", e.target.value)
                      }
                      placeholder="Name & phone"
                      required
                    />
                  </label>
                  <label>
                    <span>Player level *</span>
                    <select
                      value={form.playerLevel}
                      onChange={(e) => setField("playerLevel", e.target.value)}
                    >
                      {PLAYER_LEVEL_OPTIONS.map((o) => (
                        <option
                          key={o.value}
                          value={o.value}
                          disabled={o.value === "professional"}
                        >
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {(form.playerLevel === "semi_pro" ||
                    form.playerLevel === "club") && (
                    <label>
                      <span>
                        Club name
                        {form.playerLevel === "semi_pro" ? " *" : ""}
                      </span>
                      <input
                        value={form.clubName}
                        onChange={(e) => setField("clubName", e.target.value)}
                      />
                    </label>
                  )}
                </div>

                <label className="badminton-check">
                  <input
                    type="checkbox"
                    checked={form.isEvolveMember}
                    onChange={(e) => {
                      setField("isEvolveMember", e.target.checked);
                      setField("categories", []);
                    }}
                  />
                  <span>
                    I am an EVOLVE member (free Men&apos;s / Mixed / Women&apos;s
                    Doubles)
                  </span>
                </label>

                <div className="badminton-form__actions">
                  <button
                    type="button"
                    className="badminton-btn badminton-btn--primary"
                    onClick={goNextFromDetails}
                  >
                    Continue to events
                  </button>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="badminton-form">
                <h2 className="badminton-form__title">
                  {form.isEvolveMember
                    ? "Member categories (free)"
                    : "Open tournament categories"}
                </h2>
                <p className="badminton-form__hint">
                  Select 1–3 categories. Age-restricted open events need a matching
                  date of birth. Capacity: {MAX_ENTRIES_PER_CATEGORY} per category.
                </p>
                {!statusReady ? (
                  <p className="badminton-banner badminton-banner--warn" role="status">
                    {statusLoading
                      ? "Loading category availability…"
                      : statusError ||
                        "Could not load category slots. Check your connection and refresh."}
                  </p>
                ) : null}
                <ul className="badminton-category-list">
                  {visibleCategories.map((cat) => {
                    const meta = categoryMeta[cat.id];
                    const count = meta?.count ?? 0;
                    const slotAvailable = statusReady
                      ? Boolean(meta?.available)
                      : false;
                    const selected = form.categories.includes(cat.id);
                    const ageBlocked =
                      cat.minAge != null &&
                      form.dateOfBirth &&
                      ageAsOf(form.dateOfBirth) < cat.minAge;
                    const canSelect =
                      statusReady && slotAvailable && !ageBlocked;

                    let statusLabel = `${count}/${MAX_ENTRIES_PER_CATEGORY}`;
                    if (!statusReady) {
                      statusLabel = statusLoading ? "…" : "—";
                    } else if (ageBlocked) {
                      statusLabel = `Age ${cat.minAge}+`;
                    } else if (!slotAvailable) {
                      statusLabel = meta?.full ? "Full (16/16)" : "Closed";
                    }

                    return (
                      <li key={cat.id}>
                        <button
                          type="button"
                          className={`badminton-category${selected ? " is-selected" : ""}${!canSelect ? " is-disabled" : ""}`}
                          onClick={() => canSelect && toggleCategory(cat.id)}
                          disabled={!canSelect && !selected}
                          aria-pressed={selected}
                        >
                          <span className="badminton-category__label">
                            {cat.label}
                            {cat.minAge != null ? (
                              <span className="badminton-category__sub">
                                {" "}
                                · Age {cat.minAge}+
                              </span>
                            ) : null}
                          </span>
                          <span className="badminton-category__meta">
                            {statusLabel}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {needsPartner ? (
                  <div className="badminton-partner">
                    <h3 className="badminton-form__subtitle">Doubles partner</h3>
                    <p className="badminton-form__hint">
                      Required for doubles. If partners differ by event, use your
                      primary partner and inform Evolve.
                    </p>
                    <div className="badminton-form__grid">
                      <label>
                        <span>Partner name *</span>
                        <input
                          value={form.partnerName}
                          onChange={(e) =>
                            setField("partnerName", e.target.value)
                          }
                          required
                        />
                      </label>
                      <label>
                        <span>Partner mobile *</span>
                        <input
                          value={form.partnerMobile}
                          onChange={(e) =>
                            setField("partnerMobile", e.target.value)
                          }
                          inputMode="tel"
                          placeholder="10-digit mobile"
                          required
                        />
                      </label>
                    </div>
                  </div>
                ) : null}

                <p className="badminton-fee">
                  Fee: <strong>{formatInr(feeInr)}</strong>
                  {form.isEvolveMember ? " (member)" : null}
                </p>
                <div className="badminton-form__actions">
                  <button
                    type="button"
                    className="badminton-btn badminton-btn--primary"
                    onClick={goNextFromCategories}
                  >
                    Continue to payment
                  </button>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="badminton-form badminton-form--review">
                <h2 className="badminton-form__title">Review & pay</h2>
                <dl className="badminton-review">
                  <div>
                    <dt>Name</dt>
                    <dd>{form.fullName}</dd>
                  </div>
                  <div>
                    <dt>Contact</dt>
                    <dd>
                      {form.email} · {form.mobile}
                    </dd>
                  </div>
                  <div>
                    <dt>Categories</dt>
                    <dd>
                      {form.categories.map((id) => categoryLabel(id)).join(", ")}
                    </dd>
                  </div>
                  {needsPartner ? (
                    <div>
                      <dt>Partner</dt>
                      <dd>
                        {form.partnerName} · {form.partnerMobile}
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>Amount</dt>
                    <dd className="badminton-review__amount">
                      {formatInr(feeInr)}
                    </dd>
                  </div>
                </dl>
                <p className="badminton-form__hint">
                  {feeInr === 0
                    ? "No payment required — confirm to secure your free member entry."
                    : "You will complete payment securely via Razorpay (UPI, cards, net banking, wallets)."}
                </p>
                {feeInr > 0 && !razorpayReady ? (
                  <p className="badminton-banner badminton-banner--warn" role="status">
                    Online payment is temporarily unavailable. Please try again
                    later.
                  </p>
                ) : null}
                <label className="badminton-check">
                  <input
                    type="checkbox"
                    checked={form.acceptedRules}
                    onChange={(e) =>
                      setField("acceptedRules", e.target.checked)
                    }
                  />
                  <span>
                    I confirm my details are accurate and I accept the tournament
                    rules.
                  </span>
                </label>
                <div className="badminton-form__actions">
                  <button
                    type="button"
                    className="badminton-btn badminton-btn--primary"
                    onClick={handleCheckout}
                    disabled={payDisabled}
                  >
                    {submitting
                      ? "Please wait…"
                      : feeInr === 0
                        ? "Confirm registration"
                        : `Pay ${formatInr(feeInr)}`}
                  </button>
                </div>
              </div>
            ) : null}

            {step === 3 && confirmed ? (
              <div className="badminton-confirm" role="status">
                <p className="badminton-eyebrow">Confirmed</p>
                <h2 className="badminton-confirm__title">You&apos;re registered</h2>
                <p className="badminton-confirm__id">
                  Registration ID: <strong>{confirmed.registrationId}</strong>
                </p>
                <dl className="badminton-review">
                  <div>
                    <dt>Name</dt>
                    <dd>{confirmed.fullName}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{confirmed.email}</dd>
                  </div>
                  <div>
                    <dt>Categories</dt>
                    <dd>
                      {(confirmed.categories || [])
                        .map((id) => categoryLabel(id))
                        .join(", ")}
                    </dd>
                  </div>
                  {confirmed.partnerName ? (
                    <div>
                      <dt>Partner</dt>
                      <dd>
                        {confirmed.partnerName}
                        {confirmed.partnerMobile
                          ? ` · ${confirmed.partnerMobile}`
                          : ""}
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>Amount paid</dt>
                    <dd>
                      {formatInr(confirmed.amountInr ?? 0)}
                      {confirmed.paymentStatus === "waived"
                        ? " (waived)"
                        : ""}
                    </dd>
                  </div>
                </dl>
                <p className="badminton-form__hint">
                  Save this ID for check-in. A confirmation may also be sent to your
                  email once email delivery is configured.
                </p>
                <button
                  type="button"
                  className="badminton-btn badminton-btn--ghost"
                  onClick={() => {
                    setView("landing");
                    setStep(0);
                    setForm(EMPTY_FORM);
                    setConfirmed(null);
                  }}
                >
                  Back to event page
                </button>
              </div>
            ) : null}
          </section>
        )}
      </div>
      <Footer />
    </>
  );
}
