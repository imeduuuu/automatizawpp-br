/* Service worker de ComfyMobile.
   Precachea SOLO el shell de la app (para instalarla y abrirla sin conexión).
   NO hace caching en tiempo de ejecución: cualquier petición que no sea el shell
   (en particular las llamadas a la GPU: /prompt, /history, /view, etc.) va SIEMPRE
   a la red y nunca se almacena. Así nunca se sirve una respuesta de la API cacheada. */

const CACHE = 'comfymobile-v2';
const SHELL = ['./', './index.html', './app.js', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;                 // shell precacheado
      if (req.mode === 'navigate') {       // navegación: red, con fallback offline al shell
        return fetch(req).catch(() => caches.match('./index.html'));
      }
      return fetch(req);                    // todo lo demás (incluida la API): red, SIN cachear
    })
  );
});
