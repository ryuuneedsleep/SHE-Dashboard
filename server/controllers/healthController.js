/**
 * SPLD SAFETY - Health Controller
 * Manages HTTP requests & responses for system liveness and database readiness
 */

import { healthModel } from '../models/healthModel.js';

export const healthController = {
  /**
   * GET /api/v1/health
   * Liveness Probe - verifies that Express API is active and accepting requests
   */
  getLiveness(req, res) {
    return res.status(200).json({
      success: true,
      message: 'SPLD SAFETY API is running',
      data: {
        api: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
    });
  },

  /**
   * GET /api/v1/health/db
   * Readiness Probe - verifies active connectivity to Neon PostgreSQL database
   */
  async getDatabaseReadiness(req, res) {
    try {
      const dbStatus = await healthModel.checkDatabaseHealth();
      return res.status(200).json({
        success: true,
        message: 'Database connection successful',
        data: {
          api: 'healthy',
          database: dbStatus.database,
          databaseTime: dbStatus.databaseTime,
        },
      });
    } catch (err) {
      if (err.code === 'DATABASE_NOT_CONFIGURED') {
        return res.status(503).json({
          success: false,
          code: 'DATABASE_NOT_CONFIGURED',
          message: 'Database connection is not configured. Please set DATABASE_URL in .env',
        });
      }

      return res.status(503).json({
        success: false,
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection failed or is currently unavailable',
      });
    }
  },
};

export default healthController;
