/* Crown & Kingdoms — offline shell cache.
   HTML/JS/CSS/JSON use network-first so deployments refresh immediately online.
   Local SVG art uses cache-first after its first successful download.
   Cross-origin Supabase traffic and non-GET requests are never intercepted. */
'use strict';

const CACHE_NAME = 'ck-shell-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './js/config.js',
  './js/state.js',
  './js/mapgen.js',
  './js/audio.js',
  './js/save.js',
  './js/input.js',
  './js/render.js',
  './engine.js',
  './persistence.js',
  './multiplayer.js',
  './assets/atlas-manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('ck-shell-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const networkFirst = request.mode === 'navigate' ||
    /\.(?:html|js|css|json)$/i.test(url.pathname);

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    if (networkFirst) {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          await cache.put(request, response.clone());
          return response;
        }
        return await cache.match(request) || response;
      } catch (_) {
        const cached = await cache.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const shell = await cache.match('./index.html') || await cache.match('./');
          if (shell) return shell;
        }
        return Response.error();
      }
    }

    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response && response.ok && response.type === 'basic') {
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
