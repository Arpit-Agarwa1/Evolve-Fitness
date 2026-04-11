import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "../styles/navbar.css";

/**
 * Primary site navigation with Evolve logo and membership CTA.
 */
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? "nav-link--active" : ""}`;

  return (
    <header className="nav-wrap">
      <nav className="navbar" aria-label="Main">
        <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
          <div className="logo-main">
            <span className="logo-e">E</span>
            <span className="logo-arrow" aria-hidden="true">
              &gt;
            </span>
            <span className="logo-rest">OLVE</span>
          </div>
          <div className="logo-sub">THE LUXURY FITNESS</div>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="nav-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
          <span className="sr-only">Toggle menu</span>
        </button>

        <ul
          id="nav-menu"
          className={`nav-links ${menuOpen ? "nav-links--open" : ""}`}
        >
          <li>
            <NavLink to="/" className={linkClass} end onClick={() => setMenuOpen(false)}>
              Home
            </NavLink>
          </li>
          <li>
            <a href="/#experience" className="nav-link" onClick={() => setMenuOpen(false)}>
              Experience
            </a>
          </li>
          <li>
            <NavLink to="/programs" className={linkClass} onClick={() => setMenuOpen(false)}>
              Programs
            </NavLink>
          </li>
          <li>
            <NavLink to="/trainers" className={linkClass} onClick={() => setMenuOpen(false)}>
              Trainers
            </NavLink>
          </li>
          <li>
            <NavLink to="/membership" className={linkClass} onClick={() => setMenuOpen(false)}>
              Membership
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" className={linkClass} onClick={() => setMenuOpen(false)}>
              Contact
            </NavLink>
          </li>
          <li className="join-btn--mobile">
            <Link to="/register" onClick={() => setMenuOpen(false)}>
              Join now
            </Link>
          </li>
        </ul>

        <Link to="/register" className="join-btn" onClick={() => setMenuOpen(false)}>
          Join now
        </Link>
      </nav>
    </header>
  );
}
