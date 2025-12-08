/**
 * Documents WebSocket Notifications Service
 * 
 * Real-time events:
 * - File updates (rename, move, delete)
 * - Sharing changes
 * - Comments and replies
 * - Collaboration sessions (user viewing/editing)
 * - Upload notifications
 * - Activity streams
 * 
 * Reconnection: Exponential backoff (3s → 6s → 12s → 24s → 48s, max 5 attempts)
 */

import { EventEmitter } from 'events';
import type {
  File,
  Folder,
  FileActivity,
  FileComment,
  CollaborationSession,
} from '../types/documents';

export type DocumentsWebSocketEvent =
  | { type: 'file_created'; data: File }
  | { type: 'file_updated'; data: File }
  | { type: 'file_deleted'; data: { fileId: string; folderId: string } }
  | { type: 'file_moved'; data: { fileId: string; oldFolderId: string; newFolderId: string } }
  | { type: 'file_shared'; data: { fileId: string; sharedWith: string[] } }
  | { type: 'file_starred'; data: { fileId: string; starred: boolean } }
  | { type: 'comment_added'; data: FileComment }
  | { type: 'comment_deleted'; data: { commentId: string; fileId: string } }
  | { type: 'collaboration_session'; data: CollaborationSession }
  | { type: 'upload_progress'; data: { fileId: string; progress: number } }
  | { type: 'upload_complete'; data: File }
  | { type: 'activity'; data: FileActivity }
  | { type: 'folder_created'; data: Folder }
  | { type: 'folder_deleted'; data: { folderId: string } };

class DocumentsWebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private shouldReconnect = true;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: string[] = [];
  private isConnected = false;

  constructor(url: string = process.env.REACT_APP_WS_URL || 'ws://localhost:3001') {
    super();
    this.url = url;
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[DocumentsWS] Connected to server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 3000;
          this.flushMessageQueue();
          this.startHeartbeat();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event: MessageEvent) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[DocumentsWS] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error: Event) => {
          console.error('[DocumentsWS] WebSocket error:', error);
          this.emit('error', error);
        };

        this.ws.onclose = () => {
          console.log('[DocumentsWS] Disconnected from server');
          this.isConnected = false;
          this.stopHeartbeat();
          this.emit('disconnected');

          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(
              `[DocumentsWS] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
            );
            setTimeout(() => this.connect().catch(console.error), this.reconnectDelay);
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, 48000);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from server
   */
  public disconnect(): void {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
    }
  }

  /**
   * Send message to server
   */
  public send(event: DocumentsWebSocketEvent): void {
    const message = JSON.stringify(event);

    if (this.isConnected && this.ws) {
      this.ws.send(message);
    } else {
      this.messageQueue.push(message);
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: DocumentsWebSocketEvent): void {
    // Emit specific event
    this.emit(message.type, message.data);

    // Emit generic message event
    this.emit('message', message);

    // Show notification for important events
    switch (message.type) {
      case 'file_shared':
        this.showNotification('File shared', `${(message.data as any).sharedWith.length} users`);
        break;
      case 'comment_added':
        this.showNotification('New comment', (message.data as FileComment).content?.substring(0, 50));
        break;
      case 'upload_complete':
        this.showNotification('Upload complete', (message.data as File).name);
        break;
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws) {
        this.ws.send(message);
      }
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Every 30 seconds
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
   * Show browser notification
   */
  private showNotification(title: string, body?: string): void {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  }

  /**
   * Subscribe to specific event
   */
  public on(
    event: DocumentsWebSocketEvent['type'],
    listener: (data: any) => void
  ): this {
    return super.on(event, listener);
  }

  /**
   * Subscribe to event once
   */
  public once(
    event: DocumentsWebSocketEvent['type'],
    listener: (data: any) => void
  ): this {
    return super.once(event, listener);
  }

  /**
   * Unsubscribe from event
   */
  public off(
    event: DocumentsWebSocketEvent['type'],
    listener: (data: any) => void
  ): this {
    return super.off(event, listener);
  }

  /**
   * Get connection status
   */
  public getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Request browser notification permission
   */
  public static requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

// Singleton instance
let instanceInstance: DocumentsWebSocketService | null = null;

/**
 * Get or create singleton instance
 */
export function getDocumentsWebSocketService(
  url?: string
): DocumentsWebSocketService {
  if (!instanceInstance) {
    instanceInstance = new DocumentsWebSocketService(url);
  }
  return instanceInstance;
}

export default DocumentsWebSocketService;
