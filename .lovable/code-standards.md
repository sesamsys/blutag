# Code Standards & Best Practices

Copy of the Lovable Workspace Knowledge applied to all projects (2026-10-13).

## Tooling & Runtime

• Package manager: Bun is REQUIRED.
• Always commit `bun.lock` with dependency changes.
• Run tests using `bun run test` (Vitest), never `bun test`.
• Scripts required in `package.json`:

- `"typecheck": "tsc --noEmit"`
- `"test": "vitest run"`
- `"lint": "eslint ."`
- `"format": "prettier --write ."`
- `"format:check": "prettier --check ."`
- `"build": "vite build"`

## Architecture & Framework (TanStack Start)

• Stack: TanStack Start v1 with Vite and file-based routing (`src/routes/`).
• Routing:

- Use native `@tanstack/react-router` primitives (`Link`, `useNavigate`, `useRouter`, `createFileRoute`).
- NEVER install or import `react-router-dom`, `BrowserRouter`, or compatibility shims.
- Every parent and pathless layout route MUST render `<Outlet />`.
- Root layout, providers, and `<head>` metadata belong in `src/routes/__root.tsx`.
- Never edit generated `src/routeTree.gen.ts`.

• Server & Browser Boundaries (SSR Safety):

- Route modules are evaluated on the server: NEVER access browser globals (`window`, `document`, `localStorage`, `IndexedDB`, canvas) at module top-level.
- Mark browser-dependent routes with `ssr: false`, or isolate browser globals inside `useEffect` or dynamic `await import(...)` calls.

• Data Loading:

- Default to route `loader` functions using TanStack Query: `context.queryClient.ensureQueryData(queryOptions)`.
- Components consume loaded route data via `useSuspenseQuery(queryOptions)` rather than component-level `useEffect` fetches.

## Code Formatting (Prettier)

• Prettier is the single source of truth for code formatting across all files.
• Every project MUST have a root `.prettierrc.json` with this exact configuration:

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "arrowParens": "always"
}
```

• Maintain `.prettierignore` ignoring `node_modules`, `dist`, `.output`, `routeTree.gen.ts`, and lockfiles.
• All commits and CI pipelines must pass `bun run format:check` without diffs.
• ESLint must not define formatting rules that conflict with Prettier.

## TypeScript Configuration

• Strict mode is REQUIRED:

- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `strictNullChecks: true`
- `noImplicitAny: true`
- `noFallthroughCasesInSwitch: true`

• Zero compiler errors or warnings.
• Never use `any`, `@ts-ignore`, or `@ts-nocheck`. Use `unknown` and narrow types properly.
• Avoid non-null assertions (`!`) across async boundaries; capture and validate beforehand.
• Prefer explicit return types for public APIs, custom hooks, and complex logic.

## Testing Strategy (Three-Phase Architecture)

All projects must establish automated test coverage from day one using a three-phase approach:

1. Phase 1 — Pure Logic: Unit tests for pure functions, math, validators, parsers, and utilities (`src/lib/`). Zero React or DOM mocks.
2. Phase 2 — State & Hooks: Custom hooks, contexts, and data access with stable mock harnesses (`src/test/mocks/`). Context mocks must return stable objects across renders to prevent infinite loop bugs.
3. Phase 3 — Component & Route Smoke Tests: Key UI components and file routes. Test routes using `router.matchRoutes` rather than rendering full document trees to avoid stylesheet and network dependencies.

Rules:

• High test coverage on business-critical paths (target ≥60% overall, ≥80% for Phase 1 pure logic).
• Bug regression rule: Every bug fix MUST include a regression test named after the user-visible symptom.

## Continuous Integration (CI)

• Every project must include a GitHub Actions workflow (`.github/workflows/ci.yml`) triggered on push to `main` and on pull requests.
• CI must use Bun (`oven-sh/setup-bun`) and run all verification gates with frozen lockfiles:

1. Type check (`bun run typecheck`)
2. Tests with coverage (`bun run test`)
3. Linter (`bun run lint`)
4. Format check (`bun run format:check`)
5. Production build (`bun run build`)

## Code Organization & Structure

• File Structure (Guideline):

- `components/` Reusable UI components
- `components/ui/` Base UI primitives (shadcn/ui)
- `features/` Feature-based modules
- `hooks/` Shared custom hooks (queries and mutations)
- `lib/` Pure utilities, clients, and business helpers
- `config/` Global configuration and constants
- `types/` Shared TypeScript types
- `routes/` TanStack Start file routes
- `test/` Shared test mocks, setup, and test providers

• Naming Conventions:

- Components: PascalCase (e.g., `UserCard.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useUserData.ts`)
- Variables & functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Types & interfaces: PascalCase

• Import Order:

1. External libraries / framework modules
2. UI primitives & design system components
3. Custom hooks
4. Services / integrations / API clients
5. Utilities and helpers
6. Types
7. Relative imports

## Code Quality & Hygiene

• Constants (Avoid Magic Numbers):

- Avoid hardcoded values, thresholds, and dimension literals.
- Global constants live in `config/` or `lib/constants.ts`; feature constants are colocated with features.

• Data Fetching (React Query):

- Do not fetch directly in UI components.
- Extract queries into custom `useQuery` hooks and mutations into `useMutation` hooks.

• Logging:

- No `console.log` in production code. Use a centralized environment-aware logger.

• Error Handling:

- Separate technical error logs (for debugging) from user-facing error messages.
- Provide actionable context when logging errors.

• Comments:

- Explain "why", not "what".
- Use JSDoc for public functions, custom hooks, and non-trivial algorithms.

• Styling:

- Use Tailwind CSS with semantic design tokens and shadcn/ui.
- Never hardcode color utilities or hex values (`bg-[#...]`) that bypass theming or break dark mode.

• Code Cleanliness:

- Keep code clean of unused imports, dead code, and commented-out snippets.

## Changelog

• Maintain a simple dated `CHANGELOG.md` file.
• Headings use release dates (`## YYYY-MM-DD`), never semantic version numbers or `[Unreleased]`.
• Group entries under standard categories:

- Added
- Changed
- Fixed
- Security
