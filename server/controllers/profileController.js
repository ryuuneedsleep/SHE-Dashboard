/**
 * SPLD SAFETY - Profile Controller
 * Handles Administrator profile retrieval and updates
 */

import { profileModel } from '../models/profileModel.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const profileController = {
  /**
   * GET /api/v1/profile
   * Retrieve active administrator profile
   */
  async getProfile(req, res, next) {
    try {
      const adminId = req.user.id;
      const profile = await profileModel.getProfile(adminId);

      if (!profile) {
        return res.status(404).json({
          success: false,
          code: 'ADMIN_NOT_FOUND',
          message: 'Profil Administrator tidak ditemukan.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Profil Administrator berhasil diambil.',
        data: profile,
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * PUT /api/v1/profile
   * Update active administrator personal info (fullName, email, phone, position)
   */
  async updateProfile(req, res, next) {
    try {
      const adminId = req.user.id;
      const body = req.body || {};

      const fullName = body.fullName || body.full_name || body.name;
      const email = body.email;
      const phone = body.phone;
      const position = body.position;

      if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Nama lengkap wajib diisi.',
        });
      }

      if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Format email tidak valid.',
        });
      }

      const updated = await profileModel.updateProfile(adminId, {
        fullName,
        email,
        phone,
        position,
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          code: 'ADMIN_NOT_FOUND',
          message: 'Profil Administrator tidak ditemukan.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Profil Administrator berhasil diperbarui.',
        data: updated,
      });
    } catch (err) {
      if (err.statusCode === 409 || err.code === 'EMAIL_ALREADY_EXISTS') {
        return res.status(409).json({
          success: false,
          code: 'EMAIL_ALREADY_EXISTS',
          message: err.message || 'Email sudah digunakan oleh akun lain.',
        });
      }
      return next(err);
    }
  },
};

export default profileController;
