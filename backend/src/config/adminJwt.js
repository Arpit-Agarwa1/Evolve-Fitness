/**
 * Single place to read the JWT signing secret for owner admin routes.
 *
 * **Render / some hosts:** `$` in environment values can be interpreted or stripped.
 * If admin login returns a token but the dashboard says "Invalid session", set a secret
 * with only letters, numbers, and `-` / `_` (e.g. `openssl rand -hex 32`).
 */

/**
 * @returns {string}
 */
export function getAdminJwtSecret() {
  const raw = process.env.ADMIN_JWT_SECRET;
  if (raw === undefined || raw === null) return "";
  return String(raw).trim();
}
