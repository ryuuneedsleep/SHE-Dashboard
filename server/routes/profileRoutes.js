/**
 * SPLD SAFETY - Profile Routes
 * API endpoints for Administrator Profile retrieval and updates
 */

import { Router } from 'express';
import { profileController } from '../controllers/profileController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Profile endpoints strictly protected by authMiddleware
router.use(authMiddleware);

// GET /api/v1/profile
router.get('/', profileController.getProfile);

// PUT /api/v1/profile
router.put('/', profileController.updateProfile);

export default router;
