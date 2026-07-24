/**
 * EVOLVE Badminton Championship 2026 — categories, fees, and rules.
 * Keep in sync with frontend/react/src/data/badmintonChampionship.js
 */

export const BADMINTON_EVENT_YEAR = 2026;

/** Registration closes end of day IST on this date (inclusive). */
export const REGISTRATION_CLOSES_AT = new Date("2026-08-06T23:59:59+05:30");

export const MAX_ENTRIES_PER_CATEGORY = 16;

/** @typedef {'member' | 'open'} CategoryGroup */

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 *   group: CategoryGroup;
 *   shortLabel?: string;
 *   doubles?: boolean;
 *   minAge?: number;
 * }} BadmintonCategory
 */

/** @type {BadmintonCategory[]} */
export const BADMINTON_CATEGORIES = [
  {
    id: "mens_doubles_member",
    label: "Men's Doubles",
    group: "member",
    shortLabel: "MD",
    doubles: true,
  },
  {
    id: "mixed_doubles_member",
    label: "Mixed Doubles",
    group: "member",
    shortLabel: "XD",
    doubles: true,
  },
  {
    id: "womens_doubles_member",
    label: "Women's Doubles",
    group: "member",
    shortLabel: "WD",
    doubles: true,
  },
  {
    id: "mens_60_plus",
    label: "Men's Singles 60+",
    group: "open",
    shortLabel: "M60+",
    minAge: 60,
  },
  {
    id: "mens_70_plus",
    label: "Men's Singles 70+",
    group: "open",
    shortLabel: "M70+",
    minAge: 70,
  },
  {
    id: "mens_80_plus",
    label: "Men's Singles 80+",
    group: "open",
    shortLabel: "M80+",
    minAge: 80,
  },
  {
    id: "mens_90_plus",
    label: "Men's Singles 90+",
    group: "open",
    shortLabel: "M90+",
    minAge: 90,
  },
  {
    id: "xd_55_plus",
    label: "Mixed Doubles 55+",
    group: "open",
    shortLabel: "XD55+",
    doubles: true,
    minAge: 55,
  },
  {
    id: "xd_70_plus",
    label: "Mixed Doubles 70+",
    group: "open",
    shortLabel: "XD70+",
    doubles: true,
    minAge: 70,
  },
  {
    id: "womens_doubles_open",
    label: "Women's Doubles",
    group: "open",
    shortLabel: "WD",
    doubles: true,
  },
];

export const CATEGORY_IDS = BADMINTON_CATEGORIES.map((c) => c.id);

export const PLAYER_LEVELS = ["amateur", "club", "semi_pro", "professional"];

/**
 * Fee in INR for open (non-member) registrations by event count.
 * Members always pay ₹0.
 * @param {boolean} isEvolveMember
 * @param {number} eventCount
 */
export function computeRegistrationFeeInr(isEvolveMember, eventCount) {
  if (isEvolveMember) return 0;
  if (eventCount <= 0) return 0;
  if (eventCount === 1) return 500;
  if (eventCount === 2) return 750;
  return 1000;
}

/**
 * @param {string} id
 */
export function getCategoryById(id) {
  return BADMINTON_CATEGORIES.find((c) => c.id === id) ?? null;
}

/**
 * @param {string[]} categoryIds
 */
export function selectionNeedsPartner(categoryIds) {
  return categoryIds.some((id) => getCategoryById(id)?.doubles);
}

/**
 * Strip to Indian 10-digit mobile (accepts +91 / 0 prefix).
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
 * Age in full years as of the registration close date.
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
 * @returns {boolean}
 */
export function isRegistrationWindowOpen() {
  return Date.now() <= REGISTRATION_CLOSES_AT.getTime();
}
