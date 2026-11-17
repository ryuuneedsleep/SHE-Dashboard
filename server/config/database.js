/**
 * SPLD SAFETY - Neon PostgreSQL Database Configuration
 * Uses @neondatabase/serverless over HTTP for serverless edge/lambda compatibility
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const connectionString = process.env.DATABASE_URL?.trim();

/**
 * Check whether DATABASE_URL is configured
 * @returns {boolean}
 */
export function isDatabaseConfigured() {
  return Boolean(connectionString && connectionString.length > 0);
}

/**
 * Get SQL query executor instance
 * Throws a safe error if DATABASE_URL is missing
 */
let sqlInstance = null;

export function getDb() {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED');
  }

  if (!sqlInstance) {
    try {
      sqlInstance = neon(connectionString);
    } catch (err) {
      throw new Error(`DATABASE_INITIALIZATION_ERROR: ${err.message}`);
    }
  }

  return sqlInstance;
}

/**
 * Safe tagged template query wrapper
 * Usage: await sql`SELECT * FROM admin_users WHERE id = ${userId}`
 */
export async function sql(strings, ...values) {
  const db = getDb();
  return db(strings, ...values);
}

sql.query = async function query(text, params) {
  const db = getDb();
  return db.query(text, params);
};

export default {
  isDatabaseConfigured,
  getDb,
  sql,
};
