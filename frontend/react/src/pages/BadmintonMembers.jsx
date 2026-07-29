import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import BadmintonWhatsAppInvite from "../components/BadmintonWhatsAppInvite";
import { apiFetch } from "../services/api";
import {
  MEMBER_CATEGORIES,
  MEMBER_PLAYER_LEVEL_OPTIONS,
  BADMINTON_MEMBER_PATH,
  isValidIndianMobile,
} from "../data/badmintonChampionship";
import "../styles/badminton.css";

const EMPTY = {
  fullName: "",
  mobile: "",
  gender: "",
  dateOfBirth: "",
  categoryId: "",
  playerLevel: "beginner",
};

/**
 * Poster 1 — Evolve Members Tournament (QR → /badminton/members).
 * Pairing via chit system; free registration, no payment.
 */
export default function BadmintonMembers() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim() || !form.mobile.trim()) {
      setError("Name and mobile are required.");
      return;
    }
    if (!isValidIndianMobile(form.mobile)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!form.gender) {
      setError("Select gender.");
      return;
    }
    if (!form.dateOfBirth) {
      setError("Date of birth is required.");
      return;
    }
    if (!form.categoryId) {
      setError("Select a category.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/badminton/members/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          mobile: form.mobile.trim(),
          gender: form.gender,
          dateOfBirth: form.dateOfBirth,
          categoryId: form.categoryId,
          playerLevel: form.playerLevel,
        }),
      });
      setConfirmed(res.data?.registration ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Registration failed. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SEO
        title="EVOLVE Members Badminton Tournament 2026"
        description="Register for the EVOLVE Members Badminton Tournament. Pairing via chit system."
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
            Doubles pairing will be done through a <strong>chit system</strong> on
            the day — you register as an individual; partners are drawn later.
          </p>
        </section>

        <section className="badminton-register">
          {confirmed ? (
            <div className="badminton-confirm" role="status">
              <p className="badminton-eyebrow">Registered</p>
              <h2 className="badminton-confirm__title">You&apos;re in</h2>
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
                  <dt>Category</dt>
                  <dd>
                    {confirmed.events?.[0]?.categoryLabel ||
                      confirmed.categories?.[0]}
                  </dd>
                </div>
                <div>
                  <dt>Player level</dt>
                  <dd>{confirmed.playerLevel}</dd>
                </div>
              </dl>
              <p className="badminton-form__hint">
                Pairing is by chit system — no partner needed at registration.
              </p>
              <BadmintonWhatsAppInvite />
            </div>
          ) : (
            <form className="badminton-form" onSubmit={handleSubmit}>
              <h2 className="badminton-form__title">Member registration</h2>
              <p className="badminton-form__hint">
                Free for Evolve members. Pairing via chit system — do not enter a
                partner here.
              </p>

              {error ? (
                <p className="badminton-banner badminton-banner--error" role="alert">
                  {error}
                </p>
              ) : null}

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
                  <span>Category *</span>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setField("categoryId", e.target.value)}
                    required
                  >
                    <option value="">Select category</option>
                    {MEMBER_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
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
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "Submit registration"}
                </button>
              </div>
              <p className="badminton-form__hint" style={{ marginTop: "1rem" }}>
                Looking for the Open tournament?{" "}
                <Link to="/badminton/open">Go to Open registration</Link>
              </p>
            </form>
          )}
        </section>
      </div>
      <Footer />
    </>
  );
}
