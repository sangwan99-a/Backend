/**
 * Sign Up Component
 * User registration with email, password, profile setup, and MFA optional setup
 */

import React, { useState } from 'react';
import {
  Input,
  Button,
  Checkbox,
  Text,
  Spinner,
  Card,
} from '@fluentui/react-components';
import { useNavigate } from 'react-router-dom';
import { useSignUp } from '@/hooks/useAuth';
import '../styles/auth.css';

interface SignUpProps {
  onSuccess?: () => void;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
}

export const SignUp: React.FC<SignUpProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const signupMutation = useSignUp();

  const [step, setStep] = useState<'profile' | 'password' | 'mfa'>('profile');
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    tenantName: '',
    inviteCode: '',
    acceptTerms: false,
  });
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
  });

  // Validate password strength
  const validatePassword = (password: string) => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push('At least 8 characters');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Uppercase letter');

    if (/[a-z]/.test(password)) score++;
    else feedback.push('Lowercase letter');

    if (/[0-9]/.test(password)) score++;
    else feedback.push('Number');

    if (/[!@#$%^&*]/.test(password)) score++;
    else feedback.push('Special character');

    setPasswordStrength({
      score,
      feedback: score === 5 ? [] : feedback,
    });

    return score >= 3;
  };

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    validatePassword(value);
  };

  const handleNextStep = () => {
    if (step === 'profile') {
      if (!formData.email || !formData.firstName || !formData.lastName) return;
      setStep('password');
    } else if (step === 'password') {
      if (!formData.password || formData.password !== formData.confirmPassword) return;
      if (!validatePassword(formData.password)) return;
      setStep('mfa');
    }
  };

  const handleSignUp = async () => {
    try {
      await signupMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        tenantName: formData.tenantName,
        inviteCode: formData.inviteCode,
        acceptTerms: formData.acceptTerms,
      });

      onSuccess?.();
      navigate('/');
    } catch (error) {
      console.error('Sign up failed:', error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-wide">
        <h1 className="auth-title">Create Your Account</h1>

        {/* Progress Indicator */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            Step {['profile', 'password', 'mfa'].indexOf(step) + 1} of 3
          </div>
          <div style={{ height: 4, backgroundColor: '#e1e1e1', borderRadius: 2 }}>
            <div
              style={{
                height: '100%',
                width: `${((['profile', 'password', 'mfa'].indexOf(step) + 1) / 3) * 100}%`,
                backgroundColor: '#0078d4',
                borderRadius: 2,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
            {['Profile', 'Password', 'Security'][['profile', 'password', 'mfa'].indexOf(step)]}
          </div>
        </div>

        {/* Step 1: Profile */}
        {step === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 5, fontSize: 14, fontWeight: 500 }}>
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(_: any, data: any) => setFormData({ ...formData, email: data.value || '' })}
                placeholder="your@email.com"
                required
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 14, fontWeight: 500 }}>
                  First Name
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(_: any, data: any) => setFormData({ ...formData, firstName: data.value || '' })}
                  placeholder="John"
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 14, fontWeight: 500 }}>
                  Last Name
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(_: any, data: any) => setFormData({ ...formData, lastName: data.value || '' })}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 5, fontSize: 14, fontWeight: 500 }}>
                Workspace Name (Optional)
              </label>
              <Input
                value={formData.tenantName}
                onChange={(_: any, data: any) => setFormData({ ...formData, tenantName: data.value || '' })}
                placeholder="My Team"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 5, fontSize: 14, fontWeight: 500 }}>
                Invite Code (Optional)
              </label>
              <Input
                value={formData.inviteCode}
                onChange={(_: any, data: any) => setFormData({ ...formData, inviteCode: data.value || '' })}
                placeholder="XXXXXXXXXX"
              />
            </div>

            <div>
              <Checkbox
                label="I agree to the Terms of Service and Privacy Policy"
                checked={formData.acceptTerms}
                onChange={(_: any, data: any) => setFormData({ ...formData, acceptTerms: data.checked || false })}
                required
              />
            </div>

            <Button
              onClick={handleNextStep}
              appearance="primary"
              className="auth-button"
              disabled={!formData.email || !formData.firstName || !formData.lastName || !formData.acceptTerms}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Password */}
        {step === 'password' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <Text weight="semibold">Create a strong password</Text>

            <div>
              <label style={{ display: 'block', marginBottom: 5, fontSize: 14, fontWeight: 500 }}>
                Password
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(_: any, data: any) => handlePasswordChange(data.value || '')}
                placeholder="••••••••"
                required
              />
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <Card>
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className={`strength-fill strength-${['weak', 'fair', 'good', 'strong', 'very-strong'][passwordStrength.score]}`}
                      style={{
                        width: `${(passwordStrength.score / 5) * 100}%`,
                      }}
                    />
                  </div>
                  <Text size={200}>
                    {['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passwordStrength.score] ||
                      'Weak'}
                  </Text>
                </div>

                {passwordStrength.feedback.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10 }}>
                    <Text weight="semibold" size={200}>
                      Password should include:
                    </Text>
                    {passwordStrength.feedback.map((fb) => (
                      <Text key={fb} size={200} className="feedback-text">
                        ❌ {fb}
                      </Text>
                    ))}
                  </div>
                )}
              </Card>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: 5, fontSize: 14, fontWeight: 500 }}>
                Confirm Password
              </label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(_: any, data: any) => setFormData({ ...formData, confirmPassword: data.value || '' })}
                placeholder="••••••••"
                required
              />
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <Text size={200} style={{ color: 'red', marginTop: 5 }}>
                    Passwords do not match
                  </Text>
                )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                onClick={() => setStep('profile')}
                appearance="subtle"
              >
                Back
              </Button>
              <Button
                onClick={handleNextStep}
                appearance="primary"
                className="auth-button"
                disabled={
                  !formData.password ||
                  formData.password !== formData.confirmPassword ||
                  passwordStrength.score < 3
                }
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: MFA Setup (Optional) */}
        {step === 'mfa' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Text weight="semibold">Secure Your Account (Recommended)</Text>
                <Text size={200}>
                  Enable multi-factor authentication to add an extra layer of security
                </Text>

                <div style={{ display: 'flex', gap: 10 }}>
                  <Button
                    onClick={() => {
                      navigate('/auth/mfa-setup', { state: { method: 'totp' } });
                    }}
                    className="mfa-method-button"
                  >
                    <div className="mfa-method">
                      <div className="mfa-icon">🔐</div>
                      <div>
                        <div className="mfa-title">Authenticator App</div>
                        <div className="mfa-desc">Google Authenticator, Authy</div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => {
                      navigate('/auth/mfa-setup', { state: { method: 'webauthn' } });
                    }}
                    className="mfa-method-button"
                  >
                    <div className="mfa-method">
                      <div className="mfa-icon">🔑</div>
                      <div>
                        <div className="mfa-title">Security Key</div>
                        <div className="mfa-desc">YubiKey, Windows Hello</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </Card>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                onClick={() => setStep('password')}
                appearance="subtle"
              >
                Back
              </Button>
              <Button
                onClick={handleSignUp}
                appearance="primary"
                className="auth-button"
                disabled={signupMutation.isLoading}
              >
                {signupMutation.isLoading ? <Spinner size="small" /> : 'Complete Sign Up'}
              </Button>
              <Button
                onClick={handleSignUp}
                appearance="secondary"
              >
                Skip for Now
              </Button>
            </div>

            {signupMutation.isError && (
              <div className="auth-error">
                <Text className="error-text">
                  {signupMutation.error instanceof Error
                    ? signupMutation.error.message
                    : 'Sign up failed'}
                </Text>
              </div>
            )}
          </div>
        )}

        {/* Sign In Link */}
        <div className="auth-footer" style={{ marginTop: 20 }}>
          <Text>
            Already have an account?{' '}
            <Button appearance="subtle" onClick={() => navigate('/auth/signin')}>
              Sign in
            </Button>
          </Text>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
