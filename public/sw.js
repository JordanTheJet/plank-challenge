/**
 * Service Worker for Plank Timer
 * Implements caching strategy for better performance and offline support
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `plank-timer-${CACHE_VERSION}`;

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, then network (for static assets)
  CACHE_FIRST: 'cache-first',
  // Network first, then cache (for dynamic content)
  NETWORK_FIRST: 'network-first',
  // Network only (for API calls, video streams)
  NETWORK_ONLY: 'network-only',
};

// Determine cache strategy based on request
function getCacheStrategy(url) {
  // Never cache MediaPipe WASM files (always fetch fresh)
  if (url.includes('mediapipe') || url.includes('.wasm')) {
    return CACHE_STRATEGIES.NETWORK_ONLY;
  }

  // Never cache video/camera streams
  if (url.includes('mediaDevices') || url.includes('blob:')) {
    return CACHE_STRATEGIES.NETWORK_ONLY;
  }

  // Cache static assets
  if (url.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff|woff2)$/)) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }

  // Network first for HTML and API calls
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  const strategy = getCacheStrategy(url);

  if (strategy === CACHE_STRATEGIES.NETWORK_ONLY) {
    // Network only - no caching
    return;
  }

  if (strategy === CACHE_STRATEGIES.CACHE_FIRST) {
    // Cache first, then network
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Don't cache if not successful
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone response before caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // Return offline fallback if available
            return caches.match('/offline.html');
          });
      })
    );
  } else if (strategy === CACHE_STRATEGIES.NETWORK_FIRST) {
    // Network first, then cache
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Don't cache if not successful
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone response before caching
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/offline.html');
          });
        })
    );
  }
});

// Message event - handle commands from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((name) => caches.delete(name)));
      })
    );
  }
});
