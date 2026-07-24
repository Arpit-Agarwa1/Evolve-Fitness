import crypto from "crypto";
import BadmintonRegistration from "../models/BadmintonRegistration.js";
import BadmintonSettings from "../models/BadmintonSettings.js";
import Member from "../models/Member.js";
import {
  BADMINTON_CATEGORIES,
  CATEGORY_IDS,
  MAX_ENTRIES_PER_CATEGORY,
  ageAsOf,
  computeRegistrationFeeInr,
  getCategoryById,
  isRegistrationWindowOpen,
  isValidIndianMobile,
  normalizeIndianMobile,
  selectionNeedsPartner,
} from "../config/badmintonChampionship.js";
import { createTtlCache } from "../utils/ttlCache.js";

/** Public status poll cache — invalidated on confirm / settings change. */
const STATUS_TTL_MS = 10_000;
const SETTINGS_TTL_MS = 30_000;
const statusCache = createTtlCache(STATUS_TTL_MS);
const settingsCache = createTtlCache(SETTINGS_TTL_MS);

/** Drop cached badminton status/settings (call after confirm or admin settings PATCH). */
export function invalidateBadmintonStatusCache() {
  statusCache.clear();
  settingsCache.clear();
}

/**
 * @returns {Promise<{ closedCategories: string[]; registrationForceClosed: boolean }>}
 */
export async function getBadmintonSettings() {
  const cached = settingsCache.get();
  if (cached) return cached;

  let doc = await BadmintonSettings.findOne({ key: "default" }).lean();
  if (!doc) {
    doc = (
      await BadmintonSettings.create({
        key: "default",
        closedCategories: [],
        registrationForceClosed: false,
      })
    ).toObject();
  }
  const value = {
    closedCategories: doc.closedCategories ?? [],
    registrationForceClosed: Boolean(doc.registrationForceClosed),
  };
  settingsCache.set(value);
  return value;
}

/**
 * Confirmed seat counts per category (paid or waived).
 * @returns {Promise<Record<string, number>>}
 */
export async function getCategoryCounts() {
  const rows = await BadmintonRegistration.aggregate([
    { $match: { status: "confirmed" } },
    { $unwind: "$categories" },
    { $group: { _id: "$categories", count: { $sum: 1 } } },
  ]);
  /** @type {Record<string, number>} */
  const map = {};
  for (const id of CATEGORY_IDS) map[id] = 0;
  for (const row of rows) {
    map[row._id] = row.count;
  }
  return map;
}

/**
 * @param {{ bypassCache?: boolean }} [opts] — set bypassCache for capacity checks on initiate/verify
 * @returns {Promise<{
 *   open: boolean;
 *   closesAt: string;
 *   forceClosed: boolean;
 *   categories: Array<{
 *     id: string;
 *     label: string;
 *     group: string;
 *     shortLabel?: string;
 *     doubles?: boolean;
 *     minAge?: number;
 *     count: number;
 *     max: number;
 *     full: boolean;
 *     closed: boolean;
 *     available: boolean;
 *   }>;
 * }>}
 */
export async function getPublicCategoryStatus(opts = {}) {
  const bypassCache = Boolean(opts.bypassCache);
  if (!bypassCache) {
    const cached = statusCache.get();
    if (cached) return cached;
  }

  const [settings, counts] = await Promise.all([
    getBadmintonSettings(),
    getCategoryCounts(),
  ]);
  const windowOpen =
    isRegistrationWindowOpen() && !settings.registrationForceClosed;

  const categories = BADMINTON_CATEGORIES.map((c) => {
    const count = counts[c.id] ?? 0;
    const manuallyClosed = settings.closedCategories.includes(c.id);
    const full = count >= MAX_ENTRIES_PER_CATEGORY;
    const closed = manuallyClosed || full;
    return {
      ...c,
      count,
      max: MAX_ENTRIES_PER_CATEGORY,
      full,
      closed,
      available: windowOpen && !closed,
    };
  });

  const value = {
    open: windowOpen,
    closesAt: "2026-08-06T23:59:59+05:30",
    forceClosed: settings.registrationForceClosed,
    categories,
  };
  statusCache.set(value);
  return value;
}

/**
 * Generate unique registration ID like EVB26-A1B2C3.
 */
export async function generateRegistrationId() {
  for (let i = 0; i < 8; i += 1) {
    const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const registrationId = `EVB26-${suffix}`;
    const exists = await BadmintonRegistration.exists({ registrationId });
    if (!exists) return registrationId;
  }
  throw new Error("Could not allocate registration ID");
}

/**
 * Active Evolve member by email or phone (for free member path).
 * @param {string} email
 * @param {string} mobile10
 */
export async function findActiveEvolveMember(email, mobile10) {
  const phoneVariants = [
    mobile10,
    `+91${mobile10}`,
    `91${mobile10}`,
    `0${mobile10}`,
  ];
  return Member.findOne({
    isActive: true,
    $or: [{ email }, { phone: { $in: phoneVariants } }],
  })
    .select("_id fullName email phone")
    .lean();
}

/**
 * Block a second confirmed entry for the same email or mobile.
 * @param {string} email
 * @param {string} mobile10
 */
export async function findConfirmedDuplicate(email, mobile10) {
  const phoneVariants = [
    mobile10,
    `+91${mobile10}`,
    `91${mobile10}`,
    `0${mobile10}`,
  ];
  return BadmintonRegistration.findOne({
    status: "confirmed",
    $or: [{ email }, { mobile: { $in: phoneVariants } }],
  })
    .select("registrationId email mobile")
    .lean();
}

/**
 * Validate and normalize registration payload.
 * @param {Record<string, unknown>} body
 * @returns {{
 *   ok: true;
 *   data: {
 *     fullName: string;
 *     mobile: string;
 *     email: string;
 *     gender: string;
 *     dateOfBirth: Date;
 *     city: string;
 *     state: string;
 *     emergencyContact: string;
 *     isEvolveMember: boolean;
 *     membershipId: string;
 *     playerLevel: string;
 *     clubName: string;
 *     partnerName: string;
 *     partnerMobile: string;
 *     categories: string[];
 *     amountInr: number;
 *   };
 * } | { ok: false; message: string }}
 */
export function parseRegistrationBody(body) {
  const fullName = String(body?.fullName ?? "").trim();
  const mobileRaw = String(body?.mobile ?? "").trim();
  const mobile = normalizeIndianMobile(mobileRaw);
  const email = String(body?.email ?? "")
    .trim()
    .toLowerCase();
  const gender = String(body?.gender ?? "")
    .trim()
    .toLowerCase();
  const dobRaw = String(body?.dateOfBirth ?? "").trim();
  const city = String(body?.city ?? "").trim();
  const state = String(body?.state ?? "").trim();
  const emergencyContact = String(body?.emergencyContact ?? "").trim();
  const isEvolveMember = Boolean(body?.isEvolveMember);
  const membershipId = String(body?.membershipId ?? "").trim();
  const playerLevel = String(body?.playerLevel ?? "")
    .trim()
    .toLowerCase();
  const clubName = String(body?.clubName ?? "").trim();
  const partnerName = String(body?.partnerName ?? "").trim();
  const partnerMobileRaw = String(body?.partnerMobile ?? "").trim();
  const partnerMobile = partnerMobileRaw
    ? normalizeIndianMobile(partnerMobileRaw)
    : "";
  const categoriesRaw = Array.isArray(body?.categories)
    ? body.categories.map((c) => String(c).trim())
    : [];

  if (!fullName || !mobileRaw || !email) {
    return { ok: false, message: "Name, mobile, and email are required" };
  }
  if (!isValidIndianMobile(mobileRaw)) {
    return {
      ok: false,
      message: "Enter a valid 10-digit Indian mobile number",
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Enter a valid email address" };
  }
  if (!["male", "female", "other"].includes(gender)) {
    return { ok: false, message: "Valid gender is required" };
  }
  const dateOfBirth = new Date(dobRaw);
  if (!dobRaw || Number.isNaN(dateOfBirth.getTime())) {
    return { ok: false, message: "Valid date of birth is required" };
  }
  if (!city || !state || !emergencyContact) {
    return {
      ok: false,
      message: "City, state, and emergency contact are required",
    };
  }
  if (playerLevel === "professional") {
    return {
      ok: false,
      message: "Professional players are not eligible for this championship",
    };
  }
  if (!["amateur", "club", "semi_pro"].includes(playerLevel)) {
    return { ok: false, message: "Select a valid player level" };
  }
  if (playerLevel === "semi_pro" && !clubName) {
    return {
      ok: false,
      message: "Semi-professional players must provide their club name",
    };
  }

  const uniqueCategories = [...new Set(categoriesRaw)];
  if (uniqueCategories.length < 1 || uniqueCategories.length > 3) {
    return { ok: false, message: "Select between 1 and 3 categories" };
  }

  const age = ageAsOf(dateOfBirth);

  for (const id of uniqueCategories) {
    const cat = getCategoryById(id);
    if (!cat) {
      return { ok: false, message: `Unknown category: ${id}` };
    }
    if (isEvolveMember && cat.group !== "member") {
      return {
        ok: false,
        message: "EVOLVE members may only enter member (free) categories",
      };
    }
    if (!isEvolveMember && cat.group !== "open") {
      return {
        ok: false,
        message: "Open entries may only select open tournament categories",
      };
    }
    if (typeof cat.minAge === "number" && age < cat.minAge) {
      return {
        ok: false,
        message: `${cat.label} requires age ${cat.minAge}+ (as of 6 Aug 2026)`,
      };
    }
  }

  if (selectionNeedsPartner(uniqueCategories)) {
    if (!partnerName) {
      return {
        ok: false,
        message: "Partner name is required for doubles categories",
      };
    }
    if (!isValidIndianMobile(partnerMobileRaw)) {
      return {
        ok: false,
        message: "Enter a valid 10-digit partner mobile number",
      };
    }
    if (partnerMobile === mobile) {
      return {
        ok: false,
        message: "Partner mobile must be different from yours",
      };
    }
  }

  const amountInr = computeRegistrationFeeInr(
    isEvolveMember,
    uniqueCategories.length
  );

  return {
    ok: true,
    data: {
      fullName,
      mobile,
      email,
      gender,
      dateOfBirth,
      city,
      state,
      emergencyContact,
      isEvolveMember,
      membershipId,
      playerLevel,
      clubName,
      partnerName: selectionNeedsPartner(uniqueCategories) ? partnerName : "",
      partnerMobile: selectionNeedsPartner(uniqueCategories)
        ? partnerMobile
        : "",
      categories: uniqueCategories,
      amountInr,
    },
  };
}

/**
 * Ensure window + capacity for selected categories.
 * @param {string[]} categories
 */
export async function assertCategoriesAvailable(categories) {
  // Always fresh counts for seat reservation (avoid stale cache under FCFS rush).
  const status = await getPublicCategoryStatus({ bypassCache: true });
  if (!status.open) {
    return {
      ok: false,
      message: "Registration is closed for the EVOLVE Badminton Championship",
    };
  }
  for (const id of categories) {
    const row = status.categories.find((c) => c.id === id);
    if (!row?.available) {
      return {
        ok: false,
        message: `${row?.label ?? id} is full or closed`,
      };
    }
  }
  return { ok: true };
}
