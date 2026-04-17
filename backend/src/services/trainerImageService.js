import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";

const uploadsRoot = path.join(process.cwd(), "uploads");

/**
 * Cloudinary is optional: when unset, trainer photos are written to `uploads/trainers/` (ephemeral on some hosts).
 * Set `CLOUDINARY_URL` (or CLOUDINARY_CLOUD_NAME + API key + secret) on Render for persistent URLs.
 */
export function isCloudinaryConfigured() {
  const url = process.env.CLOUDINARY_URL?.trim();
  const name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const key = process.env.CLOUDINARY_API_KEY?.trim();
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  return Boolean(url || (name && key && secret));
}

function ensureCloudinaryConfig() {
  if (!isCloudinaryConfigured()) return;
  if (process.env.CLOUDINARY_URL?.trim()) {
    cloudinary.config(true);
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
}

/**
 * Finish before Render’s edge proxy times out (~30s on free tier) so we can return JSON + CORS
 * instead of an empty 502. Override via CLOUDINARY_UPLOAD_TIMEOUT_MS.
 */
function cloudinaryUploadTimeoutMs() {
  const raw = process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(n) && n >= 5_000 && n <= 120_000) return n;
  return 20_000;
}

/**
 * @param {string} mime
 * @param {string} originalname
 */
function extensionFromFile(mime, originalname) {
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  if (mime && map[mime]) return map[mime];
  const ext = path.extname(originalname).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
    return ext === ".jpeg" ? ".jpg" : ext;
  }
  return ".jpg";
}

/**
 * @param {Express.Multer.File} file
 * @returns {Promise<{ imagePath: string | null; imageUrl: string | null; cloudinaryPublicId: string | null }>}
 */
export async function saveTrainerImageFile(file) {
  if (!file?.buffer) {
    throw new Error("Missing image buffer");
  }

  if (isCloudinaryConfigured()) {
    ensureCloudinaryConfig();
    const folder =
      process.env.CLOUDINARY_TRAINER_FOLDER?.trim() || "evolve-fitness/trainers";

    const timeoutMs = cloudinaryUploadTimeoutMs();
    /** Data URI upload is usually more reliable than `upload_stream` for small buffers from JSON base64. */
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

    const result = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new Error(
            `Image upload timed out after ${timeoutMs}ms (check CLOUDINARY_URL and network)`
          )
        );
      }, timeoutMs);
      cloudinary.uploader.upload(
        dataUri,
        { folder, resource_type: "image" },
        (err, res) => {
          clearTimeout(timer);
          err ? reject(err) : resolve(res);
        }
      );
    });

    return {
      imagePath: null,
      imageUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
    };
  }

  const ext = extensionFromFile(file.mimetype, file.originalname);
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const rel = path.join("trainers", filename).replace(/\\/g, "/");
  const full = path.join(uploadsRoot, rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, file.buffer);

  return {
    imagePath: rel,
    imageUrl: null,
    cloudinaryPublicId: null,
  };
}

/**
 * @param {string | null | undefined} relativePath
 */
async function safeUnlinkLocal(relativePath) {
  if (!relativePath || typeof relativePath !== "string") return;
  const full = path.join(uploadsRoot, relativePath);
  try {
    await fs.unlink(full);
  } catch {
    /* ignore */
  }
}

/**
 * Deletes a previously stored trainer image (Cloudinary asset and/or local file).
 * @param {{ imagePath?: string | null; cloudinaryPublicId?: string | null }} stored
 */
export async function removeTrainerStoredImage(stored) {
  if (stored.cloudinaryPublicId && isCloudinaryConfigured()) {
    ensureCloudinaryConfig();
    try {
      await cloudinary.uploader.destroy(stored.cloudinaryPublicId);
    } catch (err) {
      console.warn(
        "[trainer image] Cloudinary destroy failed:",
        err instanceof Error ? err.message : err
      );
    }
  }
  if (stored.imagePath) {
    await safeUnlinkLocal(stored.imagePath);
  }
}
