/**
 * Direct Render URL — only used when building with `VITE_API_URL` (bypasses Vercel proxy).
 * Default production builds use relative `/api` (see `vercel.json` rewrite) → same origin = no CORS.
 */
export const DEFAULT_PRODUCTION_API_ORIGIN =
  "https://evolve-fitness-backend.onrender.com";

/**
 * Public API — same origin in production so `vercel.json` can proxy `/api` without CORS.
 * @returns {string}
 */
export function getApiBase() {
  const fromEnv = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (import.meta.env.PROD) return "";
  return "";
}

/**
 * Owner admin API — always calls the Render host in production (not the Vercel `/api` rewrite).
 * Vercel rewrites often return **502** on multipart POST (trainer photo uploads), so we bypass them.
 * Requires **`CORS_ORIGIN`** on Render to include your frontend origin (e.g. `https://your-app.vercel.app`).
 * @returns {string}
 */
export function getAdminApiBase() {
  const fromEnv = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (import.meta.env.PROD) return DEFAULT_PRODUCTION_API_ORIGIN;
  return "";
}
