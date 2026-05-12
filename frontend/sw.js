// ─── MindEV-IA Service Worker ─────────────────────────────────────────────────
// Versión: incrementar al hacer cambios importantes para forzar actualización

const CACHE_NAME   = 'mindev-v25';
const STATIC_CACHE = 'mindev-static-v25';
const API_CACHE    = 'mindev-api-v25';

// Archivos que se cachean al instalar (shell de la app)
const SHELL_FILES = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/utils/i18n.js',
  '/js/data/questions.js',
  '/js/data/questions_pt.js',
  '/js/data/technical_questions.js',
  '/js/data/technical_questions_pt.js',
  '/js/utils/api.js',
  '/js/utils/captcha.js',
  '/js/utils/report.js',
  '/js/pages/landing.js',
  '/js/pages/login.js',
  '/js/pages/register.js',
  '/js/pages/payment.js',
  '/js/pages/test.js',
  '/js/pages/results.js',
  '/js/pages/dashboard.js',
  '/js/pages/tournament.js',
  '/js/app.js',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/mindev-logo.png',
  '/icons/mindev-logo-es.svg',
  '/icons/mindev-logo-pt.svg',
  '/icons/flags/es.svg',
  '/icons/flags/cl.png',
  '/icons/flags/ar.png',
  '/icons/flags/br.png',
  '/icons/flags/mx.png',
  '/icons/flags/co.png',
  '/icons/flags/pe.png',
  '/icons/flags/uy.png',
  '/manifest.json',
  // Librerías externas
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
];

// ─── Instalación: cachear shell ───────────────────────────────────────────────
// Usa Promise.allSettled para que un archivo fallido NO bloquee toda la instalación
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async cache => {
      console.log('[SW] Cacheando shell de la app...');
      const results = await Promise.allSettled(
        SHELL_FILES.map(url =>
          cache.add(url).catch(err => console.warn('[SW] No se pudo cachear:', url, err.message))
        )
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed) console.warn(`[SW] ${failed} archivo(s) no cacheado(s) — instalación continúa de todas formas`);
    }).then(() => self.skipWaiting())
  );
});

// ─── Activación: limpiar cachés viejas y tomar control inmediato ─────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== API_CACHE)
          .map(k => {
            console.log('[SW] Eliminando caché vieja:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
      .then(() => {
        // Forzar recarga en todos los clientes al actualizar SW
        self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => client.navigate(client.url));
        });
      })
  );
});

// ─── Intercepción de peticiones ───────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstApi(request));
    return;
  }

  // Navegación HTML (index.html): siempre network first para cargar última versión
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstHtml(request));
    return;
  }

  // Recursos estáticos: cache first, network fallback
  event.respondWith(cacheFirstStatic(request));
});

// ─── Estrategia: Network First (HTML navigation) ─────────────────────────────
// Siempre busca en red primero para obtener la última versión del HTML.
// El index.html tiene version strings en los scripts, así que si el HTML es fresco,
// todos los JS/CSS también lo serán.
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
    return new Response(offlinePage(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

// ─── Estrategia: Cache First (recursos estáticos) ─────────────────────────────
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
    // Sin conexión y sin caché: mostrar página offline básica
    if (request.mode === 'navigate') {
      return new Response(offlinePage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
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
    <p>MindEV-IA necesita conexión a internet para sincronizar tus resultados. Conéctate y vuelve a intentarlo.</p>
    <button onclick="window.location.reload()">🔄 Reintentar</button>
  </div>
</body>
</html>`;
}

// ─── Notificaciones push (preparado para uso futuro) ─────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'EVHAPO', {
    body: data.body || 'Tienes una notificación nueva.',
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    data: { url: data.url || '/' },
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
