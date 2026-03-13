# Bluesky OAuth Integration

## Overview
Blutag uses AT Protocol OAuth for Bluesky authentication via `@atproto/oauth-client-browser`. This provides secure, passwordless authentication with no backend required.

## Architecture

### OAuth Flow
```
User → Enter handle → Redirect to Bluesky → Approve → Callback → Session established
```

1. User clicks "Sign in with Bluesky"
2. Enters Bluesky handle (e.g., alice.bsky.social)
3. `BrowserOAuthClient.signIn()` redirects to Bluesky's authorization page
4. User approves access on Bluesky's official interface
5. Redirected back to `/oauth/callback`
6. `BrowserOAuthClient.init()` processes callback
7. Session stored in IndexedDB with DPoP-bound tokens
8. Agent instance created for authenticated API calls

### Key Components

**BlueskyAuthContext** (`src/contexts/BlueskyAuthContext.tsx`)
- Manages OAuth client lifecycle
- Provides Agent instance for API calls
- Handles session initialization and restoration
- Exposes: `agent`, `handle`, `did`, `isLoggedIn`, `signIn()`, `logout()`

**OAuth Callback Page** (`src/pages/OAuthCallback.tsx`)
- Loading page shown during OAuth redirect processing
- Minimal UI while `BrowserOAuthClient.init()` completes

**Client Metadata** (`public/oauth/client-metadata.json`)
- OAuth client identity for Bluesky auth server
- Contains client_id, redirect_uris, and other OAuth parameters
- Must be publicly accessible at `${origin}/oauth/client-metadata.json`

## Implementation Details

### Client Initialization
```typescript
const CLIENT_ID = `${window.location.origin}/oauth/client-metadata.json`;

const client = await BrowserOAuthClient.load({
  clientId: CLIENT_ID,
  handleResolver: "https://bsky.social",
});
```

### Sign In
```typescript
await client.signIn(handle, { state: "login" });
// Redirects to Bluesky - execution stops here
```

### Session Restoration
```typescript
const result = await client.init();
if (result?.session) {
  const agent = new Agent(result.session);
  // Use agent for API calls
}
```

### Logout with Token Revocation
```typescript
await client.revoke(did);
```

## Direct API Calls

All Bluesky operations happen client-side via the Agent:

### Upload Image Blob
```typescript
const response = await agent.uploadBlob(compressedImage, {
  encoding: "image/jpeg",
});
const blobRef = response.data.blob;
```

### Create Post
```typescript
await agent.com.atproto.repo.createRecord({
  repo: agent.did,
  collection: "app.bsky.feed.post",
  record: {
    $type: "app.bsky.feed.post",
    text: "Post text",
    createdAt: new Date().toISOString(),
    embed: {
      $type: "app.bsky.embed.images",
      images: [{ alt: "Alt text", image: blobRef }],
    },
  },
});
```

### Get Profile
```typescript
const profile = await agent.getProfile({ actor: did });
const handle = profile.data.handle;
```

## Security Features

### DPoP-Bound Tokens
- Tokens are cryptographically bound to the browser
- Cannot be replayed even if intercepted
- Prevents token theft attacks

### IndexedDB Storage
- Tokens stored in browser-managed IndexedDB
- More secure than localStorage
- Not accessible via JavaScript like localStorage
- Origin-scoped (same-origin policy)

### No Password Exposure
- Users never enter passwords in the app
- Authentication happens on Bluesky's official page
- App only receives authorized tokens

### Automatic Token Refresh
- OAuth client handles token refresh automatically
- No manual token management required
- Seamless user experience

## Session Management

### Persistence
- Sessions persist across browser tabs (same origin)
- Sessions survive page refreshes
- IndexedDB persists until explicitly revoked

### App State Persistence Across OAuth Redirects
- Photos and generated alt text are saved to IndexedDB before the OAuth redirect
- On app load, saved state is restored from IndexedDB automatically
- If restored photos have alt text, the results screen is shown immediately
- Saved session is cleared on "Start over" (reset) or after a successful post
- Uses a separate IndexedDB store (`blutag-session`) from the OAuth token storage
- Implementation: `src/lib/session-persistence.ts` with `savePhotosSession()`, `loadPhotosSession()`, `clearPhotosSession()`

### Restoration
- On app load, `client.init()` checks for existing session
- If valid session exists, automatically restores Agent
- No re-authentication required

### Cleanup
- Logout calls `client.revoke(did)` to invalidate tokens
- Clears Agent and session state
- User must re-authenticate to access Bluesky features

## Edge Functions Removed

The OAuth refactor eliminated the need for backend authentication:

### Deleted Functions
- `supabase/functions/bsky-login/` - No longer needed (OAuth handles auth)
- `supabase/functions/bsky-post/` - No longer needed (Agent posts directly)

### Remaining Function
- `supabase/functions/analyze-photo/` - Still used for AI alt text generation

## Testing OAuth Flow

### Local Development
1. Ensure `public/oauth/client-metadata.json` is accessible
2. Run dev server: `npm run dev`
3. Test sign-in flow with real Bluesky account
4. Verify redirect to `/oauth/callback` works
5. Check IndexedDB for stored session

### Production
- OAuth client metadata must be accessible at production URL
- Redirect URIs in metadata must match production domain
- Test full flow in production environment

## Troubleshooting

### Common Issues

**Redirect loop:**
- Check client metadata redirect_uris match actual URLs
- Verify `/oauth/callback` route is configured

**Session not persisting:**
- Check IndexedDB is enabled in browser
- Verify same-origin policy (no cross-origin issues)
- Check for browser extensions blocking IndexedDB

**Token refresh fails:**
- Network connectivity issues
- Bluesky service outage
- Invalid or revoked tokens (user must re-authenticate)

## Best Practices

### Context Usage
- Always use `useBlueskyAuth()` hook to access auth state
- Check `isLoggedIn` before showing authenticated features
- Handle `isLoading` state during initialization

### Error Handling
- Wrap OAuth calls in try-catch blocks
- Show user-friendly error messages via toast
- Log errors to console for debugging
- Provide fallback UI for auth failures

### Agent Usage
- Only use Agent when `isLoggedIn` is true
- Agent is null when not authenticated
- All API calls should handle potential Agent errors