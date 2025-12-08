/**
 * Authentication & User Management Types
 * Complete domain model for auth flows, MFA, OAuth, SSO, and user management
 */

// ============================================================================
// Core Auth Entities
// ============================================================================

/**
 * User profile with role, preferences, and account status
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  tenantId: string;
  tenants: TenantAccess[];
  preferences: UserPreferences;
  accountSettings: AccountSettings;
  createdAt: Date;
  lastLoginAt?: Date;
  mfaEnabled: boolean;
  webauthnEnabled: boolean;
  passwordChangedAt?: Date;
  emailVerified: boolean;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
  GUEST = 'guest',
}

export enum UserStatus {
  ACTIVE = 'active',
  INVITED = 'invited',
  DISABLED = 'disabled',
  SUSPENDED = 'suspended',
}

/**
 * User access to specific tenant with role
 */
export interface TenantAccess {
  tenantId: string;
  tenantName: string;
  tenantLogo?: string;
  role: UserRole;
  isDefault: boolean;
  joinedAt: Date;
}

/**
 * User preferences and settings
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  emailNotifications: boolean;
  desktopNotifications: boolean;
  notificationFrequency: 'instant' | 'daily' | 'weekly';
  defaultView: string;
  hideOnboardingTour: boolean;
}

/**
 * Account security settings
 */
export interface AccountSettings {
  sessionTimeout: number; // minutes
  requireMFAOnNewDevice: boolean;
  allowPasswordlessLogin: boolean;
  loginNotificationEmail: boolean;
  suspiciousActivityEmail: boolean;
  connectedAccounts: ConnectedAccount[];
}

/**
 * Connected OAuth account
 */
export interface ConnectedAccount {
  id: string;
  provider: 'google' | 'microsoft' | 'github';
  providerUserId: string;
  email: string;
  connectedAt: Date;
  lastUsedAt?: Date;
}

// ============================================================================
// Authentication Credentials & Tokens
// ============================================================================

/**
 * Login request
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceId?: string;
}

/**
 * Signup request
 */
export interface SignUpRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantName?: string; // Create new tenant or join existing
  inviteCode?: string; // For invited users
  acceptTerms: boolean;
}

/**
 * Login response with tokens
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  user: User;
  mfaRequired?: boolean;
  mfaChallenge?: string;
  tenants?: TenantAccess[];
}

/**
 * Token refresh request/response
 */
export interface TokenRefreshRequest {
  refreshToken: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string; // Only if rotating refresh token
}

/**
 * Token payload structure
 */
export interface TokenPayload {
  sub: string; // user id
  email: string;
  tenantId: string;
  role: UserRole;
  iat: number; // issued at
  exp: number; // expiration
  aud: string; // audience
  iss: string; // issuer
}

/**
 * Session information
 */
export interface Session {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'web';
  ipAddress: string;
  userAgent: string;
  isCurrentSession: boolean;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
}

// ============================================================================
// Multi-Factor Authentication (MFA)
// ============================================================================

/**
 * MFA setup/verification methods
 */
export enum MFAMethod {
  TOTP = 'totp', // Google Authenticator
  WEBAUTHN = 'webauthn', // Security keys, biometrics
  EMAIL = 'email', // Email OTP (backup)
  SMS = 'sms', // SMS OTP (backup)
}

/**
 * MFA setup request - get QR code or registration challenge
 */
export interface MFASetupRequest {
  method: MFAMethod;
}

/**
 * MFA setup response - QR code or WebAuthn challenge
 */
export interface MFASetupResponse {
  method: MFAMethod;
  secret?: string; // For TOTP - shared secret
  qrCode?: string; // For TOTP - QR code as data URL
  backupCodes?: string[]; // Backup codes to store safely
  challenge?: {
    challenge: string;
    timeout: number;
    userVerification: 'preferred' | 'required';
    rp: {
      name: string;
      id: string;
    };
    user: {
      id: string;
      name: string;
      displayName: string;
    };
    pubKeyCredParams: Array<{ alg: number; type: string }>;
    attestation: 'direct' | 'indirect' | 'none';
  }; // For WebAuthn
}

/**
 * MFA verification request
 */
export interface MFAVerifyRequest {
  method: MFAMethod;
  code?: string; // For TOTP/SMS/Email
  assertion?: {
    id: string;
    rawId: string;
    response: {
      clientDataJSON: string;
      authenticatorData: string;
      signature: string;
    };
    type: string;
  }; // For WebAuthn
}

/**
 * MFA verification response
 */
export interface MFAVerifyResponse {
  verified: boolean;
  backupCodesRemaining?: number;
  session?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

/**
 * MFA status
 */
export interface MFAStatus {
  enabled: boolean;
  methods: MFAMethodStatus[];
  backupCodesCount: number;
  lastConfiguredAt?: Date;
}

export interface MFAMethodStatus {
  method: MFAMethod;
  enabled: boolean;
  configuredAt?: Date;
  lastUsedAt?: Date;
}

/**
 * Backup codes for recovery
 */
export interface BackupCode {
  code: string;
  usedAt?: Date;
}

// ============================================================================
// OAuth & Social Login
// ============================================================================

/**
 * OAuth provider types
 */
export enum OAuthProvider {
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  GITHUB = 'github',
}

/**
 * OAuth authorization request
 */
export interface OAuthAuthorizationRequest {
  provider: OAuthProvider;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state: string; // CSRF protection
  codeChallenge?: string; // PKCE
  codeChallengeMethod?: string; // PKCE method (S256, plain)
}

/**
 * OAuth authorization response (from provider)
 */
export interface OAuthAuthorizationResponse {
  code: string;
  state: string;
  error?: string;
  errorDescription?: string;
}

/**
 * OAuth token exchange request
 */
export interface OAuthTokenRequest {
  provider: OAuthProvider;
  code: string;
  redirectUri: string;
  codeVerifier?: string; // PKCE
}

/**
 * OAuth user info
 */
export interface OAuthUserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  locale?: string;
  provider: OAuthProvider;
}

// ============================================================================
// SSO (SAML/OIDC)
// ============================================================================

/**
 * SSO configuration for enterprise tenants
 */
export interface SSOConfiguration {
  tenantId: string;
  provider: 'saml' | 'oidc';
  enabled: boolean;
  configuredAt: Date;
  samlConfig?: SAMLConfig;
  oidcConfig?: OIDCConfig;
}

/**
 * SAML configuration
 */
export interface SAMLConfig {
  entityId: string;
  singleSignOnUrl: string;
  singleLogoutUrl?: string;
  certificateFingerprint: string;
  nameIdFormat: string;
  attributeMapping: {
    email: string;
    firstName: string;
    lastName: string;
    groups?: string;
  };
}

/**
 * OIDC configuration
 */
export interface OIDCConfig {
  discoveryUrl: string;
  clientId: string;
  clientSecret: string; // Server-side only
  redirectUri: string;
  responseType: string;
  scopes: string[];
  claimsMapping: {
    email: string;
    firstName: string;
    lastName: string;
    groups?: string;
  };
}

/**
 * SSO login request
 */
export interface SSOLoginRequest {
  tenantId: string;
  samlResponse?: string; // From SAML IdP
  oidcCode?: string; // From OIDC provider
  state?: string;
}

// ============================================================================
// Password & Account Recovery
// ============================================================================

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset token verification/completion
 */
export interface PasswordResetVerify {
  token: string;
  newPassword: string;
}

/**
 * Password change (authenticated user)
 */
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Forgot password email sent
 */
export interface ForgotPasswordResponse {
  message: string;
  resetCodeSent: boolean;
  resetCodeExpiresIn: number; // minutes
}

// ============================================================================
// Passwordless Login
// ============================================================================

/**
 * Magic link request
 */
export interface MagicLinkRequest {
  email: string;
  tenantId?: string;
}

/**
 * Passwordless login configuration
 */
export interface PasswordlessConfig {
  enabled: boolean;
  allowMagicLinks: boolean;
  allowWindowsHello: boolean;
  expirationMinutes: number;
}

// ============================================================================
// Impersonation (Admin)
// ============================================================================

/**
 * Admin impersonation request
 */
export interface ImpersonationRequest {
  targetUserId: string;
  reason: string;
}

/**
 * Impersonation session
 */
export interface ImpersonationSession {
  impersonatedUserId: string;
  impersonatedBy: string;
  reason: string;
  startedAt: Date;
  expiresAt: Date;
}

// ============================================================================
// Tenant Management
// ============================================================================

/**
 * Tenant for multi-tenant support
 */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  plan: TenantPlan;
  subscription: SubscriptionStatus;
  owner: User;
  settings: TenantSettings;
  ssoConfiguration?: SSOConfiguration;
  createdAt: Date;
  updatedAt: Date;
}

export enum TenantPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

/**
 * Tenant settings
 */
export interface TenantSettings {
  allowPublicSignup: boolean;
  requiredDomain?: string; // Email domain requirement
  ssoRequired: boolean;
  maxMembers: number;
  storageQuotaMB: number;
  allowPasswordlessLogin: boolean;
  sessionTimeout: number;
  enforceStrongPassword: boolean;
}

export interface TenantCreateRequest {
  name: string;
  description?: string;
}

// ============================================================================
// Rate Limiting & Security
// ============================================================================

/**
 * Login attempt tracking
 */
export interface LoginAttempt {
  email: string;
  ipAddress: string;
  timestamp: Date;
  success: boolean;
  reason?: string; // 'invalid_credentials' | 'account_locked' | 'mfa_required'
}

/**
 * Account lockout info
 */
export interface AccountLockout {
  email: string;
  lockedUntil: Date;
  reason: string;
  attemptCount: number;
}

/**
 * Rate limit response
 */
export interface RateLimitResponse {
  retryAfter: number; // seconds
  message: string;
  remainingAttempts: number;
}

// ============================================================================
// Auth State & Context
// ============================================================================

/**
 * Complete auth state
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshTokenValue: string | null;
  expiresAt: number | null;
  currentTenant: TenantAccess | null;
  tenants: TenantAccess[];
  impersonation: ImpersonationSession | null;
  mfaChallenge?: string;
  mfaRequired?: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Auth context value - includes auth state + action methods
 */
export interface AuthContextValue {
  // State properties
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshTokenValue: string | null;
  expiresAt: number | null;
  currentTenant: TenantAccess | null;
  tenants: TenantAccess[];
  impersonation: ImpersonationSession | null;
  mfaChallenge?: string;
  mfaRequired?: boolean;
  loading: boolean;
  error: string | null;
  // Action methods
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  signup: (data: SignUpRequest) => Promise<void>;
  refreshToken: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  verifyMFA: (code: string) => Promise<void>;
  loginWithOAuth: (provider: OAuthProvider) => Promise<void>;
  setupMFA: (method: MFAMethod) => Promise<MFASetupResponse>;
  verifyMFASetup: (method: MFAMethod, code: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (current: string, newPassword: string) => Promise<void>;
  getSessions: () => Promise<Session[]>;
  revokeSession: (sessionId: string) => Promise<void>;
  impersonate: (userId: string, reason: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
}

// ============================================================================
// Onboarding & Progressive Feature Unlock
// ============================================================================

/**
 * User onboarding state
 */
export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  workspaceCreated: boolean;
  teamInvited: boolean;
  preferencesSet: boolean;
  firstFeatureUsed: string[];
}

/**
 * Plan tier and feature flags
 */
export interface FeatureFlags {
  advancedSearch: boolean;
  customReports: boolean;
  teamManagement: boolean;
  advancedIntegrations: boolean;
  apiAccess: boolean;
  auditLog: boolean;
  sso: boolean;
  roleBasedAccess: boolean;
}

// ============================================================================
// Password Strength & Validation
// ============================================================================

/**
 * Password strength requirement
 */
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

/**
 * Password strength check result
 */
export interface PasswordStrength {
  score: number; // 0-4: weak, fair, good, strong, very strong
  feedback: string[];
  isValid: boolean;
}

// ============================================================================
// Audit & Logging
// ============================================================================

/**
 * Auth event for audit log
 */
export interface AuthAuditEvent {
  id: string;
  userId: string;
  eventType:
    | 'login'
    | 'logout'
    | 'signup'
    | 'password_reset'
    | 'mfa_enabled'
    | 'mfa_verified'
    | 'oauth_connected'
    | 'session_created'
    | 'session_revoked'
    | 'impersonation_started'
    | 'impersonation_ended'
    | 'failed_login';
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  success: boolean;
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
