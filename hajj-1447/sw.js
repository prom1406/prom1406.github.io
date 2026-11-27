// يخزّن هيكل التطبيق فقط (الصفحات + app.js/app.css + الخط). الأعلام تُخزَّن تلقائياً عند أول ظهور. بيانات الحجاج لا تمر هنا (تُحفظ في المتصفح وتُجلب من الخادم مباشرة).
const V = 'hajj1447-shell-v52', FILES = ['./', 'index.html', 'arrival.html', 'departure.html', 'transfers.html', 'pilgrim.html', 'follow.html', 'app.js', 'app.css', 'fonts/tajawal-400.woff', 'fonts/tajawal-500.woff', 'fonts/tajawal-700.woff', 'fonts/tajawal-800.woff', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => { })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;           // لا نتدخل في الخادم/الخطوط/المكتبات
  const put = res => { if (res && res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; };
  // config.js من الشبكة دائماً (يحمل رابط الخادم وسجل الشركات)
  if (u.pathname.endsWith('/config.js') || u.pathname.endsWith('.gs')) { e.respondWith(fetch(r, { cache: 'no-store' }).then(put).catch(() => caches.match(r, { ignoreSearch: true }))); return; }
  // الصفحات: من الشبكة أولاً (حتى تشير دائماً لأحدث app.js)، ومن الكاش إن تأخرت الشبكة 3 ثوانٍ أو انقطعت
  if (r.mode === 'navigate') {
    e.respondWith(new Promise(res => {
      let done = false; const fin = x => { if (!done && x) { done = true; res(x); } };
      const cached = () => caches.match(r, { ignoreSearch: true });
      const t = setTimeout(() => cached().then(fin), 3000);
      fetch(r).then(put).then(x => { clearTimeout(t); fin(x); }).catch(() => { clearTimeout(t); cached().then(h => fin(h || Response.error())); });
    }));
    return;
  }
  // الملفات: نفس الإصدار (?v=) من الكاش فوراً ويُحدَّث في الخلفية؛ إصدار جديد غير مخزّن ← من الشبكة؛ وبلا اتصال ← أي نسخة مخزّنة
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(put);
    if (hit) { net.catch(() => { }); return hit; }
    return net.catch(() => caches.match(r, { ignoreSearch: true }));
  }));
});
