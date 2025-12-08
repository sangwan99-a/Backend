/**
 * Auth Provider Component
 * Wraps app with authentication context and token refresh logic
 */

import React, { useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import { authAPIClient } from '@/services/authAPIClient';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { refreshAccessToken, getDeviceId, isAuthenticated, user } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    // Check for valid session and set device ID
    getDeviceId();

    // Start auto-refresh timer
    const refreshInterval = setInterval(() => {
      if (isAuthenticated) {
        refreshAccessToken();
      }
    }, 30 * 60 * 1000); // Refresh every 30 minutes

    // Listen for token expiration events
    const handleTokenExpired = () => {
      refreshAccessToken();
    };

    window.addEventListener('token-expired', handleTokenExpired);

    // Listen for storage changes (multi-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-store' && e.newValue) {
        // Reload auth state from storage
        const newState = JSON.parse(e.newValue);
        if (newState && newState.state) {
          // Auth state was updated in another tab
          window.location.reload();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('token-expired', handleTokenExpired);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated, refreshAccessToken, getDeviceId]);

  // Set auth token in API client when user logs in
  useEffect(() => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      authAPIClient.setAuthToken(accessToken);
    }
  }, [user]);

  return <>{children}</>;
};

export default AuthProvider;
