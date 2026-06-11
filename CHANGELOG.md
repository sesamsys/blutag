# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.4.0] - 2026-06-11

### Added
- `runWithConcurrency` helper in `src/lib/concurrent.ts` with unit tests
- `ANALYSIS_CONCURRENCY` constant (default 3) capping in-flight analyze-photo requests
- Support for up to 10 photos per post using Bluesky's new `app.bsky.embed.gallery` embed (with fallback to `app.bsky.embed.images` for 1–4 photos)
- `BLUESKY_GALLERY_ENABLED` feature flag in `src/lib/constants.ts` for quick rollback if the gallery lexicon rollout slips

### Changed
- Raised Bluesky image compression cap from 1MB to 2MB and max dimension from 2048px to 2560px to match Bluesky's April 2026 lexicon update (better photo quality, fewer compression artifacts)
- Alt-text analysis now compresses each photo before base64-encoding it for the edge function, so large (>~22MB) originals no longer trip the 30MB payload cap and uplink bandwidth drops dramatically
- Analyze-photo requests are now throttled to at most 3 in flight (was: all 10 in parallel), avoiding browser uplink saturation and AI gateway pressure on full 10-photo batches
- Photo uploader grid now has two visual modes mirroring Bluesky's render: an "images embed" layout (4 large + 6 smaller slots; mobile 2-2-3-3) for 1–4 photos and the uniform "gallery" grid for 5–10 photos
- Gallery-mode photos now show a small numbered badge (top-left circle) indicating their position in the sequence, matching Bluesky's gallery carousel numbering
- Raised `MAX_PHOTOS` from 4 to 10
- Uploader grid is now 3 cols on mobile, 4 on sm, 5 on md+ to fit 10 slots
- `buildPostEmbed` now returns `{ embed, truncatedCount }` so callers can surface when photos are dropped
- Bumped client rate limit from 10 to 20 calls/min so a full 10-photo session doesn't trip the limiter
- Standardized all documentation to reference Bun (`bun run dev`, `bun run test`, `bun.lock`)
- Replaced "Supabase dashboard" references with "Lovable Cloud" in steering docs
- `PostComposer` now shows a toast warning when photos exceed the limit and are truncated before posting





## [0.4.0] - 2026-06-11

### Added
- Support for up to 10 photos per post using Bluesky's new `app.bsky.embed.gallery` embed (with fallback to `app.bsky.embed.images` for 1–4 photos)
- `BLUESKY_GALLERY_ENABLED` feature flag in `src/lib/constants.ts` for quick rollback if the gallery lexicon rollout slips

### Changed
- Raised `MAX_PHOTOS` from 4 to 10
- Uploader grid is now 3 cols on mobile, 4 on sm, 5 on md+ to fit 10 slots
- `buildPostEmbed` now returns `{ embed, truncatedCount }` so callers can surface when photos are dropped
- Bumped client rate limit from 10 to 20 calls/min so a full 10-photo session doesn't trip the limiter
- Standardized all documentation to reference Bun (`bun run dev`, `bun run test`, `bun.lock`)
- Replaced "Supabase dashboard" references with "Lovable Cloud" in steering docs
- `PostComposer` now shows a toast warning when photos exceed the limit and are truncated before posting

## [0.3.0] - 2026-03-14

### Added
- Draggable photo grid reordering with `@dnd-kit` (smooth CSS transform animations)
- `SortablePhotoItem` component for sortable photo cells

### Fixed
- Photo duplication when dragging (native drag event conflict)
- Thumbnails disappearing on second drag (ObjectURL cleanup timing)
- Remove button triggering drag (pointer event isolation)

### Changed
- Improved AT Protocol type safety — replaced `as any` casts with proper `OAuthSession` and `BlobRef` types

## [0.2.0] - 2026-03-13

### Added
- Bluesky OAuth login via `@atproto/oauth-client-browser` (replaced app password flow)
- OAuth callback page (`/oauth/callback`)
- DPoP-bound token security (prevents replay attacks)
- AI transparency & privacy disclosure dialog ("About & Privacy")
- Production readiness infrastructure: error handling utilities, rate limiter, retry logic, input validation
- Unit tests for error messages, rate limiter, and retry utilities
- `ErrorBoundary` component for graceful crash recovery

### Changed
- Authentication refactored from edge-function-proxied app passwords to client-side OAuth
- Posts and blob uploads now go directly to Bluesky PDS via authenticated Agent

### Removed
- `bsky-login` and `bsky-post` edge functions (no longer needed with client-side OAuth)

### Security
- No passwords or app passwords ever enter the application
- Tokens stored in IndexedDB (managed by OAuth client), not localStorage
- Automatic token refresh handled by library

## [0.1.0] - 2026-03-13

### Added
- Initial photo upload and alt text generation workflow
- Bluesky login via AT Protocol app passwords (edge functions)
- AI-powered alt text generation using Lovable AI Gateway (Google Gemini)
- Client-side image compression (max 2048px, JPEG ≤1MB)
- EXIF metadata extraction for contextual alt text
- Post composer with 300-character limit and multi-image support
- shadcn/ui design system with Tailwind CSS semantic tokens
- Responsive mobile-first layout
