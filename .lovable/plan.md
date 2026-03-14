

## Plan: Improve AT Protocol Type Safety

### Problem
Two `as any` assertions undermine strict TypeScript:
1. **`BlueskyAuthContext.tsx:39`** — `establishSession` param typed as `any` instead of `OAuthSession`
2. **`PostComposer.tsx:92`** — blob ref accessed via `(blob as any).ref.$link` instead of using `BlobRef` type

### Changes

**1. `src/contexts/BlueskyAuthContext.tsx`**
- Import `OAuthSession` from `@atproto/oauth-client-browser`
- Type `establishSession` parameter as `OAuthSession` instead of `any`
- Remove `as any` cast at the `client.init()` call site (line 75)

**2. `src/components/PostComposer.tsx`**
- Import `BlobRef` from `@atproto/api`
- Replace the inline `image` type in `embeddedImages` with a proper type using `BlobRef`
- Access `blob.ref` directly (it's a `BlobRef` which has a `$link` property via its `ref` CID) — replace `(blob as any).ref.$link` with proper typed access using `blob.ref.toString()` or the BlobRef's typed properties

### Scope
- Two files, ~5 lines each
- No runtime behavior change — purely type-level improvements

