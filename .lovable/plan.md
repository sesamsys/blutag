## Why

Bluesky raised the per-image blob limit from 1MB → 2MB in April 2026 ([atproto discussion #4832](https://github.com/bluesky-social/atproto/discussions/4832)). Our current `BLUESKY_IMAGE_MAX_BYTES = 1_000_000` and `BLUESKY_IMAGE_MAX_DIMENSION = 2048` were tuned for the old limit and are now unnecessarily aggressive — users get visibly softer photos than the network allows. The same blob limit applies to both `app.bsky.embed.images` and the new `app.bsky.embed.gallery`, so a single shared constant is enough.

## Changes

### `src/lib/constants.ts`
- `BLUESKY_IMAGE_MAX_BYTES`: `1_000_000` → `2_000_000`, comment updated to "2 MB (Bluesky lexicon limit, raised Apr 2026)".
- `BLUESKY_IMAGE_MAX_DIMENSION`: `2048` → `2560`.
- Leave JPEG quality knobs untouched — the iterative compressor will now usually settle at the initial 0.80 quality with the larger byte budget.

### `src/lib/image-compress.ts`
- Update the JSDoc on `compressImageForBluesky` from "≤ 1 MB" to "≤ 2 MB".
- No logic changes — it already reads from constants.

### Tests
- Search `src/` for any tests that hard-code `1_000_000`, `1000000`, `1 MB`, `2048`, or call `compressImageForBluesky` with size assertions. Update assertions to the new values. If no tests reference these directly, no change needed.

### Docs
- `CHANGELOG.md`: add under `[Unreleased]`:
  ```
  ### Changed
  - Raised Bluesky image compression cap from 1MB to 2MB and max dimension from 2048px to 2560px to match Bluesky's April 2026 lexicon update (better photo quality, fewer compression artifacts)
  ```
- `.lovable/plan.md`: add a short entry if it tracks active work.

### Memory
- Update `mem://processing/image-compression` to read "max 2560px, JPEG compression under 2MB".
- Update the index.md one-liner for that memory accordingly.

## Out of scope

- Per-embed-type byte limits (single shared constant is sufficient today).
- Raising `MAX_FILE_SIZE_MB` (the 25MB upload cap) — already generous.
- Changing JPEG quality floor/step.
- Edge function or backend changes — compression is fully client-side.

## Verification

- `bun run test` passes.
- Manual: upload a large (>5MB) photo, post it via gallery, confirm the resulting blob in the network tab is ≤ 2,000,000 bytes and visibly sharper than before.
