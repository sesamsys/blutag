import { describe, it, expect, vi, afterEach } from "vitest";
import { buildPostEmbed, type EmbeddedImage } from "./bluesky-embed";

const fakeBlob = { $type: "blob" } as unknown as EmbeddedImage["image"];

const makeImages = (n: number): EmbeddedImage[] =>
  Array.from({ length: n }, (_, i) => ({
    alt: `alt ${i}`,
    image: fakeBlob,
  }));

describe("buildPostEmbed", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null embed for 0 images", () => {
    const { embed, truncatedCount } = buildPostEmbed([]);
    expect(embed).toBeNull();
    expect(truncatedCount).toBe(0);
  });

  it.each([1, 2, 3, 4])("uses images embed for %i image(s)", (n) => {
    const { embed, truncatedCount } = buildPostEmbed(makeImages(n));
    expect(embed?.$type).toBe("app.bsky.embed.images");
    if (embed?.$type === "app.bsky.embed.images") {
      expect(embed.images).toHaveLength(n);
    }
    expect(truncatedCount).toBe(0);
  });

  it.each([5, 7, 10])("uses gallery embed for %i images (gallery enabled)", (n) => {
    const { embed, truncatedCount } = buildPostEmbed(makeImages(n), true);
    expect(embed?.$type).toBe("app.bsky.embed.gallery");
    if (embed?.$type === "app.bsky.embed.gallery") {
      expect(embed.items).toHaveLength(n);
      expect(embed.items[0]).toHaveProperty("alt");
      expect(embed.items[0]).toHaveProperty("image");
    }
    expect(truncatedCount).toBe(0);
  });

  describe("gallery disabled (rollback path)", () => {
    it("truncates to 4 and returns truncatedCount when gallery is disabled", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { embed, truncatedCount } = buildPostEmbed(makeImages(7), false);

      expect(embed?.$type).toBe("app.bsky.embed.images");
      if (embed?.$type === "app.bsky.embed.images") {
        expect(embed.images).toHaveLength(4);
      }
      expect(truncatedCount).toBe(3);
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy.mock.calls[0][0]).toMatch(/3 photo\(s\)/);
    });

    it("does not warn or truncate when gallery is disabled but ≤4 images", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { embed, truncatedCount } = buildPostEmbed(makeImages(4), false);

      expect(embed?.$type).toBe("app.bsky.embed.images");
      if (embed?.$type === "app.bsky.embed.images") {
        expect(embed.images).toHaveLength(4);
      }
      expect(truncatedCount).toBe(0);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it.each([5, 10])(
      "truncatedCount equals (n - 4) for %i images when gallery disabled",
      (n) => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        const { truncatedCount } = buildPostEmbed(makeImages(n), false);
        expect(truncatedCount).toBe(n - 4);
      },
    );
  });
});
