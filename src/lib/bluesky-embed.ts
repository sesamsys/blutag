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

export interface BuildPostEmbedResult {
  embed: PostEmbed | null;
  /**
   * Number of images that were silently dropped because `BLUESKY_GALLERY_ENABLED`
   * is false and the input exceeded the legacy cap. Zero in all other cases.
   */
  truncatedCount: number;
}

/**
 * Build the appropriate Bluesky post embed for the given images.
 *
 * - 0 images → `null` (caller should omit the `embed` field).
 * - 1–4 images → `app.bsky.embed.images` (the original lexicon).
 * - 5+ images → `app.bsky.embed.gallery` (new lexicon, up to 10).
 *
 * When `galleryEnabled` is false (defaults to the `BLUESKY_GALLERY_ENABLED`
 * feature flag), images beyond the legacy cap are dropped so the post still
 * succeeds. The caller should surface `truncatedCount > 0` to the user.
 *
 * See: https://github.com/bluesky-social/atproto/discussions/5032
 */
export function buildPostEmbed(
  images: EmbeddedImage[],
  galleryEnabled = BLUESKY_GALLERY_ENABLED,
): BuildPostEmbedResult {
  if (images.length === 0) return { embed: null, truncatedCount: 0 };

  if (images.length <= BLUESKY_IMAGES_EMBED_MAX || !galleryEnabled) {
    const kept = images.slice(0, BLUESKY_IMAGES_EMBED_MAX);
    const truncatedCount = images.length - kept.length;

    if (truncatedCount > 0) {
      console.warn(
        `[bluesky-embed] Gallery embed is disabled. ${truncatedCount} photo(s) beyond the ` +
          `${BLUESKY_IMAGES_EMBED_MAX}-image legacy cap were dropped from the post.`,
      );
    }

    return {
      embed: {
        $type: "app.bsky.embed.images",
        images: kept,
      },
      truncatedCount,
    };
  }

  return {
    embed: {
      $type: "app.bsky.embed.gallery",
      items: images.map((img) => ({
        image: img.image,
        alt: img.alt,
        ...(img.aspectRatio ? { aspectRatio: img.aspectRatio } : {}),
      })),
    },
    truncatedCount: 0,
  };
}
