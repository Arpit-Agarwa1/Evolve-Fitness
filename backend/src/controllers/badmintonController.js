import BadmintonRegistration from "../models/BadmintonRegistration.js";
import BadmintonSettings from "../models/BadmintonSettings.js";
import { sendError, sendSuccess } from "../views/jsonResponse.js";
import {
  assertCategoriesAvailable,
  findConfirmedDuplicate,
  generateRegistrationId,
  getBadmintonSettings,
  getPublicCategoryStatus,
  parseRegistrationBody,
} from "../services/badmintonService.js";
import {
  createRazorpayOrder,
  isRazorpayConfigured,
  verifyRazorpayPaymentSignature,
} from "../services/razorpayService.js";
import { CATEGORY_IDS } from "../config/badmintonChampionship.js";

/**
 * Shape returned to clients after confirmation.
 * @param {import("mongoose").Document | Record<string, unknown>} doc
 */
function toPublicRegistration(doc) {
  const o = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    registrationId: o.registrationId,
    fullName: o.fullName,
    email: o.email,
    mobile: o.mobile,
    categories: o.categories,
    partnerName: o.partnerName || "",
    partnerMobile: o.partnerMobile || "",
    amountInr: o.amountInr,
    paymentStatus: o.paymentStatus,
    status: o.status,
    isEvolveMember: o.isEvolveMember,
    paidAt: o.paidAt,
    createdAt: o.createdAt,
  };
}

/**
 * GET /api/badminton/status — public category availability.
 */
export async function getBadmintonStatus(req, res, next) {
  try {
    const data = await getPublicCategoryStatus();
    return sendSuccess(res, {
      ...data,
      razorpayEnabled: isRazorpayConfigured(),
      razorpayKeyId: isRazorpayConfigured()
        ? process.env.RAZORPAY_KEY_ID.trim()
        : null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/badminton/register/initiate
 * Creates draft (or free confirmed) registration; returns Razorpay order when fee > 0.
 */
export async function initiateBadmintonRegistration(req, res, next) {
  try {
    const parsed = parseRegistrationBody(req.body ?? {});
    if (!parsed.ok) {
      return sendError(res, parsed.message, 422);
    }

    const availability = await assertCategoriesAvailable(parsed.data.categories);
    if (!availability.ok) {
      return sendError(res, availability.message, 409);
    }

    const duplicate = await findConfirmedDuplicate(
      parsed.data.email,
      parsed.data.mobile
    );
    if (duplicate) {
      return sendError(
        res,
        `You already have a confirmed registration (${duplicate.registrationId}). Contact Evolve to change categories.`,
        409
      );
    }

    const registrationId = await generateRegistrationId();
    const { amountInr, ...fields } = parsed.data;

    // Free path (EVOLVE members) — confirm immediately.
    if (amountInr === 0) {
      const doc = await BadmintonRegistration.create({
        registrationId,
        ...fields,
        amountInr: 0,
        paymentStatus: "waived",
        status: "confirmed",
        paidAt: new Date(),
      });
      return sendSuccess(
        res,
        {
          free: true,
          registration: toPublicRegistration(doc),
        },
        201
      );
    }

    if (!isRazorpayConfigured()) {
      return sendError(
        res,
        "Online payment is temporarily unavailable. Please try again later or contact Evolve.",
        503
      );
    }

    const draft = await BadmintonRegistration.create({
      registrationId,
      ...fields,
      amountInr,
      paymentStatus: "pending",
      status: "draft",
    });

    let order;
    try {
      order = await createRazorpayOrder({
        amountInr,
        receipt: registrationId,
        notes: {
          registrationId,
          email: fields.email,
        },
      });
    } catch (err) {
      await BadmintonRegistration.deleteOne({ _id: draft._id });
      console.error("[badminton] Razorpay order failed:", err);
      return sendError(res, "Could not start payment. Please try again.", 502);
    }

    draft.razorpayOrderId = order.id;
    await draft.save();

    return sendSuccess(
      res,
      {
        free: false,
        keyId: process.env.RAZORPAY_KEY_ID.trim(),
        orderId: order.id,
        amountInr,
        amountPaise: order.amount,
        currency: order.currency,
        registrationId,
        draftId: String(draft._id),
        prefill: {
          name: fields.fullName,
          email: fields.email,
          contact: fields.mobile,
        },
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/badminton/register/verify
 * Confirms registration after successful Razorpay checkout.
 */
export async function verifyBadmintonPayment(req, res, next) {
  try {
    const razorpayOrderId = String(req.body?.razorpayOrderId ?? "").trim();
    const razorpayPaymentId = String(req.body?.razorpayPaymentId ?? "").trim();
    const razorpaySignature = String(req.body?.razorpaySignature ?? "").trim();
    const registrationId = String(req.body?.registrationId ?? "")
      .trim()
      .toUpperCase();

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature ||
      !registrationId
    ) {
      return sendError(res, "Payment verification details are required", 422);
    }

    const valid = verifyRazorpayPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );
    if (!valid) {
      return sendError(res, "Invalid payment signature", 400);
    }

    const doc = await BadmintonRegistration.findOne({ registrationId });
    if (!doc) {
      return sendError(res, "Registration not found", 404);
    }
    if (doc.status === "confirmed") {
      return sendSuccess(res, { registration: toPublicRegistration(doc) });
    }
    if (doc.razorpayOrderId !== razorpayOrderId) {
      return sendError(res, "Order mismatch for this registration", 400);
    }

    // Re-check capacity before confirming (race with FCFS).
    const availability = await assertCategoriesAvailable(doc.categories);
    if (!availability.ok) {
      doc.paymentStatus = "failed";
      await doc.save();
      return sendError(
        res,
        `${availability.message}. Contact Evolve with payment ID ${razorpayPaymentId} for a refund.`,
        409
      );
    }

    doc.paymentStatus = "paid";
    doc.status = "confirmed";
    doc.razorpayPaymentId = razorpayPaymentId;
    doc.razorpaySignature = razorpaySignature;
    doc.paidAt = new Date();
    await doc.save();

    return sendSuccess(res, { registration: toPublicRegistration(doc) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/badminton — list registrations.
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
    const filter = {};
    if (status === "confirmed" || status === "draft" || status === "cancelled") {
      filter.status = status;
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
 * GET /api/admin/badminton/export — CSV of confirmed registrations.
 */
export async function exportAdminBadmintonCsv(req, res, next) {
  try {
    const items = await BadmintonRegistration.find({ status: "confirmed" })
      .sort({ createdAt: -1 })
      .lean();

    const header = [
      "registrationId",
      "fullName",
      "mobile",
      "email",
      "gender",
      "dateOfBirth",
      "city",
      "state",
      "emergencyContact",
      "isEvolveMember",
      "membershipId",
      "playerLevel",
      "clubName",
      "partnerName",
      "partnerMobile",
      "categories",
      "amountInr",
      "paymentStatus",
      "razorpayPaymentId",
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
      lines.push(
        [
          row.registrationId,
          row.fullName,
          row.mobile,
          row.email,
          row.gender,
          row.dateOfBirth
            ? new Date(row.dateOfBirth).toISOString().slice(0, 10)
            : "",
          row.city,
          row.state,
          row.emergencyContact,
          row.isEvolveMember ? "yes" : "no",
          row.membershipId,
          row.playerLevel,
          row.clubName,
          row.partnerName,
          row.partnerMobile,
          (row.categories || []).join("; "),
          row.amountInr,
          row.paymentStatus,
          row.razorpayPaymentId,
          row.paidAt ? new Date(row.paidAt).toISOString() : "",
          row.createdAt ? new Date(row.createdAt).toISOString() : "",
        ]
          .map(escape)
          .join(",")
      );
    }

    const csv = lines.join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="evolve-badminton-registrations.csv"'
    );
    return res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/badminton/settings
 */
export async function getAdminBadmintonSettings(req, res, next) {
  try {
    const [settings, status] = await Promise.all([
      getBadmintonSettings(),
      getPublicCategoryStatus(),
    ]);
    return sendSuccess(res, { settings, status });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/badminton/settings
 * Body: { closedCategories?: string[], registrationForceClosed?: boolean }
 */
export async function updateAdminBadmintonSettings(req, res, next) {
  try {
    const body = req.body ?? {};
    /** @type {Record<string, unknown>} */
    const update = {};

    if (Array.isArray(body.closedCategories)) {
      const nextClosed = body.closedCategories
        .map((c) => String(c).trim())
        .filter((id) => CATEGORY_IDS.includes(id));
      update.closedCategories = nextClosed;
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
