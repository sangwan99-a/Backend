/**
 * Authentication API Client
 * REST API integration for login, logout, MFA, OAuth, SSO, password reset, and user management
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  SignUpRequest,
  TokenRefreshRequest,
  TokenRefreshResponse,
  MFASetupRequest,
  MFASetupResponse,
  MFAVerifyRequest,
  MFAVerifyResponse,
  OAuthTokenRequest,
  OAuthUserInfo,
  SSOLoginRequest,
  PasswordResetRequest,
  PasswordResetVerify,
  PasswordChangeRequest,
  MagicLinkRequest,
  ImpersonationRequest,
  User,
  Session,
  TenantCreateRequest,
  Tenant,
} from '@/types/auth';

export class AuthAPIClient {
  private client: AxiosInstance;
  private baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Include cookies for httpOnly token
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for 401 handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, trigger refresh
          window.dispatchEvent(new Event('token-expired'));
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set auth token for requests
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  // =========================================================================
  // Authentication
  // =========================================================================

  /**
   * Login with email and password
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>('/auth/login', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Login failed');
    }
  }

  /**
   * Signup with email, password, and profile
   */
  async signup(request: SignUpRequest): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>('/auth/signup', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Signup failed');
    }
  }

  /**
   * Logout current session
   */
  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
      this.authToken = null;
    } catch (error) {
      throw this.handleError(error, 'Logout failed');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(request: TokenRefreshRequest): Promise<TokenRefreshResponse> {
    try {
      const response = await this.client.post<TokenRefreshResponse>('/auth/refresh', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Token refresh failed');
    }
  }

  // =========================================================================
  // Multi-Factor Authentication (MFA)
  // =========================================================================

  /**
   * Setup MFA - Get QR code or WebAuthn challenge
   */
  async setupMFA(request: MFASetupRequest): Promise<MFASetupResponse> {
    try {
      const response = await this.client.post<MFASetupResponse>('/auth/mfa/setup', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'MFA setup failed');
    }
  }

  /**
   * Verify MFA setup - Enable MFA with code or WebAuthn
   */
  async verifyMFASetup(request: MFAVerifyRequest): Promise<MFAVerifyResponse> {
    try {
      const response = await this.client.post<MFAVerifyResponse>('/auth/mfa/verify-setup', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'MFA verification failed');
    }
  }

  /**
   * Verify MFA during login
   */
  async verifyMFALogin(mfaChallenge: string, request: MFAVerifyRequest): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>('/auth/mfa/verify', {
        ...request,
        mfaChallenge,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'MFA verification failed');
    }
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(): Promise<void> {
    try {
      await this.client.post('/auth/mfa/disable');
    } catch (error) {
      throw this.handleError(error, 'Failed to disable MFA');
    }
  }

  /**
   * Get backup codes for recovery
   */
  async getBackupCodes(): Promise<{ codes: string[] }> {
    try {
      const response = await this.client.get<{ codes: string[] }>('/auth/mfa/backup-codes');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get backup codes');
    }
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(): Promise<{ codes: string[] }> {
    try {
      const response = await this.client.post<{ codes: string[] }>('/auth/mfa/regenerate-backup-codes');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to regenerate backup codes');
    }
  }

  // =========================================================================
  // OAuth (Social Login)
  // =========================================================================

  /**
   * Get OAuth authorization URL
   */
  async getOAuthUrl(provider: string): Promise<{ authUrl: string; state: string }> {
    try {
      const response = await this.client.get<{ authUrl: string; state: string }>(
        `/auth/oauth/${provider}/authorize`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get OAuth URL');
    }
  }

  /**
   * Exchange OAuth code for tokens
   */
  async exchangeOAuthCode(request: OAuthTokenRequest): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>('/auth/oauth/callback', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'OAuth exchange failed');
    }
  }

  /**
   * Get connected OAuth accounts
   */
  async getConnectedAccounts(): Promise<{ provider: string; email: string; connectedAt: Date }[]> {
    try {
      const response = await this.client.get('/auth/oauth/accounts');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get connected accounts');
    }
  }

  /**
   * Disconnect OAuth account
   */
  async disconnectOAuthAccount(provider: string): Promise<void> {
    try {
      await this.client.delete(`/auth/oauth/accounts/${provider}`);
    } catch (error) {
      throw this.handleError(error, 'Failed to disconnect account');
    }
  }

  // =========================================================================
  // SSO (SAML/OIDC)
  // =========================================================================

  /**
   * Login with SSO
   */
  async loginSSO(request: SSOLoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>('/auth/sso/login', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'SSO login failed');
    }
  }

  /**
   * Get SSO configuration for tenant
   */
  async getSSOConfiguration(tenantId: string): Promise<{ configured: boolean; provider?: string }> {
    try {
      const response = await this.client.get(`/auth/sso/config/${tenantId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get SSO configuration');
    }
  }

  // =========================================================================
  // Password Management
  // =========================================================================

  /**
   * Request password reset
   */
  async requestPasswordReset(request: PasswordResetRequest): Promise<void> {
    try {
      await this.client.post('/auth/password-reset/request', request);
    } catch (error) {
      throw this.handleError(error, 'Password reset request failed');
    }
  }

  /**
   * Verify and complete password reset
   */
  async verifyPasswordReset(request: PasswordResetVerify): Promise<void> {
    try {
      await this.client.post('/auth/password-reset/verify', request);
    } catch (error) {
      throw this.handleError(error, 'Password reset verification failed');
    }
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(request: PasswordChangeRequest): Promise<void> {
    try {
      await this.client.post('/auth/password/change', request);
    } catch (error) {
      throw this.handleError(error, 'Password change failed');
    }
  }

  // =========================================================================
  // Passwordless Login
  // =========================================================================

  /**
   * Request magic link
   */
  async requestMagicLink(request: MagicLinkRequest): Promise<void> {
    try {
      await this.client.post('/auth/magic-link/request', request);
    } catch (error) {
      throw this.handleError(error, 'Magic link request failed');
    }
  }

  /**
   * Verify magic link
   */
  async verifyMagicLink(token: string): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>('/auth/magic-link/verify', { token });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Magic link verification failed');
    }
  }

  // =========================================================================
  // User Profile & Settings
  // =========================================================================

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.client.get<User>('/auth/user/profile');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get user profile');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await this.client.patch<User>('/auth/user/profile', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to update profile');
    }
  }

  /**
   * Upload profile avatar
   */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await this.client.post<{ avatarUrl: string }>(
        '/auth/user/avatar',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to upload avatar');
    }
  }

  // =========================================================================
  // Tenant Management
  // =========================================================================

  /**
   * Get list of accessible tenants
   */
  async getTenants(): Promise<Tenant[]> {
    try {
      const response = await this.client.get<Tenant[]>('/auth/tenants');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get tenants');
    }
  }

  /**
   * Switch to different tenant
   */
  async switchTenant(tenantId: string): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>('/auth/switch-tenant', { tenantId });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to switch tenant');
    }
  }

  /**
   * Create new tenant
   */
  async createTenant(request: TenantCreateRequest): Promise<Tenant> {
    try {
      const response = await this.client.post<Tenant>('/tenants', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create tenant');
    }
  }

  // =========================================================================
  // Session Management
  // =========================================================================

  /**
   * Get all active sessions
   */
  async getSessions(): Promise<Session[]> {
    try {
      const response = await this.client.get<Session[]>('/auth/sessions');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get sessions');
    }
  }

  /**
   * Revoke specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      await this.client.delete(`/auth/sessions/${sessionId}`);
    } catch (error) {
      throw this.handleError(error, 'Failed to revoke session');
    }
  }

  /**
   * Logout all other sessions
   */
  async logoutAllOtherSessions(): Promise<void> {
    try {
      await this.client.post('/auth/sessions/logout-others');
    } catch (error) {
      throw this.handleError(error, 'Failed to logout other sessions');
    }
  }

  // =========================================================================
  // Admin Impersonation
  // =========================================================================

  /**
   * Start impersonating user (admin only)
   */
  async startImpersonation(request: ImpersonationRequest): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>('/auth/impersonate', request);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to start impersonation');
    }
  }

  /**
   * Stop impersonation and return to admin account
   */
  async stopImpersonation(): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>('/auth/impersonate/stop');
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to stop impersonation');
    }
  }

  // =========================================================================
  // Error Handling
  // =========================================================================

  private handleError(error: any, defaultMessage: string): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data as any;

      // Handle specific error codes
      if (status === 400) {
        return new Error(data?.message || 'Invalid request');
      }
      if (status === 401) {
        return new Error('Unauthorized - Please login again');
      }
      if (status === 403) {
        return new Error('Forbidden - You do not have permission');
      }
      if (status === 404) {
        return new Error('Not found');
      }
      if (status === 429) {
        return new Error(
          `Too many attempts - Please try again in ${data?.retryAfter || 15} minutes`
        );
      }
      if (status === 500) {
        return new Error('Server error - Please try again later');
      }

      return new Error(data?.message || defaultMessage);
    }

    return new Error(defaultMessage);
  }
}

export const authAPIClient = new AuthAPIClient();
