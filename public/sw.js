// Bump this on every deploy to force cache invalidation
const CACHE_VERSION = 'saveme-v3-2026-04-15';
const CACHE_NAME = CACHE_VERSION;

// Only cache the shell — everything else goes to network-first
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/favicon.ico',
  '/manifest.json'
];

// Install: cache the shell and skip waiting so new SW takes over immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: delete all old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - API / Firebase / Google calls → network-only (no caching)
// - Hashed JS/CSS assets → network-first (always get latest, fallback to cache offline)
// - Everything else → cache-first with background revalidation
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and non-HTTP requests
  if (event.request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Never cache API/backend calls
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('cloudfunctions.net') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('securetoken')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for JS/CSS/HTML so new deploys take effect immediately
  const isCodeAsset = url.pathname.endsWith('.js') ||
                      url.pathname.endsWith('.css') ||
                      url.pathname.endsWith('.html') ||
                      url.pathname === '/' ||
                      url.pathname.includes('/assets/');

  if (isCodeAsset) {
    event.respondWith(
      fetch(event.request).then((response) => {
        // Cache successful full responses only (skip 206 partial content)
        if (response.ok && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try { cache.put(event.request, clone); } catch (_) { /* */ }
          });
        }
        return response;
      }).catch(() => caches.match(event.request).then((cached) => {
        if (cached) return cached;
        if (event.request.mode === 'navigate') return caches.match('/index.html');
        return new Response('Offline', { status: 503 });
      }))
    );
    return;
  }

  // Cache-first for images/other static (with safe caching)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Revalidate in background
        fetch(event.request).then((response) => {
          if (response.ok && response.status === 200 && response.type === 'basic') {
            caches.open(CACHE_NAME).then((cache) => {
              try { cache.put(event.request, response.clone()); } catch (_) { /* */ }
            });
          }
        }).catch(() => {});
        return cached;
      }

      return fetch(event.request).then((response) => {
        // Only cache successful full responses (NOT 206 partial content for media)
        if (response.ok && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try { cache.put(event.request, clone); } catch (_) { /* */ }
          });
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Listen for skipWaiting message from page
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
