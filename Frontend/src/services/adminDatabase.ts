/**
 * Admin Console Database Service
 * Dexie-based persistence for audit logs, admin cache, and local state
 */

import Dexie, { Table } from 'dexie';
import {
  AuditLog,
  UserActivityLog,
  UserLoginHistory,
  SystemAlert,
  ServiceLog,
  TenantActivity,
  AdminUIState,
} from '../types/admin';

class AdminDatabase extends Dexie {
  auditLogs!: Table<AuditLog>;
  userActivityLogs!: Table<UserActivityLog>;
  userLoginHistory!: Table<UserLoginHistory>;
  systemAlerts!: Table<SystemAlert>;
  serviceLogs!: Table<ServiceLog>;
  tenantActivity!: Table<TenantActivity>;
  adminUIState!: Table<AdminUIState>;
  adminCache!: Table<{ key: string; value: any; expiresAt: Date }>;

  constructor() {
    super('FusionDeskAdmin');
    this.version(1).stores({
      auditLogs: '++id, timestamp, [actor.userId+timestamp], action',
      userActivityLogs: '++id, userId, [userId+timestamp], action, resource',
      userLoginHistory: '++id, userId, [userId+timestamp], status',
      systemAlerts: '++id, [severity+createdAt], resolved, type',
      serviceLogs: '++id, [serviceName+timestamp], level, serviceName',
      tenantActivity: '++id, tenantId, [tenantId+timestamp], type',
      adminUIState: 'id',
      adminCache: 'key, expiresAt',
    });
  }

  // ============================================================================
  // AUDIT LOG OPERATIONS
  // ============================================================================

  /**
   * Add audit log entry
   */
  async addAuditLog(log: Omit<AuditLog, 'id'>): Promise<string> {
    return (await this.auditLogs.add(log as AuditLog)) as unknown as string;
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(
    limit = 100,
    offset = 0,
    filters?: {
      userId?: string;
      action?: string;
      resource?: string;
      dateRange?: { start: Date; end: Date };
      result?: 'success' | 'failure';
    }
  ): Promise<{ logs: AuditLog[]; total: number }> {
    let query = this.auditLogs.orderBy('timestamp').reverse();

    if (filters?.dateRange) {
      query = query.filter(
        (log) => log.timestamp >= filters.dateRange!.start && log.timestamp <= filters.dateRange!.end
      );
    }

    if (filters?.userId) {
      query = query.filter((log) => log.actor.userId === filters.userId);
    }

    if (filters?.action) {
      query = query.filter((log) => log.action === filters.action);
    }

    if (filters?.resource) {
      query = query.filter((log) => log.resource === filters.resource);
    }

    if (filters?.result) {
      query = query.filter((log) => log.result === filters.result);
    }

    const total = await query.count();
    const logs = await query.offset(offset).limit(limit).toArray();
    return { logs, total };
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(
    searchTerm: string,
    limit = 50
  ): Promise<AuditLog[]> {
    return this.auditLogs
      .filter(
        (log): boolean =>
          log.action.includes(searchTerm) ||
          log.resource.includes(searchTerm) ||
          log.actor.email.includes(searchTerm) ||
          !!(log.errorMessage && log.errorMessage.includes(searchTerm))
      )
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Delete old audit logs (retention policy)
   */
  async deleteOldAuditLogs(daysToKeep = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    return this.auditLogs.where('timestamp').below(cutoffDate).delete();
  }

  // ============================================================================
  // USER ACTIVITY LOG OPERATIONS
  // ============================================================================

  /**
   * Add user activity log
   */
  async addUserActivityLog(log: Omit<UserActivityLog, 'id'>): Promise<string> {
    return (await this.userActivityLogs.add(log as UserActivityLog)) as unknown as string;
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<{ logs: UserActivityLog[]; total: number }> {
    const total = await this.userActivityLogs.where('userId').equals(userId).count();
    const logs = await this.userActivityLogs
      .where('userId')
      .equals(userId)
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
    return { logs, total };
  }

  /**
   * Get activity by resource
   */
  async getActivityByResource(
    resourceId: string,
    limit = 50
  ): Promise<UserActivityLog[]> {
    return this.userActivityLogs
      .where('resourceId')
      .equals(resourceId)
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Delete old user activity logs
   */
  async deleteOldUserActivityLogs(daysToKeep = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    return this.userActivityLogs.where('timestamp').below(cutoffDate).delete();
  }

  // ============================================================================
  // LOGIN HISTORY OPERATIONS
  // ============================================================================

  /**
   * Add login history entry
   */
  async addLoginHistory(log: Omit<UserLoginHistory, 'id'>): Promise<string> {
    return (await this.userLoginHistory.add(log as UserLoginHistory)) as unknown as string;
  }

  /**
   * Get login history for user
   */
  async getUserLoginHistory(
    userId: string,
    limit = 50
  ): Promise<UserLoginHistory[]> {
    return this.userLoginHistory
      .where('userId')
      .equals(userId)
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * Get failed login attempts
   */
  async getFailedLoginAttempts(
    userId: string,
    hoursBack = 24
  ): Promise<UserLoginHistory[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursBack);
    return this.userLoginHistory
      .where('userId')
      .equals(userId)
      .filter((log) => log.status === 'failure' && log.timestamp >= cutoffDate)
      .toArray();
  }

  /**
   * Delete old login history
   */
  async deleteOldLoginHistory(daysToKeep = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    return this.userLoginHistory.where('timestamp').below(cutoffDate).delete();
  }

  // ============================================================================
  // SYSTEM ALERT OPERATIONS
  // ============================================================================

  /**
   * Add system alert
   */
  async addSystemAlert(alert: Omit<SystemAlert, 'id'>): Promise<string> {
    return (await this.systemAlerts.add(alert as SystemAlert)) as unknown as string;
  }

  /**
   * Get active system alerts
   */
  async getActiveSystemAlerts(): Promise<SystemAlert[]> {
    return this.systemAlerts.filter((alert) => !alert.resolved).toArray();
  }

  /**
   * Get system alerts by severity
   */
  async getAlertsBySeverity(severity: 'info' | 'warning' | 'critical'): Promise<SystemAlert[]> {
    return this.systemAlerts.where('severity').equals(severity).reverse().toArray();
  }

  /**
   * Get alerts with filters
   */
  async getSystemAlerts(
    limit = 50,
    offset = 0,
    filters?: {
      type?: string;
      severity?: 'info' | 'warning' | 'critical';
      resolved?: boolean;
      dateRange?: { start: Date; end: Date };
    }
  ): Promise<{ alerts: SystemAlert[]; total: number }> {
    let query = this.systemAlerts.orderBy('createdAt').reverse();

    if (filters?.resolved !== undefined) {
      query = query.filter((alert) => alert.resolved === filters.resolved);
    }

    if (filters?.severity) {
      query = query.filter((alert) => alert.severity === filters.severity);
    }

    if (filters?.type) {
      query = query.filter((alert) => alert.type === filters.type);
    }

    if (filters?.dateRange) {
      query = query.filter(
        (alert) =>
          alert.createdAt >= filters.dateRange!.start &&
          alert.createdAt <= filters.dateRange!.end
      );
    }

    const total = await query.count();
    const alerts = await query.offset(offset).limit(limit).toArray();
    return { alerts, total };
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    await this.systemAlerts.update(alertId, {
      resolved: true,
      resolvedAt: new Date(),
    });
  }

  /**
   * Delete resolved alerts older than X days
   */
  async deleteOldResolvedAlerts(daysToKeep = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const alertsToDelete = await this.systemAlerts
      .filter((alert) => alert.resolved && alert.createdAt! <= cutoffDate)
      .toArray();
    await this.systemAlerts.bulkDelete(alertsToDelete.map(a => a.id as any));
    return alertsToDelete.length;
  }

  // ============================================================================
  // SERVICE LOG OPERATIONS
  // ============================================================================

  /**
   * Add service log
   */
  async addServiceLog(log: Omit<ServiceLog, 'id'>): Promise<string> {
    return (await this.serviceLogs.add(log as ServiceLog)) as unknown as string;
  }

  /**
   * Get service logs
   */
  async getServiceLogs(
    serviceName?: string,
    limit = 100,
    offset = 0
  ): Promise<{ logs: ServiceLog[]; total: number }> {
    let query = this.serviceLogs.orderBy('timestamp').reverse();

    if (serviceName) {
      query = query.filter((log) => log.serviceName === serviceName);
    }

    const total = await query.count();
    const logs = await query.offset(offset).limit(limit).toArray();
    return { logs, total };
  }

  /**
   * Get error logs
   */
  async getErrorLogs(
    serviceName?: string,
    limit = 50
  ): Promise<ServiceLog[]> {
    let query = this.serviceLogs.where('level').equals('error');

    if (serviceName) {
      query = query.filter((log) => log.serviceName === serviceName);
    }

    return query.reverse().limit(limit).toArray();
  }

  /**
   * Delete old service logs
   */
  async deleteOldServiceLogs(daysToKeep = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    return this.serviceLogs.where('timestamp').below(cutoffDate).delete();
  }

  // ============================================================================
  // TENANT ACTIVITY OPERATIONS
  // ============================================================================

  /**
   * Add tenant activity
   */
  async addTenantActivity(activity: Omit<TenantActivity, 'id'>): Promise<string> {
    return (await this.tenantActivity.add(activity as TenantActivity)) as unknown as string;
  }

  /**
   * Get tenant activity
   */
  async getTenantActivity(
    tenantId: string,
    limit = 50,
    offset = 0
  ): Promise<{ activities: TenantActivity[]; total: number }> {
    const total = await this.tenantActivity.where('tenantId').equals(tenantId).count();
    const activities = await this.tenantActivity
      .where('tenantId')
      .equals(tenantId)
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
    return { activities, total };
  }

  /**
   * Delete old tenant activity
   */
  async deleteOldTenantActivity(daysToKeep = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    return this.tenantActivity.where('timestamp').below(cutoffDate).delete();
  }

  // ============================================================================
  // ADMIN UI STATE OPERATIONS
  // ============================================================================

  /**
   * Save admin UI state
   */
  async saveAdminUIState(userId: string, state: AdminUIState): Promise<void> {
    await this.adminUIState.put({ ...state, id: userId } as any);
  }

  /**
   * Get admin UI state
   */
  async getAdminUIState(userId: string): Promise<AdminUIState | undefined> {
    return this.adminUIState.get(userId);
  }

  // ============================================================================
  // CACHE OPERATIONS
  // ============================================================================

  /**
   * Set cache value
   */
  async setCache(key: string, value: any, ttlMinutes = 60): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);
    await this.adminCache.put({ key, value, expiresAt });
  }

  /**
   * Get cache value
   */
  async getCache(key: string): Promise<any | undefined> {
    const item = await this.adminCache.get(key);
    if (!item) return undefined;

    // Check if expired
    if (new Date() > item.expiresAt) {
      await this.adminCache.delete(key);
      return undefined;
    }

    return item.value;
  }

  /**
   * Delete cache value
   */
  async deleteCache(key: string): Promise<void> {
    await this.adminCache.delete(key);
  }

  /**
   * Clear all expired cache entries
   */
  async clearExpiredCache(): Promise<number> {
    return this.adminCache.where('expiresAt').below(new Date()).delete();
  }

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {
    await this.adminCache.clear();
  }

  // ============================================================================
  // MAINTENANCE OPERATIONS
  // ============================================================================

  /**
   * Run maintenance tasks (cleanup old logs, etc.)
   */
  async runMaintenance(): Promise<void> {
    await Promise.all([
      this.deleteOldAuditLogs(90),
      this.deleteOldUserActivityLogs(30),
      this.deleteOldLoginHistory(90),
      this.deleteOldResolvedAlerts(7),
      this.deleteOldServiceLogs(30),
      this.deleteOldTenantActivity(90),
      this.clearExpiredCache(),
    ]);
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<{
    auditLogs: number;
    userActivityLogs: number;
    loginHistory: number;
    systemAlerts: number;
    serviceLogs: number;
    tenantActivity: number;
  }> {
    return {
      auditLogs: await this.auditLogs.count(),
      userActivityLogs: await this.userActivityLogs.count(),
      loginHistory: await this.userLoginHistory.count(),
      systemAlerts: await this.systemAlerts.count(),
      serviceLogs: await this.serviceLogs.count(),
      tenantActivity: await this.tenantActivity.count(),
    };
  }
}

// Singleton instance
let instance: AdminDatabase | null = null;

export const getAdminDatabase = (): AdminDatabase => {
  if (!instance) {
    instance = new AdminDatabase();
  }
  return instance;
};

export default AdminDatabase;
