import React from "react";
import { Link } from "react-router-dom";
import "../styles/home.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { evolveGalleryImages, evolveHeroImage } from "../assets/evolveMagazine";
import { evolveServices } from "../data/services";

/**
 * Landing page — hero uses HD gym photography + glass panel for readable type.
 */
export default function Home() {
  return (
    <>
      <Navbar />
      <div className="home">
        <section className="hero" aria-labelledby="hero-heading">
          {/* Background stack: sharp photo + overlays + light motion (no baked-in poster text). */}
          <div className="hero-bg" aria-hidden="true">
            <img
              className="hero-bg-img"
              src={evolveHeroImage}
              alt=""
              width={1920}
              height={1080}
              decoding="async"
              fetchPriority="high"
            />
            <div className="hero-bg-vignette" />
            <div className="hero-bg-mesh" />
            <div className="hero-orbs">
              <span className="hero-orb hero-orb--a" />
              <span className="hero-orb hero-orb--b" />
            </div>
          </div>

          <div className="hero-inner">
            <div className="hero-panel">
              <p className="hero-eyebrow">The luxury fitness</p>
              <h1 id="hero-heading" className="hero-title">
                A complete luxury fitness experience
              </h1>
              <p className="hero-lede">
                Designed to elevate every move — premium space, elite equipment,
                smart coaching, recovery, and nutrition in one destination.
              </p>
              <div className="hero-buttons">
                <Link to="/membership" className="btn-primary">
                  Join now
                </Link>
                <Link to="/contact" className="btn-secondary">
                  Book a visit
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="intro-strip" aria-hidden="true">
          <div className="intro-strip-inner">
            <span>Jaipur&apos;s luxury fitness destination</span>
            <span className="intro-dot" />
            <span>20,000 sq. ft.</span>
            <span className="intro-dot" />
            <span>USA-grade equipment</span>
          </div>
        </section>

        <section
          className="evolve-gallery"
          aria-labelledby="evolve-gallery-heading"
        >
          <header className="evolve-gallery-header">
            <p className="section-eyebrow">Inside Evolve</p>
            <h2 id="evolve-gallery-heading" className="evolve-gallery-title">
              The space, the detail, the standard
            </h2>
            <p className="evolve-gallery-sub">
              A glimpse of our floor — premium finishes, elite equipment, and
              room to breathe.
            </p>
          </header>
          <div className="evolve-gallery-grid">
            {evolveGalleryImages.map((src, i) => (
              <figure
                key={src}
                className={`evolve-gallery-cell evolve-gallery-cell--${i}`}
              >
                <img
                  src={src}
                  alt={`Evolve Fitness interior and facilities, photo ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            ))}
          </div>
        </section>

        <section id="experience" className="experience">
          <header className="experience-header">
            <p className="section-eyebrow">The experience</p>
            <h2 className="section-title">Everything you expect — and more</h2>
            <p className="section-sub">
              From arrival to recovery, every touchpoint is crafted for comfort,
              performance, and class.
            </p>
          </header>

          <div className="services-grid">
            {evolveServices.map((service, index) => (
              <article
                key={service.id}
                className={`service-card ${index === 0 ? "service-card--wide" : ""}`}
              >
                <div className="service-card-media">
                  <img src={service.image} alt={service.alt} loading="lazy" />
                  <div className="service-card-media-overlay" />
                </div>
                <div className="service-card-body">
                  <h3 className="service-card-title">{service.title}</h3>
                  <p className="service-card-tagline">{service.tagline}</p>
                  <p className="service-card-desc">{service.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-band">
          <div className="cta-band-inner">
            <p className="cta-eyebrow">Ready when you are</p>
            <h2 className="cta-title">Step into Evolve</h2>
            <p className="cta-copy">
              Explore membership options or speak with our team to plan your
              first session.
            </p>
            <div className="cta-actions">
              <Link to="/membership" className="btn-primary">
                View membership
              </Link>
              <Link to="/contact" className="btn-ghost">
                Contact us
              </Link>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
