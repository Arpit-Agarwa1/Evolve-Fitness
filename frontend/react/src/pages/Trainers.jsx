import React from "react";
import "../styles/trainers.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { evolveTrainersHeroImage } from "../assets/evolveMagazine";
import EvolveImage from "../components/EvolveImage";
import SEO from "../components/SEO";
import AdSlot from "../components/AdSlot";
import { trainerPortraits } from "../assets/trainerPortraits.generated";

/**
 * Trainers page — hero uses facility photography; cards use studio portraits.
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
          <EvolveImage
            className="trainers-hero-img"
            src={evolveTrainersHeroImage}
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            sizes="100vw"
            fadeIn={false}
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

      <AdSlot className="ad-slot--band" />

      <section className="trainers-section">
        <div className="trainers-grid">
          {trainerPortraits.map((photo, i) => (
            <article key={`portrait-${i}`} className="trainer-card">
              <EvolveImage
                src={photo}
                alt="Evolve Fitness personal trainer"
                sizes="(max-width: 640px) 100vw, 380px"
                loading={i < 2 ? "eager" : "lazy"}
                decoding="async"
              />
              <div className="trainer-info">
                <span>Personal trainer</span>
              </div>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
