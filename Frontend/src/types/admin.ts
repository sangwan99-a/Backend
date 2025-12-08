/**
 * Admin Console Type Definitions
 * Tenant, user, billing, system, and plugin management types
 */

// ============================================================================
// TENANT TYPES
// ============================================================================

export type TenantStatus = 'active' | 'trial' | 'suspended' | 'cancelled' | 'onboarding';
export type TenantPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: TenantStatus;
  plan: TenantPlan;
  createdAt: Date;
  updatedAt: Date;
  trialEndsAt?: Date;
  subscription?: {
    planId: string;
    status: 'active' | 'cancelled' | 'past_due';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelledAt?: Date;
  };
  usage: {
    users: number;
    maxUsers: number;
    storage: number; // bytes
    maxStorage: number; // bytes
    apiCalls: number;
    maxAPICalls: number;
  };
  features: {
    advancedSearch: boolean;
    knowledgeBase: boolean;
    customIntegrations: boolean;
    sso: boolean;
    auditLogs: boolean;
    dataExport: boolean;
    advancedAnalytics: boolean;
    whitelabel: boolean;
  };
  billing: {
    monthlyRecurringRevenue: number;
    totalRevenue: number;
    currency: string;
    billingEmail: string;
    paymentMethod?: string;
    nextBillingDate?: Date;
  };
  contact: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
  metadata: Record<string, any>;
  notes?: string;
}

export interface TenantMetrics {
  tenantId: string;
  date: Date;
  activeUsers: number;
  newUsers: number;
  arpu: number; // average revenue per user
  churnRate: number;
  apiUsage: number;
  storageUsed: number;
  logins: number;
  transactions: number;
}

export interface TenantActivity {
  id: string;
  tenantId: string;
  type: 'signup' | 'plan_change' | 'payment' | 'suspension' | 'feature_enabled' | 'quota_exceeded';
  description: string;
  data: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

// ============================================================================
// USER TYPES
// ============================================================================

export type UserRole = 'super_admin' | 'tenant_admin' | 'user' | 'guest';
export type UserStatus = 'active' | 'invited' | 'suspended' | 'inactive' | 'deleted';

export interface AdminUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  mfaEnabled: boolean;
  mfaVerified: boolean;
  loginAttempts: number;
  lockedUntil?: Date;
  metadata: Record<string, any>;
  permissions: string[];
  tags: string[];
}

export interface UserPermission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'read' | 'write' | 'delete' | 'admin';
  category: 'users' | 'tenants' | 'billing' | 'system' | 'plugins' | 'audit';
}

export interface RolePermissionMatrix {
  role: UserRole;
  permissions: UserPermission[];
}

export interface UserActivityLog {
  id: string;
  userId: string;
  tenantId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  timestamp: Date;
}

export interface UserLoginHistory {
  id: string;
  userId: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure' | 'mfa_required';
  errorMessage?: string;
  duration?: number; // seconds
}

export interface UserFeatureUsage {
  userId: string;
  feature: string;
  usageCount: number;
  lastUsedAt: Date;
  totalTimeSpent: number; // milliseconds
}

// ============================================================================
// BILLING TYPES
// ============================================================================

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  issuedAt: Date;
  dueAt: Date;
  paidAt?: Date;
  items: InvoiceItem[];
  notes?: string;
  pdfUrl?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  period?: { start: Date; end: Date };
}

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: 'credit_card' | 'bank_transfer' | 'check' | 'other';
  reference?: string;
  processedAt: Date;
  failureReason?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  maxUsers: number;
  maxStorage: number; // GB
  maxAPICalls: number; // monthly
  features: string[];
  position: number;
  active: boolean;
}

export interface BillingMetrics {
  totalRevenue: number;
  mrr: number; // monthly recurring revenue
  arr: number; // annual recurring revenue
  averageChurn: number;
  averageArpu: number;
  pendingInvoices: number;
  overdueAmount: number;
  date: Date;
}

// ============================================================================
// SYSTEM TYPES
// ============================================================================

export type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
export type SystemAlertSeverity = 'info' | 'warning' | 'critical';

export interface Service {
  id: string;
  name: string;
  description: string;
  status: ServiceStatus;
  uptime: number; // percentage
  responseTime: number; // milliseconds
  lastCheckedAt: Date;
  version: string;
  url?: string;
}

export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number; // 0-100
    cores: number;
    load: number[];
  };
  memory: {
    used: number; // bytes
    total: number; // bytes
    percentage: number; // 0-100
  };
  disk: {
    used: number; // bytes
    total: number; // bytes
    percentage: number; // 0-100
  };
  database: {
    connections: number;
    maxConnections: number;
    queryTime: number; // milliseconds
    errorRate: number; // percentage
  };
  services: Record<string, ServiceStatus>;
}

export interface SystemAlert {
  id: string;
  type: 'service_down' | 'high_cpu' | 'high_memory' | 'disk_full' | 'db_error' | 'api_latency' | 'other';
  severity: SystemAlertSeverity;
  title: string;
  description: string;
  resolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
  data?: Record<string, any>;
}

export interface ServiceLog {
  id: string;
  serviceName: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context?: Record<string, any>;
  stackTrace?: string;
  timestamp: Date;
  hostname?: string;
}

export interface SystemConfiguration {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'secret';
  description: string;
  defaultValue: any;
  updatedAt: Date;
  updatedBy: string;
}

// ============================================================================
// PLUGIN TYPES
// ============================================================================

export type PluginStatus = 'enabled' | 'disabled' | 'error';

export interface Plugin {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  status: PluginStatus;
  enabled: boolean;
  installedAt: Date;
  updatedAt: Date;
  updateAvailable?: string;
  icon?: string;
  url?: string;
  configuration?: Record<string, any>;
  permissions: string[];
  errorMessage?: string;
}

export interface PluginMarketplaceItem {
  id: string;
  name: string;
  description: string;
  author: string;
  category: string;
  version: string;
  rating: number; // 0-5
  reviews: number;
  downloads: number;
  icon?: string;
  url: string;
  documentation?: string;
  required: boolean;
  tenantLimit?: number;
}

// ============================================================================
// AUDIT & COMPLIANCE TYPES
// ============================================================================

export interface AuditLog {
  id: string;
  actor: {
    userId: string;
    email: string;
    ipAddress: string;
  };
  action: string;
  resource: string;
  resourceId: string;
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  result: 'success' | 'failure';
  errorMessage?: string;
  timestamp: Date;
  duration: number; // milliseconds
}

export interface ComplianceReport {
  id: string;
  type: 'soc2' | 'gdpr' | 'hipaa' | 'pci-dss' | 'custom';
  generatedAt: Date;
  period: { start: Date; end: Date };
  status: 'pass' | 'fail' | 'warning';
  findings: ComplianceFinding[];
  summary: string;
}

export interface ComplianceFinding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  remediation?: string;
  status: 'open' | 'in_progress' | 'resolved';
  dueDate?: Date;
}

// ============================================================================
// ADMIN UI STATE TYPES
// ============================================================================

export interface AdminUIState {
  currentView: 'dashboard' | 'tenants' | 'users' | 'billing' | 'system' | 'plugins' | 'analytics';
  selectedTenantId?: string;
  selectedUserId?: string;
  sidebarCollapsed: boolean;
  notificationsPanelOpen: boolean;
  filters: {
    tenantStatus?: TenantStatus[];
    tenantPlan?: TenantPlan[];
    userRole?: UserRole[];
    userStatus?: UserStatus[];
    dateRange?: { start: Date; end: Date };
  };
  sortBy: string;
  pageSize: number;
  currentPage: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  requiresConfirmation?: boolean;
  disabled?: boolean;
}

export interface RecentActivityItem {
  id: string;
  type: 'tenant_created' | 'user_invited' | 'payment_received' | 'alert_triggered' | 'system_update';
  title: string;
  description: string;
  icon: string;
  timestamp: Date;
  related?: {
    tenantId?: string;
    userId?: string;
  };
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'list' | 'status' | 'alert';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: number;
  data?: any;
  refreshInterval?: number; // seconds
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface TenantListRequest {
  limit?: number;
  offset?: number;
  status?: TenantStatus[];
  plan?: TenantPlan[];
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TenantListResponse {
  tenants: Tenant[];
  total: number;
  hasMore: boolean;
}

export interface UserListRequest {
  tenantId?: string;
  limit?: number;
  offset?: number;
  role?: UserRole[];
  status?: UserStatus[];
  search?: string;
  sortBy?: string;
}

export interface UserListResponse {
  users: AdminUser[];
  total: number;
  hasMore: boolean;
}

export interface BulkActionRequest {
  action: 'suspend' | 'activate' | 'delete' | 'change_plan' | 'reset_password' | 'export';
  targetIds: string[];
  data?: Record<string, any>;
}

export interface BulkActionResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  result?: {
    successful: number;
    failed: number;
    errors?: Array<{ id: string; error: string }>;
  };
}

// ============================================================================
// CHART/ANALYTICS TYPES
// ============================================================================

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface MetricData {
  label: string;
  value: number;
  previousValue?: number;
  percentChange?: number;
  trend?: 'up' | 'down' | 'stable';
  unit?: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
}

// ============================================================================
// ONBOARDING TYPES
// ============================================================================

export interface TenantOnboardingWizardStep {
  id: string;
  title: string;
  description: string;
  fields: Record<string, any>;
  optional: boolean;
}

export interface TenantOnboardingProgress {
  tenantId: string;
  currentStep: number;
  completed: boolean;
  completedAt?: Date;
  skippedSteps: string[];
}
