/**
 * SPLD SAFETY - Final Project Refactoring
 * Single Administrator Authentication Types
 */

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  avatarUrl?: string;
}

export interface AdminSession {
  user: AdminUser;
  token: string;
  isDemo: boolean;
  loginAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ProfileUpdateInput {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
}
