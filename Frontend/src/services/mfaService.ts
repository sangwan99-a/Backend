/**
 * MFA (Multi-Factor Authentication) Service
 * TOTP, WebAuthn, and backup codes management
 */

import type { MFAMethod } from '@/types/auth';

/**
 * TOTP Service - Time-based One-Time Password
 */
export class TOTPService {
  /**
   * Generate TOTP secret
   */
  static generateSecret(): string {
    // Base32 alphabet
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    const values = new Uint8Array(20); // 160 bits for 6-digit codes
    crypto.getRandomValues(values);
    for (let i = 0; i < values.length; i++) {
      secret += alphabet[values[i] % alphabet.length];
    }
    return secret;
  }

  /**
   * Generate TOTP QR code URL for scanning
   */
  static generateQRCodeUrl(email: string, secret: string, issuer: string = 'FusionDesk'): string {
    const params = new URLSearchParams({
      secret,
      issuer,
      accountname: email,
    });
    return `otpauth://totp/FusionDesk%20(${encodeURIComponent(email)})?${params.toString()}`;
  }

  /**
   * Verify TOTP code
   */
  static verifyCode(secret: string, code: string, window: number = 1): boolean {
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return false;
    }

    // Get current time window
    const timeStep = 30; // seconds
    const currentTime = Math.floor(Date.now() / 1000 / timeStep);

    // Allow for time drift (current window ± 1)
    for (let i = -window; i <= window; i++) {
      const expectedCode = this.generateCode(secret, currentTime + i);
      if (expectedCode === code) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate TOTP code for given time window
   */
  private static generateCode(secret: string, timeWindow: number): string {
    // Decode base32 secret to bytes
    const decoded = this.base32Decode(secret);

    // Create HMAC
    const key = new Uint8Array(decoded);
    const message = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
      message[7 - i] = timeWindow & 0xff;
      timeWindow >>= 8;
    }

    // HMAC-SHA1 requires Web Crypto API
    // For now, return placeholder - implement with crypto library
    return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  }

  /**
   * Decode base32 string to bytes
   */
  private static base32Decode(str: string): number[] {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const decoded: number[] = [];
    let bits = 0;
    let value = 0;

    for (let i = 0; i < str.length; i++) {
      const index = alphabet.indexOf(str[i]);
      if (index === -1) throw new Error('Invalid base32 character');

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        bits -= 8;
        decoded.push((value >> bits) & 0xff);
      }
    }

    return decoded;
  }
}

/**
 * WebAuthn Service - FIDO2/WebAuthn for security keys and biometrics
 */
export class WebAuthnService {
  /**
   * Check if WebAuthn is supported
   */
  static isSupported(): boolean {
    return (
      window.PublicKeyCredential !== undefined &&
      navigator.credentials !== undefined &&
      navigator.credentials.create !== undefined &&
      navigator.credentials.get !== undefined
    );
  }

  /**
   * Register new WebAuthn credential
   */
  static async registerCredential(
    challenge: ArrayBuffer,
    user: {
      id: string;
      name: string;
      displayName: string;
    }
  ): Promise<any> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn not supported on this device');
    }

    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'FusionDesk',
            id: window.location.hostname,
          },
          user: {
            id: this.stringToArrayBuffer(user.id),
            name: user.name,
            displayName: user.displayName,
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 }, // RS256
          ],
          attestation: 'direct',
          timeout: 60000,
          authenticatorSelection: {
            authenticatorAttachment: 'cross-platform', // Security key
            userVerification: 'preferred',
          },
        },
      } as any);

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      return {
        id: credential.id,
        rawId: this.arrayBufferToBase64((credential as any).rawId),
        response: {
          clientDataJSON: this.arrayBufferToBase64(
            (credential as any).response.clientDataJSON
          ),
          attestationObject: this.arrayBufferToBase64(
            (credential as any).response.attestationObject
          ),
        },
        type: credential.type,
      };
    } catch (error) {
      throw new Error(`WebAuthn registration failed: ${error}`);
    }
  }

  /**
   * Authenticate with WebAuthn credential
   */
  static async authenticateCredential(challenge: ArrayBuffer): Promise<any> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn not supported on this device');
    }

    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'preferred',
        },
      } as any);

      if (!assertion) {
        throw new Error('Failed to get credential');
      }

      return {
        id: assertion.id,
        rawId: this.arrayBufferToBase64((assertion as any).rawId),
        response: {
          clientDataJSON: this.arrayBufferToBase64(
            (assertion as any).response.clientDataJSON
          ),
          authenticatorData: this.arrayBufferToBase64(
            (assertion as any).response.authenticatorData
          ),
          signature: this.arrayBufferToBase64((assertion as any).response.signature),
          userHandle: (assertion as any).response.userHandle
            ? this.arrayBufferToBase64((assertion as any).response.userHandle)
            : null,
        },
        type: assertion.type,
      };
    } catch (error) {
      throw new Error(`WebAuthn authentication failed: ${error}`);
    }
  }

  /**
   * Convert string to ArrayBuffer
   */
  private static stringToArrayBuffer(str: string): ArrayBuffer {
    const encoder = new TextEncoder();
    return encoder.encode(str).buffer;
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

/**
 * Backup Codes Service
 */
export class BackupCodesService {
  /**
   * Generate backup codes
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = this.generateSingleCode();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Generate single backup code
   */
  private static generateSingleCode(): string {
    // Format: XXXX-XXXX-XXXX (12 alphanumeric characters)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    const values = new Uint8Array(12);
    crypto.getRandomValues(values);
    for (let i = 0; i < 12; i++) {
      code += chars[values[i] % chars.length];
      if ((i + 1) % 4 === 0 && i < 11) {
        code += '-';
      }
    }
    return code;
  }

  /**
   * Verify backup code format
   */
  static verifyCode(code: string): boolean {
    return /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);
  }

  /**
   * Format backup code for display
   */
  static formatCode(code: string): string {
    return code.replace(/-/g, '');
  }
}

/**
 * Main MFA Service
 */
export class MFAService {
  static TOTP = TOTPService;
  static WebAuthn = WebAuthnService;
  static BackupCodes = BackupCodesService;

  /**
   * Setup MFA method
   */
  static setupMethod(method: MFAMethod): {
    secret?: string;
    qrCodeUrl?: string;
    backupCodes?: string[];
  } {
    switch (method) {
      case 'totp': {
        const secret = TOTPService.generateSecret();
        const qrCodeUrl = TOTPService.generateQRCodeUrl('user@fusiondesk.com', secret);
        const backupCodes = BackupCodesService.generateBackupCodes();
        return { secret, qrCodeUrl, backupCodes };
      }

      case 'webauthn': {
        const backupCodes = BackupCodesService.generateBackupCodes();
        return { backupCodes };
      }

      case 'email':
      case 'sms':
      default:
        return {};
    }
  }
}

export const mfaService = new MFAService();
