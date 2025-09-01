const CACHE_NAME = 'gltf-viewer-v2'; // Increment cache version
const PRECACHE_ASSETS = [
    // '/', // Removing root path to avoid potential redirect issues during install
    '/index.html',
    '/js/three/build/three.module.js',
    '/js/three/examples/jsm/controls/OrbitControls.js',
    '/js/three/examples/jsm/loaders/GLTFLoader.js',
    '/js/three/examples/jsm/loaders/FBXLoader.js',
    '/js/three/examples/jsm/loaders/OBJLoader.js',
    '/js/three/examples/jsm/loaders/STLLoader.js',
    '/js/three/examples/jsm/webxr/VRButton.js',
    '/js/three/examples/jsm/webxr/ARButton.js',
    '/js/three/examples/jsm/libs/fflate.module.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Opened cache and adding precache assets');
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Don't cache 3d models or the PHP script.
    if (url.pathname.startsWith('/3d/') || url.pathname.endsWith('get_models.php')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Cache-first strategy for all other requests.
    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cachedResponse = await cache.match(event.request);
            if (cachedResponse) {
                return cachedResponse;
            }

            // Specifically handle navigation to the root directory
            if (event.request.mode === 'navigate' && url.pathname === '/') {
                const indexResponse = await cache.match('/index.html');
                if (indexResponse) {
                    return indexResponse;
                }
            }

            // Fallback to network for everything else.
            return fetch(event.request);
        })
    );
});
