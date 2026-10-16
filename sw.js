// Service Worker do Cardápio Dinâmico
// Ao alterar qualquer arquivo do site, troque o número da versão abaixo
// para o celular baixar a atualização.
const VERSAO = 'cardapio-v4';
const ARQUIVOS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './extras.js',
  './firebase-config.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSAO).then((cache) =>
      // Guarda um por um: se algum arquivo faltar, os outros continuam sendo salvos
      Promise.all(ARQUIVOS.map((a) => cache.add(a).catch((e) => console.warn('Sem cache:', a, e))))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((c) => c !== VERSAO).map((c) => caches.delete(c)))
    )
  );
  self.clients.claim();
});

// Rede primeiro (pega sempre a versão nova quando online), cache como reserva (offline)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copia = res.clone();
        caches.open(VERSAO).then((cache) => cache.put(req, copia));
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
