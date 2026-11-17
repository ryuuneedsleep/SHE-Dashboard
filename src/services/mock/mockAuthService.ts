/**
 * SPLD SAFETY - Final Project Refactoring
 * Mock Authentication Service
 *
 * Single Administrator model with browser-session simulation.
 * Clearly identified as DEMO MODE.
 */

import type { AdminUser, AdminSession, LoginCredentials, ProfileUpdateInput } from '../../types/auth.ts';

const SESSION_STORAGE_KEY = 'spld_safety_admin_session';

export const DEMO_ADMIN_USER: AdminUser = {
  id: 'usr-admin-001',
  name: 'Administrator Demo',
  fullName: 'Administrator Demo',
  email: 'admin@spld-safety.test',
  phone: '0812-3456-7890',
  position: 'Safety Administrator',
  department: 'QSHE & Jiritsuka',
  avatarUrl: undefined,
};

export class MockAuthService {
  private currentSession: AdminSession | null = null;
  private listeners: Array<(session: AdminSession | null) => void> = [];

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        this.currentSession = JSON.parse(stored);
      }
    } catch {
      this.currentSession = null;
    }
  }

  private persistSession(session: AdminSession | null): void {
    if (typeof window === 'undefined') return;
    try {
      if (session) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {
      // storage unavailable or blocked
    }
    this.notifyListeners();
  }

  public subscribe(listener: (session: AdminSession | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentSession);
    }
  }

  public async login(credentials: LoginCredentials): Promise<{ user: AdminUser; token: string }> {
    // In demo mode, accept admin credentials or default admin
    const emailLower = credentials.email.trim().toLowerCase();
    if (!emailLower || !credentials.password) {
      throw new Error('Email dan password wajib diisi.');
    }

    // Default demo admin account
    const user: AdminUser = {
      ...DEMO_ADMIN_USER,
      email: emailLower,
    };

    const session: AdminSession = {
      user,
      token: `demo-token-${Date.now()}`,
      isDemo: true,
      loginAt: new Date().toISOString(),
    };

    this.currentSession = session;
    this.persistSession(session);

    return { user, token: session.token };
  }

  public async logout(): Promise<void> {
    this.currentSession = null;
    this.persistSession(null);
  }

  public getSession(): AdminSession | null {
    if (!this.currentSession && typeof window !== 'undefined') {
      this.restoreSession();
    }
    return this.currentSession;
  }

  public getCurrentUser(): AdminUser | null {
    return this.getSession()?.user ?? null;
  }

  public isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  public async updateProfile(input: ProfileUpdateInput): Promise<AdminUser> {
    const session = this.getSession();
    if (!session) {
      throw new Error('Sesi tidak ditemukan. Harap login kembali.');
    }

    const updatedUser: AdminUser = {
      ...session.user,
      name: input.name.trim(),
      fullName: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      position: input.position.trim(),
      department: input.department.trim(),
    };

    this.currentSession = {
      ...session,
      user: updatedUser,
    };
    this.persistSession(this.currentSession);

    return updatedUser;
  }
}

export const mockAuthService = new MockAuthService();
