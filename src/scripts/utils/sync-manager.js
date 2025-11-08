const DB_NAME = 'story-db';
const DB_VERSION = 1;
const STORE_NAME = 'pending-stories';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function addPendingRaw(item) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(item);
    req.onsuccess = () => {
      resolve(req.result);
    };
    req.onerror = () => reject(req.error);
  });
}

async function getAllPendingRaw() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function deletePendingRaw(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

const SyncManager = {
  async addPending(data) {

    const id = await addPendingRaw(data);
    console.log('[SyncManager] Saved pending story id=', id);
    return id;
  },

  async getAllPending() {
    return await getAllPendingRaw();
  },

  async deletePending(id) {
    await deletePendingRaw(id);
  },

  async syncPendingStories() {
    const pendings = await getAllPendingRaw();
    if (!pendings || pendings.length === 0) {
      console.log('[SyncManager] No pending stories to sync');
      return;
    }

    console.log(`[SyncManager] Syncing ${pendings.length} pending stories...`);

    for (const item of pendings) {
      try {
        const formData = new FormData();
        formData.append('description', item.description || '');
        formData.append('lat', item.lat || '');
        formData.append('lon', item.lon || '');

        if (item.photo) {

          formData.append('photo', item.photo, item.photo.name || 'offline-photo.jpg');
        }

        const headers = {};
        if (item.token) headers['Authorization'] = `Bearer ${item.token}`;

        const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
          method: 'POST',
          headers,
          body: formData,
        });

        if (response.ok) {
          console.log('[SyncManager] Synced pending story id=', item.id);
          await deletePendingRaw(item.id);
        } else {
          console.warn('[SyncManager] Server responded not ok when syncing id=', item.id, await response.text());

        }
      } catch (err) {
        console.error('[SyncManager] Network/send failed for id=', item.id, err);

        return;
      }
    }
    console.log('[SyncManager] Sync complete');
  },
};

export default SyncManager;
