/**
 * Sign In Component
 * Email/password login with MFA, password reset, OAuth, and SSO support
 */

import React, { useState } from 'react';
import {
  Input,
  Button,
  Checkbox,
  Text,
  Spinner,
  Dialog,
} from '@fluentui/react-components';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { useLogin, useRequestPasswordReset } from '@/hooks/useAuth';
import { oauthService } from '@/services/oauthService';
import '../styles/auth.css';

interface SignInProps {
  onSuccess?: () => void;
}

export const SignIn: React.FC<SignInProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { setMFARequired } = useAuthStore();
  const loginMutation = useLogin();
  const resetMutation = useRequestPasswordReset();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await loginMutation.mutateAsync({
        email,
        password,
        rememberMe,
      });

      // MFA required
      if (result.mfaRequired) {
        setMFARequired(true, result.mfaChallenge);
        navigate('/auth/mfa-verify');
        return;
      }

      onSuccess?.();
      navigate('/');
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    try {
      await oauthService.startOAuthFlow(provider as any);
    } catch (error) {
      console.error(`${provider} OAuth failed:`, error);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) return;

    try {
      await resetMutation.mutateAsync(resetEmail);
      setResetSent(true);
    } catch (error) {
      console.error('Password reset request failed:', error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Sign In to FusionDesk</h1>

        <form onSubmit={handleSignIn} className="auth-form">
          {/* Email Field */}
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontSize: 14, fontWeight: 500 }}>
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(_: any, data: any) => setEmail(data.value || '')}
              placeholder="your@email.com"
              required
              disabled={loginMutation.isLoading}
            />
          </div>

          {/* Password Field */}
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontSize: 14, fontWeight: 500 }}>
              Password
            </label>
            <Input
              type={passwordVisible ? 'text' : 'password'}
              value={password}
              onChange={(_: any, data: any) => setPassword(data.value || '')}
              placeholder="••••••••"
              required
              disabled={loginMutation.isLoading}
            />
            <Button
              appearance="subtle"
              onClick={() => setPasswordVisible(!passwordVisible)}
              style={{ marginTop: 5 }}
            >
              {passwordVisible ? '👁️' : '👁️‍🗨️'}
            </Button>
          </div>

          {/* Remember Me Checkbox */}
          <Checkbox
            label="Remember me"
            checked={rememberMe}
            onChange={(_: any, data: any) => setRememberMe(data.checked || false)}
            disabled={loginMutation.isLoading}
          />

          {/* Error Message */}
          {loginMutation.isError && (
            <div className="auth-error">
              <Text className="error-text">
                {loginMutation.error instanceof Error
                  ? loginMutation.error.message
                  : 'Sign in failed'}
              </Text>
            </div>
          )}

          {/* Sign In Button */}
          <Button
            type="submit"
            appearance="primary"
            disabled={loginMutation.isLoading || !email || !password}
            className="auth-button"
          >
            {loginMutation.isLoading ? <Spinner size="small" /> : 'Sign In'}
          </Button>
        </form>

        {/* Password Reset Link */}
        <div className="auth-footer">
          <Button
            appearance="subtle"
            onClick={() => setResetDialogOpen(true)}
            className="auth-link"
          >
            Forgot password?
          </Button>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span>Or continue with</span>
        </div>

        {/* OAuth Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          <Button
            onClick={() => handleOAuthSignIn('google')}
            className="oauth-button"
            title="Sign in with Google"
          >
            <span className="oauth-icon">🔵</span>
            Google
          </Button>
          <Button
            onClick={() => handleOAuthSignIn('microsoft')}
            className="oauth-button"
            title="Sign in with Microsoft"
          >
            <span className="oauth-icon">⚪</span>
            Microsoft
          </Button>
          <Button
            onClick={() => handleOAuthSignIn('github')}
            className="oauth-button"
            title="Sign in with GitHub"
          >
            <span className="oauth-icon">⬛</span>
            GitHub
          </Button>
        </div>

        {/* Sign Up Link */}
        <div className="auth-footer">
          <Text>
            Don't have an account?{' '}
            <Button appearance="subtle" onClick={() => navigate('/auth/signup')}>
              Sign up
            </Button>
          </Text>
        </div>
      </div>

      {/* Password Reset Dialog */}
      {resetDialogOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 24,
            maxWidth: 400,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
          }}>
            {!resetSent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ margin: 0 }}>Reset Password</h2>
                <Text>Enter your email to receive a password reset link</Text>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontSize: 14, fontWeight: 500 }}>
                    Email
                  </label>
                  <Input
                    type="email"
                    value={resetEmail}
                    onChange={(_: any, data: any) => setResetEmail(data.value || '')}
                    placeholder="your@email.com"
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button
                    onClick={handlePasswordReset}
                    appearance="primary"
                    disabled={resetMutation.isLoading || !resetEmail}
                  >
                    {resetMutation.isLoading ? <Spinner size="small" /> : 'Send Reset Link'}
                  </Button>
                  <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <h2 style={{ margin: 0 }}>Password Reset</h2>
                <Text>✓ Password reset link sent to your email</Text>
                <Text size={200} className="info-text">
                  Check your inbox for instructions to reset your password
                </Text>
                <Button onClick={() => setResetDialogOpen(false)}>Close</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;
