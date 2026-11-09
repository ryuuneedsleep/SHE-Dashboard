import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (currentUser.status !== 'Active') {
    return <Navigate to="/dashboard" replace />;
  }

  // Final Policy Rule: Only QSHE_ADMIN can access administration
  if (currentUser.role !== 'QSHE_ADMIN') {
    return (
      <Navigate
        to="/dashboard"
        state={{
          unauthorized: true,
          message:
            'Access Denied: Administrative and role governance features require QSHE Admin privileges.',
        }}
        replace
      />
    );
  }

  return <>{children}</>;
};

