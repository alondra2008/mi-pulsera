// service-worker.js - Para notificaciones en segundo plano
const CACHE_NAME = 'kizuna-v1';

self.addEventListener('install', (event) => {
    console.log('✅ Service Worker instalado');
    self.skipWaiting();
});

self.addEventListener('push', (event) => {
    let data = { title: 'Kizuna', body: 'Notificación', url: '/panel.html' };
    
    if (event.data) {
        data = event.data.json();
    }
    
    const options = {
        body: data.body,
        icon: '/icono-192.png',
        badge: '/badge-72.png',
        vibrate: [200, 100, 200],
        data: { url: data.url },
        actions: [
            { action: 'ver', title: 'Ver pulsera' },
            { action: 'cerrar', title: 'Cerrar' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'ver' || event.action === '') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/panel.html')
        );
    }
});

// Para cuando la app está offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});