const DB_NAME = 'TaviSubtitleCache';
const DB_VERSION = 1;
const STORE_NAME = 'subtitles';

let dbInstance = null;

const getDB = () => {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };
    request.onerror = (e) => {
      reject(e.target.error);
    };
  });
};

export const getCachedSubtitle = async (url) => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);
      const cleanup = () => {
        request.onsuccess = null;
        request.onerror = null;
      };
      request.onsuccess = () => {
        const res = request.result || null;
        cleanup();
        resolve(res);
      };
      request.onerror = () => {
        const err = request.error;
        cleanup();
        reject(err);
      };
    });
  } catch (err) {
    console.error('IndexedDB get error:', err);
    return null;
  }
};

export const setCachedSubtitle = async (url, vtt) => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(vtt, url);
      const cleanup = () => {
        request.onsuccess = null;
        request.onerror = null;
      };
      request.onsuccess = () => {
        cleanup();
        resolve();
      };
      request.onerror = () => {
        const err = request.error;
        cleanup();
        reject(err);
      };
    });
  } catch (err) {
    console.error('IndexedDB put error:', err);
  }
};
