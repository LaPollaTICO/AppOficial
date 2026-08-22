// Service Worker mínimo de La Polla TICO.
// Su único propósito es cumplir el requisito técnico de los navegadores
// (Chrome/Android) para ofrecer la instalación automática de la PWA.
// De paso, deja el "cascarón" de la app (HTML/manifest) disponible offline,
// aunque los datos en vivo (partidos, pronósticos, standings) siempre
// requieren conexión porque vienen de Google Apps Script.

const CACHE_NAME = 'polla-tico-shell-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json'
];

// Al instalar, guarda el cascarón básico en caché.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .catch(() => { /* si algún archivo no existe (ej. manifest), no bloquea la instalación */ })
  );
  self.skipWaiting();
});

// Al activar, borra cachés viejas de versiones anteriores del Service Worker.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Estrategia: red primero, y si no hay conexión, cae al cascarón guardado.
// Así los datos siempre son frescos cuando hay internet, y solo se usa
// la copia offline como último recurso (ej. para que abra la pantalla
// aunque no cargue polla en vivo).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
