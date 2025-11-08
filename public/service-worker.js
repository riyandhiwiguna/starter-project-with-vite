const CACHE_NAME = 'dicoding-story-v1';
const API_CACHE = 'dicoding-story-api-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/styles/styles.css',
  '/scripts/index.js',
  '/public/images/logo.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.origin === 'https://story-api.dicoding.dev') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(request).then((fetchResponse) => {
          const clone = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return fetchResponse;
        })
      );
    })
  );
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let notificationData = {
    title: 'Dicoding Story',
    options: {
      body: 'Ada notifikasi baru!',
      icon: '/public/images/logo.png',
      badge: '/public/images/logo.png',
      vibrate: [200, 100, 200],
      data: { url: '/' },
    },
  };

  if (event.data) {
    try {

      const payload = event.data.json();
      notificationData.title = payload.title || notificationData.title;
      notificationData.options.body = payload.body || notificationData.options.body;
      notificationData.options.data = payload.data || notificationData.options.data;
    } catch (err) {

      const text = event.data.text();
      console.warn('[SW] Payload bukan JSON, pakai text:', text);
      notificationData.title = 'Dicoding Story';
      notificationData.options.body = text;
    }
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationData.options
    )
  );
});


self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

async function syncFavorites() {
  try {
    const db = await openDatabase();
    const tx = db.transaction('pending-sync', 'readonly');
    const store = tx.objectStore('pending-sync');
    const pendingItems = await store.getAll();

    for (const item of pendingItems) {
      try {
        const token = await getToken();
        if (!token) continue;

        const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: item.data,
        });

        if (response.ok) {
          const deleteTx = db.transaction('pending-sync', 'readwrite');
          const deleteStore = deleteTx.objectStore('pending-sync');
          await deleteStore.delete(item.id);
          console.log('[SW] Synced item:', item.id);
        }
      } catch (err) {
        console.error('[SW] Sync failed for item:', item.id, err);
      }
    }
  } catch (err) {
    console.error('[SW] Background sync failed:', err);
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('dicoding-story-db', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getToken() {
  return new Promise((resolve) => {
    self.clients.matchAll().then((clients) => {
      if (clients && clients.length > 0) {
        clients[0].postMessage({ type: 'GET_TOKEN' });
      }
      resolve(null);
    });
  });
}
