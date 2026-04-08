/**
 * Evolve Fitness — luxury service lineup for marketing sections.
 * Images live in `src/assets/` (branded photography).
 */
import serviceValet from "../assets/service-valet.png";
import serviceMassiveSpace from "../assets/service-massive-space.png";
import serviceEliteEquipment from "../assets/service-elite-equipment.png";
import serviceSmartTraining from "../assets/service-smart-training.png";
import servicePilatesYoga from "../assets/service-pilates-yoga.png";
import serviceRecovery from "../assets/service-recovery.png";
import serviceAmenities from "../assets/service-amenities.png";
import serviceCafe from "../assets/service-cafe.png";

/** @typedef {{ id: string; title: string; tagline: string; description: string; image: string; alt: string }} EvolveService */

/** @type {EvolveService[]} */
export const evolveServices = [
  {
    id: "valet",
    title: "Valet Luxury",
    tagline: "Luxury begins before you enter",
    description:
      "Seamless arrival and an effortless experience from the moment you pull up.",
    image: serviceValet,
    alt: "Valet opening the door of a luxury car at Evolve Fitness",
  },
  {
    id: "space",
    title: "Massive Space",
    tagline: "20,000 sq. ft. of pure luxury & strength",
    description:
      "Room to train without limits in an environment built for performance and comfort.",
    image: serviceMassiveSpace,
    alt: "Spacious luxury gym floor at Evolve Fitness",
  },
  {
    id: "equipment",
    title: "Elite Equipment",
    tagline: "USA-imported precision",
    description:
      "Professional-grade machines engineered for precision, safety, and results.",
    image: serviceEliteEquipment,
    alt: "Elite USA-imported gym equipment at Evolve Fitness",
  },
  {
    id: "training",
    title: "Smart Training",
    tagline: "Certified expert trainers",
    description:
      "Personalised programming from coaches who know how to unlock your next level.",
    image: serviceSmartTraining,
    alt: "Smart training with expert coaches at Evolve Fitness",
  },
  {
    id: "pilates-yoga",
    title: "Pilates & Yoga",
    tagline: "Balance meets strength",
    description:
      "Flow, stretch, and align your body in dedicated mind-body sessions.",
    image: servicePilatesYoga,
    alt: "Pilates and yoga studio at Evolve Fitness",
  },
  {
    id: "recovery",
    title: "Recovery Zone",
    tagline: "Steam · Ice bath · Shower",
    description:
      "Recover better so you can come back stronger, session after session.",
    image: serviceRecovery,
    alt: "Recovery zone with steam, ice bath, and showers at Evolve Fitness",
  },
  {
    id: "amenities",
    title: "Luxury Amenities",
    tagline: "Locker rooms · Showers · Lounge",
    description:
      "Spa-inspired spaces designed for comfort, privacy, and class.",
    image: serviceAmenities,
    alt: "Luxury locker rooms and lounge at Evolve Fitness",
  },
  {
    id: "cafe",
    title: "Healthy Café",
    tagline: "Fuel your body right",
    description:
      "Fresh meals and clean nutrition to complement your training.",
    image: serviceCafe,
    alt: "Healthy café meals and nutrition at Evolve Fitness",
  },
];
