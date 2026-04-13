import jwt from "jsonwebtoken";
import { sendError } from "../views/jsonResponse.js";

/**
 * Requires `Authorization: Bearer <JWT>` from POST /api/admin/login.
 */
export function requireAdminAuth(req, res, next) {
  const secret = process.env.ADMIN_JWT_SECRET?.trim();
  if (!secret) {
    return sendError(res, "Admin access is not configured on the server", 503);
  }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return sendError(res, "Sign in required", 401);
  }

  const token = header.slice(7).trim();
  if (!token) {
    return sendError(res, "Sign in required", 401);
  }

  try {
    const payload = jwt.verify(token, secret);
    if (payload.role !== "admin") {
      return sendError(res, "Forbidden", 403);
    }
    req.admin = payload;
    next();
  } catch {
    return sendError(res, "Invalid or expired session", 401);
  }
}
