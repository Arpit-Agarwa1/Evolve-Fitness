import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

function formatDateOnly(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function isMembershipExpired(endIso) {
  if (!endIso) return false;
  try {
    const end = new Date(endIso);
    const today = new Date();
    const e = Date.UTC(
      end.getUTCFullYear(),
      end.getUTCMonth(),
      end.getUTCDate()
    );
    const t = Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    );
    return e < t;
  } catch {
    return false;
  }
}

function truncateNote(text, max) {
  if (!text || !String(text).trim()) return "—";
  const s = String(text).trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

/**
 * Gym member management — list, search, filters, quick active toggle, links to full profile.
 */
export default function AdminMembers() {
  const { request } = useAdminApi();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toggleBusyId, setToggleBusyId] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [membershipFilter, setMembershipFilter] = useState("all");

  const pageCount = useMemo(() => adminPageCount(total), [total]);

  const listFilters = useMemo(
    () => ({
      q: debouncedSearch,
      status: statusFilter,
      membership: membershipFilter,
    }),
    [debouncedSearch, statusFilter, membershipFilter]
  );

  const hasListFilters = Boolean(
    debouncedSearch ||
      statusFilter !== "all" ||
      membershipFilter !== "all"
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, membershipFilter]);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const qs = adminListQuery(page, listFilters);
      const res = await request(`/api/admin/members?${qs}`);
      setItems(res.data?.items ?? []);
      setTotal(res.data?.total ?? 0);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not load members."
      );
    } finally {
      setLoading(false);
    }
  }, [request, page, listFilters]);

  useEffect(() => {
    if (total > 0 && pageCount > 0 && page > pageCount) {
      setPage(pageCount);
    }
  }, [total, pageCount, page]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  async function handleToggleActive(row) {
    const currentlyActive = row.isActive !== false;
    setErrorMessage("");
    setToggleBusyId(row._id);
    try {
      await request(`/api/admin/members/${row._id}/manage`, {
        method: "POST",
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
    <AdminLayout title="Member management">
      <SEO
        title="Member management"
        description="Evolve Fitness — gym member roster and administration."
        path="/admin/members"
        noIndex
      />
      {errorMessage ? (
        <p className="admin-banner admin-banner--error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="admin-member-page-head admin-member-list-head">
        <Link
          to="/admin/members/new"
          className="admin-trainers-btn admin-trainers-btn--primary admin-member-add"
        >
          Add member
        </Link>
      </div>

      <div className="admin-member-toolbar">
        <div className="admin-member-toolbar__search">
          <label className="admin-member-toolbar__label" htmlFor="admin-member-search">
            Search
          </label>
          <input
            id="admin-member-search"
            type="search"
            className="admin-member-toolbar__input"
            placeholder="Name, email, phone, or emergency contact"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="admin-member-toolbar__filters">
          <label className="admin-member-toolbar__label" htmlFor="admin-member-status">
            Account
          </label>
          <select
            id="admin-member-status"
            className="admin-member-toolbar__select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <label className="admin-member-toolbar__label" htmlFor="admin-member-membership">
            Membership
          </label>
          <select
            id="admin-member-membership"
            className="admin-member-toolbar__select"
            value={membershipFilter}
            onChange={(e) => setMembershipFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="valid">Valid / not expired</option>
            <option value="expired">Expired</option>
            <option value="none">No dates set</option>
            <option value="frozen">Frozen</option>
          </select>
        </div>
      </div>

      <p className="admin-muted admin-table-meta">
        {loading ? "Loading…" : `${total} match${total === 1 ? "" : "es"}`}
      </p>
      <p className="admin-muted admin-members-hint">
        Open <strong>View profile</strong> to edit all fields, assign a trainer, set goals, and add
        notes.
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
              <th>Signed up</th>
              <th>Membership</th>
              <th>Notes</th>
              <th>Actions</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const active = row.isActive !== false;
              const frozen = row.membershipFrozen === true;
              const expired =
                !frozen && isMembershipExpired(row.membershipEndDate);
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
                  <td>{formatWhen(row.createdAt)}</td>
                  <td className="admin-table__membership-cell">
                    <div className="admin-membership-dates">
                      <span>{formatDateOnly(row.membershipStartDate)}</span>
                      <span className="admin-membership-dates__sep" aria-hidden>
                        →
                      </span>
                      <span>
                        {formatDateOnly(row.membershipEndDate)}
                        {frozen ? (
                          <span className="admin-membership-frozen">Frozen</span>
                        ) : null}
                        {expired && row.membershipEndDate ? (
                          <span className="admin-membership-expired">Expired</span>
                        ) : null}
                      </span>
                    </div>
                  </td>
                  <td className="admin-table__notes-cell">
                    {truncateNote(row.adminNotes, 40)}
                  </td>
                  <td className="admin-table__action-cell">
                    <Link
                      to={`/admin/members/${row._id}`}
                      className="admin-table__action-link"
                    >
                      <span className="admin-table__action-link-text">View profile</span>
                      <span className="admin-table__action-link-chevron" aria-hidden>
                        →
                      </span>
                    </Link>
                  </td>
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
          <p className="admin-empty">
            {hasListFilters
              ? "No members match these filters."
              : "No members registered yet."}
          </p>
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
