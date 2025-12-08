/**
 * Notification Database Service
 * Dexie implementation for storing and managing notifications locally
 */

import Dexie, { Table } from 'dexie';
import {
  Notification,
  NotificationPreferences,
  NotificationGroup,
  NotificationGroupAction,
  NotificationStats,
  NotificationListRequest,
  NotificationCategory,
  NotificationPriority,
  NotificationType,
} from '../types/notifications';

/**
 * Notification Database
 */
class NotificationDB extends Dexie {
  notifications!: Table<Notification>;
  preferences!: Table<NotificationPreferences>;
  readStatus!: Table<{ id: string; notificationId: string; userId: string; readAt: Date }>;
  dismissStatus!: Table<{ id: string; notificationId: string; userId: string; dismissedAt: Date }>;
  groups!: Table<NotificationGroup>;
  stats!: Table<NotificationStats>;
  cache!: Table<{ key: string; value: any; expiresAt: Date }>;

  constructor() {
    super('notificationDB');
    this.version(1).stores({
      notifications:
        '&id, userId, [userId+createdAt], tenantId, type, priority, status, groupId, [userId+status]',
      preferences: '&userId, tenantId, [userId+tenantId]',
      readStatus: '&id, notificationId, userId, [userId+readAt]',
      dismissStatus: '&id, notificationId, userId, [userId+dismissedAt]',
      groups:
        '&id, userId, groupAction, [userId+groupAction], [userId+lastNotificationTime]',
      stats: '&userId',
      cache: '&key, expiresAt',
    });
  }
}

const db = new NotificationDB();

/**
 * Notification Database Service
 */
export const notificationDatabase = {
  /**
   * Notification CRUD Operations
   */

  async addNotification(notification: Notification): Promise<string> {
    const id = await db.notifications.add(notification);
    await this.updateStats(notification.userId);
    return id as string;
  },

  async addNotifications(notifications: Notification[]): Promise<string[]> {
    const ids = await db.notifications.bulkAdd(notifications);
    if (notifications.length > 0) {
      await this.updateStats(notifications[0].userId);
    }
    return ids as string[];
  },

  async getNotification(id: string): Promise<Notification | undefined> {
    return db.notifications.get(id);
  },

  async getNotifications(
    userId: string,
    request: NotificationListRequest
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    let query = db.notifications.where('userId').equals(userId);

    // Apply filters
    if (request.status && request.status.length > 0) {
      query = query.filter((n) => request.status!.includes(n.status));
    }

    if (request.categories && request.categories.length > 0) {
      query = query.filter((n) => request.categories!.includes(n.category));
    }

    if (request.priority && request.priority.length > 0) {
      query = query.filter((n) => request.priority!.includes(n.priority));
    }

    if (request.unreadOnly) {
      query = query.filter((n) => !n.isRead);
    }

    if (request.searchTerm) {
      const term = request.searchTerm.toLowerCase();
      query = query.filter(
        (n) =>
          n.title.toLowerCase().includes(term) ||
          n.message.toLowerCase().includes(term) ||
          (n.description?.toLowerCase().includes(term) ?? false)
      );
    }

    const total = await query.count();
    const unreadCount = await db.notifications
      .where('userId')
      .equals(userId)
      .filter((n) => !n.isRead)
      .count();

    // Sort
    let sorted = await query.toArray();
    if (request.sortBy === 'priority') {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      sorted.sort(
        (a, b) =>
          priorityOrder[a.priority as keyof typeof priorityOrder] -
          priorityOrder[b.priority as keyof typeof priorityOrder]
      );
    } else if (request.sortBy === 'oldest') {
      sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } else {
      sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    // Paginate
    const offset = request.offset || 0;
    const limit = request.limit || 50;
    const paginated = sorted.slice(offset, offset + limit);

    // Mark as seen if requested
    if (request.markSeen) {
      const unseenIds = paginated.filter((n) => !n.isRead).map((n) => n.id);
      if (unseenIds.length > 0) {
        await this.markAsRead(unseenIds);
      }
    }

    return { notifications: paginated, total, unreadCount };
  },

  async getNotificationsByCategory(
    userId: string,
    category: NotificationCategory
  ): Promise<Notification[]> {
    return db.notifications
      .where('[userId+status]')
      .equals([userId, 'unread'])
      .filter((n) => n.category === category)
      .toArray();
  },

  async getUnreadCount(userId: string): Promise<number> {
    return db.notifications.where('userId').equals(userId).filter((n) => !n.isRead).count();
  },

  async updateNotification(id: string, updates: Partial<Notification>): Promise<void> {
    await db.notifications.update(id, updates);
  },

  async deleteNotification(id: string): Promise<void> {
    await db.notifications.delete(id);
  },

  async deleteOldNotifications(userId: string, olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const toDelete = await db.notifications
      .where('userId')
      .equals(userId)
      .filter((n) => n.createdAt < cutoffDate && (n.isDismissed || n.isRead))
      .toArray();

    await db.notifications.bulkDelete(toDelete.map((n) => n.id));
    return toDelete.length;
  },

  /**
   * Read Status Operations
   */

  async markAsRead(notificationIds: string[]): Promise<void> {
    const now = new Date();
    const notifications = await db.notifications.bulkGet(notificationIds);

    const updates = notifications
      .filter((n) => n !== undefined)
      .map((n) => ({
        ...n,
        isRead: true,
        status: 'read' as const,
        readAt: now,
      }));

    await db.notifications.bulkPut(updates as Notification[]);

    // Store read status for sync
    const readStatuses = notificationIds.map((id) => ({
      id: `${id}-read-${Date.now()}`,
      notificationId: id,
      userId: notifications[0]?.userId || '',
      readAt: now,
    }));

    await db.readStatus.bulkAdd(readStatuses);
  },

  async markAllAsRead(userId: string): Promise<number> {
    const now = new Date();
    const unread = await db.notifications
      .where('userId')
      .equals(userId)
      .filter((n) => !n.isRead)
      .toArray();

    const updates = unread.map((n) => ({
      ...n,
      isRead: true,
      status: 'read' as const,
      readAt: now,
    }));

    await db.notifications.bulkPut(updates);

    const readStatuses = unread.map((n) => ({
      id: `${n.id}-read-${Date.now()}`,
      notificationId: n.id,
      userId,
      readAt: now,
    }));

    await db.readStatus.bulkAdd(readStatuses);

    return unread.length;
  },

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return db.notifications
      .where('userId')
      .equals(userId)
      .filter((n) => !n.isRead)
      .toArray();
  },

  /**
   * Dismiss Operations
   */

  async dismissNotification(id: string): Promise<void> {
    const notification = await db.notifications.get(id);
    if (notification) {
      await db.notifications.update(id, {
        isDismissed: true,
        status: 'dismissed' as const,
        dismissedAt: new Date(),
      });

      await db.dismissStatus.add({
        id: `${id}-dismiss-${Date.now()}`,
        notificationId: id,
        userId: notification.userId,
        dismissedAt: new Date(),
      });
    }
  },

  async dismissNotifications(notificationIds: string[]): Promise<void> {
    const now = new Date();
    const notifications = await db.notifications.bulkGet(notificationIds);

    const updates = notifications
      .filter((n) => n !== undefined)
      .map((n) => ({
        ...n,
        isDismissed: true,
        status: 'dismissed' as const,
        dismissedAt: now,
      }));

    await db.notifications.bulkPut(updates as Notification[]);

    const dismissStatuses = notificationIds.map((id, idx) => ({
      id: `${id}-dismiss-${Date.now()}`,
      notificationId: id,
      userId: notifications[idx]?.userId || '',
      dismissedAt: now,
    }));

    await db.dismissStatus.bulkAdd(dismissStatuses);
  },

  /**
   * Snooze Operations
   */

  async snoozeNotification(id: string, snoozeUntil: Date): Promise<void> {
    await db.notifications.update(id, {
      snoozedUntil: snoozeUntil,
      status: 'unread' as const,
    });
  },

  async getExpiredSnoozed(userId: string): Promise<Notification[]> {
    const now = new Date();
    return db.notifications
      .where('userId')
      .equals(userId)
      .filter((n) => (n.snoozedUntil && n.snoozedUntil <= now) ?? false)
      .toArray();
  },

  /**
   * Grouping Operations
   */

  async addGroup(group: NotificationGroup): Promise<string> {
    return db.groups.add(group) as Promise<string>;
  },

  async getGroups(userId: string): Promise<NotificationGroup[]> {
    return db.groups.where('userId').equals(userId).toArray();
  },

  async updateGroup(
    userId: string,
    groupAction: NotificationGroupAction,
    updates: Partial<NotificationGroup>
  ): Promise<void> {
    const group = await db.groups
      .where('[userId+groupAction]')
      .equals([userId, groupAction])
      .first();

    if (group) {
      await db.groups.update(group.id, updates);
    }
  },

  async deleteGroup(groupId: string): Promise<void> {
    await db.groups.delete(groupId);
  },

  /**
   * Preferences Operations
   */

  async savePreferences(preferences: NotificationPreferences): Promise<void> {
    await db.preferences.put({
      ...preferences,
      updatedAt: new Date(),
    });
  },

  async getPreferences(userId: string, tenantId: string): Promise<NotificationPreferences | undefined> {
    return db.preferences.where('[userId+tenantId]').equals([userId, tenantId]).first();
  },

  async updatePreferences(
    userId: string,
    tenantId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<void> {
    const existing = await this.getPreferences(userId, tenantId);
    if (existing) {
      await db.preferences.update(`${userId}-${tenantId}`, {
        ...updates,
        updatedAt: new Date(),
      });
    }
  },

  /**
   * Statistics Operations
   */

  async updateStats(userId: string): Promise<void> {
    const notifications = await db.notifications.where('userId').equals(userId).toArray();

    const stats: NotificationStats = {
      userId,
      totalCount: notifications.length,
      unreadCount: notifications.filter((n) => !n.isRead).length,
      byPriority: {
        critical: notifications.filter((n) => n.priority === 'critical').length,
        high: notifications.filter((n) => n.priority === 'high').length,
        normal: notifications.filter((n) => n.priority === 'normal').length,
        low: notifications.filter((n) => n.priority === 'low').length,
      },
      byCategory: {} as Record<NotificationCategory, number>,
      byType: {} as Record<NotificationType, number>,
      lastNotificationTime: notifications.length > 0 ? notifications[0].createdAt : undefined,
      oldestUnreadTime: notifications.find((n) => !n.isRead)?.createdAt,
    };

    // Count by category
    const categories: NotificationCategory[] = [
      'chat',
      'email',
      'tasks',
      'calendar',
      'system',
      'billing',
      'documents',
      'knowledge',
      'admin',
    ];
    categories.forEach((cat) => {
      stats.byCategory[cat] = notifications.filter((n) => n.category === cat).length;
    });

    // Count by type
    notifications.forEach((n) => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
    });

    await db.stats.put(stats);
  },

  async getStats(userId: string): Promise<NotificationStats | undefined> {
    return db.stats.get(userId);
  },

  /**
   * Cache Operations
   */

  async setCache(key: string, value: any, ttlMs: number = 3600000): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlMs);
    await db.cache.put({ key, value, expiresAt });
  },

  async getCache(key: string): Promise<any> {
    const item = await db.cache.get(key);
    if (!item) return null;

    if (item.expiresAt < new Date()) {
      await db.cache.delete(key);
      return null;
    }

    return item.value;
  },

  async clearCache(key?: string): Promise<void> {
    if (key) {
      await db.cache.delete(key);
    } else {
      await db.cache.clear();
    }
  },

  async clearExpiredCache(): Promise<number> {
    const now = new Date();
    const expired = await db.cache.filter((item) => item.expiresAt < now).toArray();
    await db.cache.bulkDelete(expired.map((item) => item.key));
    return expired.length;
  },

  /**
   * Maintenance Operations
   */

  async runMaintenance(userId: string): Promise<void> {
    // Clean old notifications (30+ days)
    await this.deleteOldNotifications(userId, 30);

    // Clean old read/dismiss status (90 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const oldReadStatus = await db.readStatus
      .where('userId')
      .equals(userId)
      .filter((r) => r.readAt < cutoffDate)
      .toArray();

    await db.readStatus.bulkDelete(oldReadStatus.map((r) => r.id));

    const oldDismissStatus = await db.dismissStatus
      .where('userId')
      .equals(userId)
      .filter((d) => d.dismissedAt < cutoffDate)
      .toArray();

    await db.dismissStatus.bulkDelete(oldDismissStatus.map((d) => d.id));

    // Clear expired cache
    await this.clearExpiredCache();

    // Update stats
    await this.updateStats(userId);
  },

  async getStatistics(userId: string): Promise<{
    notificationCount: number;
    preferencesCount: number;
    readStatusCount: number;
    dismissStatusCount: number;
    groupCount: number;
    cacheSize: number;
  }> {
    return {
      notificationCount: await db.notifications.where('userId').equals(userId).count(),
      preferencesCount: await db.preferences.where('userId').equals(userId).count(),
      readStatusCount: await db.readStatus.where('userId').equals(userId).count(),
      dismissStatusCount: await db.dismissStatus.where('userId').equals(userId).count(),
      groupCount: await db.groups.where('userId').equals(userId).count(),
      cacheSize: await db.cache.count(),
    };
  },

  /**
   * Sync Operations
   */

  async getUnsynced(userId: string): Promise<{
    readStatus: any[];
    dismissStatus: any[];
  }> {
    const readStatus = await db.readStatus.where('userId').equals(userId).toArray();
    const dismissStatus = await db.dismissStatus.where('userId').equals(userId).toArray();

    return { readStatus, dismissStatus };
  },

  async clearSyncedStatus(readIds: string[], dismissIds: string[]): Promise<void> {
    if (readIds.length > 0) {
      await db.readStatus.bulkDelete(readIds);
    }
    if (dismissIds.length > 0) {
      await db.dismissStatus.bulkDelete(dismissIds);
    }
  },

  /**
   * Database Management
   */

  async clear(userId: string): Promise<void> {
    await db.notifications.where('userId').equals(userId).delete();
    await db.readStatus.where('userId').equals(userId).delete();
    await db.dismissStatus.where('userId').equals(userId).delete();
    await db.groups.where('userId').equals(userId).delete();
    await db.stats.delete(userId);
  },

  async clearAll(): Promise<void> {
    await db.notifications.clear();
    await db.readStatus.clear();
    await db.dismissStatus.clear();
    await db.groups.clear();
    await db.stats.clear();
    await db.cache.clear();
  },

  /**
   * Close database connection
   */

  async close(): Promise<void> {
    await db.close();
  },
};

export type NotificationDatabaseService = typeof notificationDatabase;
