const CACHE_NAME = 'jobink-cache-v1.0.0';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.png',
  '/icons/splash.png'
];

// Install Event - Pre-cache core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching core assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing outdated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper to determine if a request should be cached
const shouldCache = (request) => {
  const url = new URL(request.url);
  
  // Only cache HTTP/HTTPS requests
  if (!url.protocol.startsWith('http')) return false;

  // Do not cache Chrome/Edge extension assets
  if (url.origin !== self.location.origin && !request.url.includes('fonts.googleapis.com') && !request.url.includes('fonts.gstatic.com')) {
    // Only cache external Google Fonts, ignore other external domains like Firebase DB/auth
    return false;
  }

  // Do not cache dev server HMR/websockets
  if (url.pathname.includes('/@vite/') || url.pathname.includes('/@id/') || url.pathname.includes('socket.io') || request.url.includes('hot-update')) {
    return false;
  }

  // Do not cache Firebase Authentication, Firestore, Analytics, or Functions requests
  if (
    request.url.includes('/identitytoolkit/') ||
    request.url.includes('/securetoken/') ||
    request.url.includes('/firestore.googleapis.com/') ||
    request.url.includes('google-analytics') ||
    request.url.includes('/functions.net/')
  ) {
    return false;
  }

  return true;
};

// Fetch Event - Handle caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (!shouldCache(request)) {
    return; // Pass through to network
  }

  const url = new URL(request.url);

  // Network-First strategy for HTML navigation requests (Single Page App index shell / offline fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If online and response valid, clone to cache and return
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback: try to return SPA index page first, otherwise fallback to offline.html
          return caches.match('/')
            .then((cachedResponse) => {
              if (cachedResponse) return cachedResponse;
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // Stale-While-Revalidate strategy for static resources (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh asset in background and update cache
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          })
          .catch((err) => console.log('[Service Worker] Background fetch failed for:', request.url, err));
        
        return cachedResponse;
      }

      // If not in cache, fetch from network and cache it
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        
        return networkResponse;
      }).catch(() => {
        // If an image request fails, maybe return a fallback if needed
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});

// Skip waiting event listener
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skip waiting requested');
    self.skipWaiting();
  }
});

// Push notification event listener
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push event received');
  let data = { title: 'JobInk Update', body: 'New notification from JobInk!' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'JobInk Update', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event listener (Deep Linking)
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  const targetUrl = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If there's an open window, navigate it to the target URL and focus it
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if ('focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // If no windows open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
