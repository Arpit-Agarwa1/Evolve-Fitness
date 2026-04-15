import React from "react";
import "../styles/trainers.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  evolveTrainerCardImages,
  evolveTrainersHeroImage,
} from "../assets/evolveMagazine";
import EvolveImage from "../components/EvolveImage";
import SEO from "../components/SEO";

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
      <SEO
        title="Personal Trainers — Evolve Fitness Jaipur"
        description="Meet Evolve Fitness coaches at our luxury gym in Jaipur, Vivacity Mall — strength, Pilates, HIIT, conditioning & recovery. Expert personal training."
        path="/trainers"
      />
      <Navbar />

      <section className="trainers-hero">
        <div className="trainers-hero-bg" aria-hidden="true">
          <img
            className="trainers-hero-img"
            src={evolveTrainersHeroImage}
            alt=""
            width={1920}
            height={1080}
            decoding="async"
            fetchPriority="high"
            sizes="100vw"
          />
          <div className="trainers-hero-scrim" />
        </div>
        <div className="trainers-hero-content">
          <p className="trainers-eyebrow">Coaching</p>
          <h1 className="trainers-title">Meet your trainers</h1>
          <p className="trainers-lede">
            Certified experts who personalise every session — so you train smarter,
            move better, and stay accountable.
          </p>
        </div>
      </section>

      <section className="trainers-section">
        <div className="trainers-grid">
          {trainers.map((trainer) => (
            <article key={trainer.name} className="trainer-card">
              <EvolveImage
                src={evolveTrainerCardImages[trainer.photoIndex]}
                alt={`${trainer.name}, ${trainer.role} — Evolve Fitness facility`}
                sizes="(max-width: 640px) 100vw, 380px"
                loading="lazy"
                decoding="async"
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
