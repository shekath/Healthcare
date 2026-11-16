// QRIB service worker — offline app shell (stale-while-revalidate).
const CACHE = 'qrib-v2';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './css/app.css', './icons/icon.svg',
  './js/app.js', './js/ui.js', './js/shell.js', './js/store.js', './js/i18n.js', './js/data.js', './js/logic.js', './js/icons.js',
  './js/screens/auth.js', './js/screens/discover.js', './js/screens/booking.js', './js/screens/saved.js',
  './js/screens/reports.js', './js/screens/account.js', './js/screens/doctor.js', './js/clinic.js',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => {
      if (res && res.ok && (new URL(req.url).origin === location.origin || req.url.includes('fonts.g'))) cache.put(req, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
