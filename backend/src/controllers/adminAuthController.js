import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendSuccess, sendError } from "../views/jsonResponse.js";

const JWT_EXPIRES = process.env.ADMIN_JWT_EXPIRES || "12h";

/**
 * POST /api/admin/login — gym owner sign-in (credentials from environment).
 */
export async function adminLogin(req, res, next) {
  try {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password ?? "");

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const passwordHash = process.env.ADMIN_PASSWORD_BCRYPT?.trim();
    const jwtSecret = process.env.ADMIN_JWT_SECRET?.trim();

    if (!adminEmail || !passwordHash || !jwtSecret) {
      return sendError(
        res,
        "Admin login is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD_BCRYPT, and ADMIN_JWT_SECRET.",
        503
      );
    }

    if (!email || !password) {
      return sendError(res, "Email and password are required", 422);
    }

    if (email !== adminEmail) {
      return sendError(res, "Invalid email or password", 401);
    }

    const ok = await bcrypt.compare(password, passwordHash);
    if (!ok) {
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
