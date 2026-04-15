/** Page size for admin list APIs (must stay ≤ backend MAX_LIMIT 100). */
export const ADMIN_PAGE_SIZE = 25;

/**
 * Query string for GET /api/admin/{members|contacts|leads}
 * @param {number} page — 1-based
 */
export function adminListQuery(page) {
  const p = Math.max(1, Math.floor(page));
  const skip = (p - 1) * ADMIN_PAGE_SIZE;
  return `limit=${ADMIN_PAGE_SIZE}&skip=${skip}`;
}

/**
 * Total pages for a record count.
 * @param {number} total
 */
export function adminPageCount(total) {
  if (total <= 0) return 0;
  return Math.ceil(total / ADMIN_PAGE_SIZE);
}
