/**
 * Notification WebSocket Service
 * Real-time notifications with reconnection, deduplication, and fallback polling
 */

import {
  Notification,
  NotificationWSMessage,
  WSNotificationPayload,
  WSBulkNotificationPayload,
  WSReadStatusPayload,
} from '../types/notifications';
import notificationAPIClient from './notificationAPIClient';

type NotificationEventListener = (notification: Notification | Notification[]) => void;
type StatusListener = (status: 'connected' | 'disconnected' | 'reconnecting') => void;

/**
 * Notification WebSocket Service
 */
class NotificationWebSocketService {
  private ws: WebSocket | null = null;
  private url: string = '';
  private userId: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000; // Start with 1s
  private maxReconnectDelay: number = 30000; // Max 30s
  private reconnectTimer: NodeJS.Timeout | null = null;

  // Listeners
  private notificationListeners: Set<NotificationEventListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();

  // Deduplication
  private dedupeKeys: Set<string> = new Set();
  private dedupeTTL: number = 60000; // 1 minute

  // Fallback polling
  private fallbackPollInterval: NodeJS.Timeout | null = null;
  private pollIntervalMs: number = 30000; // 30 seconds
  private lastPollTime: Date = new Date();

  // Heartbeat
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeoutMs: number = 45000; // 45 seconds

  // Message queue for offline support
  private messageQueue: NotificationWSMessage[] = [];
  private maxQueueSize: number = 100;

  /**
   * Initialize WebSocket connection
   */
  connect(userId: string, authToken?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userId = userId;

      // Construct WS URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      this.url = `${protocol}//${host}/ws/notifications/${userId}`;

      if (authToken) {
        this.url += `?token=${encodeURIComponent(authToken)}`;
      }

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[NotificationWS] Connected');
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.notifyStatusListeners('connected');
          this.startHeartbeat();
          this.startFallbackPoll();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('[NotificationWS] Error:', error);
          this.notifyStatusListeners('disconnected');
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[NotificationWS] Closed');
          this.stopHeartbeat();
          this.notifyStatusListeners('disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message: NotificationWSMessage = JSON.parse(data);

      switch (message.type) {
        case 'notification':
          this.handleNotification(message.payload);
          break;

        case 'bulk_notification':
          this.handleBulkNotification(message.payload);
          break;

        case 'read':
          this.handleReadStatus(message.payload);
          break;

        case 'dismiss':
          this.handleDismiss(message.payload);
          break;

        case 'notification_update':
          this.handleNotificationUpdate(message.payload);
          break;

        case 'notification_delete':
          this.handleNotificationDelete(message.payload);
          break;

        case 'pong':
          // Heartbeat response
          break;

        default:
          console.warn('[NotificationWS] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[NotificationWS] Failed to parse message:', error);
    }
  }

  /**
   * Handle single notification
   */
  private handleNotification(payload: WSNotificationPayload): void {
    const { notification, dedupKey } = payload;

    // Deduplication
    if (dedupKey && this.dedupeKeys.has(dedupKey)) {
      console.log('[NotificationWS] Duplicate notification, skipping');
      return;
    }

    if (dedupKey) {
      this.dedupeKeys.add(dedupKey);
      // Remove after TTL
      setTimeout(() => {
        this.dedupeKeys.delete(dedupKey);
      }, this.dedupeTTL);
    }

    // Notify listeners
    this.notifyListeners(notification);
  }

  /**
   * Handle bulk notifications
   */
  private handleBulkNotification(payload: WSBulkNotificationPayload): void {
    const { notifications } = payload;
    notifications.forEach((n) => this.notifyListeners(n));
  }

  /**
   * Handle read status update
   */
  private handleReadStatus(payload: WSReadStatusPayload): void {
    console.log('[NotificationWS] Read status update for', payload.notificationIds.length, 'notifications');
    // Handle cross-device sync
    // This would typically trigger a local DB update
  }

  /**
   * Handle dismiss
   */
  private handleDismiss(payload: any): void {
    console.log('[NotificationWS] Dismiss for', payload.notificationIds.length, 'notifications');
  }

  /**
   * Handle notification update
   */
  private handleNotificationUpdate(payload: any): void {
    const { notificationId, updates } = payload;
    console.log('[NotificationWS] Update notification:', notificationId);
  }

  /**
   * Handle notification delete
   */
  private handleNotificationDelete(payload: any): void {
    const { notificationId } = payload;
    console.log('[NotificationWS] Delete notification:', notificationId);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(notification: Notification): void {
    this.notificationListeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (error) {
        console.error('[NotificationWS] Listener error:', error);
      }
    });
  }

  /**
   * Notify status listeners
   */
  private notifyStatusListeners(status: 'connected' | 'disconnected' | 'reconnecting'): void {
    this.statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error('[NotificationWS] Status listener error:', error);
      }
    });
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[NotificationWS] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 1.5,
      this.maxReconnectDelay
    );

    console.log(
      `[NotificationWS] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`
    );

    this.notifyStatusListeners('reconnecting');

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.userId).catch((error) => {
        console.error('[NotificationWS] Reconnection failed:', error);
      });
    }, this.reconnectDelay);
  }

  /**
   * Start heartbeat to detect connection issues
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'pong',
          timestamp: Date.now(),
          payload: {},
        });
      }
    }, this.heartbeatTimeoutMs / 3);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Start fallback polling when WebSocket is unavailable
   */
  private startFallbackPoll(): void {
    // Stop existing poll if any
    if (this.fallbackPollInterval) {
      clearInterval(this.fallbackPollInterval);
    }

    // Only enable polling if WS is disconnected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('[NotificationWS] Starting fallback polling');
      this.fallbackPollInterval = setInterval(() => {
        this.pollNotifications();
      }, this.pollIntervalMs);
    }
  }

  /**
   * Stop fallback polling
   */
  private stopFallbackPoll(): void {
    if (this.fallbackPollInterval) {
      clearInterval(this.fallbackPollInterval);
      this.fallbackPollInterval = null;
    }
  }

  /**
   * Poll notifications from API when WS is unavailable
   */
  private async pollNotifications(): Promise<void> {
    try {
      const response = await notificationAPIClient.listNotifications(this.userId, {
        limit: 50,
        sortBy: 'recent',
      });

      // Filter for new notifications since last poll
      const newNotifications = response.notifications.filter(
        (n) => n.createdAt > this.lastPollTime
      );

      newNotifications.forEach((n) => this.notifyListeners(n));
      this.lastPollTime = new Date();
    } catch (error) {
      console.error('[NotificationWS] Polling error:', error);
    }
  }

  /**
   * Send message through WebSocket
   */
  send(message: NotificationWSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue for later
      if (this.messageQueue.length < this.maxQueueSize) {
        this.messageQueue.push(message);
      }
    }
  }

  /**
   * Subscribe to notifications
   */
  subscribe(listener: NotificationEventListener): () => void {
    this.notificationListeners.add(listener);

    // Unsubscribe function
    return () => {
      this.notificationListeners.delete(listener);
    };
  }

  /**
   * Subscribe to status changes
   */
  subscribeToStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);

    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * Mark notification as read through WebSocket
   */
  markAsRead(notificationId: string): void {
    this.send({
      type: 'read',
      payload: {
        notificationIds: [notificationId],
        readAt: new Date(),
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Mark notifications as read through WebSocket
   */
  markMultipleAsRead(notificationIds: string[]): void {
    this.send({
      type: 'read',
      payload: {
        notificationIds,
        readAt: new Date(),
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Dismiss notification through WebSocket
   */
  dismiss(notificationId: string): void {
    this.send({
      type: 'dismiss',
      payload: {
        notificationIds: [notificationId],
        dismissedAt: new Date(),
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get queued messages
   */
  getQueuedMessages(): NotificationWSMessage[] {
    return [...this.messageQueue];
  }

  /**
   * Flush queued messages
   */
  flushQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat();
    this.stopFallbackPoll();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    isConnected: boolean;
    reconnectAttempts: number;
    queuedMessages: number;
    dedupeKeys: number;
  } {
    return {
      isConnected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      dedupeKeys: this.dedupeKeys.size,
    };
  }
}

export const notificationWebSocket = new NotificationWebSocketService();
export type NotificationWebSocketServiceType = typeof notificationWebSocket;
