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
      expectedCollections: ["members", "contactmessages", "membershipleads"],
      hint:
        "Atlas: open this database name → those collections. Signups/contact go there; owner admin login is not stored in MongoDB.",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
