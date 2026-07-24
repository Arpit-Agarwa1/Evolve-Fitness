/**
 * EVOLVE Badminton Championship 2026 — categories, fees, and rules.
 * Keep in sync with backend/src/config/badmintonChampionship.js
 */

export const BADMINTON_EVENT_YEAR = 2026;

/** Display date for registration close. */
export const REGISTRATION_CLOSES_LABEL = "6 August 2026";

/** Registration closes end of day IST (for age checks). */
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

export const PLAYER_LEVEL_OPTIONS = [
  { value: "amateur", label: "Amateur / Recreational" },
  { value: "club", label: "Club Player" },
  { value: "semi_pro", label: "Semi-professional (Club Player only)" },
  { value: "professional", label: "Professional (not eligible)" },
];

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
 * @param {number} amountInr
 */
export function formatInr(amountInr) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountInr);
}
