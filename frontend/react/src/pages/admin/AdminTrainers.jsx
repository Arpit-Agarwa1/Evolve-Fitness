import React, { useCallback, useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import SEO from "../../components/SEO";
import { useAdminApi } from "../../hooks/useAdminApi";
import { trainerDisplayPhotoUrl } from "../../utils/trainerImageUrl";

/**
 * Create, edit, delete trainers and upload photos (stored on the API server).
 */
export default function AdminTrainers() {
  const { request } = useAdminApi();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await request("/api/admin/trainers");
      setItems(res.data?.items ?? []);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not load trainers."
      );
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setRole("");
    setSortOrder("0");
    setImageFile(null);
    setPreviewUrl(null);
  }

  /**
   * @param {{ _id: string; name: string; role: string; sortOrder?: number; imagePath?: string | null; imageUrl?: string | null }} t
   */
  function startEdit(t) {
    setEditingId(t._id);
    setName(t.name);
    setRole(t.role);
    setSortOrder(String(t.sortOrder ?? 0));
    setImageFile(null);
  }

  /**
   * Encodes one JPEG pass at given max edge length + quality.
   * @param {File} file
   * @param {number} maxDim
   * @param {number} quality 0–1
   */
  async function fileToTrainerJpegFile(file, maxDim, quality) {
    const bmp = await createImageBitmap(file);
    try {
      const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
      const w = Math.round(bmp.width * scale);
      const h = Math.round(bmp.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not available");
      ctx.drawImage(bmp, 0, 0, w, h);
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("encode"))),
          "image/jpeg",
          quality
        );
      });
      return new File([blob], "trainer.jpg", { type: "image/jpeg" });
    } finally {
      bmp.close();
    }
  }

  /**
   * Shrinks JPEG until base64 fits under proxy limits (~178kb+ JSON was causing empty 502 from edge).
   * @param {File} file
   * @returns {Promise<{ imageBase64: string; imageMimeType: string }>}
   */
  async function prepareTrainerImageForUpload(file) {
    if (!file.type.startsWith("image/")) {
      throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
    }
    /** ~72k chars base64 → ~95kb JSON overhead — stays under typical CDN/proxy POST caps. */
    const maxBase64 = 72_000;
    let maxDim = 720;
    let quality = 0.62;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const jpegFile = await fileToTrainerJpegFile(file, maxDim, quality);
      const imageBase64 = await fileToBase64(jpegFile);
      if (imageBase64.length <= maxBase64 || maxDim <= 320) {
        return { imageBase64, imageMimeType: "image/jpeg" };
      }
      maxDim = Math.max(320, Math.floor(maxDim * 0.82));
      quality = Math.max(0.42, quality - 0.06);
    }
    const jpegFile = await fileToTrainerJpegFile(file, 320, 0.42);
    return {
      imageBase64: await fileToBase64(jpegFile),
      imageMimeType: "image/jpeg",
    };
  }

  /**
   * @param {File} file
   * @returns {Promise<string>} raw base64 (no data: prefix)
   */
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        if (typeof dataUrl !== "string") {
          reject(new Error("Could not read image"));
          return;
        }
        const comma = dataUrl.indexOf(",");
        resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
      };
      reader.onerror = () => reject(new Error("Could not read image"));
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");
    try {
      const sortNum = Number.parseInt(sortOrder, 10);
      /** @type {{ name: string; role: string; sortOrder: number; imageBase64?: string; imageMimeType?: string }} */
      const payload = {
        name: name.trim(),
        role: role.trim(),
        sortOrder: Number.isNaN(sortNum) ? 0 : sortNum,
      };
      if (imageFile) {
        const img = await prepareTrainerImageForUpload(imageFile);
        payload.imageBase64 = img.imageBase64;
        payload.imageMimeType = img.imageMimeType;
      }

      if (editingId) {
        await request(`/api/admin/trainers/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await request("/api/admin/trainers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      await load();
      resetForm();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not save trainer."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Remove this trainer from the website?")) return;
    setErrorMessage("");
    try {
      await request(`/api/admin/trainers/${id}`, { method: "DELETE" });
      await load();
      if (editingId === id) resetForm();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not delete trainer."
      );
    }
  }

  return (
    <AdminLayout title="Trainers">
      <SEO
        title="Trainers"
        description="Evolve Fitness admin — manage trainer profiles."
        path="/admin/trainers"
        noIndex
      />

      {errorMessage ? (
        <p className="admin-banner admin-banner--error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="admin-trainers-layout">
        <form className="admin-trainers-form" onSubmit={handleSubmit}>
          <h2 className="admin-trainers-form__title">
            {editingId ? "Edit trainer" : "Add trainer"}
          </h2>
          <div className="admin-trainers-form__grid">
            <label className="admin-trainers-field">
              <span>Name *</span>
              <input
                type="text"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                required
                maxLength={120}
                autoComplete="name"
                placeholder="Full name"
              />
            </label>
            <label className="admin-trainers-field">
              <span>Role *</span>
              <input
                type="text"
                value={role}
                onChange={(ev) => setRole(ev.target.value)}
                required
                maxLength={160}
                placeholder="e.g. Strength coach"
              />
            </label>
            <label className="admin-trainers-field">
              <span>Sort order</span>
              <input
                type="number"
                value={sortOrder}
                onChange={(ev) => setSortOrder(ev.target.value)}
                placeholder="0"
              />
            </label>
            <label className="admin-trainers-field admin-trainers-field--file">
              <span>Photo {editingId ? "(optional — replaces current)" : "(optional)"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  setImageFile(f ?? null);
                }}
              />
            </label>
          </div>

          {editingId && !previewUrl ? (
            <div className="admin-trainers-preview-row">
              <span className="admin-muted">Current photo</span>
              {(() => {
                const t = items.find((x) => x._id === editingId);
                const url = trainerDisplayPhotoUrl(t);
                return url ? (
                  <img
                    className="admin-trainers-thumb"
                    src={url}
                    alt=""
                  />
                ) : (
                  <span className="admin-muted">None</span>
                );
              })()}
            </div>
          ) : null}

          {previewUrl ? (
            <div className="admin-trainers-preview-row">
              <span className="admin-muted">New photo preview</span>
              <img
                className="admin-trainers-thumb"
                src={previewUrl}
                alt=""
              />
            </div>
          ) : null}

          <div className="admin-trainers-form__actions">
            <button
              type="submit"
              className="admin-trainers-btn admin-trainers-btn--primary"
              disabled={saving}
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add trainer"}
            </button>
            {editingId ? (
              <button
                type="button"
                className="admin-trainers-btn"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel edit
              </button>
            ) : null}
          </div>
          <p className="admin-muted admin-trainers-hint">
            JPEG, PNG, WebP, or GIF — max 5MB. Set{" "}
            <code className="admin-trainers-code">CLOUDINARY_URL</code> on the API
            (see <code className="admin-trainers-code">.env.example</code>) so
            photos survive deploys; otherwise they are saved on the server disk.
          </p>
        </form>

        <div className="admin-trainers-list">
          <h2 className="admin-trainers-list__title">Published trainers</h2>
          {loading ? (
            <p className="admin-muted">Loading…</p>
          ) : items.length === 0 ? (
            <p className="admin-empty">No trainers yet — add one on the left.</p>
          ) : (
            <ul className="admin-trainers-cards">
              {items.map((t) => {
                const src = trainerDisplayPhotoUrl(t);
                return (
                  <li key={t._id} className="admin-trainers-card">
                    <div className="admin-trainers-card__media">
                      {src ? (
                        <img src={src} alt="" className="admin-trainers-card__img" />
                      ) : (
                        <div className="admin-trainers-card__placeholder">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="admin-trainers-card__body">
                      <p className="admin-trainers-card__name">{t.name}</p>
                      <p className="admin-trainers-card__role">{t.role}</p>
                      <p className="admin-trainers-card__meta">
                        Sort: {t.sortOrder ?? 0}
                      </p>
                      <div className="admin-trainers-card__actions">
                        <button
                          type="button"
                          className="admin-trainers-btn admin-trainers-btn--small"
                          onClick={() => startEdit(t)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-trainers-btn admin-trainers-btn--small admin-trainers-btn--danger"
                          onClick={() => handleDelete(t._id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
