import React from "react";
import { Link } from "react-router-dom";
import { GYM_HOURS_LINE } from "../data/membershipPlans";
import "../styles/footer.css";

/**
 * Site footer with quick links and contact details.
 */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-col">
          <div className="footer-brand">
            <span className="footer-logo-main">
              <span className="footer-logo-e">E</span>
              <span className="footer-logo-arrow">&gt;</span>
              <span className="footer-logo-rest">OLVE</span>
            </span>
            <span className="footer-logo-sub">THE LUXURY FITNESS</span>
          </div>
          <p className="footer-about">
            Premium training, elite equipment, and a complete luxury fitness
            experience — designed to elevate every move.
          </p>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">Explore</h3>
          <ul className="footer-list">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <a href="/#experience">Experience</a>
            </li>
            <li>
              <Link to="/programs">Programs</Link>
            </li>
            <li>
              <Link to="/trainers">Trainers</Link>
            </li>
            <li>
              <Link to="/membership">Membership</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">Visit</h3>
          <p>
            5th floor, Vivacity Mall, C-3, Hare Krishna Marg, near Akshay Patra
            temple, Mahal Yojana, Jagatpura, Jaipur, Rajasthan 302017
          </p>
          <p>
            <a href="tel:+919876543210">+91 98765 43210</a>
          </p>
          <p>
            <a href="mailto:info@evolvefitness.com">info@evolvefitness.com</a>
          </p>
          <p className="footer-hours">{GYM_HOURS_LINE}</p>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">Social</h3>
          <div className="socials">
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer">
              Facebook
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} Evolve Fitness. All rights reserved.
          {" · "}
          <Link to="/admin/login" className="footer-owner-link">
            Owner login
          </Link>
        </p>
      </div>
    </footer>
  );
}
