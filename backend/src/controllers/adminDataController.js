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
