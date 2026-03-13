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

### Authentication Flow
1. User provides handle and app password
2. Call `com.atproto.server.createSession`
3. Store returned JWT tokens (accessJwt, refreshJwt)
4. Use accessJwt for subsequent API calls

### Image Upload Process
1. Convert image to binary data from base64
2. Upload via `com.atproto.repo.uploadBlob`
3. Receive blob reference for embedding
4. Include alt text in image embed

### Post Creation
- Use `com.atproto.repo.createRecord` with collection `app.bsky.feed.post`
- Include text content and image embeds
- Return post URI and CID for URL construction

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