/**
 * Tiny in-process TTL cache (single Node instance).
 * @template T
 * @param {number} ttlMs
 */
export function createTtlCache(ttlMs) {
  /** @type {{ at: number; value: T } | null} */
  let entry = null;

  return {
    /**
     * @returns {T | null}
     */
    get() {
      if (!entry) return null;
      if (Date.now() - entry.at > ttlMs) {
        entry = null;
        return null;
      }
      return entry.value;
    },
    /**
     * @param {T} value
     */
    set(value) {
      entry = { at: Date.now(), value };
    },
    clear() {
      entry = null;
    },
  };
}
