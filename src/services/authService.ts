/**
 * SPLD SAFETY - Production Authentication Service
 * Connects directly to Express.js REST API with HTTP-only cookie session handling
 */

import type { AdminUser, LoginCredentials } from '../types/auth.ts';

export const authService = {
  /**
   * Authenticate administrator credentials
   * Sets HTTP-only cookie spld_admin_session automatically via browser
   */
  async login(credentials: LoginCredentials): Promise<AdminUser> {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      }),
    });

    const payload = (await response.json()) as {
      success: boolean;
      message?: string;
      code?: string;
      data?: {
        user: {
          id: string;
          email: string;
          fullName: string;
          phone: string | null;
          position: string | null;
        };
      };
    };

    if (!response.ok || !payload.success || !payload.data?.user) {
      throw new Error(payload.message || 'Login gagal. Periksa email dan password.');
    }

    const u = payload.data.user;
    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      name: u.fullName,
      phone: u.phone || '',
      position: u.position || '',
      department: 'QSHE & Lead Safety',
    };
  },

  /**
   * Verify whether the browser holds an active, unrevoked session cookie
   */
  async getMe(): Promise<AdminUser | null> {
    try {
      const response = await fetch('/api/v1/auth/me', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as {
        success: boolean;
        data?: {
          user: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            position: string | null;
          };
        };
      };

      if (!payload.success || !payload.data?.user) {
        return null;
      }

      const u = payload.data.user;
      return {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        name: u.fullName,
        phone: u.phone || '',
        position: u.position || '',
        department: 'QSHE & Lead Safety',
      };
    } catch {
      return null;
    }
  },

  /**
   * Terminate active session and clear HTTP cookie
   */
  async logout(): Promise<void> {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        credentials: 'include',
      });
    } catch (err) {
      console.error('Error during logout:', err);
    }
  },
};

export default authService;
