/**
 * FYI - Service Worker
 * Enables offline functionality and caching
 */

const CACHE_NAME = 'fyi-v17';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    'https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@variable&display=swap',
    'https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip cross-origin requests except for fonts
    const url = new URL(event.request.url);
    if (url.origin !== location.origin &&
        !url.hostname.includes('fonts.googleapis.com') &&
        !url.hostname.includes('fonts.gstatic.com') &&
        !url.hostname.includes('fontshare.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version
                    return cachedResponse;
                }

                // Fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            // Allow caching of opaque responses for fonts
                            if (response && response.type === 'opaque') {
                                const responseToCache = response.clone();
                                caches.open(CACHE_NAME)
                                    .then((cache) => cache.put(event.request, responseToCache));
                            }
                            return response;
                        }

                        // Clone response and cache it
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => cache.put(event.request, responseToCache));

                        return response;
                    })
                    .catch(() => {
                        // Return offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
