# API Integration Guidelines

## Supabase Edge Functions

### Function Structure
- Use Deno runtime with standard library imports
- Include CORS headers in all responses
- Handle OPTIONS requests for preflight
- Return JSON responses with appropriate status codes

### Error Response Format
```typescript
{
  error: string,
  details?: any
}
```

### Success Response Format
```typescript
{
  // Function-specific data
  [key: string]: any
}
```

## Bluesky AT Protocol Integration

### OAuth Authentication Flow
1. User enters Bluesky handle (e.g., alice.bsky.social)
2. `BrowserOAuthClient.signIn()` redirects to Bluesky authorization page
3. User approves access on Bluesky's official page
4. Redirected back to `/oauth/callback`
5. `BrowserOAuthClient.init()` processes callback and establishes session
6. Session stored in IndexedDB with DPoP-bound tokens
7. Agent instance created for API calls

### OAuth Client Configuration
- Client metadata: `public/oauth/client-metadata.json`
- Client ID: `${window.location.origin}/oauth/client-metadata.json`
- Handle resolver: `https://bsky.social`
- Library: `@atproto/oauth-client-browser`

### Direct API Calls via Agent
All Bluesky API calls made client-side using authenticated Agent:

**Image Upload:**
```typescript
const response = await agent.uploadBlob(compressedImage, {
  encoding: "image/jpeg",
});
```

**Post Creation (with RichText facets):**

The AT Protocol treats post text as plain text by default. To render URLs, @mentions, and #hashtags as clickable links, the post must include **facets** — rich text annotations with byte offsets. The `RichText` class from `@atproto/api` handles detection automatically:

```typescript
import { RichText } from "@atproto/api";

// Detect facets (links, mentions, hashtags)
const richText = new RichText({ text: postText });
await richText.detectFacets(agent); // resolves handles to DIDs

await agent.com.atproto.repo.createRecord({
  repo: agent.did,
  collection: "app.bsky.feed.post",
  record: {
    $type: "app.bsky.feed.post",
    text: richText.text,
    facets: richText.facets, // undefined if no facets detected
    createdAt: new Date().toISOString(),
    embed: {
      $type: "app.bsky.embed.images",
      images: embeddedImages,
    },
  },
});
```

**Important:** Without facets, URLs appear as plain text and mentions are not linked to profiles. Always use `RichText.detectFacets()` before creating posts.

### Security Features
- **No passwords in app**: OAuth flow handled by Bluesky
- **DPoP-bound tokens**: Prevents token replay attacks
- **IndexedDB storage**: More secure than localStorage
- **Automatic token refresh**: Handled by OAuth client library
- **Token revocation**: Proper logout with `client.revoke(did)`

## AI Service Integration

### Lovable AI Gateway
- Endpoint: `https://ai.gateway.lovable.dev/v1/chat/completions`
- Model: `google/gemini-2.5-flash`
- Supports vision capabilities for image analysis

### Request Format
```typescript
{
  model: "google/gemini-2.5-flash",
  messages: [{
    role: "system",
    content: SYSTEM_PROMPT
  }, {
    role: "user", 
    content: [
      { type: "image_url", image_url: { url: "data:image/jpeg;base64,..." }},
      { type: "text", text: USER_PROMPT }
    ]
  }]
}
```

### Error Handling
- 429: Rate limit exceeded - show user-friendly message
- 402: Credit limit exceeded - inform user of quota
- 500: Service error - retry with exponential backoff

## Environment Variables

### Required Variables
- `LOVABLE_API_KEY`: For AI service authentication
- `VITE_SUPABASE_URL`: Supabase project URL (Lovable Cloud)
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase anon key

### Lovable Cloud Configuration
- Backend uses Lovable Cloud (managed Supabase instance)
- Environment variables configured through Lovable platform
- No direct access to Supabase dashboard
- Edge functions deployed automatically by Lovable

### Security Notes
- Never expose API keys in frontend code
- Use Supabase environment variables for edge functions
- Validate environment variables on function startup
- All infrastructure managed by Lovable platform