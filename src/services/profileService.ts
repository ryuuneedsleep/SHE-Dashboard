/**
 * SPLD SAFETY - Production Profile Service
 * Communicates with Administrator profile endpoints
 */

import type { AdminUser, ProfileUpdateInput } from '../types/auth.ts';

export const profileService = {
  /**
   * Get active administrator profile
   */
  async getProfile(): Promise<AdminUser> {
    const res = await fetch('/api/v1/profile', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });

    const payload = await res.json();
    if (!res.ok || !payload.success || !payload.data) {
      throw new Error(payload.message || 'Gagal memuat profil Administrator.');
    }

    return payload.data;
  },

  /**
   * Update active administrator personal info
   */
  async updateProfile(input: ProfileUpdateInput): Promise<AdminUser> {
    const res = await fetch('/api/v1/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        fullName: input.name,
        name: input.name,
        email: input.email,
        phone: input.phone,
        position: input.position,
      }),
    });

    const payload = await res.json();
    if (!res.ok || !payload.success || !payload.data) {
      throw new Error(payload.message || 'Gagal memperbarui profil Administrator.');
    }

    return payload.data;
  },
};

export default profileService;
