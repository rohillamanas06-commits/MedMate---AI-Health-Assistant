/**
 * MedMate Service Worker
 * Provides offline functionality and caching for PWA
 */

const CACHE_VERSION = 'medmate-v1.0.0';
const CACHE_NAME = `medmate-cache-${CACHE_VERSION}`;

// Assets to cache immediately
const PRECACHE_ASSETS = [
    '/',
    '/static/css/style.css',
    '/static/css/dashboard.css',
    '/static/js/main.js',
    '/static/js/dashboard.js',
    '/static/manifest.json',
    '/static/favicon.ico',
    '/static/apple-touch-icon.png'
];

// External resources to cache
const EXTERNAL_CACHE = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Cache strategies
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    NETWORK_ONLY: 'network-only',
    CACHE_ONLY: 'cache-only'
};

/**
 * Install Event - Cache essential assets
 */
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Service Worker: Caching app shell');
                
                // Cache precache assets
                return cache.addAll(PRECACHE_ASSETS)
                    .then(() => {
                        // Try to cache external resources (non-blocking)
                        return Promise.allSettled(
                            EXTERNAL_CACHE.map(url => 
                                cache.add(url).catch(err => 
                                    console.warn(`⚠️ Failed to cache: ${url}`, err)
                                )
                            )
                        );
                    });
            })
            .then(() => {
                console.log('✅ Service Worker: Installation complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Service Worker: Installation failed', error);
            })
    );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName.startsWith('medmate-cache-')) {
                            console.log(`🗑️ Service Worker: Deleting old cache: ${cacheName}`);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: Activation complete');
                return self.clients.claim();
            })
    );
});

/**
 * Fetch Event - Serve from cache or network
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other protocols
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // Determine cache strategy based on request type
    let strategy = CACHE_STRATEGIES.NETWORK_FIRST;
    
    // Static assets - cache first
    if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
        strategy = CACHE_STRATEGIES.CACHE_FIRST;
    }
    
    // API calls - network only
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/diagnose') || 
        url.pathname.startsWith('/chat') || url.pathname.startsWith('/analyze-image')) {
        strategy = CACHE_STRATEGIES.NETWORK_ONLY;
    }
    
    event.respondWith(handleFetch(request, strategy));
});

/**
 * Handle fetch with appropriate strategy
 */
async function handleFetch(request, strategy) {
    switch (strategy) {
        case CACHE_STRATEGIES.CACHE_FIRST:
            return cacheFirst(request);
        
        case CACHE_STRATEGIES.NETWORK_FIRST:
            return networkFirst(request);
        
        case CACHE_STRATEGIES.NETWORK_ONLY:
            return fetch(request);
        
        case CACHE_STRATEGIES.CACHE_ONLY:
            return caches.match(request);
        
        default:
            return networkFirst(request);
    }
}

/**
 * Cache First Strategy
 */
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ Fetch failed:', error);
        
        // Return offline page if available
        const offlineResponse = await caches.match('/offline.html');
        return offlineResponse || new Response('Offline', { status: 503 });
    }
}

/**
 * Network First Strategy
 */
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('⚠️ Network failed, trying cache:', request.url);
        
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page if available
        const offlineResponse = await caches.match('/offline.html');
        return offlineResponse || new Response('Offline', { status: 503 });
    }
}

/**
 * Message Event - Handle messages from clients
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        const urls = event.data.urls || [];
        caches.open(CACHE_NAME).then((cache) => {
            cache.addAll(urls);
        });
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('🗑️ Cache cleared');
        });
    }
});

/**
 * Push Event - Handle push notifications
 */
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New notification from MedMate',
        icon: '/static/icons/icon-192x192.png',
        badge: '/static/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('MedMate', options)
    );
});

/**
 * Notification Click Event
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});

console.log('✅ Service Worker: Loaded successfully');
