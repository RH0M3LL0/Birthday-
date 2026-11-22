/* Education PWA service worker
   - Bump VERSION whenever you change files, so installed apps pick up the update.
   - The page shows an "Update" bar and sends 'SKIP_WAITING' when the user taps it. */
const VERSION = 'v1';
const SHELL = 'edu-shell-' + VERSION;
const RUNTIME = 'edu-runtime-' + VERSION;
const RUNTIME_MAX = 90;

const PRECACHE = [
  './', './index.html', './manifest.json', './favicon.svg', './favicon.ico',
  './images/icon-192.png', './images/icon-512.png', './images/icon-maskable-512.png',
  './images/apple-touch-icon.png', './images/favicon-32.png',
  './images/students.png', './images/about-page.jpg', './images/about-section-bg.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // one missing file must not break the install
    await Promise.allSettled(PRECACHE.map(url => cache.add(new Request(url, { cache: 'reload' }))));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = [SHELL, RUNTIME];
    for (const k of await caches.keys()) if (k.startsWith('edu-') && !keep.includes(k)) await caches.delete(k);
    if (self.registration.navigationPreload) { try { await self.registration.navigationPreload.enable(); } catch (e) {} }
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

async function trim(name, max) {
  const cache = await caches.open(name), keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

// serve from cache right away, refresh it in the background
async function staleWhileRevalidate(req, cacheName, event) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const refresh = fetch(req).then(res => {
    if (res && (res.ok || res.type === 'opaque')) { cache.put(req, res.clone()).then(() => trim(cacheName, RUNTIME_MAX)); }
    return res;
  }).catch(() => null);
  if (hit) { event.waitUntil(refresh); return hit; }
  return (await refresh) || Response.error();
}

// pages: try the network first (so updates show up), fall back to the saved copy offline
async function networkFirstPage(event) {
  const cache = await caches.open(SHELL);
  try {
    const pre = await event.preloadResponse;
    const res = pre || await Promise.race([
      fetch(event.request),
      new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 4500))
    ]);
    if (res && res.ok) cache.put('./index.html', res.clone());
    return res;
  } catch (e) {
    return (await cache.match('./index.html')) || (await cache.match('./')) ||
      new Response('You are offline.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

self.addEventListener('fetch', event => {
  const req = event.request, url = new URL(req.url);
  if (req.method !== 'GET' || req.headers.has('range')) return;

  if (req.mode === 'navigate' && url.origin === location.origin) {
    event.respondWith(networkFirstPage(event)); return;
  }

  // backend API calls (auth, database, edge functions): never cached
  if (url.hostname.endsWith('.supabase.co') && !url.pathname.startsWith('/storage/v1/object/public/')) return;

  if (url.origin === location.origin) { event.respondWith(staleWhileRevalidate(req, SHELL, event)); return; }

  const cdn = ['fonts.googleapis.com', 'fonts.gstatic.com', 'unpkg.com', 'cdn.jsdelivr.net'];
  if (cdn.includes(url.hostname) || url.hostname.endsWith('.supabase.co')) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME, event));
  }
});
