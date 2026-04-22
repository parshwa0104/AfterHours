const DB_NAME = 'afterhours-local';
const DB_VERSION = 1;
const STORE_NAME = 'taskTrees';
const PRIMARY_KEY = 'active-dream';

const openDatabase = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withStore = async (mode, run) => {
  const db = await openDatabase();
  try {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const result = await run(store);
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    return result;
  } finally {
    db.close();
  }
};

export const saveTaskTree = async (payload) =>
  withStore('readwrite', (store) => {
    store.put({
      key: PRIMARY_KEY,
      updatedAt: Date.now(),
      payload,
    });
  });

export const loadTaskTree = async () =>
  withStore('readonly', (store) =>
    new Promise((resolve, reject) => {
      const request = store.get(PRIMARY_KEY);
      request.onsuccess = () => resolve(request.result?.payload ?? null);
      request.onerror = () => reject(request.error);
    }),
  );
