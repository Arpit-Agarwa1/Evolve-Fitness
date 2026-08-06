import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../services/api";
import { loadCashfreeScript } from "../utils/loadCashfree";
import { formatInr, isValidIndianMobile } from "../data/badmintonChampionship";

/**
 * @typedef {{
 *   categoryId: string;
 *   partnerFirstName: string;
 *   partnerLastName: string;
 *   partnerAge: string;
 *   partnerMobile: string;
 *   locked?: boolean;
 * }} AmendCartItem
 */

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 *   hint?: string;
 *   division?: string;
 * }} AmendCategory
 */

/**
 * Shared “already registered” flow: lookup → edit/add events → pay fee delta.
 *
 * @param {{
 *   lookupPath: string;
 *   amendCheckoutPath: string;
 *   amendVerifyPath: string;
 *   returnPath: string;
 *   maxEvents: number;
 *   categories: AmendCategory[];
 *   computeFeeInr: (count: number) => number;
 *   feeLadderHint: string;
 *   getCategoryById: (id: string) => AmendCategory | null | undefined;
 *   needsPartner: (cat: AmendCategory | null | undefined) => boolean;
 *   isCategoryBlocked: (cat: AmendCategory, player: Record<string, unknown>) => boolean;
 *   validatePartnerAdd: (
 *     cat: AmendCategory,
 *     player: Record<string, unknown>,
 *     partner: { firstName: string; lastName: string; age: string; mobile: string }
 *   ) => string;
 *   categoryMeta: Record<string, { available?: boolean }>;
 *   partnerOptionalLabel?: string;
 *   onComplete: (registration: Record<string, unknown>) => void;
 *   onCancel: () => void;
 *   autoVerifyFromUrl?: boolean;
 * }} props
 */
export default function TournamentAlreadyRegistered({
  lookupPath,
  amendCheckoutPath,
  amendVerifyPath,
  returnPath,
  maxEvents,
  categories,
  computeFeeInr,
  feeLadderHint,
  getCategoryById,
  needsPartner,
  isCategoryBlocked,
  validatePartnerAdd,
  categoryMeta,
  partnerOptionalLabel = "Partner mobile (optional)",
  onComplete,
  onCancel,
  autoVerifyFromUrl = true,
}) {
  const [step, setStep] = useState(
    /** @type {'lookup' | 'cart' | 'checkout' | 'verifying'} */ ("lookup")
  );
  const [firstName, setFirstName] = useState("");
  const [mobile, setMobile] = useState("");
  /** @type {Record<string, unknown> | null} */
  const [registration, setRegistration] = useState(null);
  /** @type {AmendCartItem[]} */
  const [cart, setCart] = useState([]);
  const [draftCategoryId, setDraftCategoryId] = useState("");
  const [draftPartnerFirstName, setDraftPartnerFirstName] = useState("");
  const [draftPartnerLastName, setDraftPartnerLastName] = useState("");
  const [draftPartnerAge, setDraftPartnerAge] = useState("");
  const [draftPartnerMobile, setDraftPartnerMobile] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  /** Locked category ids from original registration (cannot remove). */
  const [lockedIds, setLockedIds] = useState(/** @type {string[]} */ ([]));
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const player = useMemo(() => {
    if (!registration) return {};
    const nameParts = String(registration.fullName || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return {
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      fullName: registration.fullName,
      mobile: registration.mobile,
      gender: registration.gender,
      age: registration.age,
      playerLevel: registration.playerLevel,
    };
  }, [registration]);

  const alreadyPaid = Number(registration?.amountInr) || 0;
  const newTotal = computeFeeInr(cart.length);
  const deltaInr = Math.max(0, newTotal - alreadyPaid);
  const draftCat = draftCategoryId ? getCategoryById(draftCategoryId) : null;
  const draftNeedsPartner = needsPartner(draftCat);

  // Cashfree return for amend payment.
  useEffect(() => {
    if (!autoVerifyFromUrl) return;
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
        const verifyRes = await apiFetch(amendVerifyPath, {
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
  }, [amendVerifyPath, autoVerifyFromUrl, returnPath]);

  /**
   * @param {Record<string, unknown>} reg
   */
  function hydrateCartFromRegistration(reg) {
    const events = Array.isArray(reg.events) ? reg.events : [];
    const ids = events.map((e) => String(e.categoryId));
    setLockedIds(ids);
    setCart(
      events.map((e) => {
        let partnerFirstName = String(e.partnerFirstName || "").trim();
        let partnerLastName = String(e.partnerLastName || "").trim();
        if (!partnerFirstName && !partnerLastName && e.partnerName) {
          const parts = String(e.partnerName)
            .trim()
            .split(/\s+/)
            .filter(Boolean);
          partnerFirstName = parts[0] || "";
          partnerLastName = parts.slice(1).join(" ") || "";
        }
        return {
          categoryId: String(e.categoryId),
          partnerFirstName,
          partnerLastName,
          partnerAge:
            e.partnerAge != null && e.partnerAge !== ""
              ? String(e.partnerAge)
              : "",
          partnerMobile: String(e.partnerMobile || "").trim(),
          locked: true,
        };
      })
    );
  }

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
      const res = await apiFetch(lookupPath, {
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
      setRegistration(reg);
      hydrateCartFromRegistration(reg);
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

  function updateCartItem(categoryId, patch) {
    setCart((prev) =>
      prev.map((item) =>
        item.categoryId === categoryId ? { ...item, ...patch } : item
      )
    );
  }

  function addToCart() {
    setError("");
    if (!draftCategoryId) {
      setError("Select a category.");
      return;
    }
    if (cart.some((c) => c.categoryId === draftCategoryId)) {
      setError("That category is already in your list.");
      return;
    }
    if (cart.length >= maxEvents) {
      setError(`Maximum ${maxEvents} events.`);
      return;
    }
    const cat = getCategoryById(draftCategoryId);
    if (!cat) {
      setError("Invalid category.");
      return;
    }
    if (isCategoryBlocked(cat, player)) {
      setError("You are not eligible for that category.");
      return;
    }
    const meta = categoryMeta[draftCategoryId];
    if (meta && meta.available === false) {
      setError("That category is full or closed.");
      return;
    }

    if (!needsPartner(cat)) {
      setCart((prev) => [
        ...prev,
        {
          categoryId: draftCategoryId,
          partnerFirstName: "",
          partnerLastName: "",
          partnerAge: "",
          partnerMobile: "",
          locked: false,
        },
      ]);
      setDraftCategoryId("");
      return;
    }

    const partnerErr = validatePartnerAdd(cat, player, {
      firstName: draftPartnerFirstName,
      lastName: draftPartnerLastName,
      age: draftPartnerAge,
      mobile: draftPartnerMobile,
    });
    if (partnerErr) {
      setError(partnerErr);
      return;
    }

    setCart((prev) => [
      ...prev,
      {
        categoryId: draftCategoryId,
        partnerFirstName: draftPartnerFirstName.trim(),
        partnerLastName: draftPartnerLastName.trim(),
        partnerAge: String(Math.round(Number(draftPartnerAge))),
        partnerMobile: draftPartnerMobile.trim(),
        locked: false,
      },
    ]);
    setDraftCategoryId("");
    setDraftPartnerFirstName("");
    setDraftPartnerLastName("");
    setDraftPartnerAge("");
    setDraftPartnerMobile("");
  }

  function removeFromCart(categoryId) {
    if (lockedIds.includes(categoryId)) {
      setError("Paid events cannot be removed. You can edit partner details.");
      return;
    }
    setCart((prev) => prev.filter((c) => c.categoryId !== categoryId));
  }

  function cartItemPartnerLabel(item) {
    const cat = getCategoryById(item.categoryId);
    if (!needsPartner(cat)) {
      if (cat?.division === "womens_doubles") return "Partner: chit system";
      return "No partner needed";
    }
    return `Partner: ${item.partnerFirstName} ${item.partnerLastName} · age ${item.partnerAge}${
      item.partnerMobile ? ` · ${item.partnerMobile}` : ""
    }`;
  }

  function validateCartPartners() {
    for (const item of cart) {
      const cat = getCategoryById(item.categoryId);
      if (!needsPartner(cat)) continue;
      const err = validatePartnerAdd(cat, player, {
        firstName: item.partnerFirstName,
        lastName: item.partnerLastName,
        age: item.partnerAge,
        mobile: item.partnerMobile,
      });
      if (err) return `${cat?.label || item.categoryId}: ${err}`;
    }
    return "";
  }

  function goToCheckout() {
    setError("");
    if (cart.length < 1) {
      setError("Keep at least one event.");
      return;
    }
    const partnerErr = validateCartPartners();
    if (partnerErr) {
      setError(partnerErr);
      return;
    }
    setStep("checkout");
  }

  async function handleSubmitAmend() {
    setError("");
    const partnerErr = validateCartPartners();
    if (partnerErr) {
      setError(partnerErr);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(amendCheckoutPath, {
        method: "POST",
        body: JSON.stringify({
          firstName: firstName.trim() || player.firstName,
          mobile: mobile.trim() || String(registration?.mobile || ""),
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

      const verifyRes = await apiFetch(amendVerifyPath, {
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
        <p className="badminton-form__hint">Please wait while we update your registration.</p>
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
        Enter the first name and mobile you used at signup to view your events,
        edit partners, or add more (pay only the difference).
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

      {step === "cart" && registration ? (
        <>
          <p className="badminton-banner badminton-banner--warn" role="note">
            <strong>{String(registration.registrationId)}</strong> ·{" "}
            {String(registration.fullName)} · already paid{" "}
            {formatInr(alreadyPaid)} for {lockedIds.length} event
            {lockedIds.length === 1 ? "" : "s"}. Paid events stay; you can edit
            partners or add more (max {maxEvents}).
          </p>

          <h3 className="badminton-form__subtitle">Your events</h3>
          <ul className="badminton-cart-list">
            {cart.map((item) => {
              const cat = getCategoryById(item.categoryId);
              const locked = lockedIds.includes(item.categoryId);
              const showPartner = needsPartner(cat);
              return (
                <li key={item.categoryId} className="badminton-cart-item badminton-cart-item--amend">
                  <div>
                    <strong>{cat?.label ?? item.categoryId}</strong>
                    {locked ? (
                      <span className="badminton-form__field-note">Paid — cannot remove</span>
                    ) : (
                      <span>{cartItemPartnerLabel(item)}</span>
                    )}
                    {showPartner ? (
                      <div className="badminton-form__grid badminton-amend-partner">
                        <label>
                          <span>Partner first name *</span>
                          <input
                            value={item.partnerFirstName}
                            onChange={(e) =>
                              updateCartItem(item.categoryId, {
                                partnerFirstName: e.target.value,
                              })
                            }
                          />
                        </label>
                        <label>
                          <span>Partner last name *</span>
                          <input
                            value={item.partnerLastName}
                            onChange={(e) =>
                              updateCartItem(item.categoryId, {
                                partnerLastName: e.target.value,
                              })
                            }
                          />
                        </label>
                        <label>
                          <span>Partner age *</span>
                          <input
                            type="number"
                            min={1}
                            max={120}
                            value={item.partnerAge}
                            onChange={(e) =>
                              updateCartItem(item.categoryId, {
                                partnerAge: e.target.value,
                              })
                            }
                          />
                        </label>
                        <label>
                          <span>{partnerOptionalLabel}</span>
                          <input
                            value={item.partnerMobile}
                            onChange={(e) =>
                              updateCartItem(item.categoryId, {
                                partnerMobile: e.target.value,
                              })
                            }
                            inputMode="tel"
                          />
                        </label>
                      </div>
                    ) : (
                      <span>{cartItemPartnerLabel(item)}</span>
                    )}
                  </div>
                  {!locked ? (
                    <button
                      type="button"
                      className="badminton-back"
                      onClick={() => removeFromCart(item.categoryId)}
                    >
                      Remove
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {cart.length < maxEvents ? (
            <>
              <h3 className="badminton-form__subtitle">Add another event</h3>
              <div className="badminton-form__grid">
                <label className="badminton-form__span2">
                  <span>Category</span>
                  <select
                    value={draftCategoryId}
                    onChange={(e) => setDraftCategoryId(e.target.value)}
                  >
                    <option value="">Select</option>
                    {categories.map((c) => {
                      const inCart = cart.some((x) => x.categoryId === c.id);
                      const blocked = isCategoryBlocked(c, player);
                      const meta = categoryMeta[c.id];
                      const unavailable = meta && meta.available === false;
                      return (
                        <option
                          key={c.id}
                          value={c.id}
                          disabled={inCart || blocked || unavailable}
                        >
                          {c.label}
                          {inCart ? " — already added" : ""}
                          {blocked ? " — not eligible" : ""}
                          {unavailable ? " — full/closed" : ""}
                        </option>
                      );
                    })}
                  </select>
                  {draftCat?.hint ? (
                    <span className="badminton-form__field-note">{draftCat.hint}</span>
                  ) : null}
                </label>
                {draftNeedsPartner ? (
                  <>
                    <label>
                      <span>Partner first name *</span>
                      <input
                        value={draftPartnerFirstName}
                        onChange={(e) => setDraftPartnerFirstName(e.target.value)}
                      />
                    </label>
                    <label>
                      <span>Partner last name *</span>
                      <input
                        value={draftPartnerLastName}
                        onChange={(e) => setDraftPartnerLastName(e.target.value)}
                      />
                    </label>
                    <label>
                      <span>Partner age *</span>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={draftPartnerAge}
                        onChange={(e) => setDraftPartnerAge(e.target.value)}
                      />
                    </label>
                    <label>
                      <span>{partnerOptionalLabel}</span>
                      <input
                        value={draftPartnerMobile}
                        onChange={(e) => setDraftPartnerMobile(e.target.value)}
                        inputMode="tel"
                      />
                    </label>
                  </>
                ) : null}
              </div>
              <div className="badminton-form__actions">
                <button
                  type="button"
                  className="badminton-btn badminton-btn--ghost"
                  onClick={addToCart}
                >
                  Add event
                </button>
              </div>
            </>
          ) : (
            <p className="badminton-form__hint">You are at the maximum of {maxEvents} events.</p>
          )}

          <p className="badminton-fee">
            New total: <strong>{formatInr(newTotal)}</strong>
            {deltaInr > 0 ? (
              <>
                {" "}
                · pay difference <strong>{formatInr(deltaInr)}</strong>
              </>
            ) : (
              <> · no extra payment (partner edits only)</>
            )}
          </p>

          <div className="badminton-form__actions">
            <button
              type="button"
              className="badminton-btn badminton-btn--ghost"
              onClick={() => {
                setStep("lookup");
                setRegistration(null);
                setCart([]);
              }}
            >
              Look up again
            </button>
            <button
              type="button"
              className="badminton-btn badminton-btn--primary"
              onClick={goToCheckout}
            >
              Review &amp; {deltaInr > 0 ? "pay" : "save"}
            </button>
          </div>
        </>
      ) : null}

      {step === "checkout" && registration ? (
        <>
          <h3 className="badminton-form__subtitle">Confirm changes</h3>
          <dl className="badminton-review">
            <div>
              <dt>Registration</dt>
              <dd>{String(registration.registrationId)}</dd>
            </div>
            <div>
              <dt>Events ({cart.length})</dt>
              <dd>
                {cart.map((item) => {
                  const cat = getCategoryById(item.categoryId);
                  return (
                    <div key={item.categoryId}>
                      {cat?.label}: {cartItemPartnerLabel(item)}
                    </div>
                  );
                })}
              </dd>
            </div>
            <div>
              <dt>Already paid</dt>
              <dd>{formatInr(alreadyPaid)}</dd>
            </div>
            <div>
              <dt>New total</dt>
              <dd>{formatInr(newTotal)}</dd>
            </div>
            <div>
              <dt>Amount due now</dt>
              <dd className="badminton-review__amount">{formatInr(deltaInr)}</dd>
            </div>
          </dl>
          <p className="badminton-form__hint">{feeLadderHint}</p>
          <div className="badminton-form__actions">
            <button
              type="button"
              className="badminton-btn badminton-btn--ghost"
              onClick={() => setStep("cart")}
            >
              Back
            </button>
            <button
              type="button"
              className="badminton-btn badminton-btn--primary"
              onClick={handleSubmitAmend}
              disabled={submitting}
            >
              {submitting
                ? "Please wait…"
                : deltaInr > 0
                  ? `Pay ${formatInr(deltaInr)}`
                  : "Save changes"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
