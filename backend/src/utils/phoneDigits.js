/**
 * Normalizes a phone string to digits for WhatsApp Cloud API `to` field (country code, no +).
 * Heuristic for India: 10-digit local numbers get leading 91.
 * @param {string} phone
 * @returns {string}
 */
export function toWhatsAppRecipientDigits(phone) {
  let d = String(phone ?? "").replace(/\D/g, "");
  if (d.length === 10) {
    return `91${d}`;
  }
  if (d.length === 11 && d.startsWith("0")) {
    return `91${d.slice(1)}`;
  }
  if (d.length === 12 && d.startsWith("91")) {
    return d;
  }
  return d;
}
