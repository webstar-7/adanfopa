// ADANFOPA Microfinance — lets the app open without internet.
// Customer data is NOT cached here (the app keeps its own copy); this only stores the app files.
const V = 'adf-shell-v1';
const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.all([c.addAll(SHELL).catch(() => {}), c.add(LIB).catch(() => {})]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const isApp = u.origin === location.origin;
  const isLib = r.url === LIB;
  if (!isApp && !isLib) return; // never touch calls to the database or other sites
  // Show the saved copy straight away (fast, works offline) and refresh it in the background.
  e.respondWith(
    caches.match(r).then(hit => {
      const net = fetch(r).then(x => {
        if (x && x.ok) { const copy = x.clone(); caches.open(V).then(c => c.put(r, copy)); }
        return x;
      }).catch(() => hit || caches.match('./index.html'));
      return hit || net;
    })
  );
});
