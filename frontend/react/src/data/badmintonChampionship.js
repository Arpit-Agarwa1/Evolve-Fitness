/**
 * EVOLVE Badminton Championship 2026 — two QR / two pages.
 * Keep in sync with backend/src/config/badmintonChampionship.js
 */

export const BADMINTON_EVENT_YEAR = 2026;
export const REGISTRATION_CLOSES_LABEL = "7 August 2026";
export const REGISTRATION_CLOSES_AT = new Date("2026-08-07T23:59:59+05:30");
export const MAX_ENTRIES_PER_CATEGORY = 16;

export const MEMBER_CATEGORIES = [
  { id: "mens_doubles", label: "Men's Doubles", shortLabel: "MD" },
  { id: "mixed_doubles", label: "Mixed Doubles", shortLabel: "XD" },
  { id: "womens_doubles", label: "Women's Doubles", shortLabel: "WD" },
];

/**
 * Open poster — Men's / Mixed / Women's Doubles with poster age rules.
 * @typedef {{
 *   id: string;
 *   label: string;
 *   shortLabel?: string;
 *   division: 'mens_doubles' | 'mixed_doubles' | 'womens_doubles';
 *   requiresPartner: boolean;
 *   minAge?: number;
 *   minAgeMale?: number | null;
 *   minAgeFemale?: number | null;
 *   hint?: string;
 * }} OpenCategory
 */

/** @type {OpenCategory[]} */
export const OPEN_CATEGORIES = [
  {
    id: "open_md_60",
    label: "Men's Doubles 60+",
    shortLabel: "MD 60+",
    division: "mens_doubles",
    requiresPartner: true,
    minAge: 27,
    hint: "Combined age 60+ · each player min 27",
  },
  {
    id: "open_md_70",
    label: "Men's Doubles 70+",
    shortLabel: "MD 70+",
    division: "mens_doubles",
    requiresPartner: true,
    minAge: 30,
    hint: "Combined age 70+ · each player min 30",
  },
  {
    id: "open_md_80",
    label: "Men's Doubles 80+",
    shortLabel: "MD 80+",
    division: "mens_doubles",
    requiresPartner: true,
    minAge: 35,
    hint: "Combined age 80+ · each player min 35",
  },
  {
    id: "open_md_90",
    label: "Men's Doubles 90+",
    shortLabel: "MD 90+",
    division: "mens_doubles",
    requiresPartner: true,
    minAge: 40,
    hint: "Combined age 90+ · each player min 40",
  },
  {
    id: "open_xd_55",
    label: "Mixed Doubles 55+",
    shortLabel: "XD 55+",
    division: "mixed_doubles",
    requiresPartner: true,
    minAgeMale: 30,
    minAgeFemale: null,
    hint: "Male min 30+ · Female age open",
  },
  {
    id: "open_xd_75",
    label: "Mixed Doubles 75+",
    shortLabel: "XD 75+",
    division: "mixed_doubles",
    requiresPartner: true,
    minAgeMale: 35,
    minAgeFemale: 30,
    hint: "Female min 30+ · Male min 35+",
  },
  {
    id: "open_wd",
    label: "Women's Doubles",
    shortLabel: "WD",
    division: "womens_doubles",
    requiresPartner: false,
    hint: "Pairing via chit system — no partner needed",
  },
];

export const MEMBER_PLAYER_LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "amateur", label: "Amateur" },
  { value: "semi_professional", label: "Semi professional" },
  { value: "professional", label: "Professional" },
];

export const OPEN_PLAYER_LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "club", label: "Club" },
  { value: "semi_professional", label: "Semi professional" },
];

/** Poster fee ladder (per participant, by number of events). */
export const OPEN_FEE_LADDER = [
  { events: 1, amountInr: 500 },
  { events: 2, amountInr: 800 },
  { events: 3, amountInr: 1000 },
  { events: 4, amountInr: 1200 },
];

/**
 * @param {number} eventCount
 */
export function computeOpenFeeInr(eventCount) {
  if (eventCount <= 0) return 0;
  if (eventCount === 1) return 500;
  if (eventCount === 2) return 800;
  if (eventCount === 3) return 1000;
  return 1200;
}

/** Open poster facts shown on /badminton/open. */
export const OPEN_POSTER = {
  title: "Open Badminton Championship",
  organizer: "EVOLVE — The Luxury Fitness",
  poweredBy: "Achievers Badminton Academy",
  dateLabel: "9 August 2026",
  timeLabel: "7:00 AM",
  venue: "Khelcity, Jagatpura, Jaipur",
  registrationClosesLabel: REGISTRATION_CLOSES_LABEL,
  contactName: "Ujjwal Bajaj",
  contactPhone: "9829063727",
  shuttle: "Yonex Mavis 350",
  hospitality: "Premium refreshments (snacks + lunch)",
  prizes:
    "Cash prize, trophy, Evolve gift hamper & exclusive Evolve gift (winners / runners-up)",
  participationGift: "Special gift for every participant",
  maxEntriesNote: `Maximum ${MAX_ENTRIES_PER_CATEGORY} entries per event (first come, first served)`,
  rules: [
    "Professional players are NOT allowed.",
    "Semi-professional players may partner ONLY with a Club player.",
    "Club players may partner with any eligible category.",
    "A list of professional and semi-professional players is available with the organizers.",
    "Women's Doubles pairing is done through a chit system.",
    "Online registration only. Registration closes on 7 August.",
  ],
};

/**
 * @param {string} id
 * @param {'member' | 'open'} type
 */
export function getCategoryById(id, type) {
  const list = type === "member" ? MEMBER_CATEGORIES : OPEN_CATEGORIES;
  return list.find((c) => c.id === id) ?? null;
}

/**
 * @param {OpenCategory | null | undefined} cat
 * @param {'male' | 'female' | string} gender
 * @returns {number | null}
 */
export function getOpenMinAgeForGender(cat, gender) {
  if (!cat) return null;
  if (typeof cat.minAge === "number") return cat.minAge;
  if (gender === "male") {
    return typeof cat.minAgeMale === "number" ? cat.minAgeMale : null;
  }
  if (gender === "female") {
    return typeof cat.minAgeFemale === "number" ? cat.minAgeFemale : null;
  }
  return null;
}

/**
 * @param {OpenCategory | null | undefined} cat
 */
export function openCategoryNeedsPartner(cat) {
  return Boolean(cat?.requiresPartner);
}

/**
 * @param {Date|string} dob
 * @param {Date} [asOf]
 */
export function ageAsOf(dob, asOf = REGISTRATION_CLOSES_AT) {
  const birth = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(birth.getTime())) return NaN;
  let age = asOf.getFullYear() - birth.getFullYear();
  const monthDiff = asOf.getMonth() - birth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && asOf.getDate() < birth.getDate())
  ) {
    age -= 1;
  }
  return age;
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

/** QR poster URLs (local / production). */
export const BADMINTON_MEMBER_PATH = "/badminton/members";
export const BADMINTON_OPEN_PATH = "/badminton/open";
