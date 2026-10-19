/* Crown & Kingdoms — offline shell cache.
   HTML/JS/CSS/JSON use network-first so deployments refresh immediately online.
   Local SVG art uses cache-first after its first successful download.
   Cross-origin Supabase traffic and non-GET requests are never intercepted. */
'use strict';

const CACHE_NAME = 'ck-shell-v6';
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
  './js/ui.js',
  './js/simulation.js','./js/ai.js','./js/pathfinding.js','./js/kingdom.js','./js/entities.js','./js/campaign.js','./js/economy.js','./js/formations.js','./js/menus.js','./js/minimap.js', './js/assets.js',
  './engine.js',
  './persistence.js',
  './js/network-sync.js',
  './js/network-commands.js',
  './js/network-delivery.js',
  './js/network-uplink.js',
  './js/network-transport.js',
  './js/network-startup.js',
  './js/network-session.js',
  './js/network-unit-map.js',
  './js/network-lobby.js',
  './multiplayer.js',
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
  // Authenticated relay responses must never enter or fall back to shell caches.
  if (url.pathname.startsWith('/api/multiplayer/') ||
      request.headers.has('Authorization') || request.cache === 'no-store') return;

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

