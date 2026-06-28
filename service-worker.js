const CACHE = 'refinerydesk-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/data.js',
  '/js/api.js',
  '/js/render.js',
  '/js/main.js',
  '/manifest.json',
  '/icon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for same-origin assets; network-first for API calls and CDN
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Let API and external CDN requests pass through to network (with graceful fallback)
  if (url.pathname.startsWith('/api/') || url.origin !== location.origin) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for all same-origin static assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      });
    })
  );
});
