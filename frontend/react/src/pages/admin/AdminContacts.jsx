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
 * Contact form submissions.
 */
export default function AdminContacts() {
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
          `/api/admin/contacts?${adminListQuery(page)}`
        );
        if (!cancelled) {
          setItems(res.data?.items ?? []);
          setTotal(res.data?.total ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error ? err.message : "Could not load messages."
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
    <AdminLayout title="Contact messages">
      <SEO
        title="Contact messages"
        description="Evolve Fitness admin — contact form messages."
        path="/admin/contacts"
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
      <div className="admin-table-wrap admin-table-wrap--wide">
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row._id}>
                <td className="admin-table__nowrap">{formatWhen(row.createdAt)}</td>
                <td>{row.name}</td>
                <td>{row.email}</td>
                <td className="admin-table__nowrap">{row.phone || "—"}</td>
                <td className="admin-table__message">{row.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 ? (
          <p className="admin-empty">No messages yet.</p>
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
