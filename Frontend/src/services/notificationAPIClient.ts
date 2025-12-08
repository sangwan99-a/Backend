/**
 * Notification API Client
 * REST API endpoints for notification management
 */

import {
  Notification,
  NotificationListRequest,
  NotificationListResponse,
  NotificationPreferences,
  BulkMarkReadRequest,
  BulkMarkReadResponse,
  SnoozeRequest,
  ExportNotificationsRequest,
  NotificationSettings,
} from '../types/notifications';

/**
 * Notification API Client
 */
class NotificationAPIClient {
  private baseURL = '/api/v1';
  private authToken?: string;

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    options?: { params?: Record<string, any> }
  ): Promise<T> {
    const url = new URL(this.baseURL + path, window.location.origin);

    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Notification List Operations
   */

  async listNotifications(
    userId: string,
    request: NotificationListRequest
  ): Promise<NotificationListResponse> {
    return this.request<NotificationListResponse>(
      'GET',
      `/notifications/${userId}`,
      undefined,
      {
        params: {
          limit: request.limit,
          offset: request.offset,
          status: request.status?.join(','),
          categories: request.categories?.join(','),
          priority: request.priority?.join(','),
          unreadOnly: request.unreadOnly,
          markSeen: request.markSeen,
          searchTerm: request.searchTerm,
          sortBy: request.sortBy,
        },
      }
    );
  }

  async getNotification(notificationId: string): Promise<Notification> {
    return this.request<Notification>('GET', `/notifications/by-id/${notificationId}`);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const response = await this.request<{ unreadCount: number }>(
      'GET',
      `/notifications/${userId}/unread-count`
    );
    return response.unreadCount;
  }

  /**
   * Bulk Operations
   */

  async bulkMarkAsRead(request: BulkMarkReadRequest): Promise<BulkMarkReadResponse> {
    return this.request<BulkMarkReadResponse>('PUT', '/notifications/bulk/read', request);
  }

  async bulkDismiss(notificationIds: string[]): Promise<BulkMarkReadResponse> {
    return this.request<BulkMarkReadResponse>('PUT', '/notifications/bulk/dismiss', {
      notificationIds,
    });
  }

  async bulkDelete(notificationIds: string[]): Promise<BulkMarkReadResponse> {
    return this.request<BulkMarkReadResponse>('DELETE', '/notifications/bulk', {
      notificationIds,
    });
  }

  /**
   * Individual Notification Operations
   */

  async markAsRead(notificationId: string): Promise<Notification> {
    return this.request<Notification>('PUT', `/notifications/${notificationId}/read`);
  }

  async markAsSeen(notificationId: string): Promise<Notification> {
    return this.request<Notification>('PUT', `/notifications/${notificationId}/seen`);
  }

  async dismiss(notificationId: string): Promise<Notification> {
    return this.request<Notification>('PUT', `/notifications/${notificationId}/dismiss`);
  }

  async delete(notificationId: string): Promise<void> {
    await this.request<void>('DELETE', `/notifications/${notificationId}`);
  }

  /**
   * Snooze Operations
   */

  async snooze(notificationId: string, request: SnoozeRequest): Promise<Notification> {
    return this.request<Notification>(
      'PUT',
      `/notifications/${notificationId}/snooze`,
      request
    );
  }

  async bulkSnooze(
    notificationIds: string[],
    snoozeUntil: Date
  ): Promise<BulkMarkReadResponse> {
    return this.request<BulkMarkReadResponse>('PUT', '/notifications/bulk/snooze', {
      notificationIds,
      snoozeUntil,
    });
  }

  /**
   * Preferences Operations
   */

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    return this.request<NotificationPreferences>('GET', `/notifications/${userId}/preferences`);
  }

  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    return this.request<NotificationPreferences>(
      'PUT',
      `/notifications/${userId}/preferences`,
      preferences
    );
  }

  async getSettings(userId: string): Promise<NotificationSettings> {
    return this.request<NotificationSettings>('GET', `/notifications/${userId}/settings`);
  }

  async updateSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    return this.request<NotificationSettings>(
      'PUT',
      `/notifications/${userId}/settings`,
      settings
    );
  }

  /**
   * Category-Specific Operations
   */

  async getMentions(userId: string, limit: number = 50): Promise<Notification[]> {
    const response = await this.listNotifications(userId, {
      categories: ['chat', 'tasks'],
      limit,
    });
    return response.notifications;
  }

  async getTaskNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    const response = await this.listNotifications(userId, {
      categories: ['tasks'],
      limit,
    });
    return response.notifications;
  }

  async getCalendarNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    const response = await this.listNotifications(userId, {
      categories: ['calendar'],
      limit,
    });
    return response.notifications;
  }

  /**
   * Do Not Disturb Operations
   */

  async setDoNotDisturb(userId: string, enabled: boolean, endTime?: Date): Promise<NotificationPreferences> {
    return this.updatePreferences(userId, {
      doNotDisturb: {
        enabled,
        ...(endTime && { endTime: endTime.toISOString() }),
      } as any,
    });
  }

  async scheduleDoNotDisturb(
    userId: string,
    startTime: string,
    endTime: string,
    days?: string[]
  ): Promise<NotificationPreferences> {
    return this.updatePreferences(userId, {
      doNotDisturb: {
        enabled: true,
        startTime,
        endTime,
        days,
      } as any,
    });
  }

  /**
   * Mute Operations
   */

  async muteUser(userId: string, targetUserId: string, until?: Date): Promise<NotificationSettings> {
    return this.request<NotificationSettings>(
      'POST',
      `/notifications/${userId}/mute/user/${targetUserId}`,
      { until }
    );
  }

  async muteConversation(
    userId: string,
    conversationId: string,
    until?: Date
  ): Promise<NotificationSettings> {
    return this.request<NotificationSettings>(
      'POST',
      `/notifications/${userId}/mute/conversation/${conversationId}`,
      { until }
    );
  }

  async muteChannel(userId: string, channelId: string, until?: Date): Promise<NotificationSettings> {
    return this.request<NotificationSettings>(
      'POST',
      `/notifications/${userId}/mute/channel/${channelId}`,
      { until }
    );
  }

  async unmuteAll(userId: string): Promise<NotificationSettings> {
    return this.request<NotificationSettings>('POST', `/notifications/${userId}/unmute-all`);
  }

  /**
   * Export Operations
   */

  async export(userId: string, request: ExportNotificationsRequest): Promise<Blob> {
    const params = {
      format: request.format,
      status: request.status?.join(','),
      categories: request.categories?.join(','),
      startDate: request.dateRange?.start.toISOString(),
      endDate: request.dateRange?.end.toISOString(),
    };

    const url = new URL(`${this.baseURL}/notifications/${userId}/export`, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, String(value));
    });

    const headers: HeadersInit = {};
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
      throw new Error(`Export failed: HTTP ${response.status}`);
    }

    return response.blob();
  }

  /**
   * Search Operations
   */

  async search(
    userId: string,
    searchTerm: string,
    limit: number = 50
  ): Promise<Notification[]> {
    const response = await this.listNotifications(userId, {
      searchTerm,
      limit,
    });
    return response.notifications;
  }

  /**
   * Statistics Operations
   */

  async getStats(userId: string): Promise<{
    total: number;
    unread: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    return this.request('GET', `/notifications/${userId}/stats`);
  }

  /**
   * Archive Operations
   */

  async archive(notificationId: string): Promise<Notification> {
    return this.request<Notification>('PUT', `/notifications/${notificationId}/archive`);
  }

  async bulkArchive(notificationIds: string[]): Promise<BulkMarkReadResponse> {
    return this.request<BulkMarkReadResponse>('PUT', '/notifications/bulk/archive', {
      notificationIds,
    });
  }

  /**
   * Mark All Operations
   */

  async markAllAsRead(userId: string): Promise<BulkMarkReadResponse> {
    return this.request<BulkMarkReadResponse>('PUT', `/notifications/${userId}/mark-all-read`);
  }

  async dismissAll(userId: string): Promise<BulkMarkReadResponse> {
    return this.request<BulkMarkReadResponse>('PUT', `/notifications/${userId}/dismiss-all`);
  }
};

const notificationAPIClient = new NotificationAPIClient();
export default notificationAPIClient;
export type NotificationAPIClientType = typeof notificationAPIClient;
