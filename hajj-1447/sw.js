// يخزّن هيكل التطبيق فقط. بيانات الحجاج لا تمر هنا (تُحفظ في المتصفح وتُجلب من الخادم مباشرة).
const V = 'hajj1447-shell-v5', FILES = ['./', 'index.html', 'arrival.html', 'departure.html', 'transfers.html', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => { })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;           // لا نتدخل في الخادم/الخطوط/المكتبات
  e.respondWith(fetch(r, u.pathname.endsWith('/config.js') ? { cache: 'no-store' } : undefined).then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; }).catch(() => caches.match(r, { ignoreSearch: true })));
});
