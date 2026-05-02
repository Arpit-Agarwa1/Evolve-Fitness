/**
 * Official Evolve brand assets (served from `public/brand/`).
 * Nav/footer PNGs are generated (`npm run build:brand`): trimmed, transparent
 * plate, theme-ready on `--ev-bg`. Nav uses main “EVOLVE” wordmark only.
 */

/** Main wordmark — transparent, wide format (see `scripts/build-theme-logo.mjs`) */
export const EVOLVE_LOGO_NAV_SRC = "/brand/evolve-logo-nav.png";

/** Full lockup + tagline — footer / marketing */
export const EVOLVE_LOGO_FOOTER_SRC = "/brand/evolve-logo-footer.png";

/** @type {string} */
export const EVOLVE_LOGO_ALT = "Evolve Fitness — The Luxury Fitness";

/** Default Open Graph / Twitter preview when `VITE_OG_IMAGE_URL` is unset */
export const EVOLVE_LOGO_OG_PATH = "/brand/evolve-logo-og.png";
