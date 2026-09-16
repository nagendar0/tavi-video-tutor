/**
 * AITutor v2.0 Enterprise Offline Architecture & IndexedDB Storage Cache Engine
 */

const DB_NAME = 'aitutor_offline_v2';
const DB_VERSION = 1;
const STORE_SUBTITLES = 'subtitles';
const STORE_MANIFESTS = 'manifests';

let dbInstancePromise = null;

export class IndexedDBCache {
  static async openDB() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return null;
    }

    if (dbInstancePromise) {
      return dbInstancePromise;
    }

    dbInstancePromise = new Promise((resolve, reject) => {
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

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          dbInstancePromise = null;
        };
        db.onclose = () => {
          dbInstancePromise = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        dbInstancePromise = null;
        reject(request.error);
      };
    });

    return dbInstancePromise;
  }

  static async closeDB() {
    if (dbInstancePromise) {
      try {
        const db = await dbInstancePromise;
        db?.close();
      } catch (_) {}
      dbInstancePromise = null;
    }
  }

  static async getSubtitle(key) {
    try {
      const db = await this.openDB();
      if (!db) return null;

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_SUBTITLES, 'readonly');
        const store = tx.objectStore(STORE_SUBTITLES);
        const req = store.get(key);

        const cleanup = () => {
          req.onsuccess = null;
          req.onerror = null;
        };

        req.onsuccess = () => {
          const res = req.result || null;
          cleanup();
          resolve(res);
        };
        req.onerror = () => {
          cleanup();
          resolve(null);
        };
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

        const cleanup = () => {
          req.onsuccess = null;
          req.onerror = null;
        };

        req.onsuccess = () => {
          cleanup();
          resolve(true);
        };
        req.onerror = () => {
          cleanup();
          resolve(false);
        };
      });
    } catch (_) {
      return false;
    }
  }
}

export default IndexedDBCache;
