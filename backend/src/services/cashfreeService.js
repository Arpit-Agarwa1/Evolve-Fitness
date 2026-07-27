import { Cashfree, CFEnvironment } from "cashfree-pg";

/**
 * @returns {boolean}
 */
/** App ID / Client ID from Cashfree dashboard. */
function getCashfreeAppId() {
  return (
    process.env.CASHFREE_APP_ID?.trim() ||
    process.env.CASHFREE_CLIENT_ID?.trim() ||
    ""
  );
}

export function isCashfreeConfigured() {
  return Boolean(getCashfreeAppId() && process.env.CASHFREE_SECRET_KEY?.trim());
}

/**
 * @returns {"sandbox" | "production"}
 */
export function getCashfreeMode() {
  const raw = String(process.env.CASHFREE_ENV ?? "sandbox")
    .trim()
    .toLowerCase();
  return raw === "production" || raw === "prod" || raw === "live"
    ? "production"
    : "sandbox";
}

/**
 * @returns {InstanceType<typeof Cashfree>}
 */
function getCashfreeClient() {
  if (!isCashfreeConfigured()) {
    throw new Error("Cashfree is not configured");
  }
  const env =
    getCashfreeMode() === "production"
      ? CFEnvironment.PRODUCTION
      : CFEnvironment.SANDBOX;
  return new Cashfree(
    env,
    getCashfreeAppId(),
    process.env.CASHFREE_SECRET_KEY.trim()
  );
}

/**
 * Public site origin for Cashfree return_url.
 */
export function getPaymentReturnOrigin() {
  const fromPublic = process.env.PUBLIC_SITE_ORIGIN?.trim();
  if (fromPublic) return fromPublic.replace(/\/$/, "");
  const cors = process.env.CORS_ORIGIN?.split(",")[0]?.trim();
  if (cors) return cors.replace(/\/$/, "");
  return "http://localhost:5175";
}

/**
 * Create a Cashfree PG order; returns payment_session_id for JS checkout.
 * @param {{
 *   amountInr: number;
 *   orderId: string;
 *   customerId: string;
 *   customerPhone: string;
 *   customerName?: string;
 *   customerEmail?: string;
 *   returnUrl: string;
 *   orderNote?: string;
 * }} opts
 */
export async function createCashfreeOrder({
  amountInr,
  orderId,
  customerId,
  customerPhone,
  customerName = "",
  customerEmail = "",
  returnUrl,
  orderNote = "",
}) {
  const cashfree = getCashfreeClient();
  const digits = String(customerPhone).replace(/\D/g, "");
  const phone10 =
    digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith("0")
        ? digits.slice(1)
        : digits;

  const request = {
    order_id: orderId,
    order_amount: Number(amountInr),
    order_currency: "INR",
    customer_details: {
      customer_id: String(customerId).slice(0, 50),
      customer_phone: phone10,
      ...(customerName ? { customer_name: customerName.slice(0, 100) } : {}),
      ...(customerEmail
        ? { customer_email: customerEmail.slice(0, 100) }
        : {
            customer_email: `guest.${phone10 || "user"}@evolvestudio.fitness`,
          }),
    },
    order_meta: {
      return_url: returnUrl,
    },
    ...(orderNote ? { order_note: orderNote.slice(0, 200) } : {}),
  };

  const response = await cashfree.PGCreateOrder(request);
  return response.data;
}

/**
 * Fetch order from Cashfree and check if paid.
 * @param {string} orderId
 */
export async function fetchCashfreeOrder(orderId) {
  const cashfree = getCashfreeClient();
  const response = await cashfree.PGFetchOrder(orderId);
  return response.data;
}

/**
 * @param {unknown} order
 * @returns {boolean}
 */
export function isCashfreeOrderPaid(order) {
  const status = String(order?.order_status ?? "").toUpperCase();
  return status === "PAID" || status === "SUCCESS";
}
