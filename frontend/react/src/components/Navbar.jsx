import React from "react";
import { Link } from "react-router-dom";
import "../styles/navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">
        <div className="logo-main">
          <span className="logo-e">E</span>
          <span className="logo-arrow">&gt;</span>
          <span className="logo-rest">OLVE</span>
        </div>
        <div className="logo-sub">THE LUXURY FITNESS</div>
      </div>

      <ul className="nav-links">
        <li>
          <Link to="/">Home</Link>
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
          <Link to="/contact">Contact</Link>
        </li>
      </ul>

      <button className="join-btn">Join Now</button>
    </nav>
  );
}
