import type { BlobRef } from "@atproto/api";
import {
  BLUESKY_GALLERY_ENABLED,
  BLUESKY_IMAGES_EMBED_MAX,
} from "@/lib/constants";

export interface EmbeddedImage {
  alt: string;
  image: BlobRef;
  aspectRatio?: { width: number; height: number };
}

export type PostEmbed =
  | {
      $type: "app.bsky.embed.images";
      images: EmbeddedImage[];
    }
  | {
      $type: "app.bsky.embed.gallery";
      items: EmbeddedImage[];
    };

/**
 * Build the appropriate Bluesky post embed for the given images.
 *
 * - 0 images → `null` (caller should omit the `embed` field).
 * - 1–4 images → `app.bsky.embed.images` (the original lexicon).
 * - 5+ images → `app.bsky.embed.gallery` (new lexicon, up to 10).
 *
 * When `BLUESKY_GALLERY_ENABLED` is false, images beyond the legacy cap are
 * dropped and the legacy embed is used so the post still succeeds.
 *
 * See: https://github.com/bluesky-social/atproto/discussions/5032
 */
export function buildPostEmbed(images: EmbeddedImage[]): PostEmbed | null {
  if (images.length === 0) return null;

  if (images.length <= BLUESKY_IMAGES_EMBED_MAX || !BLUESKY_GALLERY_ENABLED) {
    return {
      $type: "app.bsky.embed.images",
      images: images.slice(0, BLUESKY_IMAGES_EMBED_MAX),
    };
  }

  return {
    $type: "app.bsky.embed.gallery",
    items: images.map((img) => ({
      image: img.image,
      alt: img.alt,
      ...(img.aspectRatio ? { aspectRatio: img.aspectRatio } : {}),
    })),
  };
}
