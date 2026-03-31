// TPV Ultra Smart — Service Worker PWA
const CACHE = 'tpv-v7';
const ARCHIVOS = ['/', '/tpv_main.js', '/tpv_auth.js', '/tpv_tienda.js',
                  '/tpv_export.js', '/tpv_debugger.js', '/manifest.json',
                  '/pwa-icon-192.png', '/pwa-icon-512.png'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ));
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    if (new URL(e.request.url).pathname.startsWith('/api/')) {
        e.respondWith(fetch(e.request));
        return;
    }
    e.respondWith(
        fetch(e.request).then(r => {
            if (r && r.status === 200) {
                const c = r.clone();
                caches.open(CACHE).then(cache => cache.put(e.request, c));
            }
            return r;
        }).catch(() => caches.match(e.request).then(c => c || caches.match('/')))
    );
});
