/**
 * SPLD SAFETY - Dashboard Routes
 * API endpoints for K3 Analytics & KPIs
 */

import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Dashboard endpoint strictly protected by authMiddleware
router.use(authMiddleware);

// GET /api/v1/dashboard
router.get('/', dashboardController.getDashboard);

export default router;
