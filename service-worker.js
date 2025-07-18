// Define the cache name and the list of files to cache
const CACHE_NAME = 'chat-app-cache-v1';
const urlsToCache = [
  '/', // Caches the root URL, which typically serves index.html
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com', // Tailwind CSS CDN
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap', // Inter font CSS
  'https://unpkg.com/react@18/umd/react.production.min.js', // React CDN
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', // ReactDOM CDN
  'https://unpkg.com/@babel/standalone/babel.min.js', // Babel CDN
  // Firebase SDKs - these are imported as modules, so they might be fetched dynamically.
  // It's generally better to let the browser cache these as they are frequently updated.
  // However, if you want to explicitly cache them for stricter offline, you'd list them:
  // 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
  // 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js',
  // 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
];

// Install event: caches the static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache during install', error);
      })
  );
});

// Activate event: cleans up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        }).filter(Boolean) // Filter out nulls
      );
    })
  );
});

// Fetch event: serves content from cache or network
self.addEventListener('fetch', (event) => {
  // We only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // No cache hit - fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and can only be consumed once. We must clone it so that
            // we can consume one in the cache and one in the browser.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('Service Worker: Fetch failed:', error);
            // You could return a fallback page here for offline
            // e.g., caches.match('/offline.html');
            return new Response('<h1>You are offline</h1>', {
                headers: { 'Content-Type': 'text/html' }
            });
          });
      })
  );
});

