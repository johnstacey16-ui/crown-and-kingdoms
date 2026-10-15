/* Crown & Kingdoms — asynchronous IndexedDB backup for the three local save slots.
   localStorage remains the synchronous primary store for compatibility with existing saves. */
(function () {
  'use strict';
  const DB_NAME = 'ck-persistence-v1';
  const STORE_NAME = 'game-saves';
  let opening = null;

  function openDatabase() {
    if (!window.indexedDB) return Promise.resolve(null);
    if (opening) return opening;
    opening = new Promise((resolve) => {
      let request;
      try { request = window.indexedDB.open(DB_NAME, 1); }
      catch (_) { resolve(null); return; }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    }).catch(() => null);
    return opening;
  }

  function mirrorSave(key, value) {
    return openDatabase().then((db) => new Promise((resolve) => {
      if (!db) { resolve(false); return; }
      let tx;
      try {
        tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(value, key);
      } catch (_) { resolve(false); return; }
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    })).catch(() => false);
  }

  function restoreMissing() {
    return openDatabase().then((db) => new Promise((resolve) => {
      if (!db) { resolve(false); return; }
      let tx, restored = 0;
      try {
        tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return;
          const key = cursor.key;
          if (typeof key === 'string' && /^ck_save(?:[2-3])?$/.test(key)) {
            let existing = null;
            try { existing = window.localStorage.getItem(key); } catch (_) {}
            if (existing == null && typeof cursor.value === 'string') {
              try { window.localStorage.setItem(key, cursor.value); restored++; } catch (_) {}
            }
          }
          cursor.continue();
        };
        tx.oncomplete = () => resolve(restored > 0);
        tx.onerror = () => resolve(false);
        tx.onabort = () => resolve(false);
      } catch (_) { resolve(false); }
    })).catch(() => false);
  }

  window.CK_STORAGE = { mirrorSave, restoreMissing };
})();
