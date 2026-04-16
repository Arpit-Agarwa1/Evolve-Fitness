import { getApiBase } from "../config/apiOrigin.js";

/**
 * Authenticated fetch for owner admin routes.
 * @param {string} path
 * @param {string} token
 * @param {RequestInit} [options]
 */
export async function adminApiFetch(path, token, options = {}) {
  const API_BASE = getApiBase();
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { success: false, message: text || "Invalid response" };
  }
  if (!res.ok) {
    let msg = body?.message || `Request failed (${res.status})`;
    if (body?.errors && typeof body.errors === "object") {
      const first = Object.values(body.errors).find(Boolean);
      if (typeof first === "string") msg = first;
    }
    const err = new Error(msg);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}
