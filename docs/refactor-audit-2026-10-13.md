# Blutag Refactor Audit — 2026-10-13

Clean-code / code-quality / best-practices review of the TanStack Start migration,
Prettier + ESLint setup, Vitest + CI rollout, and documentation refresh landed today.

READ-ONLY audit. No source files were modified. `bun install --frozen-lockfile` was run to
make the local checkout buildable (the pre-existing `node_modules` was partial), and read-only
`bun run typecheck | lint | format:check | test | build` were executed to surface real issues.

---

## Executive summary

The refactor is in very good shape. The TanStack Start migration is clean: no `index.html`,
no `src/main.tsx`, no `react-router` anywhere, correct `createFileRoute` / `__root.tsx` /
`ssr:false` usage, and the OAuth client is dynamically imported exactly as the steering rules
require. Typecheck, lint, format check, and the production build all pass. ESLint reports only
4 benign `react-refresh/only-export-components` warnings. The edge function, Supabase client,
constants, and the test suite's timer/Promise.race handling all comply with the project's own
`code-review-rules.md`.

The findings below are mostly Medium/Low polish. The two that matter most:

1. **Tests fail on Node ≥ 22 (confirmed locally on Node 26) because `jsdom` is pinned to
   `20.0.3`**, four majors behind. Node's native experimental `localStorage` shadows jsdom's,
   so every `localStorage`-based test throws `Cannot read properties of undefined`. CI pins Bun
   but **not** Node, so this is a latent reproducibility/CI risk, not just a local annoyance.
2. **`@atproto/api` (~1.5 MB) is statically imported in a root provider**, pulling it onto the
   SSR/initial-client critical path and producing a ~1 MB client chunk — over the 500 kB
   threshold `build-optimization.md` says to investigate.

### Prioritized findings

| # | Sev | Cat | Finding | File |
|---|-----|-----|---------|------|
| 1 | High | D/C | `jsdom@20.0.3` incompatible with Node ≥22 native `localStorage`; 19 tests fail locally; CI doesn't pin Node | `package.json`, `.github/workflows/ci.yml` |
| 2 | Med | A/B | `@atproto/api` statically imported in root-path `BlueskyAuthContext`/`PostComposer` → ~1 MB client chunk | `src/contexts/BlueskyAuthContext.tsx:4`, `src/components/PostComposer.tsx:12` |
| 3 | Med | C | CI does not set up a Node version; test runtime is whatever the runner ships | `.github/workflows/ci.yml` |
| 4 | Low | B | `logout` typed as `() => void` in the context interface but is `async` (returns `Promise<void>`) | `src/contexts/BlueskyAuthContext.tsx:26,159` |
| 5 | Low | B | `src/lib/metaData.ts` uses camelCase; `development-standards.md` mandates kebab-case for lib files | `src/lib/metaData.ts` |
| 6 | Low | A | Home link in header uses `<a href="/">` + `preventDefault` instead of a TanStack action | `src/pages/Index.tsx` (header `<a>`) |
| 7 | Low | B | `error-capture.ts` reassigns global `console.error` as an import side-effect | `src/lib/error-capture.ts:58-66` |
| 8 | Low | E | Pre-refactor docs in `/docs` (production-readiness, session summaries) now describe a superseded stack | `docs/*.md` |
| 9 | Info | B | Commented-out `process.env.NODE_ENV` snippet (rule prefers `import.meta.env.DEV`) | `src/lib/error-messages.ts:180` |

---

## A. Architecture / TanStack migration cleanliness

**Verdict: clean. No remnants of the old stack.**

Confirmed by reading files and grepping:

- No `index.html` and no `src/main.tsx` (`ls` returned "No such file or directory" for both).
- No `react-router` / `BrowserRouter` / `createBrowserRouter` anywhere. Every `react-router`
  grep hit resolved to `@tanstack/react-router`.
- Routes use `createFileRoute` correctly: `src/routes/index.tsx`, `src/routes/oauth/callback.tsx`
  (with `ssr: false` and a clear comment on why), and `src/routes/__root.tsx` with
  `createRootRouteWithContext`, `HeadContent`, `Outlet`, `Scripts`, `notFoundComponent`, and
  `errorComponent`. `<html suppressHydrationWarning>` and the pre-paint theme script live in the
  shell exactly as `AGENTS.md` prescribes.
- `NotFound.tsx` uses `Link` + `useLocation`, `RouteErrorView.tsx` uses `Link` + `useRouter` —
  native TanStack APIs, no compat shim.
- `vite.config.ts` is a thin wrapper around `@lovable.dev/vite-tanstack-config` with no
  duplicated React/TanStack/Tailwind/tsconfig-paths plugins — matches `build-optimization.md`.
- OAuth client (`@atproto/oauth-client-browser`) is dynamically imported inside `getClient()` in
  `BlueskyAuthContext.tsx:34-37`, never at module scope. `src/router.tsx`'s `getRouter` is
  genuinely wired up (referenced by `routeTree.gen.ts` for the Start `Register` type), so it is
  not dead scaffolding.

### A-1 (Low) — Header "home" link bypasses the router

`src/pages/Index.tsx` renders the logo/title as `<a href="/" onClick={preventDefault; handleReset()}>`.
This is intentionally a "start over" reset rather than navigation, so it works, but it mixes a
raw anchor with SPA behavior. If a user cmd/ctrl-clicks or the handler ever throws before
`preventDefault`, behavior is inconsistent. Consider a `<button>` styled as the brand (it is an
action, not a link) to match the "use native TanStack APIs for navigation; use buttons for
actions" intent. Low priority; cosmetic/semantic.

> Note: `src/pages/*` are not React-Router leftovers — the `src/routes/*` files are thin
> `createFileRoute` wrappers that re-export the page components, and `development-standards.md`
> explicitly places pages in `/src/pages/`. This split is fine.

---

## B. Code quality / clean code

**Verdict: strong. The `code-review-rules.md` checklist passes almost entirely.**

Confirmed compliant:

- **No `as any`, `@ts-ignore`, or `@ts-nocheck` in authored code.** The only hits are in
  `src/routeTree.gen.ts`, which is generated and carries `/* eslint-disable */` + `// @ts-nocheck`
  by design.
- **Supabase client** (`src/integrations/supabase/client.ts`) validates `VITE_*` env vars at
  module init and throws a descriptive error if missing, and sets
  `auth: { persistSession: false, autoRefreshToken: false }` with no `storage` — exactly as the
  rule requires for an edge-only client. (`src/env.d.ts` types the three `VITE_*` vars.)
- **`useMemo` vs `useRef` for identity:** `LanguageContext.tsx` correctly uses `useRef`
  (`userTouchedRef`, `lastDidRef`) for stable mutable flags, not `useMemo([])`.
- **`useEffect` cleanup closures:** the auth-init effect uses a `mounted` flag; the
  language-preference effect uses a `cancelled` flag; both have correct dependency arrays.
- **Magic literals:** `src/lib/constants.ts` is comprehensive and used throughout
  (`MAX_PHOTOS`, `MAX_ALT_TEXT_LENGTH`, `RATE_LIMIT_*`, retry/timeout constants, etc.). The
  edge function re-declares `RATE_LIMIT_MAX`/`RATE_LIMIT_WINDOW_MS` locally, but with a comment
  explaining edge functions can't import from `src/` — acceptable and documented.
- **Edge function** (`supabase/functions/analyze-photo/index.ts`): prefers `cf-connecting-ip`
  over `x-forwarded-for` (with a comment on spoofability), returns structured JSON errors with
  CORS headers on every path, handles OPTIONS preflight, 429 (with `Retry-After`), 402, 413, and
  validates `imageBase64`/`exifData`/`language` before use. `temperature: 0` is set per the
  accessibility steering rule for deterministic alt text.
- **Type imports / return types / naming:** `import type` used for type-only imports; components
  are PascalCase; constants SCREAMING_SNAKE_CASE.

### B-1 (Medium) — `@atproto/api` on the critical path

`src/contexts/BlueskyAuthContext.tsx:4` does `import { Agent } from "@atproto/api"` (a value
import, needed for `new Agent(...)`), and `src/components/PostComposer.tsx:12` does
`import { RichText } from "@atproto/api"`. `BlueskyAuthProvider` is a root provider in
`__root.tsx`, so `@atproto/api` — the single largest dependency — is evaluated on the initial
render path (and during SSR). The build confirms the cost:

- `build` output: `@atproto/api` server chunk is **1,549.41 kB** (gzip 214.89 kB).
- Client assets: `LanguageContext-*.js` is **1,018,566 bytes (~1 MB)** — the largest client
  chunk, well over the ~500 kB line `build-optimization.md` says to investigate before merging.

`build-optimization.md` only explicitly names the OAuth *client* as a mandatory dynamic import,
so this is not a hard rule violation, but it is exactly the situation the "keep heavy code off
the critical path" and "investigate any client chunk above ~500 kB" guidance targets.

Suggested fix: load `@atproto/api` lazily at point of use. `new Agent(session)` only runs after
a session exists, so `BlueskyAuthContext` can `await import("@atproto/api")` inside
`establishSession`/`getClient` alongside the OAuth client; `PostComposer` can import `RichText`
dynamically inside the post handler. Verify with `bun run build` that the ~1 MB chunk drops and
`@atproto/api` moves to a route/action-triggered chunk.

### B-2 (Low) — `logout` return type is inaccurate

`BlueskyAuthContext.tsx:26` declares `logout: () => void` in `BlueskyAuthContextValue`, but the
implementation (`:159`) is `useCallback(async () => { ... })`, i.e. `() => Promise<void>`. It is
only used as an `onClick` handler (`BlueskyLoginButton.tsx:61`), so nothing breaks, but the type
hides the async nature and would let a caller forget to await. Fix: type it
`logout: () => Promise<void>`.

### B-3 (Low) — camelCase lib filename

`src/lib/metaData.ts` is the only `src/lib` file with an uppercase letter.
`development-standards.md` mandates kebab-case for utilities (e.g. `image-compress.ts`). Rename to
`src/lib/meta-data.ts` and update the import in `src/pages/Index.tsx`. (The export `metaData` can
stay camelCase — it's a value, not a filename.)

### B-4 (Low) — global `console.error` monkey-patch as import side-effect

`src/lib/error-capture.ts:58-66` reassigns `console.error` at module scope so h3's swallowed
server errors can be expanded and recorded. It's documented and intentional for the SSR error
pipeline, but a module whose mere import mutates a global is a sharp edge: import order now
matters, and tests importing this file inherit the patch. Not a defect; flagging so it's a
conscious choice. If it ever needs taming, install the patch from an explicit `installErrorCapture()`
called once in `server.ts` rather than on import.

### B-5 (Info) — commented `process.env.NODE_ENV`

`src/lib/error-messages.ts:180` has a commented-out `if (process.env.NODE_ENV === "production")`
TODO block. `code-review-rules.md` says to prefer `import.meta.env.DEV` in Vite projects. It's
dead/commented, so harmless, but when that Sentry hook is implemented it should use
`import.meta.env.PROD`, not `process.env.NODE_ENV`.

---

## C. Tooling / config consistency

**Verdict: good, with one real gap (Node pinning) and one latent one.**

Confirmed:

- `package.json` scripts: `test` → `vitest run` (not `bun test`), `test:coverage` →
  `vitest run --coverage`, plus `typecheck`, `lint`, `format`, `format:check`. No yarn/pnpm
  artifacts; `bun.lock` present; `bunfig.toml` configures `--frozen-lockfile`-friendly install
  with a 24h supply-chain guard. No `react-router*` dependency.
- `.github/workflows/ci.yml` runs, in order, typecheck → `test:coverage` → lint → format:check →
  build, on `push: main` **and** `pull_request` (so Lovable's direct-to-main commits are
  covered), installs with `bun install --frozen-lockfile`, and uploads coverage. Matches
  `testing-deployment.md`.
- Formatting is coherent: `bun run format:check` reports "All matched files use Prettier code
  style". Lint passes (0 errors; 4 `react-refresh/only-export-components` warnings in
  `button.tsx`, `sonner.tsx`, `BlueskyAuthContext.tsx`, `LanguageContext.tsx` — expected for
  files that export both a component and a hook/helper).

### C-1 (Medium) — CI pins Bun but not Node

`.github/workflows/ci.yml` uses `oven-sh/setup-bun@v2` (Bun 1.3.14) on `ubuntu-latest` but never
sets up a Node version. Vitest + jsdom run under Node, so the effective test runtime is "whatever
Node `ubuntu-latest` happens to ship", which drifts over time. Combined with finding D-1 below,
this is how a green CI could turn red (or a red local turn green) with no code change. Fix: add
`actions/setup-node@v4` with an explicit, pinned `node-version` so local and CI runtimes match.

---

## D. Testing quality

**Verdict: high-quality tests, undermined by a stale `jsdom` pin.**

Confirmed good practice (reading the suite):

- **No placeholder tests.** No `expect(true).toBe(true)` anywhere.
- **Branch coverage, not just happy path:** `retry.test.ts` covers success-first, retry-then-
  succeed, exhaust-attempts, `onRetry`, non-retryable (402), and network-retryable branches.
  `language-preference.test.ts` covers defaults, round-trip, invalid stored value, storage-throws,
  write-fail, malformed JSON, non-array, filtering/cap, and recent-list ordering.
- **Fake timers + never-resolving Promise.race, done exactly per rule:** `retry.test.ts` uses
  `vi.useFakeTimers()` / `vi.advanceTimersByTimeAsync()`, mocks the slow fn with
  `new Promise(() => {})`, attaches `.catch(noop)` before advancing timers, and restores real
  timers in `afterEach`.
- **Route tests use `router.matchRoutes`,** not a full-app render: `src/test/app-routing.test.tsx`
  matches `/`, `/oauth/callback` (incl. query params), and an unknown path (falls back to
  `rootRouteId`), and asserts `OAuthCallbackRoute.options.ssr === false`.
- **Stable context mocks:** `BlueskyAuthContext.test.tsx` returns one `router` object across
  renders (`const router = { navigate, state }`), matching the `AGENTS.md` rule that prevents
  effect loops.

### D-1 (High) — `jsdom@20.0.3` breaks every localStorage test on modern Node

`bun run test` fails: **19 tests across 2 files** error with
`TypeError: Cannot read properties of undefined (reading 'clear')` on `localStorage.clear()`
(`src/lib/language-preference.test.ts:13`, `src/contexts/LanguageContext.test.tsx:38`). Vitest
prints the root cause:

> `localStorage is not available because --localstorage-file was not provided.`

Diagnosis (verified): local Node is **v26.11.1**, which ships a built-in experimental global
`localStorage` that is `undefined` unless `--localstorage-file` is passed. `package.json` pins
`jsdom@^20.0.3` (installed `20.0.3`) — four majors behind current (25.x). With old jsdom, Node's
native global `localStorage` shadows jsdom's `window.localStorage`, so the global reference
tests use resolves to the broken native one. The vitest config is otherwise correct
(`environment: "jsdom"`, `globals: true`, jsdom URL `http://127.0.0.1:3000/`).

Why it matters: this is both a developer-experience failure (fresh checkouts can't get a green
`bun run test` on a current Node) and, together with C-1 (no Node pin in CI), a latent CI
failure the moment the runner's Node crosses the threshold.

Suggested fix (pick one, verify with `bun run test`):
- Upgrade `jsdom` to a current major (25.x) so its `localStorage` is restored over Node's; or
- Pin a Node version in CI **and** document it locally (e.g. `.nvmrc`) that predates native
  `localStorage`; the cleaner fix is the jsdom upgrade.

Either way, add a Node setup step in CI (C-1) so the runtime is deterministic. Note: this is an
environment/dependency issue, not a flaw in the tests themselves — the test logic is sound.

> Could not verify: whether CI is currently green or red, because that depends on the Node
> version `ubuntu-latest` resolves at run time, which this audit cannot observe. The failure is
> confirmed on local Node 26.11.1.

---

## E. Documentation / changelog

**Verdict: current docs are accurate; some pre-refactor docs are now stale.**

Confirmed:

- `README.md`, `CONTRIBUTING.md`, and `docs/` contain **no** stale `react-router` / "Vite +
  React" / `BrowserRouter` / `src/main.tsx` references (grep returned nothing).
- `CHANGELOG.md` follows `testing-deployment.md`/`AGENTS.md`: dated `YYYY-MM-DD` headers, no
  version numbers, no `[Unreleased]`. The `2026-10-13` entry accurately records the TanStack
  migration, Prettier, CI, three-phase tests, React 19 / Tailwind v4, and strict TS.

### E-1 (Low) — pre-refactor docs describe a superseded stack

`/docs` still carries dated, point-in-time docs from before today's refactor
(`production-readiness-plan.md`, `production-readiness-progress.md`, the `session-summary-2026-03-13*`
files, and the various `*-implementation.md` notes). They don't contain the specific stale
tokens grepped for, but they predate the TanStack/Prettier/Vitest changes and describe the
earlier architecture and status. Per `documentation.md` ("remove outdated documentation
promptly"), either move them under a `docs/history/` (or `docs/archive/`) folder or add a
one-line "superseded by the 2026-10-13 refactor" note at the top of each, so a reader doesn't
mistake them for current guidance. `roadmap.md` at the repo root should likewise be checked for
items the refactor already completed.

---

## What went well

- **Textbook TanStack Start migration:** zero React-Router residue, correct file-based routes,
  `ssr: false` on the OAuth callback, root providers + head metadata + pre-paint theme script all
  in `__root.tsx`, and the OAuth client kept behind a dynamic import.
- **The project's own `code-review-rules.md` is genuinely followed:** no `as any`/`@ts-ignore` in
  authored code, env validation at module init, edge client with `persistSession: false`,
  `cf-connecting-ip` preferred over `x-forwarded-for`, `useRef` (not `useMemo`) for stable
  identity, and no placeholder tests.
- **Tests are a model of the stated rules:** fake timers, never-resolving `Promise.race` mocks
  with `.catch`, `router.matchRoutes` for routing, stable mock objects, and real branch coverage.
- **Edge function is defensive:** payload cap, structured errors + CORS on every path, 429/402/413
  handling, input validation, deterministic `temperature: 0`.
- **CI matches the policy:** typecheck + coverage + lint + format + build on PRs and on every
  push to `main`, with `--frozen-lockfile`. Typecheck, lint, format check, and build all pass
  locally.
- **Changelog and current docs are accurate and in the mandated dated format.**

---

### Verification commands run

- `bun install --frozen-lockfile` — repaired a partial `node_modules` (read-only w.r.t. source).
- `bun run typecheck` — passes (0 errors).
- `bun run lint` — passes (0 errors, 4 `react-refresh` warnings).
- `bun run format:check` — passes.
- `bun run test` — **19 failures / 204 pass** (finding D-1: jsdom/Node `localStorage`).
- `bun run build` — passes; chunk sizes inspected under `.output/` (finding B-1).
