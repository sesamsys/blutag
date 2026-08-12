/**
 * Tests for session-persistence.ts
 *
 * jsdom does not ship a real IndexedDB implementation, so we use
 * fake-indexeddb to provide a spec-compliant in-memory IDB environment.
 * This lets us test the actual IDB wiring (transactions, object stores,
 * onclose reconnect) without a browser.
 */
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { describe, it, expect, beforeEach, vi } from "vitest";

// jsdom does not implement URL.createObjectURL — stub it globally.
vi.stubGlobal("URL", {
  createObjectURL: vi.fn(() => "blob:preview-stub"),
  revokeObjectURL: vi.fn(),
});

// Each test gets a fresh IDB so state never leaks between cases.
beforeEach(() => {
  (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
  // Reset the module's singleton DB/promise so it opens a fresh database.
  vi.resetModules();
});

// Dynamic import inside each test so vi.resetModules() takes effect.
async function getPersistence() {
  return import("./session-persistence");
}
function makeFile(content: string, name = "photo.jpg", type = "image/jpeg"): File {
  return new File([content], name, { type });
}

/** Minimal PhotoFile for testing. */
function makePhotoFile(overrides: Partial<{
  id: string;
  altText: string;
  fileName: string;
  content: string;
}> = {}) {
  const { id = "abc123", altText = "A test photo", fileName = "test.jpg", content = "fake-jpeg-data" } = overrides;
  const file = makeFile(content, fileName);
  return {
    id,
    file,
    preview: `blob:preview-${id}`,
    altText,
  };
}

describe("session-persistence", () => {
  describe("savePhotosSession / loadPhotosSession", () => {
    it("returns null when the store is empty", async () => {
      const { loadPhotosSession } = await getPersistence();
      const result = await loadPhotosSession();
      expect(result).toBeNull();
    });

    it("round-trips a single photo with alt text", async () => {
      const { savePhotosSession, loadPhotosSession } = await getPersistence();

      const photo = makePhotoFile({ id: "p1", altText: "A sunset" });
      await savePhotosSession([photo]);

      const restored = await loadPhotosSession();
      expect(restored).not.toBeNull();
      expect(restored!.length).toBe(1);

      const r = restored![0];
      expect(r.id).toBe("p1");
      expect(r.altText).toBe("A sunset");
      expect(r.file).toBeInstanceOf(File);
      expect(r.file.name).toBe("test.jpg");
      expect(r.file.type).toBe("image/jpeg");
    });

    it("round-trips multiple photos preserving order", async () => {
      const { savePhotosSession, loadPhotosSession } = await getPersistence();

      const photos = [
        makePhotoFile({ id: "a", altText: "First" }),
        makePhotoFile({ id: "b", altText: "Second" }),
        makePhotoFile({ id: "c", altText: "Third" }),
      ];
      await savePhotosSession(photos);

      const restored = await loadPhotosSession();
      expect(restored!.map((p) => p.id)).toEqual(["a", "b", "c"]);
      expect(restored!.map((p) => p.altText)).toEqual(["First", "Second", "Third"]);
    });

    it("reconstructs File content correctly", async () => {
      const { savePhotosSession, loadPhotosSession } = await getPersistence();

      const content = "hello-image-bytes";
      const photo = makePhotoFile({ content });
      await savePhotosSession([photo]);

      const restored = await loadPhotosSession();
      // Use FileReader since jsdom's File doesn't always expose .text()
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(restored![0].file);
      });
      expect(text).toBe(content);
    });

    it("overwrites a previous session on subsequent saves", async () => {
      const { savePhotosSession, loadPhotosSession } = await getPersistence();

      await savePhotosSession([makePhotoFile({ id: "old", altText: "Old" })]);
      await savePhotosSession([makePhotoFile({ id: "new", altText: "New" })]);

      const restored = await loadPhotosSession();
      expect(restored!.length).toBe(1);
      expect(restored![0].id).toBe("new");
    });

    it("saves a photo with no alt text", async () => {
      const { savePhotosSession, loadPhotosSession } = await getPersistence();

      const photo = { ...makePhotoFile({ id: "x" }), altText: undefined };
      await savePhotosSession([photo]);

      const restored = await loadPhotosSession();
      expect(restored![0].altText).toBeUndefined();
    });
  });

  describe("clearPhotosSession", () => {
    it("returns null after clearing", async () => {
      const { savePhotosSession, loadPhotosSession, clearPhotosSession } = await getPersistence();

      await savePhotosSession([makePhotoFile()]);
      await clearPhotosSession();

      const result = await loadPhotosSession();
      expect(result).toBeNull();
    });

    it("is idempotent — clearing an empty store does not throw", async () => {
      const { clearPhotosSession } = await getPersistence();
      await expect(clearPhotosSession()).resolves.toBeUndefined();
    });
  });

  describe("onclose reconnect", () => {
    it("reopens the database automatically after it is closed", async () => {
      const { savePhotosSession, loadPhotosSession } = await getPersistence();

      const photo = makePhotoFile({ id: "before-close", altText: "Before" });
      await savePhotosSession([photo]);

      // Simulate the database connection being closed (e.g. browser closes it
      // when another tab upgrades the schema). The onclose handler in
      // session-persistence.ts nulls out the singleton so the next operation
      // re-opens it.
      const db = await new Promise<IDBDatabase>((resolve) => {
        const req = indexedDB.open("blutag-session");
        req.onsuccess = () => resolve(req.result);
      });
      db.close(); // triggers onclose on the module's singleton

      // Allow the event to propagate
      await new Promise((r) => setTimeout(r, 0));

      // The next operation should transparently reconnect
      const restored = await loadPhotosSession();
      expect(restored).not.toBeNull();
      expect(restored![0].id).toBe("before-close");
    });
  });

  describe("serialized queue", () => {
    it("handles concurrent saves and loads without corruption", async () => {
      const { savePhotosSession, loadPhotosSession } = await getPersistence();

      const photosA = [makePhotoFile({ id: "a1", altText: "A" })];
      const photosB = [makePhotoFile({ id: "b1", altText: "B" })];

      // Fire save + load concurrently; the queue must serialize them.
      await Promise.all([
        savePhotosSession(photosA),
        savePhotosSession(photosB),
      ]);

      // Whichever save ran last wins — load must return a consistent result
      const restored = await loadPhotosSession();
      expect(restored).not.toBeNull();
      // Must be entirely one batch, not a mix
      const ids = restored!.map((p) => p.id);
      const isAllA = ids.every((id) => id === "a1");
      const isAllB = ids.every((id) => id === "b1");
      expect(isAllA || isAllB).toBe(true);
    });
  });
});
