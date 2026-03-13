# Development Standards

## Code Style & Conventions

### TypeScript
- Use TypeScript for all new code
- Define interfaces for all data structures (PhotoFile, ExifInfo, BlueskySession)
- Use type imports: `import type { PhotoFile } from "@/types/photo"`
- Prefer explicit return types for functions when not obvious

### React Patterns
- Use functional components with hooks
- Prefer custom hooks for reusable logic (useBlueskyAuth)
- Use React.memo() for expensive components
- Keep components focused on single responsibility

### File Organization
- Components in `/src/components/` with PascalCase names
- Custom hooks in `/src/hooks/` with `use-` prefix
- Types in `/src/types/` with descriptive names
- Utilities in `/src/lib/` with kebab-case names
- Constants in `/src/lib/constants.ts`

### Naming Conventions
- Components: PascalCase (PhotoUploader.tsx)
- Files: kebab-case (image-compress.ts)
- Functions: camelCase (extractExif, compressImageForBluesky)
- Constants: SCREAMING_SNAKE_CASE (MAX_PHOTOS, BLUESKY_IMAGE_MAX_BYTES)

## Error Handling

### Frontend
- Use try-catch blocks for async operations
- Show user-friendly error messages via toast notifications
- Log errors to console for debugging
- Graceful degradation when features fail

### Backend (Edge Functions)
- Return structured error responses with appropriate HTTP status codes
- Include CORS headers in all responses
- Handle rate limiting (429) and quota exceeded (402) from AI service
- Validate input parameters before processing

## Performance Guidelines

### Image Handling
- Compress images client-side before upload
- Use object URLs for previews, revoke when done
- Implement progressive loading for large images
- Respect Bluesky's 1MB image limit

### State Management
- Use React Context for global state (auth, theme)
- Use local state for component-specific data
- Implement proper cleanup in useEffect hooks
- Avoid unnecessary re-renders with useMemo/useCallback

## Security Best Practices

### Authentication
- Use Bluesky App Passwords, never main passwords
- Store tokens in sessionStorage (cleared on browser close)
- Validate JWT tokens on backend before API calls
- Implement proper logout functionality

### Data Privacy
- Never store user images on server
- Process images in memory only
- Clear sensitive data from state on logout
- Use HTTPS for all API communications

## Platform Constraints

### Lovable Hosting
- Application hosted on Lovable platform (https://lovable.dev)
- Backend uses Lovable Cloud (managed Supabase)
- No direct server or deployment access
- Infrastructure fully managed by Lovable
- Automatic deployment on code changes