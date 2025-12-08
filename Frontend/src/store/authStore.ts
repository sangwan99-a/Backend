/**
 * Enhanced Authentication Store
 * Zustand store for auth state, token management, multi-tenant support, and auto-refresh
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User, Tenant, AuthState, ImpersonationSession, TenantAccess } from '@/types/auth';
import { authAPIClient } from '@/services/authAPIClient';

interface AuthStoreState extends AuthState {
  // Core auth methods
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshTokenValue: string, expiresAt: number) => void;
  setMFARequired: (required: boolean, challenge?: string) => void;
  clearAuth: () => void;
  updateTokens: (accessToken: string, expiresAt: number) => void;

        // Tenant management
  switchTenant: (tenantId: string) => Promise<void>;
  setTenants: (tenants: TenantAccess[]) => void;
  setCurrentTenant: (tenant: TenantAccess) => void;  // Token refresh
  refreshAccessToken: () => Promise<boolean>;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  scheduleTokenRefresh: () => void;

  // Session management
  setSessionTimeout: (timeout: number) => void;
  resetSessionTimeout: () => void;
  extendSession: () => Promise<void>;

  // Impersonation (admin)
  startImpersonation: (userId: string, reason: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  setImpersonation: (session: ImpersonationSession | null) => void;

  // Device management
  setDeviceId: (deviceId: string) => void;
  getDeviceId: () => string;

  // Internal state management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Private fields for token refresh management
  refreshTimer?: NodeJS.Timeout;
  sessionTimer?: NodeJS.Timeout;
}

export const useAuthStore = create<AuthStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshTokenValue: null,
        expiresAt: null,
        currentTenant: null,
        tenants: [] as TenantAccess[],
        impersonation: null,
        mfaRequired: false,
        mfaChallenge: undefined,
        loading: false,
        error: null,

        // ===================================================================
        // Authentication Methods
        // ===================================================================

        login: async (email: string, password: string, rememberMe = false) => {
          try {
            set({ loading: true, error: null });
            const response = await authAPIClient.login({ email, password, rememberMe });

            if (response.mfaRequired) {
              set({
                mfaRequired: true,
                mfaChallenge: response.mfaChallenge,
                loading: false,
              });
              return;
            }

            // Set auth state
            set({
              user: response.user,
              accessToken: response.accessToken,
              refreshTokenValue: response.refreshToken,
              expiresAt: Date.now() + response.expiresIn * 1000,
              isAuthenticated: true,
              tenants: response.tenants || [],
              loading: false,
            });

            // Store token in cookie (done by API client)
            authAPIClient.setAuthToken(response.accessToken);

            // Start auto-refresh timer
            get().scheduleTokenRefresh();
            get().startAutoRefresh();
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Login failed',
              loading: false,
            });
            throw error;
          }
        },

        signup: async (data) => {
          try {
            set({ loading: true, error: null });
            const response = await authAPIClient.signup({
              ...data,
              acceptTerms: true,
            });

            set({
              user: response.user,
              accessToken: response.accessToken,
              refreshTokenValue: response.refreshToken,
              expiresAt: Date.now() + response.expiresIn * 1000,
              isAuthenticated: true,
              tenants: response.tenants || [],
              loading: false,
            });

            authAPIClient.setAuthToken(response.accessToken);
            get().scheduleTokenRefresh();
            get().startAutoRefresh();
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Signup failed',
              loading: false,
            });
            throw error;
          }
        },

        logout: async () => {
          try {
            set({ loading: true });
            await authAPIClient.logout();
            get().stopAutoRefresh();
            set({
              isAuthenticated: false,
              user: null,
              accessToken: null,
              refreshTokenValue: null,
              expiresAt: null,
              currentTenant: null,
              tenants: [],
              impersonation: null,
              loading: false,
            });
            authAPIClient.setAuthToken(null);
          } catch (error) {
            // Logout on error too
            get().clearAuth();
            throw error;
          }
        },

        setUser: (user: User) => {
          set({ user, isAuthenticated: !!user });
        },

        setTokens: (accessToken: string, refreshTokenValue: string, expiresAt: number) => {
          set({
            accessToken,
            refreshTokenValue,
            expiresAt,
            isAuthenticated: true,
          });
          authAPIClient.setAuthToken(accessToken);
          get().scheduleTokenRefresh();
        },

        setMFARequired: (required: boolean, challenge?: string) => {
          set({
            mfaRequired: required,
            mfaChallenge: challenge,
          });
        },

        clearAuth: () => {
          get().stopAutoRefresh();
          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshTokenValue: null,
            expiresAt: null,
            currentTenant: null,
            tenants: [],
            impersonation: null,
            mfaRequired: false,
            mfaChallenge: undefined,
            error: null,
          });
          authAPIClient.setAuthToken(null);
        },

        updateTokens: (accessToken: string, expiresAt: number) => {
          set({
            accessToken,
            expiresAt,
          });
          authAPIClient.setAuthToken(accessToken);
          get().scheduleTokenRefresh();
        },

        // ===================================================================
        // Tenant Management
        // ===================================================================

        switchTenant: async (tenantId: string) => {
          try {
            set({ loading: true, error: null });
            const response = await authAPIClient.switchTenant(tenantId);

            const tenant = response.tenants?.find((t) => t.tenantId === tenantId);
            set({
              user: response.user,
              accessToken: response.accessToken,
              refreshTokenValue: response.refreshToken,
              expiresAt: Date.now() + response.expiresIn * 1000,
              currentTenant: tenant || null,
              loading: false,
            });

            authAPIClient.setAuthToken(response.accessToken);
            get().scheduleTokenRefresh();
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to switch tenant',
              loading: false,
            });
            throw error;
          }
        },

        setTenants: (tenants: TenantAccess[]) => {
          set({ tenants });
        },

        setCurrentTenant: (tenant: TenantAccess) => {
          set({ currentTenant: tenant });
        },

        // ===================================================================
        // Token Refresh & Auto-Refresh
        // ===================================================================

        refreshAccessToken: async (): Promise<boolean> => {
          try {
            const { refreshTokenValue } = get();
            if (!refreshTokenValue) {
              get().clearAuth();
              return false;
            }

            const response = await authAPIClient.refreshToken({ refreshToken: refreshTokenValue });

            set({
              accessToken: response.accessToken,
              expiresAt: Date.now() + response.expiresIn * 1000,
            });

            if (response.refreshToken) {
              set({ refreshTokenValue: response.refreshToken });
            }

            authAPIClient.setAuthToken(response.accessToken);
            get().scheduleTokenRefresh();

            return true;
          } catch (error) {
            console.error('Token refresh failed:', error);
            get().clearAuth();
            return false;
          }
        },

        scheduleTokenRefresh: () => {
          const { refreshTimer, expiresAt } = get();

          // Clear existing timer
          if (refreshTimer) {
            clearTimeout(refreshTimer);
          }

          if (!expiresAt) return;

          // Schedule refresh 5 minutes before expiry
          const now = Date.now();
          const refreshAt = expiresAt - 5 * 60 * 1000;
          const delay = Math.max(0, refreshAt - now);

          const timer = setTimeout(() => {
            get().refreshAccessToken();
          }, delay);

          set({ refreshTimer: timer as any });
        },

        startAutoRefresh: () => {
          // Refresh every 30 minutes as backup
          const timer = setInterval(() => {
            const { isAuthenticated, refreshTokenValue } = get();
            if (isAuthenticated && refreshTokenValue) {
              get().refreshAccessToken();
            }
          }, 30 * 60 * 1000);

          set({ refreshTimer: timer as any });
        },

        stopAutoRefresh: () => {
          const { refreshTimer } = get();
          if (refreshTimer) {
            clearInterval(refreshTimer as any);
            set({ refreshTimer: undefined });
          }
        },

        // ===================================================================
        // Session Timeout Management
        // ===================================================================

        setSessionTimeout: (timeout: number) => {
          // Session timeout management
          // Can be implemented via sessionStorage if needed
        },

        resetSessionTimeout: () => {
          const { sessionTimer } = get();

          // Clear existing timer
          if (sessionTimer) {
            clearTimeout(sessionTimer);
          }
        },

        extendSession: async () => {
          try {
            // Refresh token to extend session
            await get().refreshAccessToken();
            get().resetSessionTimeout();
          } catch (error) {
            console.error('Failed to extend session:', error);
          }
        },

        // ===================================================================
        // Impersonation (Admin)
        // ===================================================================

        startImpersonation: async (userId: string, reason: string) => {
          try {
            set({ loading: true, error: null });
            const response = await authAPIClient.startImpersonation({
              targetUserId: userId,
              reason,
            });

            set({
              user: response.user,
              accessToken: response.accessToken,
              refreshTokenValue: response.refreshToken,
              expiresAt: Date.now() + response.expiresIn * 1000,
              impersonation: {
                impersonatedUserId: userId,
                impersonatedBy: get().user?.id || '',
                reason,
                startedAt: new Date(),
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
              },
              loading: false,
            });

            authAPIClient.setAuthToken(response.accessToken);
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Impersonation failed',
              loading: false,
            });
            throw error;
          }
        },

        stopImpersonation: async () => {
          try {
            set({ loading: true, error: null });
            const response = await authAPIClient.stopImpersonation();

            set({
              user: response.user,
              accessToken: response.accessToken,
              refreshTokenValue: response.refreshToken,
              expiresAt: Date.now() + response.expiresIn * 1000,
              impersonation: null,
              loading: false,
            });

            authAPIClient.setAuthToken(response.accessToken);
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to stop impersonation',
              loading: false,
            });
            throw error;
          }
        },

        setImpersonation: (session: ImpersonationSession | null) => {
          set({ impersonation: session });
        },

        // ===================================================================
        // Device Management
        // ===================================================================

        setDeviceId: (deviceId: string) => {
          localStorage.setItem('deviceId', deviceId);
        },

        getDeviceId: (): string => {
          let deviceId = localStorage.getItem('deviceId');
          if (!deviceId) {
            deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('deviceId', deviceId);
          }
          return deviceId;
        },

        // ===================================================================
        // Error & Loading State
        // ===================================================================

        setLoading: (loading: boolean) => {
          set({ loading });
        },

        setError: (error: string | null) => {
          set({ error });
        },

        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'auth-store',
        // Only persist non-sensitive data
        partialize: (state) => ({
          user: state.user,
          currentTenant: state.currentTenant,
          tenants: state.tenants,
          isAuthenticated: state.isAuthenticated,
          // Don't persist tokens - they're stored in httpOnly cookies
        }),
      }
    )
  )
);

export default useAuthStore;
