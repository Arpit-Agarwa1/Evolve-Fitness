import { useCallback, useState, useEffect } from "react";

const STORAGE_KEY = "evolve_admin_jwt";

/**
 * Gym owner admin session — JWT stored in sessionStorage (tab-scoped).
 */
export function useAdminAuth() {
  const [token, setTokenState] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) ?? ""
  );

  useEffect(() => {
    const sync = () =>
      setTokenState(sessionStorage.getItem(STORAGE_KEY) ?? "");
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const setToken = useCallback((value) => {
    if (value) {
      sessionStorage.setItem(STORAGE_KEY, value);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    setTokenState(value ?? "");
  }, []);

  const clearToken = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setTokenState("");
  }, []);

  return {
    token,
    setToken,
    clearToken,
    isAuthenticated: Boolean(token?.length),
  };
}
