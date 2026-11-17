/**
 * SPLD SAFETY - Centralized Error Handling Middleware
 * Ensures safe, structured JSON error responses without leaking server stack traces
 */

export function errorMiddleware(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Specific check for malformed JSON request bodies
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      code: 'BAD_REQUEST',
      message: 'Malformed JSON payload in request body',
    });
  }

  return res.status(statusCode).json({
    success: false,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected internal server error occurred',
    ...(isProduction ? {} : { debugCode: err.name }),
  });
}

export default errorMiddleware;
