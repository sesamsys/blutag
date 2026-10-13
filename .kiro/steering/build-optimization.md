# Build Optimization

## Build Pipeline

Blutag runs on **TanStack Start**. `vite.config.ts` is a thin wrapper around
`@lovable.dev/vite-tanstack-config`, which already bundles React, TanStack Router/Start,
Tailwind v4, tsconfig paths and the server build. Do not re-add any of those plugins —
duplicates break the dev server on startup. Project-specific plugins go in the wrapper's
`vite: { plugins: [...] }` escape hatch.

The old hand-tuned `manualChunks` split (react-vendor, atproto, data-libs, …) no longer
applies: routes are code-split automatically by the router, and the server bundle is built
separately from the client bundle.

## Keeping Heavy Code Off the Critical Path

- **AT Protocol OAuth** (`@atproto/oauth-client-browser`) is imported dynamically inside
  `BlueskyAuthContext` (`getClient()`). It is browser-only (IndexedDB, WebCrypto) and must
  never be evaluated during server rendering — keep it a dynamic import.
- **Browser-only libraries** in general (anything touching `window`, `document`, canvas,
  IndexedDB at import time) must be imported at the point of use, not at module scope in a
  route-reachable file. A `typeof window` guard around usage does not fix an import-time crash.
- **The OAuth callback route** sets `ssr: false`; it reads tokens from IndexedDB and has
  nothing useful to render on the server.

## Checking Bundle Size

- `bun run build` prints client and server chunk sizes.
- Investigate any new client chunk above ~500 kB before merging: prefer a dynamic import at
  the point of use over a static import.

## Verification After Build Changes

1. `bun run build` and `bun run typecheck` both pass.
2. `bun run dev`, then load `/`, `/oauth/callback` and an unknown path — each must render real
   content (the unknown path a 404 page), never the "This page didn't load" fallback.
3. Check the browser console for hydration warnings.
