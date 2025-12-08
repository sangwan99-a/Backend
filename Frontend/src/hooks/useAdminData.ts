/**
 * Admin Console React Query Hooks
 * Data fetching and mutation hooks for admin operations
 * Note: These hooks are designed for a microservices-based admin API
 */

import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI, Tenant, TenantUser, Role, Permission, BillingPlan } from '@/services/adminAPIClient';

// ============================================================================
// TENANT QUERY HOOKS
// ============================================================================

/**
 * Get list of tenants
 */
export const useTenants = (
  filters?: { limit?: number; offset?: number; status?: any[]; plan?: any[]; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' },
  enabled = true
) => {
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  return useQuery<{ items: Tenant[]; total: number }>(
    ['tenants', filters] as const,
    () => adminAPI.getTenants(limit, offset),
    {
      enabled,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );
};

/**
 * Get single tenant
 */
export const useTenant = (tenantId?: string, enabled = true) => {
  return useQuery<Tenant>(
    ['tenant', tenantId] as const,
    () => adminAPI.getTenant(tenantId),
    {
      enabled,
      staleTime: 5 * 60 * 1000,
    }
  );
};

// ============================================================================
// TENANT MUTATION HOOKS
// ============================================================================

/**
 * Create tenant mutation
 */
export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; domain: string; plan?: 'free' | 'pro' | 'enterprise'; billingEmail: string }) =>
      adminAPI.createTenant(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenants']);
    },
  });
};

/**
 * Update tenant mutation
 */
export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, updates }: { tenantId: string; updates: Partial<Tenant> }) =>
      adminAPI.updateTenant(tenantId, updates),
    onSuccess: (data: Tenant) => {
      queryClient.invalidateQueries(['tenant', data.id]);
      queryClient.invalidateQueries(['tenants']);
    },
  });
};

/**
 * Suspend tenant mutation
 */
export const useSuspendTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, reason }: { tenantId: string; reason?: string }) =>
      adminAPI.suspendTenant(tenantId, reason),
    onSuccess: (data: Tenant) => {
      queryClient.invalidateQueries(['tenant', data.id]);
      queryClient.invalidateQueries(['tenants']);
    },
  });
};

/**
 * Reactivate tenant mutation
 */
export const useReactivateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: string) => adminAPI.reactivateTenant(tenantId),
    onSuccess: (data: Tenant) => {
      queryClient.invalidateQueries(['tenant', data.id]);
      queryClient.invalidateQueries(['tenants']);
    },
  });
};

/**
 * Delete tenant mutation
 */
export const useDeleteTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, purgeData }: { tenantId: string; purgeData?: boolean }) =>
      adminAPI.deleteTenant(tenantId, purgeData),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenants']);
    },
  });
};

// ============================================================================
// USER QUERY HOOKS
// ============================================================================

/**
 * Get list of users
 */
export const useUsers = (
  filters?: { tenantId?: string; role?: string; limit?: number; offset?: number; enabled?: boolean },
  enabledOverride?: boolean
) => {
  const enabled = enabledOverride !== undefined ? enabledOverride : (filters?.enabled !== false);
  const tenantId = filters?.tenantId;
  const role = filters?.role;
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  return useQuery<{ items: TenantUser[]; total: number }>(
    ['users', filters] as const,
    () => adminAPI.getUsers(tenantId, role, limit, offset),
    {
      enabled,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );
};

/**
 * Get single user
 */
export const useUser = (userId: string, enabled = true) => {
  return useQuery<TenantUser>(
    ['user', userId],
    () => adminAPI.getUser(userId),
    {
      enabled,
      staleTime: 5 * 60 * 1000,
    }
  );
};

/**
 * Get available roles
 */
export const useRoles = (tenantId?: string) => {
  return useQuery<Role[]>(
    ['roles', tenantId],
    () => adminAPI.getRoles(tenantId),
    {
      staleTime: 10 * 60 * 1000,
    }
  );
};

/**
 * Get available permissions
 */
export const usePermissions = () => {
  return useQuery<Permission[]>(
    ['permissions'],
    () => adminAPI.getPermissions(),
    {
      staleTime: 15 * 60 * 1000,
    }
  );
};

// ============================================================================
// USER MUTATION HOOKS
// ============================================================================

/**
 * Create user/invite mutation
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; name: string; role: 'admin' | 'editor' | 'viewer' | 'guest'; tenantId?: string }) =>
      adminAPI.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    },
  });
};

/**
 * Update user mutation
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<TenantUser> }) =>
      adminAPI.updateUser(userId, updates),
    onSuccess: (data: TenantUser) => {
      queryClient.invalidateQueries(['user', data.id]);
      queryClient.invalidateQueries(['users']);
    },
  });
};

/**
 * Suspend user mutation
 */
export const useSuspendUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      adminAPI.suspendUser(userId, reason),
    onSuccess: (data: TenantUser) => {
      queryClient.invalidateQueries(['user', data.id]);
      queryClient.invalidateQueries(['users']);
    },
  });
};

/**
 * Reactivate user mutation
 */
export const useReactivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminAPI.reactivateUser(userId),
    onSuccess: (data: TenantUser) => {
      queryClient.invalidateQueries(['user', data.id]);
      queryClient.invalidateQueries(['users']);
    },
  });
};

/**
 * Remove user mutation
 */
export const useRemoveUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, tenantId }: { userId: string; tenantId?: string }) =>
      adminAPI.removeUser(userId, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    },
  });
};

/**
 * Reset user password mutation
 */
export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: (userId: string) => adminAPI.resetUserPassword(userId),
  });
};

/**
 * Change user role mutation
 */
export const useChangeUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'editor' | 'viewer' | 'guest' }) =>
      adminAPI.changeUserRole(userId, role),
    onSuccess: (data: TenantUser) => {
      queryClient.invalidateQueries(['user', data.id]);
      queryClient.invalidateQueries(['users']);
    },
  });
};

// ============================================================================
// BILLING QUERY HOOKS
// ============================================================================

/**
 * Get billing plans
 */
export const useBillingPlans = () => {
  return useQuery<BillingPlan[]>(
    ['billing-plans'],
    () => adminAPI.getPlans(),
    {
      staleTime: 30 * 60 * 1000,
    }
  );
};
