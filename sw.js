const CACHE_NAME = 'gabina-huerta-cache-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/img1.png'
];

// Evento de instalación: se dispara cuando el Service Worker se instala.
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Evento de activación: se dispara cuando el Service Worker se activa.
// Aquí se pueden limpiar cachés antiguos.
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Evento de fetch: se dispara cada vez que la página pide un recurso (CSS, JS, imagen, etc.)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si el recurso está en caché, lo devolvemos desde el caché.
                if (response) {
                    return response;
                }
                // Si no, lo pedimos a la red, lo devolvemos y lo añadimos al caché para la próxima vez.
                return fetch(event.request).then(
                    function(response) {
                        // Comprobar si hemos recibido una respuesta válida
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});

self.addEventListener('push', event => {
    const data = event.data.json();
    console.log('Push recibido:', data);

    const title = data.title || 'Notificación de La Huerta';
    const options = {
        body: data.body || 'Hay novedades en la huerta.',
        icon: '/img1.png',
        badge: '/img1.png'
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});