/**
 * Direct Render URL — only used when building with `VITE_API_URL` (bypasses Vercel proxy).
 * Default production builds use relative `/api` (see `vercel.json` rewrite) → same origin = no CORS.
 */
export const DEFAULT_PRODUCTION_API_ORIGIN =
  "https://evolve-fitness-backend.onrender.com";

/**
 * @returns {string} Empty string → fetch(`/api/...`) stays on the site origin (Vercel proxies to Render).
 * Set `VITE_API_URL` on Vercel only if you must call the API host directly (then fix CORS on Render).
 */
export function getApiBase() {
  const fromEnv = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  // Production: same-origin /api — requires vercel.json rewrite to the Render API.
  if (import.meta.env.PROD) return "";
  return "";
}
