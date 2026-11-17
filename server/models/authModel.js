/**
 * SPLD SAFETY - Authentication Model
 * Data layer for Administrator accounts and Session management in Neon PostgreSQL
 */

import { sql } from '../config/database.js';

export const authModel = {
  /**
   * Find an administrator by email (case-insensitive)
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findAdminByEmail(email) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    const rows = await sql.query(
      `SELECT id, email, password_hash, full_name, phone, position, is_active, created_at, updated_at
       FROM admin_users 
       WHERE LOWER(email) = LOWER($1) 
       LIMIT 1;`,
      [normalized]
    );
    return rows[0] || null;
  },

  /**
   * Find an administrator by ID
   * @param {string} id - UUID
   * @returns {Promise<Object|null>}
   */
  async findAdminById(id) {
    if (!id) return null;
    const rows = await sql.query(
      `SELECT id, email, full_name, phone, position, is_active, created_at, updated_at
       FROM admin_users 
       WHERE id = $1 
       LIMIT 1;`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create a new session record in Neon
   * @param {Object} params
   * @param {string} params.adminId - UUID
   * @param {string} params.tokenHash - SHA-256 hash of raw session token
   * @param {Date|string} params.expiresAt - Expiration timestamp
   * @param {string|null} params.userAgent - User agent header
   * @returns {Promise<Object>}
   */
  async createSession({ adminId, tokenHash, expiresAt, userAgent = null }) {
    const rows = await sql.query(
      `INSERT INTO admin_sessions (admin_id, token_hash, expires_at, user_agent)
       VALUES ($1, $2, $3, $4)
       RETURNING id, admin_id, expires_at, created_at;`,
      [adminId, tokenHash, expiresAt, userAgent]
    );
    return rows[0];
  },

  /**
   * Look up an active, unrevoked, non-expired session by token hash
   * @param {string} tokenHash - SHA-256 hash of token
   * @returns {Promise<Object|null>}
   */
  async findValidSessionByTokenHash(tokenHash) {
    if (!tokenHash) return null;
    const rows = await sql.query(
      `SELECT 
         s.id AS session_id,
         s.admin_id,
         s.expires_at,
         s.revoked_at,
         u.id,
         u.email,
         u.full_name,
         u.phone,
         u.position,
         u.is_active
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.admin_id
       WHERE s.token_hash = $1
         AND s.revoked_at IS NULL
         AND s.expires_at > NOW()
         AND u.is_active = TRUE
       LIMIT 1;`,
      [tokenHash]
    );
    return rows[0] || null;
  },

  /**
   * Revoke a session by token hash
   * @param {string} tokenHash
   * @returns {Promise<boolean>}
   */
  async revokeSessionByTokenHash(tokenHash) {
    if (!tokenHash) return false;
    const rows = await sql.query(
      `UPDATE admin_sessions 
       SET revoked_at = NOW() 
       WHERE token_hash = $1 AND revoked_at IS NULL
       RETURNING id;`,
      [tokenHash]
    );
    return rows.length > 0;
  },

  /**
   * Count total existing administrators
   * @returns {Promise<number>}
   */
  async countAdmins() {
    const rows = await sql.query('SELECT COUNT(*)::int AS count FROM admin_users;');
    return rows[0]?.count || 0;
  },

  /**
   * Insert a new administrator (used by createAdmin script)
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async createAdmin({ email, passwordHash, fullName, phone = null, position = null }) {
    const normalizedEmail = email.trim().toLowerCase();
    const rows = await sql.query(
      `INSERT INTO admin_users (email, password_hash, full_name, phone, position, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, email, full_name, phone, position, is_active, created_at;`,
      [normalizedEmail, passwordHash, fullName.trim(), phone?.trim() || null, position?.trim() || null]
    );
    return rows[0];
  },
};

export default authModel;
