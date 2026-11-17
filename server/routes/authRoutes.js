/**
 * SPLD SAFETY - Authentication Routes
 * API v1 endpoints for Administrator login, session verification, and logout
 */

import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Rate limiter for login endpoint to protect against brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  limit: 10, // Max 10 failed/successful attempts per IP
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.',
  },
});

// POST /api/v1/auth/login
router.post('/login', loginLimiter, authController.login);

// GET /api/v1/auth/me (Protected by authMiddleware)
router.get('/me', authMiddleware, authController.getMe);

// POST /api/v1/auth/logout
router.post('/logout', authController.logout);

export default router;
