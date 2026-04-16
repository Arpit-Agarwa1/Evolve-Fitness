import React, { useEffect, useState } from "react";
import "../styles/trainers.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  evolveTrainerCardImages,
  evolveTrainersHeroImage,
} from "../assets/evolveMagazine";
import EvolveImage from "../components/EvolveImage";
import SEO from "../components/SEO";
import { apiFetch } from "../services/api";
import { trainerDisplayPhotoUrl } from "../utils/trainerImageUrl";

/** Fallback card image when a trainer has no uploaded photo yet */
const PLACEHOLDER_IMG = evolveTrainerCardImages[0];

/**
 * Trainers page — hero uses facility photography; cards load from the API (owner-managed).
 */
export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const res = await apiFetch("/api/trainers");
        if (!cancelled) {
          setTrainers(res.data?.items ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error ? err.message : "Could not load trainers."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        {errorMessage ? (
          <p className="trainers-api-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {loading ? (
          <p className="trainers-loading">Loading coaches…</p>
        ) : trainers.length === 0 ? (
          <p className="trainers-empty">
            Our coaching team will appear here soon. Check back or contact the
            front desk.
          </p>
        ) : (
          <div className="trainers-grid">
            {trainers.map((trainer) => {
              const uploaded = trainerDisplayPhotoUrl(trainer);
              const src = uploaded ?? PLACEHOLDER_IMG;
              return (
                <article key={trainer._id} className="trainer-card">
                  <EvolveImage
                    src={src}
                    alt={`${trainer.name}, ${trainer.role} — Evolve Fitness`}
                    sizes="(max-width: 640px) 100vw, 380px"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="trainer-info">
                    <h3>{trainer.name}</h3>
                    <span>{trainer.role}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
