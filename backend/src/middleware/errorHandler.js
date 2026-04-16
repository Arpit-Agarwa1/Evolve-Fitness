import mongoose from "mongoose";
import { MulterError } from "multer";
import { applyPinnedCorsHeaders } from "../config/corsHeaders.js";
import { sendError } from "../views/jsonResponse.js";

/**
 * Duplicate key (e.g. unique email) — MongoServerError or wrapped Mongoose error.
 * @param {unknown} err
 */
function isDuplicateKeyError(err) {
  if (!err || typeof err !== "object") return false;
  if ("code" in err && err.code === 11000) return true;
  const cause = "cause" in err ? err.cause : null;
  if (cause && typeof cause === "object" && "code" in cause && cause.code === 11000) {
    return true;
  }
  return false;
}

/**
 * Central error handler — maps Mongoose / unknown errors to JSON responses.
 */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  applyPinnedCorsHeaders(req, res);

  console.error(err);

  if (err?.type === "entity.too.large" || err?.status === 413) {
    return sendError(
      res,
      "Request body too large. Try a smaller image (max 5MB).",
      413
    );
  }

  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendError(res, "Image must be 5MB or smaller", 413);
    }
    return sendError(res, err.message || "Upload failed", 400);
  }

  if (isDuplicateKeyError(err)) {
    return sendError(res, "This record already exists", 409);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v.message])
    );
    return sendError(res, "Validation failed", 422, errors);
  }

  if (err instanceof mongoose.Error.CastError) {
    return sendError(res, "Invalid identifier", 400);
  }

  const status =
    typeof err === "object" &&
    err !== null &&
    ("status" in err || "statusCode" in err)
      ? Number(err.status ?? err.statusCode) || 500
      : 500;
  const message =
    status === 500 ? "Something went wrong" : err.message || "Request failed";

  return sendError(res, message, status);
}
