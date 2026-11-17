/**
 * SPLD SAFETY - Centralized 404 Not Found Middleware
 * Returns consistent JSON response for unmatched routes
 */

export function notFoundMiddleware(req, res) {
  return res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
}

export default notFoundMiddleware;
