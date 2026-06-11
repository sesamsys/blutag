import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PostComposer from "./PostComposer";
import type { PhotoFile } from "@/types/photo";

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

vi.mock("@/lib/image-compress", () => ({
  compressImageForBluesky: vi.fn(async (file: File) => file),
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

// ── Helpers ───────────────────────────────────────────────────────────

function makePhotos(n: number): PhotoFile[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `photo-${i}`,
    file: new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], `p${i}.jpg`, {
      type: "image/jpeg",
    }),
    preview: `blob:fake/${i}`,
    altText: `Alt text for photo ${i}`,
    analyzing: false,
  }));
}

async function postAndGetEmbed(photoCount: number) {
  render(<PostComposer photos={makePhotos(photoCount)} />);
  fireEvent.click(screen.getByRole("button", { name: /post to bluesky/i }));
  await waitFor(() => expect(createRecord).toHaveBeenCalled());
  const call = createRecord.mock.calls[0] as unknown as [
    { record: { embed?: { $type: string; images?: unknown[]; items?: unknown[] } } }
  ];
  return call[0].record.embed;
}

// ── Tests ─────────────────────────────────────────────────────────────

describe("PostComposer → Bluesky embed selection", () => {
  beforeEach(() => {
    createRecord.mockClear();
    uploadBlob.mockClear();
  });

  it("uses app.bsky.embed.images for 4 photos", async () => {
    const embed = await postAndGetEmbed(4);
    expect(embed?.$type).toBe("app.bsky.embed.images");
    expect(embed?.images).toHaveLength(4);
    expect(uploadBlob).toHaveBeenCalledTimes(4);
  });

  it("uses app.bsky.embed.gallery for 5 photos", async () => {
    const embed = await postAndGetEmbed(5);
    expect(embed?.$type).toBe("app.bsky.embed.gallery");
    expect(embed?.items).toHaveLength(5);
    expect(uploadBlob).toHaveBeenCalledTimes(5);
  });

  it("uses app.bsky.embed.gallery for 10 photos", async () => {
    const embed = await postAndGetEmbed(10);
    expect(embed?.$type).toBe("app.bsky.embed.gallery");
    expect(embed?.items).toHaveLength(10);
    expect(uploadBlob).toHaveBeenCalledTimes(10);
  });
});
