import Member from "../models/Member.js";
import ContactMessage from "../models/ContactMessage.js";
import MembershipLead from "../models/MembershipLead.js";
import { sendSuccess } from "../views/jsonResponse.js";

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
    const [members, contacts, leads] = await Promise.all([
      Member.countDocuments(),
      ContactMessage.countDocuments(),
      MembershipLead.countDocuments(),
    ]);

    return sendSuccess(res, {
      counts: { members, contacts, leads },
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
        .sort({ createdAt: -1 })
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
