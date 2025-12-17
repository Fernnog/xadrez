// sw.js

// Lógica para recuperar a versão da URL de registro (passada no main.js)
const getVersionFromUrl = () => {
    const params = new URLSearchParams(self.location.search);
    // Retorna o parâmetro 'v' ou um valor padrão caso falhe
    return params.get('v') || '1.0.0'; 
};

const VERSION = getVersionFromUrl();
const CACHE_NAME = `chess-pwa-${VERSION}`;
const REPO = '/xadrez'; // Caminho exato do repositório

const ASSETS_TO_CACHE = [
    REPO + '/',
    REPO + '/index.html',
    REPO + '/css/main.css',
    REPO + '/src/main.js',
    REPO + '/src/modules/ui.js',
    REPO + '/src/modules/game.js',
    REPO + '/src/modules/engine.js',
    REPO + '/src/modules/utils.js',
    REPO + '/src/modules/config.js',
    REPO + '/src/modules/audio.js',
    REPO + '/src/modules/changelog.js', // Mestre da versão
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    // Remove qualquer cache que não corresponda ao CACHE_NAME atual (que contém a nova versão)
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
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
