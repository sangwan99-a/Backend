/**
 * Search Module WebSocket Service
 * Real-time search indexing, new results, and saved search notifications
 */

import { EventEmitter } from 'events';

export interface SearchIndexUpdate {
  documentId: string;
  type: 'indexed' | 'updated' | 'deleted' | 're-indexed';
  source: 'message' | 'document' | 'task' | 'person' | 'article';
  timestamp: Date;
  userId?: string;
}

export interface NewSearchResults {
  savedSearchId: string;
  results: any[];
  count: number;
  timestamp: Date;
}

export interface SearchNotification {
  id: string;
  type: 'index_update' | 'new_results' | 'search_error' | 'index_status';
  data: SearchIndexUpdate | NewSearchResults | any;
  read: boolean;
  createdAt: Date;
}

export interface IndexStatus {
  totalDocuments: number;
  indexedDocuments: number;
  pendingDocuments: number;
  lastUpdated: Date;
  status: 'idle' | 'indexing' | 'optimizing';
}

class SearchWebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private userId: string | null = null;
  private watchedSearches: Set<string> = new Set();
  private messageQueue: any[] = [];
  private isConnected = false;

  constructor(url: string = process.env.REACT_APP_WS_URL || 'ws://localhost:8080/search') {
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
          console.log('[SearchWS] Connected');

          // Authenticate
          this.send({
            type: 'auth',
            userId,
            timestamp: new Date().toISOString(),
          });

          // Resubscribe to watched searches
          this.watchedSearches.forEach((searchId) => {
            this.watchSavedSearch(searchId);
          });

          // Flush message queue
          this.messageQueue.forEach((msg) => this.send(msg));
          this.messageQueue = [];

          // Request index status
          this.requestIndexStatus();

          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[SearchWS] Message parse error:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[SearchWS] Error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          console.log('[SearchWS] Disconnected');
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
   * Watch a saved search for new results
   */
  watchSavedSearch(savedSearchId: string): void {
    this.watchedSearches.add(savedSearchId);
    this.send({
      type: 'watch_search',
      savedSearchId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Unwatch a saved search
   */
  unwatchSavedSearch(savedSearchId: string): void {
    this.watchedSearches.delete(savedSearchId);
    this.send({
      type: 'unwatch_search',
      savedSearchId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Request current index status
   */
  requestIndexStatus(): void {
    this.send({
      type: 'get_index_status',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Trigger manual index optimization
   */
  triggerIndexOptimization(): void {
    this.send({
      type: 'optimize_index',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Request full index rebuild
   */
  requestIndexRebuild(): void {
    this.send({
      type: 'rebuild_index',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Watch for updates on specific document
   */
  watchDocument(documentId: string): void {
    this.send({
      type: 'watch_document',
      documentId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Stop watching document
   */
  unwatchDocument(documentId: string): void {
    this.send({
      type: 'unwatch_document',
      documentId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Subscribe to documents of specific type
   */
  subscribeToDocumentType(source: 'message' | 'document' | 'task' | 'person' | 'article'): void {
    this.send({
      type: 'subscribe_source',
      source,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: any): void {
    const { type, data } = message;

    switch (type) {
      case 'document_indexed':
        this.emit('documentIndexed', {
          documentId: data.documentId,
          type: 'indexed',
          source: data.source,
          timestamp: new Date(data.timestamp),
          userId: data.userId,
        } as SearchIndexUpdate);
        break;

      case 'document_updated':
        this.emit('documentUpdated', {
          documentId: data.documentId,
          type: 'updated',
          source: data.source,
          timestamp: new Date(data.timestamp),
          userId: data.userId,
        } as SearchIndexUpdate);
        break;

      case 'document_deleted':
        this.emit('documentDeleted', {
          documentId: data.documentId,
          type: 'deleted',
          source: data.source,
          timestamp: new Date(data.timestamp),
        } as SearchIndexUpdate);
        break;

      case 'new_search_results':
        this.emit('newResults', {
          savedSearchId: data.savedSearchId,
          results: data.results,
          count: data.results.length,
          timestamp: new Date(data.timestamp),
        } as NewSearchResults);
        break;

      case 'index_status':
        this.emit('indexStatus', {
          totalDocuments: data.totalDocuments,
          indexedDocuments: data.indexedDocuments,
          pendingDocuments: data.pendingDocuments,
          lastUpdated: new Date(data.lastUpdated),
          status: data.status,
        } as IndexStatus);
        break;

      case 'index_started':
        this.emit('indexingStarted', { message: data.message });
        break;

      case 'index_progress':
        this.emit('indexProgress', {
          indexed: data.indexed,
          total: data.total,
          percentage: (data.indexed / data.total) * 100,
        });
        break;

      case 'index_completed':
        this.emit('indexingCompleted', {
          totalIndexed: data.totalIndexed,
          duration: data.duration,
          timestamp: new Date(data.timestamp),
        });
        break;

      case 'optimization_started':
        this.emit('optimizationStarted', {});
        break;

      case 'optimization_completed':
        this.emit('optimizationCompleted', {
          duration: data.duration,
          timestamp: new Date(data.timestamp),
        });
        break;

      case 'rebuild_started':
        this.emit('rebuildStarted', {});
        break;

      case 'rebuild_progress':
        this.emit('rebuildProgress', {
          phase: data.phase, // 'clearing' | 'indexing' | 'optimizing'
          percentage: data.percentage,
        });
        break;

      case 'rebuild_completed':
        this.emit('rebuildCompleted', {
          duration: data.duration,
          timestamp: new Date(data.timestamp),
        });
        break;

      case 'search_error':
        this.emit('searchError', {
          error: data.error,
          timestamp: new Date(data.timestamp),
        });
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
        console.warn('[SearchWS] Unknown message type:', type);
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
      console.error('[SearchWS] Send error:', error);
      this.messageQueue.push(message);
    }
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SearchWS] Max reconnect attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[SearchWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId).catch((error) => {
          console.error('[SearchWS] Reconnect failed:', error);
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

  /**
   * Get number of watched searches
   */
  getWatchedSearchCount(): number {
    return this.watchedSearches.size;
  }
}

// Singleton instance
let instance: SearchWebSocketService | null = null;

export const getSearchWebSocketService = (url?: string): SearchWebSocketService => {
  if (!instance) {
    instance = new SearchWebSocketService(url);
  }
  return instance;
};

export default SearchWebSocketService;
