# Fix: landscape photos posted as square

## What's happening

Blutag never tells Bluesky the shape of the uploaded image. The embed supports an `aspectRatio` field, and `src/lib/bluesky-embed.ts` already forwards it when present — but nothing ever populates it. `PostComposer` builds each embedded image with only `alt` and `image`, because `compressImageForBluesky` returns a bare `Blob` and discards the width/height it computed while resizing.

Without `aspectRatio`, the Bluesky client can't reserve the correct box before the image loads and falls back to a square frame, which letterboxes landscape photos with top/bottom padding.

## The fix

1. Have the compression helper also report the final pixel dimensions it rendered to canvas, instead of throwing them away.
2. In `PostComposer`, attach `aspectRatio: { width, height }` to every uploaded image before building the embed.
3. Applies to both embed types — `app.bsky.embed.images` and `app.bsky.embed.gallery` both accept `aspectRatio` per image, and `buildPostEmbed` already passes it through for gallery items; the images branch needs the field kept too.

## Technical details

- `src/lib/image-compress.ts`: change `compressImageForBluesky` to return `{ blob, width, height }` (or add a sibling function returning dimensions) using the already-computed resized `width`/`height`.
- `src/components/PostComposer.tsx`: use the returned dimensions when pushing to `embeddedImages`.
- `src/pages/Index.tsx` also calls `compressImageForBluesky` before base64 for alt-text analysis — update that call site for the new return shape (it only needs `.blob`).
- `src/lib/bluesky-embed.ts`: the `app.bsky.embed.images` branch currently spreads images as-is, so `aspectRatio` already survives; verify with a test.
- Tests: extend `src/lib/bluesky-embed.test.ts` and `src/components/PostComposer.integration.test.tsx` to assert `aspectRatio` is present on each embedded image for both 4-photo (images) and 5-photo (gallery) cases.
- `CHANGELOG.md`: add a Fixed entry under `[Unreleased]`.
