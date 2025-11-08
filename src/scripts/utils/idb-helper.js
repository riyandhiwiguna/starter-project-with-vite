const DB_NAME = 'dicoding-story-db';
const DB_VERSION = 1;
const FAVORITES_STORE = 'favorites';
const PENDING_SYNC_STORE = 'pending-sync';

class IDBHelper {
  constructor() {
    this.db = null;
  }

  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
          const favoritesStore = db.createObjectStore(FAVORITES_STORE, { keyPath: 'id' });
          favoritesStore.createIndex('name', 'name', { unique: false });
          favoritesStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('✅ Favorites store created');
        }

        if (!db.objectStoreNames.contains(PENDING_SYNC_STORE)) {
          db.createObjectStore(PENDING_SYNC_STORE, { keyPath: 'id', autoIncrement: true });
          console.log('✅ Pending sync store created');
        }
      };
    });
  }

  async ensureDB() {
    if (!this.db) {
      await this.openDatabase();
    }
    return this.db;
  }


  async addFavorite(story) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FAVORITES_STORE], 'readwrite');
      const store = transaction.objectStore(FAVORITES_STORE);
      const request = store.add({
        ...story,
        favoritedAt: new Date().toISOString()
      });

      request.onsuccess = () => {
        console.log('✅ Story added to favorites:', story.id);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('❌ Failed to add favorite:', request.error);
        reject(request.error);
      };
    });
  }

  async removeFavorite(id) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FAVORITES_STORE], 'readwrite');
      const store = transaction.objectStore(FAVORITES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('✅ Story removed from favorites:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('❌ Failed to remove favorite:', request.error);
        reject(request.error);
      };
    });
  }

  async getFavorite(id) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FAVORITES_STORE], 'readonly');
      const store = transaction.objectStore(FAVORITES_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getAllFavorites() {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FAVORITES_STORE], 'readonly');
      const store = transaction.objectStore(FAVORITES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async isFavorite(id) {
    const favorite = await this.getFavorite(id);
    return !!favorite;
  }


  async searchFavorites(query) {
    const allFavorites = await this.getAllFavorites();
    const lowerQuery = query.toLowerCase();
    
    return allFavorites.filter(story => 
      story.name.toLowerCase().includes(lowerQuery) ||
      story.description.toLowerCase().includes(lowerQuery)
    );
  }

  async sortFavorites(sortBy = 'newest') {
    const allFavorites = await this.getAllFavorites();
    
    switch (sortBy) {
      case 'newest':
        return allFavorites.sort((a, b) => 
          new Date(b.favoritedAt) - new Date(a.favoritedAt)
        );
      case 'oldest':
        return allFavorites.sort((a, b) => 
          new Date(a.favoritedAt) - new Date(b.favoritedAt)
        );
      case 'name-asc':
        return allFavorites.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
      case 'name-desc':
        return allFavorites.sort((a, b) => 
          b.name.localeCompare(a.name)
        );
      default:
        return allFavorites;
    }
  }


  async addPendingSync(data) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PENDING_SYNC_STORE], 'readwrite');
      const store = transaction.objectStore(PENDING_SYNC_STORE);
      const request = store.add({
        data,
        timestamp: new Date().toISOString()
      });

      request.onsuccess = () => {
        console.log('✅ Added to pending sync queue');
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getPendingSync() {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PENDING_SYNC_STORE], 'readonly');
      const store = transaction.objectStore(PENDING_SYNC_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async clearPendingSync(id) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PENDING_SYNC_STORE], 'readwrite');
      const store = transaction.objectStore(PENDING_SYNC_STORE);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async clearAllFavorites() {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FAVORITES_STORE], 'readwrite');
      const store = transaction.objectStore(FAVORITES_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('✅ All favorites cleared');
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

export default new IDBHelper();