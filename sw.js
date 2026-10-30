/* Eski bağlantı kapatıldı: kayıtlı kopyaları siler ve kendini kaldırır */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    await Promise.all(ks.filter(k => k.startsWith("jotun-endustri-v")).map(k => caches.delete(k)));
    await self.registration.unregister();
    const cs = await self.clients.matchAll({type: "window"});
    cs.forEach(c => c.navigate(c.url));
  })());
});
self.addEventListener("fetch", e => {
  if (e.request.mode === "navigate") e.respondWith(fetch(e.request, {cache: "no-store"}));
});
