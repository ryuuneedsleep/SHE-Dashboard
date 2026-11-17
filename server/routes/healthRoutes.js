/**
 * SPLD SAFETY - Health Routes
 * Endpoints for service liveness and database readiness probes
 */

import { Router } from 'express';
import { healthController } from '../controllers/healthController.js';

const router = Router();

// GET /api/v1/health -> API liveness
router.get('/', healthController.getLiveness);

// GET /api/v1/health/db -> Database readiness
router.get('/db', healthController.getDatabaseReadiness);

export default router;
