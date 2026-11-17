/**
 * SPLD SAFETY - AuthContext Instance
 * Separated to satisfy react-refresh/only-export-components
 */

import { createContext } from 'react';
import type { AdminUser, LoginCredentials } from '../types/auth.ts';

export interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
