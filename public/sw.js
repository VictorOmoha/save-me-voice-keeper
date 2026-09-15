// Bump this on every deploy to force cache invalidation
const CACHE_VERSION = 'saveme-v7-reminder-push';
const CACHE_NAME = CACHE_VERSION;
const PUSH_STATE_CACHE = 'saveme-push-state-v1';

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
        keys.filter((key) => key !== CACHE_NAME && key !== PUSH_STATE_CACHE).map((key) => caches.delete(key))
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

  // Never intercept API/backend calls. Let the browser own long-lived Firebase
  // listen streams so service worker fetch handling cannot turn transient network
  // interruptions into uncaught promise errors.
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('cloudfunctions.net') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('securetoken')
  ) {
    return;
  }

  // Network-first for JS/CSS/HTML and all page navigations so new deploys
  // take effect immediately (navigations matter for BrowserRouter deep links
  // like /dashboard, which aren't covered by the extension checks).
  const isCodeAsset = url.pathname.endsWith('.js') ||
                      url.pathname.endsWith('.css') ||
                      url.pathname.endsWith('.html') ||
                      url.pathname === '/' ||
                      url.pathname.includes('/assets/') ||
                      event.request.mode === 'navigate';

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

// FCM data messages are standard Web Push payloads. Keeping one native handler
// in our existing worker avoids a second worker taking over the PWA's scope.
function pushDestination(value) {
  try {
    const url = new URL(value, self.location.origin);
    if (url.origin === self.location.origin && url.pathname === '/agent' && /^[a-f0-9]{64}$/.test(url.searchParams.get('run') || '')) return `/agent?run=${url.searchParams.get('run')}`;
  } catch { /* Unrecognized destinations fall back to reminders. */ }
  return '/dashboard?reminders=open';
}
self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let payload;
    try { payload = event.data?.json(); } catch { return; }
    const data = payload?.data;
    if (!data?.notification_id || !data.user_id) return;
    const cache = await caches.open(PUSH_STATE_CACHE);
    const owner = await cache.match('/__push-owner');
    if (!owner || await owner.text() !== data.user_id) return;
    const seenKey = `/__push-seen/${encodeURIComponent(data.notification_id)}`;
    if (await cache.match(seenKey)) return;
    await self.registration.showNotification(data.title || 'SaveMe reminder', {
      body: data.body || 'Your reminder is due.',
      icon: '/icon-192.png', badge: '/icon-192.png',
      tag: data.notification_id,
      data: {url: pushDestination(data.url)},
    });
    await cache.put(seenKey, new Response(String(Date.now())));
    // Keep deduplication entries longer than the server retry window.
    for (const key of await cache.keys()) {
      if (!new URL(key.url).pathname.startsWith('/__push-seen/')) continue;
      const entry = await cache.match(key);
      if (entry && Date.now() - Number(await entry.text()) > 24 * 60 * 60 * 1000) await cache.delete(key);
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    // Allow only known, same-origin destinations, including persisted notifications.
    const url = new URL(pushDestination(event.notification.data?.url), self.location.origin).href;
    const windows = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) {await existing.navigate(url); await existing.focus();}
    else await self.clients.openWindow(url);
  })());
});
