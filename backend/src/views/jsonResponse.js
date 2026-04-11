/**
 * API “view” layer — consistent JSON envelopes for controllers.
 */

/**
 * @param {import('express').Response} res
 * @param {unknown} [data]
 * @param {number} [status]
 */
export function sendSuccess(res, data = null, status = 200) {
  const body = { success: true };
  if (data !== null && data !== undefined) body.data = data;
  return res.status(status).json(body);
}

/**
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [status]
 * @param {unknown} [errors]
 */
export function sendError(res, message, status = 400, errors = undefined) {
  const body = { success: false, message };
  if (errors !== undefined) body.errors = errors;
  return res.status(status).json(body);
}
