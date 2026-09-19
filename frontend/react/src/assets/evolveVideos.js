/**
 * Web-optimized facility clips. Each scene starts on a different shot
 * so page heroes do not all open on the mall aerial.
 * Sources: `scripts/optimize-videos.sh` → /public/videos.
 */

const HERO = "/videos/hero.mp4";
const INSIDE = "/videos/inside.mp4";

/**
 * @typedef {{ src: string; poster: string; startAt: number; endAt: number }} EvolveVideoScene
 */

/** @type {Record<string, EvolveVideoScene>} */
export const evolveVideos = {
  /** Home hero — wide strength floor */
  homeHero: {
    src: HERO,
    poster: "/videos/poster-floor.jpg",
    startAt: 4.8,
    endAt: 8.8,
  },
  /** Gallery featured cell — treadmill / cardio bay */
  gallery: {
    src: INSIDE,
    poster: "/videos/poster-tread.jpg",
    startAt: 8,
    endAt: 12.2,
  },
  /** Massive Space card — dumbbell racks + Evolve neon */
  space: {
    src: HERO,
    poster: "/videos/poster-weights.jpg",
    startAt: 12.5,
    endAt: 16,
  },
  /** Smart Training card — members lifting */
  training: {
    src: INSIDE,
    poster: "/videos/poster-training.jpg",
    startAt: 16.5,
    endAt: 20.5,
  },
  /** Home CTA — cardio studio */
  cta: {
    src: INSIDE,
    poster: "/videos/poster-cardio.jpg",
    startAt: 24.5,
    endAt: 28.5,
  },
  /** Trainers hero — athlete on the floor */
  trainers: {
    src: INSIDE,
    poster: "/videos/poster-athlete.jpg",
    startAt: 20.5,
    endAt: 24.5,
  },
  /** Programs hero — training on machines */
  programs: {
    src: INSIDE,
    poster: "/videos/poster-lift.jpg",
    startAt: 12.2,
    endAt: 16.5,
  },
  /** Membership — GET STRONG studio */
  membership: {
    src: HERO,
    poster: "/videos/poster-strong.jpg",
    startAt: 8.8,
    endAt: 13,
  },
  /** Register — café / lounge */
  register: {
    src: HERO,
    poster: "/videos/poster-cafe.jpg",
    startAt: 16,
    endAt: 21,
  },
  /** Contact — Vivacity Mall aerial with Evolve LED */
  contact: {
    src: HERO,
    poster: "/videos/poster-mall.jpg",
    startAt: 0,
    endAt: 4.8,
  },
};
