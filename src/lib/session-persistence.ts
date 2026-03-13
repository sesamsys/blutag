import type { PhotoFile, ExifInfo } from "@/types/photo";

const DB_NAME = "blutag-session";
const STORE_NAME = "session";
const SESSION_KEY = "photos";

interface StoredPhoto {
  id: string;
  altText?: string;
  exifData?: ExifInfo;
  fileData: ArrayBuffer;
  fileName: string;
  fileType: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

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

export async function savePhotosSession(photos: PhotoFile[]): Promise<void> {
  try {
    const db = await openDB();
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
    db.close();
  } catch (err) {
    console.error("Failed to save session:", err);
  }
}

export async function loadPhotosSession(): Promise<PhotoFile[] | null> {
  try {
    const db = await openDB();
    const stored = await idbGet<StoredPhoto[]>(db, SESSION_KEY);
    db.close();
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
  } catch (err) {
    console.error("Failed to load session:", err);
    return null;
  }
}

export async function clearPhotosSession(): Promise<void> {
  try {
    const db = await openDB();
    await idbDelete(db, SESSION_KEY);
    db.close();
  } catch (err) {
    console.error("Failed to clear session:", err);
  }
}
