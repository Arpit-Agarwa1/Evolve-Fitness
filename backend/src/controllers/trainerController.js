import mongoose from "mongoose";
import Trainer from "../models/Trainer.js";
import { sendSuccess, sendError } from "../views/jsonResponse.js";
import {
  saveTrainerImageFile,
  removeTrainerStoredImage,
} from "../services/trainerImageService.js";

const MAX_TRAINER_IMAGE_BYTES = 5 * 1024 * 1024;
/** ~5MB binary in base64 + overhead */
const MAX_BASE64_CHARS = 7 * 1024 * 1024;

/**
 * Build a multer-like file object from JSON `{ imageBase64, imageMimeType }`.
 * @param {Record<string, unknown>} body
 */
function fileFromImageBase64(body) {
  const b64 = body?.imageBase64;
  if (b64 == null || (typeof b64 === "string" && !b64.trim())) return null;
  if (typeof b64 !== "string") {
    throw new Error("Invalid image payload");
  }
  if (b64.length > MAX_BASE64_CHARS) {
    throw new Error("Image too large (max 5MB)");
  }
  const mime = String(body.imageMimeType || "image/jpeg").toLowerCase();
  if (!/^image\/(jpeg|png|webp|gif)$/.test(mime)) {
    throw new Error("Only JPEG, PNG, WebP, or GIF images are allowed");
  }
  const buffer = Buffer.from(b64, "base64");
  if (buffer.length > MAX_TRAINER_IMAGE_BYTES) {
    throw new Error("Image too large (max 5MB)");
  }
  return {
    fieldname: "image",
    originalname: "upload.jpg",
    encoding: "7bit",
    mimetype: mime,
    buffer,
    size: buffer.length,
  };
}

/**
 * Public site only shows active trainers (legacy docs without `isActive` count as visible).
 */
const publicTrainerFilter = {
  $or: [{ isActive: true }, { isActive: { $exists: false } }],
};

/**
 * GET /api/trainers — public list (sorted).
 */
export async function listTrainersPublic(req, res, next) {
  try {
    const items = await Trainer.find(publicTrainerFilter)
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    return sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/trainers — all trainers (active + inactive) for owner console.
 */
export async function listTrainersAdmin(req, res, next) {
  try {
    const items = await Trainer.find()
      .sort({ isActive: -1, sortOrder: 1, createdAt: 1 })
      .lean();
    return sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/trainers — multipart **or** JSON with optional `imageBase64` + `imageMimeType`.
 */
export async function createTrainer(req, res, next) {
  try {
    console.log("[admin/trainers] POST create", {
      contentLength: req.headers["content-length"],
      hasImage: Boolean(req.body?.imageBase64),
    });

    const name = String(req.body?.name ?? "").trim();
    const role = String(req.body?.role ?? "").trim();
    const sortOrderRaw = req.body?.sortOrder;
    let sortOrder = 0;
    if (sortOrderRaw !== undefined && sortOrderRaw !== "") {
      const n = Number.parseInt(String(sortOrderRaw), 10);
      if (!Number.isNaN(n)) sortOrder = n;
    }

    if (!name || !role) {
      return sendError(res, "Name and role are required", 422);
    }

    const isActive =
      req.body?.isActive === undefined ? true : Boolean(req.body.isActive);

    let imagePath = null;
    let imageUrl = null;
    let cloudinaryPublicId = null;

    let file = req.file;
    if (!file && req.body?.imageBase64) {
      try {
        file = fileFromImageBase64(req.body);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Invalid image";
        return sendError(res, msg, 422);
      }
    }

    if (file) {
      try {
        const saved = await saveTrainerImageFile(file);
        imagePath = saved.imagePath;
        imageUrl = saved.imageUrl;
        cloudinaryPublicId = saved.cloudinaryPublicId;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Could not upload trainer image";
        return sendError(res, msg, 502);
      }
    }

    const doc = await Trainer.create({
      name,
      role,
      sortOrder,
      isActive,
      imagePath,
      imageUrl,
      cloudinaryPublicId,
    });
    return sendSuccess(res, { trainer: doc.toObject() }, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/trainers/:id — multipart **or** JSON; `imageBase64` replaces photo when present.
 */
export async function updateTrainer(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Invalid trainer id", 400);
    }

    const trainer = await Trainer.findById(id);
    if (!trainer) {
      return sendError(res, "Trainer not found", 404);
    }

    if (req.body?.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return sendError(res, "Name cannot be empty", 422);
      trainer.name = name;
    }
    if (req.body?.role !== undefined) {
      const role = String(req.body.role).trim();
      if (!role) return sendError(res, "Role cannot be empty", 422);
      trainer.role = role;
    }
    if (req.body?.sortOrder !== undefined && req.body.sortOrder !== "") {
      const n = Number.parseInt(String(req.body.sortOrder), 10);
      if (!Number.isNaN(n)) trainer.sortOrder = n;
    }
    if (req.body?.isActive !== undefined) {
      trainer.isActive = Boolean(req.body.isActive);
    }

    let file = req.file;
    if (!file && req.body?.imageBase64) {
      try {
        file = fileFromImageBase64(req.body);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Invalid image";
        return sendError(res, msg, 422);
      }
    }

    if (file) {
      const previous = {
        imagePath: trainer.imagePath,
        cloudinaryPublicId: trainer.cloudinaryPublicId,
      };
      try {
        const saved = await saveTrainerImageFile(file);
        trainer.imagePath = saved.imagePath;
        trainer.imageUrl = saved.imageUrl;
        trainer.cloudinaryPublicId = saved.cloudinaryPublicId;
        await trainer.save();
        await removeTrainerStoredImage(previous);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Could not upload trainer image";
        return sendError(res, msg, 502);
      }
    } else {
      await trainer.save();
    }

    return sendSuccess(res, { trainer: trainer.toObject() });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/trainers/:id — removes DB row and stored image.
 */
export async function deleteTrainer(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Invalid trainer id", 400);
    }

    const trainer = await Trainer.findByIdAndDelete(id);
    if (!trainer) {
      return sendError(res, "Trainer not found", 404);
    }

    await removeTrainerStoredImage({
      imagePath: trainer.imagePath,
      cloudinaryPublicId: trainer.cloudinaryPublicId,
    });

    return sendSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}
