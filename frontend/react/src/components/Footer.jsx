import React from "react";
import { Link } from "react-router-dom";
import {
  EVOLVE_LOGO_ALT,
  EVOLVE_LOGO_FOOTER_SRC,
} from "../config/brand";
import { GYM_HOURS_LINE } from "../data/membershipPlans";
import { INSTAGRAM_URL } from "../config/socialLinks";
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
            <img
              className="footer-logo-img"
              src={EVOLVE_LOGO_FOOTER_SRC}
              alt={EVOLVE_LOGO_ALT}
              width={640}
              height={183}
              loading="lazy"
              decoding="async"
            />
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
              <Link to="/#experience">Experience</Link>
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
            <a href="tel:+919024301606">+91 90243 01606</a>
          </p>
          <p>
            <a href="mailto:info@evolvefitness.com">info@evolvefitness.com</a>
          </p>
          <p className="footer-hours">{GYM_HOURS_LINE}</p>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">Social</h3>
          <div className="socials">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              @evolvefitnesclub on Instagram
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
