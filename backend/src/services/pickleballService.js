import crypto from "crypto";
import PickleballRegistration from "../models/PickleballRegistration.js";
import PickleballSettings from "../models/PickleballSettings.js";
import { createTtlCache } from "../utils/ttlCache.js";
import {
  PICKLEBALL_CATEGORIES,
  MAX_ENTRIES_PER_CATEGORY,
  MAX_EVENTS_PER_REGISTRATION,
  computePickleballFeeInr,
  getPickleballCategoryById,
  isPickleballCategoryAllowedForGender,
  pickleballCategoryNeedsPartner,
  isValidIndianMobile,
  normalizeIndianMobile,
  isRegistrationWindowOpen,
} from "../config/pickleballChampionship.js";

const statusCache = createTtlCache(8_000);

export function invalidatePickleballStatusCache() {
  statusCache.clear();
}

export async function getPickleballSettings() {
  let doc = await PickleballSettings.findOne({ key: "default" }).lean();
  if (!doc) {
    doc = (
      await PickleballSettings.create({
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
  const rows = await PickleballRegistration.aggregate([
    { $match: { status: "confirmed" } },
    { $unwind: "$categories" },
    { $group: { _id: "$categories", count: { $sum: 1 } } },
  ]);
  /** @type {Record<string, number>} */
  const map = {};
  for (const c of PICKLEBALL_CATEGORIES) {
    map[c.id] = 0;
  }
  for (const row of rows) {
    map[row._id] = row.count;
  }
  return map;
}

export async function getPublicCategoryStatus() {
  const cached = statusCache.get("status");
  if (cached) return cached;

  const [settings, counts] = await Promise.all([
    getPickleballSettings(),
    getCategoryCounts(),
  ]);
  const windowOpen =
    isRegistrationWindowOpen() && !settings.registrationForceClosed;

  const categories = PICKLEBALL_CATEGORIES.map((c) => {
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
  statusCache.set("status", payload);
  return payload;
}

export async function generateRegistrationId() {
  for (let i = 0; i < 8; i += 1) {
    const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const registrationId = `EVP26-${suffix}`;
    const exists = await PickleballRegistration.exists({ registrationId });
    if (!exists) return registrationId;
  }
  throw new Error("Could not allocate registration ID");
}

/**
 * @param {string} mobile10
 */
function phoneVariantsFor(mobile10) {
  return [
    mobile10,
    `+91${mobile10}`,
    `91${mobile10}`,
    `0${mobile10}`,
  ];
}

/**
 * Match lookup first name against stored fullName (first token).
 * @param {string} fullName
 * @param {string} firstName
 */
export function matchesRegistrationFirstName(fullName, firstName) {
  const stored = String(fullName ?? "")
    .trim()
    .split(/\s+/)[0]
    ?.toLowerCase();
  const given = String(firstName ?? "")
    .trim()
    .toLowerCase();
  return Boolean(stored && given && stored === given);
}

/**
 * @param {string} mobile10
 */
export async function findConfirmedDuplicate(mobile10) {
  return PickleballRegistration.findOne({
    status: "confirmed",
    mobile: { $in: phoneVariantsFor(mobile10) },
  })
    .select("registrationId mobile")
    .lean();
}

/**
 * Full confirmed registration for lookup / amend.
 * @param {string} mobile10
 */
export async function findConfirmedRegistration(mobile10) {
  return PickleballRegistration.findOne({
    status: "confirmed",
    mobile: { $in: phoneVariantsFor(mobile10) },
  });
}

/**
 * Unique Cashfree order id for an amendment payment.
 * @param {string} registrationId
 */
export function generateAmendOrderId(registrationId) {
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${registrationId}-A${suffix}`;
}

/**
 * Only newly added categories need an availability check.
 * @param {string[]} categoryIds
 * @param {string[]} alreadyRegisteredIds
 */
export async function assertNewCategoriesAvailable(
  categoryIds,
  alreadyRegisteredIds = []
) {
  const existing = new Set(alreadyRegisteredIds);
  const newIds = categoryIds.filter((id) => !existing.has(id));
  if (newIds.length === 0) return { ok: true };
  return assertCategoriesAvailable(newIds);
}

/**
 * Build pickleball amend payload from existing confirmed doc + new cart.
 * @param {Record<string, unknown>} body
 * @param {import("mongoose").Document | Record<string, unknown>} existing
 */
export function buildPickleballAmendFromExisting(body, existing) {
  const o =
    typeof existing.toObject === "function" ? existing.toObject() : existing;
  const nameParts = String(o.fullName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const firstName = nameParts[0] || "Player";
  const lastName = nameParts.slice(1).join(" ") || firstName;

  const parsed = parsePickleballRegistrationBody({
    firstName,
    lastName,
    fullName: o.fullName,
    mobile: o.mobile,
    email: o.email || "",
    gender: o.gender,
    age: o.age,
    cart: body?.cart ?? body?.events ?? [],
  });
  if (!parsed.ok) return parsed;

  const existingIds = Array.isArray(o.categories) ? o.categories : [];
  for (const id of existingIds) {
    if (!parsed.data.categories.includes(id)) {
      return {
        ok: false,
        message:
          "You cannot remove events that are already paid. Contact Evolve if you need a change.",
      };
    }
  }

  const alreadyPaid = Number(o.amountInr) || 0;
  const newTotal = parsed.data.amountInr;
  const deltaInr = Math.max(0, newTotal - alreadyPaid);

  return {
    ok: true,
    data: {
      events: parsed.data.events,
      categories: parsed.data.categories,
      eventCount: parsed.data.eventCount,
      amountInr: newTotal,
      deltaInr,
      alreadyPaid,
      addedCategoryIds: parsed.data.categories.filter(
        (id) => !existingIds.includes(id)
      ),
    },
  };
}

/**
 * @param {string[]} categoryIds
 */
export async function assertCategoriesAvailable(categoryIds) {
  const status = await getPublicCategoryStatus();
  if (!status.open) {
    return {
      ok: false,
      message: "Registration is closed for the EVOLVE Pickleball Championship",
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
 * Open pickleball — details + cart (max 3) with partners when required.
 * @param {Record<string, unknown>} body
 */
export function parsePickleballRegistrationBody(body) {
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
    return { ok: false, message: "Select gender" };
  }
  if (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 120) {
    return { ok: false, message: "Enter a valid age in years" };
  }
  const age = Math.round(ageNum);
  if (cart.length < 1 || cart.length > MAX_EVENTS_PER_REGISTRATION) {
    return {
      ok: false,
      message: `Add 1–${MAX_EVENTS_PER_REGISTRATION} categories to your cart`,
    };
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

    const cat = getPickleballCategoryById(categoryId);
    if (!cat) {
      return { ok: false, message: `Unknown category: ${categoryId}` };
    }

    if (!isPickleballCategoryAllowedForGender(cat, gender)) {
      if (cat.division === "womens_doubles" || cat.division === "womens_singles") {
        return {
          ok: false,
          message: `${cat.label} is for female players only`,
        };
      }
      if (cat.division === "mens_doubles" || cat.division === "mens_singles") {
        return {
          ok: false,
          message: `${cat.label} is for male players only`,
        };
      }
      return { ok: false, message: `Not eligible for ${cat.label}` };
    }

    if (typeof cat.minAge === "number" && age < cat.minAge) {
      return {
        ok: false,
        message: `${cat.label} requires minimum age ${cat.minAge}+ for you`,
      };
    }

    const needsPartner = pickleballCategoryNeedsPartner(cat);

    if (!needsPartner) {
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
    if (
      typeof cat.minAge === "number" &&
      partnerAgeRounded < cat.minAge
    ) {
      return {
        ok: false,
        message: `Partner must be age ${cat.minAge}+ for ${cat.label}`,
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

  const amountInr = computePickleballFeeInr(events.length);

  return {
    ok: true,
    data: {
      fullName,
      mobile,
      email: email || "",
      gender,
      age,
      categories: events.map((e) => e.categoryId),
      events,
      eventCount: events.length,
      amountInr,
    },
  };
}
