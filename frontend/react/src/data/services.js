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
    alt: "Evolve Fitness reception desk — luxury arrival and member services",
  },
  {
    id: "space",
    title: "Massive Space",
    tagline: "20,000 sq. ft. of pure luxury & strength",
    description:
      "Room to train without limits in an environment built for performance and comfort.",
    image: s[1],
    alt: "Evolve Fitness open floor with warm-up zones, wood arches, and branded entry glass",
  },
  {
    id: "equipment",
    title: "Elite Equipment",
    tagline: "USA-imported precision",
    description:
      "Professional-grade machines engineered for precision, safety, and results.",
    image: s[2],
    alt: "Olympic power racks, bumper plates, and EVOLVE-branded lifting platforms",
  },
  {
    id: "training",
    title: "Smart Training",
    tagline: "Certified expert trainers",
    description:
      "Personalised programming from coaches who know how to unlock your next level.",
    image: s[3],
    alt: "Private coaching suite with Evolve branding for personal training consults",
  },
  {
    id: "pilates-yoga",
    title: "Pilates & Yoga",
    tagline: "Balance meets strength",
    description:
      "Flow, stretch, and align your body in dedicated mind-body sessions.",
    image: s[4],
    alt: "Dedicated Pilates studio with reformers, mirrors, and premium lighting",
  },
  {
    id: "recovery",
    title: "Recovery Zone",
    tagline: "Steam · Ice bath · Shower",
    description:
      "Recover better so you can come back stronger, session after session.",
    image: s[5],
    alt: "Premium lockers and steam room recovery zone at Evolve Fitness",
  },
  {
    id: "amenities",
    title: "Luxury Amenities",
    tagline: "Locker rooms · Showers · Lounge",
    description:
      "Spa-inspired spaces designed for comfort, privacy, and class.",
    image: s[6],
    alt: "Luxury locker vanities with backlit mirrors and spa-inspired finishes",
  },
  {
    id: "cafe",
    title: "Healthy Café",
    tagline: "Fuel your body right",
    description:
      "Fresh meals and clean nutrition to complement your training.",
    image: s[7],
    alt: "Member lounge and seating overlooking the Evolve Fitness training floor",
  },
];
