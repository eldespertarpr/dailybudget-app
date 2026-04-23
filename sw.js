/* ============================================
   DailyBudget — sw.js
   Service Worker mínimo y estable.

   Estrategia: Cache First para todos los assets
   del app shell (HTML, CSS inline, fuentes).
   Los datos del usuario viven en localStorage,
   no en el cache — el SW no los toca nunca.
   ============================================ */

const CACHE_NAME = 'dailybudget-v2';

// Assets que se cachean al instalar.
// Solo el HTML principal — Tailwind CDN y Google Fonts
// se cachean dinámicamente en el primer uso.
const PRECACHE_ASSETS = [
  './index.html'
];

// ── INSTALL ──────────────────────────────────
// Precachea el HTML al instalar. skipWaiting()
// activa el nuevo SW inmediatamente sin esperar
// a que se cierren todas las pestañas.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE ─────────────────────────────────
// Borra caches de versiones anteriores para no
// acumular storage innecesario en el dispositivo.
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

// ── FETCH ─────────────────────────────────────
// Estrategia: Cache First con Network Fallback.
//
// 1. Si la respuesta está en cache → servir desde cache (offline funciona).
// 2. Si no está en cache → buscar en red y guardar una copia para la próxima.
// 3. Si la red falla y no hay cache → dejar que el navegador maneje el error.
//
// Excepción: peticiones a chrome-extension o non-http se ignoran.
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean http/https
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((networkResponse) => {
        // Solo cachear respuestas válidas (no errores, no opaque de terceros
        // que no queremos acumular sin control)
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
