# Plan: Bluesky Login & Post Integration

**Status:** Implemented  
**Date:** 2026-03-13

## Overview

Add Bluesky authentication (via AT Protocol app passwords) and a "Post to Bluesky" flow that uploads compressed images with alt text directly to the user's Bluesky account.

## Architecture

```text
┌─────────────────────────────────────────────┐
│  Frontend (React)                           │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │ Login Modal  │  │ Post Composer        │  │
│  │ handle +     │  │ text (300 chars)     │  │
│  │ app password │  │ + "Post to Bluesky"  │  │
│  └──────┬───────┘  └──────────┬───────────┘  │
│         │                     │              │
│  Client-side image resize/compress (canvas)  │
│         │                     │              │
└─────────┼─────────────────────┼──────────────┘
          │                     │
          ▼                     ▼
┌─────────────────────────────────────────────┐
│  Edge Functions                             │
│  ┌──────────────┐  ┌─────────────────────┐  │
│  │ bsky-login   │  │ bsky-post           │  │
│  │ createSession│  │ uploadBlob (×N)     │  │
│  │ → JWT tokens │  │ createRecord        │  │
│  └──────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Key Design Decisions

- **No stored credentials on server.** Session tokens (JWT) are kept in browser memory/sessionStorage only.
- **App passwords, not main passwords.** The login UI instructs users to create a Bluesky App Password.
- **Client-side image compression.** Images resized (max 2048px longest edge) and re-encoded to JPEG ≤1MB using Canvas.

## Files Created/Modified

### New files

- `src/lib/constants.ts` — Bluesky constants (post length, image limits, compression settings)
- `src/lib/image-compress.ts` — Client-side image resize/compress utility
- `src/contexts/BlueskyAuthContext.tsx` — Auth context with sessionStorage persistence
- `src/components/BlueskyLoginButton.tsx` — Header login/logout button with dialog
- `src/components/PostComposer.tsx` — Post text field + "Post to Bluesky" button
- `supabase/functions/bsky-login/index.ts` — Edge function proxying AT Protocol createSession
- `supabase/functions/bsky-post/index.ts` — Edge function for uploadBlob + createRecord

### Modified files

- `src/App.tsx` — Wrapped in BlueskyAuthProvider
- `src/pages/Index.tsx` — Added BlueskyLoginButton to header, PostComposer to results
- `supabase/config.toml` — Added bsky-login and bsky-post function configs

## Security Notes

- App passwords sent to edge function over HTTPS only, never stored
- JWT tokens in sessionStorage (not localStorage) — cleared when browser closes
- Edge functions proxy all AT Protocol calls (no CORS issues)
