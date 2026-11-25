// يخزّن هيكل التطبيق فقط. بيانات الحجاج لا تمر هنا (تُحفظ في المتصفح وتُجلب من الخادم مباشرة).
const V = 'hajj1447-shell-v34', FILES = ['./', 'index.html', 'arrival.html', 'departure.html', 'transfers.html', 'pilgrim.html', 'follow.html', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => { })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;           // لا نتدخل في الخادم/الخطوط/المكتبات
  const put = res => { if (res && res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; };
  // config.js من الشبكة دائماً (يحمل رابط الخادم)، وما عداه: يُعرض من الكاش فوراً ثم يُحدَّث في الخلفية (تنقّل لحظي بين التبويبات)
  if (u.pathname.endsWith('/config.js')) { e.respondWith(fetch(r, { cache: 'no-store' }).then(put).catch(() => caches.match(r, { ignoreSearch: true }))); return; }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => {
    const net = fetch(r).then(put).catch(() => hit);
    return hit || net;
  }));
});
