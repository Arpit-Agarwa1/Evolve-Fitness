import PickleballRegistration from "../models/PickleballRegistration.js";
import PickleballSettings from "../models/PickleballSettings.js";
import { sendError, sendSuccess } from "../views/jsonResponse.js";
import {
  assertCategoriesAvailable,
  assertNewCategoriesAvailable,
  buildPickleballAmendFromExisting,
  findConfirmedDuplicate,
  findConfirmedRegistration,
  generateAmendOrderId,
  generateRegistrationId,
  getPickleballSettings,
  getPublicCategoryStatus,
  invalidatePickleballStatusCache,
  matchesRegistrationFirstName,
  parsePickleballRegistrationBody,
} from "../services/pickleballService.js";
import {
  createCashfreeOrder,
  fetchCashfreeOrder,
  getCashfreeMode,
  getPaymentReturnOrigin,
  isCashfreeConfigured,
  isCashfreeOrderPaid,
} from "../services/cashfreeService.js";
import {
  MAX_EVENTS_PER_REGISTRATION,
  PICKLEBALL_CATEGORY_IDS,
  isValidIndianMobile,
  normalizeIndianMobile,
} from "../config/pickleballChampionship.js";

/**
 * @param {import("mongoose").Document | Record<string, unknown>} doc
 */
function toPublicRegistration(doc) {
  const o = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    registrationId: o.registrationId,
    fullName: o.fullName,
    email: o.email || "",
    mobile: o.mobile,
    gender: o.gender || "",
    age: o.age ?? null,
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
 * GET /api/pickleball/status
 */
export async function getPickleballStatus(req, res, next) {
  try {
    const data = await getPublicCategoryStatus();
    res.set(
      "Cache-Control",
      "public, max-age=10, stale-while-revalidate=20"
    );
    return sendSuccess(res, {
      ...data,
      cashfreeEnabled: isCashfreeConfigured(),
      cashfreeMode: isCashfreeConfigured() ? getCashfreeMode() : null,
      razorpayEnabled: isCashfreeConfigured(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/pickleball/checkout — create draft + Cashfree order.
 */
export async function checkoutPickleball(req, res, next) {
  try {
    const parsed = parsePickleballRegistrationBody(req.body ?? {});
    if (!parsed.ok) return sendError(res, parsed.message, 422);

    const availability = await assertCategoriesAvailable(
      parsed.data.categories
    );
    if (!availability.ok) return sendError(res, availability.message, 409);

    const duplicate = await findConfirmedDuplicate(parsed.data.mobile);
    if (duplicate) {
      return sendError(
        res,
        `This mobile is already registered for Pickleball (${duplicate.registrationId}). Use “Already registered?” on this page to edit or add events.`,
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
    const cashfreeOrderId = registrationId;

    const draft = await PickleballRegistration.create({
      registrationId,
      ...fields,
      amountInr,
      paymentStatus: "pending",
      status: "draft",
      cashfreeOrderId,
    });

    const returnUrl = `${getPaymentReturnOrigin()}/pickleball?registrationId=${encodeURIComponent(registrationId)}&order_id={order_id}`;

    let order;
    try {
      order = await createCashfreeOrder({
        amountInr,
        orderId: cashfreeOrderId,
        customerId: `pickleball_${fields.mobile}`,
        customerPhone: fields.mobile,
        customerName: fields.fullName,
        customerEmail: fields.email || "",
        returnUrl,
        orderNote: `Pickleball ${fields.eventCount} event(s)`,
      });
    } catch (err) {
      await PickleballRegistration.deleteOne({ _id: draft._id });
      console.error(
        "[pickleball] Cashfree order failed:",
        err?.response?.data || err
      );
      return sendError(res, "Could not start payment. Please try again.", 502);
    }

    const paymentSessionId =
      order?.payment_session_id || order?.paymentSessionId || "";
    if (!paymentSessionId) {
      await PickleballRegistration.deleteOne({ _id: draft._id });
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
 * POST /api/pickleball/verify — confirm Cashfree order is PAID.
 */
export async function verifyPickleballPayment(req, res, next) {
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

    const doc = await PickleballRegistration.findOne({ registrationId });
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
      console.error(
        "[pickleball] Cashfree fetch failed:",
        err?.response?.data || err
      );
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
    invalidatePickleballStatusCache();

    return sendSuccess(res, { registration: toPublicRegistration(doc) });
  } catch (err) {
    next(err);
  }
}

/**
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
  invalidatePickleballStatusCache();
}

/**
 * @param {Record<string, unknown>} body
 */
async function resolveLookupRegistration(body) {
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
  const doc = await findConfirmedRegistration(mobile);
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
 * POST /api/pickleball/lookup
 */
export async function lookupPickleballRegistration(req, res, next) {
  try {
    const resolved = await resolveLookupRegistration(req.body ?? {});
    if (!resolved.ok) {
      return sendError(res, resolved.message, resolved.status);
    }
    return sendSuccess(res, {
      registration: toPublicRegistration(resolved.doc),
      maxEvents: MAX_EVENTS_PER_REGISTRATION,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/pickleball/amend/checkout
 */
export async function checkoutPickleballAmend(req, res, next) {
  try {
    const resolved = await resolveLookupRegistration(req.body ?? {});
    if (!resolved.ok) {
      return sendError(res, resolved.message, resolved.status);
    }
    const doc = resolved.doc;

    const built = buildPickleballAmendFromExisting(req.body ?? {}, doc);
    if (!built.ok) return sendError(res, built.message, 422);

    const availability = await assertNewCategoriesAvailable(
      built.data.categories,
      doc.categories || []
    );
    if (!availability.ok) return sendError(res, availability.message, 409);

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
    const returnUrl = `${getPaymentReturnOrigin()}/pickleball?registrationId=${encodeURIComponent(doc.registrationId)}&order_id={order_id}&amend=1`;

    let order;
    try {
      order = await createCashfreeOrder({
        amountInr: built.data.deltaInr,
        orderId: cashfreeOrderId,
        customerId: `pickleball_amd_${doc.mobile}`,
        customerPhone: doc.mobile,
        customerName: doc.fullName,
        customerEmail: doc.email || "",
        returnUrl,
        orderNote: `Pickleball amend +${built.data.addedCategoryIds.length} event(s)`,
      });
    } catch (err) {
      console.error(
        "[pickleball amend] Cashfree order failed:",
        err?.response?.data || err
      );
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
 * POST /api/pickleball/amend/verify
 */
export async function verifyPickleballAmendPayment(req, res, next) {
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

    const doc = await PickleballRegistration.findOne({
      registrationId,
      status: "confirmed",
    });
    if (!doc) return sendError(res, "Registration not found", 404);

    const pending = doc.pendingAmend;
    if (!pending?.cashfreeOrderId) {
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
      console.error(
        "[pickleball amend] Cashfree fetch failed:",
        err?.response?.data || err
      );
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
 * GET /api/admin/pickleball
 */
export async function listAdminPickleballRegistrations(req, res, next) {
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
    /** @type {Record<string, unknown>} */
    const filter = {};
    if (status === "confirmed" || status === "draft" || status === "cancelled") {
      filter.status = status;
    }

    const [items, total] = await Promise.all([
      PickleballRegistration.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PickleballRegistration.countDocuments(filter),
    ]);

    return sendSuccess(res, { items, total, limit, skip });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/pickleball/export
 */
export async function exportAdminPickleballCsv(req, res, next) {
  try {
    const items = await PickleballRegistration.find({ status: "confirmed" })
      .sort({ createdAt: -1 })
      .lean();

    const header = [
      "registrationId",
      "fullName",
      "mobile",
      "email",
      "gender",
      "age",
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
          row.fullName,
          row.mobile,
          row.email,
          row.gender,
          row.age ?? "",
          row.eventCount ?? (row.events || []).length,
          (row.categories || []).join("; "),
          eventsPartners,
          row.amountInr,
          row.paymentStatus,
          row.cashfreePaymentId || "",
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
      'attachment; filename="evolve-pickleball-registrations.csv"'
    );
    return res.status(200).send(lines.join("\n"));
  } catch (err) {
    next(err);
  }
}

export async function getAdminPickleballSettings(req, res, next) {
  try {
    const [settings, status] = await Promise.all([
      getPickleballSettings(),
      getPublicCategoryStatus(),
    ]);
    return sendSuccess(res, { settings, status });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminPickleballSettings(req, res, next) {
  try {
    const body = req.body ?? {};
    /** @type {Record<string, unknown>} */
    const update = {};

    if (Array.isArray(body.closedCategories)) {
      update.closedCategories = body.closedCategories
        .map((c) => String(c).trim())
        .filter((id) => PICKLEBALL_CATEGORY_IDS.includes(id));
    }
    if (typeof body.registrationForceClosed === "boolean") {
      update.registrationForceClosed = body.registrationForceClosed;
    }

    if (Object.keys(update).length === 0) {
      return sendError(res, "No settings to update", 422);
    }

    const doc = await PickleballSettings.findOneAndUpdate(
      { key: "default" },
      { $set: update },
      { upsert: true, new: true }
    ).lean();

    invalidatePickleballStatusCache();
    const status = await getPublicCategoryStatus();
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
