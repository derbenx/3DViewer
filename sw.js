const CACHE_NAME = 'gltf-viewer-v4';
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

    // For all other requests, implement a cache-first, then network strategy.
    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            // 1. Try to get the response from the cache.
            const cachedResponse = await cache.match(event.request);
            if (cachedResponse) {
                return cachedResponse;
            }

            // 2. If not in cache, try to fetch from the network.
            try {
                const networkResponse = await fetch(event.request);
                // 3. If the fetch is successful, clone the response and store it in the cache.
                if (networkResponse.ok) {
                    await cache.put(event.request, networkResponse.clone());
                }
                // 4. Return the network response.
                return networkResponse;
            } catch (error) {
                // 5. If the network fails (e.g., offline), and it wasn't in the cache,
                // there's nothing we can do. The browser will handle the error.
                // You could optionally return a generic fallback page here.
                console.error('Fetch failed; returning offline fallback (if any).', error);
                // For navigation requests, try to return the main app page.
                if (event.request.mode === 'navigate') {
                    return await cache.match('/index.html');
                }
                return;
            }
        })
    );
});
