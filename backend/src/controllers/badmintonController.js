import BadmintonRegistration from "../models/BadmintonRegistration.js";
import BadmintonSettings from "../models/BadmintonSettings.js";
import { sendError, sendSuccess } from "../views/jsonResponse.js";
import {
  assertCategoriesAvailable,
  assertNewCategoriesAvailable,
  buildOpenAmendFromExisting,
  findConfirmedDuplicate,
  findConfirmedRegistration,
  generateAmendOrderId,
  generateRegistrationId,
  getBadmintonSettings,
  getPublicCategoryStatus,
  invalidateBadmintonStatusCache,
  matchesRegistrationFirstName,
  parseOpenRegistrationBody,
} from "../services/badmintonService.js";
import {
  createCashfreeOrder,
  fetchCashfreeOrder,
  getCashfreeMode,
  getPaymentReturnOrigin,
  isCashfreeConfigured,
  isCashfreeOrderPaid,
} from "../services/cashfreeService.js";
import { CATEGORY_IDS, isValidIndianMobile, normalizeIndianMobile } from "../config/badmintonChampionship.js";

/**
 * @param {import("mongoose").Document | Record<string, unknown>} doc
 */
function toPublicRegistration(doc) {
  const o = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    registrationId: o.registrationId,
    tournamentType: o.tournamentType,
    fullName: o.fullName,
    email: o.email || "",
    mobile: o.mobile,
    gender: o.gender || "",
    age: o.age ?? null,
    dateOfBirth: o.dateOfBirth || null,
    playerLevel: o.playerLevel,
    categories: o.categories,
    events: o.events || [],
    eventCount: o.eventCount ?? (o.events?.length || 0),
    amountInr: o.amountInr,
    paymentStatus: o.paymentStatus,
    status: o.status,
    paidAt: o.paidAt,
    createdAt: o.createdAt,
  };
}

/**
 * GET /api/badminton/status?type=member|open|all
 */
export async function getBadmintonStatus(req, res, next) {
  try {
    const typeRaw = String(req.query?.type ?? "all").trim().toLowerCase();
    const type =
      typeRaw === "member" || typeRaw === "open" ? typeRaw : "all";
    const data = await getPublicCategoryStatus(type);
    res.set(
      "Cache-Control",
      "public, max-age=10, stale-while-revalidate=20"
    );
    return sendSuccess(res, {
      ...data,
      cashfreeEnabled: isCashfreeConfigured(),
      cashfreeMode: isCashfreeConfigured() ? getCashfreeMode() : null,
      /** @deprecated kept briefly so older clients don't break */
      razorpayEnabled: isCashfreeConfigured(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/badminton/open/checkout — create draft + Cashfree order.
 */
export async function checkoutOpenTournament(req, res, next) {
  try {
    const parsed = parseOpenRegistrationBody(req.body ?? {});
    if (!parsed.ok) return sendError(res, parsed.message, 422);

    const availability = await assertCategoriesAvailable(
      parsed.data.categories
    );
    if (!availability.ok) return sendError(res, availability.message, 409);

    const duplicate = await findConfirmedDuplicate(parsed.data.mobile, "open");
    if (duplicate) {
      return sendError(
        res,
        `This mobile is already registered for the Open tournament (${duplicate.registrationId}). Use “Already registered?” on this page to edit or add events.`,
        409
      );
    }

    if (!isCashfreeConfigured()) {
      return sendError(
        res,
        "Online payment is temporarily unavailable. Add Cashfree keys to the server and try again.",
        503
      );
    }

    const registrationId = await generateRegistrationId();
    const { amountInr, ...fields } = parsed.data;
    // Cashfree order_id: keep registration id (hyphen allowed).
    const cashfreeOrderId = registrationId;

    const draft = await BadmintonRegistration.create({
      registrationId,
      ...fields,
      amountInr,
      paymentStatus: "pending",
      status: "draft",
      cashfreeOrderId,
    });

    const returnUrl = `${getPaymentReturnOrigin()}/badminton/open?registrationId=${encodeURIComponent(registrationId)}&order_id={order_id}`;

    let order;
    try {
      order = await createCashfreeOrder({
        amountInr,
        orderId: cashfreeOrderId,
        customerId: `open_${fields.mobile}`,
        customerPhone: fields.mobile,
        customerName: fields.fullName,
        customerEmail: fields.email || "",
        returnUrl,
        orderNote: `Open badminton ${fields.eventCount} event(s)`,
      });
    } catch (err) {
      await BadmintonRegistration.deleteOne({ _id: draft._id });
      console.error("[badminton open] Cashfree order failed:", err?.response?.data || err);
      return sendError(res, "Could not start payment. Please try again.", 502);
    }

    const paymentSessionId =
      order?.payment_session_id || order?.paymentSessionId || "";
    if (!paymentSessionId) {
      await BadmintonRegistration.deleteOne({ _id: draft._id });
      return sendError(res, "Could not start payment. Please try again.", 502);
    }

    draft.cashfreePaymentSessionId = paymentSessionId;
    await draft.save();

    return sendSuccess(
      res,
      {
        paymentSessionId,
        orderId: cashfreeOrderId,
        amountInr,
        currency: "INR",
        mode: getCashfreeMode(),
        registrationId,
        draftId: String(draft._id),
        eventCount: fields.eventCount,
        events: fields.events,
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/badminton/open/verify — confirm Cashfree order is PAID.
 */
export async function verifyOpenTournamentPayment(req, res, next) {
  try {
    const registrationId = String(req.body?.registrationId ?? "")
      .trim()
      .toUpperCase();
    const orderIdBody = String(req.body?.orderId ?? "").trim();

    if (!registrationId) {
      return sendError(res, "registrationId is required", 422);
    }

    if (!isCashfreeConfigured()) {
      return sendError(res, "Payment verification is unavailable", 503);
    }

    const doc = await BadmintonRegistration.findOne({
      registrationId,
      tournamentType: "open",
    });
    if (!doc) return sendError(res, "Registration not found", 404);
    if (doc.status === "confirmed") {
      return sendSuccess(res, { registration: toPublicRegistration(doc) });
    }

    const cashfreeOrderId = orderIdBody || doc.cashfreeOrderId || registrationId;
    if (doc.cashfreeOrderId && doc.cashfreeOrderId !== cashfreeOrderId) {
      return sendError(res, "Order mismatch for this registration", 400);
    }

    let order;
    try {
      order = await fetchCashfreeOrder(cashfreeOrderId);
    } catch (err) {
      console.error("[badminton open] Cashfree fetch failed:", err?.response?.data || err);
      return sendError(res, "Could not verify payment. Please try again.", 502);
    }

    if (!isCashfreeOrderPaid(order)) {
      return sendError(
        res,
        `Payment not completed (status: ${order?.order_status || "unknown"}).`,
        400
      );
    }

    const availability = await assertCategoriesAvailable(doc.categories);
    if (!availability.ok) {
      doc.paymentStatus = "failed";
      await doc.save();
      return sendError(
        res,
        `${availability.message}. Contact Evolve with order ${cashfreeOrderId} for a refund.`,
        409
      );
    }

    doc.paymentStatus = "paid";
    doc.status = "confirmed";
    doc.cashfreeOrderId = cashfreeOrderId;
    doc.cashfreePaymentId = String(
      order?.cf_payment_id || order?.payment_id || cashfreeOrderId
    );
    doc.paidAt = new Date();
    await doc.save();
    invalidateBadmintonStatusCache();

    return sendSuccess(res, { registration: toPublicRegistration(doc) });
  } catch (err) {
    next(err);
  }
}

/**
 * Apply a paid (or free) pending amend onto a confirmed registration.
 * @param {import("mongoose").Document} doc
 * @param {{ events: unknown[]; categories: string[]; eventCount: number; amountInr: number }} amend
 * @param {string} [cashfreeOrderId]
 * @param {string} [cashfreePaymentId]
 */
async function applyAmendToRegistration(
  doc,
  amend,
  cashfreeOrderId = "",
  cashfreePaymentId = ""
) {
  doc.events = amend.events;
  doc.categories = amend.categories;
  doc.eventCount = amend.eventCount;
  doc.amountInr = amend.amountInr;
  doc.pendingAmend = null;
  if (cashfreeOrderId) {
    doc.cashfreeOrderId = cashfreeOrderId;
  }
  if (cashfreePaymentId) {
    doc.cashfreePaymentId = cashfreePaymentId;
  }
  await doc.save();
  invalidateBadmintonStatusCache();
}

/**
 * Validate lookup credentials and return confirmed registration or error payload.
 * @param {Record<string, unknown>} body
 * @param {'member' | 'open'} tournamentType
 */
async function resolveLookupRegistration(body, tournamentType) {
  const firstName = String(body?.firstName ?? "").trim();
  const mobileRaw = String(body?.mobile ?? "").trim();

  if (!firstName || !mobileRaw) {
    return { ok: false, status: 422, message: "First name and mobile are required" };
  }
  if (!isValidIndianMobile(mobileRaw)) {
    return {
      ok: false,
      status: 422,
      message: "Enter a valid 10-digit Indian mobile number",
    };
  }

  const mobile = normalizeIndianMobile(mobileRaw);
  const doc = await findConfirmedRegistration(mobile, tournamentType);
  if (!doc || !matchesRegistrationFirstName(doc.fullName, firstName)) {
    return {
      ok: false,
      status: 404,
      message: "No matching registration found. Check first name and mobile.",
    };
  }
  return { ok: true, doc, firstName, mobile };
}

/**
 * POST /api/badminton/open/lookup — already registered (phone + first name).
 */
export async function lookupOpenRegistration(req, res, next) {
  try {
    const resolved = await resolveLookupRegistration(req.body ?? {}, "open");
    if (!resolved.ok) {
      return sendError(res, resolved.message, resolved.status);
    }
    return sendSuccess(res, {
      registration: toPublicRegistration(resolved.doc),
      maxEvents: 4,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/badminton/open/amend/checkout — add events / edit partners; pay delta only.
 */
export async function checkoutOpenAmend(req, res, next) {
  try {
    const resolved = await resolveLookupRegistration(req.body ?? {}, "open");
    if (!resolved.ok) {
      return sendError(res, resolved.message, resolved.status);
    }
    const doc = resolved.doc;

    const built = buildOpenAmendFromExisting(req.body ?? {}, doc);
    if (!built.ok) return sendError(res, built.message, 422);

    const availability = await assertNewCategoriesAvailable(
      built.data.categories,
      doc.categories || []
    );
    if (!availability.ok) return sendError(res, availability.message, 409);

    // Partner-only edits (or same events) — no payment.
    if (built.data.deltaInr <= 0) {
      await applyAmendToRegistration(doc, built.data);
      return sendSuccess(res, {
        paymentRequired: false,
        deltaInr: 0,
        alreadyPaid: built.data.alreadyPaid,
        newTotalInr: built.data.amountInr,
        registration: toPublicRegistration(doc),
      });
    }

    if (!isCashfreeConfigured()) {
      return sendError(
        res,
        "Online payment is temporarily unavailable. Add Cashfree keys to the server and try again.",
        503
      );
    }

    const cashfreeOrderId = generateAmendOrderId(doc.registrationId);
    const returnUrl = `${getPaymentReturnOrigin()}/badminton/open?registrationId=${encodeURIComponent(doc.registrationId)}&order_id={order_id}&amend=1`;

    let order;
    try {
      order = await createCashfreeOrder({
        amountInr: built.data.deltaInr,
        orderId: cashfreeOrderId,
        customerId: `open_amd_${doc.mobile}`,
        customerPhone: doc.mobile,
        customerName: doc.fullName,
        customerEmail: doc.email || "",
        returnUrl,
        orderNote: `Open badminton amend +${built.data.addedCategoryIds.length} event(s)`,
      });
    } catch (err) {
      console.error("[badminton open amend] Cashfree order failed:", err?.response?.data || err);
      return sendError(res, "Could not start payment. Please try again.", 502);
    }

    const paymentSessionId =
      order?.payment_session_id || order?.paymentSessionId || "";
    if (!paymentSessionId) {
      return sendError(res, "Could not start payment. Please try again.", 502);
    }

    doc.pendingAmend = {
      events: built.data.events,
      categories: built.data.categories,
      eventCount: built.data.eventCount,
      amountInr: built.data.amountInr,
      deltaInr: built.data.deltaInr,
      cashfreeOrderId,
      cashfreePaymentSessionId: paymentSessionId,
    };
    await doc.save();

    return sendSuccess(
      res,
      {
        paymentRequired: true,
        paymentSessionId,
        orderId: cashfreeOrderId,
        amountInr: built.data.deltaInr,
        deltaInr: built.data.deltaInr,
        alreadyPaid: built.data.alreadyPaid,
        newTotalInr: built.data.amountInr,
        currency: "INR",
        mode: getCashfreeMode(),
        registrationId: doc.registrationId,
        eventCount: built.data.eventCount,
        events: built.data.events,
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/badminton/open/amend/verify — confirm amend Cashfree payment and merge events.
 */
export async function verifyOpenAmendPayment(req, res, next) {
  try {
    const registrationId = String(req.body?.registrationId ?? "")
      .trim()
      .toUpperCase();
    const orderIdBody = String(req.body?.orderId ?? "").trim();

    if (!registrationId) {
      return sendError(res, "registrationId is required", 422);
    }
    if (!isCashfreeConfigured()) {
      return sendError(res, "Payment verification is unavailable", 503);
    }

    const doc = await BadmintonRegistration.findOne({
      registrationId,
      tournamentType: "open",
      status: "confirmed",
    });
    if (!doc) return sendError(res, "Registration not found", 404);

    const pending = doc.pendingAmend;
    if (!pending?.cashfreeOrderId) {
      // Already applied or never started — return current registration.
      return sendSuccess(res, { registration: toPublicRegistration(doc) });
    }

    const cashfreeOrderId = orderIdBody || pending.cashfreeOrderId;
    if (pending.cashfreeOrderId !== cashfreeOrderId) {
      return sendError(res, "Order mismatch for this amendment", 400);
    }

    let order;
    try {
      order = await fetchCashfreeOrder(cashfreeOrderId);
    } catch (err) {
      console.error("[badminton open amend] Cashfree fetch failed:", err?.response?.data || err);
      return sendError(res, "Could not verify payment. Please try again.", 502);
    }

    if (!isCashfreeOrderPaid(order)) {
      return sendError(
        res,
        `Payment not completed (status: ${order?.order_status || "unknown"}).`,
        400
      );
    }

    const availability = await assertNewCategoriesAvailable(
      pending.categories || [],
      doc.categories || []
    );
    if (!availability.ok) {
      return sendError(
        res,
        `${availability.message}. Contact Evolve with order ${cashfreeOrderId} for a refund.`,
        409
      );
    }

    await applyAmendToRegistration(
      doc,
      {
        events: pending.events,
        categories: pending.categories,
        eventCount: pending.eventCount,
        amountInr: pending.amountInr,
      },
      cashfreeOrderId,
      String(order?.cf_payment_id || order?.payment_id || cashfreeOrderId)
    );

    return sendSuccess(res, { registration: toPublicRegistration(doc) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/badminton
 */
export async function listAdminBadmintonRegistrations(req, res, next) {
  try {
    const MAX_LIMIT = 100;
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number.parseInt(String(req.query.limit ?? "50"), 10) || 50)
    );
    const skip = Math.max(
      0,
      Number.parseInt(String(req.query.skip ?? "0"), 10) || 0
    );
    const status = String(req.query.status ?? "").trim();
    const tournamentType = String(req.query.tournamentType ?? "").trim();
    /** @type {Record<string, unknown>} */
    const filter = {};
    if (status === "confirmed" || status === "draft" || status === "cancelled") {
      filter.status = status;
    }
    if (tournamentType === "member" || tournamentType === "open") {
      filter.tournamentType = tournamentType;
    }

    const [items, total] = await Promise.all([
      BadmintonRegistration.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BadmintonRegistration.countDocuments(filter),
    ]);

    return sendSuccess(res, { items, total, limit, skip });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/badminton/export
 */
export async function exportAdminBadmintonCsv(req, res, next) {
  try {
    const tournamentType = String(req.query.tournamentType ?? "").trim();
    /** @type {Record<string, unknown>} */
    const filter = { status: "confirmed" };
    if (tournamentType === "member" || tournamentType === "open") {
      filter.tournamentType = tournamentType;
    }

    const items = await BadmintonRegistration.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const header = [
      "registrationId",
      "tournamentType",
      "fullName",
      "mobile",
      "email",
      "gender",
      "age",
      "dateOfBirth",
      "playerLevel",
      "eventCount",
      "categories",
      "eventsPartners",
      "amountInr",
      "paymentStatus",
      "cashfreePaymentId",
      "paidAt",
      "createdAt",
    ];

    const escape = (v) => {
      const s = v == null ? "" : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const lines = [header.join(",")];
    for (const row of items) {
      const eventsPartners = (row.events || [])
        .map((e) => {
          const name =
            e.partnerName ||
            [e.partnerFirstName, e.partnerLastName].filter(Boolean).join(" ") ||
            "-";
          const agePart =
            e.partnerAge != null && e.partnerAge !== ""
              ? ` age ${e.partnerAge}`
              : "";
          return `${e.categoryLabel || e.categoryId}: ${name}${agePart} (${e.partnerMobile || "-"})`;
        })
        .join(" | ");
      lines.push(
        [
          row.registrationId,
          row.tournamentType,
          row.fullName,
          row.mobile,
          row.email,
          row.gender,
          row.age ?? "",
          row.dateOfBirth
            ? new Date(row.dateOfBirth).toISOString().slice(0, 10)
            : "",
          row.playerLevel,
          row.eventCount ?? (row.events || []).length,
          (row.categories || []).join("; "),
          eventsPartners,
          row.amountInr,
          row.paymentStatus,
          row.cashfreePaymentId || row.razorpayPaymentId || "",
          row.paidAt ? new Date(row.paidAt).toISOString() : "",
          row.createdAt ? new Date(row.createdAt).toISOString() : "",
        ]
          .map(escape)
          .join(",")
      );
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="evolve-badminton-registrations.csv"'
    );
    return res.status(200).send(lines.join("\n"));
  } catch (err) {
    next(err);
  }
}

export async function getAdminBadmintonSettings(req, res, next) {
  try {
    const [settings, status] = await Promise.all([
      getBadmintonSettings(),
      getPublicCategoryStatus("all"),
    ]);
    return sendSuccess(res, { settings, status });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminBadmintonSettings(req, res, next) {
  try {
    const body = req.body ?? {};
    /** @type {Record<string, unknown>} */
    const update = {};

    if (Array.isArray(body.closedCategories)) {
      update.closedCategories = body.closedCategories
        .map((c) => String(c).trim())
        .filter((id) => CATEGORY_IDS.includes(id));
    }
    if (typeof body.registrationForceClosed === "boolean") {
      update.registrationForceClosed = body.registrationForceClosed;
    }

    if (Object.keys(update).length === 0) {
      return sendError(res, "No settings to update", 422);
    }

    const doc = await BadmintonSettings.findOneAndUpdate(
      { key: "default" },
      { $set: update },
      { upsert: true, new: true }
    ).lean();

    invalidateBadmintonStatusCache();
    const status = await getPublicCategoryStatus("all");
    return sendSuccess(res, {
      settings: {
        closedCategories: doc.closedCategories ?? [],
        registrationForceClosed: Boolean(doc.registrationForceClosed),
      },
      status,
    });
  } catch (err) {
    next(err);
  }
}
