import React from "react";
import { Link } from "react-router-dom";
import "../styles/membership.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { MEMBERSHIP_PLANS, GYM_HOURS_LINE } from "../data/membershipPlans";
import SEO from "../components/SEO";

/**
 * Membership — duration-based plans and gym hours.
 */
export default function Membership() {
  return (
    <div className="membership-page">
      <SEO
        title="Gym Membership Jaipur — Evolve Fitness Vivacity Mall"
        description="Evolve Fitness membership plans — full access to Jaipur’s luxury gym at Vivacity Mall, Jagatpura. Premium equipment, amenities & hours. View pricing and join."
        path="/membership"
      />
      <Navbar />

      <section className="membership-hero">
        <p className="membership-eyebrow">Membership</p>
        <h1 className="membership-title">Choose your plan</h1>
        <p className="membership-lede">
          Full floor access, premium equipment, and luxury amenities — train on
          your schedule.{" "}
          <strong className="membership-hours-inline">{GYM_HOURS_LINE}</strong>.
        </p>
      </section>

      <section className="membership-hours-banner" aria-label="Gym hours">
        <div className="membership-hours-inner">
          <span className="membership-hours-icon" aria-hidden="true">
            ◐
          </span>
          <div>
            <p className="membership-hours-label">Opening hours</p>
            <p className="membership-hours-value">{GYM_HOURS_LINE}</p>
          </div>
        </div>
      </section>

      <section className="membership-section">
        <div className="membership-grid">
          {MEMBERSHIP_PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`plan-card ${plan.featured ? "featured" : ""}`}
            >
              {plan.featured ? (
                <span className="plan-badge">Popular</span>
              ) : null}
              <h3 className="plan-name">{plan.title}</h3>
              <p className="plan-desc">{plan.blurb}</p>
              <p className="plan-price">
                {plan.priceLabel}
                <span> total</span>
              </p>
              <ul>
                <li>Full gym floor &amp; equipment access</li>
                <li>Locker rooms &amp; showers</li>
                <li>Healthy Café access</li>
                <li>Hours: {GYM_HOURS_LINE}</li>
              </ul>
              <Link
                to={`/register?plan=${plan.id}`}
                className="plan-btn"
              >
                Join now
              </Link>
            </article>
          ))}
        </div>
        <p className="membership-note">
          Pricing is subject to confirmation at the front desk. Questions?{" "}
          <Link to="/contact" className="membership-note-link">
            Contact us
          </Link>
          .
        </p>
      </section>
      <Footer />
    </div>
  );
}
