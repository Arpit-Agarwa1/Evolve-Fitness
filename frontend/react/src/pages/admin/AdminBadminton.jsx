import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminPagination from "../../components/admin/AdminPagination";
import SEO from "../../components/SEO";
import { useAdminApi } from "../../hooks/useAdminApi";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { getAdminApiBase } from "../../config/apiOrigin";
import { adminListQuery, adminPageCount } from "../../utils/adminPagination";
import {
  MEMBER_CATEGORIES,
  OPEN_CATEGORIES,
} from "../../data/badmintonChampionship";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "—";
  }
}

function categoryLabel(id) {
  return (
    [...MEMBER_CATEGORIES, ...OPEN_CATEGORIES].find((c) => c.id === id)
      ?.label ?? id
  );
}

/**
 * Admin — Badminton Members + Open registrations.
 */
export default function AdminBadminton() {
  const { request } = useAdminApi();
  const { token } = useAdminAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("confirmed");
  const [typeFilter, setTypeFilter] = useState("all");
  const [settings, setSettings] = useState(null);
  const [categoryStatus, setCategoryStatus] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const pageCount = useMemo(() => adminPageCount(total), [total]);

  useEffect(() => {
    if (total > 0 && pageCount > 0 && page > pageCount) {
      setPage(pageCount);
    }
  }, [total, pageCount, page]);

  const loadList = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const q = adminListQuery(page);
      const statusParam =
        statusFilter && statusFilter !== "all"
          ? `&status=${encodeURIComponent(statusFilter)}`
          : "";
      const typeParam =
        typeFilter && typeFilter !== "all"
          ? `&tournamentType=${encodeURIComponent(typeFilter)}`
          : "";
      const res = await request(
        `/api/admin/badminton?${q}${statusParam}${typeParam}`
      );
      setItems(res.data?.items ?? []);
      setTotal(res.data?.total ?? 0);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not load registrations."
      );
    } finally {
      setLoading(false);
    }
  }, [request, page, statusFilter, typeFilter]);

  const loadSettings = useCallback(async () => {
    try {
      const res = await request("/api/admin/badminton/settings");
      setSettings(res.data?.settings ?? null);
      setCategoryStatus(res.data?.status ?? null);
    } catch {
      /* ignore */
    }
  }, [request]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function toggleCategoryClosed(categoryId) {
    if (!settings) return;
    const closed = new Set(settings.closedCategories ?? []);
    if (closed.has(categoryId)) closed.delete(categoryId);
    else closed.add(categoryId);
    setSavingSettings(true);
    setErrorMessage("");
    try {
      const res = await request("/api/admin/badminton/settings", {
        method: "PATCH",
        body: JSON.stringify({ closedCategories: [...closed] }),
      });
      setSettings(res.data?.settings ?? null);
      setCategoryStatus(res.data?.status ?? null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not update category."
      );
    } finally {
      setSavingSettings(false);
    }
  }

  async function toggleForceClosed() {
    if (!settings) return;
    setSavingSettings(true);
    setErrorMessage("");
    try {
      const res = await request("/api/admin/badminton/settings", {
        method: "PATCH",
        body: JSON.stringify({
          registrationForceClosed: !settings.registrationForceClosed,
        }),
      });
      setSettings(res.data?.settings ?? null);
      setCategoryStatus(res.data?.status ?? null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not update settings."
      );
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleExport() {
    setErrorMessage("");
    try {
      const API_BASE = getAdminApiBase();
      const typeParam =
        typeFilter !== "all"
          ? `?tournamentType=${encodeURIComponent(typeFilter)}`
          : "";
      const res = await fetch(
        `${API_BASE}/api/admin/badminton/export${typeParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "evolve-badminton-registrations.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not export CSV."
      );
    }
  }

  return (
    <AdminLayout title="Badminton championship">
      <SEO
        title="Badminton registrations"
        description="Evolve Fitness admin — badminton championship."
        path="/admin/badminton"
        noIndex
      />
      {errorMessage ? (
        <p className="admin-banner admin-banner--error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="admin-member-toolbar" style={{ marginBottom: "1.25rem" }}>
        <label className="admin-member-toolbar__label" htmlFor="bd-type">
          Tournament
        </label>
        <select
          id="bd-type"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All</option>
          <option value="member">Members</option>
          <option value="open">Open</option>
        </select>
        <label className="admin-member-toolbar__label" htmlFor="bd-status">
          Status
        </label>
        <select
          id="bd-status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="confirmed">Confirmed</option>
          <option value="draft">Draft / pending pay</option>
          <option value="all">All</option>
        </select>
        <button type="button" className="admin-signout" onClick={handleExport}>
          Export CSV
        </button>
        <button
          type="button"
          className="admin-signout"
          onClick={toggleForceClosed}
          disabled={savingSettings || !settings}
        >
          {settings?.registrationForceClosed
            ? "Re-open registration"
            : "Force-close all registration"}
        </button>
      </div>

      {categoryStatus?.categories ? (
        <div className="admin-table-wrap" style={{ marginBottom: "1.5rem" }}>
          <p className="admin-muted admin-table-meta">Category capacity</p>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Group</th>
                <th>Count</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {categoryStatus.categories.map((c) => {
                const manuallyClosed = (
                  settings?.closedCategories ?? []
                ).includes(c.id);
                return (
                  <tr key={c.id}>
                    <td>{c.label}</td>
                    <td>{c.group}</td>
                    <td>
                      {c.count}/{c.max}
                    </td>
                    <td>
                      {c.full
                        ? "Full"
                        : manuallyClosed
                          ? "Closed"
                          : c.available
                            ? "Open"
                            : "Unavailable"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-signout"
                        disabled={savingSettings}
                        onClick={() => toggleCategoryClosed(c.id)}
                      >
                        {manuallyClosed ? "Re-open" : "Close"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="admin-muted admin-table-meta">
        {loading ? "Loading…" : `${total} total`}
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>ID</th>
              <th>Type</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Events</th>
              <th>Partners / categories</th>
              <th>Amount</th>
              <th>Pay</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row._id}>
                <td className="admin-table__nowrap">
                  {formatWhen(row.createdAt)}
                </td>
                <td className="admin-table__nowrap">{row.registrationId}</td>
                <td>{row.tournamentType || "—"}</td>
                <td>{row.fullName}</td>
                <td>{row.mobile}</td>
                <td>{row.eventCount ?? (row.events || []).length}</td>
                <td className="admin-table__message">
                  {(row.events || []).length
                    ? (row.events || [])
                        .map((e) => {
                          const name =
                            e.partnerName ||
                            [e.partnerFirstName, e.partnerLastName]
                              .filter(Boolean)
                              .join(" ") ||
                            "—";
                          const age =
                            e.partnerAge != null ? `, age ${e.partnerAge}` : "";
                          const mobile = e.partnerMobile
                            ? `, ${e.partnerMobile}`
                            : "";
                          return `${e.categoryLabel || categoryLabel(e.categoryId)}: ${name}${age}${mobile}`;
                        })
                        .join(" · ")
                    : (row.categories || []).map(categoryLabel).join(", ")}
                </td>
                <td>₹{row.amountInr}</td>
                <td>{row.paymentStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 ? (
          <p className="admin-empty">No registrations yet.</p>
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
