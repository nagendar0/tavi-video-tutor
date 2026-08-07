/**
 * AITutor v2.0 Enterprise Offline Architecture & IndexedDB Storage Cache Engine
 */

const DB_NAME = 'aitutor_offline_v2';
const DB_VERSION = 1;
const STORE_SUBTITLES = 'subtitles';
const STORE_MANIFESTS = 'manifests';

export class IndexedDBCache {
  static async openDB() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_SUBTITLES)) {
          db.createObjectStore(STORE_SUBTITLES);
        }
        if (!db.objectStoreNames.contains(STORE_MANIFESTS)) {
          db.createObjectStore(STORE_MANIFESTS);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async getSubtitle(key) {
    try {
      const db = await this.openDB();
      if (!db) return null;

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_SUBTITLES, 'readonly');
        const store = tx.objectStore(STORE_SUBTITLES);
        const req = store.get(key);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (_) {
      return null;
    }
  }

  static async setSubtitle(key, value) {
    try {
      const db = await this.openDB();
      if (!db) return false;

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_SUBTITLES, 'readwrite');
        const store = tx.objectStore(STORE_SUBTITLES);
        const req = store.put(value, key);

        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch (_) {
      return false;
    }
  }
}

export default IndexedDBCache;
