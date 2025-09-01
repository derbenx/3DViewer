const CACHE_NAME = 'gltf-viewer-v6';
const PRECACHE_ASSETS = [
    '/',
    'index.html',
    'js/three/build/three.module.js',
    'js/three/examples/jsm/controls/OrbitControls.js',
    'js/three/examples/jsm/loaders/GLTFLoader.js',
    'js/three/examples/jsm/loaders/FBXLoader.js',
    'js/three/examples/jsm/loaders/OBJLoader.js',
    'js/three/examples/jsm/loaders/STLLoader.js',
    'js/three/examples/jsm/webxr/VRButton.js',
    'js/three/examples/jsm/webxr/ARButton.js',
    'js/three/examples/jsm/libs/fflate.module.js',
    'js/three/examples/jsm/webxr/XRControllerModelFactory.js',
    'js/three/examples/jsm/libs/motion-controllers.module.js',
    'js/three/examples/jsm/curves/NURBSCurve.js',
    'js/three/examples/jsm/curves/NURBSUtils.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache and adding precache assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => self.skipWaiting()) // Force the waiting service worker to become the active service worker.
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control of all open clients.
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Don't cache 3d models or the PHP script.
    if (url.pathname.startsWith('/3d/') || url.pathname.endsWith('get_models.php')) {
        // Go to network only for these requests.
        return;
    }

    // For navigation requests (e.g., loading the page), use a network-first strategy.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    // 1. Try to fetch from the network.
                    const networkResponse = await fetch(event.request);
                    // 2. If successful, put a copy in the cache.
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(event.request, networkResponse.clone());
                    // 3. Return the network response.
                    return networkResponse;
                } catch (error) {
                    // 4. If the network fails, try to serve from the cache.
                    console.log('Network request failed, trying to serve from cache.');
                    const cache = await caches.open(CACHE_NAME);
                    return await cache.match(event.request) || await cache.match('/index.html');
                }
            })()
        );
        return;
    }

    // For all other requests (assets like JS, CSS), use a cache-first strategy.
    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            // 1. Try to get the response from the cache.
            const cachedResponse = await cache.match(event.request);
            if (cachedResponse) {
                return cachedResponse;
            }
            // 2. If not in cache, fetch from the network, cache it, and return the response.
            const networkResponse = await fetch(event.request);
            await cache.put(event.request, networkResponse.clone());
            return networkResponse;
        })()
    );
});
