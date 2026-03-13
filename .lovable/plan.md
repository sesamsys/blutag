

## Plan: Fix OAuth Sign-In Error Handling and Handle Validation

### Root Cause Analysis

There are two separate issues:

1. **OAuth `invalid_client_metadata` error**: Bluesky's auth server tries to fetch the `client_id` URL (`https://id-preview--...lovable.app/oauth/client-metadata.json`) and gets an "unexpected redirect." This is a Lovable preview URL issue — the `lovable.app` preview domain likely redirects when accessed externally by Bluesky's servers. **This will only work once the app is published to a stable, non-redirecting domain.** The `client_id` and `redirect_uris` in the metadata must then match that published URL.

2. **Silent failure**: The error is caught and logged to console but the user sees nothing — just the button reverting. No toast or error message is shown.

3. **No input validation**: Email addresses and other clearly invalid handles are accepted without feedback.

### Changes

#### 1. `src/components/BlueskyLoginButton.tsx`
- Add handle validation: must look like a domain (contains a dot, no `@`, no spaces). Disable the submit button when invalid.
- Show a hint below the input when the value is clearly not a handle.
- Show a toast error when sign-in fails, with the error message from Bluesky.
- Add an error state to display inline feedback.

#### 2. `src/contexts/BlueskyAuthContext.tsx`  
- Make `signIn` throw errors with user-friendly messages so the button component can catch and display them.

#### 3. `public/oauth/client-metadata.json`
- Change the `client_id`, `client_uri`, and `redirect_uris` to use `https://id-preview--9c2eda88-df4c-4dad-a4b4-ddefaebf6d48.lovable.app` consistently (already done), but note in code comments that these must be updated when publishing to a custom domain.

### Handle Validation Rules
- Must contain at least one dot (domain-like: `user.bsky.social`, `sesam.hu`)
- Must not contain `@` (not an email)
- Must not contain spaces
- Must be at least 3 characters

### UX After Fix
- Invalid input → button disabled, hint text shown ("Enter a handle like alice.bsky.social")
- Valid input but OAuth fails → toast with error message ("Sign in failed: Unable to verify app identity. Try again later.")
- Clear feedback at every step — no silent failures

