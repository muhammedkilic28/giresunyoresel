const CACHE = 'giresunyoresel-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/fiyatlar.html',
  '/logo.png',
  '/reklam.jpg',
  '/hero-video.mp4',
  '/manifest.json'
];

// Kurulum — dosyaları önbelleğe al
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Aktivasyon — eski cache temizle
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — önce cache, sonra network
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
