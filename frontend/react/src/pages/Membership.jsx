import React from "react";
import "../styles/membership.css";
import Navbar from "../components/Navbar";

export default function Membership() {
  return (
    <div className="membership-page">
      <Navbar />
      {/* HERO */}
      <section className="membership-hero">
        <h1>Membership Plans</h1>
        <p>
          Choose a plan that fits your lifestyle and start your fitness journey
          today.
        </p>
      </section>

      {/* PLANS */}
      <section className="membership-section">
        <div className="membership-grid">
          {/* Basic */}
          <div className="plan-card">
            <h3>Basic</h3>
            <h2>
              $29<span>/month</span>
            </h2>
            <ul>
              <li>Access to gym equipment</li>
              <li>Locker room access</li>
              <li>Standard support</li>
            </ul>
            <button className="plan-btn">Join Now</button>
          </div>

          {/* Premium */}
          <div className="plan-card featured">
            <h3>Premium</h3>
            <h2>
              $59<span>/month</span>
            </h2>
            <ul>
              <li>All Basic features</li>
              <li>Group classes</li>
              <li>Personal trainer (2 sessions)</li>
            </ul>
            <button className="plan-btn">Join Now</button>
          </div>

          {/* Elite */}
          <div className="plan-card">
            <h3>Elite</h3>
            <h2>
              $99<span>/month</span>
            </h2>
            <ul>
              <li>All Premium features</li>
              <li>Unlimited personal training</li>
              <li>VIP lounge access</li>
            </ul>
            <button className="plan-btn">Join Now</button>
          </div>
        </div>
      </section>
    </div>
  );
}
