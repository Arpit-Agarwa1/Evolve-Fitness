import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminPagination from "../../components/admin/AdminPagination";
import SEO from "../../components/SEO";
import { useAdminApi } from "../../hooks/useAdminApi";
import { adminListQuery, adminPageCount } from "../../utils/adminPagination";

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
  const [page, setPage] = useState(1);

  const pageCount = useMemo(() => adminPageCount(total), [total]);

  useEffect(() => {
    if (total > 0 && pageCount > 0 && page > pageCount) {
      setPage(pageCount);
    }
  }, [total, pageCount, page]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const res = await request(`/api/admin/leads?${adminListQuery(page)}`);
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
  }, [request, page]);

  return (
    <AdminLayout title="Membership leads">
      <SEO
        title="Membership leads"
        description="Evolve Fitness admin — membership leads."
        path="/admin/leads"
        noIndex
      />
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
      <AdminPagination
        page={page}
        total={total}
        loading={loading}
        onPageChange={setPage}
      />
    </AdminLayout>
  );
}
