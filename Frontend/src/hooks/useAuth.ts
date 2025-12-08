/**
 * Auth Hooks - React Query integration for authentication
 * Login, signup, MFA, OAuth, password reset, and user management
 */

import { useMutation, useQuery, useQueryClient } from 'react-query';
import useAuthStore from '@/store/authStore';
import { authAPIClient } from '@/services/authAPIClient';
import type {
  LoginRequest,
  SignUpRequest,
  PasswordChangeRequest,
  MFAMethod,
  MFASetupResponse,
  User,
  Session,
} from '@/types/auth';

// ============================================================================
// Login & Signup Mutations
// ============================================================================

export function useLogin() {
  const { login: storeLogin } = useAuthStore();

  return useMutation(
    async (data: LoginRequest) => {
      const response = await authAPIClient.login(data);
      await storeLogin(data.email, data.password, data.rememberMe);
      return response;
    },
    {
      onError: (error: Error) => {
        console.error('Login failed:', error.message);
      },
    }
  );
}

export function useSignUp() {
  const { signup: storeSignup } = useAuthStore();

  return useMutation(
    async (data: SignUpRequest) => {
      await storeSignup({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
    },
    {
      onError: (error: Error) => {
        console.error('Signup failed:', error.message);
      },
    }
  );
}

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation(
    async () => {
      await logout();
    },
    {
      onSuccess: () => {
        queryClient.clear();
      },
    }
  );
}

// ============================================================================
// User Profile Queries & Mutations
// ============================================================================

export function useCurrentUser() {
  return useQuery(['auth', 'current-user'], () => authAPIClient.getCurrentUser(), {
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation(
    (data: Partial<User>) => authAPIClient.updateProfile(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['auth', 'current-user']);
      },
    }
  );
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation(
    (file: File) => authAPIClient.uploadAvatar(file),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['auth', 'current-user']);
      },
    }
  );
}

export function useChangePassword() {
  return useMutation((data: PasswordChangeRequest) => authAPIClient.changePassword(data));
}

// ============================================================================
// MFA Queries & Mutations
// ============================================================================

export function useSetupMFA() {
  return useMutation((method: MFAMethod) =>
    authAPIClient.setupMFA({ method })
  );
}

export function useVerifyMFASetup() {
  return useMutation((data: { method: MFAMethod; code: string }) =>
    authAPIClient.verifyMFASetup({
      method: data.method,
      code: data.code,
    })
  );
}

export function useDisableMFA() {
  const queryClient = useQueryClient();

  return useMutation(() => authAPIClient.disableMFA(), {
    onSuccess: () => {
      queryClient.invalidateQueries(['auth', 'current-user']);
    },
  });
}

export function useBackupCodes() {
  return useQuery(['auth', 'backup-codes'], () => authAPIClient.getBackupCodes(), {
    enabled: false, // Manual trigger
  });
}

export function useRegenerateBackupCodes() {
  const queryClient = useQueryClient();

  return useMutation(() => authAPIClient.regenerateBackupCodes(), {
    onSuccess: () => {
      queryClient.invalidateQueries(['auth', 'backup-codes']);
    },
  });
}

// ============================================================================
// Password Management
// ============================================================================

export function useRequestPasswordReset() {
  return useMutation((email: string) =>
    authAPIClient.requestPasswordReset({ email })
  );
}

export function useVerifyPasswordReset() {
  return useMutation((data: { token: string; newPassword: string }) =>
    authAPIClient.verifyPasswordReset(data)
  );
}

export function useRequestMagicLink() {
  return useMutation((email: string) =>
    authAPIClient.requestMagicLink({ email })
  );
}

export function useVerifyMagicLink() {
  return useMutation((token: string) => authAPIClient.verifyMagicLink(token));
}

// ============================================================================
// OAuth Integration
// ============================================================================

export function useConnectedAccounts() {
  return useQuery(
    ['auth', 'connected-accounts'],
    () => authAPIClient.getConnectedAccounts(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}

export function useDisconnectOAuth() {
  const queryClient = useQueryClient();

  return useMutation(
    (provider: string) => authAPIClient.disconnectOAuthAccount(provider),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['auth', 'connected-accounts']);
      },
    }
  );
}

// ============================================================================
// Tenant Management
// ============================================================================

export function useTenants() {
  return useQuery(['auth', 'tenants'], () => authAPIClient.getTenants(), {
    staleTime: 5 * 60 * 1000,
  });
}

export function useSwitchTenant() {
  const { switchTenant } = useAuthStore();

  return useMutation((tenantId: string) => switchTenant(tenantId));
}

export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation(
    (data: { name: string; description?: string }) =>
      authAPIClient.createTenant(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['auth', 'tenants']);
      },
    }
  );
}

// ============================================================================
// Session Management
// ============================================================================

export function useSessions() {
  return useQuery(['auth', 'sessions'], () => authAPIClient.getSessions(), {
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation(
    (sessionId: string) => authAPIClient.revokeSession(sessionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['auth', 'sessions']);
      },
    }
  );
}

export function useLogoutAllOtherSessions() {
  const queryClient = useQueryClient();

  return useMutation(() => authAPIClient.logoutAllOtherSessions(), {
    onSuccess: () => {
      queryClient.invalidateQueries(['auth', 'sessions']);
    },
  });
}

// ============================================================================
// Admin Impersonation
// ============================================================================

export function useStartImpersonation() {
  const { startImpersonation } = useAuthStore();

  return useMutation((data: { userId: string; reason: string }) =>
    startImpersonation(data.userId, data.reason)
  );
}

export function useStopImpersonation() {
  const { stopImpersonation } = useAuthStore();

  return useMutation(() => stopImpersonation());
}

export default {
  useLogin,
  useSignUp,
  useLogout,
  useCurrentUser,
  useUpdateProfile,
  useUploadAvatar,
  useChangePassword,
  useSetupMFA,
  useVerifyMFASetup,
  useDisableMFA,
  useBackupCodes,
  useRegenerateBackupCodes,
  useRequestPasswordReset,
  useVerifyPasswordReset,
  useRequestMagicLink,
  useVerifyMagicLink,
  useConnectedAccounts,
  useDisconnectOAuth,
  useTenants,
  useSwitchTenant,
  useCreateTenant,
  useSessions,
  useRevokeSession,
  useLogoutAllOtherSessions,
  useStartImpersonation,
  useStopImpersonation,
};
