/**
 * EVOLVE Badminton Championship 2026 — two separate tournaments (QR posters).
 * Keep in sync with frontend/react/src/data/badmintonChampionship.js
 */

export const BADMINTON_EVENT_YEAR = 2026;
export const REGISTRATION_CLOSES_AT = new Date("2026-08-06T23:59:59+05:30");
export const MAX_ENTRIES_PER_CATEGORY = 16;

/** @typedef {'member' | 'open'} TournamentType */

/** Member tournament categories (chit pairing). */
export const MEMBER_CATEGORIES = [
  { id: "mens_doubles", label: "Men's Doubles", shortLabel: "MD" },
  { id: "mixed_doubles", label: "Mixed Doubles", shortLabel: "XD" },
  { id: "womens_doubles", label: "Women's Doubles", shortLabel: "WD" },
];

/**
 * Open tournament — individual entries with partner recorded per category.
 * Labels stay 60+/70+/80+/90+; minimum ages are as specified for eligibility.
 */
export const OPEN_CATEGORIES = [
  { id: "open_60", label: "60+", shortLabel: "60+", minAge: 26 },
  { id: "open_70", label: "70+", shortLabel: "70+", minAge: 30 },
  { id: "open_80", label: "80+", shortLabel: "80+", minAge: 35 },
  { id: "open_90", label: "90+", shortLabel: "90+", minAge: 40 },
];

export const MEMBER_CATEGORY_IDS = MEMBER_CATEGORIES.map((c) => c.id);
export const OPEN_CATEGORY_IDS = OPEN_CATEGORIES.map((c) => c.id);
export const CATEGORY_IDS = [...MEMBER_CATEGORY_IDS, ...OPEN_CATEGORY_IDS];

/** Member poster player levels */
export const MEMBER_PLAYER_LEVELS = [
  "beginner",
  "amateur",
  "semi_professional",
  "professional",
];

/** Open poster player levels */
export const OPEN_PLAYER_LEVELS = ["beginner", "club", "semi_professional"];

export const ALL_PLAYER_LEVELS = [
  ...new Set([...MEMBER_PLAYER_LEVELS, ...OPEN_PLAYER_LEVELS]),
];

/**
 * Open checkout fees by number of events in cart.
 * @param {number} eventCount
 */
export function computeOpenFeeInr(eventCount) {
  if (eventCount <= 0) return 0;
  if (eventCount === 1) return 500;
  if (eventCount === 2) return 750;
  if (eventCount === 3) return 1000;
  return 1250; // 4+
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
