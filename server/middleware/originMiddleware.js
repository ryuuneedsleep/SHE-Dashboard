/**
 * SPLD SAFETY - Origin & CSRF Protection Middleware
 * Enforces strict origin checking for state-changing requests and dynamic CORS headers without wildcards
 */

/**
 * Parse configured allowed origins from environment variable and local dev defaults
 * @returns {Set<string>}
 */
export function parseAllowedOrigins() {
  const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];

  const devOrigins =
    process.env.NODE_ENV === 'production'
      ? []
      : [
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3001',
        ];

  return new Set([...devOrigins, ...envOrigins]);
}

/**
 * Check whether the given origin is permitted
 * @param {string} requestOrigin
 * @param {Object} req - Express request
 * @returns {boolean}
 */
export function isOriginAllowed(requestOrigin, req) {
  if (!requestOrigin || typeof requestOrigin !== 'string') return false;

  const allowedOrigins = parseAllowedOrigins();
  if (allowedOrigins.has(requestOrigin)) {
    return true;
  }

  // Same-origin matching against current Host header (e.g. deployed domain)
  const host = req?.headers?.host;
  if (host) {
    if (requestOrigin === `http://${host}` || requestOrigin === `https://${host}`) {
      return true;
    }
  }

  return false;
}

/**
 * Express middleware for Origin and CSRF validation
 */
export function originMiddleware(req, res, next) {
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // 1. Manage CORS headers strictly (Never use wildcard '*')
  if (origin) {
    if (isOriginAllowed(origin, req)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
      res.setHeader('Vary', 'Origin');

      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }
    } else {
      // Reject preflight from disallowed origin immediately
      if (req.method === 'OPTIONS') {
        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN_ORIGIN',
          message: 'Origin tidak diizinkan.',
        });
      }
    }
  }

  // 2. CSRF Protection for state-changing HTTP methods
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());

  if (isStateChanging) {
    if (origin) {
      if (!isOriginAllowed(origin, req)) {
        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN_ORIGIN',
          message: 'Akses dari origin tidak diizinkan (CSRF protection).',
        });
      }
    } else if (referer) {
      try {
        const refererOrigin = new URL(referer).origin;
        if (!isOriginAllowed(refererOrigin, req)) {
          return res.status(403).json({
            success: false,
            code: 'FORBIDDEN_ORIGIN',
            message: 'Akses dari referer tidak diizinkan (CSRF protection).',
          });
        }
      } catch {
        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN_ORIGIN',
          message: 'Referer header tidak valid.',
        });
      }
    }
  }

  return next();
}

export default originMiddleware;
