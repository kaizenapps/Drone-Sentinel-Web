/**
 * Service Worker for Drone Sentinel
 * Handles caching for offline usage
 */

const CACHE_NAME = 'drone-sentinel-cache-v1';
const DYNAMIC_CACHE_NAME = 'drone-sentinel-dynamic-cache-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/main.js',
  '/i18n.js',
  '/translations.js',
  '/version.js',
  '/sounds/classic_alarm.mp3',
  '/sounds/siren.mp3',
  '/sounds/buzzer.mp3',
  '/model.json',
  '/weights.bin'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheAllowlist = [CACHE_NAME, DYNAMIC_CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheAllowlist.includes(cacheName)) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Handle API calls differently if needed
  if (event.request.url.includes('/api/')) {
    // Handle API requests (we don't have any now, but for future use)
    return;
  }

  // For normal asset requests
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();
            
            // Store the new response in the dynamic cache
            caches.open(DYNAMIC_CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If network fails and it's an HTML request, return the offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Handle messages from the client
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  // Handle custom sound caching
  if (event.data.action === 'cacheCustomSound') {
    const { soundName, soundBlob } = event.data;
    
    caches.open(DYNAMIC_CACHE_NAME)
      .then(cache => {
        // Create a response object from the blob
        const response = new Response(soundBlob);
        // Cache the custom sound with a predictable URL
        cache.put(`/sounds/custom/${soundName}`, response);
        
        // Confirm to client
        event.ports[0].postMessage({
          status: 'success',
          message: `Custom sound "${soundName}" cached successfully`
        });
      })
      .catch(error => {
        event.ports[0].postMessage({
          status: 'error',
          message: error.message
        });
      });
  }
});

// Listen for push notifications (for future use)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/images/icon.png',
      badge: '/images/badge.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url
      }
    };
    
    event.waitUntil(
      self.registration.showNotification('Drone Sentinel', options)
    );
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
