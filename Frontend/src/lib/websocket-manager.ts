/**
 * Unified WebSocket Manager
 * Centralized connection pooling, auto-reconnect, subscription management, and offline queuing
 */

import React, { useEffect, useRef } from 'react';
import EventEmitter from 'events';

export interface WebSocketConfig {
  url: string;
  reconnect?: boolean;
  reconnectInterval?: number; // ms
  reconnectBackoffMultiplier?: number;
  maxReconnectAttempts?: number;
  messageQueueEnabled?: boolean;
}

export interface SubscriptionCallback {
  (data: any): void;
}

export interface WSMessage {
  type: string;
  payload?: any;
  timestamp?: string;
}

export interface OfflineQueuedMessage {
  id: string;
  message: WSMessage;
  channelId: string;
  timestamp: string;
  retries: number;
}

/**
 * Unified WebSocket Manager
 */
export class UnifiedWebSocketManager extends EventEmitter {
  private connections: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, Set<SubscriptionCallback>> = new Map();
  private configs: Map<string, WebSocketConfig> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private messageQueue: OfflineQueuedMessage[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    super();
    this.setupNetworkListeners();
  }

  /**
   * Setup online/offline listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online');
      this.processPendingQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline');
    });
  }

  /**
   * Connect to WebSocket endpoint
   */
  connect(channelId: string, config: WebSocketConfig): WebSocket | null {
    // Return existing connection if available
    if (this.connections.has(channelId) && this.isConnectionHealthy(channelId)) {
      return this.connections.get(channelId)!;
    }

    try {
      const ws = new WebSocket(config.url);
      const reconnectConfig = {
        ...config,
        reconnect: config.reconnect !== false,
        reconnectInterval: config.reconnectInterval || 3000,
        reconnectBackoffMultiplier: config.reconnectBackoffMultiplier || 1.5,
        maxReconnectAttempts: config.maxReconnectAttempts || 10,
        messageQueueEnabled: config.messageQueueEnabled !== false,
      };

      this.configs.set(channelId, reconnectConfig);
      this.attachHandlers(channelId, ws, reconnectConfig);

      return ws;
    } catch (error) {
      console.error(`Failed to connect to ${channelId}:`, error);
      return null;
    }
  }

  /**
   * Attach WebSocket event handlers
   */
  private attachHandlers(
    channelId: string,
    ws: WebSocket,
    config: WebSocketConfig
  ): void {
    ws.onopen = () => {
      console.log(`✅ WebSocket connected: ${channelId}`);
      this.connections.set(channelId, ws);
      this.reconnectAttempts.set(channelId, 0);
      this.emit('connected', { channelId });

      // Process offline messages
      if (this.isOnline) {
        this.processPendingQueue();
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSMessage;
        this.handleMessage(channelId, data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error on ${channelId}:`, error);
      this.emit('error', { channelId, error });
    };

    ws.onclose = () => {
      console.log(`❌ WebSocket disconnected: ${channelId}`);
      this.connections.delete(channelId);
      this.emit('disconnected', { channelId });

      // Attempt reconnection
      if (config.reconnect) {
        this.attemptReconnection(channelId, config);
      }
    };
  }

  /**
   * Handle incoming message and dispatch to subscribers
   */
  private handleMessage(channelId: string, message: WSMessage): void {
    const callbacks = this.subscriptions.get(channelId);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in subscription callback:', error);
        }
      });
    }

    this.emit('message', { channelId, message });
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnection(channelId: string, config: WebSocketConfig): void {
    const attempts = (this.reconnectAttempts.get(channelId) || 0) + 1;
    const maxAttempts = config.maxReconnectAttempts || 10;

    if (attempts > maxAttempts) {
      console.error(`Max reconnection attempts reached for ${channelId}`);
      this.emit('maxReconnectAttemptsExceeded', { channelId });
      return;
    }

    const interval = config.reconnectInterval || 3000;
    const multiplier = config.reconnectBackoffMultiplier || 1.5;
    const delay = interval * Math.pow(multiplier, attempts - 1);

    this.reconnectAttempts.set(channelId, attempts);
    console.log(`Reconnecting to ${channelId} in ${delay}ms (attempt ${attempts}/${maxAttempts})`);

    setTimeout(() => {
      if (!this.connections.has(channelId)) {
        this.connect(channelId, config);
      }
    }, delay);
  }

  /**
   * Send message through WebSocket
   */
  send(channelId: string, message: WSMessage): boolean {
    const ws = this.connections.get(channelId);

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      if (this.configs.get(channelId)?.messageQueueEnabled) {
        this.queueMessage(channelId, message);
        return false;
      }
      return false;
    }

    try {
      ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Failed to send message on ${channelId}:`, error);
      return false;
    }
  }

  /**
   * Queue message for later delivery
   */
  private queueMessage(channelId: string, message: WSMessage): void {
    this.messageQueue.push({
      id: `${channelId}-${Date.now()}-${Math.random()}`,
      message,
      channelId,
      timestamp: new Date().toISOString(),
      retries: 0,
    });

    console.log(`📝 Queued message for ${channelId}. Queue size: ${this.messageQueue.length}`);
  }

  /**
   * Process pending messages from offline queue
   */
  private processPendingQueue(): void {
    if (!this.isOnline || this.messageQueue.length === 0) {
      return;
    }

    console.log(`📤 Processing ${this.messageQueue.length} queued messages`);

    const remaining = [];
    for (const item of this.messageQueue) {
      const sent = this.send(item.channelId, item.message);
      if (!sent && item.retries < 3) {
        item.retries++;
        remaining.push(item);
      }
    }

    this.messageQueue = remaining;
  }

  /**
   * Subscribe to messages on channel
   */
  subscribe(channelId: string, callback: SubscriptionCallback): () => void {
    if (!this.subscriptions.has(channelId)) {
      this.subscriptions.set(channelId, new Set());
    }

    this.subscriptions.get(channelId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(channelId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(channelId);
        }
      }
    };
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(channelId: string): void {
    const ws = this.connections.get(channelId);
    if (ws) {
      ws.close(1000, 'User disconnected');
      this.connections.delete(channelId);
      this.subscriptions.delete(channelId);
    }
  }

  /**
   * Disconnect all connections
   */
  disconnectAll(): void {
    this.connections.forEach((ws) => {
      ws.close(1000, 'Disconnecting all');
    });
    this.connections.clear();
    this.subscriptions.clear();
  }

  /**
   * Check if connection is healthy
   */
  private isConnectionHealthy(channelId: string): boolean {
    const ws = this.connections.get(channelId);
    return !!ws && ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status
   */
  isConnected(channelId: string): boolean {
    return this.isConnectionHealthy(channelId);
  }

  /**
   * Get all connected channels
   */
  getConnectedChannels(): string[] {
    return Array.from(this.connections.keys()).filter((id) => this.isConnectionHealthy(id));
  }

  /**
   * Get offline queue size
   */
  getQueueSize(): number {
    return this.messageQueue.length;
  }

  /**
   * Get network status
   */
  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Reset manager
   */
  reset(): void {
    this.disconnectAll();
    this.messageQueue = [];
    this.configs.clear();
    this.reconnectAttempts.clear();
  }
}

/**
 * Create singleton instance
 */
export const wsManager = new UnifiedWebSocketManager();

/**
 * React hook for WebSocket connection
 */
export function useWebSocket(
  channelId: string,
  config: WebSocketConfig,
  onMessage?: (message: any) => void
): {
  isConnected: boolean;
  send: (message: WSMessage) => boolean;
  disconnect: () => void;
} {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!channelId || !config.url) return;

    // Connect
    wsManager.connect(channelId, config);

    // Subscribe if callback provided
    if (onMessage) {
      unsubscribeRef.current = wsManager.subscribe(channelId, onMessage);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      wsManager.disconnect(channelId);
    };
  }, [channelId, config, onMessage]);

  return {
    isConnected: wsManager.isConnected(channelId),
    send: (message: WSMessage) => wsManager.send(channelId, message),
    disconnect: () => wsManager.disconnect(channelId),
  };
}

/**
 * React hook for network status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useStateReact(wsManager.isNetworkOnline());
  
  function useStateReact(initialValue: boolean) {
    return React.useState(initialValue);
  }

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    wsManager.on('online', handleOnline);
    wsManager.on('offline', handleOffline);

    return () => {
      wsManager.off('online', handleOnline);
      wsManager.off('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
