import React, { useState } from "react";
import "../styles/contact.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { apiFetch } from "../services/api";

/**
 * Contact page — submits enquiries to the MVC API (MongoDB).
 */
export default function Contact() {
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();

    setErrorMessage("");
    setStatus("loading");

    try {
      await apiFetch("/api/contact", {
        method: "POST",
        body: JSON.stringify({ name, email, message, source: "website" }),
      });
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("idle");
      setErrorMessage(
        err instanceof Error ? err.message : "Could not send message."
      );
    }
  }

  return (
    <div className="contact-page">
      <Navbar />

      <section className="contact-hero">
        <p className="contact-eyebrow">Contact</p>
        <h1 className="contact-title">Let&apos;s talk</h1>
        <p className="contact-lede">
          Questions about membership, corporate plans, or your first visit —
          we&apos;re here to help.
        </p>
      </section>

      <section className="contact-section">
        <div className="contact-container">
          <div className="contact-info">
            <h2 className="contact-info-title">Visit Evolve</h2>
            <p className="contact-info-copy">
              We&apos;re located on the 5th floor of Vivacity Mall, Jaipur.
            </p>

            <div className="info-item">
              <span className="info-icon" aria-hidden="true">
                📍
              </span>
              <p>
                5th floor, Vivacity Mall, C-3, Hare Krishna Marg, near Akshay
                Patra temple, Mahal Yojana, Jagatpura, Jaipur, Rajasthan 302017
              </p>
            </div>

            <div className="info-item">
              <span className="info-icon" aria-hidden="true">
                📞
              </span>
              <p>
                <a href="tel:+919876543210">+91 98765 43210</a>
              </p>
            </div>

            <div className="info-item">
              <span className="info-icon" aria-hidden="true">
                📧
              </span>
              <p>
                <a href="mailto:info@evolvefitness.com">
                  info@evolvefitness.com
                </a>
              </p>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <h2 className="contact-form-title">Send a message</h2>
            {status === "sent" ? (
              <p className="contact-form-success" role="status">
                Thank you — we&apos;ll get back to you shortly.
              </p>
            ) : null}
            {errorMessage ? (
              <p className="contact-form-error" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <label className="contact-label">
              <span className="contact-label-text">Name</span>
              <input
                type="text"
                name="name"
                placeholder="Your name"
                required
                disabled={status === "loading"}
              />
            </label>
            <label className="contact-label">
              <span className="contact-label-text">Email</span>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                required
                disabled={status === "loading"}
              />
            </label>
            <label className="contact-label">
              <span className="contact-label-text">Message</span>
              <textarea
                name="message"
                placeholder="How can we help?"
                rows={5}
                required
                disabled={status === "loading"}
              />
            </label>

            <button type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Sending…" : "Send message"}
            </button>
          </form>
        </div>
      </section>
      <Footer />
    </div>
  );
}
