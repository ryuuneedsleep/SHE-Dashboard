/**
 * SPLD SAFETY - Authentication Context Provider Component
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { AdminUser, LoginCredentials } from '../types/auth.ts';
import { authService } from '../services/authService.ts';
import { AuthContext } from './authContextInstance.ts';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkSession = useCallback(async () => {
    try {
      const activeUser = await authService.getMe();
      setUser(activeUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    authService
      .getMe()
      .then((activeUser) => {
        if (isMounted) {
          setUser(activeUser);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const activeUser = await authService.login(credentials);
    setUser(activeUser);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
