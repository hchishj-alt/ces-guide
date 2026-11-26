// 오프라인 실행(전시장 와이파이 없이). app.js의 VERSION과 같이 올릴 것
const VERSION = '0.2.4';
const CACHE = 'ces-' + VERSION;
const SHELL = ['./', 'index.html', 'app.css', 'app.js', 'data.js', 'map.js', 'pos.js', 'store.js', 'talk.js', 'ui.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'exhibitors.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil((async () => { for (const k of await caches.keys()) if (k.startsWith('ces-') && k !== CACHE) await caches.delete(k); await self.clients.claim(); })()); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.href.startsWith(self.registration.scope) && url.pathname.endsWith('/exhibitors.json')) {
    // 참가 기업 목록은 새것 먼저, 인터넷 없으면 저장해 둔 것
    e.respondWith((async () => { const c = await caches.open(CACHE); try { const r = await fetch(e.request, { cache: 'no-cache' }); if (r.ok) c.put('exhibitors.json', r.clone()); return r; } catch { return (await c.match('exhibitors.json')) || Response.error(); } })());
  } else if (url.href.startsWith(self.registration.scope)) {
    e.respondWith((async () => { const c = await caches.open(CACHE); const hit = await c.match(e.request, { ignoreSearch: true }); if (hit) return hit; try { const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; } catch { return e.request.mode === 'navigate' ? (await c.match('index.html')) || Response.error() : Response.error(); } })());
  } else if (/pretendard/.test(url.href)) {
    e.respondWith((async () => { const c = await caches.open('ces-fonts'); const hit = await c.match(e.request); if (hit) return hit; const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; })());
  }
});
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => cs[0] ? cs[0].focus() : self.clients.openWindow('./#map'))); });
