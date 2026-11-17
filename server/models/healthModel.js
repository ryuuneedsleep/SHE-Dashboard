/**
 * SPLD SAFETY - Health Model
 * Direct database interactions for liveness and readiness probes
 */

import { sql, isDatabaseConfigured } from '../config/database.js';

export const healthModel = {
  /**
   * Check if Neon database is configured and responds to query
   * @returns {Promise<{ configured: boolean, databaseTime?: string }>}
   */
  async checkDatabaseHealth() {
    if (!isDatabaseConfigured()) {
      const error = new Error('Database connection string is not configured');
      error.code = 'DATABASE_NOT_CONFIGURED';
      throw error;
    }

    try {
      const result = await sql`SELECT NOW() AS database_time;`;
      return {
        configured: true,
        database: 'connected',
        databaseTime: result[0]?.database_time || new Date().toISOString(),
      };
    } catch (err) {
      const error = new Error('Database connection failed or unavailable');
      error.code = 'DATABASE_UNAVAILABLE';
      error.originalMessage = err.message;
      throw error;
    }
  },
};

export default healthModel;
