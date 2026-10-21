// sw.js — ShashkaPRO ilova rejimi uchun service worker.
// Faqat internet yo'qligida chiroyli «Aloqa yo'q» sahifasini ko'rsatadi; API va o'yin ma'lumotlari keshlanmaydi.
const V = 'sp-v2';
const OFF = '<!doctype html><html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ShashkaPRO</title>' +
  '<style>body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;box-sizing:border-box;text-align:center;color:#fff;font-family:system-ui,Roboto,sans-serif;background:radial-gradient(circle at 50% 20%,#3a1a7a,#140a33 70%)}' +
  'img{width:110px;height:110px;border-radius:26px}h1{margin:0;font-size:24px}p{margin:0;color:#d9d2ff;max-width:320px;line-height:1.45}button{border:0;border-radius:14px;padding:14px 26px;font:800 17px system-ui;color:#fff;background:#2563eb}</style></head>' +
  '<body><img src="/app/icon-192.png" alt=""><h1>📡 Internet aloqasi yo‘q</h1><p>ShashkaPRO onlayn o‘yin — davom etish uchun internetga ulaning.</p><button onclick="location.reload()">🔄 Qayta urinish</button>' +
  '<script>addEventListener("online",function(){location.reload()})</script></body></html>';
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(['/app/icon-192.png']).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r.url, { cache: 'no-store', credentials: 'include' }).catch(() => new Response(OFF, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
    return;
  }
  const u = new URL(r.url);
  if (u.origin === location.origin && u.pathname.startsWith('/app/')) e.respondWith(caches.match(r).then(x => x || fetch(r)));
});
