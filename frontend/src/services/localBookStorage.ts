import type { Ebook } from '../types/ebook';

const DB_NAME = 'flipbook_storage_db';
const DB_VERSION = 1;
const PDF_STORE = 'pdfs';
const META_STORE = 'ebook_metadata';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PDF_STORE)) {
        db.createObjectStore(PDF_STORE);
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const localBookStorage = {
  /**
   * Save PDF binary data and metadata into IndexedDB
   */
  async saveBook(book: Ebook, pdfSource: File | ArrayBuffer | Blob): Promise<void> {
    try {
      const db = await openDb();
      const arrayBuffer = pdfSource instanceof File || pdfSource instanceof Blob
        ? await pdfSource.arrayBuffer()
        : pdfSource;

      const tx = db.transaction([PDF_STORE, META_STORE], 'readwrite');
      const pdfStore = tx.objectStore(PDF_STORE);
      const metaStore = tx.objectStore(META_STORE);

      // Store by numeric ID and Slug
      const strId = String(book.id);
      pdfStore.put(arrayBuffer, strId);
      if (book.slug) {
        pdfStore.put(arrayBuffer, book.slug);
      }

      metaStore.put(book);

      // Also persist metadata list in localStorage for fast synchronous lookups
      const localList = localBookStorage.getLocalEbooksSync();
      const filtered = localList.filter(b => b.id !== book.id && b.slug !== book.slug);
      filtered.unshift(book);
      localStorage.setItem('ebook_local_library', JSON.stringify(filtered));

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('Failed to save book to IndexedDB:', e);
    }
  },

  /**
   * Get PDF ArrayBuffer from IndexedDB by ID or Slug
   */
  async getPdfBuffer(idOrSlug: string | number): Promise<ArrayBuffer | null> {
    try {
      const db = await openDb();
      return new Promise((resolve) => {
        const tx = db.transaction(PDF_STORE, 'readonly');
        const store = tx.objectStore(PDF_STORE);
        const req = store.get(String(idOrSlug));

        req.onsuccess = () => {
          if (req.result && req.result instanceof ArrayBuffer) {
            resolve(req.result);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },

  /**
   * Get all local ebooks metadata
   */
  getLocalEbooksSync(): Ebook[] {
    try {
      const raw = localStorage.getItem('ebook_local_library');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  },

  /**
   * Get single local ebook by ID or Slug
   */
  getLocalEbookSync(idOrSlug: string | number): Ebook | null {
    const list = localBookStorage.getLocalEbooksSync();
    const str = String(idOrSlug).toLowerCase();
    return list.find(b => String(b.id).toLowerCase() === str || (b.slug && b.slug.toLowerCase() === str)) || null;
  },

  /**
   * Delete book from IndexedDB and localStorage
   */
  async deleteBook(idOrSlug: string | number): Promise<void> {
    try {
      const str = String(idOrSlug).toLowerCase();
      const list = localBookStorage.getLocalEbooksSync();
      const target = list.find(b => String(b.id).toLowerCase() === str || (b.slug && b.slug.toLowerCase() === str));

      const keysToDelete = [str];
      if (target) {
        keysToDelete.push(String(target.id));
        if (target.slug) keysToDelete.push(target.slug);
      }

      // 1. Clean localStorage
      const filtered = list.filter(b => !keysToDelete.includes(String(b.id)) && !(b.slug && keysToDelete.includes(b.slug)));
      localStorage.setItem('ebook_local_library', JSON.stringify(filtered));

      for (const k of keysToDelete) {
        localStorage.removeItem(`ebook_reading_progress_${k}`);
        localStorage.removeItem(`ebook_bookmarks_${k}`);
        localStorage.removeItem(`ebook_interactive_elements_${k}`);
      }

      // 2. Clean IndexedDB
      const db = await openDb();
      const tx = db.transaction([PDF_STORE, META_STORE], 'readwrite');
      const pdfStore = tx.objectStore(PDF_STORE);
      const metaStore = tx.objectStore(META_STORE);

      for (const k of keysToDelete) {
        pdfStore.delete(k);
        metaStore.delete(k);
        if (target && typeof target.id === 'number') {
          metaStore.delete(target.id);
        }
      }

      return new Promise((resolve) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) {
      console.warn('Failed to delete book from local storage:', e);
    }
  },
};
