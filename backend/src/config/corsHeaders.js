/**
 * Extra origins always allowed (e.g. apex + www). Set on Render:
 * `CORS_PINNED_ORIGINS=https://example.com,https://www.example.com`
 * Comma-separated, no spaces required (trimmed per entry).
 */
function loadPinnedOrigins() {
  const raw = process.env.CORS_PINNED_ORIGINS?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().replace(/\/+$/, ""))
      .filter(Boolean)
  );
}

export const CORS_PINNED_ORIGINS = loadPinnedOrigins();

/**
 * @param {string | undefined} origin
 */
export function isPinnedCorsOrigin(origin) {
  return Boolean(origin && CORS_PINNED_ORIGINS.has(origin));
}

/**
 * Ensures API error JSON responses still include CORS headers (otherwise the browser only shows a CORS error).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export function applyPinnedCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (!origin || !isPinnedCorsOrigin(origin)) return;
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
}
