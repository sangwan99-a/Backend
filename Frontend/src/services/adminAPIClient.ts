/**
 * Admin API Integration
 * Multi-tenancy, user management, RBAC, and billing microservice
 */

import { getApiClient, useApi, useMutateApi } from '@/lib/api-client';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
  members: number;
  storage: {
    used: number;
    limit: number;
  };
  createdAt: string;
  billingEmail: string;
}

export interface TenantUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'viewer' | 'guest';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  joinedAt: string;
  lastLogin?: string;
  permissions?: string[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isCustom: boolean;
  createdAt: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'share' | 'admin';
  description: string;
}

export interface BillingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    users?: number;
    storage?: number; // GB
    documents?: number;
    apiRequests?: number;
  };
}

export interface BillingSubscription {
  id: string;
  tenantId: string;
  planId: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  nextBillingDate?: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  stripeInvoiceId: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, { before: any; after: any }>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * Admin API Client
 */
export class AdminAPIClient {
  private api = getApiClient();

  /**
   * Get current tenant
   */
  async getTenant(tenantId?: string): Promise<Tenant> {
    const url = tenantId ? `/api/v1/admin/tenants/${tenantId}` : '/api/v1/admin/tenants/current';
    return this.api.get(url);
  }

  /**
   * Get all tenants (super admin only)
   */
  async getTenants(limit: number = 50, offset: number = 0): Promise<{
    items: Tenant[];
    total: number;
  }> {
    return this.api.get(`/api/v1/admin/tenants?limit=${limit}&offset=${offset}`);
  }

  /**
   * Create tenant
   */
  async createTenant(data: {
    name: string;
    domain: string;
    plan?: 'free' | 'pro' | 'enterprise';
    billingEmail: string;
  }): Promise<Tenant> {
    return this.api.post('/api/v1/admin/tenants', data);
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, data: Partial<Tenant>): Promise<Tenant> {
    return this.api.patch(`/api/v1/admin/tenants/${tenantId}`, data);
  }

  /**
   * Suspend tenant
   */
  async suspendTenant(tenantId: string, reason?: string): Promise<Tenant> {
    return this.api.post(`/api/v1/admin/tenants/${tenantId}/suspend`, { reason });
  }

  /**
   * Reactivate tenant
   */
  async reactivateTenant(tenantId: string): Promise<Tenant> {
    return this.api.post(`/api/v1/admin/tenants/${tenantId}/reactivate`, {});
  }

  /**
   * Delete tenant (purge all data)
   */
  async deleteTenant(tenantId: string, purgeData: boolean = false): Promise<void> {
    return this.api.delete(`/api/v1/admin/tenants/${tenantId}?purgeData=${purgeData}`);
  }

  /**
   * Get tenant users
   */
  async getUsers(
    tenantId?: string,
    role?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    items: TenantUser[];
    total: number;
  }> {
    const url = tenantId ? `/api/v1/admin/tenants/${tenantId}/users` : '/api/v1/admin/users';
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    return this.api.get(`${url}?${params}`);
  }

  /**
   * Get user details
   */
  async getUser(userId: string): Promise<TenantUser> {
    return this.api.get(`/api/v1/admin/users/${userId}`);
  }

  /**
   * Create user/invite
   */
  async createUser(data: {
    email: string;
    name: string;
    role: 'admin' | 'editor' | 'viewer' | 'guest';
    tenantId?: string;
  }): Promise<TenantUser> {
    return this.api.post('/api/v1/admin/users', data);
  }

  /**
   * Update user
   */
  async updateUser(userId: string, data: Partial<TenantUser>): Promise<TenantUser> {
    return this.api.patch(`/api/v1/admin/users/${userId}`, data);
  }

  /**
   * Change user role
   */
  async changeUserRole(
    userId: string,
    role: 'admin' | 'editor' | 'viewer' | 'guest'
  ): Promise<TenantUser> {
    return this.api.patch(`/api/v1/admin/users/${userId}`, { role });
  }

  /**
   * Suspend user
   */
  async suspendUser(userId: string, reason?: string): Promise<TenantUser> {
    return this.api.post(`/api/v1/admin/users/${userId}/suspend`, { reason });
  }

  /**
   * Reactivate user
   */
  async reactivateUser(userId: string): Promise<TenantUser> {
    return this.api.post(`/api/v1/admin/users/${userId}/reactivate`, {});
  }

  /**
   * Remove user from tenant
   */
  async removeUser(userId: string, tenantId?: string): Promise<void> {
    return this.api.delete(`/api/v1/admin/users/${userId}`);
  }

  /**
   * Reset user password
   */
  async resetUserPassword(userId: string): Promise<{ resetLink: string }> {
    return this.api.post(`/api/v1/admin/users/${userId}/reset-password`, {});
  }

  /**
   * Get available roles
   */
  async getRoles(tenantId?: string): Promise<Role[]> {
    const url = tenantId ? `/api/v1/admin/tenants/${tenantId}/roles` : '/api/v1/admin/roles';
    return this.api.get(url);
  }

  /**
   * Get available permissions
   */
  async getPermissions(): Promise<Permission[]> {
    return this.api.get('/api/v1/admin/permissions');
  }

  /**
   * Check user permission
   */
  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const response = await this.api.get(
      `/api/v1/admin/users/${userId}/permissions?resource=${resource}&action=${action}`
    );
    return response.allowed === true;
  }

  /**
   * Get billing plans
   */
  async getPlans(): Promise<BillingPlan[]> {
    return this.api.get('/api/v1/admin/billing/plans');
  }

  /**
   * Get tenant subscription
   */
  async getSubscription(tenantId?: string): Promise<BillingSubscription> {
    const url = tenantId
      ? `/api/v1/admin/tenants/${tenantId}/subscription`
      : '/api/v1/admin/subscription';
    return this.api.get(url);
  }

  /**
   * Change subscription plan
   */
  async changePlan(
    planId: string,
    tenantId?: string
  ): Promise<{
    subscription: BillingSubscription;
    invoice?: Invoice;
  }> {
    const url = tenantId
      ? `/api/v1/admin/tenants/${tenantId}/subscription/change-plan`
      : '/api/v1/admin/subscription/change-plan';

    return this.api.post(url, { planId });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(tenantId?: string, reason?: string): Promise<BillingSubscription> {
    const url = tenantId
      ? `/api/v1/admin/tenants/${tenantId}/subscription/cancel`
      : '/api/v1/admin/subscription/cancel';

    return this.api.post(url, { reason });
  }

  /**
   * Get invoices
   */
  async getInvoices(
    tenantId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    items: Invoice[];
    total: number;
  }> {
    const url = tenantId
      ? `/api/v1/admin/tenants/${tenantId}/invoices`
      : '/api/v1/admin/invoices';
    return this.api.get(`${url}?limit=${limit}&offset=${offset}`);
  }

  /**
   * Get invoice
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    return this.api.get(`/api/v1/admin/invoices/${invoiceId}`);
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const response = await this.api.getClient().get(`/api/v1/admin/invoices/${invoiceId}/pdf`, {
      responseType: 'blob',
    });

    return response.data;
  }

  /**
   * Handle Stripe webhook
   */
  async handleStripeWebhook(event: StripeWebhookEvent): Promise<{ processed: boolean }> {
    return this.api.post('/api/v1/admin/webhooks/stripe', event);
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(
    tenantId?: string,
    filters?: {
      userId?: string;
      action?: string;
      resource?: string;
      dateRange?: { from: string; to: string };
    },
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    items: AuditLog[];
    total: number;
  }> {
    const url = tenantId
      ? `/api/v1/admin/tenants/${tenantId}/audit-logs`
      : '/api/v1/admin/audit-logs';

    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.resource) params.append('resource', filters.resource);
    if (filters?.dateRange) {
      params.append('dateFrom', filters.dateRange.from);
      params.append('dateTo', filters.dateRange.to);
    }
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    return this.api.get(`${url}?${params}`);
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(
    tenantId?: string,
    format: 'csv' | 'json' = 'csv'
  ): Promise<Blob> {
    const url = tenantId
      ? `/api/v1/admin/tenants/${tenantId}/audit-logs/export`
      : '/api/v1/admin/audit-logs/export';

    const response = await this.api.getClient().get(`${url}?format=${format}`, {
      responseType: 'blob',
    });

    return response.data;
  }

  /**
   * Get system health/status
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    services: Record<string, { status: string; latency: number }>;
    uptime: number;
  }> {
    return this.api.get('/api/v1/admin/health');
  }

  /**
   * Get usage metrics
   */
  async getUsageMetrics(tenantId?: string): Promise<{
    activeUsers: number;
    documentsCount: number;
    storageUsed: number;
    apiRequestsThisMonth: number;
    lastUpdated: string;
  }> {
    const url = tenantId
      ? `/api/v1/admin/tenants/${tenantId}/metrics`
      : '/api/v1/admin/metrics';
    return this.api.get(url);
  }
}

/**
 * Export singleton instance
 */
export const adminAPI = new AdminAPIClient();

/**
 * React hooks for admin functionality
 */

/**
 * Hook to get current tenant
 */
export function useTenant(tenantId?: string) {
  return useApi(['tenant', tenantId ?? 'current'] as const, () => adminAPI.getTenant(tenantId), {
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get all tenants
 */
export function useTenants() {
  return useApi(['tenants'], () => adminAPI.getTenants(), {
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to create tenant
 */
export function useCreateTenant() {
  return useMutateApi(
    (data: {
      name: string;
      domain: string;
      plan?: 'free' | 'pro' | 'enterprise';
      billingEmail: string;
    }) => adminAPI.createTenant(data)
  );
}

/**
 * Hook to update tenant
 */
export function useUpdateTenant() {
  return useMutateApi(
    ({ tenantId, data }: { tenantId: string; data: Partial<Tenant> }) =>
      adminAPI.updateTenant(tenantId, data)
  );
}

/**
 * Hook to suspend tenant
 */
export function useSuspendTenant() {
  return useMutateApi(
    ({ tenantId, reason }: { tenantId: string; reason?: string }) =>
      adminAPI.suspendTenant(tenantId, reason)
  );
}

/**
 * Hook to get users
 */
export function useUsers(tenantId?: string, role?: string) {
  return useApi(
    ['users', tenantId ?? 'all', role ?? 'all'] as const,
    () => adminAPI.getUsers(tenantId, role),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

/**
 * Hook to get user
 */
export function useUser(userId: string) {
  return useApi(['user', userId], () => adminAPI.getUser(userId), {
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to create user
 */
export function useCreateUser() {
  return useMutateApi(
    (data: {
      email: string;
      name: string;
      role: 'admin' | 'editor' | 'viewer' | 'guest';
      tenantId?: string;
    }) => adminAPI.createUser(data)
  );
}

/**
 * Hook to update user
 */
export function useUpdateUser() {
  return useMutateApi(
    ({ userId, data }: { userId: string; data: Partial<TenantUser> }) =>
      adminAPI.updateUser(userId, data)
  );
}

/**
 * Hook to suspend user
 */
export function useSuspendUser() {
  return useMutateApi(
    ({ userId, reason }: { userId: string; reason?: string }) =>
      adminAPI.suspendUser(userId, reason)
  );
}

/**
 * Hook to get roles
 */
export function useRoles(tenantId?: string) {
  return useApi(['roles', tenantId ?? 'all'] as const, () => adminAPI.getRoles(tenantId), {
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to get permissions
 */
export function usePermissions() {
  return useApi(['permissions'], () => adminAPI.getPermissions(), {
    staleTime: 1 * 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to get plans
 */
export function useBillingPlans() {
  return useApi(['billing-plans'], () => adminAPI.getPlans(), {
    staleTime: 1 * 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to get subscription
 */
export function useSubscription(tenantId?: string) {
  return useApi(['subscription', tenantId ?? 'current'] as const, () => adminAPI.getSubscription(tenantId), {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to change plan
 */
export function useChangePlan() {
  return useMutateApi(
    ({ planId, tenantId }: { planId: string; tenantId?: string }) =>
      adminAPI.changePlan(planId, tenantId)
  );
}

/**
 * Hook to get invoices
 */
export function useInvoices(tenantId?: string) {
  return useApi(['invoices', tenantId ?? 'current'] as const, () => adminAPI.getInvoices(tenantId), {
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get audit logs
 */
export function useAuditLogs(
  tenantId?: string,
  filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    dateRange?: { from: string; to: string };
  }
) {
  return useApi(
    ['audit-logs', tenantId ?? 'all', JSON.stringify(filters)] as const,
    () => adminAPI.getAuditLogs(tenantId, filters),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

/**
 * Hook to get system health
 */
export function useSystemHealth() {
  return useApi(['system-health'], () => adminAPI.getSystemHealth(), {
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get usage metrics
 */
export function useUsageMetrics(tenantId?: string) {
  return useApi(['usage-metrics', tenantId ?? 'current'] as const, () => adminAPI.getUsageMetrics(tenantId), {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
