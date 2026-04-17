import Member from "../models/Member.js";
import ContactMessage from "../models/ContactMessage.js";
import MembershipLead from "../models/MembershipLead.js";
import Trainer from "../models/Trainer.js";
import { sendSuccess } from "../views/jsonResponse.js";

/** Legacy members without `isActive` are treated as active everywhere. */
const activeMemberFilter = {
  $or: [{ isActive: true }, { isActive: { $exists: false } }],
};

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
 * GET /api/admin/contacts — contact form messages.
 */
export async function listAdminContacts(req, res, next) {
  try {
    const MAX_LIMIT = 100;
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number.parseInt(String(req.query.limit ?? "50"), 10) || 50)
    );
    const skip = Math.max(0, Number.parseInt(String(req.query.skip ?? "0"), 10) || 0);
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
    const MAX_LIMIT = 100;
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number.parseInt(String(req.query.limit ?? "50"), 10) || 50)
    );
    const skip = Math.max(0, Number.parseInt(String(req.query.skip ?? "0"), 10) || 0);
    const [items, total] = await Promise.all([
      MembershipLead.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      MembershipLead.countDocuments(),
    ]);

    return sendSuccess(res, { items, total, limit, skip });
  } catch (err) {
    next(err);
  }
}
