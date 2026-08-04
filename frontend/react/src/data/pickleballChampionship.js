/**
 * EVOLVE Open Pickleball Championship 2026.
 * Keep in sync with backend/src/config/pickleballChampionship.js
 */

export const PICKLEBALL_EVENT_YEAR = 2026;
export const REGISTRATION_CLOSES_LABEL = "7 August 2026";
export const REGISTRATION_CLOSES_AT = new Date("2026-08-07T23:59:59+05:30");
export const MAX_ENTRIES_PER_CATEGORY = 16;
export const MAX_EVENTS_PER_REGISTRATION = 3;

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 *   shortLabel?: string;
 *   division: 'mens_doubles' | 'mixed_doubles' | 'womens_doubles' | 'mens_singles' | 'womens_singles';
 *   requiresPartner: boolean;
 *   minAge?: number | null;
 *   hint?: string;
 * }} PickleballCategory
 */

/** @type {PickleballCategory[]} */
export const PICKLEBALL_CATEGORIES = [
  {
    id: "pk_md_35",
    label: "Men's Doubles 35+",
    shortLabel: "MD 35+",
    division: "mens_doubles",
    requiresPartner: true,
    minAge: 35,
    hint: "Each player min age 35+",
  },
  {
    id: "pk_md_50",
    label: "Men's Doubles 50+",
    shortLabel: "MD 50+",
    division: "mens_doubles",
    requiresPartner: true,
    minAge: 50,
    hint: "Each player min age 50+",
  },
  {
    id: "pk_md_open",
    label: "Men's Doubles Open",
    shortLabel: "MD Open",
    division: "mens_doubles",
    requiresPartner: true,
    minAge: 19,
    hint: "Each player min age 19+",
  },
  {
    id: "pk_xd_35",
    label: "Mixed Doubles 35+",
    shortLabel: "XD 35+",
    division: "mixed_doubles",
    requiresPartner: true,
    minAge: 35,
    hint: "Both players min age 35+",
  },
  {
    id: "pk_xd_open",
    label: "Mixed Doubles Open",
    shortLabel: "XD Open",
    division: "mixed_doubles",
    requiresPartner: true,
    minAge: 19,
    hint: "Both players min age 19+",
  },
  {
    id: "pk_wd",
    label: "Women's Doubles",
    shortLabel: "WD",
    division: "womens_doubles",
    requiresPartner: false,
    minAge: null,
    hint: "Pairing via chit system — no partner needed",
  },
  {
    id: "pk_ms",
    label: "Men's Singles",
    shortLabel: "MS",
    division: "mens_singles",
    requiresPartner: false,
    minAge: null,
  },
  {
    id: "pk_ws",
    label: "Women's Singles",
    shortLabel: "WS",
    division: "womens_singles",
    requiresPartner: false,
    minAge: null,
  },
];

export const PICKLEBALL_FEE_LADDER = [
  { events: 1, amountInr: 500 },
  { events: 2, amountInr: 1000 },
  { events: 3, amountInr: 1200 },
];

/**
 * @param {number} eventCount
 */
export function computePickleballFeeInr(eventCount) {
  if (eventCount <= 0) return 0;
  if (eventCount === 1) return 500;
  if (eventCount === 2) return 1000;
  return 1200;
}

export const PICKLEBALL_POSTER = {
  title: "Open Pickleball Championship",
  organizer: "EVOLVE — The Luxury Fitness",
  dateLabel: "9 August 2026",
  timeLabel: "8:00 AM",
  venue: "Khelcity, Jagatpura, Jaipur",
  registrationClosesLabel: REGISTRATION_CLOSES_LABEL,
  contactName: "Ujjwal Bajaj",
  contactPhone: "9829063727",
  hook: "Warm up for States — prove your level here",
  hookSub: "Your best chance to test the game before the big stage",
  hospitality: "Premium hospitality including refreshments, snacks, and lunch",
  prizes: "Cash prize, trophies & exclusive Evolve gift (winners / runners-up)",
  participationGift: "Special gift for every participant",
  formatNote: "Round Robin + Knockout (preferred; depends on entries)",
  scoringNote: "Semi-final & Final: service point · All other matches: rally",
  maxEntriesNote: `Maximum ${MAX_ENTRIES_PER_CATEGORY} entries per event (first come, first served)`,
  rules: [
    "This registration is for you only — your partner must register separately and name you as their partner for the team to match.",
    "Format: Round Robin + Knockout (preferred; depends on entries).",
    "Semi-final & Final: service point. All other matches: rally scoring.",
    "Women's Doubles pairing is done through a chit system.",
    "Online registration only. Registration closes on 7 August.",
  ],
};

/**
 * @param {string} id
 */
export function getPickleballCategoryById(id) {
  return PICKLEBALL_CATEGORIES.find((c) => c.id === id) ?? null;
}

/**
 * @param {PickleballCategory | null | undefined} cat
 */
export function pickleballCategoryNeedsPartner(cat) {
  return Boolean(cat?.requiresPartner);
}

/**
 * @param {PickleballCategory | null | undefined} cat
 * @param {string} gender
 */
export function isPickleballCategoryAllowedForGender(cat, gender) {
  if (!cat || !gender) return false;
  if (cat.division === "mens_doubles" || cat.division === "mens_singles") {
    return gender === "male";
  }
  if (cat.division === "womens_doubles" || cat.division === "womens_singles") {
    return gender === "female";
  }
  if (cat.division === "mixed_doubles") {
    return gender === "male" || gender === "female";
  }
  return false;
}

/**
 * @param {unknown} raw
 */
export function normalizeIndianMobile(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

/**
 * @param {unknown} raw
 */
export function isValidIndianMobile(raw) {
  return /^[6-9]\d{9}$/.test(normalizeIndianMobile(raw));
}

/**
 * @param {number} amountInr
 */
export function formatInr(amountInr) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountInr);
}

export const PICKLEBALL_PATH = "/pickleball";
