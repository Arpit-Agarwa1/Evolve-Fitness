import { toWhatsAppRecipientDigits } from "../utils/phoneDigits.js";

/**
 * Sends a Meta WhatsApp Cloud API **template** message from Evolve’s business line
 * to the member’s phone after registration.
 *
 * Requires an approved template in Meta Business Manager (e.g. body: "Hi {{1}}, thank you for registering with Evolve Fitness!").
 * Business-initiated messages must use templates; set env vars on Render.
 *
 * @param {{ phone: string; fullName: string }} opts
 * @returns {Promise<{ sent: boolean; reason?: string }>}
 */
export async function sendRegistrationThankYou({ phone, fullName }) {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const templateName = process.env.WHATSAPP_REGISTRATION_TEMPLATE_NAME?.trim();

  if (!token || !phoneNumberId || !templateName) {
    return { sent: false, reason: "not_configured" };
  }

  const to = toWhatsAppRecipientDigits(phone);
  if (to.length < 10 || to.length > 15) {
    console.warn("[whatsapp] skip thank-you: invalid phone length", to.length);
    return { sent: false, reason: "invalid_phone" };
  }

  const lang =
    process.env.WHATSAPP_REGISTRATION_TEMPLATE_LANG?.trim() || "en";
  const graphVersion =
    process.env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v21.0";
  const bodyParams = Number.parseInt(
    process.env.WHATSAPP_REGISTRATION_TEMPLATE_BODY_PARAMS ?? "1",
    10
  );

  /** @type {Record<string, unknown>} */
  const template = {
    name: templateName,
    language: { code: lang },
  };

  if (bodyParams > 0) {
    template.components = [
      {
        type: "body",
        parameters: [
          {
            type: "text",
            text: String(fullName ?? "Member").slice(0, 1024),
          },
        ],
      },
    ];
  }

  const url = `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;

  const body = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template,
  });

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
      signal: controller.signal,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error(
        "[whatsapp] registration thank-you failed",
        res.status,
        JSON.stringify(json).slice(0, 500)
      );
      return { sent: false, reason: "api_error" };
    }

    console.log("[whatsapp] registration thank-you sent to", to);
    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[whatsapp] registration thank-you error:", msg);
    return { sent: false, reason: "network" };
  } finally {
    clearTimeout(t);
  }
}
