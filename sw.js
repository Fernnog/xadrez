const CACHE_NAME = 'chess-pwa-v1.0.3'; // Versão incrementada
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/main.css',
    './src/main.js',
    './src/modules/ui.js',
    './src/modules/game.js',
    './src/modules/engine.js',
    './src/modules/utils.js',
    './src/modules/config.js',
    './src/modules/audio.js',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Força o novo SW a ativar imediatamente
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache); // Limpa cache antigo
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
