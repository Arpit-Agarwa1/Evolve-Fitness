import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAdminApi } from "../../hooks/useAdminApi";

/**
 * High-level counts for the gym owner.
 */
export default function AdminDashboard() {
  const { request } = useAdminApi();
  const [data, setData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const res = await request("/api/admin/dashboard");
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error ? err.message : "Could not load dashboard."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [request]);

  const c = data?.counts;

  return (
    <AdminLayout title="Overview">
      {errorMessage ? (
        <p className="admin-banner admin-banner--error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {loading ? (
        <p className="admin-muted">Loading…</p>
      ) : (
        <>
        <p className="admin-atlas-hint">
          Data comes from MongoDB database <strong>evolve_fitness_data</strong> — collections{" "}
          <code>members</code>, <code>contactmessages</code>, <code>membershipleads</code>.
          Owner sign-in is <strong>not</strong> stored in MongoDB (it uses env + JWT only).
        </p>
        <div className="admin-stats">
          <Link to="/admin/members" className="admin-stat-card">
            <span className="admin-stat-card__value">{c?.members ?? "—"}</span>
            <span className="admin-stat-card__label">Members</span>
          </Link>
          <Link to="/admin/contacts" className="admin-stat-card">
            <span className="admin-stat-card__value">{c?.contacts ?? "—"}</span>
            <span className="admin-stat-card__label">Contact messages</span>
          </Link>
          <Link to="/admin/leads" className="admin-stat-card">
            <span className="admin-stat-card__value">{c?.leads ?? "—"}</span>
            <span className="admin-stat-card__label">Membership leads</span>
          </Link>
        </div>
        </>
      )}

      {data?.generatedAt ? (
        <p className="admin-muted admin-stats__meta">
          Updated {new Date(data.generatedAt).toLocaleString()}
        </p>
      ) : null}
    </AdminLayout>
  );
}
