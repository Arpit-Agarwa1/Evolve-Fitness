import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  const [toggleBusyId, setToggleBusyId] = useState(null);

  const pageCount = useMemo(() => adminPageCount(total), [total]);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await request(`/api/admin/members?${adminListQuery(page)}`);
      setItems(res.data?.items ?? []);
      setTotal(res.data?.total ?? 0);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not load members."
      );
    } finally {
      setLoading(false);
    }
  }, [request, page]);

  useEffect(() => {
    if (total > 0 && pageCount > 0 && page > pageCount) {
      setPage(pageCount);
    }
  }, [total, pageCount, page]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  /**
   * @param {{ _id: string; isActive?: boolean }} row
   */
  async function handleToggleActive(row) {
    const currentlyActive = row.isActive !== false;
    setErrorMessage("");
    setToggleBusyId(row._id);
    try {
      await request(`/api/admin/members/${row._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentlyActive }),
      });
      await loadMembers();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not update member status."
      );
    } finally {
      setToggleBusyId(null);
    }
  }

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
        {loading ? "Loading…" : `${total} registered`}
      </p>
      <p className="admin-muted admin-members-hint">
        Use <strong>Active</strong> to mark churned or suspended accounts (they remain visible here).
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Plan</th>
              <th>City</th>
              <th>Joined</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const active = row.isActive !== false;
              return (
                <tr
                  key={row._id}
                  className={active ? undefined : "admin-table-row--inactive"}
                >
                  <td>
                    <span
                      className={
                        active
                          ? "admin-trainers-pill admin-trainers-pill--active"
                          : "admin-trainers-pill admin-trainers-pill--inactive"
                      }
                    >
                      {active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{row.fullName}</td>
                  <td>{row.email}</td>
                  <td>{row.phone}</td>
                  <td>{row.planInterest}</td>
                  <td>{row.city || "—"}</td>
                  <td>{formatWhen(row.createdAt)}</td>
                  <td>
                    <label className="admin-trainers-switch admin-trainers-switch--compact admin-members-table-switch">
                      <input
                        type="checkbox"
                        role="switch"
                        aria-label={
                          active
                            ? `Deactivate ${row.fullName}`
                            : `Activate ${row.fullName}`
                        }
                        checked={active}
                        disabled={toggleBusyId === row._id}
                        onChange={() => handleToggleActive(row)}
                      />
                      <span className="admin-trainers-switch__track" aria-hidden>
                        <span className="admin-trainers-switch__thumb" />
                      </span>
                    </label>
                  </td>
                </tr>
              );
            })}
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
