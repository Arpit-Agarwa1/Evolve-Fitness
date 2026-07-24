import crypto from "crypto";
import Razorpay from "razorpay";

/**
 * @returns {boolean}
 */
export function isRazorpayConfigured() {
  return Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() &&
      process.env.RAZORPAY_KEY_SECRET?.trim()
  );
}

/**
 * @returns {import("razorpay") | null}
 */
export function getRazorpayClient() {
  if (!isRazorpayConfigured()) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID.trim(),
    key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
  });
}

/**
 * @param {string} orderId
 * @param {string} paymentId
 * @param {string} signature
 */
export function verifyRazorpayPaymentSignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expected === signature;
}

/**
 * Create a Razorpay order (amount in paise).
 * @param {{ amountInr: number; receipt: string; notes?: Record<string, string> }} opts
 */
export async function createRazorpayOrder({ amountInr, receipt, notes = {} }) {
  const client = getRazorpayClient();
  if (!client) {
    throw new Error("Razorpay is not configured");
  }
  const amountPaise = Math.round(amountInr * 100);
  return client.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: receipt.slice(0, 40),
    notes,
  });
}
