import React from "react";
import "../styles/contact.css";
import Navbar from "../components/Navbar";

export default function Contact() {
  return (
    <div className="contact-page">
      <Navbar />
      {/* HERO */}
      <section className="contact-hero">
        <h1>Contact Us</h1>
        <p>
          Have questions or ready to start your journey? Get in touch with us.
        </p>
      </section>

      {/* CONTACT SECTION */}
      <section className="contact-section">
        <div className="contact-container">
          {/* LEFT SIDE */}
          <div className="contact-info">
            <h2>Get In Touch</h2>
            <p>We’re here to help you achieve your fitness goals.</p>

            <div className="info-item">
              <span>📍</span>
              <p>
                {" "}
                5th floor, Vivacity Mall, C-3, Hare Krishna Marg, near Akshay
                patra temple, mahal yojana, Jagatpura, Jaipur, Shri Kishanpura,
                Rajasthan 302017
              </p>
            </div>

            <div className="info-item">
              <span>📞</span>
              <p>+91 9876543210</p>
            </div>

            <div className="info-item">
              <span>📧</span>
              <p>info@evolvefitness.com</p>
            </div>
          </div>

          {/* RIGHT SIDE FORM */}
          <form className="contact-form">
            <h2>Send Message</h2>

            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Your Email" required />
            <textarea placeholder="Your Message" rows="5" required></textarea>

            <button type="submit">Send Message</button>
          </form>
        </div>
      </section>
    </div>
  );
}
