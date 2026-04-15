import mongoose from "mongoose";
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

  console.error(err);

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

  const status = err.status || err.statusCode || 500;
  const message =
    status === 500 ? "Something went wrong" : err.message || "Request failed";

  return sendError(res, message, status);
}
