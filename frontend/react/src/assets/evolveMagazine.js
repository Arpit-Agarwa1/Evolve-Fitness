/**
 * Professional interior shoot (2026) — single source for HD gym imagery.
 * Indices: 0 hero, 1–8 services, 9–15 gallery / programs / trainers.
 *
 * 0 EVOLVE neon + dumbbells + mirrors — flagship hero
 * 1 Reception desk — first impression / arrival
 * 2 Zoned floor — arches, warm-up graphics, Evolve entry glass
 * 3 Olympic platforms — power racks, bumper plates, EVOLVE lifting mats
 * 4 Coaching consultation suite — PT meetings (trainers hero)
 * 5 Dedicated Pilates reformer studio
 * 6 Lockers + steam room recovery
 * 7 Triple vanity spa-style wash stations
 * 8 Member lounge overlooking training floor (café adjacency)
 * 9 Spin / cardio bikes — arched window bay
 * 10 Digital class kiosk — Evolve Luxury Fitness smart floor
 * 11 Pilates studio glass from plate-loaded area
 * 12 Locker concourse — numbered banks
 * 13 Mezzanine + Olympic platform overview
 * 14 Functional sprint track — agility numbers + overhead rig
 * 15 Signature strength floor — wood-slat ceiling, orange kit
 */
import evolveImg0 from "./Evolve Images/evolve gym magazine 28.1.2026-images-0.jpg";
import evolveImg1 from "./Evolve Images/evolve gym magazine 28.1.2026-images-1.jpg";
import evolveImg2 from "./Evolve Images/evolve gym magazine 28.1.2026-images-2.jpg";
import evolveImg3 from "./Evolve Images/evolve gym magazine 28.1.2026-images-3.jpg";
import evolveImg4 from "./Evolve Images/evolve gym magazine 28.1.2026-images-4.jpg";
import evolveImg5 from "./Evolve Images/evolve gym magazine 28.1.2026-images-5.jpg";
import evolveImg6 from "./Evolve Images/evolve gym magazine 28.1.2026-images-6.jpg";
import evolveImg7 from "./Evolve Images/evolve gym magazine 28.1.2026-images-7.jpg";
import evolveImg8 from "./Evolve Images/evolve gym magazine 28.1.2026-images-8.jpg";
import evolveImg9 from "./Evolve Images/evolve gym magazine 28.1.2026-images-9.jpg";
import evolveImg10 from "./Evolve Images/evolve gym magazine 28.1.2026-images-10.jpg";
import evolveImg11 from "./Evolve Images/evolve gym magazine 28.1.2026-images-11.jpg";
import evolveImg12 from "./Evolve Images/evolve gym magazine 28.1.2026-images-12.jpg";
import evolveImg13 from "./Evolve Images/evolve gym magazine 28.1.2026-images-13.jpg";
import evolveImg14 from "./Evolve Images/evolve gym magazine 28.1.2026-images-14.jpg";
import evolveImg15 from "./Evolve Images/evolve gym magazine 28.1.2026-images-15.jpg";

/** @type {readonly string[]} */
export const evolveMagazineImages = [
  evolveImg0,
  evolveImg1,
  evolveImg2,
  evolveImg3,
  evolveImg4,
  evolveImg5,
  evolveImg6,
  evolveImg7,
  evolveImg8,
  evolveImg9,
  evolveImg10,
  evolveImg11,
  evolveImg12,
  evolveImg13,
  evolveImg14,
  evolveImg15,
];

/** Hero / first impression */
export const evolveHeroImage = evolveImg0;

/** Home “Inside Evolve” strip — magazine spreads 9–15 */
export const evolveGalleryImages = evolveMagazineImages.slice(9);

/** Alt text aligned with each gallery frame (indices 9–15 of {@link evolveMagazineImages}) */
export const evolveGalleryImageAlts = [
  "Studio cardio bikes and recumbents along a tall arched window",
  "Digital training kiosk with Evolve Luxury Fitness branding beside cardio",
  "Glass-walled Pilates studio next to orange plate-loaded machines",
  "Long locker concourse with numbered banks at Evolve Fitness Jaipur",
  "Olympic lifting platform, mezzanine, and Evolve branding on the strength floor",
  "Functional sprint lane with agility markings and overhead monkey-bar rig",
  "Premium strength bay — USA-grade machines under wood-slat ceiling lighting",
];

/** Programs page — six distinct shots */
export const evolveProgramImages = evolveMagazineImages.slice(10, 16);

/** Trainers hero backdrop */
export const evolveTrainersHeroImage = evolveImg4;

/**
 * Trainer card placeholders — varied facility shots until headshots exist.
 * @type {readonly string[]}
 */
export const evolveTrainerCardImages = [
  evolveImg11,
  evolveImg12,
  evolveImg13,
  evolveImg14,
  evolveImg15,
  evolveImg9,
];
