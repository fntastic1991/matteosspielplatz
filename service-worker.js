// service-worker.js - Offline-Unterstützung

const CACHE_NAME = 'matteos-spielplatz-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js',
  '/audio_utils.js',
  '/parental_control.js',
  '/game_colors.js',
  '/game_balloons.js',
  '/game_shapes.js',
  '/game_maze.js',
  '/game_memory.js',
  '/game_oddone.js',
  '/game_numbers.js',
  '/game_counting.js',
  '/game_jumping.js',
  '/game_music.js',
  '/game_dodging.js',
  '/game_claw.js',
  '/manifest.json',
  'https://i.postimg.cc/dQr5ZBY0/Chat-GPT-Image-2-Nov-2025-08-57-55.png',
  'https://i.postimg.cc/c4wXYJMt/Chat-GPT-Image-2-Nov-2025-08-13-57.png'
];

// Installation - Cache alle wichtigen Dateien
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache geöffnet');
        return cache.addAll(urlsToCache);
      })
  );
  // Aktiviere Service Worker sofort
  self.skipWaiting();
});

// Aktivierung - Lösche alte Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Lösche alten Cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Übernehme Kontrolle sofort
  return self.clients.claim();
});

// Fetch - Serviere aus Cache, falle zurück auf Netzwerk
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache-Hit - gib gecachte Antwort zurück
        if (response) {
          return response;
        }
        
        // Nicht im Cache - hole vom Netzwerk
        return fetch(event.request).then((response) => {
          // Prüfe ob gültige Antwort
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone die Antwort
          const responseToCache = response.clone();
          
          // Füge zum Cache hinzu
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(() => {
          // Offline und nicht im Cache
          console.log('Offline - Datei nicht verfügbar:', event.request.url);
        });
      })
  );
});

