

## Plan: Bluesky OAuth Login via `@atproto/oauth-client-browser`

### Important Context

AT Protocol OAuth for browser SPAs uses `@atproto/oauth-client-browser` -- a client-side library that handles the full OAuth flow (PKCE, DPoP, token refresh) without needing a backend. This is the officially recommended approach for SPAs. Tokens are stored in **IndexedDB** (not localStorage), which satisfies the security requirements.

A fully server-side token approach (HTTP-only cookies, backend token storage) would require `@atproto/oauth-client-node` running on a persistent server -- not feasible with stateless edge functions. The browser client is the correct architecture for this project.

### How It Works

```text
User clicks "Sign in with Bluesky"
  → Enters their handle (e.g. alice.bsky.social)
  → Redirected to Bluesky's authorization page
  → Approves access
  → Redirected back to app
  → BrowserOAuthClient.init() picks up the callback
  → Session established (tokens in IndexedDB)
  → AT Protocol API calls made directly via session agent
```

### Requirements

1. **Client metadata JSON** must be hosted at a public URL on the app's domain (e.g. `/oauth/client-metadata.json`). This file identifies the app to Bluesky's auth server.

2. **Callback route** at `/oauth/callback` to receive the redirect.

### Changes

#### 1. Install `@atproto/oauth-client-browser` and `@atproto/api`

#### 2. Create client metadata file
**`public/oauth/client-metadata.json`** -- static JSON served from the app domain. Contains app name, redirect URIs, scopes (`atproto transition:generic`), and `dpop_bound_access_tokens: true`.

The `client_id` must match the URL where this file is hosted. We'll use the preview/published URL.

#### 3. Rewrite `src/contexts/BlueskyAuthContext.tsx`
- Initialize `BrowserOAuthClient` with the client metadata URL
- Call `client.init()` on app load to restore sessions or handle callbacks
- Expose `signIn(handle)`, `logout()`, and session state (handle, did, agent)
- The `OAuthSession` object acts as an authenticated AT Protocol agent
- Sessions persist across tabs automatically (IndexedDB is origin-scoped)

#### 4. Rewrite `src/components/BlueskyLoginButton.tsx`
- Replace password form with a simple handle input
- "Sign in with Bluesky" button triggers redirect to Bluesky auth
- Show `@handle` and logout button when authenticated

#### 5. Add callback route
**`src/pages/OAuthCallback.tsx`** -- minimal page that shows "Completing login..." while `BrowserOAuthClient.init()` processes the callback parameters. Redirects to `/` after completion.

Add route in `src/App.tsx`: `<Route path="/oauth/callback" element={<OAuthCallback />} />`

#### 6. Rewrite `src/components/PostComposer.tsx`
- Use the `OAuthSession` agent directly for blob uploads and post creation
- No more sending tokens to edge functions
- Call `session.call('com.atproto.repo.uploadBlob', ...)` and `session.call('com.atproto.repo.createRecord', ...)` directly from the browser via the authenticated session

#### 7. Remove old edge functions
- Delete `supabase/functions/bsky-login/index.ts`
- Delete `supabase/functions/bsky-post/index.ts`
- Remove their entries from `supabase/config.toml`

#### 8. Update `src/lib/constants.ts`
- Add OAuth-related constants (client metadata URL, scopes)

### Security Properties
- No passwords or app passwords ever enter the app
- Tokens stored in IndexedDB (browser-managed, not accessible via JS like localStorage)
- DPoP-bound tokens (cannot be replayed if intercepted)
- Automatic token refresh handled by the library
- Sessions persist across tabs (same origin)

### Files Created
- `public/oauth/client-metadata.json`
- `src/pages/OAuthCallback.tsx`

### Files Modified
- `src/contexts/BlueskyAuthContext.tsx` (full rewrite)
- `src/components/BlueskyLoginButton.tsx` (full rewrite)
- `src/components/PostComposer.tsx` (use session agent instead of edge function)
- `src/App.tsx` (add callback route)
- `src/lib/constants.ts` (add OAuth constants)
- `supabase/config.toml` (remove bsky-login, bsky-post)

### Files Deleted
- `supabase/functions/bsky-login/index.ts`
- `supabase/functions/bsky-post/index.ts`

