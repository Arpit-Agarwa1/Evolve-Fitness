/**
 * Google AdSense — display ads on the public website (not AdMob; that is apps only).
 * Set VITE_ADSENSE_CLIENT (ca-pub-…) after AdSense approval. Optional VITE_ADSENSE_SLOT
 * for in-page units; Auto ads can still run from the client script alone.
 */

function cleanEnv(value) {
  return typeof value === "string"
    ? value.trim().replace(/^["']|["']$/g, "")
    : "";
}

/**
 * @returns {string} ca-pub-XXXXXXXXXXXXXXXX or empty
 */
const FALLBACK_CLIENT = "ca-pub-5901956905565041";

export function getAdsenseClient() {
  const raw = cleanEnv(import.meta.env.VITE_ADSENSE_CLIENT) || FALLBACK_CLIENT;
  if (/^ca-pub-\d+$/i.test(raw)) return raw;
  if (/^pub-\d+$/i.test(raw)) return `ca-${raw}`;
  return "";
}

/**
 * ads.txt uses pub-… (no ca- prefix).
 * @returns {string}
 */
export function getAdsensePublisherId() {
  const client = getAdsenseClient();
  return client.replace(/^ca-/i, "");
}

/**
 * Display ad unit ID from AdSense → Ads → By ad unit.
 * @returns {string}
 */
export function getAdsenseSlot() {
  const raw = cleanEnv(import.meta.env.VITE_ADSENSE_SLOT);
  return /^\d+$/.test(raw) ? raw : "";
}

export function isAdsenseConfigured() {
  return Boolean(getAdsenseClient());
}
