import mongoose from "mongoose";
import { sendSuccess } from "../views/jsonResponse.js";

const verboseHealth =
  process.env.HEALTH_VERBOSE === "1" || process.env.NODE_ENV !== "production";

/**
 * GET /api/health — liveness + DB status. Full collection list only when HEALTH_VERBOSE=1 or non-production.
 */
export async function getHealth(req, res, next) {
  try {
    const dbOk = mongoose.connection.readyState === 1;
    let mongoDatabase = null;
    /** @type {string[]} */
    let collections = [];

    if (verboseHealth && dbOk && mongoose.connection.db) {
      mongoDatabase = mongoose.connection.name;
      const cols = await mongoose.connection.db.listCollections().toArray();
      collections = cols.map((c) => c.name).sort();
    } else if (dbOk && mongoose.connection.db) {
      mongoDatabase = mongoose.connection.name;
    }

    /** @type {Record<string, unknown>} */
    const payload = {
      status: "ok",
      database: dbOk ? "connected" : "disconnected",
      mongoDatabase,
      timestamp: new Date().toISOString(),
    };

    if (verboseHealth) {
      payload.collections = collections;
      payload.expectedCollections = [
        "admins",
        "members",
        "contactmessages",
        "membershipleads",
      ];
      payload.hint =
        "Set HEALTH_VERBOSE=0 in production to hide collection names. Use npm run db:list locally.";
    }

    return sendSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}
