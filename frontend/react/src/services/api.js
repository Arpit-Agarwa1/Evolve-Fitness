import { getApiBase } from "../config/apiOrigin.js";

/**
 * JSON API helper. Dev: relative `/api` → Vite proxy. Prod: same-origin `/api` (Vercel → Render) unless `VITE_API_URL` is set.
 * @param {string} path
 * @param {RequestInit} [options]
 */
export async function apiFetch(path, options = {}) {
  const API_BASE = getApiBase();
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
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
