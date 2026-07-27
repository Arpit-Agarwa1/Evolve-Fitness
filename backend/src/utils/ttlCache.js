/**
 * Tiny in-process TTL map cache (single Node instance).
 * @template T
 * @param {number} ttlMs
 */
export function createTtlCache(ttlMs) {
  /** @type {Map<string, { at: number; value: T }>} */
  const map = new Map();

  return {
    /**
     * @param {string} [key]
     * @returns {T | null}
     */
    get(key = "default") {
      const entry = map.get(key);
      if (!entry) return null;
      if (Date.now() - entry.at > ttlMs) {
        map.delete(key);
        return null;
      }
      return entry.value;
    },
    /**
     * @param {string} key
     * @param {T} [value]
     */
    set(key, value) {
      // Support set(value) single-arg form
      if (arguments.length === 1) {
        map.set("default", { at: Date.now(), value: /** @type {T} */ (key) });
        return;
      }
      map.set(key, { at: Date.now(), value: /** @type {T} */ (value) });
    },
    clear() {
      map.clear();
    },
  };
}
