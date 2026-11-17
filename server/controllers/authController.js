/**
 * SPLD SAFETY - Authentication Controller
 * Handles login, session verification (/me), and logout for Administrator
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { authModel } from '../models/authModel.js';
import { SESSION_COOKIE_NAME, hashSessionToken } from '../middleware/authMiddleware.js';

// Precomputed 12-round bcrypt hash for constant-time comparison on nonexistent user lookup
const TIMING_SAFE_DUMMY_HASH = '$2b$12$6/7Q1E5.e8N9Kj1G3uGk1uH4V5W6X7Y8Z9a0b1c2d3e4f5g6h7i8j';
const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000; // 8 hours

export const authController = {
  /**
   * POST /api/v1/auth/login
   * Authenticate administrator and issue HTTP-only session cookie
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body || {};

      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({
          success: false,
          code: 'INVALID_CREDENTIALS',
          message: 'Email dan password wajib diisi.',
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const admin = await authModel.findAdminByEmail(normalizedEmail);

      // Account not found or deactivated
      if (!admin || !admin.is_active) {
        // Run dummy compare to equalize response time and prevent timing attacks
        await bcrypt.compare(password, TIMING_SAFE_DUMMY_HASH);
        return res.status(401).json({
          success: false,
          code: 'INVALID_CREDENTIALS',
          message: 'Email atau password tidak valid.',
        });
      }

      // Verify password against stored bcrypt hash
      const isMatch = await bcrypt.compare(password, admin.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          code: 'INVALID_CREDENTIALS',
          message: 'Email atau password tidak valid.',
        });
      }

      // Generate high-entropy 256-bit session token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashSessionToken(rawToken);
      const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
      const userAgent = req.headers['user-agent'] || null;

      // Store hashed token in Neon PostgreSQL
      await authModel.createSession({
        adminId: admin.id,
        tokenHash,
        expiresAt,
        userAgent,
      });

      // Set HTTP-only secure cookie
      res.cookie(SESSION_COOKIE_NAME, rawToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_LIFETIME_MS,
      });

      return res.status(200).json({
        success: true,
        message: 'Login berhasil',
        data: {
          user: {
            id: admin.id,
            email: admin.email,
            fullName: admin.full_name,
            phone: admin.phone,
            position: admin.position,
          },
        },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/v1/auth/me
   * Retrieve currently authenticated administrator profile
   */
  async getMe(req, res, next) {
    try {
      // req.user is guaranteed by authMiddleware
      return res.status(200).json({
        success: true,
        message: 'Sesi aktif terverifikasi',
        data: {
          user: {
            id: req.user.id,
            email: req.user.email,
            fullName: req.user.fullName,
            phone: req.user.phone,
            position: req.user.position,
          },
        },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/v1/auth/logout
   * Revoke active session in database and clear browser cookie
   */
  async logout(req, res, next) {
    try {
      const rawToken = req.cookies?.[SESSION_COOKIE_NAME];

      if (rawToken && typeof rawToken === 'string') {
        const tokenHash = hashSessionToken(rawToken);
        await authModel.revokeSessionByTokenHash(tokenHash);
      }

      // Clear cookie from client browser
      res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      return res.status(200).json({
        success: true,
        message: 'Logout berhasil',
      });
    } catch (err) {
      return next(err);
    }
  },
};

export default authController;
