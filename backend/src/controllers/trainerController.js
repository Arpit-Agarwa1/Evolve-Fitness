import mongoose from "mongoose";
import Trainer from "../models/Trainer.js";
import { sendSuccess, sendError } from "../views/jsonResponse.js";
import {
  saveTrainerImageFile,
  removeTrainerStoredImage,
} from "../services/trainerImageService.js";

/**
 * GET /api/trainers — public list (sorted).
 */
export async function listTrainersPublic(req, res, next) {
  try {
    const items = await Trainer.find()
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    return sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/trainers — same payload (owner console).
 */
export async function listTrainersAdmin(req, res, next) {
  return listTrainersPublic(req, res, next);
}

/**
 * POST /api/admin/trainers — multipart: name, role, sortOrder?, image?
 */
export async function createTrainer(req, res, next) {
  try {
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

    let imagePath = null;
    let imageUrl = null;
    let cloudinaryPublicId = null;

    if (req.file) {
      try {
        const saved = await saveTrainerImageFile(req.file);
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
 * PATCH /api/admin/trainers/:id — multipart fields; image replaces photo if provided.
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

    if (req.file) {
      const previous = {
        imagePath: trainer.imagePath,
        cloudinaryPublicId: trainer.cloudinaryPublicId,
      };
      try {
        const saved = await saveTrainerImageFile(req.file);
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
