# Steering Files Review

**Status:** Reviewed  
**Date:** 2026-03-13

## Overview

Review of the 7 steering files in `.kiro/steering/` to align future development with established project standards.

## Steering Files Summary

| File | Purpose |
|------|---------|
| `project-overview.md` | Project purpose, tech stack, architecture, target users |
| `development-standards.md` | Code style, naming, error handling, security practices |
| `documentation.md` | Where and how to document (constants in `/src/data`, docs in `/docs`) |
| `api-integration.md` | Edge function structure, AT Protocol flow, AI gateway usage |
| `ui-ux-guidelines.md` | shadcn-ui patterns, responsive design, accessibility |
| `accessibility-alt-text.md` | Alt text generation principles, prompt engineering, testing |
| `testing-deployment.md` | Vitest/Playwright setup, Lovable platform deployment |

## Key Architectural Decisions

- **Single-page app** with 3 Edge Functions: `bsky-login`, `analyze-photo`, `bsky-post`
- **AI model**: Lovable AI Gateway → `google/gemini-2.5-flash`
- **No server-side image storage** — privacy by design
- **sessionStorage** for JWT tokens (cleared on browser close)
- **App passwords only** — never main Bluesky passwords

## Critical Constants (`src/lib/constants.ts`)

| Constant | Value | Notes |
|----------|-------|-------|
| `MAX_PHOTOS` | 4 | Per session |
| `MAX_FILE_SIZE_MB` | 25 | Per photo |
| `MAX_ALT_TEXT_LENGTH` | 2000 | Bluesky limit |
| `BLUESKY_POST_MAX_LENGTH` | 300 | Character limit |
| `BLUESKY_IMAGE_MAX_BYTES` | 1,000,000 | 1 MB upload limit |
| `BLUESKY_IMAGE_MAX_DIMENSION` | 2048 | Longest edge px |

## File Organization Conventions

- **Components**: `/src/components/` — PascalCase
- **Hooks**: `/src/hooks/` — `use-` prefix, kebab-case
- **Types**: `/src/types/` — descriptive names
- **Utilities**: `/src/lib/` — kebab-case
- **Constants**: `/src/lib/constants.ts`
- **Contexts**: `/src/contexts/` — PascalCase with `Context` suffix

## Design System Rules

- Use shadcn-ui + Tailwind semantic tokens (never raw colors in components)
- HSL color values via CSS custom properties
- WCAG AA contrast required
- Mobile-first responsive design
- Min 44px touch targets
