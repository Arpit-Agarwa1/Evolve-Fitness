import React from "react";
import { Link } from "react-router-dom";
import "../styles/membership.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/**
 * Membership tiers — placeholder pricing; replace with live plans when ready.
 */
export default function Membership() {
  return (
    <div className="membership-page">
      <Navbar />

      <section className="membership-hero">
        <p className="membership-eyebrow">Membership</p>
        <h1 className="membership-title">Choose your plan</h1>
        <p className="membership-lede">
          Flexible options to match your schedule — from full access to
          premium coaching and lounge privileges.
        </p>
      </section>

      <section className="membership-section">
        <div className="membership-grid">
          <article className="plan-card">
            <h3 className="plan-name">Essential</h3>
            <p className="plan-desc">Full floor access + amenities</p>
            <p className="plan-price">
              ₹2,999<span>/month</span>
            </p>
            <ul>
              <li>Access to gym floor &amp; equipment</li>
              <li>Locker rooms &amp; showers</li>
              <li>Healthy Café access</li>
            </ul>
            <button type="button" className="plan-btn">
              Join now
            </button>
          </article>

          <article className="plan-card featured">
            <span className="plan-badge">Popular</span>
            <h3 className="plan-name">Premium</h3>
            <p className="plan-desc">Classes + trainer sessions</p>
            <p className="plan-price">
              ₹5,999<span>/month</span>
            </p>
            <ul>
              <li>Everything in Essential</li>
              <li>Group classes &amp; Pilates / Yoga</li>
              <li>2 personal training sessions / month</li>
              <li>Recovery Zone priority</li>
            </ul>
            <button type="button" className="plan-btn">
              Join now
            </button>
          </article>

          <article className="plan-card">
            <h3 className="plan-name">Elite</h3>
            <p className="plan-desc">Unlimited coaching &amp; VIP perks</p>
            <p className="plan-price">
              ₹9,999<span>/month</span>
            </p>
            <ul>
              <li>Everything in Premium</li>
              <li>Unlimited personal training*</li>
              <li>Guest passes &amp; valet add-ons</li>
              <li>Concierge scheduling</li>
            </ul>
            <button type="button" className="plan-btn">
              Join now
            </button>
          </article>
        </div>
        <p className="membership-note">
          *Subject to trainer availability. Pricing shown is indicative — confirm
          at the front desk or via{" "}
          <Link to="/contact" className="membership-note-link">
            Contact
          </Link>
          .
        </p>
      </section>
      <Footer />
    </div>
  );
}
