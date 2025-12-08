/**
 * Protected Route Component
 * Guards routes that require authentication
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Spinner, Text } from '@fluentui/react-components';
import useAuthStore from '@/store/authStore';

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'manager' | 'member' | 'guest';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuthStore();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}>
        <Spinner label="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/signin" replace />;
  }

  // Check role if required
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        minHeight: '100vh',
        padding: 40,
        textAlign: 'center',
      }}>
        <Text size={700} weight="semibold">
          Access Denied
        </Text>
        <Text size={400}>
          You do not have permission to access this resource
        </Text>
        <a href="/">Return to Dashboard</a>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
