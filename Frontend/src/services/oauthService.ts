/**
 * OAuth Service
 * OAuth2 flow with PKCE for Google, Microsoft, GitHub
 */

import type { OAuthProvider } from '@/types/auth';

// ============================================================================
// Utility Functions
// ============================================================================

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    result += chars[values[i] % chars.length];
  }
  return result;
}

async function sha256(data: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest('SHA-256', encoder.encode(data));
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ============================================================================
// OAuth Service
// ============================================================================

export class OAuthService {
  private clientIds: Record<string, string> = {
    google: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
    microsoft: process.env.REACT_APP_MICROSOFT_CLIENT_ID || '',
    github: process.env.REACT_APP_GITHUB_CLIENT_ID || '',
  };

  private redirectUri = `${window.location.origin}/auth/oauth/callback`;
  private scopes: Record<OAuthProvider, string[]> = {
    google: ['openid', 'profile', 'email'],
    microsoft: ['openid', 'profile', 'email', 'offline_access'],
    github: ['read:user', 'user:email'],
  };

  /**
   * Generate PKCE challenge and verifier
   */
  async generatePKCE(): Promise<{ challenge: string; verifier: string }> {
    const verifier = generateRandomString(128);
    const hash = await sha256(verifier);
    const challenge = base64UrlEncode(hash);
    return { challenge, verifier };
  }

  /**
   * Start OAuth flow for provider
   */
  async startOAuthFlow(provider: OAuthProvider): Promise<void> {
    try {
      const { challenge, verifier } = await this.generatePKCE();
      const state = generateRandomString(32);

      // Store PKCE verifier and state in session storage
      sessionStorage.setItem(`oauth_state_${provider}`, state);
      sessionStorage.setItem(`oauth_verifier_${provider}`, verifier);

      const authUrl = this.buildAuthorizationUrl(provider, challenge, state);
      window.location.href = authUrl;
    } catch (error) {
      throw new Error(`Failed to start OAuth flow for ${provider}: ${error}`);
    }
  }

  /**
   * Handle OAuth callback
   */
  handleCallback(provider: OAuthProvider, code: string, state: string): string {
    // Verify state parameter
    const storedState = sessionStorage.getItem(`oauth_state_${provider}`);
    if (storedState !== state) {
      throw new Error('Invalid state parameter - possible CSRF attack');
    }

    // Get PKCE verifier
    const verifier = sessionStorage.getItem(`oauth_verifier_${provider}`);
    if (!verifier) {
      throw new Error('PKCE verifier not found');
    }

    // Clean up session storage
    sessionStorage.removeItem(`oauth_state_${provider}`);
    sessionStorage.removeItem(`oauth_verifier_${provider}`);

    return verifier;
  }

  /**
   * Build authorization URL for OAuth provider
   */
  private buildAuthorizationUrl(provider: OAuthProvider, challenge: string, state: string): string {
    const baseUrls: Record<OAuthProvider, string> = {
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
      microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      github: 'https://github.com/login/oauth/authorize',
    };

    const params: Record<string, string> = {
      client_id: this.clientIds[provider],
      redirect_uri: this.redirectUri,
      scope: this.scopes[provider].join(' '),
      state,
      response_type: 'code',
      prompt: 'select_account',
    };

    // Add PKCE
    params.code_challenge = challenge;
    params.code_challenge_method = 'S256';

    // Provider-specific parameters
    if (provider === 'google') {
      params.access_type = 'offline';
    } else if (provider === 'microsoft') {
      params.response_mode = 'query';
    }

    const query = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    return `${baseUrls[provider]}?${query}`;
  }

  /**
   * Decode JWT token (basic client-side decode, verify on server)
   */
  decodeToken(token: string): Record<string, any> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token');

      const decoded = atob(parts[1]);
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Failed to decode token');
    }
  }
}

export const oauthService = new OAuthService();
