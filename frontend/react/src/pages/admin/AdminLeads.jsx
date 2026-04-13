import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAdminApi } from "../../hooks/useAdminApi";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "—";
  }
}

/**
 * Membership interest leads.
 */
export default function AdminLeads() {
  const { request } = useAdminApi();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const res = await request("/api/admin/leads?limit=100");
        if (!cancelled) {
          setItems(res.data?.items ?? []);
          setTotal(res.data?.total ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error ? err.message : "Could not load leads."
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

  return (
    <AdminLayout title="Membership leads">
      {errorMessage ? (
        <p className="admin-banner admin-banner--error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <p className="admin-muted admin-table-meta">
        {loading ? "Loading…" : `${total} total`}
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Email</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Plan</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row._id}>
                <td className="admin-table__nowrap">{formatWhen(row.createdAt)}</td>
                <td>{row.email}</td>
                <td>{row.name || "—"}</td>
                <td>{row.phone || "—"}</td>
                <td>{row.plan}</td>
                <td className="admin-table__message">{row.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 ? (
          <p className="admin-empty">No leads yet.</p>
        ) : null}
      </div>
    </AdminLayout>
  );
}
