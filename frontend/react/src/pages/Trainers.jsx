import React from "react";
import "../styles/trainers.css";
import img1 from "../assets/image1.png";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Trainers() {
  return (
    <div className="trainers-page">
      <Navbar />

      {/* HERO */}
      <section className="trainers-hero">
        <h1>Meet Our Trainers</h1>
        <p>
          Train with elite professionals dedicated to transforming your fitness
          journey.
        </p>
      </section>

      {/* TRAINERS GRID */}
      <section className="trainers-section">
        <div className="trainers-grid">
          {/* Trainer 1 */}
          <div className="trainer-card">
            <img src={img1} alt="trainer" />
            <div className="trainer-info">
              <h3>Alex Carter</h3>
              <span>Strength Coach</span>
            </div>
          </div>

          {/* Trainer 2 */}
          <div className="trainer-card">
            <img src={img1} alt="trainer" />
            <div className="trainer-info">
              <h3>Sophia Lee</h3>
              <span>Yoga Expert</span>
            </div>
          </div>

          {/* Trainer 3 */}
          <div className="trainer-card">
            <img src={img1} alt="trainer" />
            <div className="trainer-info">
              <h3>Michael Ross</h3>
              <span>Bodybuilding Coach</span>
            </div>
          </div>

          {/* Trainer 4 */}
          <div className="trainer-card">
            <img src={img1} alt="trainer" />
            <div className="trainer-info">
              <h3>Emma Stone</h3>
              <span>HIIT Specialist</span>
            </div>
          </div>

          {/* Trainer 5 */}
          <div className="trainer-card">
            <img src={img1} alt="trainer" />
            <div className="trainer-info">
              <h3>Daniel Cruz</h3>
              <span>Personal Trainer</span>
            </div>
          </div>

          {/* Trainer 6 */}
          <div className="trainer-card">
            <img src={img1} alt="trainer" />
            <div className="trainer-info">
              <h3>Olivia Smith</h3>
              <span>Wellness Coach</span>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
