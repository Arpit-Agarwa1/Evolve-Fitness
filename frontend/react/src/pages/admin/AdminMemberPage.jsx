import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import SEO from "../../components/SEO";
import { useAdminApi } from "../../hooks/useAdminApi";
import { GENDER_OPTIONS, MEMBER_PLAN_OPTIONS } from "../../constants/memberFields";
import { trainerDisplayPhotoUrl } from "../../utils/trainerImageUrl";

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

function emptyForm() {
  return {
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    city: "",
    emergencyContact: "",
    planInterest: "unknown",
    membershipStartDate: "",
    membershipEndDate: "",
    membershipFrozen: false,
    membershipFreezeStartedAt: "",
    membershipFreezeEndDate: "",
    assignedTrainerId: "",
    heightCm: "",
    weightKg: "",
    fitnessGoal: "",
    isActive: true,
    adminNotes: "",
    newPassword: "",
  };
}

/**
 * Add / view / edit member — full profile and gym fields.
 */
export default function AdminMemberPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { request } = useAdminApi();

  const isCreate = id === "new";

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [trainers, setTrainers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [memberId, setMemberId] = useState(null);

  const title = useMemo(() => {
    if (isCreate) return "Add member";
    return form.fullName ? form.fullName : "Member profile";
  }, [isCreate, form.fullName]);

  const loadTrainers = useCallback(async () => {
    try {
      const res = await request("/api/admin/trainers");
      setTrainers(res.data?.items ?? []);
    } catch {
      setTrainers([]);
    }
  }, [request]);

  const loadMember = useCallback(async () => {
    if (isCreate || !id) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await request(`/api/admin/members/${id}`);
      const m = res.data?.member;
      if (!m) {
        setErrorMessage("Member not found.");
        return;
      }
      setMemberId(m._id);
      const tid = m.assignedTrainerId;
      const trainerId =
        tid && typeof tid === "object" && tid._id
          ? String(tid._id)
          : tid
            ? String(tid)
            : "";

      setForm({
        ...emptyForm(),
        fullName: m.fullName ?? "",
        email: m.email ?? "",
        phone: m.phone ?? "",
        password: "",
        confirmPassword: "",
        gender: m.gender ?? "",
        dateOfBirth: dateToInputValue(m.dateOfBirth),
        address: m.address ?? "",
        city: m.city ?? "",
        emergencyContact: m.emergencyContact ?? "",
        planInterest: m.planInterest ?? "unknown",
        membershipStartDate: dateToInputValue(m.membershipStartDate),
        membershipEndDate: dateToInputValue(m.membershipEndDate),
        membershipFrozen: m.membershipFrozen === true,
        membershipFreezeStartedAt: dateToInputValue(m.membershipFreezeStartedAt),
        membershipFreezeEndDate: dateToInputValue(m.membershipFreezeEndDate),
        assignedTrainerId: trainerId,
        heightCm:
          m.heightCm != null && m.heightCm !== "" ? String(m.heightCm) : "",
        weightKg:
          m.weightKg != null && m.weightKg !== "" ? String(m.weightKg) : "",
        fitnessGoal: m.fitnessGoal ?? "",
        isActive: m.isActive !== false,
        adminNotes: m.adminNotes ?? "",
        newPassword: "",
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not load member."
      );
    } finally {
      setLoading(false);
    }
  }, [request, id, isCreate]);

  useEffect(() => {
    loadTrainers();
  }, [loadTrainers]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /** Toggle freeze; default freeze start to today when turning on (backend also fills if empty). */
  function setMembershipFrozen(value) {
    setForm((prev) => ({
      ...prev,
      membershipFrozen: value,
      membershipFreezeStartedAt:
        value && !String(prev.membershipFreezeStartedAt ?? "").trim()
          ? new Date().toISOString().slice(0, 10)
          : prev.membershipFreezeStartedAt,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    if (isCreate) {
      if (!form.password || form.password.length < 8) {
        setErrorMessage("Password must be at least 8 characters.");
        setSaving(false);
        return;
      }
      if (form.password !== form.confirmPassword) {
        setErrorMessage("Passwords do not match.");
        setSaving(false);
        return;
      }
    }

    try {
      const numOrNull = (v) => {
        if (v === "" || v == null) return null;
        const n = Number.parseFloat(String(v));
        return Number.isFinite(n) ? n : null;
      };

      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        gender: form.gender || "",
        dateOfBirth: form.dateOfBirth.trim() === "" ? null : form.dateOfBirth,
        address: form.address.trim(),
        city: form.city.trim(),
        emergencyContact: form.emergencyContact.trim(),
        planInterest: form.planInterest,
        membershipStartDate:
          form.membershipStartDate.trim() === ""
            ? null
            : form.membershipStartDate,
        membershipEndDate:
          form.membershipEndDate.trim() === "" ? null : form.membershipEndDate,
        membershipFrozen: form.membershipFrozen,
        membershipFreezeStartedAt:
          form.membershipFreezeStartedAt.trim() === ""
            ? null
            : form.membershipFreezeStartedAt,
        membershipFreezeEndDate:
          form.membershipFreezeEndDate.trim() === ""
            ? null
            : form.membershipFreezeEndDate,
        assignedTrainerId: form.assignedTrainerId || null,
        heightCm: numOrNull(form.heightCm),
        weightKg: numOrNull(form.weightKg),
        fitnessGoal: form.fitnessGoal.trim(),
        isActive: form.isActive,
        adminNotes: form.adminNotes,
      };

      if (isCreate) {
        payload.password = form.password;
        const res = await request("/api/admin/members", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const newId = res.data?.member?._id;
        if (newId) {
          navigate(`/admin/members/${newId}`, { replace: true });
        } else {
          navigate("/admin/members", { replace: true });
        }
        return;
      }

      const patch = { ...payload };
      delete patch.password;
      if (form.newPassword && form.newPassword.length >= 8) {
        patch.newPassword = form.newPassword;
      }

      await request(`/api/admin/members/${memberId ?? id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setForm((f) => ({ ...f, newPassword: "" }));
      await loadMember();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not save member."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!memberId && !id) return;
    if (
      !window.confirm(
        "Delete this member permanently? This cannot be undone."
      )
    ) {
      return;
    }
    setDeleting(true);
    setErrorMessage("");
    try {
      await request(`/api/admin/members/${memberId ?? id}`, {
        method: "DELETE",
      });
      navigate("/admin/members", { replace: true });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not delete member."
      );
    } finally {
      setDeleting(false);
    }
  }

  const assignedTrainer = useMemo(() => {
    if (!form.assignedTrainerId) return null;
    return trainers.find((t) => t._id === form.assignedTrainerId) ?? null;
  }, [trainers, form.assignedTrainerId]);

  return (
    <AdminLayout title={title}>
      <SEO
        title={title}
        description="Member profile — Evolve Fitness admin."
        path={isCreate ? "/admin/members/new" : `/admin/members/${id}`}
        noIndex
      />

      <div className="admin-member-page-head">
        <Link to="/admin/members" className="admin-member-back">
          ← Back to member management
        </Link>
        {!isCreate && (memberId || id) ? (
          <button
            type="button"
            className="admin-trainers-btn admin-trainers-btn--danger admin-member-delete"
            disabled={deleting || loading}
            onClick={handleDelete}
          >
            {deleting ? "Deleting…" : "Delete member"}
          </button>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="admin-banner admin-banner--error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {loading ? (
        <p className="admin-muted">Loading…</p>
      ) : (
        <form className="admin-member-form" onSubmit={handleSubmit}>
          <h2 className="admin-member-form__section-title">Profile</h2>
          <div className="admin-member-form__grid">
            <label className="admin-member-form__field">
              <span>Full name *</span>
              <input
                required
                value={form.fullName}
                onChange={(e) => setField("fullName", e.target.value)}
                maxLength={120}
                autoComplete="name"
              />
            </label>
            <label className="admin-member-form__field">
              <span>Email *</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                maxLength={254}
                autoComplete="email"
              />
            </label>
            <label className="admin-member-form__field">
              <span>Phone *</span>
              <input
                required
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                maxLength={32}
                autoComplete="tel"
              />
            </label>
            <label className="admin-member-form__field">
              <span>Gender</span>
              <select
                value={form.gender}
                onChange={(e) => setField("gender", e.target.value)}
              >
                {GENDER_OPTIONS.map((o) => (
                  <option key={o.value || "empty"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-member-form__field">
              <span>Date of birth</span>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setField("dateOfBirth", e.target.value)}
              />
            </label>
            <label className="admin-member-form__field admin-member-form__field--wide">
              <span>Address</span>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                maxLength={500}
                placeholder="Street, area, city, PIN…"
              />
            </label>
            <label className="admin-member-form__field">
              <span>City (short)</span>
              <input
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
                maxLength={120}
              />
            </label>
            <label className="admin-member-form__field admin-member-form__field--wide">
              <span>Emergency contact</span>
              <input
                value={form.emergencyContact}
                onChange={(e) => setField("emergencyContact", e.target.value)}
                maxLength={200}
                placeholder="Name and phone"
              />
            </label>
          </div>

          <h2 className="admin-member-form__section-title">Gym & membership</h2>
          <div className="admin-member-form__grid">
            <label className="admin-member-form__field">
              <span>Membership plan</span>
              <select
                value={form.planInterest}
                onChange={(e) => setField("planInterest", e.target.value)}
              >
                {MEMBER_PLAN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-member-form__field">
              <span>Joining date</span>
              <input
                type="date"
                value={form.membershipStartDate}
                onChange={(e) =>
                  setField("membershipStartDate", e.target.value)
                }
              />
            </label>
            <label className="admin-member-form__field">
              <span>Expiry date</span>
              <input
                type="date"
                value={form.membershipEndDate}
                onChange={(e) => setField("membershipEndDate", e.target.value)}
              />
            </label>
            <label className="admin-member-form__field admin-member-form__field--switch">
              <span>Membership frozen</span>
              <label className="admin-trainers-switch">
                <input
                  type="checkbox"
                  role="switch"
                  checked={form.membershipFrozen}
                  onChange={(e) => setMembershipFrozen(e.target.checked)}
                />
                <span className="admin-trainers-switch__track" aria-hidden>
                  <span className="admin-trainers-switch__thumb" />
                </span>
                <span className="admin-trainers-switch__label">
                  {form.membershipFrozen ? "Frozen" : "Not frozen"}
                </span>
              </label>
            </label>
            <p className="admin-member-form__hint admin-member-form__field--wide">
              When you turn the freeze off, the expiry date is extended by the
              number of full days the membership was frozen.
            </p>
            <label className="admin-member-form__field">
              <span>Freeze started</span>
              <input
                type="date"
                value={form.membershipFreezeStartedAt}
                onChange={(e) =>
                  setField("membershipFreezeStartedAt", e.target.value)
                }
                disabled={!form.membershipFrozen}
              />
            </label>
            <label className="admin-member-form__field">
              <span>Planned resume (optional)</span>
              <input
                type="date"
                value={form.membershipFreezeEndDate}
                onChange={(e) =>
                  setField("membershipFreezeEndDate", e.target.value)
                }
                disabled={!form.membershipFrozen}
              />
            </label>
            <label className="admin-member-form__field admin-member-form__field--wide">
              <span>Trainer assigned</span>
              <select
                value={form.assignedTrainerId}
                onChange={(e) =>
                  setField("assignedTrainerId", e.target.value)
                }
              >
                <option value="">— None —</option>
                {trainers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} — {t.role}
                  </option>
                ))}
              </select>
            </label>
            {assignedTrainer ? (
              <div className="admin-member-trainer-preview">
                {trainerDisplayPhotoUrl(assignedTrainer) ? (
                  <img
                    src={trainerDisplayPhotoUrl(assignedTrainer)}
                    alt=""
                    className="admin-member-trainer-preview__img"
                  />
                ) : null}
                <span className="admin-muted">
                  {assignedTrainer.name} · {assignedTrainer.role}
                </span>
              </div>
            ) : null}
            <label className="admin-member-form__field">
              <span>Height (cm)</span>
              <input
                type="number"
                min={0}
                max={300}
                step={0.1}
                value={form.heightCm}
                onChange={(e) => setField("heightCm", e.target.value)}
                placeholder="e.g. 175"
              />
            </label>
            <label className="admin-member-form__field">
              <span>Weight (kg)</span>
              <input
                type="number"
                min={0}
                max={500}
                step={0.1}
                value={form.weightKg}
                onChange={(e) => setField("weightKg", e.target.value)}
                placeholder="e.g. 72"
              />
            </label>
            <label className="admin-member-form__field admin-member-form__field--wide">
              <span>Fitness goal</span>
              <textarea
                rows={2}
                value={form.fitnessGoal}
                onChange={(e) => setField("fitnessGoal", e.target.value)}
                maxLength={500}
                placeholder="Strength, fat loss, endurance…"
              />
            </label>
          </div>

          <h2 className="admin-member-form__section-title">Admin</h2>
          <div className="admin-member-form__grid">
            <label className="admin-member-form__field admin-member-form__field--switch">
              <span>Account active</span>
              <label className="admin-trainers-switch">
                <input
                  type="checkbox"
                  role="switch"
                  checked={form.isActive}
                  onChange={(e) => setField("isActive", e.target.checked)}
                />
                <span className="admin-trainers-switch__track" aria-hidden>
                  <span className="admin-trainers-switch__thumb" />
                </span>
                <span className="admin-trainers-switch__label">
                  {form.isActive ? "Active" : "Inactive"}
                </span>
              </label>
            </label>
            <label className="admin-member-form__field admin-member-form__field--wide">
              <span>Internal notes</span>
              <textarea
                rows={4}
                maxLength={2000}
                value={form.adminNotes}
                onChange={(e) => setField("adminNotes", e.target.value)}
                placeholder="Private notes for staff only."
              />
            </label>
          </div>

          {isCreate ? (
            <div className="admin-member-form__grid">
              <h2 className="admin-member-form__section-title admin-member-form__field--wide">
                Login
              </h2>
              <label className="admin-member-form__field">
                <span>Password *</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  minLength={8}
                />
              </label>
              <label className="admin-member-form__field">
                <span>Confirm password *</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => setField("confirmPassword", e.target.value)}
                  minLength={8}
                />
              </label>
            </div>
          ) : (
            <div className="admin-member-form__grid">
              <h2 className="admin-member-form__section-title admin-member-form__field--wide">
                Reset password
              </h2>
              <p className="admin-member-form__hint admin-member-form__field--wide">
                Leave blank to keep the current password.
              </p>
              <label className="admin-member-form__field">
                <span>New password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.newPassword}
                  onChange={(e) => setField("newPassword", e.target.value)}
                  minLength={8}
                />
              </label>
            </div>
          )}

          <div className="admin-member-form__actions">
            <button
              type="submit"
              className="admin-trainers-btn admin-trainers-btn--primary"
              disabled={saving}
            >
              {saving ? "Saving…" : isCreate ? "Create member" : "Save changes"}
            </button>
            <Link to="/admin/members" className="admin-trainers-btn">
              Cancel
            </Link>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}
