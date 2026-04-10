# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed
- Standardized all documentation to reference Bun (`bun run dev`, `bun run test`, `bun.lock`)
- Replaced "Supabase dashboard" references with "Lovable Cloud" in steering docs

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
