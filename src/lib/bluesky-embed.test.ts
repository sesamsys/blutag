import { describe, it, expect } from "vitest";
import { buildPostEmbed, type EmbeddedImage } from "./bluesky-embed";

const fakeBlob = { $type: "blob" } as unknown as EmbeddedImage["image"];

const makeImages = (n: number): EmbeddedImage[] =>
  Array.from({ length: n }, (_, i) => ({
    alt: `alt ${i}`,
    image: fakeBlob,
  }));

describe("buildPostEmbed", () => {
  it("returns null for 0 images", () => {
    expect(buildPostEmbed([])).toBeNull();
  });

  it.each([1, 2, 3, 4])("uses images embed for %i image(s)", (n) => {
    const embed = buildPostEmbed(makeImages(n));
    expect(embed?.$type).toBe("app.bsky.embed.images");
    if (embed?.$type === "app.bsky.embed.images") {
      expect(embed.images).toHaveLength(n);
    }
  });

  it.each([5, 7, 10])("uses gallery embed for %i images", (n) => {
    const embed = buildPostEmbed(makeImages(n));
    expect(embed?.$type).toBe("app.bsky.embed.gallery");
    if (embed?.$type === "app.bsky.embed.gallery") {
      expect(embed.items).toHaveLength(n);
      expect(embed.items[0]).toHaveProperty("alt");
      expect(embed.items[0]).toHaveProperty("image");
    }
  });
});
