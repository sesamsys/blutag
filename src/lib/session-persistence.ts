import type { PhotoFile, ExifInfo } from "@/types/photo";

const DB_NAME = "blutag-session";
const STORE_NAME = "session";
const SESSION_KEY = "photos";
const DB_VERSION = 1;

interface StoredPhoto {
  id: string;
  altText?: string;
  exifData?: ExifInfo;
  fileData: ArrayBuffer;
  fileName: string;
  fileType: string;
}

// --- Singleton DB connection ---
let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => {
      dbInstance = req.result;
      dbInstance.onclose = () => { dbInstance = null; dbPromise = null; };
      resolve(dbInstance);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });

  return dbPromise;
}

// --- Serialized queue to prevent concurrent read/write races ---
let opQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = opQueue.then(fn, fn);
  // Update the queue tail; swallow errors so the queue keeps flowing
  opQueue = next.then(() => {}, () => {});
  return next;
}

// --- Low-level IDB helpers ---

function idbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function idbDelete(db: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// --- Public API (all operations are serialized through the queue) ---

export function savePhotosSession(photos: PhotoFile[]): Promise<void> {
  return enqueue(async () => {
    const db = await getDB();
    const stored: StoredPhoto[] = await Promise.all(
      photos.map(async (p) => ({
        id: p.id,
        altText: p.altText,
        exifData: p.exifData,
        fileData: await fileToArrayBuffer(p.file),
        fileName: p.file.name,
        fileType: p.file.type,
      }))
    );
    await idbPut(db, SESSION_KEY, stored);
  });
}

export function loadPhotosSession(): Promise<PhotoFile[] | null> {
  return enqueue(async () => {
    const db = await getDB();
    const stored = await idbGet<StoredPhoto[]>(db, SESSION_KEY);
    if (!stored || stored.length === 0) return null;

    return stored.map((s) => {
      const file = new File([s.fileData], s.fileName, { type: s.fileType });
      return {
        id: s.id,
        file,
        preview: URL.createObjectURL(file),
        altText: s.altText,
        exifData: s.exifData,
      };
    });
  });
}

export function clearPhotosSession(): Promise<void> {
  return enqueue(async () => {
    const db = await getDB();
    await idbDelete(db, SESSION_KEY);
  });
}
