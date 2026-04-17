import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Member, { PLAN_VALUES, GENDER_VALUES } from "../models/Member.js";
import Trainer from "../models/Trainer.js";
import { sendSuccess, sendError } from "../views/jsonResponse.js";

const SALT_ROUNDS = 10;
const MAX_LIMIT = 100;
const ADMIN_NOTES_MAX = 2000;

/** @param {string} s */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build Mongo filter from GET /api/admin/members query params.
 * @param {import("express").Request["query"]} query
 */
function buildMemberListFilter(query) {
  /** @type {Record<string, unknown>[]} */
  const parts = [];

  const rawQ = String(query.q ?? query.search ?? "").trim();
  if (rawQ) {
    const esc = escapeRegex(rawQ);
    parts.push({
      $or: [
        { fullName: new RegExp(esc, "i") },
        { email: new RegExp(esc, "i") },
        { phone: new RegExp(esc, "i") },
        { emergencyContact: new RegExp(esc, "i") },
      ],
    });
  }

  const status = String(query.status ?? "all").toLowerCase();
  if (status === "active") {
    parts.push({
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    });
  } else if (status === "inactive") {
    parts.push({ isActive: false });
  }

  const membership = String(query.membership ?? "all").toLowerCase();
  const today = new Date();
  const utcMidnight = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );
  const startOfToday = new Date(utcMidnight);

  if (membership === "frozen") {
    parts.push({ membershipFrozen: true });
  } else if (membership === "expired") {
    parts.push({ membershipEndDate: { $lt: startOfToday } });
  } else if (membership === "valid") {
    parts.push({
      $or: [
        { membershipEndDate: null },
        { membershipEndDate: { $exists: false } },
        { membershipEndDate: { $gte: startOfToday } },
      ],
    });
  } else if (membership === "none") {
    parts.push({
      $and: [
        {
          $or: [
            { membershipStartDate: null },
            { membershipStartDate: { $exists: false } },
          ],
        },
        {
          $or: [
            { membershipEndDate: null },
            { membershipEndDate: { $exists: false } },
          ],
        },
      ],
    });
  }

  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}

function parsePagination(query) {
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.parseInt(String(query.limit ?? "50"), 10) || 50)
  );
  const skip = Math.max(0, Number.parseInt(String(query.skip ?? "0"), 10) || 0);
  return { limit, skip };
}

/**
 * Parse `YYYY-MM-DD` from admin to a stable UTC noon Date.
 * @param {unknown} raw
 * @returns {{ ok: true; date: Date | null } | { ok: false }}
 */
function parseMembershipDay(raw) {
  if (raw === null || raw === undefined) {
    return { ok: true, date: null };
  }
  if (raw === "") {
    return { ok: true, date: null };
  }
  if (typeof raw !== "string") {
    return { ok: false };
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!m) {
    return { ok: false };
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) {
    return { ok: false };
  }
  const date = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  return { ok: true, date };
}

/**
 * @param {unknown} raw
 * @returns {number | null}
 */
function parseOptionalNumber(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number.parseFloat(String(raw));
  if (Number.isNaN(n)) return null;
  return n;
}

/** UTC calendar days from `a` to `b` (date-only; inclusive span for full days). */
function utcCalendarDaysBetween(a, b) {
  const start = new Date(a);
  const end = new Date(b);
  const s = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate()
  );
  const e = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.max(0, Math.round((e - s) / 86400000));
}

/** Add whole calendar days in UTC (matches membership date storage). */
function addUtcCalendarDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Today at UTC noon — consistent with `parseMembershipDay`. */
function utcNoonToday() {
  const t = new Date();
  return new Date(
    Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), 12, 0, 0)
  );
}

/**
 * GET /api/admin/members — list with filters.
 */
export async function listAdminMembers(req, res, next) {
  try {
    const { limit, skip } = parsePagination(req.query);
    const filter = buildMemberListFilter(req.query);
    const [items, total] = await Promise.all([
      Member.find(filter)
        .select("-passwordHash")
        .sort({ isActive: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Member.countDocuments(filter),
    ]);

    return sendSuccess(res, { items, total, limit, skip });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/members/:id — single member + populated trainer.
 */
export async function getAdminMember(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Invalid member id", 400);
    }

    const member = await Member.findById(id)
      .select("-passwordHash")
      .populate("assignedTrainerId", "name role imageUrl imagePath")
      .lean();

    if (!member) {
      return sendError(res, "Member not found", 404);
    }

    return sendSuccess(res, { member });
  } catch (err) {
    next(err);
  }
}

/**
 * Apply optional profile + gym fields from body onto member document (mutates).
 * @param {import("mongoose").Document} member
 * @param {Record<string, unknown>} body
 * @param {{ id: string }} opts
 */
async function applyMemberFieldsFromBody(member, body, opts) {
  const has = (k) => Object.prototype.hasOwnProperty.call(body, k);

  if (has("fullName")) {
    const v = String(body.fullName ?? "").trim();
    if (!v) throw new Error("VALIDATION:Full name cannot be empty");
    member.fullName = v;
  }
  if (has("email")) {
    const v = String(body.email ?? "").trim().toLowerCase();
    if (!v) throw new Error("VALIDATION:Email cannot be empty");
    const exists = await Member.findOne({
      email: v,
      _id: { $ne: opts.id },
    })
      .select("_id")
      .lean();
    if (exists) throw new Error("DUPLICATE_EMAIL");
    member.email = v;
  }
  if (has("phone")) {
    const v = String(body.phone ?? "").trim();
    if (!v) throw new Error("VALIDATION:Phone cannot be empty");
    member.phone = v;
  }
  if (has("gender")) {
    const g = String(body.gender ?? "").toLowerCase();
    member.gender = GENDER_VALUES.includes(g) ? g : "";
  }
  if (has("dateOfBirth")) {
    const p = parseMembershipDay(body.dateOfBirth);
    if (!p.ok) throw new Error("VALIDATION:Invalid date of birth (YYYY-MM-DD)");
    member.dateOfBirth = p.date;
  }
  if (has("address")) {
    member.address = String(body.address ?? "").trim().slice(0, 500);
  }
  if (has("city")) {
    member.city = String(body.city ?? "").trim().slice(0, 120);
  }
  if (has("emergencyContact")) {
    member.emergencyContact = String(body.emergencyContact ?? "").trim().slice(0, 200);
  }
  if (has("planInterest")) {
    const p = String(body.planInterest ?? "unknown").toLowerCase();
    member.planInterest = PLAN_VALUES.includes(p) ? p : "unknown";
  }
  if (has("membershipStartDate")) {
    const p = parseMembershipDay(body.membershipStartDate);
    if (!p.ok) throw new Error("VALIDATION:Invalid membership start (YYYY-MM-DD)");
    member.membershipStartDate = p.date;
  }
  if (has("membershipEndDate")) {
    const p = parseMembershipDay(body.membershipEndDate);
    if (!p.ok) throw new Error("VALIDATION:Invalid membership end (YYYY-MM-DD)");
    member.membershipEndDate = p.date;
  }
  if (has("membershipFrozen")) {
    member.membershipFrozen = Boolean(body.membershipFrozen);
  }
  if (has("membershipFreezeStartedAt")) {
    const p = parseMembershipDay(body.membershipFreezeStartedAt);
    if (!p.ok) throw new Error("VALIDATION:Invalid freeze start (YYYY-MM-DD)");
    member.membershipFreezeStartedAt = p.date;
  }
  if (has("membershipFreezeEndDate")) {
    const p = parseMembershipDay(body.membershipFreezeEndDate);
    if (!p.ok) throw new Error("VALIDATION:Invalid planned resume (YYYY-MM-DD)");
    member.membershipFreezeEndDate = p.date;
  }
  if (has("assignedTrainerId")) {
    const tid = body.assignedTrainerId;
    if (tid === null || tid === "") {
      member.assignedTrainerId = null;
    } else if (mongoose.Types.ObjectId.isValid(String(tid))) {
      const tr = await Trainer.findById(tid).select("_id").lean();
      if (!tr) throw new Error("VALIDATION:Trainer not found");
      member.assignedTrainerId = tid;
    } else {
      throw new Error("VALIDATION:Invalid trainer id");
    }
  }
  if (has("heightCm")) {
    const n = parseOptionalNumber(body.heightCm);
    member.heightCm = n;
  }
  if (has("weightKg")) {
    const n = parseOptionalNumber(body.weightKg);
    member.weightKg = n;
  }
  if (has("fitnessGoal")) {
    member.fitnessGoal = String(body.fitnessGoal ?? "").trim().slice(0, 500);
  }
  if (has("isActive")) {
    member.isActive = Boolean(body.isActive);
  }
  if (has("adminNotes")) {
    const raw = body.adminNotes == null ? "" : String(body.adminNotes);
    member.adminNotes = raw.trim().slice(0, ADMIN_NOTES_MAX);
  }
}

/**
 * POST /api/admin/members — create member (admin).
 */
export async function createAdminMember(req, res, next) {
  try {
    const body = req.body ?? {};
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const password = body.password;

    if (!fullName || !email || !phone) {
      return sendError(res, "fullName, email, and phone are required", 422);
    }
    if (!password || String(password).length < 8) {
      return sendError(
        res,
        "password is required (min 8 characters)",
        422
      );
    }

    const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);

    const member = new Member({
      fullName,
      email,
      phone,
      passwordHash,
    });
    await applyMemberFieldsFromBody(member, body, {
      id: member._id.toString(),
    });

    if (member.membershipFrozen && !member.membershipFreezeStartedAt) {
      member.membershipFreezeStartedAt = utcNoonToday();
    }

    await member.save();
    const out = await Member.findById(member._id)
      .select("-passwordHash")
      .populate("assignedTrainerId", "name role imageUrl imagePath")
      .lean();

    return sendSuccess(res, { member: out }, 201);
  } catch (err) {
    if (err?.message === "DUPLICATE_EMAIL") {
      return sendError(res, "An account with this email already exists", 409);
    }
    if (typeof err?.message === "string" && err.message.startsWith("VALIDATION:")) {
      return sendError(res, err.message.replace("VALIDATION:", ""), 422);
    }
    const dup = err?.code === 11000 || err?.cause?.code === 11000;
    if (dup) {
      return sendError(res, "An account with this email already exists", 409);
    }
    next(err);
  }
}

/**
 * PATCH/POST /api/admin/members/:id — partial update (profile + gym + notes + optional newPassword).
 */
export async function updateAdminMember(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Invalid member id", 400);
    }

    const body = req.body ?? {};
    const has = (k) => Object.prototype.hasOwnProperty.call(body, k);

    const allowed = [
      "fullName",
      "email",
      "phone",
      "gender",
      "dateOfBirth",
      "address",
      "city",
      "emergencyContact",
      "planInterest",
      "membershipStartDate",
      "membershipEndDate",
      "membershipFrozen",
      "membershipFreezeStartedAt",
      "membershipFreezeEndDate",
      "assignedTrainerId",
      "heightCm",
      "weightKg",
      "fitnessGoal",
      "isActive",
      "adminNotes",
      "newPassword",
    ];
    if (!allowed.some((k) => has(k))) {
      return sendError(
        res,
        "Provide at least one updatable field",
        422
      );
    }

    const member = await Member.findById(id).select("+passwordHash");
    if (!member) {
      return sendError(res, "Member not found", 404);
    }

    const prevFrozen = member.membershipFrozen === true;
    const prevFreezeStart = member.membershipFreezeStartedAt;

    try {
      await applyMemberFieldsFromBody(member, body, { id });
    } catch (e) {
      if (e?.message === "DUPLICATE_EMAIL") {
        return sendError(res, "An account with this email already exists", 409);
      }
      if (typeof e?.message === "string" && e.message.startsWith("VALIDATION:")) {
        return sendError(res, e.message.replace("VALIDATION:", ""), 422);
      }
      throw e;
    }

    if (has("membershipFrozen")) {
      if (body.membershipFrozen === true && !prevFrozen) {
        if (!member.membershipFreezeStartedAt) {
          member.membershipFreezeStartedAt = utcNoonToday();
        }
      }
      if (body.membershipFrozen === false && prevFrozen) {
        if (prevFreezeStart && member.membershipEndDate) {
          const days = utcCalendarDaysBetween(prevFreezeStart, new Date());
          member.membershipEndDate = addUtcCalendarDays(
            member.membershipEndDate,
            days
          );
        }
        member.membershipFreezeStartedAt = null;
        member.membershipFreezeEndDate = null;
      }
    }

    if (has("newPassword")) {
      const np = String(body.newPassword ?? "");
      if (np.length < 8) {
        return sendError(res, "New password must be at least 8 characters", 422);
      }
      member.passwordHash = await bcrypt.hash(np, SALT_ROUNDS);
    }

    const start = member.membershipStartDate;
    const end = member.membershipEndDate;
    if (start && end && end < start) {
      return sendError(
        res,
        "Membership end date must be on or after the start date",
        422
      );
    }

    await member.save();
    const out = await Member.findById(member._id)
      .select("-passwordHash")
      .populate("assignedTrainerId", "name role imageUrl imagePath")
      .lean();

    return sendSuccess(res, { member: out });
  } catch (err) {
    const dup = err?.code === 11000 || err?.cause?.code === 11000;
    if (dup) {
      return sendError(res, "An account with this email already exists", 409);
    }
    next(err);
  }
}

/**
 * DELETE /api/admin/members/:id
 */
export async function deleteAdminMember(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Invalid member id", 400);
    }

    const member = await Member.findByIdAndDelete(id).lean();
    if (!member) {
      return sendError(res, "Member not found", 404);
    }

    return sendSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}
