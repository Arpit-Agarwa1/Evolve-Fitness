/**
 * WhatsApp click-to-chat — digits only, country code without + (e.g. 919024301606).
 * Override with VITE_WHATSAPP_NUMBER in Vercel.
 */
const DEFAULT_WHATSAPP_E164_DIGITS = "919024301606";

/**
 * @returns {string}
 */
export function getWhatsAppDigits() {
  const raw = import.meta.env.VITE_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";
  return raw.length >= 10 ? raw : DEFAULT_WHATSAPP_E164_DIGITS;
}

/** WhatsApp prefilled text limit is ~2000 chars; stay under for reliability. */
const MAX_PREFILL = 1800;

/**
 * @param {string} text
 * @returns {string}
 */
export function buildWhatsAppChatUrl(text) {
  const digits = getWhatsAppDigits();
  const safe =
    text.length > MAX_PREFILL ? `${text.slice(0, MAX_PREFILL)}…` : text;
  const params = new URLSearchParams();
  params.set("text", safe);
  return `https://wa.me/${digits}?${params.toString()}`;
}
