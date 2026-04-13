import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { adminApiFetch } from "../services/adminApi";
import { useAdminAuth } from "./useAdminAuth";

/**
 * Wraps {@link adminApiFetch} with token and redirects to login on 401.
 */
export function useAdminApi() {
  const { token, clearToken } = useAdminAuth();
  const navigate = useNavigate();

  const request = useCallback(
    async (path, options = {}) => {
      if (!token) {
        navigate("/admin/login", { replace: true });
        throw new Error("Not signed in");
      }
      try {
        return await adminApiFetch(path, token, options);
      } catch (err) {
        if (err.status === 401) {
          clearToken();
          navigate("/admin/login", { replace: true });
        }
        throw err;
      }
    },
    [token, clearToken, navigate]
  );

  return { request };
}
