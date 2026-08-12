import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PostComposer from "./PostComposer";
import {
  BLUESKY_IMAGE_MAX_DIMENSION,
  BLUESKY_IMAGE_MAX_BYTES,
} from "@/lib/constants";
import type { PhotoFile } from "@/types/photo";

/**
 * End-to-end check that a landscape photo survives the upload pipeline with a
 * correct `aspectRatio`. Unlike PostComposer.integration.test.tsx, this suite
 * runs the REAL `compressImageForBluesky` (canvas + Image are stubbed for
 * jsdom) so a regression in the compressor's dimension reporting is caught.
 */

// ── Source image: 4000×2250 landscape (16:9) ──────────────────────────

const SOURCE_WIDTH = 4000;
const SOURCE_HEIGHT = 2250;

/** Expected post-resize dimensions: longest edge clamped to the max dimension. */
const EXPECTED_WIDTH = BLUESKY_IMAGE_MAX_DIMENSION;
const EXPECTED_HEIGHT = Math.round(
  (SOURCE_HEIGHT / SOURCE_WIDTH) * BLUESKY_IMAGE_MAX_DIMENSION,
);

// ── Mocks ─────────────────────────────────────────────────────────────

const createRecord = vi.fn(async () => ({
  data: { uri: "at://did:plc:test/app.bsky.feed.post/abc123" },
}));
const uploadBlob = vi.fn(async () => ({
  data: { blob: { $type: "blob", ref: "fake" } },
}));

const mockAgent = {
  did: "did:plc:test",
  uploadBlob,
  com: { atproto: { repo: { createRecord } } },
};

vi.mock("@/contexts/BlueskyAuthContext", () => ({
  useBlueskyAuth: () => ({ agent: mockAgent, isLoggedIn: true }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "en", setLanguage: vi.fn(), recent: [] }),
}));

vi.mock("@atproto/api", () => ({
  RichText: class {
    text: string;
    facets: unknown[] = [];
    constructor({ text }: { text: string }) {
      this.text = text;
    }
    async detectFacets() {}
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock("@/components/LanguagePicker", () => ({
  default: () => null,
}));

// ── jsdom canvas / Image stubs ────────────────────────────────────────

const originalImage = globalThis.Image;
let canvasSizes: Array<{ width: number; height: number }> = [];

function installBrowserStubs() {
  canvasSizes = [];

  // Image: resolves immediately with the landscape source dimensions.
  class StubImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    width = SOURCE_WIDTH;
    height = SOURCE_HEIGHT;
    #src = "";
    set src(value: string) {
      this.#src = value;
      queueMicrotask(() => this.onload?.());
    }
    get src() {
      return this.#src;
    }
  }
  globalThis.Image = StubImage as unknown as typeof Image;

  URL.createObjectURL = vi.fn(() => "blob:stub");
  URL.revokeObjectURL = vi.fn();

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => ({ drawImage: vi.fn() }) as unknown as CanvasRenderingContext2D,
  );

  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
  ) {
    canvasSizes.push({ width: this.width, height: this.height });
    // Well under the size cap so the first compression pass is accepted.
    callback(
      new Blob([new Uint8Array(BLUESKY_IMAGE_MAX_BYTES / 4)], {
        type: "image/jpeg",
      }),
    );
  });
}

// ── Helpers ───────────────────────────────────────────────────────────

function makeLandscapePhoto(): PhotoFile {
  return {
    id: "photo-landscape",
    file: new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], "landscape.jpg", {
      type: "image/jpeg",
    }),
    preview: "blob:fake/0",
    altText: "A car dashboard photographed from the driver's seat.",
    analyzing: false,
  };
}

interface UploadedImage {
  alt: string;
  aspectRatio?: { width: number; height: number };
}

async function postLandscapePhoto(): Promise<UploadedImage> {
  render(<PostComposer photos={[makeLandscapePhoto()]} />);
  fireEvent.click(screen.getByRole("button", { name: /post to bluesky/i }));
  await waitFor(() => expect(createRecord).toHaveBeenCalled());

  const call = createRecord.mock.calls[0] as unknown as [
    { record: { embed?: { $type: string; images?: UploadedImage[] } } },
  ];
  const embed = call[0].record.embed;
  expect(embed?.$type).toBe("app.bsky.embed.images");
  expect(embed?.images).toHaveLength(1);
  return embed!.images![0];
}

/**
 * Mimics how a feed client sizes an embed: it reserves a box using the
 * declared aspect ratio. Returns the CSS `padding-bottom` percentage the
 * client would use for a fixed-width container. 100% means a square box —
 * i.e. a letterboxed landscape photo with top/bottom padding.
 */
function reservedBoxPaddingPercent(aspectRatio?: {
  width: number;
  height: number;
}): number {
  if (!aspectRatio) return 100; // no ratio declared → square fallback
  return (aspectRatio.height / aspectRatio.width) * 100;
}

// ── Tests ─────────────────────────────────────────────────────────────

describe("PostComposer → landscape photo aspect ratio", () => {
  beforeEach(() => {
    createRecord.mockClear();
    uploadBlob.mockClear();
    installBrowserStubs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.Image = originalImage;
  });

  it("uploads the compressed blob and declares the landscape aspectRatio", async () => {
    const uploaded = await postLandscapePhoto();

    expect(uploadBlob).toHaveBeenCalledTimes(1);
    // The blob handed to uploadBlob is the compressed JPEG, not the raw File.
    const [uploadedBlob] = uploadBlob.mock.calls[0] as unknown as [Blob];
    expect(uploadedBlob).toBeInstanceOf(Blob);
    expect(uploadedBlob.size).toBeLessThanOrEqual(BLUESKY_IMAGE_MAX_BYTES);

    // Dimensions come from the real compressor's resize step.
    expect(canvasSizes[0]).toEqual({
      width: EXPECTED_WIDTH,
      height: EXPECTED_HEIGHT,
    });
    expect(uploaded.aspectRatio).toEqual({
      width: EXPECTED_WIDTH,
      height: EXPECTED_HEIGHT,
    });
  });

  it("preserves the source 16:9 ratio (no crop, no squaring)", async () => {
    const uploaded = await postLandscapePhoto();
    const declared =
      uploaded.aspectRatio!.width / uploaded.aspectRatio!.height;
    const source = SOURCE_WIDTH / SOURCE_HEIGHT;

    expect(declared).toBeCloseTo(source, 2);
    expect(declared).toBeGreaterThan(1); // still landscape
  });

  it("renders without top/bottom padding (box is not square)", async () => {
    const uploaded = await postLandscapePhoto();
    const padding = reservedBoxPaddingPercent(uploaded.aspectRatio);

    // A square box would be 100%; 16:9 reserves ~56.25%.
    expect(padding).not.toBe(100);
    expect(padding).toBeCloseTo((SOURCE_HEIGHT / SOURCE_WIDTH) * 100, 1);
    expect(padding).toBeLessThan(100);
  });
});
