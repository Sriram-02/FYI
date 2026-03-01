/**
 * FYI - Service Worker
 * Enables offline functionality and caching
 */

const CACHE_NAME = 'fyi-v36-lean';
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

    // Network-first for core app files (JS, CSS, HTML) to ensure freshness
    // Cache-first for fonts and other static assets
    const isCoreAsset = url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.html') || url.pathname === '/';

    if (isCoreAsset) {
        // NETWORK-FIRST: Try network, fall back to cache
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => cache.put(event.request, responseToCache));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request)
                        .then((cachedResponse) => {
                            if (cachedResponse) return cachedResponse;
                            if (event.request.mode === 'navigate') {
                                return caches.match('/index.html');
                            }
                            return new Response('Offline', { status: 503 });
                        });
                })
        );
    } else {
        // CACHE-FIRST: For fonts and other static assets
        event.respondWith(
            caches.match(event.request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return fetch(event.request)
                        .then((response) => {
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                if (response && response.type === 'opaque') {
                                    const responseToCache = response.clone();
                                    caches.open(CACHE_NAME)
                                        .then((cache) => cache.put(event.request, responseToCache));
                                }
                                return response;
                            }

                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => cache.put(event.request, responseToCache));

                            return response;
                        })
                        .catch(() => {
                            return new Response('Offline', { status: 503 });
                        });
                })
        );
    }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
