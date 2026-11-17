/**
 * SPLD SAFETY - Finding Routes
 * API endpoints for K3 Safety Finding Management
 */

import { Router } from 'express';
import { findingController } from '../controllers/findingController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All finding endpoints are strictly protected by authMiddleware
router.use(authMiddleware);

// GET /api/v1/findings - Paginated list, search, and filters
router.get('/', findingController.getFindings);

// GET /api/v1/findings/:id - Single finding details with history and evidence
router.get('/:id', findingController.getFindingById);

// POST /api/v1/findings - Create new finding
router.post('/', findingController.createFinding);

// PUT /api/v1/findings/:id - Update finding details
router.put('/:id', findingController.updateFinding);

// PUT /api/v1/findings/:id/status - Update finding status transition
router.put('/:id/status', findingController.updateFindingStatus);

// DELETE /api/v1/findings/:id - Soft archive finding
router.delete('/:id', findingController.archiveFinding);

// Evidence Management Endpoints (Strictly protected by Administrator authentication)
router.post('/:id/evidence/upload-presign', findingController.uploadPresign);
router.post('/:id/evidence/confirm', findingController.confirmEvidence);
router.get('/:id/evidence/:evidenceId/content', findingController.getEvidenceContent);
router.delete('/:id/evidence/:evidenceId', findingController.deleteEvidence);

export default router;
