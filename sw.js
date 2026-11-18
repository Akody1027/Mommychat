const CACHE_NAME = 'mommychat-v1';

// The Core App Shell - Files stored on the device for instant loading
const STATIC_ASSETS = [
  '/',
  '/home.html',
  '/profile.html',
  '/manifest.json',
  '/Mlogo192.png',
  '/Mlogo512.png',
  '/Mlogo180.png',
  '/Mtoken.PNG',
  '/Momchat.mp3'
];

// Install Phase: Cache the App Shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate Phase: Delete old cache versions when you update CACHE_NAME
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Phase: Stale-While-Revalidate Strategy
self.addEventListener('fetch', (event) => {
  // Only cache requests from your own domain. 
  // Let Firebase, Stripe, and Google APIs pass directly to the internet.
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  // Only cache GET requests (Ignore POST/PUT like database writes)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Background network fetch to update the cache for next time
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch((err) => {
        console.warn('Network fetch failed, serving from cache.', err);
      });
      
      // Serve the instant cached version if we have it, otherwise wait for the network
      return cachedResponse || fetchPromise;
    })
  );
});