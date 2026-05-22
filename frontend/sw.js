// ─── MindEV-IA Service Worker ─────────────────────────────────────────────────
// v30 — JS/CSS nunca se cachean (siempre van a la red); solo íconos y CDN.
// El banner de actualización en la app maneja el ciclo de update.

const STATIC_CACHE = 'mindev-static-v30';
const API_CACHE    = 'mindev-api-v30';

// Solo se pre-cachean recursos que NO cambian con cada deploy:
// íconos, imágenes y librerías CDN versionadas externamente.
const SHELL_FILES = [
  '/icons/icon-192-v2.svg',
  '/icons/icon-512-v2.svg',
  '/icons/mindev-logo.png',
  '/icons/flags/es.svg',
  '/icons/flags/cl.png',
  '/icons/flags/ar.png',
  '/icons/flags/br.png',
  '/icons/flags/mx.png',
  '/icons/flags/co.png',
  '/icons/flags/pe.png',
  '/icons/flags/uy.png',
  '/manifest.json',
  // Librerías externas versionadas — cambian solo si cambia la versión del CDN
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js',
];

// ─── Instalación ──────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async cache => {
      console.log('[SW] Cacheando íconos y librerías CDN...');
      await Promise.allSettled(
        SHELL_FILES.map(url =>
          cache.add(url).catch(err => console.warn('[SW] No se pudo cachear:', url, err.message))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ─── Activación: limpiar cachés viejas ───────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== API_CACHE)
          .map(k => { console.log('[SW] Eliminando caché vieja:', k); return caches.delete(k); })
      ))
      .then(() => self.clients.claim())
    // ⚠️ No forzamos client.navigate() aquí — el banner de la app lo maneja
    //    de forma controlada para no interrumpir al usuario en medio de un test.
  );
});

// ─── Mensaje desde la app: skipWaiting controlado ────────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── Intercepción de peticiones ───────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // JS y CSS locales: SIEMPRE a la red, nunca caché.
  // El browser HTTP-cache los controla con el ?v= param de index.html.
  if (url.origin === self.location.origin &&
      (url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))) {
    event.respondWith(networkOnly(request));
    return;
  }

  // HTML navigation: network first para que index.html siempre sea fresco
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstHtml(request));
    return;
  }

  // API: network first, caché como fallback offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstApi(request));
    return;
  }

  // Íconos, imágenes, librerías CDN: cache first
  event.respondWith(cacheFirstStatic(request));
});

// ─── Estrategia: Network Only (JS/CSS locales) ────────────────────────────────
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response('', { status: 408 });
  }
}

// ─── Estrategia: Network First (HTML) ─────────────────────────────────────────
async function networkFirstHtml(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(offlinePage(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}

// ─── Estrategia: Cache First (íconos / CDN) ───────────────────────────────────
async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408 });
  }
}

// ─── Estrategia: Network First (API) ─────────────────────────────────────────
async function networkFirstApi(request) {
  try {
    const response = await fetch(request);
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'Sin conexión. Conecta a internet para continuar.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ─── Página offline ───────────────────────────────────────────────────────────
function offlinePage() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>MindEV-IA – Sin conexión</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0e1a; color: #e2e8f0; font-family: 'Segoe UI', sans-serif;
           display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { text-align: center; padding: 40px 20px; max-width: 400px; }
    .icon { font-size: 5rem; margin-bottom: 24px; }
    h1 { font-size: 1.8rem; color: #d4af37; margin-bottom: 12px; }
    p  { color: #94a3b8; margin-bottom: 24px; line-height: 1.6; }
    button { background: #d4af37; color: #0a0e1a; border: none; padding: 12px 28px;
             border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">♠</div>
    <h1>Sin conexión</h1>
    <p>MindEV-IA necesita conexión a internet para sincronizar tus resultados.</p>
    <button onclick="window.location.reload()">🔄 Reintentar</button>
  </div>
</body>
</html>`;
}

// ─── Notificaciones push ──────────────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'MindEV-IA', {
    body: data.body || 'Tienes una notificación nueva.',
    icon: '/icons/icon-192-v2.svg',
    badge: '/icons/icon-192-v2.svg',
    data: { url: data.url || '/' },
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});
