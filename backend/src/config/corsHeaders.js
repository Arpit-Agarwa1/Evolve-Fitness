/**
 * Pinned browser origins — always allowed even if CORS_ORIGIN on the server is misconfigured.
 * Keeps https://evolvestudio.fitness admin + forms working in production.
 */
export const CORS_PINNED_ORIGINS = new Set([
  "https://evolvestudio.fitness",
  "https://www.evolvestudio.fitness",
]);

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
