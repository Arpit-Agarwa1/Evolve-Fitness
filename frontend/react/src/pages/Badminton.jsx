import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import {
  BADMINTON_MEMBER_PATH,
  BADMINTON_OPEN_PATH,
} from "../data/badmintonChampionship";
import "../styles/badminton.css";

/**
 * Hub — two QR posters map to two separate registration pages.
 */
export default function Badminton() {
  return (
    <>
      <SEO
        title="EVOLVE Badminton Championship 2026"
        description="Choose Members or Open tournament registration for EVOLVE Badminton Championship 2026."
        path="/badminton"
      />
      <Navbar />
      <div className="badminton-page">
        <section className="badminton-hero">
          <p className="badminton-eyebrow">Championship 2026</p>
          <h1 className="badminton-hero__title">EVOLVE Badminton</h1>
          <p className="badminton-hero__lede">
            Scan the correct poster QR, or pick your tournament below — Members
            and Open are separate registrations.
          </p>
        </section>

        <section className="badminton-hub">
          <article className="badminton-hub-card">
            <p className="badminton-eyebrow">Poster 1</p>
            <h2>Members Tournament</h2>
            <p>
              Free registration. Pairing by <strong>chit system</strong> — no
              partner at signup.
            </p>
            <Link
              to={BADMINTON_MEMBER_PATH}
              className="badminton-btn badminton-btn--primary"
            >
              Members registration
            </Link>
            <code className="badminton-hub-path">{BADMINTON_MEMBER_PATH}</code>
          </article>

          <article className="badminton-hub-card">
            <p className="badminton-eyebrow">Poster 2</p>
            <h2>Open Tournament</h2>
            <p>
              Men&apos;s, Mixed &amp; Women&apos;s Doubles. Pay online — ₹500 /
              ₹750 / ₹1,000 / ₹1,250 for 1–4 events.
            </p>
            <Link
              to={BADMINTON_OPEN_PATH}
              className="badminton-btn badminton-btn--primary"
            >
              Open registration
            </Link>
            <code className="badminton-hub-path">{BADMINTON_OPEN_PATH}</code>
          </article>
        </section>
      </div>
      <Footer />
    </>
  );
}
