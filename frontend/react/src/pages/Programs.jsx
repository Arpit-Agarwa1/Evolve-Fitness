import React from "react";
import "../styles/programs.css";
import Navbar from "../components/Navbar";
import img1 from "../assets/image1.png";

export default function Programs() {
  return (
    <div className="programs-page">
      <Navbar />

      {/* HERO */}
      <section className="programs-hero">
        <h1>Our Programs</h1>
        <p>
          Discover world-class training programs designed to transform your body
          and elevate your performance.
        </p>
      </section>

      {/* PROGRAMS GRID */}
      <section className="programs-section">
        <div className="programs-grid">
          {/* Card 1 */}
          <div className="program-card">
            <img src={img1} alt="Weight Loss" />
            <div className="program-content">
              <h3>Weight Loss</h3>
              <p>
                Burn fat with structured workouts and expert guidance tailored
                to your goals.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="program-card">
            <img src={img1} alt="Muscle Gain" />
            <div className="program-content">
              <h3>Muscle Gain</h3>
              <p>
                Build strength and muscle with progressive training techniques.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="program-card">
            <img src={img1} alt="Personal Training" />
            <div className="program-content">
              <h3>Personal Training</h3>
              <p>
                One-on-one coaching designed specifically for your fitness
                journey.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="program-card">
            <img src={img1} alt="HIIT Training" />
            <div className="program-content">
              <h3>HIIT Training</h3>
              <p>High-intensity workouts to maximize fat burn and endurance.</p>
            </div>
          </div>

          {/* Card 5 */}
          <div className="program-card">
            <img src={img1} alt="Yoga & Recovery" />
            <div className="program-content">
              <h3>Yoga & Recovery</h3>
              <p>
                Improve flexibility, reduce stress, and recover effectively.
              </p>
            </div>
          </div>

          {/* Card 6 */}
          <div className="program-card">
            <img src={img1} alt="Strength Training" />
            <div className="program-content">
              <h3>Strength Training</h3>
              <p>Build raw strength with expert-designed lifting programs.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
