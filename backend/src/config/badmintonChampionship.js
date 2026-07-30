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
 * Young Veteran: one young (age open) + one veteran (min 35+).
 * Women's Doubles: partners via chit — no partner fields on the form.
 *
 * @typedef {{
 *   id: string;
 *   label: string;
 *   shortLabel?: string;
 *   division: 'mens_doubles' | 'mixed_doubles' | 'womens_doubles' | 'young_veteran';
 *   requiresPartner: boolean;
 *   minAge?: number;
 *   minAgeMale?: number | null;
 *   minAgeFemale?: number | null;
 *   veteranMinAge?: number;
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
    minAge: 25,
    hint: "Combined age 60+ · each player min 25",
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
    minAge: 35,
    hint: "Combined age 90+ · each player min 35",
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
  {
    id: "open_yv",
    label: "Young Veteran",
    shortLabel: "YV",
    division: "young_veteran",
    requiresPartner: true,
    veteranMinAge: 35,
    hint: "Young player: age open · Veteran: min 35+",
  },
];

/** Legacy open IDs kept for older registrations in Mongo. */
export const LEGACY_OPEN_CATEGORY_IDS = [
  "open_60",
  "open_70",
  "open_80",
  "open_90",
  "open_xd_70", // renamed to open_xd_75 (Mixed Doubles 75+)
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

export const OPEN_PLAYER_LEVELS = [
  "beginner",
  "club",
  "semi_professional",
  "professional",
];

/** Pros may only enter Young Veteran and Mixed Doubles 75+ (partner 30+). */
export const OPEN_PRO_ALLOWED_CATEGORY_IDS = ["open_yv", "open_xd_75"];

/** Extra partner-age floor when a professional enters Mixed Doubles 75+. */
export const OPEN_PRO_MIXED_PARTNER_MIN_AGE = 30;

export const ALL_PLAYER_LEVELS = [
  ...new Set([...MEMBER_PLAYER_LEVELS, ...OPEN_PLAYER_LEVELS]),
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
 * Young Veteran has no per-player floor — use validateYoungVeteranAges.
 * @param {OpenCategory} cat
 * @param {'male' | 'female' | string} gender
 * @returns {number | null}
 */
export function getOpenMinAgeForGender(cat, gender) {
  if (!cat || isYoungVeteranCategory(cat)) return null;
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
export function isYoungVeteranCategory(cat) {
  return cat?.division === "young_veteran";
}

/**
 * Young Veteran: one young (age open) + one veteran (min age).
 * @param {number} playerAge
 * @param {number} partnerAge
 * @param {number} [veteranMinAge]
 */
export function validateYoungVeteranAges(
  playerAge,
  partnerAge,
  veteranMinAge = 35
) {
  if (playerAge >= veteranMinAge || partnerAge >= veteranMinAge) {
    return { ok: true };
  }
  return {
    ok: false,
    message: `Young Veteran requires one player (veteran) aged ${veteranMinAge}+`,
  };
}

/**
 * Professionals may only enter Young Veteran and Mixed Doubles 75+.
 * @param {OpenCategory | null | undefined} cat
 * @param {string} playerLevel
 */
export function isOpenCategoryAllowedForLevel(cat, playerLevel) {
  if (!cat) return false;
  if (playerLevel !== "professional") return true;
  return OPEN_PRO_ALLOWED_CATEGORY_IDS.includes(cat.id);
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
