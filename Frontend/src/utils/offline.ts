/**
 * Offline Support Utilities
 * Network status detection, offline queue, and sync management
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface OfflineQueueItem {
  id: string;
  method: string;
  url: string;
  data?: any;
  timestamp: number;
  retries: number;
}

const DB_NAME = 'FusionDesk';
const QUEUE_STORE = 'offline-queue';
const SYNC_TAG = 'sync-queue';

/**
 * Hook to detect network status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('✅ Back online');
      // Trigger sync when coming back online
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          if ('sync' in reg) {
            (reg.sync as any).register(SYNC_TAG).catch((error: Error) => {
              console.log('Background sync registration failed:', error);
            });
          }
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('❌ Went offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const updateConnectionStatus = () => {
        const slow = connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
        setIsSlowConnection(slow);
      };

      connection.addEventListener('change', updateConnectionStatus);
      updateConnectionStatus();

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', updateConnectionStatus);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isSlowConnection };
}

/**
 * Open IndexedDB for queue storage
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Add request to offline queue
 */
export async function addToOfflineQueue(
  method: string,
  url: string,
  data?: any
): Promise<string> {
  const id = `${Date.now()}-${Math.random()}`;
  const item: OfflineQueueItem = {
    id,
    method,
    url,
    data,
    timestamp: Date.now(),
    retries: 0,
  };

  try {
    const db = await openDatabase();
    const transaction = db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    await new Promise((resolve, reject) => {
      const request = store.add(item);
      request.onsuccess = () => resolve(null);
      request.onerror = () => reject(request.error);
    });
    console.log(`📝 Added to offline queue: ${method} ${url}`);
  } catch (error) {
    console.error('Failed to add to offline queue:', error);
  }

  return id;
}

/**
 * Get all queued items
 */
export async function getOfflineQueue(): Promise<OfflineQueueItem[]> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([QUEUE_STORE], 'readonly');
    const store = transaction.objectStore(QUEUE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as OfflineQueueItem[]);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get offline queue:', error);
    return [];
  }
}

/**
 * Remove item from queue
 */
export async function removeFromOfflineQueue(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to remove from offline queue:', error);
  }
}

/**
 * Clear all queued items
 */
export async function clearOfflineQueue(): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to clear offline queue:', error);
  }
}

/**
 * Sync offline queue with server
 */
export async function syncOfflineQueue(): Promise<{ succeeded: number; failed: number }> {
  const queue = await getOfflineQueue();
  let succeeded = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: item.data ? JSON.stringify(item.data) : undefined,
      });

      if (response.ok) {
        await removeFromOfflineQueue(item.id);
        succeeded++;
        console.log(`✅ Synced: ${item.method} ${item.url}`);
      } else {
        failed++;
        console.error(`❌ Sync failed: ${item.method} ${item.url} (${response.status})`);
      }
    } catch (error) {
      failed++;
      console.error(`❌ Sync error: ${item.method} ${item.url}`, error);
    }
  }

  console.log(`📊 Sync complete: ${succeeded} succeeded, ${failed} failed`);
  return { succeeded, failed };
}

/**
 * Hook for managing offline queue
 */
export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const { isOnline } = useNetworkStatus();
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Load queue on mount
  useEffect(() => {
    loadQueue();
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      // Debounce sync
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        syncQueue();
      }, 1000);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isOnline, queue.length]);

  const loadQueue = useCallback(async () => {
    const items = await getOfflineQueue();
    setQueue(items);
  }, []);

  const addItem = useCallback(
    async (method: string, url: string, data?: any) => {
      const id = await addToOfflineQueue(method, url, data);
      loadQueue();
      return id;
    },
    [loadQueue]
  );

  const removeItem = useCallback(
    async (id: string) => {
      await removeFromOfflineQueue(id);
      loadQueue();
    },
    [loadQueue]
  );

  const syncQueue = useCallback(async () => {
    if (syncing || !isOnline) return;

    setSyncing(true);
    try {
      const result = await syncOfflineQueue();
      loadQueue();
      return result;
    } finally {
      setSyncing(false);
    }
  }, [isOnline, syncing, loadQueue]);

  const clearQueue = useCallback(async () => {
    await clearOfflineQueue();
    loadQueue();
  }, [loadQueue]);

  return {
    queue,
    syncing,
    isOnline,
    addItem,
    removeItem,
    syncQueue,
    clearQueue,
    queueCount: queue.length,
  };
}

/**
 * Hook for syncing with React Query mutation
 */
export function useSyncQueue() {
  const { isOnline } = useNetworkStatus();

  const executeMutation = useCallback(
    async (method: string, url: string, data?: any) => {
      // If offline, queue the request
      if (!isOnline) {
        console.log(`📝 Offline - queuing ${method} ${url}`);
        await addToOfflineQueue(method, url, data);
        return { queued: true };
      }

      // If online, execute immediately
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
          // On error, queue for retry
          if (response.status === 408 || response.status >= 500) {
            await addToOfflineQueue(method, url, data);
            return { queued: true };
          }
          throw new Error(`HTTP ${response.status}`);
        }

        return { success: true, data: await response.json() };
      } catch (error) {
        // On network error, queue for retry
        console.log(`⚠️ Network error - queuing ${method} ${url}`);
        await addToOfflineQueue(method, url, data);
        return { queued: true };
      }
    },
    [isOnline]
  );

  return { executeMutation, isOnline };
}

/**
 * Check if a URL is cached
 */
export async function isCached(url: string): Promise<boolean> {
  if (!('caches' in window)) return false;

  try {
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const response = await cache.match(url);
      if (response) return true;
    }
    return false;
  } catch (error) {
    console.error('Cache check failed:', error);
    return false;
  }
}

/**
 * Get cache size
 */
export async function getCacheSize(): Promise<number> {
  if (!('caches' in window)) return 0;

  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Cache size check failed:', error);
    return 0;
  }
}

/**
 * Clear cache
 */
export async function clearCache(name?: string): Promise<void> {
  if (!('caches' in window)) return;

  try {
    if (name) {
      await caches.delete(name);
    } else {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    }
    console.log('✅ Cache cleared');
  } catch (error) {
    console.error('Cache clear failed:', error);
  }
}

/**
 * Enable offline mode immediately (for testing)
 */
export function simulateOfflineMode(enabled: boolean) {
  if (enabled) {
    (navigator as any).onLine = false;
    window.dispatchEvent(new Event('offline'));
    console.log('🔴 Offline mode enabled (simulation)');
  } else {
    (navigator as any).onLine = true;
    window.dispatchEvent(new Event('online'));
    console.log('🟢 Offline mode disabled (simulation)');
  }
}
