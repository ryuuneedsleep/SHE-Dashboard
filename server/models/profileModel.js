/**
 * SPLD SAFETY - Profile Model
 * Data layer for Administrator profile retrieval and updates
 */

import { sql } from '../config/database.js';

export const profileModel = {
  /**
   * Get administrator profile by ID
   */
  async getProfile(adminId) {
    if (!adminId) return null;
    const rows = await sql.query(
      `SELECT id, email, full_name, phone, position, is_active, created_at, updated_at
       FROM admin_users
       WHERE id = $1 AND is_active = TRUE
       LIMIT 1;`,
      [adminId]
    );

    if (rows.length === 0) return null;

    const u = rows[0];
    return {
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      name: u.full_name,
      phone: u.phone || '',
      position: u.position || '',
      department: 'QSHE & Jiritsuka',
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    };
  },

  /**
   * Update administrator profile
   * Checks for email uniqueness conflict against other administrators
   */
  async updateProfile(adminId, { fullName, email, phone = null, position = null }) {
    const normalizedEmail = email.trim().toLowerCase();

    // Check email uniqueness conflict
    const conflictRows = await sql.query(
      `SELECT id FROM admin_users WHERE LOWER(email) = LOWER($1) AND id <> $2 LIMIT 1;`,
      [normalizedEmail, adminId]
    );

    if (conflictRows.length > 0) {
      const err = new Error('Email sudah digunakan oleh akun lain.');
      err.code = 'EMAIL_ALREADY_EXISTS';
      err.statusCode = 409;
      throw err;
    }

    const rows = await sql.query(
      `UPDATE admin_users
       SET full_name = $1,
           email = $2,
           phone = $3,
           position = $4,
           updated_at = NOW()
       WHERE id = $5 AND is_active = TRUE
       RETURNING id, email, full_name, phone, position, is_active, created_at, updated_at;`,
      [fullName.trim(), normalizedEmail, phone?.trim() || null, position?.trim() || null, adminId]
    );

    if (rows.length === 0) return null;

    const u = rows[0];
    return {
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      name: u.full_name,
      phone: u.phone || '',
      position: u.position || '',
      department: 'QSHE & Jiritsuka',
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    };
  },
};

export default profileModel;
