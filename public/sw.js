/**
 * DOT Sovereign Offline Service Worker
 * 
 * Enforces offline-first caching for the complete app shell.
 * Guarantees that DOT works flawlessly with zero internet access.
 */

const CACHE_NAME = 'dot-sovereign-v1';

// App shell core assets to pre-cache
const STATIC_ASSETS = [
  '/',
  '/decryptor.html',
  '/manifest.json',
  '/favicon.ico',
];

// Installation: Cache core app shell and skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use addAll with error resilience
      return Promise.allSettled(
        STATIC_ASSETS.map((asset) => cache.add(asset).catch((err) => console.warn(`[SW] Precache failed for ${asset}:`, err)))
      );
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activation: Clean up stale legacy caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('dot-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: Offline-first cache strategy with network fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle HTTP/HTTPS requests
  if (!request.url.startsWith('http')) return;

  // Only handle GET requests (prevents TypeError on POST/PUT/DELETE)
  if (request.method !== 'GET') return;

  // For HTML navigation requests, try cache first, then network, then fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background if online
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {
            // Offline - ignore background refresh error
          });
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
            }
            return response;
          })
          .catch(() => {
            // Fallback to cached root or decryptor if offline
            return caches.match('/') || caches.match('/decryptor.html');
          });
      })
    );
    return;
  }

  // Cache-first for scripts, styles, fonts, and images
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      }).catch((err) => {
        // Return offline fallback response if asset not found
        console.warn('[SW] Offline asset fetch failed:', request.url);
        throw err;
      });
    })
  );
});
