// Simple EventEmitter implementation for browser compatibility
class EventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(...args));
    }
  }

  off(event: string, listener: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
  }

  removeAllListeners(event?: string) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  timestamp: Date;
  reactions?: { emoji: string; users: string[] }[];
  replyTo?: string;
}

export interface TypingIndicator {
  userId: string;
  channelId: string;
  isTyping: boolean;
}

export interface PresenceUpdate {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
}

export interface ChatNotification {
  type: 'message' | 'reaction' | 'presence' | 'typing';
  data: any;
}

export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: any[] = [];

  constructor(url: string) {
    super();
    this.url = url;
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.token = token;
        const wsUrl = this.url.replace('http', 'ws');
        this.ws = new WebSocket(`${wsUrl}?token=${token}`);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.stopHeartbeat();
          this.emit('disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.emit('disconnected');
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
        });
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`
      );

      setTimeout(() => {
        this.connect(this.token).catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('reconnectFailed');
    }
  }

  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      // Queue message if not connected
      this.messageQueue.push(data);
      console.warn('WebSocket not open, message queued');
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleMessage(data: any): void {
    const { type, payload } = data;

    switch (type) {
      case 'message':
        this.emit('message', payload);
        break;

      case 'message:update':
        this.emit('message:update', payload);
        break;

      case 'message:delete':
        this.emit('message:delete', payload);
        break;

      case 'reaction:add':
        this.emit('reaction:add', payload);
        break;

      case 'reaction:remove':
        this.emit('reaction:remove', payload);
        break;

      case 'typing:start':
        this.emit('typing', {
          ...payload,
          isTyping: true,
        });
        break;

      case 'typing:stop':
        this.emit('typing', {
          ...payload,
          isTyping: false,
        });
        break;

      case 'presence:update':
        this.emit('presence', payload);
        break;

      case 'channel:created':
        this.emit('channel:created', payload);
        break;

      case 'channel:updated':
        this.emit('channel:updated', payload);
        break;

      case 'channel:deleted':
        this.emit('channel:deleted', payload);
        break;

      default:
        console.warn('Unknown message type:', type);
    }
  }

  /* ==================== Chat Operations ==================== */

  sendMessage(channelId: string, content: string, replyTo?: string): void {
    this.send({
      type: 'message:send',
      payload: {
        channelId,
        content,
        replyTo,
        timestamp: new Date().toISOString(),
      },
    });
  }

  updateMessage(messageId: string, content: string): void {
    this.send({
      type: 'message:update',
      payload: {
        messageId,
        content,
        editedAt: new Date().toISOString(),
      },
    });
  }

  deleteMessage(messageId: string): void {
    this.send({
      type: 'message:delete',
      payload: {
        messageId,
      },
    });
  }

  addReaction(messageId: string, emoji: string): void {
    this.send({
      type: 'reaction:add',
      payload: {
        messageId,
        emoji,
        timestamp: new Date().toISOString(),
      },
    });
  }

  removeReaction(messageId: string, emoji: string): void {
    this.send({
      type: 'reaction:remove',
      payload: {
        messageId,
        emoji,
      },
    });
  }

  /* ==================== Typing Indicators ==================== */

  startTyping(channelId: string): void {
    this.send({
      type: 'typing:start',
      payload: {
        channelId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  stopTyping(channelId: string): void {
    this.send({
      type: 'typing:stop',
      payload: {
        channelId,
      },
    });
  }

  /* ==================== Presence ==================== */

  updatePresence(status: 'online' | 'away' | 'offline'): void {
    this.send({
      type: 'presence:update',
      payload: {
        status,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /* ==================== Subscriptions ==================== */

  subscribeToChannel(channelId: string): void {
    this.send({
      type: 'subscribe:channel',
      payload: {
        channelId,
      },
    });
  }

  unsubscribeFromChannel(channelId: string): void {
    this.send({
      type: 'unsubscribe:channel',
      payload: {
        channelId,
      },
    });
  }

  subscribeToPresence(): void {
    this.send({
      type: 'subscribe:presence',
    });
  }

  subscribeToTyping(channelId: string): void {
    this.send({
      type: 'subscribe:typing',
      payload: {
        channelId,
      },
    });
  }

  /* ==================== Utility ==================== */

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  getReadyStateString(): string {
    const state = this.getReadyState();
    const states: { [key: number]: string } = {
      [WebSocket.CONNECTING]: 'CONNECTING',
      [WebSocket.OPEN]: 'OPEN',
      [WebSocket.CLOSING]: 'CLOSING',
      [WebSocket.CLOSED]: 'CLOSED',
    };
    return states[state] || 'UNKNOWN';
  }
}

// Export singleton instance
let wsInstance: WebSocketService | null = null;

export function initializeWebSocket(url: string): WebSocketService {
  if (!wsInstance) {
    wsInstance = new WebSocketService(url);
  }
  return wsInstance;
}

export function getWebSocketInstance(): WebSocketService | null {
  return wsInstance;
}

export function resetWebSocket(): void {
  if (wsInstance) {
    wsInstance.disconnect();
    wsInstance = null;
  }
}
