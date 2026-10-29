/* Crown & Kingdoms — offline shell cache.
   HTML/JS/CSS/JSON use network-first so deployments refresh immediately online.
   Local painted art uses cache-first after its first successful download.
   Cross-origin Supabase traffic and non-GET requests are never intercepted. */
'use strict';

const CACHE_NAME = 'ck-shell-v36-painted-fishtraps';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './assets/atlas-manifest.json',
  './assets/painted-units-v2.webp',
  './assets/painted-buildings.webp',
  './assets/painted-terrain.webp',
  './assets/painted-resources.webp',
  './assets/painted-environment.webp',
  './assets/painted-fishtraps.webp',
  './assets/painted-motion-mil.webp',
  './assets/painted-motion-knight.webp',
  './assets/painted-motion-vil.webp',
  './assets/painted-motion-arc.webp',
  './assets/painted-motion-xbow.webp',
  './assets/painted-motion-spear.webp',
  './assets/painted-motion-scout.webp',
  './assets/painted-motion-skirm.webp',
  './assets/painted-motion-mon.webp',
  './assets/painted-motion-axe.webp',
  './assets/painted-motion-lbow.webp',
  './assets/painted-motion-woad.webp',
  './assets/painted-motion-bers.webp',
  './assets/painted-motion-saml.webp',
  './assets/painted-motion-tk.webp',
  './assets/painted-motion-huskarl.webp',
  './assets/painted-motion-jaguar.webp',
  './assets/painted-motion-kamayuk.webp',
  './assets/painted-motion-shotel.webp',
  './assets/painted-motion-jan.webp',
  './assets/painted-motion-genoa.webp',
  './assets/painted-motion-plumed.webp',
  './assets/painted-motion-gbeto.webp',
  './assets/painted-motion-chuko.webp',
  './assets/painted-motion-hcan.webp',
  './assets/painted-motion-camel.webp',
  './assets/painted-motion-mamel.webp',
  './assets/painted-motion-mgd.webp',
  './assets/painted-motion-cata.webp',
  './assets/painted-motion-conq.webp',
  './assets/painted-motion-boyar.webp',
  './assets/painted-motion-tarkan.webp',
  './assets/painted-motion-huszar.webp',
  './assets/painted-motion-fish.webp',
  './assets/painted-motion-gal.webp',
  './assets/painted-motion-trn.webp',
  './assets/painted-motion-cog.webp',
  './assets/painted-motion-cart.webp',
  './assets/painted-motion-king.webp',
  './assets/painted-motion-eled.webp',
  './assets/painted-motion-ele.webp',
  './assets/painted-motion-ram.webp',
  './assets/painted-motion-bomb.webp',
  './assets/painted-motion-treb.webp',
  './assets/painted-motion-mang.webp',
  './assets/painted-motion-scor.webp',
  './assets/painted-motion-wagon.webp',
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
  './js/network-supabase.js',
  './js/network-webrtc.js',
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

