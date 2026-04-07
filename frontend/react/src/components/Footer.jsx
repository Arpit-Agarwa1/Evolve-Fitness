import React from "react";
import "../styles/footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* LOGO + ABOUT */}
        <div className="footer-col">
          <h2 className="footer-logo">E &gt; OLVE</h2>
          <p>
            Elevate your fitness journey with premium training, modern
            equipment, and expert guidance.
          </p>
        </div>

        {/* LINKS */}
        <div className="footer-col">
          <h3>Quick Links</h3>
          <ul>
            <li>Home</li>
            <li>Programs</li>
            <li>Trainers</li>
            <li>Membership</li>
            <li>Contact</li>
          </ul>
        </div>

        {/* CONTACT */}
        <div className="footer-col">
          <h3>Contact</h3>
          <p>📍 123 Fitness Street</p>
          <p>📞 +91 9876543210</p>
          <p>📧 info@evolvefitness.com</p>
        </div>

        {/* SOCIAL */}
        <div className="footer-col">
          <h3>Follow Us</h3>
          <div className="socials">
            <span>Instagram</span>
            <span>Facebook</span>
            <span>Twitter</span>
          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="footer-bottom">
        <p>© 2026 Evolve Fitness. All rights reserved.</p>
      </div>
    </footer>
  );
}
