# Blutag: TanStack migration, Prettier, three-phase tests and GitHub CI

This plan follows what sesamhu and peterszilagyi.dev ended up with. It skips the in-between "compat shim" stage those projects went through. For you, the app should look and work the same. What changes underneath: the framework, formatting rules, test coverage, and automatic checks on every Lovable commit.

## Part 1: Migrate to TanStack Start, using native patterns from the start

Run the standard upgrade. Then go straight to the end state sesamhu reached on 2026-10-12, so blutag never gets the legacy layer.

**Routes (file-based in `src/routes/`)**
- `__root.tsx` holds the providers that wrap the whole app: QueryClient (via router context), BlueskyAuth, Language, Tooltip and Sonner. It also has `head()` and the root `errorComponent`/`notFoundComponent`.
- `index.tsx` mounts the existing `pages/Index` as a thin route.
- `oauth.callback.tsx` is set to `ssr: false`, because AT Protocol OAuth and its IndexedDB tokens only exist in the browser.
- The catch-all becomes `notFound()` plus the root `notFoundComponent`. No `/404` route.
- No `router-compat` shim. Use typed `Link`/`useNavigate` everywhere, with `defaultPreload: "intent"`.

**Bugs the other projects hit, prevented up front**
- **Theme flash:** the dark-mode code in `main.tsx` moves into an inline script in the root `head()`, so it runs before the page paints. A small effect keeps it in sync after that. This keeps your system-sync dark mode with no white flash.
- **Browser-only code at module load:** IndexedDB session code, the OAuth client, `matchMedia`, `localStorage` (language recents), canvas compression and the EXIF reader must not run while the page renders on the server. Each moves into an effect or a lazy import. Server render errors are checked with a headless browser, not just by running the build.
- **Lost `index.html` content:** title, description, og/twitter tags, the favicon and preloads for the Inter/Caveat fonts all move into the root `head()`.
- **Theme tokens:** the custom colours (Bluesky blue, navy dark background, muted text) move into `src/styles.css` and are recorded in the theme-port record. A sweep then fixes classes Tailwind v4 renamed (`shadow`, `rounded`, `ring`, `outline-none`, `[--var]`), so buttons don't silently disappear.
- **One toast system:** keep `sonner`. Delete the old shadcn `use-toast`, `toast` and `toaster` files if nothing uses them.
- **One error layer:** the class `ErrorBoundary` gets replaced by the route error components, which use a shared error view built on your existing `AppError` messages.
- **Build config:** the custom `manualChunks` setup is dropped, because the wrapper manages its own chunking. If any bundle grows beyond the old limit, I'll note it.

**Kept as they are**
- The `analyze-photo` backend function, which has IP-based rate limiting and the payload limits.
- `public/oauth/client-metadata.json`, because Bluesky fetches it at a fixed URL.
- The Bluesky posting flow, which runs in the browser.

## Part 2: Prettier (same as the other projects)
- `.prettierrc.json`: semi, double quotes, trailing commas `all`, printWidth 100, tabWidth 2, arrowParens `always`.
- `.prettierignore`: build output, the generated route tree and generated backend files, lockfiles, `.lovable`, `.kiro/steering`, `docs/` and `supabase/functions`.
- Add the scripts `format`, `format:check` and `typecheck`. Add `eslint-config-prettier` so ESLint and Prettier don't conflict.
- Format the whole codebase once, as a single separate step.

## Part 3: Test coverage in three phases (90 tests today)

**Phase 1: pure logic**
- Fill the remaining gaps in `retry`, `error-messages`, `rate-limiter`, `concurrent`, `bluesky-embed` and `session-persistence`, with one test per branch.
- New tests for `languages` and `language-preference` (recents, default `en`), `metaData`, handle validation, and the alt-text/post length limits.
- Pull any logic currently buried in components into small helpers under `src/lib`, for example the embed choice (photo grid vs gallery) and the character counting.

**Phase 2: hooks and contexts**
- A shared mock of the backend client in `src/test/mocks/`, plus a query-provider test wrapper.
- `LanguageContext`: the default language, persistence, and recents order.
- `BlueskyAuthContext`: signed-out and signed-in states, plus sign-out clearing state. The OAuth client is mocked.
- The alt-text request: success, rate limited (429), quota (402) and retry. All timing tests use fake timers.

**Phase 3: route and component smoke tests**
- Match-only routing tests for `/`, `/oauth/callback` and unknown URLs. Also confirm the callback route is browser-only.
- Render smoke tests for:
  - PhotoUploader: empty state, and the 10-photo and 25 MB limits.
  - AltTextResult: editing, the counter and copy, including a failed copy.
  - PostComposer: the 300-character limit and the duplicate-post guard. The existing aspectRatio tests stay.
  - LanguagePicker.

## Part 4: GitHub Actions
`.github/workflows/ci.yml` runs on every push to `main` (this covers Lovable's commits) and on every pull request. It uses Bun 1.3.3 and runs these steps in order:
1. `bun install --frozen-lockfile`
2. typecheck
3. test
4. lint
5. `prettier --check .`
6. build

## Docs and rules
- `AGENTS.md` (new): rules for the framework and routes, SSR safety, `head()` metadata, the theme script, the browser-only OAuth route, sonner only, query hooks in `src/hooks`, "tests ship with changes" and "a bug fix brings a regression test", and Prettier as a gate.
- Update the `.kiro/steering` files, the README and CONTRIBUTING to remove references to React Router and `index.html`.
- Update the project memory note about using Vite `import.meta.env`, which still applies.
- `CHANGELOG.md`: a dated entry for each part.

## Order and verification
Run the parts in this order: migration, then Prettier, then test phases 1 to 3, then CI. Each step is checked before moving on:
- Typecheck in strict mode, all tests, lint, `prettier --check` and the build all pass.
- A headless browser test covers the home page in light and dark mode with no flash, upload, the alt-text flow, the language picker, the OAuth callback page, an unknown URL, and no server-render errors in the logs.

## Technical notes
- Vitest moves to the template config (jsdom). The existing tests carry over, and `src/test/setup.ts` keeps the `matchMedia` stub.
- Bun stays as the package manager, and `bun.lock` is committed.
- The Bluesky OAuth redirect and client metadata URLs stay the same, so existing sessions and logins keep working.
