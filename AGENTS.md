# AGENTS.md

Rules for anyone (human or AI) changing this codebase. Each rule has a one-line why.
Detailed review rules live in `.kiro/steering/` — read `code-review-rules.md` before editing.

## Architecture

- The app is TanStack Start with file-based routes in `src/routes/`; never reintroduce
  React Router, `index.html` or `src/main.tsx`. Why: the deploy pipeline is TanStack Start and a
  second router silently breaks navigation.
- Use native TanStack APIs (`Link`, `useNavigate`, `useRouter`, `createFileRoute`); there is no
  react-router compat shim. Why: typed routes catch broken links at compile time.
- Root providers, `<head>` metadata and the pre-paint dark-mode script live in
  `src/routes/__root.tsx`; `<html>` keeps `suppressHydrationWarning`. Why: the theme script
  mutates `<html>` before hydration.
- Browser-only modules (OAuth client, IndexedDB, canvas, `window` at import time) are imported
  dynamically at the point of use, and browser-only routes set `ssr: false`. Why: route modules
  are evaluated on the server and crash on browser globals.
- Local OAuth uses the path-less loopback client ID from `src/lib/oauth-client-id.ts`, and
  `localhost` is redirected to `127.0.0.1`; hosted origins use the canonical blutag.app
  metadata. Why: AT Protocol rejects loopback IDs with a path and refuses to run on `localhost`.
- Photo analysis stays a backend function (`supabase/functions/analyze-photo`). Why: it relies
  on the trusted `cf-connecting-ip` rate limit and large image payloads.
- `src/integrations/supabase/client.ts`, `types.ts` and `.env` are generated; never edit them.
  Why: they are overwritten on every sync.

## Tooling

- Bun is the package manager; commit `bun.lock` and run tests with `bun run test`, never
  `bun test`. Why: CI installs with `--frozen-lockfile`, and Bun's runner isn't Vitest.
- Prettier (`.prettierrc.json`, 100 columns) owns formatting and ESLint enforces it. Why: one
  formatter avoids churn in diffs from Lovable and local edits.
- `.github/workflows/ci.yml` runs typecheck, tests with coverage, lint, format check and build
  on pull requests and every push to `main`. Why: Lovable commits land directly on `main`.
- TypeScript is strict (incl. `noUnusedLocals`/`noUnusedParameters`); no `any`, `@ts-ignore` or
  `@ts-nocheck`. Why: the migration surfaced real bugs that loose types were hiding.

## Testing

- Tests follow three phases: pure logic in `src/lib`, contexts/hooks/data with mocks from
  `src/test/`, and route/component smoke tests. New logic gets a phase-1 test; new UI behaviour
  gets a phase-3 test. Why: logic tests are cheap and catch most regressions.
- Bug fixes ship with a regression test named after the user-visible symptom. Why: it documents
  the bug and stops it coming back.
- Route tests match routes with `router.matchRoutes` instead of rendering the full app. Why:
  jsdom can't load route stylesheets and loaders may need a network.
- Context mocks must return stable objects (e.g. one `router` object across renders). Why: a new
  object per render re-triggers effects and loops forever.

## Changelog

- `CHANGELOG.md` is a simple dated changelog: entries are headed by the release date
  (`YYYY-MM-DD`), never version numbers or `[Unreleased]`. Why: changes are released the same day.
