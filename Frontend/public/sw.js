/**
 * Service Worker for FusionDesk
 * Handles caching, offline support, background sync, and push notifications
 */

const CACHE_NAME = 'fusiondesk-v1';
const DYNAMIC_CACHE_NAME = 'fusiondesk-dynamic-v1';
const IMAGE_CACHE_NAME = 'fusiondesk-images-v1';
const API_CACHE_NAME = 'fusiondesk-api-v1';

// Core assets to cache on install
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/offline.html',
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(CRITICAL_ASSETS);
        console.log('✅ Service Worker installed - critical assets cached');
        self.skipWaiting(); // Activate immediately
      } catch (error) {
        console.error('❌ Service Worker install failed:', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter((name) => {
          return (
            name !== CACHE_NAME &&
            name !== DYNAMIC_CACHE_NAME &&
            name !== IMAGE_CACHE_NAME &&
            name !== API_CACHE_NAME
          );
        });

        await Promise.all(oldCaches.map((name) => caches.delete(name)));
        console.log(`✅ Cleaned up ${oldCaches.length} old cache(s)`);
        self.clients.claim(); // Take control immediately
      } catch (error) {
        console.error('❌ Service Worker activation failed:', error);
      }
    })()
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // HTML - Network first, fall back to cache
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE_NAME));
    return;
  }

  // API calls - Network first with timeout
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE_NAME, 5000));
    return;
  }

  // Images - Cache first
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE_NAME));
    return;
  }

  // CSS, JS, fonts - Cache first, network fallback
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
    return;
  }

  // Default - Network first
  event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE_NAME));
});

/**
 * Cache first strategy - try cache first, network as fallback
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    // Try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Try network
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Offline fallback
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
          '<rect fill="#f0f0f0" width="200" height="200"/>' +
          '<text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="sans-serif" fill="#999">Offline</text>' +
          '</svg>',
        {
          headers: { 'Content-Type': 'image/svg+xml' },
        }
      );
    }
    return new Response('Offline - resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Network first strategy - try network first, cache as fallback
 */
async function networkFirstStrategy(request, cacheName, timeout = 10000) {
  try {
    // Race network request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(request, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Network failed, try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // No cache, return offline page
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') ||
        new Response('Offline - please check your connection', {
          status: 503,
          statusText: 'Service Unavailable',
        });
    }

    throw error;
  }
}

// Background sync - queue failed API calls
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  } else if (event.tag === 'sync-all') {
    event.waitUntil(Promise.all([syncMessages(), syncTasks()]));
  }
});

async function syncMessages() {
  try {
    const queue = await getQueue('message-queue');
    for (const item of queue) {
      await fetch(item.request);
      await removeFromQueue('message-queue', item.id);
    }
    console.log('✅ Messages synced');
  } catch (error) {
    console.error('❌ Message sync failed:', error);
    throw error; // Retry later
  }
}

async function syncTasks() {
  try {
    const queue = await getQueue('task-queue');
    for (const item of queue) {
      await fetch(item.request);
      await removeFromQueue('task-queue', item.id);
    }
    console.log('✅ Tasks synced');
  } catch (error) {
    console.error('❌ Task sync failed:', error);
    throw error; // Retry later
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text?.() || 'New notification from FusionDesk',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'fusiondesk-notification',
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification('FusionDesk', options));
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Focus or open window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Message from client
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (type === 'CACHE_URLS') {
    cacheUrls(data.urls);
  } else if (type === 'CLEAR_CACHE') {
    clearCache(data.cacheName);
  } else if (type === 'GET_CACHE_SIZE') {
    getCacheSize().then((size) => {
      event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
    });
  }
});

/**
 * Utility functions
 */

async function getQueue(queueName) {
  const db = await openDatabase();
  const tx = db.transaction(queueName, 'readonly');
  const store = tx.objectStore(queueName);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removeFromQueue(queueName, id) {
  const db = await openDatabase();
  const tx = db.transaction(queueName, 'readwrite');
  const store = tx.objectStore(queueName);
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FusionDesk', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('message-queue')) {
        db.createObjectStore('message-queue', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('task-queue')) {
        db.createObjectStore('task-queue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  return cache.addAll(urls);
}

async function clearCache(cacheName) {
  return caches.delete(cacheName || CACHE_NAME);
}

async function getCacheSize() {
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
}

console.log('🔧 FusionDesk Service Worker loaded');
