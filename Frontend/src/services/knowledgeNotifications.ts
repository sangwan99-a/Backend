/**
 * Knowledge Base WebSocket Service
 * Real-time article updates, new articles, and collaborative editing notifications
 */

import { EventEmitter } from 'events';

export interface ArticleUpdate {
  articleId: string;
  type: 'created' | 'updated' | 'deleted' | 'published' | 'commented';
  data: any;
  timestamp: Date;
  userId: string;
  userName: string;
}

export interface CommentNotification {
  articleId: string;
  commentId: string;
  author: string;
  content: string;
  timestamp: Date;
  mentions: string[];
}

export interface CollaborativeEditNotification {
  articleId: string;
  userId: string;
  userName: string;
  action: 'started_editing' | 'stopped_editing' | 'cursor_moved';
  cursorPosition?: number;
  timestamp: Date;
}

export interface KnowledgeNotification {
  id: string;
  type: 'article_update' | 'comment' | 'edit' | 'mention' | 'category_update';
  data: ArticleUpdate | CommentNotification | CollaborativeEditNotification;
  read: boolean;
  createdAt: Date;
}

class KnowledgeWebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private userId: string | null = null;
  private subscriptions: Set<string> = new Set();
  private messageQueue: any[] = [];
  private isConnected = false;

  constructor(url: string = process.env.REACT_APP_WS_URL || 'ws://localhost:8080/knowledge') {
    super();
    this.url = url;
  }

  /**
   * Connect to WebSocket server
   */
  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.userId = userId;
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('[KnowledgeWS] Connected');

          // Authenticate
          this.send({
            type: 'auth',
            userId,
            timestamp: new Date().toISOString(),
          });

          // Resubscribe to previous subscriptions
          this.subscriptions.forEach((articleId) => {
            this.subscribeToArticle(articleId);
          });

          // Flush message queue
          this.messageQueue.forEach((msg) => this.send(msg));
          this.messageQueue = [];

          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[KnowledgeWS] Message parse error:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[KnowledgeWS] Error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          console.log('[KnowledgeWS] Disconnected');
          this.emit('disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to article updates
   */
  subscribeToArticle(articleId: string): void {
    this.subscriptions.add(articleId);
    this.send({
      type: 'subscribe',
      articleId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Unsubscribe from article updates
   */
  unsubscribeFromArticle(articleId: string): void {
    this.subscriptions.delete(articleId);
    this.send({
      type: 'unsubscribe',
      articleId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Subscribe to category updates
   */
  subscribeToCategory(categoryId: string): void {
    this.send({
      type: 'subscribe_category',
      categoryId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify that user started editing article
   */
  notifyEditStart(articleId: string, userName: string): void {
    this.send({
      type: 'edit_start',
      articleId,
      userName,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify that user stopped editing article
   */
  notifyEditStop(articleId: string): void {
    this.send({
      type: 'edit_stop',
      articleId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify cursor position during editing
   */
  notifyCursorPosition(articleId: string, position: number): void {
    this.send({
      type: 'cursor_move',
      articleId,
      position,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify new comment on article
   */
  notifyNewComment(articleId: string, comment: CommentNotification): void {
    this.send({
      type: 'new_comment',
      articleId,
      comment,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: any): void {
    const { type, data, articleId } = message;

    switch (type) {
      case 'article_updated':
        this.emit('articleUpdated', {
          articleId,
          type: data.type,
          data: data.content,
          timestamp: new Date(data.timestamp),
          userId: data.userId,
          userName: data.userName,
        } as ArticleUpdate);
        break;

      case 'article_created':
        this.emit('articleCreated', data);
        break;

      case 'article_deleted':
        this.emit('articleDeleted', { articleId });
        break;

      case 'article_published':
        this.emit('articlePublished', { articleId, data });
        break;

      case 'new_comment':
        this.emit('newComment', {
          articleId,
          commentId: data.commentId,
          author: data.author,
          content: data.content,
          timestamp: new Date(data.timestamp),
          mentions: data.mentions || [],
        } as CommentNotification);
        break;

      case 'comment_resolved':
        this.emit('commentResolved', { articleId, commentId: data.commentId });
        break;

      case 'edit_started':
        this.emit('editStarted', {
          articleId,
          userId: data.userId,
          userName: data.userName,
          timestamp: new Date(data.timestamp),
        } as CollaborativeEditNotification);
        break;

      case 'edit_stopped':
        this.emit('editStopped', {
          articleId,
          userId: data.userId,
          timestamp: new Date(data.timestamp),
        });
        break;

      case 'cursor_moved':
        this.emit('cursorMoved', {
          articleId,
          userId: data.userId,
          userName: data.userName,
          cursorPosition: data.position,
          timestamp: new Date(data.timestamp),
        } as CollaborativeEditNotification);
        break;

      case 'category_updated':
        this.emit('categoryUpdated', data);
        break;

      case 'category_created':
        this.emit('categoryCreated', data);
        break;

      case 'category_deleted':
        this.emit('categoryDeleted', { categoryId: data.categoryId });
        break;

      case 'batch_notification':
        data.notifications.forEach((notif: any) => {
          this.handleMessage(notif);
        });
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.warn('[KnowledgeWS] Unknown message type:', type);
    }
  }

  /**
   * Send message to server
   */
  private send(message: any): void {
    if (!this.isConnected || !this.ws) {
      // Queue message if not connected
      this.messageQueue.push(message);
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[KnowledgeWS] Send error:', error);
      this.messageQueue.push(message);
    }
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[KnowledgeWS] Max reconnect attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[KnowledgeWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId).catch((error) => {
          console.error('[KnowledgeWS] Reconnect failed:', error);
        });
      }
    }, delay);
  }

  /**
   * Send periodic heartbeat
   */
  startHeartbeat(interval = 30000): void {
    setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping', timestamp: new Date().toISOString() });
      }
    }, interval);
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
let instance: KnowledgeWebSocketService | null = null;

export const getKnowledgeWebSocketService = (
  url?: string
): KnowledgeWebSocketService => {
  if (!instance) {
    instance = new KnowledgeWebSocketService(url);
  }
  return instance;
};

export default KnowledgeWebSocketService;
