import mongoose from "mongoose";
import { sendSuccess } from "../views/jsonResponse.js";

/**
 * GET /api/health — liveness + MongoDB ping.
 */
export async function getHealth(req, res, next) {
  try {
    const dbOk = mongoose.connection.readyState === 1;
    return sendSuccess(res, {
      status: "ok",
      database: dbOk ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
