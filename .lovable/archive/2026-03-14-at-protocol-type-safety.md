# Plan: Improve AT Protocol Type Safety

**Status:** Implemented  
**Date:** 2026-03-14

## Problem
Two `as any` assertions undermined strict TypeScript:
1. `BlueskyAuthContext.tsx` — `establishSession` param typed as `any` instead of `OAuthSession`
2. `PostComposer.tsx` — blob ref accessed via `(blob as any).ref.$link` instead of using `BlobRef` type

## Changes

### `src/contexts/BlueskyAuthContext.tsx`
- Imported `OAuthSession` from `@atproto/oauth-client-browser`
- Typed `establishSession` parameter as `OAuthSession` instead of `any`
- Removed `as any` cast at the `client.init()` call site

### `src/components/PostComposer.tsx`
- Imported `BlobRef` from `@atproto/api`
- Replaced inline image type with proper `BlobRef` type
- Used `response.data.blob` directly instead of manually reconstructing blob objects with `as any` casts

## Scope
- Two files, ~5 lines each
- No runtime behavior change — purely type-level improvements
