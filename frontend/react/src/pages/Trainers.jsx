import React from "react";
import "../styles/trainers.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  evolveTrainerCardImages,
  evolveTrainersHeroImage,
} from "../assets/evolveMagazine";

const trainers = [
  { name: "Alex Carter", role: "Strength coach", photoIndex: 0 },
  { name: "Sophia Lee", role: "Pilates & mobility", photoIndex: 1 },
  { name: "Michael Ross", role: "Hypertrophy specialist", photoIndex: 2 },
  { name: "Emma Stone", role: "HIIT & conditioning", photoIndex: 3 },
  { name: "Daniel Cruz", role: "Personal training lead", photoIndex: 4 },
  { name: "Olivia Smith", role: "Wellness & recovery", photoIndex: 5 },
];

/**
 * Trainers page — hero and cards use Evolve magazine facility photography.
 */
export default function Trainers() {
  return (
    <div className="trainers-page">
      <Navbar />

      <section
        className="trainers-hero"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(10, 10, 12, 0.78) 0%, var(--ev-bg) 100%), url(${evolveTrainersHeroImage})`,
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
          {trainers.map((trainer) => (
            <article key={trainer.name} className="trainer-card">
              <img
                src={evolveTrainerCardImages[trainer.photoIndex]}
                alt={`${trainer.name}, ${trainer.role}`}
                loading="lazy"
              />
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
