import rateLimit from "express-rate-limit";

/**
 * Limit abusive POSTs to public write endpoints (per IP, behind trust proxy).
 */
export const apiWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Try again later." },
});

/**
 * Stricter limit for admin login (credential stuffing).
 */
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many sign-in attempts. Try again in a few minutes.",
  },
});
