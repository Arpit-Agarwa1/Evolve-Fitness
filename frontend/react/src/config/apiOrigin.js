/**
 * Public Render API base (no trailing slash). Used when `VITE_API_URL` is missing in production.
 * Override with VITE_API_URL in Vercel if the backend URL changes.
 */
export const DEFAULT_PRODUCTION_API_ORIGIN =
  "https://evolve-fitness-backend.onrender.com";

/**
 * @returns {string} Empty in local dev (Vite proxy uses relative `/api`).
 */
export function getApiBase() {
  const fromEnv = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (import.meta.env.PROD) return DEFAULT_PRODUCTION_API_ORIGIN;
  return "";
}
