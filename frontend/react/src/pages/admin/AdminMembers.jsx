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
  /** Member row open in membership modal, or null. */
  const [membershipModal, setMembershipModal] = useState(null);
  const [membershipStartInput, setMembershipStartInput] = useState("");
  const [membershipEndInput, setMembershipEndInput] = useState("");
  const [membershipSaving, setMembershipSaving] = useState(false);

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
      await request(`/api/admin/members/${row._id}/active`, {
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

  /**
   * @param {{ _id: string; fullName: string; membershipStartDate?: string; membershipEndDate?: string }} row
   */
  function openMembershipModal(row) {
    setMembershipModal(row);
    setMembershipStartInput(dateToInputValue(row.membershipStartDate));
    setMembershipEndInput(dateToInputValue(row.membershipEndDate));
  }

  function closeMembershipModal() {
    if (membershipSaving) return;
    setMembershipModal(null);
  }

  async function saveMembershipPeriod() {
    if (!membershipModal) return;
    setMembershipSaving(true);
    setErrorMessage("");
    try {
      await request(`/api/admin/members/${membershipModal._id}/membership`, {
        method: "POST",
        body: JSON.stringify({
          membershipStartDate:
            membershipStartInput.trim() === "" ? null : membershipStartInput,
          membershipEndDate:
            membershipEndInput.trim() === "" ? null : membershipEndInput,
        }),
      });
      setMembershipModal(null);
      await loadMembers();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not save membership dates."
      );
    } finally {
      setMembershipSaving(false);
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
        Use <strong>Active</strong> for account status. Set <strong>membership start / end</strong>{" "}
        for the paid period (optional).
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
                      <span>
                        {formatDateOnly(row.membershipStartDate)}
                      </span>
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
                      onClick={() => openMembershipModal(row)}
                    >
                      Set period
                    </button>
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
          <p className="admin-empty">No members yet.</p>
        ) : null}
      </div>
      <AdminPagination
        page={page}
        total={total}
        loading={loading}
        onPageChange={setPage}
      />

      {membershipModal ? (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onClick={closeMembershipModal}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-membership-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="admin-membership-modal-title" className="admin-modal__title">
              Membership period
            </h2>
            <p className="admin-modal__lede">
              {membershipModal.fullName} — leave a field empty to clear it.
            </p>
            <div className="admin-modal__fields">
              <label className="admin-modal__label">
                <span>Start date</span>
                <input
                  type="date"
                  value={membershipStartInput}
                  onChange={(e) => setMembershipStartInput(e.target.value)}
                  disabled={membershipSaving}
                />
              </label>
              <label className="admin-modal__label">
                <span>End date</span>
                <input
                  type="date"
                  value={membershipEndInput}
                  onChange={(e) => setMembershipEndInput(e.target.value)}
                  disabled={membershipSaving}
                />
              </label>
            </div>
            <div className="admin-modal__actions">
              <button
                type="button"
                className="admin-trainers-btn admin-trainers-btn--primary"
                disabled={membershipSaving}
                onClick={saveMembershipPeriod}
              >
                {membershipSaving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="admin-trainers-btn"
                disabled={membershipSaving}
                onClick={closeMembershipModal}
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
