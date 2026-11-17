/**
 * SPLD SAFETY - Neon PostgreSQL Database Configuration
 * Uses @neondatabase/serverless over HTTP for serverless edge/lambda compatibility
 */

import { neon, Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Get active connection string from environment
 * @returns {string | undefined}
 */
export function getConnectionString() {
  return process.env.DATABASE_URL?.trim();
}

/**
 * Check whether DATABASE_URL is configured
 * @returns {boolean}
 */
export function isDatabaseConfigured() {
  const cs = getConnectionString();
  return Boolean(cs && cs.length > 0);
}

/**
 * Get SQL query executor instance over HTTP (low-latency connectionless)
 * Throws a safe error if DATABASE_URL is missing
 */
let sqlInstance = null;

export function getDb() {
  const cs = getConnectionString();
  if (!cs) {
    throw new Error('DATABASE_NOT_CONFIGURED');
  }

  if (!sqlInstance) {
    try {
      sqlInstance = neon(cs);
    } catch (err) {
      throw new Error(`DATABASE_INITIALIZATION_ERROR: ${err.message}`);
    }
  }

  return sqlInstance;
}

/**
 * Get WebSocket Connection Pool instance for interactive transactions & row locking
 */
let poolInstance = null;

export function getPool() {
  const cs = getConnectionString();
  if (!cs) {
    throw new Error('DATABASE_NOT_CONFIGURED');
  }

  if (!poolInstance) {
    try {
      poolInstance = new Pool({ connectionString: cs });
    } catch (err) {
      throw new Error(`POOL_INITIALIZATION_ERROR: ${err.message}`);
    }
  }

  return poolInstance;
}

/**
 * Safely close and reset pool instance
 */
export async function resetPool() {
  if (poolInstance) {
    await poolInstance.end().catch(() => {});
    poolInstance = null;
  }
}

/**
 * Execute an interactive transaction over a dedicated connection via Pool.
 * Holds locks (such as SELECT ... FOR UPDATE) continuously across multiple statements.
 * @template T
 * @param {(client: any) => Promise<T>} callback
 * @returns {Promise<T>}
 */
export async function withTransaction(callback) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Ignore rollback errors if connection was severed
    }
    throw err;
  } finally {
    client.release();
  }
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
  getConnectionString,
  isDatabaseConfigured,
  getDb,
  getPool,
  resetPool,
  withTransaction,
  sql,
};
