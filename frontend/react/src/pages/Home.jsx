import React from "react";
import "../styles/home.css";
import Navbar from "../components/Navbar";
import gymBanner from "../assets/gymBanner.png";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="home">
        {/* Hero Section */}
        <section
          className="hero"
          style={{
            backgroundImage: `url(${gymBanner})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="hero-overlay"></div>

          <div className="hero-content">
            <h1>Transform Your Body</h1>
            <p>
              Experience elite fitness with world-class trainers, premium
              equipment, and a space designed to elevate your performance.
            </p>

            <div className="hero-buttons">
              <button className="btn-primary">Join Now</button>
              <button className="btn-secondary">Free Trial</button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="features">
          <h2>Why Choose Us</h2>

          <div className="features-grid">
            <div className="feature-card">
              <h3>Elite Trainers</h3>
              <p>Train with certified professionals who push your limits.</p>
            </div>

            <div className="feature-card">
              <h3>Luxury Equipment</h3>
              <p>State-of-the-art machines designed for performance.</p>
            </div>

            <div className="feature-card">
              <h3>Premium Plans</h3>
              <p>Flexible memberships tailored to your lifestyle.</p>
            </div>
          </div>
        </section>

        {/* Programs */}
        <section className="programs">
          <h2>Our Programs</h2>

          <div className="program-grid">
            <div className="program-card">
              <h3>Weight Loss</h3>
              <p>Burn fat with structured and proven programs.</p>
            </div>

            <div className="program-card">
              <h3>Muscle Gain</h3>
              <p>Build strength and size with expert guidance.</p>
            </div>

            <div className="program-card">
              <h3>Personal Training</h3>
              <p>1-on-1 coaching tailored just for you.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
