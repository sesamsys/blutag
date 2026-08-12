import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { compressImageForBluesky } from "./image-compress";
import {
  BLUESKY_IMAGE_MAX_BYTES,
  BLUESKY_IMAGE_MAX_DIMENSION,
} from "./constants";

// ---------------------------------------------------------------------------
// Canvas / Image stubs
// jsdom does not implement HTMLCanvasElement.toBlob or the 2d drawing API,
// and its Image constructor does not fire load/error events. We stub both.
// ---------------------------------------------------------------------------

/** Captured toBlob quality values so tests can inspect the iteration. */
let toBlobCalls: number[] = [];

function makeBlob(size: number): Blob {
  return new Blob([new Uint8Array(size)], { type: "image/jpeg" });
}

function setupCanvasMock(blobSizeForQuality: (quality: number) => number) {
  toBlobCalls = [];
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag !== "canvas") {
      // Let non-canvas elements fall through to the real implementation.
      vi.restoreAllMocks();
      const el = document.createElement(tag);
      // Re-install the spy for subsequent calls.
      setupCanvasMock(blobSizeForQuality);
      return el;
    }

    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: vi.fn() }),
      toBlob: (cb: (b: Blob | null) => void, _type: string, quality: number) => {
        toBlobCalls.push(quality);
        cb(makeBlob(blobSizeForQuality(quality)));
      },
    } as unknown as HTMLCanvasElement;
    return canvas;
  });
}

/**
 * Installs a global Image constructor whose load/error events fire
 * synchronously when `src` is assigned, so the promise in loadImage()
 * settles within the same microtask queue flush.
 */
function setupImageMock(naturalWidth: number, naturalHeight: number, fail = false) {
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:mock"),
    revokeObjectURL: vi.fn(),
  });

  // We use Object.defineProperty so the setter fires even though the Image
  // constructor sets `src` directly as a property assignment.
  vi.stubGlobal("Image", function (this: {
    onload: (() => void) | null;
    onerror: ((e: unknown) => void) | null;
    naturalWidth: number;
    naturalHeight: number;
    width: number;
    height: number;
    _src: string;
  }) {
    this.onload = null;
    this.onerror = null;
    this.naturalWidth = naturalWidth;
    this.naturalHeight = naturalHeight;
    this.width = naturalWidth;
    this.height = naturalHeight;
    this._src = "";

    Object.defineProperty(this, "src", {
      get: () => this._src,
      set: (value: string) => {
        this._src = value;
        // Use queueMicrotask so handlers have a chance to be assigned first,
        // mirroring real browser behaviour.
        queueMicrotask(() => {
          if (fail) {
            this.onerror?.(new Event("error"));
          } else {
            this.onload?.();
          }
        });
      },
    });
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("compressImageForBluesky", () => {
  it("returns blob, width and height for a normal image", async () => {
    setupImageMock(800, 600);
    setupCanvasMock(() => 100); // tiny blob, always fits

    const file = new File([""], "photo.jpg", { type: "image/jpeg" });
    const result = await compressImageForBluesky(file);

    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it("does not resize images within the dimension limit", async () => {
    setupImageMock(1000, 800);
    setupCanvasMock(() => 100);

    const file = new File([""], "photo.jpg", { type: "image/jpeg" });
    const result = await compressImageForBluesky(file);

    expect(result.width).toBe(1000);
    expect(result.height).toBe(800);
  });

  it("scales down a landscape image that exceeds max dimension", async () => {
    const bigW = BLUESKY_IMAGE_MAX_DIMENSION + 1000;
    const bigH = 1440;
    setupImageMock(bigW, bigH);
    setupCanvasMock(() => 100);

    const file = new File([""], "photo.jpg", { type: "image/jpeg" });
    const result = await compressImageForBluesky(file);

    expect(result.width).toBe(BLUESKY_IMAGE_MAX_DIMENSION);
    expect(result.height).toBe(Math.round((bigH / bigW) * BLUESKY_IMAGE_MAX_DIMENSION));
  });

  it("scales down a portrait image that exceeds max dimension", async () => {
    const bigH = BLUESKY_IMAGE_MAX_DIMENSION + 500;
    const bigW = 1080;
    setupImageMock(bigW, bigH);
    setupCanvasMock(() => 100);

    const file = new File([""], "photo.jpg", { type: "image/jpeg" });
    const result = await compressImageForBluesky(file);

    expect(result.height).toBe(BLUESKY_IMAGE_MAX_DIMENSION);
    expect(result.width).toBe(Math.round((bigW / bigH) * BLUESKY_IMAGE_MAX_DIMENSION));
  });

  it("reduces quality iteratively until blob fits within size limit", async () => {
    setupImageMock(800, 600);
    // Over-limit for first two calls, fits on the third.
    let call = 0;
    setupCanvasMock(() => {
      call++;
      return call < 3 ? BLUESKY_IMAGE_MAX_BYTES + 1 : 100;
    });

    const file = new File([""], "photo.jpg", { type: "image/jpeg" });
    const result = await compressImageForBluesky(file);

    expect(toBlobCalls.length).toBeGreaterThanOrEqual(3);
    expect(toBlobCalls[1]).toBeLessThan(toBlobCalls[0]);
    expect(result.blob.size).toBe(100);
  });

  it("returns the blob at minimum quality when all iterations are over-limit", async () => {
    setupImageMock(800, 600);
    // Always over the size limit — falls through to the minimum-quality fallback.
    setupCanvasMock(() => BLUESKY_IMAGE_MAX_BYTES + 1);

    const file = new File([""], "photo.jpg", { type: "image/jpeg" });
    const result = await compressImageForBluesky(file);

    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it("rejects and revokes the object URL when the image fails to load", async () => {
    setupImageMock(0, 0, /* fail= */ true);
    setupCanvasMock(() => 100);

    const file = new File([""], "corrupt.jpg", { type: "image/jpeg" });
    await expect(compressImageForBluesky(file)).rejects.toBeDefined();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });
});
