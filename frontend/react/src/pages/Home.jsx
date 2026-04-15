import React from "react";
import { Link } from "react-router-dom";
import "../styles/home.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { evolveGalleryImages, evolveHeroImage } from "../assets/evolveMagazine";
import { evolveServices } from "../data/services";
import { INSTAGRAM_URL } from "../config/socialLinks";
import EvolveImage from "../components/EvolveImage";
import SEO from "../components/SEO";
import JsonLdLocalBusiness from "../components/JsonLdLocalBusiness";

/**
 * Landing page — hero uses HD gym photography + glass panel for readable type.
 */
export default function Home() {
  return (
    <>
      <SEO
        title="Evolve Fitness — Luxury Gym Jaipur | Vivacity Mall"
        description="Evolve Fitness, also searched as Evolve Gym — premium luxury gym in Jaipur on the 5th floor of Vivacity Mall, Jagatpura. Elite USA-grade equipment, personal training, recovery zone, membership & café. Phone +91 90243 01606."
        path="/"
      />
      <JsonLdLocalBusiness />
      <Navbar />
      <div className="home">
        <section className="hero" aria-labelledby="hero-heading">
          {/* Background stack: sharp photo + overlays + light motion (no baked-in poster text). */}
          <div className="hero-bg" aria-hidden="true">
            <EvolveImage
              className="hero-bg-img"
              src={evolveHeroImage}
              alt=""
              width={1920}
              height={1080}
              sizes="100vw"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              fadeIn={false}
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
              <Link to="/register" className="btn-primary">
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
                <EvolveImage
                  src={src}
                  alt={`Evolve Fitness interior and facilities, photo ${i + 1}`}
                  sizes="(max-width: 767px) 48vw, (max-width: 1199px) 32vw, 600px"
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
                  <EvolveImage
                    src={service.image}
                    alt={service.alt}
                    sizes="(max-width: 767px) 100vw, (max-width: 1099px) 50vw, 400px"
                    loading="lazy"
                    decoding="async"
                  />
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

        <section
          className="instagram-section"
          aria-labelledby="instagram-heading"
        >
          <div className="instagram-section-inner">
            <p className="section-eyebrow">Follow us</p>
            <h2 id="instagram-heading" className="instagram-section-title">
              Daily motivation on Instagram
            </h2>
            <p className="instagram-section-copy">
              Training highlights, floor updates, and community moments — stay
              connected with Evolve.
            </p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-instagram"
            >
              <span className="btn-instagram__icon" aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </span>
              @evolvefitnesclub
            </a>
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
