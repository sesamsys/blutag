import { BLUESKY_POST_MAX_LENGTH, MAX_ALT_TEXT_LENGTH } from "@/lib/constants";
import type { PhotoFile } from "@/types/photo";

/**
 * Checks a post draft before anything is uploaded. Returns the user-facing
 * reason the post can't be sent, or null when it is ready to post.
 */
export function validatePostDraft(text: string, photos: readonly PhotoFile[]): string | null {
  if (text.length > BLUESKY_POST_MAX_LENGTH) {
    return `Post text exceeds ${BLUESKY_POST_MAX_LENGTH} character limit`;
  }
  if (photos.length === 0) return "No photos with alt text to post";
  const invalid = photos.find(
    (p) => !p.altText || p.altText.length === 0 || p.altText.length > MAX_ALT_TEXT_LENGTH,
  );
  if (invalid) return `All photos must have alt text (max ${MAX_ALT_TEXT_LENGTH} characters)`;
  return null;
}

/** Characters left before the Bluesky post limit (negative when over). */
export function remainingPostCharacters(text: string): number {
  return BLUESKY_POST_MAX_LENGTH - text.length;
}
