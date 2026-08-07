import React, { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import BadmintonPlayerListsModal from "../components/BadmintonPlayerListsModal";
import BadmintonWhatsAppInvite from "../components/BadmintonWhatsAppInvite";
import TournamentAlreadyRegistered from "../components/TournamentAlreadyRegistered";
import { apiFetch } from "../services/api";
import { loadCashfreeScript } from "../utils/loadCashfree";
import {
  OPEN_CATEGORIES,
  OPEN_FEE_LADDER,
  OPEN_PLAYER_LEVEL_OPTIONS,
  OPEN_POSTER,
  OPEN_PRO_MIXED_PARTNER_MIN_AGE,
  BADMINTON_OPEN_PATH,
  REGISTRATION_CLOSES_LABEL,
  computeOpenFeeInr,
  formatInr,
  isValidIndianMobile,
  getCategoryById,
  getOpenMinAgeForGender,
  isOpenCategoryAllowedForLevel,
  isYoungVeteranCategory,
  openCategoryNeedsPartner,
  validateYoungVeteranAges,
} from "../data/badmintonChampionship";
import "../styles/badminton.css";

const EMPTY_DETAILS = {
  firstName: "",
  lastName: "",
  mobile: "",
  age: "",
  gender: "",
  playerLevel: "beginner",
};

/**
 * Poster 2 — Evolve Open Tournament (QR → /badminton/open).
 * MD / XD / WD cart → Cashfree checkout.
 */
export default function BadmintonOpen() {
  const [flow, setFlow] = useState(
    /** @type {'new' | 'amend'} */ (
      new URLSearchParams(window.location.search).get("amend") === "1"
        ? "amend"
        : "new"
    )
  );
  const [step, setStep] = useState(
    /** @type {'details' | 'cart' | 'checkout' | 'done'} */ ("details")
  );
  const [details, setDetails] = useState(EMPTY_DETAILS);
  /** @type {{ categoryId: string; partnerFirstName: string; partnerLastName: string; partnerAge: string; partnerMobile: string }[]} */
  const [cart, setCart] = useState([]);
  const [draftCategoryId, setDraftCategoryId] = useState("");
  const [draftPartnerFirstName, setDraftPartnerFirstName] = useState("");
  const [draftPartnerLastName, setDraftPartnerLastName] = useState("");
  const [draftPartnerAge, setDraftPartnerAge] = useState("");
  const [draftPartnerMobile, setDraftPartnerMobile] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [playerListsOpen, setPlayerListsOpen] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const res = await apiFetch("/api/badminton/status?type=open");
      setStatus(res.data);
    } catch {
      /* non-blocking for cart UI */
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const registrationId = String(params.get("registrationId") || "")
      .trim()
      .toUpperCase();
    const orderId = String(params.get("order_id") || "").trim();
    if (!registrationId) return;
    // Amend return is handled by TournamentAlreadyRegistered.
    if (params.get("amend") === "1") return;

    let cancelled = false;
    (async () => {
      setSubmitting(true);
      setError("");
      try {
        const verifyRes = await apiFetch("/api/badminton/open/verify", {
          method: "POST",
          body: JSON.stringify({ registrationId, orderId }),
        });
        if (cancelled) return;
        setConfirmed(verifyRes.data?.registration ?? null);
        setStep("done");
        await loadStatus();
        window.history.replaceState({}, "", BADMINTON_OPEN_PATH);
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

  const feeInr = computeOpenFeeInr(cart.length);
  const ageNum = Number(details.age);
  const age =
    details.age.trim() && Number.isFinite(ageNum) ? Math.round(ageNum) : NaN;
  const draftCat = draftCategoryId
    ? getCategoryById(draftCategoryId, "open")
    : null;
  const draftNeedsPartner = openCategoryNeedsPartner(draftCat);

  const categoryMeta = useMemo(() => {
    /** @type {Record<string, { available: boolean; count: number }>} */
    const map = {};
    for (const c of status?.categories ?? []) {
      map[c.id] = { available: Boolean(c.available), count: c.count ?? 0 };
    }
    return map;
  }, [status]);

  function setDetail(key, value) {
    setDetails((prev) => ({ ...prev, [key]: value }));
  }

  function validateDetails() {
    if (
      !details.firstName.trim() ||
      !details.lastName.trim() ||
      !details.mobile.trim()
    ) {
      return "First name, last name, and mobile are required.";
    }
    if (!isValidIndianMobile(details.mobile)) {
      return "Enter a valid 10-digit Indian mobile number.";
    }
    if (!["male", "female"].includes(details.gender)) {
      return "Select gender.";
    }
    const a = Number(details.age);
    if (!details.age.trim() || !Number.isFinite(a) || a < 1 || a > 120) {
      return "Enter a valid age in years.";
    }
    return "";
  }

  function fullNameFromDetails() {
    return `${details.firstName.trim()} ${details.lastName.trim()}`.trim();
  }

  function isCategoryBlockedForPlayer(cat) {
    if (!cat || Number.isNaN(age) || !details.gender) return false;
    if (!isOpenCategoryAllowedForLevel(cat, details.playerLevel)) {
      return true;
    }
    if (cat.division === "womens_doubles" && details.gender !== "female") {
      return true;
    }
    if (cat.division === "mens_doubles" && details.gender !== "male") {
      return true;
    }
    // Young Veteran: eligibility depends on partner age (checked on add).
    if (isYoungVeteranCategory(cat)) return false;
    const min = getOpenMinAgeForGender(cat, details.gender);
    return typeof min === "number" && age < min;
  }

  function goToCart() {
    const err = validateDetails();
    if (err) {
      setError(err);
      return;
    }
    // Drop cart rows that the current level can no longer enter (e.g. pro → MD).
    setCart((prev) =>
      prev.filter((item) => {
        const cat = getCategoryById(item.categoryId, "open");
        return Boolean(
          cat && isOpenCategoryAllowedForLevel(cat, details.playerLevel)
        );
      })
    );
    setError("");
    setStep("cart");
  }

  function addToCart() {
    setError("");
    if (!draftCategoryId) {
      setError("Select a category.");
      return;
    }
    if (cart.some((c) => c.categoryId === draftCategoryId)) {
      setError("That category is already in your cart.");
      return;
    }
    if (cart.length >= 4) {
      setError("Maximum 4 events.");
      return;
    }
    const cat = getCategoryById(draftCategoryId, "open");
    if (!cat) {
      setError("Invalid category.");
      return;
    }
    if (!isOpenCategoryAllowedForLevel(cat, details.playerLevel)) {
      setError(
        "Professionals may only enter Young Veteran and Mixed Doubles 75+ (partner aged 30+)."
      );
      return;
    }
    if (cat.division === "womens_doubles" && details.gender !== "female") {
      setError("Women's Doubles is for female players only.");
      return;
    }
    if (cat.division === "mens_doubles" && details.gender !== "male") {
      setError("Men's Doubles is for male players only.");
      return;
    }
    const playerMin = getOpenMinAgeForGender(cat, details.gender);
    if (typeof playerMin === "number" && !Number.isNaN(age) && age < playerMin) {
      setError(`${cat.label} requires minimum age ${playerMin}+ for you.`);
      return;
    }

    const needsPartner = openCategoryNeedsPartner(cat);

    if (!needsPartner) {
      setCart((prev) => [
        ...prev,
        {
          categoryId: draftCategoryId,
          partnerFirstName: "",
          partnerLastName: "",
          partnerAge: "",
          partnerMobile: "",
        },
      ]);
      setDraftCategoryId("");
      return;
    }

    if (!draftPartnerFirstName.trim() || !draftPartnerLastName.trim()) {
      setError("Enter partner first and last name.");
      return;
    }
    const partnerAgeNum = Number(draftPartnerAge);
    if (
      !draftPartnerAge.trim() ||
      !Number.isFinite(partnerAgeNum) ||
      partnerAgeNum < 1 ||
      partnerAgeNum > 120
    ) {
      setError("Enter a valid partner age.");
      return;
    }
    const partnerAgeRounded = Math.round(partnerAgeNum);

    if (isYoungVeteranCategory(cat)) {
      const yv = validateYoungVeteranAges(
        age,
        partnerAgeRounded,
        cat.veteranMinAge ?? 35
      );
      if (!yv.ok) {
        setError(yv.message);
        return;
      }
    } else {
      const partnerGender =
        cat.division === "mixed_doubles"
          ? details.gender === "male"
            ? "female"
            : "male"
          : details.gender;
      const partnerMin = getOpenMinAgeForGender(cat, partnerGender);
      if (typeof partnerMin === "number" && partnerAgeRounded < partnerMin) {
        setError(`Partner must be age ${partnerMin}+ for ${cat.label}.`);
        return;
      }
    }

    if (
      details.playerLevel === "professional" &&
      cat.id === "open_xd_75" &&
      partnerAgeRounded < OPEN_PRO_MIXED_PARTNER_MIN_AGE
    ) {
      setError(
        `Professionals need a partner aged ${OPEN_PRO_MIXED_PARTNER_MIN_AGE}+ for Mixed Doubles 75+.`
      );
      return;
    }

    if (
      draftPartnerMobile.trim() &&
      !isValidIndianMobile(draftPartnerMobile)
    ) {
      setError("Partner mobile must be a valid 10-digit number.");
      return;
    }

    setCart((prev) => [
      ...prev,
      {
        categoryId: draftCategoryId,
        partnerFirstName: draftPartnerFirstName.trim(),
        partnerLastName: draftPartnerLastName.trim(),
        partnerAge: String(partnerAgeRounded),
        partnerMobile: draftPartnerMobile.trim(),
      },
    ]);
    setDraftCategoryId("");
    setDraftPartnerFirstName("");
    setDraftPartnerLastName("");
    setDraftPartnerAge("");
    setDraftPartnerMobile("");
  }

  function removeFromCart(categoryId) {
    setCart((prev) => prev.filter((c) => c.categoryId !== categoryId));
  }

  function cartItemPartnerLabel(item) {
    const cat = getCategoryById(item.categoryId, "open");
    if (!openCategoryNeedsPartner(cat)) {
      return "Partner: chit system";
    }
    return `Partner: ${item.partnerFirstName} ${item.partnerLastName} · age ${item.partnerAge}${
      item.partnerMobile ? ` · ${item.partnerMobile}` : ""
    }`;
  }

  async function handleCheckout() {
    setError("");
    if (cart.length < 1) {
      setError("Add at least one category to cart.");
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
      const res = await apiFetch("/api/badminton/open/checkout", {
        method: "POST",
        body: JSON.stringify({
          firstName: details.firstName.trim(),
          lastName: details.lastName.trim(),
          fullName: fullNameFromDetails(),
          mobile: details.mobile.trim(),
          age: Math.round(Number(details.age)),
          gender: details.gender,
          playerLevel: details.playerLevel,
          cart: cart.map((item) => ({
            categoryId: item.categoryId,
            partnerFirstName: item.partnerFirstName,
            partnerLastName: item.partnerLastName,
            partnerAge: item.partnerAge ? Number(item.partnerAge) : null,
            partnerMobile: item.partnerMobile,
          })),
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

      const verifyRes = await apiFetch("/api/badminton/open/verify", {
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
        title="Evolve Badminton Open Championship 2026"
        description="Register for the Evolve Badminton Open Championship — Men's, Mixed & Women's Doubles plus Young Veteran. Online payment via Cashfree."
        path={BADMINTON_OPEN_PATH}
      />
      <Navbar />
      <div className="badminton-page badminton-page--court">
        <section className="badminton-hero badminton-hero--arena">
          <div className="badminton-hero__veil" aria-hidden="true" />
          <div className="badminton-hero__court-lines" aria-hidden="true" />
          <div className="badminton-hero__net" aria-hidden="true" />
          <p className="badminton-eyebrow">
            Open championship · {OPEN_POSTER.dateLabel}
          </p>
          <h1 className="badminton-hero__title">
            Evolve Badminton Open Championship
          </h1>
          <p className="badminton-hero__lede">
            Men&apos;s, Mixed &amp; Women&apos;s Doubles plus Young Veteran —
            up to 4 events. Closes {REGISTRATION_CLOSES_LABEL}.
          </p>
        </section>

        <section className="badminton-register">
          {flow === "new" && step !== "done" ? (
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

          {flow === "amend" && step !== "done" ? (
            <TournamentAlreadyRegistered
              lookupPath="/api/badminton/open/lookup"
              amendCheckoutPath="/api/badminton/open/amend/checkout"
              amendVerifyPath="/api/badminton/open/amend/verify"
              returnPath={BADMINTON_OPEN_PATH}
              maxEvents={4}
              categories={OPEN_CATEGORIES}
              computeFeeInr={computeOpenFeeInr}
              feeLadderHint="Fees: 1 event ₹500 · 2 ₹800 · 3 ₹1,000 · 4 ₹1,200. You only pay the difference from what you already paid."
              getCategoryById={(id) => getCategoryById(id, "open")}
              needsPartner={openCategoryNeedsPartner}
              isCategoryBlocked={(cat, player) => {
                const a = Number(player.age);
                if (!cat || !Number.isFinite(a) || !player.gender) return false;
                if (!isOpenCategoryAllowedForLevel(cat, String(player.playerLevel || ""))) {
                  return true;
                }
                if (cat.division === "womens_doubles" && player.gender !== "female") {
                  return true;
                }
                if (cat.division === "mens_doubles" && player.gender !== "male") {
                  return true;
                }
                if (isYoungVeteranCategory(cat)) return false;
                const min = getOpenMinAgeForGender(cat, String(player.gender));
                return typeof min === "number" && a < min;
              }}
              validatePartnerAdd={(cat, player, partner) => {
                if (!partner.firstName.trim() || !partner.lastName.trim()) {
                  return "Enter partner first and last name.";
                }
                const partnerAgeNum = Number(partner.age);
                if (
                  !partner.age.trim() ||
                  !Number.isFinite(partnerAgeNum) ||
                  partnerAgeNum < 1 ||
                  partnerAgeNum > 120
                ) {
                  return "Enter a valid partner age.";
                }
                const partnerAgeRounded = Math.round(partnerAgeNum);
                const age = Number(player.age);
                if (isYoungVeteranCategory(cat)) {
                  const yv = validateYoungVeteranAges(
                    age,
                    partnerAgeRounded,
                    cat.veteranMinAge ?? 35
                  );
                  if (!yv.ok) return yv.message;
                } else {
                  const partnerGender =
                    cat.division === "mixed_doubles"
                      ? player.gender === "male"
                        ? "female"
                        : "male"
                      : String(player.gender);
                  const partnerMin = getOpenMinAgeForGender(cat, partnerGender);
                  if (
                    typeof partnerMin === "number" &&
                    partnerAgeRounded < partnerMin
                  ) {
                    return `Partner must be age ${partnerMin}+ for ${cat.label}.`;
                  }
                }
                if (
                  player.playerLevel === "professional" &&
                  cat.id === "open_xd_75" &&
                  partnerAgeRounded < OPEN_PRO_MIXED_PARTNER_MIN_AGE
                ) {
                  return `Professionals need a partner aged ${OPEN_PRO_MIXED_PARTNER_MIN_AGE}+ for Mixed Doubles 75+.`;
                }
                if (partner.mobile.trim() && !isValidIndianMobile(partner.mobile)) {
                  return "Partner mobile must be a valid 10-digit number.";
                }
                return "";
              }}
              categoryMeta={categoryMeta}
              onCancel={() => {
                setFlow("new");
                setError("");
              }}
              onComplete={async (reg) => {
                setConfirmed(reg);
                setStep("done");
                setFlow("new");
                setError("");
                await loadStatus();
              }}
            />
          ) : null}

          {flow === "new" && step === "details" ? (
            <div className="badminton-form">
              <h2 className="badminton-form__title">Your details</h2>
              <div className="badminton-form__grid">
                <label>
                  <span>First name *</span>
                  <input
                    value={details.firstName}
                    onChange={(e) => setDetail("firstName", e.target.value)}
                    autoComplete="given-name"
                  />
                </label>
                <label>
                  <span>Last name *</span>
                  <input
                    value={details.lastName}
                    onChange={(e) => setDetail("lastName", e.target.value)}
                    autoComplete="family-name"
                  />
                </label>
                <label>
                  <span>Mobile *</span>
                  <input
                    value={details.mobile}
                    onChange={(e) => setDetail("mobile", e.target.value)}
                    inputMode="tel"
                  />
                </label>
                <label>
                  <span>Age *</span>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    inputMode="numeric"
                    placeholder="Age in years"
                    value={details.age}
                    onChange={(e) => setDetail("age", e.target.value)}
                  />
                </label>
                <label>
                  <span>Gender *</span>
                  <select
                    value={details.gender}
                    onChange={(e) => setDetail("gender", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </label>
                <label>
                  <span>Player level *</span>
                  <select
                    value={details.playerLevel}
                    onChange={(e) => setDetail("playerLevel", e.target.value)}
                  >
                    {OPEN_PLAYER_LEVEL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="badminton-form__hint">
                Professionals may enter Young Veteran and Mixed Doubles 75+
                (partner aged 30+). Semi-professionals may partner only with a
                Club player.
              </p>
              <div className="badminton-form__actions badminton-form__actions--stack">
                <button
                  type="button"
                  className="badminton-btn badminton-btn--ghost"
                  onClick={() => setPlayerListsOpen(true)}
                >
                  View pro &amp; semi-pro player list
                </button>
                <button
                  type="button"
                  className="badminton-btn badminton-btn--primary"
                  onClick={goToCart}
                >
                  Continue to categories
                </button>
                <button
                  type="button"
                  className="badminton-btn badminton-btn--ghost"
                  onClick={() => {
                    setFlow("amend");
                    setError("");
                  }}
                >
                  Already registered? Edit or add events
                </button>
              </div>
            </div>
          ) : null}

          {flow === "new" && step === "cart" ? (
            <div className="badminton-form">
              <h2 className="badminton-form__title">Add events to cart</h2>
              <p className="badminton-form__hint">
                Men&apos;s Doubles (60+/70+/80+/90+), Mixed Doubles (55+/75+),
                Women&apos;s Doubles (chit), Young Veteran. Max 4 events.
              </p>
              <p className="badminton-banner badminton-banner--warn" role="note">
                <strong>Note:</strong> This registration is for you only. Your
                partner must register separately and name you as their partner
                for the team to match. (Women&apos;s Doubles uses chit pairing —
                no partner registration needed.)
              </p>

              <div className="badminton-form__grid">
                <label className="badminton-form__span2">
                  <span>Category</span>
                  <select
                    value={draftCategoryId}
                    onChange={(e) => setDraftCategoryId(e.target.value)}
                  >
                    <option value="">Select</option>
                    {OPEN_CATEGORIES.map((c) => {
                      const inCart = cart.some((x) => x.categoryId === c.id);
                      const ageBlocked = isCategoryBlockedForPlayer(c);
                      const meta = categoryMeta[c.id];
                      const unavailable = meta && !meta.available;
                      return (
                        <option
                          key={c.id}
                          value={c.id}
                          disabled={inCart || ageBlocked || unavailable}
                        >
                          {c.label}
                          {inCart ? " — in cart" : ""}
                          {ageBlocked ? " — not eligible" : ""}
                          {unavailable ? " — full/closed" : ""}
                        </option>
                      );
                    })}
                  </select>
                  {draftCat?.hint ? (
                    <span className="badminton-form__field-note">
                      {draftCat.hint}
                    </span>
                  ) : null}
                </label>

                {draftNeedsPartner ? (
                  <>
                    <label>
                      <span>Partner first name *</span>
                      <input
                        value={draftPartnerFirstName}
                        onChange={(e) =>
                          setDraftPartnerFirstName(e.target.value)
                        }
                        autoComplete="off"
                      />
                    </label>
                    <label>
                      <span>Partner last name *</span>
                      <input
                        value={draftPartnerLastName}
                        onChange={(e) =>
                          setDraftPartnerLastName(e.target.value)
                        }
                        autoComplete="off"
                      />
                    </label>
                    <label>
                      <span>Partner age *</span>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        inputMode="numeric"
                        placeholder="Age in years"
                        value={draftPartnerAge}
                        onChange={(e) => setDraftPartnerAge(e.target.value)}
                      />
                    </label>
                    <label>
                      <span>Partner mobile (optional)</span>
                      <input
                        value={draftPartnerMobile}
                        onChange={(e) => setDraftPartnerMobile(e.target.value)}
                        inputMode="tel"
                      />
                    </label>
                  </>
                ) : draftCat?.division === "womens_doubles" ? (
                  <p className="badminton-form__hint badminton-form__span2">
                    Women&apos;s Doubles pairing is done through the chit system
                    — no partner details needed.
                  </p>
                ) : null}
              </div>
              <div className="badminton-form__actions">
                <button
                  type="button"
                  className="badminton-btn badminton-btn--ghost"
                  onClick={addToCart}
                >
                  Add to cart
                </button>
              </div>

              <h3 className="badminton-form__subtitle">Cart ({cart.length})</h3>
              {cart.length === 0 ? (
                <p className="badminton-form__hint">No events yet.</p>
              ) : (
                <ul className="badminton-cart-list">
                  {cart.map((item) => {
                    const cat = getCategoryById(item.categoryId, "open");
                    return (
                      <li key={item.categoryId} className="badminton-cart-item">
                        <div>
                          <strong>{cat?.label ?? item.categoryId}</strong>
                          <span>{cartItemPartnerLabel(item)}</span>
                        </div>
                        <button
                          type="button"
                          className="badminton-back"
                          onClick={() => removeFromCart(item.categoryId)}
                        >
                          Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <p className="badminton-fee">
                Checkout total: <strong>{formatInr(feeInr)}</strong>
                {cart.length > 0
                  ? ` · ${cart.length} event${cart.length > 1 ? "s" : ""}`
                  : ""}
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
                    if (cart.length < 1) {
                      setError("Add at least one event.");
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

          {flow === "new" && step === "checkout" ? (
            <div className="badminton-form badminton-form--review">
              <h2 className="badminton-form__title">Checkout</h2>
              <p className="badminton-banner badminton-banner--warn" role="note">
                <strong>Note:</strong> This registration is for you only. Your
                partner must register separately and name you as their partner
                for the team to match.
              </p>
              <dl className="badminton-review">
                <div>
                  <dt>Name</dt>
                  <dd>{fullNameFromDetails()}</dd>
                </div>
                <div>
                  <dt>Mobile</dt>
                  <dd>{details.mobile}</dd>
                </div>
                <div>
                  <dt>Age / Gender</dt>
                  <dd>
                    {details.age} · {details.gender}
                  </dd>
                </div>
                <div>
                  <dt>Events ({cart.length})</dt>
                  <dd>
                    {cart.map((item) => {
                      const cat = getCategoryById(item.categoryId, "open");
                      return (
                        <div key={item.categoryId}>
                          {cat?.label}: {cartItemPartnerLabel(item)}
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
                Fees: 1 event ₹500 · 2 ₹800 · 3 ₹1,000 · 4 ₹1,200. Pay securely
                via Cashfree.
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
                  Back to cart
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
              <h2 className="badminton-confirm__title">
                {(confirmed.eventCount ?? 0) > 0
                  ? "Registration saved"
                  : "Registration complete"}
              </h2>
              <p className="badminton-confirm__id">
                Registration ID: <strong>{confirmed.registrationId}</strong>
              </p>
              <dl className="badminton-review">
                <div>
                  <dt>Events</dt>
                  <dd>{confirmed.eventCount}</dd>
                </div>
                <div>
                  <dt>Partners</dt>
                  <dd>
                    {(confirmed.events || []).map((ev) => (
                      <div key={ev.categoryId}>
                        {ev.categoryLabel}:{" "}
                        {ev.partnerName
                          ? `${ev.partnerName}${
                              ev.partnerAge != null
                                ? `, age ${ev.partnerAge}`
                                : ""
                            }${
                              ev.partnerMobile ? ` · ${ev.partnerMobile}` : ""
                            }`
                          : "chit system"}
                      </div>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt>Amount paid</dt>
                  <dd>{formatInr(confirmed.amountInr ?? 0)}</dd>
                </div>
              </dl>
              <p className="badminton-payee-note">
                Paid to Tuff Lad Pro Limited (legal subsidiary of Evolve Fitness).
              </p>
              <BadmintonWhatsAppInvite />
            </div>
          ) : null}

        </section>

        <section className="badminton-details" aria-label="Tournament details">
          <h2 className="badminton-section-title">Tournament details</h2>
          <ul className="badminton-detail-list">
            <li>
              <span>Date &amp; time</span>
              <strong>
                {OPEN_POSTER.dateLabel} · {OPEN_POSTER.timeLabel}
              </strong>
            </li>
            <li>
              <span>Venue</span>
              <strong>{OPEN_POSTER.venue}</strong>
            </li>
            <li>
              <span>Organized by</span>
              <strong>{OPEN_POSTER.organizer}</strong>
            </li>
            <li>
              <span>Powered by</span>
              <strong>{OPEN_POSTER.poweredBy}</strong>
            </li>
            <li>
              <span>Registration</span>
              <strong>
                Online only · closes {OPEN_POSTER.registrationClosesLabel}
              </strong>
            </li>
            <li>
              <span>Contact</span>
              <strong>
                {OPEN_POSTER.contactName} ·{" "}
                <a href={`tel:+91${OPEN_POSTER.contactPhone}`}>
                  {OPEN_POSTER.contactPhone}
                </a>
              </strong>
            </li>
            <li>
              <span>Official shuttle</span>
              <strong>{OPEN_POSTER.shuttle}</strong>
            </li>
            <li>
              <span>Hospitality</span>
              <strong>{OPEN_POSTER.hospitality}</strong>
            </li>
            <li>
              <span>Prizes</span>
              <strong>{OPEN_POSTER.prizes}</strong>
            </li>
            <li>
              <span>Participation gift</span>
              <strong>{OPEN_POSTER.participationGift}</strong>
            </li>
            <li>
              <span>Entry cap</span>
              <strong>{OPEN_POSTER.maxEntriesNote}</strong>
            </li>
            <li>
              <span>Fees (per participant)</span>
              <strong>
                {OPEN_FEE_LADDER.map(
                  (row) =>
                    `${row.events} event${row.events > 1 ? "s" : ""} ${formatInr(row.amountInr)}`
                ).join(" · ")}
              </strong>
            </li>
          </ul>
        </section>

        <section className="badminton-rules" aria-label="Categories and rules">
          <h2 className="badminton-section-title">Categories &amp; rules</h2>
          <ul className="badminton-rules-list">
            <li>
              <strong>Men&apos;s Doubles:</strong> 60+ (min age 25), 70+ (min
              30), 80+ (min 35), 90+ (min 35) — combined age brackets.
            </li>
            <li>
              <strong>Mixed Doubles:</strong> 55+ (male min 30+, female open) ·
              75+ (female min 30+, male min 35+).
            </li>
            <li>
              <strong>Women&apos;s Doubles:</strong> pairing via chit system —
              no partner at signup.
            </li>
            <li>
              <strong>Young Veteran:</strong> young player age open · veteran
              min age 35+.
            </li>
            {OPEN_POSTER.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <button
            type="button"
            className="badminton-btn badminton-btn--ghost"
            onClick={() => setPlayerListsOpen(true)}
          >
            View pro &amp; semi-pro player list
          </button>
        </section>
      </div>
      <BadmintonPlayerListsModal
        open={playerListsOpen}
        onClose={() => setPlayerListsOpen(false)}
      />
      <Footer />
    </>
  );
}
