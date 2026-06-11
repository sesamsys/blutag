## Goal

Make the upload grid visually mirror how Bluesky will actually render the post:
- **1–4 photos** → "images embed" mode: top row of 4 large slots + second row of 6 smaller slots (desktop). Mobile: rows of 2-2-3-3.
- **5–10 photos** → "gallery" mode: uniform square grid (current behavior).

The switch happens the moment a 5th photo is added/removed.

## Layout specs

### Desktop / tablet (≥ sm)
**Embed mode (≤4 photos):**
```text
[  L  ][  L  ][  L  ][  L  ]        ← row 1: 4 large square slots (cols-span-3 each in a 12-col grid)
[ s ][ s ][ s ][ s ][ s ][ s ]      ← row 2: 6 smaller square slots (cols-span-2 each)
```
Implementation: a single `grid-cols-12 gap-3`; large slots `col-span-3`, small slots `col-span-2`.

**Gallery mode (5–10 photos):** current `grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3` uniform layout — unchanged.

### Mobile (< sm) empty / embed mode
```text
[ L ][ L ]
[ L ][ L ]
[ s ][ s ][ s ]
[ s ][ s ][ s ]
```
Implementation: `grid-cols-6`; large slots `col-span-3`, small slots `col-span-2`. Yields 2+2+3+3 rows.

**Gallery mode on mobile:** unchanged `grid-cols-3`.

### Mode trigger
```ts
const mode = photos.length > BLUESKY_IMAGES_EMBED_MAX ? "gallery" : "embed";
```
Re-uses existing `BLUESKY_IMAGES_EMBED_MAX = 4` constant — no new magic numbers.

The split between "large" and "small" slots only matters in embed mode. In gallery mode the existing uniform `slots` array (length 10) is used as today.

## Caption / hint

Replace the current single-line helper text under the grid with a two-part caption that updates with photo count:

- Embed: `Images post · up to 4 photos shown larger`
- Gallery: `Gallery post · 5–10 photos, equal size`
- Always followed by the existing `· {MAX_FILE_SIZE_MB}MB max each · ⌘V / Ctrl+V or tap Paste` line.

Wrapped in `<p aria-live="polite">` so screen readers pick up the mode change.

## Files to change

1. **`src/components/PhotoUploader.tsx`** — only file with structural changes.
   - Compute `mode` from `photos.length`.
   - Split `slots` into `largeSlots` (first 4) and `smallSlots` (next 6) for embed mode.
   - Render two different grid containers based on `mode`. Both wrapped inside the same `DndContext` + `SortableContext` (same `sortableIds`) so drag-reorder keeps working across both modes and across the transition.
   - Empty-slot buttons keep their existing styling (rounded-2xl, dashed border, ImagePlus icon).
   - Update the helper text into the dual-caption above.
   - Keep the "Drag photos here" Caveat-font flourish for the empty state (count === 0).

2. **`CHANGELOG.md`** — `[Unreleased] / Changed` entry describing the dual-mode grid.

3. **`mem://features/photo-upload`** — append the new dual-mode behavior so future sessions know about it. Update index reference line accordingly.

No changes to: `SortablePhotoItem`, drag logic, post-time embed selection (`bluesky-embed.ts`), constants file, or backend.

## Technical notes

- Embed-mode aspect ratio: keep `aspect-square` on every slot so dnd-kit's `rectSortingStrategy` continues to work cleanly and large/small slots remain visually proportional.
- Transition: when the user drops the 5th photo, the layout swap is instantaneous (CSS grid recomposition). dnd-kit's sortable items keep their `id`s, so React's reconciler will preserve the photo DOM nodes and their object-URL previews — no flicker, no re-decoding.
- A11y: `aria-label` on the grid region updated to mention the active mode ("Images embed layout" vs "Gallery layout").
- No new dependencies. No changes to constants, validation, compression, or posting pipeline.

## Out of scope

- Changing how posts are actually published (gallery vs images lexicon selection already lives in `bluesky-embed.ts` and is unaffected).
- Animating between the two layouts (FLIP / layout transitions) — can be added later if desired.
- Changing `MAX_PHOTOS` or any limit.
