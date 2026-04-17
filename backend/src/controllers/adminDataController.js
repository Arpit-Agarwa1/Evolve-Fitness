import mongoose from "mongoose";
import Member from "../models/Member.js";
import ContactMessage from "../models/ContactMessage.js";
import MembershipLead from "../models/MembershipLead.js";
import Trainer from "../models/Trainer.js";
import { sendSuccess, sendError } from "../views/jsonResponse.js";

/** Legacy members without `isActive` are treated as active everywhere. */
const activeMemberFilter = {
  $or: [{ isActive: true }, { isActive: { $exists: false } }],
};

const MAX_LIMIT = 100;

function parsePagination(query) {
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.parseInt(String(query.limit ?? "50"), 10) || 50)
  );
  const skip = Math.max(0, Number.parseInt(String(query.skip ?? "0"), 10) || 0);
  return { limit, skip };
}

/**
 * GET /api/admin/dashboard — aggregate counts.
 */
export async function getAdminDashboard(req, res, next) {
  try {
    const [members, membersActive, contacts, leads, trainers] = await Promise.all([
      Member.countDocuments(),
      Member.countDocuments(activeMemberFilter),
      ContactMessage.countDocuments(),
      MembershipLead.countDocuments(),
      Trainer.countDocuments(),
    ]);

    return sendSuccess(res, {
      counts: { members, membersActive, contacts, leads, trainers },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/members — registered members (no password fields).
 */
export async function listAdminMembers(req, res, next) {
  try {
    const { limit, skip } = parsePagination(req.query);
    const [items, total] = await Promise.all([
      Member.find()
        .select("-passwordHash")
        .sort({ isActive: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Member.countDocuments(),
    ]);

    return sendSuccess(res, { items, total, limit, skip });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/members/:id — set `isActive` (admin only).
 * POST /api/admin/members/:id/active — same body `{ isActive }` (preferred from admin UI).
 */
export async function patchAdminMember(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Invalid member id", 400);
    }
    if (req.body?.isActive === undefined) {
      return sendError(res, "isActive is required", 422);
    }

    const member = await Member.findByIdAndUpdate(
      id,
      { $set: { isActive: Boolean(req.body.isActive) } },
      { new: true, runValidators: true, select: "-passwordHash" }
    ).lean();

    if (!member) {
      return sendError(res, "Member not found", 404);
    }

    return sendSuccess(res, { member });
  } catch (err) {
    next(err);
  }
}

/**
 * Parse `YYYY-MM-DD` from admin to a stable UTC noon Date (avoids timezone drift).
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
 * POST /api/admin/members/:id/membership — set membership start/end (calendar days).
 * Body: `{ membershipStartDate?, membershipEndDate? }` each `YYYY-MM-DD` or `null` to clear.
 * At least one field must be present in the JSON body.
 */
export async function updateAdminMemberMembership(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Invalid member id", 400);
    }

    const body = req.body ?? {};
    const hasStart = Object.prototype.hasOwnProperty.call(body, "membershipStartDate");
    const hasEnd = Object.prototype.hasOwnProperty.call(body, "membershipEndDate");
    if (!hasStart && !hasEnd) {
      return sendError(
        res,
        "Provide membershipStartDate and/or membershipEndDate (YYYY-MM-DD or null)",
        422
      );
    }

    const startParsed = hasStart ? parseMembershipDay(body.membershipStartDate) : null;
    const endParsed = hasEnd ? parseMembershipDay(body.membershipEndDate) : null;
    if (hasStart && startParsed && !startParsed.ok) {
      return sendError(res, "Invalid membershipStartDate (use YYYY-MM-DD)", 422);
    }
    if (hasEnd && endParsed && !endParsed.ok) {
      return sendError(res, "Invalid membershipEndDate (use YYYY-MM-DD)", 422);
    }

    const member = await Member.findById(id).select("-passwordHash");
    if (!member) {
      return sendError(res, "Member not found", 404);
    }

    const nextStart = hasStart ? startParsed.date : member.membershipStartDate;
    const nextEnd = hasEnd ? endParsed.date : member.membershipEndDate;

    if (nextStart && nextEnd && nextEnd < nextStart) {
      return sendError(
        res,
        "Membership end date must be on or after the start date",
        422
      );
    }

    if (hasStart) {
      member.membershipStartDate = startParsed.date;
    }
    if (hasEnd) {
      member.membershipEndDate = endParsed.date;
    }

    await member.save();
    const lean = member.toObject();
    delete lean.passwordHash;
    return sendSuccess(res, { member: lean });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/contacts — contact form messages.
 */
export async function listAdminContacts(req, res, next) {
  try {
    const { limit, skip } = parsePagination(req.query);
    const [items, total] = await Promise.all([
      ContactMessage.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ContactMessage.countDocuments(),
    ]);

    return sendSuccess(res, { items, total, limit, skip });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/leads — membership interest leads.
 */
export async function listAdminLeads(req, res, next) {
  try {
    const { limit, skip } = parsePagination(req.query);
    const [items, total] = await Promise.all([
      MembershipLead.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      MembershipLead.countDocuments(),
    ]);

    return sendSuccess(res, { items, total, limit, skip });
  } catch (err) {
    next(err);
  }
}
