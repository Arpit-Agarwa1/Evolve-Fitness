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
    "Women's Doubles pairing is done through a chit system.",
    "Online registration only. Registration closes on 7 August.",
  ],
};

/**
 * Official eligibility lists for Evolve Open (from organizers PDF).
 * @typedef {{ sn: number; name: string; club: string }} OpenListedPlayer
 */

/** List A — semi-professionals (may pair only with a Club player). */
export const OPEN_SEMI_PRO_PLAYERS = /** @type {OpenListedPlayer[]} */ ([
  { sn: 1, name: "Naresh Dhalan", club: "ACE" },
  { sn: 2, name: "Rakesh Choudhary", club: "ACE" },
  { sn: 3, name: "Shashank Singh", club: "ACE" },
  { sn: 4, name: "Nirmal Dhakad", club: "ACE" },
  { sn: 5, name: "Vikkash Sharma", club: "Achievers" },
  { sn: 6, name: "J.P. Yadav", club: "Achievers" },
  { sn: 7, name: "Manoj Verma", club: "Achievers" },
  { sn: 8, name: "Dharamraj Sharma", club: "Aerial" },
  { sn: 9, name: "Magan Singh", club: "Aerial" },
  { sn: 10, name: "Ram Niwas", club: "Aerial" },
  { sn: 11, name: "Rupesh Goyal", club: "Aerial" },
  { sn: 12, name: "Hemendra Yadav", club: "Alwar" },
  { sn: 13, name: "Sunil Karwasra", club: "Barmer" },
  { sn: 14, name: "Abhinandan Jain", club: "Battledore" },
  { sn: 15, name: "Piyush", club: "Battledore" },
  { sn: 16, name: "Sandeep Arora", club: "County" },
  { sn: 17, name: "Raman Pal", club: "Dausa" },
  { sn: 18, name: "Ravikant Sharma", club: "Dausa" },
  { sn: 19, name: "Anil Paswan", club: "Dess.Inn" },
  { sn: 20, name: "Ghanshyam Yadav", club: "Extreme" },
  { sn: 21, name: "Subham Agarwal", club: "Extreme" },
  { sn: 22, name: "Jaswant Singh", club: "Ideal" },
  { sn: 23, name: "Raunak", club: "Ideal" },
  { sn: 24, name: "Rakesh Katta", club: "Jai Club" },
  { sn: 25, name: "Raman Raina", club: "Jai Club" },
  { sn: 26, name: "Aditya Harlalka", club: "Jpr Club" },
  { sn: 27, name: "Pankaj Taneja", club: "Jpr Club" },
  { sn: 28, name: "Pankaj Arora", club: "Pink City" },
  { sn: 29, name: "Sanjiv Arora", club: "Pink City" },
  { sn: 30, name: "Ravindra Joshi", club: "Racconact" },
  { sn: 31, name: "Vinayak", club: "Racconact" },
  { sn: 32, name: "Karan", club: "Racconact" },
  { sn: 33, name: "Abhishek", club: "Shuttler" },
  { sn: 34, name: "Ankush Joshi", club: "Shuttler" },
  { sn: 35, name: "Sanjeev Chabra", club: "KHEL CITY" },
  { sn: 36, name: "Akhil Mathur", club: "Sikar" },
  { sn: 37, name: "Sandeep Jangir", club: "Sikar" },
  { sn: 38, name: "Brijesh Singh", club: "Smriti Van" },
  { sn: 39, name: "Deepak Sharma", club: "Smriti Van" },
  { sn: 40, name: "Ayush", club: "SMS" },
  { sn: 41, name: "Nikunj Chippa", club: "SMS" },
  { sn: 42, name: "Arpit Sharma", club: "SMS" },
  { sn: 43, name: "Vijay Prasad", club: "SMS" },
  { sn: 44, name: "Aditya Shekhawat", club: "SMS" },
  { sn: 45, name: "Divyanshu", club: "SMS" },
  { sn: 46, name: "Hari Singh", club: "SMS" },
  { sn: 47, name: "Kandarp Chaubey", club: "SMS" },
  { sn: 48, name: "Kaustubh", club: "SMS" },
  { sn: 49, name: "Manmohan", club: "SMS" },
  { sn: 50, name: "Mohit Jain", club: "SMS" },
  { sn: 51, name: "Mohit", club: "SMS" },
  { sn: 52, name: "Alok Meena", club: "SMS" },
  { sn: 53, name: "Vineet Sharma", club: "SMS" },
  { sn: 54, name: "Vikram Singh", club: "SMS" },
  { sn: 55, name: "Akshit", club: "Spofit" },
  { sn: 56, name: "Ayush", club: "Spofit" },
  { sn: 57, name: "Rishi Kumar", club: "Spofit" },
  { sn: 58, name: "Shiv Shanker Sharma", club: "Spofit" },
  { sn: 59, name: "Neeraj Sharma", club: "Sanskriti" },
]);

/** Official PDF of Lists A & B (served from /public/pdf). */
export const OPEN_PLAYER_LISTS_PDF_PATH = "/pdf/evolve-open-player-lists.pdf";

/** Notes appended to List A in the organizers PDF. */
export const OPEN_SEMI_PRO_NOTES = [
  "All Coaches / PTIs",
  "All other National players",
  "This list is not exhaustive.",
];

/** List B — professionals (cannot participate). */
export const OPEN_PRO_PLAYERS = /** @type {OpenListedPlayer[]} */ ([
  { sn: 1, name: "Aakash", club: "ACE" },
  { sn: 2, name: "KD (Krishna Dutt)", club: "ACE" },
  { sn: 3, name: "Puspender Singh", club: "ACE" },
  { sn: 4, name: "Rajeev Sharma", club: "CAP" },
  { sn: 5, name: "Rajesh Verma", club: "Chirawa" },
  { sn: 6, name: "Krishan K Gupta", club: "County" },
  { sn: 7, name: "Saurabh Chandel", club: "Jpr Sports" },
  { sn: 8, name: "Himanshu", club: "Raconnect" },
  { sn: 9, name: "Vikram Shekhawat", club: "Rajputana" },
  { sn: 10, name: "Piyush Parihar", club: "Sanskriti" },
  { sn: 11, name: "Nikhil Jangid", club: "SMS" },
  { sn: 12, name: "Harish Goyal", club: "SMS" },
  { sn: 13, name: "Ranveer RajPurohit", club: "SMS" },
  { sn: 14, name: "Suraj Godara", club: "SMS" },
  { sn: 15, name: "Kandarbh Choubey", club: "SMS" },
  { sn: 16, name: "Rajesh Khandelwal", club: "SPOFIT" },
  { sn: 17, name: "Tribuhuvan Bhist", club: "SPOFIT" },
]);

export const OPEN_PLAYER_LIST_NOTE =
  "Club players can pair with any category.";

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

/** Tournament WhatsApp group invite (post-registration). */
export const BADMINTON_WHATSAPP_GROUP_URL =
  "https://chat.whatsapp.com/IyNo8yLfgNjDWUXPdIxhti";

/** Seconds before optional auto-open of the WhatsApp invite. */
export const BADMINTON_WHATSAPP_REDIRECT_SECONDS = 5;
