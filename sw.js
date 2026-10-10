/* Cache-first for hashed Vite assets + game art; network-first for HTML. */
const CACHE = 'lfz-v1';
const PRECACHE = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;
  const path = u.pathname;
  const hashed = /\/assets\/.*-[A-Za-z0-9_-]{6,}\.(js|css)$/.test(path) || /\/assets\/(hd\/)?(sprites|images|audio)\//.test(path);
  if (hashed) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res.ok) c.put(e.request, res.clone());
      return res;
    }));
    return;
  }
  // HTML / other: network first, fall back to cache
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok && (path.endsWith('.html') || path.endsWith('/'))) {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
    }
    return res;
  }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
