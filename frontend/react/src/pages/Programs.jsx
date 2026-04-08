import React from "react";
import "../styles/programs.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import servicePilatesYoga from "../assets/service-pilates-yoga.png";
import serviceRecovery from "../assets/service-recovery.png";
import serviceSmartTraining from "../assets/service-smart-training.png";
import serviceEliteEquipment from "../assets/service-elite-equipment.png";
import serviceMassiveSpace from "../assets/service-massive-space.png";
import serviceCafe from "../assets/service-cafe.png";

/**
 * Training programs aligned with Evolve facilities and coaching.
 */
const programs = [
  {
    title: "Smart Training",
    body:
      "Structured strength and conditioning with certified coaches and data-informed progressions.",
    image: serviceSmartTraining,
    alt: "Smart training at Evolve Fitness",
  },
  {
    title: "Pilates & Yoga",
    body:
      "Balance meets strength — flow, stretch, and align your body in dedicated sessions.",
    image: servicePilatesYoga,
    alt: "Pilates and yoga at Evolve Fitness",
  },
  {
    title: "Recovery & Mobility",
    body:
      "Complement hard training with recovery protocols, mobility work, and our Recovery Zone amenities.",
    image: serviceRecovery,
    alt: "Recovery and mobility at Evolve Fitness",
  },
  {
    title: "Elite Strength",
    body:
      "USA-imported equipment and progressive overload programs built for serious lifters.",
    image: serviceEliteEquipment,
    alt: "Strength training on elite equipment",
  },
  {
    title: "Conditioning & HIIT",
    body:
      "High-output sessions on our expansive floor — space to move without limits.",
    image: serviceMassiveSpace,
    alt: "Conditioning on the main gym floor",
  },
  {
    title: "Nutrition & Fuel",
    body:
      "Support your goals with clean nutrition from our Healthy Café and coach guidance.",
    image: serviceCafe,
    alt: "Healthy café nutrition at Evolve Fitness",
  },
];

export default function Programs() {
  return (
    <div className="programs-page">
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
                <img src={program.image} alt={program.alt} loading="lazy" />
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
