# Plan: Bluesky OAuth Login Refactor

**Status:** Implemented  
**Date:** 2026-03-13

## Overview

Refactored Bluesky authentication from app password input to AT Protocol OAuth via `@atproto/oauth-client-browser`. Users now sign in through Bluesky's official authorization page — no passwords ever enter the app.

## Architecture

```text
User clicks "Sign in with Bluesky"
  → Enters handle (e.g. alice.bsky.social)
  → Redirected to Bluesky OAuth authorization
  → Approves access
  → Redirected back to /oauth/callback
  → BrowserOAuthClient.init() processes callback
  → Session stored in IndexedDB (DPoP-bound)
  → AT Protocol API calls via Agent directly from browser
```

## Key Design Decisions

- **Client-side OAuth only.** Uses `@atproto/oauth-client-browser` — no backend needed for auth.
- **IndexedDB token storage.** Tokens stored in browser-managed IndexedDB, not localStorage.
- **DPoP-bound tokens.** Prevents token replay attacks.
- **Direct API calls.** Posts and blob uploads go directly to Bluesky PDS via authenticated Agent.
- **Sessions persist across tabs** (same origin, IndexedDB is origin-scoped).

## Files Created
- `public/oauth/client-metadata.json` — OAuth client identity for Bluesky auth server
- `src/pages/OAuthCallback.tsx` — Loading page during OAuth redirect processing

## Files Modified
- `src/contexts/BlueskyAuthContext.tsx` — Full rewrite to use BrowserOAuthClient
- `src/components/BlueskyLoginButton.tsx` — Handle input instead of password form
- `src/components/PostComposer.tsx` — Uses Agent directly for blob upload + post creation
- `src/App.tsx` — Added /oauth/callback route
- `supabase/config.toml` — Removed bsky-login, bsky-post entries

## Files Deleted
- `supabase/functions/bsky-login/index.ts` — No longer needed
- `supabase/functions/bsky-post/index.ts` — No longer needed (Agent posts directly)

## Security Properties
- No passwords or app passwords ever enter the app
- DPoP-bound access tokens (cannot be replayed)
- Automatic token refresh handled by library
- Tokens in IndexedDB (not accessible like localStorage)
