// Service worker: the page itself is network-first (new deploys show up on the next launch),
// everything else is served from cache and refreshed in the background.
const VERSION = new URL(location).searchParams.get('v') || 'dev';
const CACHE = 'pit-of-oaths-' + VERSION;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => { const c = res.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); return res; }).catch(() => caches.match(req)));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async ca => {
    const hit = await ca.match(req);
    const net = fetch(req).then(res => { if (res.ok) ca.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
