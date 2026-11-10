// MarsWay offline app shell and opportunistic NASA map-tile cache.
const APP_CACHE_NAME = 'marsway-app-v2';
const TILE_CACHE_NAME = 'marsway-nasa-tiles-v2';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/aistudio/image_5c943629.png',
  '/marsway-icon.png',
  '/assets/icon-192.svg',
  '/assets/icon-512.svg',
  '/textures/mars_viking_2k.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_CACHE_NAME);
      await Promise.all(PRECACHE_ASSETS.map(async (asset) => {
        try {
          await cache.add(asset);
        } catch (error) {
          console.warn(`MarsWay could not precache ${asset}:`, error);
        }
      }));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== APP_CACHE_NAME && key !== TILE_CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

function isLocalAppAsset(request, url) {
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return false;
  return request.mode === 'navigate'
    || url.pathname.startsWith('/assets/')
    || url.pathname.startsWith('/textures/')
    || url.pathname.startsWith('/src/')
    || url.pathname.startsWith('/@vite/')
    || url.pathname.startsWith('/node_modules/')
    || url.pathname === '/manifest.json'
    || url.pathname === '/sw.js';
}

function isNasaMapImage(request, url) {
  const isMapHost = url.hostname === 'trek.nasa.gov' || url.hostname === 'planetarymaps.usgs.gov';
  return isMapHost && (request.destination === 'image' || url.pathname.includes('/tiles/') || url.pathname.includes('mapserv'));
}

async function updateCache(cache, request, maxEntries) {
  const response = await fetch(request);
  if (response.ok && response.type !== 'opaque') {
    await cache.put(request, response.clone());
    if (maxEntries) {
      const keys = await cache.keys();
      const staleKeys = keys.slice(0, Math.max(0, keys.length - maxEntries));
      await Promise.all(staleKeys.map((key) => cache.delete(key)));
    }
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (isLocalAppAsset(event.request, url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(APP_CACHE_NAME);
        const cached = await cache.match(event.request);

        if (event.request.mode === 'navigate') {
          try {
            const response = await updateCache(cache, event.request);
            return response;
          } catch (error) {
            const offlinePage = await cache.match('/index.html') || await cache.match('/');
            if (offlinePage) return offlinePage;
            console.error('MarsWay offline page is unavailable:', error);
            return new Response('MarsWay is not available offline yet. Open it once while connected.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
          }
        }

        if (cached) {
          event.waitUntil(
            updateCache(cache, event.request).catch((error) => {
              console.warn('MarsWay asset refresh deferred while offline:', error);
            })
          );
          return cached;
        }

        try {
          return await updateCache(cache, event.request);
        } catch (error) {
          const fallback = await cache.match(event.request);
          if (fallback) return fallback;
          console.error(`MarsWay asset is unavailable: ${url.pathname}`, error);
          return new Response('This MarsWay asset is not available offline.', { status: 503 });
        }
      })()
    );
    return;
  }

  if (isNasaMapImage(event.request, url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(TILE_CACHE_NAME);
        const cached = await cache.match(event.request);

        if (cached) {
          event.waitUntil(
            updateCache(cache, event.request, 400).catch((error) => {
              console.warn('NASA map tile refresh deferred while offline:', error);
            })
          );
          return cached;
        }

        try {
          return await updateCache(cache, event.request, 400);
        } catch (error) {
          console.warn('NASA map tile unavailable offline:', url.href, error);
          return new Response(null, { status: 503, statusText: 'Map tile unavailable offline' });
        }
      })()
    );
  }
});
