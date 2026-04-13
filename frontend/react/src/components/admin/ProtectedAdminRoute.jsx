import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../hooks/useAdminAuth";

/**
 * Redirects to /admin/login if there is no admin JWT.
 */
export default function ProtectedAdminRoute({ children }) {
  const { isAuthenticated } = useAdminAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
    );
  }

  return children;
}
