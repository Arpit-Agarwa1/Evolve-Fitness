import React from "react";
import "../styles/programs.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { evolveProgramImages } from "../assets/evolveMagazine";
import EvolveImage from "../components/EvolveImage";
import SEO from "../components/SEO";

/**
 * Training programs — each card uses Evolve magazine photography.
 */
const programs = [
  {
    title: "Smart Training",
    body:
      "Structured strength and conditioning with certified coaches and data-informed progressions.",
    image: evolveProgramImages[0],
    alt: "Evolve Fitness — digital class board, cardio, and smart training zone",
  },
  {
    title: "Pilates & Yoga",
    body:
      "Balance meets strength — flow, stretch, and align your body in dedicated sessions.",
    image: evolveProgramImages[1],
    alt: "Evolve Fitness — glass Pilates studio beside the strength floor",
  },
  {
    title: "Recovery & Mobility",
    body:
      "Complement hard training with recovery protocols, mobility work, and our Recovery Zone amenities.",
    image: evolveProgramImages[2],
    alt: "Evolve Fitness — locker hallway and premium wellness circulation spaces",
  },
  {
    title: "Elite Strength",
    body:
      "USA-imported equipment and progressive overload programs built for serious lifters.",
    image: evolveProgramImages[3],
    alt: "Evolve Fitness — Olympic platform, plate-loaded strength, and mezzanine",
  },
  {
    title: "Conditioning & HIIT",
    body:
      "High-output sessions on our expansive floor — space to move without limits.",
    image: evolveProgramImages[4],
    alt: "Evolve Fitness — functional sprint lane, agility markings, and HIIT rig",
  },
  {
    title: "Nutrition & Fuel",
    body:
      "Support your goals with clean nutrition from our Healthy Café and coach guidance.",
    image: evolveProgramImages[5],
    alt: "Evolve Fitness — premium strength floor for performance and recovery-minded training",
  },
];

export default function Programs() {
  return (
    <div className="programs-page">
      <SEO
        title="Training Programs — Evolve Gym Jaipur"
        description="Smart training, Pilates, yoga, recovery, strength, HIIT & nutrition at Evolve Fitness — luxury gym in Jaipur, Vivacity Mall. Explore programs and train with expert coaches."
        path="/programs"
      />
      <Navbar />

      <section className="programs-hero">
        <p className="programs-eyebrow">Programs</p>
        <h1 className="programs-title">Train with purpose</h1>
        <p className="programs-lede">
          Every program is built around our luxury floor, elite equipment, and
          expert coaching — so results feel as good as they look.
        </p>
      </section>

      <section className="programs-section">
        <div className="programs-grid">
          {programs.map((program) => (
            <article key={program.title} className="program-card">
              <div className="program-card-image-wrap">
                <EvolveImage
                  src={program.image}
                  alt={program.alt}
                  sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 440px"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="program-content">
                <h3>{program.title}</h3>
                <p>{program.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
