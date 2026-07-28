/**
 * EVOLVE Badminton Championship 2026 — two separate tournaments (QR posters).
 * Keep in sync with frontend/react/src/data/badmintonChampionship.js
 */

export const BADMINTON_EVENT_YEAR = 2026;
/** Poster: registration closes 7 August. */
export const REGISTRATION_CLOSES_AT = new Date("2026-08-07T23:59:59+05:30");
export const MAX_ENTRIES_PER_CATEGORY = 16;

/** @typedef {'member' | 'open'} TournamentType */

/** Member tournament categories (chit pairing). */
export const MEMBER_CATEGORIES = [
  { id: "mens_doubles", label: "Men's Doubles", shortLabel: "MD" },
  { id: "mixed_doubles", label: "Mixed Doubles", shortLabel: "XD" },
  { id: "womens_doubles", label: "Women's Doubles", shortLabel: "WD" },
];

/**
 * Open tournament events (poster categories).
 * Men's Doubles use combined-age brackets with a minimum individual age.
 * Mixed Doubles use gender-specific minimum ages.
 * Women's Doubles: partners via chit — no partner fields on the form.
 *
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
    id: "open_xd_70",
    label: "Mixed Doubles 70+",
    shortLabel: "XD 70+",
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

/** Legacy open IDs kept for older registrations in Mongo. */
export const LEGACY_OPEN_CATEGORY_IDS = [
  "open_60",
  "open_70",
  "open_80",
  "open_90",
];

export const MEMBER_CATEGORY_IDS = MEMBER_CATEGORIES.map((c) => c.id);
export const OPEN_CATEGORY_IDS = OPEN_CATEGORIES.map((c) => c.id);
export const CATEGORY_IDS = [
  ...MEMBER_CATEGORY_IDS,
  ...OPEN_CATEGORY_IDS,
  ...LEGACY_OPEN_CATEGORY_IDS,
];

export const MEMBER_PLAYER_LEVELS = [
  "beginner",
  "amateur",
  "semi_professional",
  "professional",
];

export const OPEN_PLAYER_LEVELS = ["beginner", "club", "semi_professional"];

export const ALL_PLAYER_LEVELS = [
  ...new Set([...MEMBER_PLAYER_LEVELS, ...OPEN_PLAYER_LEVELS]),
];

/**
 * @param {number} eventCount
 */
export function computeOpenFeeInr(eventCount) {
  if (eventCount <= 0) return 0;
  if (eventCount === 1) return 500;
  if (eventCount === 2) return 750;
  if (eventCount === 3) return 1000;
  return 1250;
}

/**
 * @param {string} id
 * @param {TournamentType} type
 */
export function getCategoryById(id, type) {
  const list = type === "member" ? MEMBER_CATEGORIES : OPEN_CATEGORIES;
  return list.find((c) => c.id === id) ?? null;
}

/**
 * Minimum age for a player of the given gender in an open category.
 * Returns null when age is open / unrestricted.
 * @param {OpenCategory} cat
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
 * @param {OpenCategory} cat
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

export function isRegistrationWindowOpen() {
  return Date.now() <= REGISTRATION_CLOSES_AT.getTime();
}
