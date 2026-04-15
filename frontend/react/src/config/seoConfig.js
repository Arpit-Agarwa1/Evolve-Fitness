/**
 * SEO / canonical URL helpers. Set `VITE_SITE_URL` in production (https://your-domain.com, no trailing slash).
 */
const FALLBACK_SITE_URL = "https://evolvestudio.fitness";

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
  return FALLBACK_SITE_URL;
}

/** Brand line used in titles */
export const SITE_NAME = "Evolve Fitness";
