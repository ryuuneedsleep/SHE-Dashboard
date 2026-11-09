import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  if (!currentUser) {
    // Unauthenticated user trying to access operational routes
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Account status verification: only Active can access
  if (currentUser.status !== 'Active') {
    if (currentUser.status === 'Pending') {
      return <Navigate to="/registration-pending" replace />;
    }
    return <Navigate to="/login" state={{ statusDenied: currentUser.status }} replace />;
  }

  return <>{children}</>;
};

