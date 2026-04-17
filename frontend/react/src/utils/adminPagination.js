/** Page size for admin list APIs (must stay ≤ backend MAX_LIMIT 100). */
export const ADMIN_PAGE_SIZE = 25;

/**
 * Query string for GET /api/admin/{members|contacts|leads}
 * @param {number} page — 1-based
 * @param {{ q?: string; status?: string; membership?: string }} [filters] — members list only
 */
export function adminListQuery(page, filters = {}) {
  const p = Math.max(1, Math.floor(page));
  const skip = (p - 1) * ADMIN_PAGE_SIZE;
  const params = new URLSearchParams();
  params.set("limit", String(ADMIN_PAGE_SIZE));
  params.set("skip", String(skip));
  const q = typeof filters.q === "string" ? filters.q.trim() : "";
  if (q) params.set("q", q);
  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }
  if (filters.membership && filters.membership !== "all") {
    params.set("membership", filters.membership);
  }
  return params.toString();
}

/**
 * Total pages for a record count.
 * @param {number} total
 */
export function adminPageCount(total) {
  if (total <= 0) return 0;
  return Math.ceil(total / ADMIN_PAGE_SIZE);
}
