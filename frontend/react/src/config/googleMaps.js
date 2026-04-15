/**
 * Evolve @ Vivacity Mall — map helpers (Google Maps).
 * Coordinates: mall area, Jagatpura, Jaipur (adjust if you pin Evolve’s exact entrance).
 */

/** Center point for embed / directions (Vivacity Mall, Jaipur). */
export const EVOLVE_MAP_LAT = 26.80237;
export const EVOLVE_MAP_LNG = 75.85702;

/** Full postal address (directions search). */
export const EVOLVE_MAP_ADDRESS =
  "5th floor, Vivacity Mall, C-3, Hare Krishna Marg, Mahal Yojana, Jagatpura, Jaipur, Rajasthan 302017";

/**
 * Opens Google Maps app/web to the venue (no API key).
 * @returns {string}
 */
export function getGoogleMapsOpenUrl() {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    EVOLVE_MAP_ADDRESS
  )}`;
}

/**
 * iframe `src` for embedded Google Map.
 *
 * **Option A (recommended, no billing):** In Google Maps → Share → **Embed a map** → copy the
 * `src` URL only → set `VITE_GOOGLE_MAPS_EMBED_URL` in `.env`.
 *
 * **Option B:** Set `VITE_GOOGLE_MAPS_API_KEY` (Maps Embed API enabled in Google Cloud) for a
 * clean place embed.
 *
 * **Fallback:** Coordinate-based `maps.google.com` embed (may be restricted by Google in some regions).
 * @returns {string}
 */
export function getGoogleMapsEmbedSrc() {
  const custom = import.meta.env.VITE_GOOGLE_MAPS_EMBED_URL?.trim();
  if (custom) {
    return custom;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (apiKey) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(
      apiKey
    )}&q=${encodeURIComponent(EVOLVE_MAP_ADDRESS)}&zoom=16`;
  }

  return `https://maps.google.com/maps?q=${EVOLVE_MAP_LAT},${EVOLVE_MAP_LNG}&z=16&hl=en&output=embed`;
}
