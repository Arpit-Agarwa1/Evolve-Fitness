/**
 * SEO / canonical URL helpers.
 * Optional `VITE_SITE_URL` forces one canonical host; otherwise the browser uses `window.location.origin`
 * (works for `*.vercel.app` until a custom domain has DNS).
 */

/**
 * Public canonical origin for meta tags, OG URLs, and JSON-LD.
 * @returns {string}
 */
export function getSiteUrl() {
  const raw = import.meta.env.VITE_SITE_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, "").replace(/^["']|["']$/g, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://localhost:5173";
}

/** Brand line used in titles */
export const SITE_NAME = "Evolve Fitness";
