# Build Optimization

## Bundle Size Management

### Current Configuration
The project uses Vite with manual chunk splitting to optimize bundle size and loading performance. This prevents the "chunk size limit" warning and improves initial page load times.

### Manual Chunk Strategy

**Configuration Location:** `vite.config.ts`

The build is split into the following chunks:

1. **react-vendor** (~150 kB)
   - React core libraries
   - Packages: `react`, `react-dom`, `react-router-dom`
   - Loaded on every page

2. **atproto** (~1090 kB / ~236 kB gzipped)
   - AT Protocol and OAuth libraries
   - Packages: `@atproto/api`, `@atproto/oauth-client-browser`
   - Large but necessary for Bluesky integration
   - Only loaded when authentication features are used

3. **data-libs** (~223 kB / ~61 kB gzipped)
   - Data fetching and backend integration
   - Packages: `@tanstack/react-query`, `@supabase/supabase-js`
   - Used for API calls and state management

4. **image-libs** (~99 kB / ~31 kB gzipped)
   - Image processing utilities
   - Packages: `exifreader`
   - Used for EXIF metadata extraction

5. **forms** (~0.06 kB)
   - Form handling libraries
   - Packages: `react-hook-form`, `@hookform/resolvers`, `zod`
   - Used for form validation

6. **icons** (~5 kB)
   - Icon library
   - Packages: `lucide-react`
   - Shared across components

7. **index** (~165 kB / ~53 kB gzipped)
   - Main application code and UI components
   - Includes shadcn/ui components and Radix UI
   - Application-specific logic and pages

### Why atproto Chunk is Large

The `@atproto/oauth-client-browser` package is comprehensive and includes:
- Full OAuth 2.0 client implementation
- DPoP (Demonstrating Proof-of-Possession) support
- Cryptographic operations for token binding
- AT Protocol client libraries
- Session management and token refresh logic

**This is acceptable because:**
- It's only loaded once and cached by the browser
- Gzipped size is ~236 kB (much smaller than uncompressed)
- It's essential for the core authentication feature
- Modern browsers handle this size efficiently
- The library provides significant security benefits

## Circular Dependency Resolution

### Issue
During initial build optimization, a circular dependency warning appeared:
```
Circular chunk: ui-components -> data-libs -> ui-components
```

### Root Cause
Attempting to manually separate UI components into their own chunk created a circular reference because:
- Radix UI components have indirect dependencies on shared utilities
- Data libraries (React Query, Supabase) are used throughout the application
- The dependency graph created a cycle when trying to isolate these chunks

### Solution
Removed the separate `ui-components` chunk and let Vite handle UI component bundling automatically. This:
- Eliminates the circular dependency warning
- Bundles UI components with the main application code
- Maintains reasonable chunk sizes (index chunk: ~165 kB uncompressed, ~53 kB gzipped)
- Simplifies the chunk configuration
- Improves build reliability

### Result
Clean build with no circular dependency warnings. The trade-off is slightly larger main chunk, but this is acceptable because:
- UI components are needed immediately on page load
- Bundling them together reduces HTTP requests
- The gzipped size remains reasonable (~53 kB)
- Eliminates complexity in chunk management

## Dynamic Import Opportunities

### Current Implementation
All routes are currently statically imported. For future optimization, consider lazy loading:

**Potential Dynamic Imports:**
```typescript
// Instead of:
import Index from "./pages/Index.tsx";
import OAuthCallback from "./pages/OAuthCallback.tsx";

// Use:
const Index = lazy(() => import("./pages/Index.tsx"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback.tsx"));
```

**Benefits:**
- Reduces initial bundle size
- Faster time to interactive
- Better performance on slower connections

**Trade-offs:**
- Slight delay when navigating to lazy-loaded routes
- More complex error handling
- Requires Suspense boundaries

### When to Use Dynamic Imports

**Good candidates for lazy loading:**
- Admin or settings pages (not frequently accessed)
- Heavy visualization components
- Large third-party integrations
- Features behind authentication

**Not recommended for lazy loading:**
- Main landing page (Index)
- Core authentication flow
- Frequently accessed components
- Small components (<50 kB)

## Build Performance

### Current Build Stats
- Total modules: ~3775
- Build time: ~2.5-3 seconds
- Largest chunk: atproto (~1090 kB uncompressed, ~236 kB gzipped)
- Total bundle size: ~1.7 MB uncompressed, ~430 kB gzipped

### Optimization Checklist

**Already Implemented:**
- ✅ Manual chunk splitting
- ✅ Tree shaking (automatic with Vite)
- ✅ Minification (automatic in production)
- ✅ Gzip compression (handled by hosting platform)
- ✅ SWC for faster compilation

**Future Optimizations:**
- ⏳ Route-based code splitting with lazy loading
- ⏳ Image optimization (WebP, AVIF formats)
- ⏳ Service worker for offline caching
- ⏳ Preloading critical chunks

## Monitoring Bundle Size

### Commands
```bash
# Production build with size analysis
npm run build

# Preview production build locally
npm run preview
```

### What to Watch For
- Individual chunks exceeding 500 kB (except atproto)
- Total bundle size growing beyond 2 MB uncompressed
- Build time increasing significantly
- Duplicate dependencies across chunks

### Tools for Analysis
- Vite's built-in bundle analyzer (shown during build)
- Browser DevTools Network tab (check actual load times)
- Lighthouse performance audits
- Bundle size tracking in CI/CD

## Best Practices

### Adding New Dependencies
1. Check package size before installing (use bundlephobia.com)
2. Consider if the functionality can be implemented without a library
3. Look for lighter alternatives
4. Add large packages to appropriate manual chunks

### Code Splitting Guidelines
- Keep related functionality together in chunks
- Avoid circular dependencies between chunks
- Group by feature or library type
- Balance chunk sizes (aim for 100-300 kB per chunk)

### Performance Budget
- Initial load: < 500 kB gzipped
- Individual chunks: < 300 kB gzipped (except atproto)
- Time to interactive: < 3 seconds on 3G
- First contentful paint: < 1.5 seconds

## Troubleshooting

### Circular Chunk Warning (RESOLVED)
**Previous Issue:** "Circular chunk: ui-components -> data-libs -> ui-components"

**Resolution:** Removed the separate ui-components chunk. UI components are now bundled with the main application code (index chunk). This:
- Eliminates circular dependency warnings
- Simplifies chunk configuration
- Maintains reasonable bundle sizes
- Improves build reliability

**When to revisit:** If the index chunk grows beyond 300 kB gzipped, consider lazy loading specific pages or features.

### Chunk Size Still Too Large
1. Identify the largest modules in the chunk
2. Consider lazy loading that functionality
3. Look for alternative, smaller libraries
4. Check for duplicate dependencies

### Build Time Increasing
1. Review the number of dependencies
2. Check for large files being processed
3. Consider using esbuild for dependencies
4. Optimize image assets before bundling