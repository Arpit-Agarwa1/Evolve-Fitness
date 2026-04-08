import React from "react";
import "../styles/trainers.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import serviceSmartTraining from "../assets/service-smart-training.png";
import img1 from "../assets/image1.png";

/**
 * Trainers page — hero uses branded coaching photography.
 */
export default function Trainers() {
  return (
    <div className="trainers-page">
      <Navbar />

      <section
        className="trainers-hero"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(10, 10, 12, 0.75) 0%, var(--ev-bg) 100%), url(${serviceSmartTraining})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        <p className="trainers-eyebrow">Coaching</p>
        <h1 className="trainers-title">Meet your trainers</h1>
        <p className="trainers-lede">
          Certified experts who personalise every session — so you train smarter,
          move better, and stay accountable.
        </p>
      </section>

      <section className="trainers-section">
        <div className="trainers-grid">
          {[
            { name: "Alex Carter", role: "Strength coach" },
            { name: "Sophia Lee", role: "Pilates & mobility" },
            { name: "Michael Ross", role: "Hypertrophy specialist" },
            { name: "Emma Stone", role: "HIIT & conditioning" },
            { name: "Daniel Cruz", role: "Personal training lead" },
            { name: "Olivia Smith", role: "Wellness & recovery" },
          ].map((trainer) => (
            <article key={trainer.name} className="trainer-card">
              <img src={img1} alt={`${trainer.name}, ${trainer.role}`} />
              <div className="trainer-info">
                <h3>{trainer.name}</h3>
                <span>{trainer.role}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
