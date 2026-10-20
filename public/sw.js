/**
 * DOT Sovereign Offline Service Worker
 * 
 * Enforces offline capability for the complete app shell.
 * Uses Network-First with Offline-Cache Fallback to guarantee DOT works
 * with zero internet access while preventing stale chunk / HMR corruption.
 */

const CACHE_NAME = 'dot-sovereign-v2';

// App shell core assets to pre-cache
const STATIC_ASSETS = [
  '/',
  '/decryptor.html',
  '/manifest.json',
  '/favicon.ico',
];

// Installation: Cache core app shell and skip waiting immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => console.warn(`[SW] Precache failed for ${asset}:`, err))
        )
      );
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activation: Clean up all legacy / stale caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log(`[SW] Purging outdated cache: ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: Network-first with Cache-fallback for all assets
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle HTTP/HTTPS GET requests
  if (!request.url.startsWith('http') || request.method !== 'GET') {
    return;
  }

  // Bypass dev HMR and WebSockets
  if (request.url.includes('/_next/webpack-hmr') || request.url.includes('turbopack-hmr')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // If response is valid, update the cache in the background
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Offline: Serve from cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If navigation request and not in cache, fallback to root or decryptor
        if (request.mode === 'navigate') {
          const fallback = (await caches.match('/')) || (await caches.match('/decryptor.html'));
          if (fallback) return fallback;
        }

        // Return empty or error response gracefully if completely unavailable offline
        return new Response('Offline: Asset not available in cache', {
          status: 503,
          statusText: 'Service Unavailable (Offline)',
          headers: new Headers({ 'Content-Type': 'text/plain' }),
        });
      })
  );
});
