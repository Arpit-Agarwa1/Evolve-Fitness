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

/** @param {string} s */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build Mongo filter from GET /api/admin/members query params.
 * @param {import('express').Request["query"]} query
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

  if (membership === "expired") {
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

const ADMIN_NOTES_MAX = 2000;

/**
 * PATCH/POST /api/admin/members/:id — set any of: isActive, membership dates, adminNotes.
 * POST aliases: /active, /membership, /manage (same handler).
 */
export async function updateAdminMember(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Invalid member id", 400);
    }

    const body = req.body ?? {};
    const has = (k) => Object.prototype.hasOwnProperty.call(body, k);
    const fields = [
      "isActive",
      "membershipStartDate",
      "membershipEndDate",
      "adminNotes",
    ];
    if (!fields.some((k) => has(k))) {
      return sendError(
        res,
        "Provide at least one of: isActive, membershipStartDate, membershipEndDate, adminNotes",
        422
      );
    }

    const member = await Member.findById(id).select("-passwordHash");
    if (!member) {
      return sendError(res, "Member not found", 404);
    }

    if (has("isActive")) {
      member.isActive = Boolean(body.isActive);
    }

    if (has("membershipStartDate")) {
      const p = parseMembershipDay(body.membershipStartDate);
      if (!p.ok) {
        return sendError(res, "Invalid membershipStartDate (use YYYY-MM-DD)", 422);
      }
      member.membershipStartDate = p.date;
    }
    if (has("membershipEndDate")) {
      const p = parseMembershipDay(body.membershipEndDate);
      if (!p.ok) {
        return sendError(res, "Invalid membershipEndDate (use YYYY-MM-DD)", 422);
      }
      member.membershipEndDate = p.date;
    }

    if (has("adminNotes")) {
      const raw = body.adminNotes == null ? "" : String(body.adminNotes);
      member.adminNotes = raw.trim().slice(0, ADMIN_NOTES_MAX);
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
