import mongoose from "mongoose";
import MembershipLead, { PLAN_VALUES } from "../models/MembershipLead.js";
import { sendSuccess, sendError } from "../views/jsonResponse.js";

/**
 * POST /api/membership/leads — capture membership interest.
 */
export async function createMembershipLead(req, res, next) {
  try {
    const { name, email, phone, plan, notes } = req.body ?? {};

    if (!email) {
      return sendError(res, "Email is required", 422);
    }

    const rawPlan = plan ? String(plan).toLowerCase() : "unknown";
    const safePlan = PLAN_VALUES.includes(rawPlan) ? rawPlan : "unknown";

    const doc = await MembershipLead.create({
      name: name ? String(name) : undefined,
      email: String(email),
      phone: phone ? String(phone) : undefined,
      plan: safePlan,
      notes: notes ? String(notes) : undefined,
    });

    console.log(
      `[mongo] membershipleads inserted ${doc._id} db=${mongoose.connection.name}`
    );

    return sendSuccess(
      res,
      {
        id: doc._id,
        createdAt: doc.createdAt,
      },
      201
    );
  } catch (err) {
    next(err);
  }
}
