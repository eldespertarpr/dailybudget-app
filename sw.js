/* ============================================
   DailyBudget — sw.js
   Service Worker mínimo y estable.
   ============================================ */

const CACHE_NAME = 'dailybudget-v12';
const PERSISTENCE_SCRIPT = '<script src="./persistence-fix.js"></script>';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './persistence-fix.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

function shouldHandleAsIndex(request) {
  const url = new URL(request.url);
  return (
    request.mode === 'navigate' ||
    url.pathname.endsWith('/dailybudget-app/') ||
    url.pathname.endsWith('/dailybudget-app/index.html')
  );
}

async function injectPersistenceGuard(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  let html = await response.text();
  if (!html.includes('persistence-fix.js')) {
    html = html.replace('</body>', `${PERSISTENCE_SCRIPT}\n</body>`);
  }

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      'content-type': 'text/html; charset=UTF-8',
      'cache-control': 'no-cache'
    }
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch(() => {})
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  if (shouldHandleAsIndex(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
          return injectPersistenceGuard(networkResponse);
        })
        .catch(() => caches.match(event.request).then((cached) => {
          if (cached) return injectPersistenceGuard(cached);
          return caches.match('./index.html').then((fallback) => {
            if (fallback) return injectPersistenceGuard(fallback);
            return new Response('DailyBudget no pudo cargar sin conexión.', {
              status: 503,
              headers: { 'content-type': 'text/plain; charset=UTF-8' }
            });
          });
        }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return networkResponse;
      });
    })
  );
});
