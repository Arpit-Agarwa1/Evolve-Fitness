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
 * Registered members table (no passwords shown).
 */
export default function AdminMembers() {
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
        const res = await request(
          `/api/admin/members?${adminListQuery(page)}`
        );
        if (!cancelled) {
          setItems(res.data?.items ?? []);
          setTotal(res.data?.total ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error ? err.message : "Could not load members."
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
    <AdminLayout title="Members">
      <SEO
        title="Members"
        description="Evolve Fitness admin — members list."
        path="/admin/members"
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
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Plan</th>
              <th>City</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row._id}>
                <td>{row.fullName}</td>
                <td>{row.email}</td>
                <td>{row.phone}</td>
                <td>{row.planInterest}</td>
                <td>{row.city || "—"}</td>
                <td>{formatWhen(row.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 ? (
          <p className="admin-empty">No members yet.</p>
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
