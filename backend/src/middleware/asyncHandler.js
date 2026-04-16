/**
 * Express 4 does not forward rejected promises from async route handlers to `next(err)`,
 * which can leave requests hanging until the proxy returns 502 with an empty body.
 * @param {import('express').RequestHandler} fn
 */
export function asyncHandler(fn) {
  return function asyncHandlerWrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
