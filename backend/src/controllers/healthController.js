import mongoose from "mongoose";
import { sendSuccess } from "../views/jsonResponse.js";

/**
 * GET /api/health — liveness + MongoDB + collection names (helps verify Atlas vs app).
 */
export async function getHealth(req, res, next) {
  try {
    const dbOk = mongoose.connection.readyState === 1;
    let mongoDatabase = null;
    /** @type {string[]} */
    let collections = [];

    if (dbOk && mongoose.connection.db) {
      mongoDatabase = mongoose.connection.name;
      const cols = await mongoose.connection.db.listCollections().toArray();
      collections = cols.map((c) => c.name).sort();
    }

    return sendSuccess(res, {
      status: "ok",
      database: dbOk ? "connected" : "disconnected",
      mongoDatabase,
      collections,
      expectedCollections: [
        "admins",
        "members",
        "contactmessages",
        "membershipleads",
      ],
      hint:
        "Atlas: database evolve_fitness_data. Admins collection stores owner login (email + passwordHash). Members/contacts/leads are site submissions.",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
