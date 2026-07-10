const CACHE = 'giresunyoresel-v2'; // versiyon artırıldı, eski cache otomatik temizlenecek
const ASSETS = [
  '/logo.png',
  '/reklam.jpg',
  '/hero-video.mp4',
  '/manifest.json',
  '/urun-findik-ici.jpg',
  '/urun-findik-ezmesi.jpg',
  '/urun-kabuklu-findik.jpg',
  '/urun-kara-lahana.jpg',
  '/urun-fasulye.jpg',
  '/urun-misir-ekmegi.jpg',
  '/urun-misir.jpg'
];

// Kurulum — sadece ağır/statik medya dosyalarını önbelleğe al
// (HTML dosyaları BİLEREK burada yok, hep taze gelsin diye)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Aktivasyon — eski cache'leri (v1 dahil) temizle
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isHtmlRequest(request) {
  return request.mode === 'navigate' ||
         (request.headers.get('accept') || '').includes('text/html') ||
         request.url.endsWith('.html') ||
         request.url.endsWith('/');
}

self.addEventListener('fetch', e => {
  const request = e.request;

  // HTML sayfaları (index.html, blog.html, admin-*.html, vs.) ve JS dosyaları:
  // ÖNCE NETWORK dene, başarısız olursa (offline vs.) cache'e düş.
  // Bu sayede her deploy sonrası kullanıcı hard refresh atmadan güncel görür.
  if (isHtmlRequest(request) || request.url.endsWith('.js')) {
    e.respondWith(
      fetch(request)
        .then(res => {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE).then(cache => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }

  // Görsel/video gibi ağır statik dosyalar: ÖNCE CACHE (hızlı yüklensin),
  // cache'de yoksa network'ten çekip cache'e ekle.
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(request, clone));
        return res;
      });
    })
  );
});
