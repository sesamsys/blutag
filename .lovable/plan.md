

## Plan: Bluesky Login & Post Integration

### Overview

Add Bluesky authentication (via AT Protocol app passwords) and a "Post to Bluesky" flow that uploads compressed images with alt text directly to the user's Bluesky account.

### Architecture

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

### Key Design Decisions

- **No stored credentials on server.** Session tokens (JWT) are kept in browser memory/sessionStorage only. The edge functions act as a proxy so the AT Protocol calls happen server-side (avoiding CORS).
- **App passwords, not main passwords.** The login UI will clearly instruct users to create a Bluesky App Password.
- **Client-side image compression.** Before uploading, images are resized (max 2048px longest edge) and re-encoded to JPEG at quality ~0.80, targeting under 1MB. This happens in-browser using Canvas, avoiding extra server load.

### Changes

#### 1. New constants (in existing files)

**`src/lib/constants.ts`** — add:
- `BLUESKY_POST_MAX_LENGTH = 300`
- `BLUESKY_IMAGE_MAX_BYTES = 1_000_000` (1MB)
- `BLUESKY_IMAGE_MAX_DIMENSION = 2048`
- `BLUESKY_IMAGE_JPEG_QUALITY = 0.80`

#### 2. Client-side image compression utility

**`src/lib/image-compress.ts`** — new file:
- Takes a `File`, returns a `Blob` (JPEG, ≤1MB).
- Uses OffscreenCanvas or HTMLCanvasElement to resize to max 2048px and encode as JPEG.
- If first pass exceeds 1MB, iteratively reduces quality.

#### 3. Bluesky auth context

**`src/contexts/BlueskyAuthContext.tsx`** — new file:
- React context storing session state: `{ handle, did, accessJwt, refreshJwt, isLoggedIn }`.
- Persists to `sessionStorage` so it survives page refreshes but not tab closes.
- Provides `login(handle, appPassword)` and `logout()` methods.

#### 4. Two new edge functions

**`supabase/functions/bsky-login/index.ts`**:
- Accepts `{ identifier, password }`.
- Calls `https://bsky.social/xrpc/com.atproto.server.createSession`.
- Returns `{ did, handle, accessJwt, refreshJwt }`.

**`supabase/functions/bsky-post/index.ts`**:
- Accepts `{ accessJwt, did, text, images: [{ base64, mimeType, altText }] }`.
- For each image: calls `com.atproto.repo.uploadBlob` with the binary data.
- Then calls `com.atproto.repo.createRecord` with `app.bsky.feed.post` record type, embedding the uploaded blobs with alt text.
- Returns the post URI/URL on success.

#### 5. UI components

**`src/components/BlueskyLoginButton.tsx`**:
- Shows "Log in to Bluesky" button in header (right side).
- When logged in, shows avatar/handle + "Log out".
- Opens a dialog with handle + app password fields, with a link to Bluesky app password settings.

**`src/components/PostComposer.tsx`**:
- Shown on the results screen when user is logged in and has alt text generated.
- Text field with 300-char limit + character counter.
- "Post to Bluesky" button that: compresses images client-side → calls `bsky-post` edge function → shows success toast with link to post.

#### 6. Wire up in existing files

**`src/pages/Index.tsx`**:
- Wrap with `BlueskyAuthProvider`.
- Add `BlueskyLoginButton` to header.
- Add `PostComposer` below alt text results (visible only when logged in + results ready).

**`src/App.tsx`**:
- Wrap app in `BlueskyAuthProvider`.

### Security Notes

- App passwords are sent to the edge function over HTTPS only, never stored.
- JWT tokens live in sessionStorage (not localStorage) — cleared when browser closes.
- Edge functions proxy all AT Protocol calls, so no CORS issues and credentials never touch client-side network calls.

