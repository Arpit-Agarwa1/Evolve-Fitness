import React from "react";
import "../styles/trainers.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { evolveVideos } from "../assets/evolveVideos";
import EvolveImage from "../components/EvolveImage";
import EvolveVideo from "../components/EvolveVideo";
import SEO from "../components/SEO";
import AdSlot from "../components/AdSlot";
import { trainerPortraits } from "../assets/trainerPortraits.generated";

/**
 * Trainers page — hero uses training-floor film; cards use studio portraits.
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
          <EvolveVideo
            className="trainers-hero-img"
            src={evolveVideos.inside.src}
            poster={evolveVideos.inside.poster}
            preload="auto"
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
