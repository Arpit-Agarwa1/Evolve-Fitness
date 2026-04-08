/**
 * Evolve Fitness — luxury service lineup (copy + magazine photography).
 */
import { evolveMagazineImages } from "../assets/evolveMagazine";

/** Eight service images: magazine indices 1–8 */
const s = evolveMagazineImages.slice(1, 9);

/** @typedef {{ id: string; title: string; tagline: string; description: string; image: string; alt: string }} EvolveService */

/** @type {EvolveService[]} */
export const evolveServices = [
  {
    id: "valet",
    title: "Valet Luxury",
    tagline: "Luxury begins before you enter",
    description:
      "Seamless arrival and an effortless experience from the moment you pull up.",
    image: s[0],
    alt: "Evolve Fitness — arrival and luxury entrance experience",
  },
  {
    id: "space",
    title: "Massive Space",
    tagline: "20,000 sq. ft. of pure luxury & strength",
    description:
      "Room to train without limits in an environment built for performance and comfort.",
    image: s[1],
    alt: "Evolve Fitness — spacious luxury training floor",
  },
  {
    id: "equipment",
    title: "Elite Equipment",
    tagline: "USA-imported precision",
    description:
      "Professional-grade machines engineered for precision, safety, and results.",
    image: s[2],
    alt: "Evolve Fitness — elite strength and cardio equipment",
  },
  {
    id: "training",
    title: "Smart Training",
    tagline: "Certified expert trainers",
    description:
      "Personalised programming from coaches who know how to unlock your next level.",
    image: s[3],
    alt: "Evolve Fitness — coaching and personal training",
  },
  {
    id: "pilates-yoga",
    title: "Pilates & Yoga",
    tagline: "Balance meets strength",
    description:
      "Flow, stretch, and align your body in dedicated mind-body sessions.",
    image: s[4],
    alt: "Evolve Fitness — Pilates, yoga, and studio training",
  },
  {
    id: "recovery",
    title: "Recovery Zone",
    tagline: "Steam · Ice bath · Shower",
    description:
      "Recover better so you can come back stronger, session after session.",
    image: s[5],
    alt: "Evolve Fitness — recovery and wellness amenities",
  },
  {
    id: "amenities",
    title: "Luxury Amenities",
    tagline: "Locker rooms · Showers · Lounge",
    description:
      "Spa-inspired spaces designed for comfort, privacy, and class.",
    image: s[6],
    alt: "Evolve Fitness — luxury locker rooms and lounge",
  },
  {
    id: "cafe",
    title: "Healthy Café",
    tagline: "Fuel your body right",
    description:
      "Fresh meals and clean nutrition to complement your training.",
    image: s[7],
    alt: "Evolve Fitness — healthy café and nutrition",
  },
];
