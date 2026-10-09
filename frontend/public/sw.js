const CACHE_NAME = 'rotana-clinic-cache-v2';

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/patients',
  '/visits',
  '/queue',
  '/prescriptions',
  '/billing',
  '/certificates',
  '/follow-ups',
  '/documents',
  '/login',
  '/settings',
  '/staff',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Precache critical core routes safely (fault-tolerant)
      for (const url of PRECACHE_URLS) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn('[SW] Precache skipped for:', url, err);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests (mutations handled by IndexedDB sync queue)
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip real-time payment status / settle polling endpoints (direct network only)
  if (url.pathname.includes('/api/payments/status') || url.pathname.includes('/api/payments/settle')) {
    return;
  }

  // 1. Navigation Requests (HTML pages): Network-First with App Shell Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Offline navigation fallback: Try matching exact page, or return root App Shell ('/')
          const cachedPage = await caches.match(event.request);
          if (cachedPage) return cachedPage;
          const appShell = await caches.match('/');
          if (appShell) return appShell;
          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rotana Clinic - Offline</title><style>body{font-family:sans-serif;padding:2rem;text-align:center;background:#f8fafc;color:#0f172a;}button{padding:0.75rem 1.5rem;background:#0f766e;color:white;border:none;border-radius:0.75rem;font-weight:bold;cursor:pointer;margin-top:1rem;}</style></head><body><h2>មជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ រតនា</h2><p>ប្រព័ន្ធកំពុងដំណើរការក្នុងរបៀប Offline។ សូមបើកទំព័រដើម។</p><button onclick="location.href='/'">ចូលទៅកាន់ទំព័រដើម (Go to App)</button></body></html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // 2. Read-Only API Endpoints: Network-First with Cache Fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // 3. Static Assets (_next/static, css, js, icons, images, fonts): Cache-First / Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
