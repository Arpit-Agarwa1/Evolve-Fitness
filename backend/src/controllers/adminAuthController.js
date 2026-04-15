import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getAdminJwtSecret } from "../config/adminJwt.js";
import Admin from "../models/Admin.js";
import { sendSuccess, sendError } from "../views/jsonResponse.js";

const JWT_EXPIRES = process.env.ADMIN_JWT_EXPIRES || "12h";

/**
 * POST /api/admin/login — gym owner sign-in.
 * Prefers credentials stored in MongoDB (`admins` collection); falls back to env if no admin doc matches.
 */
export async function adminLogin(req, res, next) {
  try {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password ?? "");

    const jwtSecret = getAdminJwtSecret();
    if (!jwtSecret) {
      return sendError(
        res,
        "Admin sessions are not configured. Set ADMIN_JWT_SECRET in environment.",
        503
      );
    }

    if (!email || !password) {
      return sendError(res, "Email and password are required", 422);
    }

    const hasEnvFallback =
      Boolean(process.env.ADMIN_EMAIL?.trim()) &&
      Boolean(process.env.ADMIN_PASSWORD_BCRYPT?.trim());
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0 && !hasEnvFallback) {
      return sendError(
        res,
        "No admin account configured. From the backend folder run: npm run admin:create -- owner@example.com \"YourPassword\" (or insert into MongoDB collection admins — see README).",
        503
      );
    }

    let authenticated = false;

    const adminDoc = await Admin.findOne({ email }).select("+passwordHash");
    if (adminDoc?.passwordHash) {
      authenticated = await bcrypt.compare(password, adminDoc.passwordHash);
    }

    if (!authenticated) {
      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const envHash = process.env.ADMIN_PASSWORD_BCRYPT?.trim();
      if (adminEmail && envHash && email === adminEmail) {
        authenticated = await bcrypt.compare(password, envHash);
      }
    }

    if (!authenticated) {
      return sendError(res, "Invalid email or password", 401);
    }

    const token = jwt.sign({ role: "admin", sub: "owner" }, jwtSecret, {
      expiresIn: JWT_EXPIRES,
    });

    return sendSuccess(res, {
      token,
      expiresIn: JWT_EXPIRES,
    });
  } catch (err) {
    next(err);
  }
}
