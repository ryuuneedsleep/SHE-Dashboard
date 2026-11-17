/**
 * SPLD SAFETY - Authentication Middleware
 * Enforces session verification via Neon PostgreSQL database
 */

import crypto from 'crypto';
import { authModel } from '../models/authModel.js';

export const SESSION_COOKIE_NAME = 'spld_admin_session';

/**
 * Hash raw session token using SHA-256
 * @param {string} rawToken
 * @returns {string}
 */
export function hashSessionToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Verify administrator session from HTTP cookie
 */
export async function authMiddleware(req, res, next) {
  try {
    const rawToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (!rawToken || typeof rawToken !== 'string') {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Sesi tidak ditemukan. Silakan login kembali.',
      });
    }

    const tokenHash = hashSessionToken(rawToken);
    const session = await authModel.findValidSessionByTokenHash(tokenHash);

    if (!session) {
      // Session expired, revoked, or administrator deactivated
      res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Sesi tidak valid atau telah kedaluwarsa.',
      });
    }

    // Attach validated administrator details to request
    req.user = {
      id: session.id,
      email: session.email,
      fullName: session.full_name,
      phone: session.phone,
      position: session.position,
      isActive: session.is_active,
    };

    req.session = {
      id: session.session_id,
      adminId: session.admin_id,
      tokenHash,
    };

    return next();
  } catch (err) {
    return next(err);
  }
}

export default authMiddleware;
