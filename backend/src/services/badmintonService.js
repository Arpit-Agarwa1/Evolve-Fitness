import crypto from "crypto";
import BadmintonRegistration from "../models/BadmintonRegistration.js";
import BadmintonSettings from "../models/BadmintonSettings.js";
import { createTtlCache } from "../utils/ttlCache.js";
import {
  MEMBER_CATEGORIES,
  OPEN_CATEGORIES,
  MEMBER_PLAYER_LEVELS,
  OPEN_PLAYER_LEVELS,
  OPEN_PRO_MIXED_PARTNER_MIN_AGE,
  MAX_ENTRIES_PER_CATEGORY,
  computeOpenFeeInr,
  getCategoryById,
  getOpenMinAgeForGender,
  isOpenCategoryAllowedForLevel,
  isYoungVeteranCategory,
  openCategoryNeedsPartner,
  validateYoungVeteranAges,
  ageAsOf,
  isValidIndianMobile,
  normalizeIndianMobile,
  isRegistrationWindowOpen,
} from "../config/badmintonChampionship.js";

const statusCache = createTtlCache(8_000);

export function invalidateBadmintonStatusCache() {
  statusCache.clear();
}

export async function getBadmintonSettings() {
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
  return {
    closedCategories: doc.closedCategories ?? [],
    registrationForceClosed: Boolean(doc.registrationForceClosed),
  };
}

export async function getCategoryCounts() {
  const rows = await BadmintonRegistration.aggregate([
    { $match: { status: "confirmed" } },
    { $unwind: "$categories" },
    { $group: { _id: "$categories", count: { $sum: 1 } } },
  ]);
  /** @type {Record<string, number>} */
  const map = {};
  for (const c of [...MEMBER_CATEGORIES, ...OPEN_CATEGORIES]) {
    map[c.id] = 0;
  }
  for (const row of rows) {
    map[row._id] = row.count;
  }
  return map;
}

/**
 * @param {'member' | 'open' | 'all'} [tournamentType]
 */
export async function getPublicCategoryStatus(tournamentType = "all") {
  const cached = statusCache.get(`status:${tournamentType}`);
  if (cached) return cached;

  const [settings, counts] = await Promise.all([
    getBadmintonSettings(),
    getCategoryCounts(),
  ]);
  const windowOpen =
    isRegistrationWindowOpen() && !settings.registrationForceClosed;

  const lists = [];
  if (tournamentType === "member" || tournamentType === "all") {
    lists.push(
      ...MEMBER_CATEGORIES.map((c) => ({ ...c, group: "member" }))
    );
  }
  if (tournamentType === "open" || tournamentType === "all") {
    lists.push(...OPEN_CATEGORIES.map((c) => ({ ...c, group: "open" })));
  }

  const categories = lists.map((c) => {
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

  const payload = {
    open: windowOpen,
    closesAt: "2026-08-07T23:59:59+05:30",
    forceClosed: settings.registrationForceClosed,
    categories,
  };
  statusCache.set(`status:${tournamentType}`, payload);
  return payload;
}

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
 * @param {string} mobile10
 * @param {'member' | 'open'} tournamentType
 */
export async function findConfirmedDuplicate(mobile10, tournamentType) {
  const phoneVariants = [
    mobile10,
    `+91${mobile10}`,
    `91${mobile10}`,
    `0${mobile10}`,
  ];
  return BadmintonRegistration.findOne({
    status: "confirmed",
    tournamentType,
    mobile: { $in: phoneVariants },
  })
    .select("registrationId mobile")
    .lean();
}

/**
 * @param {string[]} categoryIds
 */
export async function assertCategoriesAvailable(categoryIds) {
  const status = await getPublicCategoryStatus("all");
  if (!status.open) {
    return {
      ok: false,
      message: "Registration is closed for the EVOLVE Badminton Championship",
    };
  }
  for (const id of categoryIds) {
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

/**
 * Member poster — free registration, chit pairing (no partner collected).
 * @param {Record<string, unknown>} body
 */
export function parseMemberRegistrationBody(body) {
  const fullName = String(body?.fullName ?? "").trim();
  const mobileRaw = String(body?.mobile ?? "").trim();
  const mobile = normalizeIndianMobile(mobileRaw);
  const gender = String(body?.gender ?? "")
    .trim()
    .toLowerCase();
  const dobRaw = String(body?.dateOfBirth ?? "").trim();
  const playerLevel = String(body?.playerLevel ?? "")
    .trim()
    .toLowerCase();
  const categoryId = String(body?.categoryId ?? body?.category ?? "").trim();

  if (!fullName || !mobileRaw) {
    return { ok: false, message: "Name and mobile are required" };
  }
  if (!isValidIndianMobile(mobileRaw)) {
    return {
      ok: false,
      message: "Enter a valid 10-digit Indian mobile number",
    };
  }
  if (!["male", "female", "other"].includes(gender)) {
    return { ok: false, message: "Select gender" };
  }
  const dateOfBirth = new Date(dobRaw);
  if (!dobRaw || Number.isNaN(dateOfBirth.getTime())) {
    return { ok: false, message: "Valid date of birth is required" };
  }
  if (!MEMBER_PLAYER_LEVELS.includes(playerLevel)) {
    return { ok: false, message: "Select a valid player level" };
  }
  const cat = getCategoryById(categoryId, "member");
  if (!cat) {
    return { ok: false, message: "Select a valid category" };
  }

  return {
    ok: true,
    data: {
      tournamentType: /** @type {const} */ ("member"),
      fullName,
      mobile,
      email: "",
      gender,
      dateOfBirth,
      playerLevel,
      categories: [cat.id],
      events: [
        {
          categoryId: cat.id,
          categoryLabel: cat.label,
          partnerName: "",
          partnerAge: null,
          partnerMobile: "",
        },
      ],
      eventCount: 1,
      amountInr: 0,
    },
  };
}

/**
 * Open poster — details + cart of categories with partners (except WD chit).
 * @param {Record<string, unknown>} body
 */
export function parseOpenRegistrationBody(body) {
  const firstName = String(body?.firstName ?? "").trim();
  const lastName = String(body?.lastName ?? "").trim();
  const fullName =
    String(body?.fullName ?? "").trim() ||
    [firstName, lastName].filter(Boolean).join(" ").trim();
  const mobileRaw = String(body?.mobile ?? "").trim();
  const mobile = normalizeIndianMobile(mobileRaw);
  const email = String(body?.email ?? "")
    .trim()
    .toLowerCase();
  const gender = String(body?.gender ?? "")
    .trim()
    .toLowerCase();
  const ageNum = Number(body?.age);
  const playerLevel = String(body?.playerLevel ?? "")
    .trim()
    .toLowerCase();
  const cart = Array.isArray(body?.cart)
    ? body.cart
    : Array.isArray(body?.events)
      ? body.events
      : [];

  if (!firstName || !lastName || !mobileRaw) {
    return {
      ok: false,
      message: "First name, last name, and mobile are required",
    };
  }
  if (!fullName) {
    return { ok: false, message: "Name is required" };
  }
  if (!isValidIndianMobile(mobileRaw)) {
    return {
      ok: false,
      message: "Enter a valid 10-digit Indian mobile number",
    };
  }
  if (!["male", "female"].includes(gender)) {
    return {
      ok: false,
      message: "Select gender (required for Mixed Doubles age rules)",
    };
  }
  if (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 120) {
    return { ok: false, message: "Enter a valid age in years" };
  }
  const age = Math.round(ageNum);
  if (!OPEN_PLAYER_LEVELS.includes(playerLevel)) {
    return { ok: false, message: "Select a valid player level" };
  }
  if (cart.length < 1 || cart.length > 4) {
    return { ok: false, message: "Add 1–4 categories to your cart" };
  }

  /** @type {{ categoryId: string; categoryLabel: string; partnerName: string; partnerFirstName: string; partnerLastName: string; partnerAge: number | null; partnerMobile: string }[]} */
  const events = [];
  const seen = new Set();

  for (const item of cart) {
    const categoryId = String(item?.categoryId ?? "").trim();
    const partnerFirstName = String(item?.partnerFirstName ?? "").trim();
    const partnerLastName = String(item?.partnerLastName ?? "").trim();
    const partnerName =
      String(item?.partnerName ?? "").trim() ||
      [partnerFirstName, partnerLastName].filter(Boolean).join(" ").trim();
    const partnerAgeRaw = item?.partnerAge;
    const partnerAgeNum = Number(partnerAgeRaw);
    const partnerMobileRaw = String(item?.partnerMobile ?? "").trim();
    const partnerMobile = partnerMobileRaw
      ? normalizeIndianMobile(partnerMobileRaw)
      : "";

    if (seen.has(categoryId)) {
      return { ok: false, message: "Each category can only be added once" };
    }
    seen.add(categoryId);

    const cat = getCategoryById(categoryId, "open");
    if (!cat) {
      return { ok: false, message: `Unknown category: ${categoryId}` };
    }

    if (!isOpenCategoryAllowedForLevel(cat, playerLevel)) {
      return {
        ok: false,
        message:
          "Professional players may only enter Young Veteran and Mixed Doubles 75+ (partner aged 30+)",
      };
    }

    if (cat.division === "womens_doubles" && gender !== "female") {
      return {
        ok: false,
        message: "Women's Doubles is for female players only",
      };
    }
    if (cat.division === "mens_doubles" && gender !== "male") {
      return {
        ok: false,
        message: "Men's Doubles is for male players only",
      };
    }

    const playerMin = getOpenMinAgeForGender(cat, gender);
    if (typeof playerMin === "number" && age < playerMin) {
      return {
        ok: false,
        message: `${cat.label} requires minimum age ${playerMin}+ for you`,
      };
    }

    const needsPartner = openCategoryNeedsPartner(cat);

    if (!needsPartner) {
      // Women's Doubles — chit pairing; no partner collected.
      events.push({
        categoryId: cat.id,
        categoryLabel: cat.label,
        partnerFirstName: "",
        partnerLastName: "",
        partnerName: "",
        partnerAge: null,
        partnerMobile: "",
      });
      continue;
    }

    if (!partnerFirstName || !partnerLastName) {
      return {
        ok: false,
        message: `Partner first and last name are required for ${cat.label}`,
      };
    }
    if (!partnerName) {
      return {
        ok: false,
        message: `Partner name is required for ${cat.label}`,
      };
    }
    if (
      partnerAgeRaw === "" ||
      partnerAgeRaw == null ||
      !Number.isFinite(partnerAgeNum) ||
      partnerAgeNum < 1 ||
      partnerAgeNum > 120
    ) {
      return {
        ok: false,
        message: `Partner age is required for ${cat.label}`,
      };
    }

    const partnerAgeRounded = Math.round(partnerAgeNum);

    if (isYoungVeteranCategory(cat)) {
      const yv = validateYoungVeteranAges(
        age,
        partnerAgeRounded,
        cat.veteranMinAge ?? 35
      );
      if (!yv.ok) {
        return { ok: false, message: yv.message };
      }
    } else {
      const partnerGender =
        cat.division === "mixed_doubles"
          ? gender === "male"
            ? "female"
            : "male"
          : gender;
      const partnerMin = getOpenMinAgeForGender(cat, partnerGender);
      if (typeof partnerMin === "number" && partnerAgeRounded < partnerMin) {
        return {
          ok: false,
          message: `Partner must be age ${partnerMin}+ for ${cat.label}`,
        };
      }
    }

    if (
      playerLevel === "professional" &&
      cat.id === "open_xd_75" &&
      partnerAgeRounded < OPEN_PRO_MIXED_PARTNER_MIN_AGE
    ) {
      return {
        ok: false,
        message: `Professional players need a partner aged ${OPEN_PRO_MIXED_PARTNER_MIN_AGE}+ for Mixed Doubles 75+`,
      };
    }

    if (partnerMobileRaw && !isValidIndianMobile(partnerMobileRaw)) {
      return {
        ok: false,
        message: `Enter a valid partner mobile for ${cat.label}`,
      };
    }

    events.push({
      categoryId: cat.id,
      categoryLabel: cat.label,
      partnerFirstName,
      partnerLastName,
      partnerName,
      partnerAge: partnerAgeRounded,
      partnerMobile,
    });
  }

  const amountInr = computeOpenFeeInr(events.length);

  return {
    ok: true,
    data: {
      tournamentType: /** @type {const} */ ("open"),
      fullName,
      mobile,
      email: email || "",
      gender,
      age,
      dateOfBirth: null,
      playerLevel,
      categories: events.map((e) => e.categoryId),
      events,
      eventCount: events.length,
      amountInr,
    },
  };
}
