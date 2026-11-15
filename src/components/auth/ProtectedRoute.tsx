import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { mockAuthService } from '../../services/mock/mockAuthService.ts';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const isAuth = mockAuthService.isAuthenticated();

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
