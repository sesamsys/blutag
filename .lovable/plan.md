## Context

Bluesky announced [`app.bsky.embed.gallery`](https://github.com/bluesky-social/atproto/discussions/5032) (Jun 2026) — a new embed type that supports up to 10 images (hard ceiling 20). The existing `app.bsky.embed.images` embed stays capped at 4 because bumping its `maxLength` would be a breaking lexicon change. Rollout is "in the next few weeks".

To let Blutag users post up to 10 photos, we need to (a) raise the in-app photo cap, (b) redesign the grid to fit 10 thumbnails, and (c) emit the new gallery embed when posting more than 4 photos (with a fallback to today's `images` embed for ≤4, so we keep working on AppViews that haven't ingested the new lexicon yet).

## Scope

- Raise `MAX_PHOTOS` from 4 → 10.
- Redesign the uploader grid to comfortably show up to 10 slots on mobile + desktop.
- Update post composer to use `app.bsky.embed.gallery` when posting 5–10 photos, keep `app.bsky.embed.images` for 1–4.
- Bump per-call rate limit so a full 10-photo session doesn't immediately trip the limiter.
- Keep alt-text generation, reordering, paste, session persistence, and accessibility working identically with the new cap.

Out of scope: video embeds in gallery, license/attribution/exif fields, raising past 10 toward the 20 hard limit.

## Changes

### 1. Constants (`src/lib/constants.ts`)
- `MAX_PHOTOS = 10`.
- Add `BLUESKY_GALLERY_MAX_IMAGES = 10` and `BLUESKY_IMAGES_EMBED_MAX = 4` so the embed-selection logic has named thresholds.
- Bump `RATE_LIMIT_MAX_CALLS` from 10 → 20 (one full 10-photo session is 10 calls; with retries and a quick second attempt, 10/min is too tight).

### 2. Uploader grid (`src/components/PhotoUploader.tsx`)
- Replace the fixed `grid-cols-2 sm:grid-cols-4` with a responsive layout that handles 10 slots:
  - mobile: `grid-cols-3` (4 rows: 3-3-3-1)
  - sm: `grid-cols-4` (3 rows: 4-4-2)
  - md+: `grid-cols-5` (2 rows of 5)
- Shrink the empty-state hint arrow + "Drag photos here" caption so it still fits below a taller grid on mobile.
- Update the hint copy: `Up to {MAX_PHOTOS} photos · {MAX_FILE_SIZE_MB}MB max each · ⌘V / Ctrl+V or tap Paste` (already templated on `MAX_PHOTOS`, just verify it reads naturally with "10").
- All aria-labels / live-region strings continue to interpolate `MAX_PHOTOS`; no string changes needed beyond the constant.
- Confirm dnd-kit `SortableContext` + `rectSortingStrategy` still works at 10 items (it does; just visual QA needed).

### 3. Post composer (`src/components/PostComposer.tsx`)
Switch the embed shape based on count:

```ts
if (embeddedImages.length > 0) {
  if (embeddedImages.length <= BLUESKY_IMAGES_EMBED_MAX) {
    record.embed = {
      $type: "app.bsky.embed.images",
      images: embeddedImages, // unchanged shape
    };
  } else {
    record.embed = {
      $type: "app.bsky.embed.gallery",
      items: embeddedImages.map(img => ({
        image: img.image,
        alt: img.alt,
        aspectRatio: img.aspectRatio,
      })),
    };
  }
}
```

Notes:
- `createRecord` is called with a raw record object, so we don't need `@atproto/api` typings for the new lexicon — the JSON shape is what matters.
- Final field names on `gallery` items will be confirmed against PR [#4827](https://github.com/bluesky-social/atproto/pull/4827) when we implement; the plan above is the shape implied by the announcement (image blob + alt + aspectRatio per item). If the merged lexicon uses a different field name (e.g. `media` instead of `items`), we adapt at implementation time.
- Image upload + compression (`BLUESKY_IMAGE_MAX_BYTES`, `BLUESKY_IMAGE_MAX_DIMENSION`) is per-image and unchanged — it already handles N photos via the existing loop.

### 4. Rollout safety
- Because gallery is rolling out "in the next few weeks", before shipping we'll do a one-shot manual test post with 5 photos from a real Bluesky account to confirm the lexicon is live on the PDS. If it's not yet accepted, we keep `MAX_PHOTOS = 4` behind a small `BLUESKY_GALLERY_ENABLED` flag in `constants.ts` that defaults to `true` and can be flipped off without touching components.

### 5. Tests / QA
- Unit: extend `PostComposer` logic (or extract `buildEmbed(images)` into `src/lib/bluesky-embed.ts` to make it unit-testable) — assert `images` embed for 1–4 photos, `gallery` embed for 5–10, no embed for 0.
- Manual QA:
  - Upload 10 photos via picker, drag-drop, and paste; verify grid layout on mobile (375px), tablet (768px), desktop.
  - Reorder a 10-photo grid via mouse and keyboard.
  - Generate alt text for all 10 (rate limit not tripped).
  - Post 4 photos → renders as today on bsky.app. Post 7 photos → renders as a gallery on bsky.app.
  - Session-restore a 10-photo draft after reload.

### 6. CHANGELOG
- Added: Support for up to 10 photos per post using Bluesky's new `app.bsky.embed.gallery` embed.
- Changed: Uploader grid layout to accommodate 10 slots responsively.

## Open questions

1. Should we ship behind the `BLUESKY_GALLERY_ENABLED` flag (default on) so we can quickly revert to 4 if the lexicon rollout slips, or just gate by feature detection at post time (try gallery, fall back to images on lexicon-rejection error)?
2. On mobile, do you prefer a 3-column grid (10 = 3-3-3-1, slightly ragged last row) or 2-column (10 = 5 rows, taller scroll)?