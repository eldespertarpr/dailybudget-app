/* ============================================
   DailyBudget — sw.js
   Service Worker mínimo y estable.
   ============================================ */

const CACHE_NAME = 'dailybudget-v16';
const INJECTED_SCRIPTS = [
  '<script src="./persistence-fix.js"></script>',
  '<script src="./ui-polish.js"></script>',
  '<script src="./print-weekly.js"></script>',
  '<script src="./sales-polish.js"></script>'
];

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './persistence-fix.js',
  './ui-polish.js',
  './print-weekly.js',
  './sales-polish.js',
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

async function injectEnhancements(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  let html = await response.text();
  const scriptsToAdd = INJECTED_SCRIPTS.filter((script) => {
    const match = script.match(/src="\.\/(.*?)"/);
    return match ? !html.includes(match[1]) : !html.includes(script);
  });

  if (scriptsToAdd.length > 0) {
    html = html.replace('</body>', `${scriptsToAdd.join('\n')}\n</body>`);
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
          return injectEnhancements(networkResponse);
        })
        .catch(() => caches.match(event.request).then((cached) => {
          if (cached) return injectEnhancements(cached);
          return caches.match('./index.html').then((fallback) => {
            if (fallback) return injectEnhancements(fallback);
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
