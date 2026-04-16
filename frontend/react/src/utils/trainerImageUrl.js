import { getApiBase } from "../config/apiOrigin.js";

/**
 * Absolute URL for a trainer photo stored under `/api/uploads/...`.
 * @param {string | null | undefined} imagePath — e.g. `trainers/abc.jpg`
 * @returns {string | null}
 */
export function trainerPhotoUrl(imagePath) {
  if (!imagePath || typeof imagePath !== "string") return null;
  const base = getApiBase().replace(/\/$/, "");
  const rel = imagePath.replace(/^\/+/, "");
  return `${base}/api/uploads/${rel}`;
}

/**
 * Prefer Cloudinary `imageUrl` when set; otherwise local API path.
 * @param {{ imageUrl?: string | null; imagePath?: string | null }} trainer
 * @returns {string | null}
 */
export function trainerDisplayPhotoUrl(trainer) {
  if (!trainer || typeof trainer !== "object") return null;
  if (trainer.imageUrl && typeof trainer.imageUrl === "string") {
    return trainer.imageUrl;
  }
  return trainerPhotoUrl(trainer.imagePath);
}
