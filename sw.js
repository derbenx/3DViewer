const swEnabled = 0;

if (!swEnabled) {
    // --- SERVICE WORKER DISABLED ---

    self.addEventListener('install', (event) => {
        // Skip waiting to ensure the new (disabling) service worker activates quickly.
        console.log('Service Worker: Bypassing cache for disable.');
        self.skipWaiting();
    });

    self.addEventListener('activate', (event) => {
        console.log('Service Worker: Deactivating and unregistering.');
        event.waitUntil(
            (async () => {
                // 1. Unregister the service worker.
                await self.registration.unregister();

                // 2. Delete all caches.
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(cacheName => {
                    console.log('Deleting cache:', cacheName);
                    return caches.delete(cacheName);
                }));

                // 3. Force all clients to reload to shed the service worker.
                const clients = await self.clients.matchAll({ type: 'window' });
                clients.forEach((client) => {
                    // A simple reload is often the easiest way to ensure the page
                    // is no longer controlled by the (now unregistered) service worker.
                    client.navigate(client.url);
                });
            })()
        );
    });

} else {
    // --- SERVICE WORKER ENABLED ---

    const CACHE_NAME = 'gltf-viewer-v8';
    const PRECACHE_ASSETS = [
        '/',
        'index.html',
        'version.txt',
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
            (async () => {
                console.log('Service Worker: Install event in progress.');
                const cache = await caches.open(CACHE_NAME);

                // 1. Fetch the version file with a cache-busting parameter.
                const versionRequest = new Request('./version.txt', { cache: 'no-store' });
                const versionResponse = await fetch(versionRequest);

                if (!versionResponse.ok) {
                    throw new Error('Could not fetch version.txt. Aborting installation.');
                }

                const responseText = await versionResponse.text();
                const expectedKey = '21a0616db67ac894124be948ecdad657327cf42df016f26e66';

                // 2. Validate the key.
                if (responseText.trim() !== expectedKey) {
                    throw new Error(`Version key mismatch. Expected ${expectedKey}, got ${responseText.trim()}. Aborting installation.`);
                }

                console.log('Service Worker: Version key validated. Caching app shell.');

                // 3. If validation passes, cache all assets.
                await cache.addAll(PRECACHE_ASSETS);

                console.log('Service Worker: App shell cached successfully.');
                return self.skipWaiting();
            })()
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
            event.respondWith((async () => {
                try {
                    const networkResponse = await fetch(event.request);
                    // If we get a response, update the cache and return it.
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                } catch (error) {
                    // If the network fails, serve from the cache.
                    console.log('Network request failed, serving from cache.');
                    const cache = await caches.open(CACHE_NAME);
                    return await cache.match(event.request) || await cache.match('/');
                }
            })());
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
}
