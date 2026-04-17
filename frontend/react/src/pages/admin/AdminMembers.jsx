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

/** Calendar day for table (membership dates stored as UTC noon). */
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

/**
 * @param {string | undefined} iso
 */
function dateToInputValue(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

/**
 * @param {string | undefined} endIso membershipEndDate
 */
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

/**
 * @param {string | undefined} text
 * @param {number} max
 */
function truncateNote(text, max) {
  if (!text || !String(text).trim()) return "—";
  const s = String(text).trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

/**
 * Gym member management — search, filters, membership period, notes, account status.
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

  /** Full manage dialog: status, dates, admin notes. */
  const [manageModal, setManageModal] = useState(null);
  const [manageActive, setManageActive] = useState(true);
  const [membershipStartInput, setMembershipStartInput] = useState("");
  const [membershipEndInput, setMembershipEndInput] = useState("");
  const [adminNotesInput, setAdminNotesInput] = useState("");
  const [manageSaving, setManageSaving] = useState(false);

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

  /**
   * @param {{ _id: string; isActive?: boolean }} row
   */
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

  /** @param {Record<string, unknown> & { _id: string }} row */
  function openManageModal(row) {
    setManageModal(row);
    setManageActive(row.isActive !== false);
    setMembershipStartInput(dateToInputValue(row.membershipStartDate));
    setMembershipEndInput(dateToInputValue(row.membershipEndDate));
    setAdminNotesInput(row.adminNotes != null ? String(row.adminNotes) : "");
  }

  function closeManageModal() {
    if (manageSaving) return;
    setManageModal(null);
  }

  async function saveManageMember() {
    if (!manageModal) return;
    setManageSaving(true);
    setErrorMessage("");
    try {
      await request(`/api/admin/members/${manageModal._id}/manage`, {
        method: "POST",
        body: JSON.stringify({
          isActive: manageActive,
          membershipStartDate:
            membershipStartInput.trim() === "" ? null : membershipStartInput,
          membershipEndDate:
            membershipEndInput.trim() === "" ? null : membershipEndInput,
          adminNotes: adminNotesInput,
        }),
      });
      setManageModal(null);
      await loadMembers();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not save member."
      );
    } finally {
      setManageSaving(false);
    }
  }

  return (
    <AdminLayout title="Member management">
      <SEO
        title="Member management"
        description="Evolve Fitness — gym member roster, membership period, and notes."
        path="/admin/members"
        noIndex
      />
      {errorMessage ? (
        <p className="admin-banner admin-banner--error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="admin-member-toolbar">
        <div className="admin-member-toolbar__search">
          <label className="admin-member-toolbar__label" htmlFor="admin-member-search">
            Search
          </label>
          <input
            id="admin-member-search"
            type="search"
            className="admin-member-toolbar__input"
            placeholder="Name, email, or phone"
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
          </select>
        </div>
      </div>

      <p className="admin-muted admin-table-meta">
        {loading ? "Loading…" : `${total} match${total === 1 ? "" : "es"}`}
      </p>
      <p className="admin-muted admin-members-hint">
        Use <strong>Manage</strong> to set membership dates and internal notes. Quick toggles
        update account status only.
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
              <th>Signed up</th>
              <th>Membership</th>
              <th>Notes</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const active = row.isActive !== false;
              const expired = isMembershipExpired(row.membershipEndDate);
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
                  <td className="admin-table__membership-cell">
                    <div className="admin-membership-dates">
                      <span>{formatDateOnly(row.membershipStartDate)}</span>
                      <span className="admin-membership-dates__sep" aria-hidden>
                        →
                      </span>
                      <span>
                        {formatDateOnly(row.membershipEndDate)}
                        {expired && row.membershipEndDate ? (
                          <span className="admin-membership-expired">Expired</span>
                        ) : null}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="admin-trainers-btn admin-trainers-btn--small admin-membership-edit"
                      onClick={() => openManageModal(row)}
                    >
                      Manage
                    </button>
                  </td>
                  <td className="admin-table__notes-cell">
                    {truncateNote(row.adminNotes, 48)}
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

      {manageModal ? (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onClick={closeManageModal}
        >
          <div
            className="admin-modal admin-modal--wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-manage-member-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="admin-manage-member-title" className="admin-modal__title">
              Manage member
            </h2>
            <p className="admin-modal__lede">{manageModal.fullName}</p>

            <div className="admin-modal__fields">
              <label className="admin-modal__switch-row">
                <span>Account active</span>
                <label className="admin-trainers-switch">
                  <input
                    type="checkbox"
                    role="switch"
                    checked={manageActive}
                    onChange={(e) => setManageActive(e.target.checked)}
                    disabled={manageSaving}
                  />
                  <span className="admin-trainers-switch__track" aria-hidden>
                    <span className="admin-trainers-switch__thumb" />
                  </span>
                  <span className="admin-trainers-switch__label">
                    {manageActive ? "Active" : "Inactive"}
                  </span>
                </label>
              </label>

              <label className="admin-modal__label">
                <span>Membership start</span>
                <input
                  type="date"
                  value={membershipStartInput}
                  onChange={(e) => setMembershipStartInput(e.target.value)}
                  disabled={manageSaving}
                />
              </label>
              <label className="admin-modal__label">
                <span>Membership end</span>
                <input
                  type="date"
                  value={membershipEndInput}
                  onChange={(e) => setMembershipEndInput(e.target.value)}
                  disabled={manageSaving}
                />
              </label>
              <p className="admin-modal__field-hint">
                Leave a date empty to clear it. End must be on or after start.
              </p>

              <label className="admin-modal__label admin-modal__label--textarea">
                <span>Internal notes (admin only)</span>
                <textarea
                  className="admin-modal__textarea"
                  rows={4}
                  maxLength={2000}
                  placeholder="e.g. renewal call, payment plan, injuries…"
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  disabled={manageSaving}
                />
              </label>
            </div>

            <div className="admin-modal__actions">
              <button
                type="button"
                className="admin-trainers-btn admin-trainers-btn--primary"
                disabled={manageSaving}
                onClick={saveManageMember}
              >
                {manageSaving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="admin-trainers-btn"
                disabled={manageSaving}
                onClick={closeManageModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}
