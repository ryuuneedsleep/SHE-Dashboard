/**
 * SPLD SAFETY - Centralized Error Handling Middleware
 * Ensures safe, structured JSON error responses without leaking server stack traces
 * or internal driver/database messages in production.
 */

export function errorMiddleware(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Server-side logging for internal monitoring and debugging
  if (statusCode >= 500) {
    console.error(`[SERVER ERROR] ${req?.method || 'UNKNOWN'} ${req?.url || ''}:`, err);
  }

  // Specific check for malformed JSON request bodies
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      code: 'BAD_REQUEST',
      message: 'Malformed JSON payload in request body',
    });
  }

  // In production, sanitize 500 internal errors to prevent exposing raw DB/driver exceptions
  const userSafeMessage =
    statusCode >= 500 && isProduction
      ? 'Terjadi kesalahan internal pada server. Silakan coba beberapa saat lagi.'
      : err.message || 'An unexpected internal server error occurred';

  return res.status(statusCode).json({
    success: false,
    code: err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
    message: userSafeMessage,
    ...(isProduction ? {} : { debugCode: err.name }),
  });
}

export default errorMiddleware;
