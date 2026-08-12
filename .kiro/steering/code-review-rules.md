# Code Review Rules

Rules derived from past code review findings. Apply them when generating or modifying any code in this project.

## Cleanup

- Remove all template scaffold files before considering a feature complete.
- Never ship placeholder tests like `expect(true).toBe(true)`.
- When you choose one implementation of something (toast library, auth system, UI component), remove the alternative entirely — including its provider, imports, and backing modules.

## Environment and Configuration

- Always validate required `import.meta.env.VITE_*` variables at module initialization. If a variable is missing, throw immediately with a descriptive message rather than passing `undefined` to a constructor.
- In Vite projects, use `import.meta.env.DEV` instead of `process.env.NODE_ENV === "development"`.
- When creating a Supabase client that is used only for edge function calls (not Supabase Auth), set `auth: { persistSession: false, autoRefreshToken: false }` and do not configure a `storage` property.

## TypeScript

- Do not use `as any` to work around a union type. Write a proper type guard (`Array.isArray()`, `instanceof`, or a discriminant check) instead.
- Do not use non-null assertions (`!`) across async boundaries. Capture the value in a variable before any `await` and validate it explicitly.
- Do not use inline magic literals for values that already have a named constant. If `MAX_ALT_TEXT_LENGTH` exists in `constants.ts`, import and use it everywhere.

## React

- Do not write `useEffect(() => { return cleanup; }, [])` when the cleanup function closes over component state. Either include the state in the dependency array or remove the effect. Never silence the lint warning with a comment and ship it.
- Do not use `useMemo` with an empty dependency array to create stable mutable objects. Use `useRef` instead — `useMemo` is an optimization hint, not an identity guarantee.

## Security

- In edge functions behind Cloudflare, always prefer `cf-connecting-ip` over `x-forwarded-for` as the primary source for client IP. `x-forwarded-for` is user-controlled and trivially spoofable.

## Testing

- Tests must cover the branches that exist in the code, not just the happy path. For every function with conditional return paths, include at least one test per branch.
- Do not write timeout-sensitive tests using real timers with tight tolerances. Use `vi.useFakeTimers()` and `vi.advanceTimersByTimeAsync()` instead.
- When testing code that uses `Promise.race` with a timeout branch, mock the slow function with a never-resolving promise (`new Promise(() => {})`) rather than a long `setTimeout`, and attach `.catch(() => {})` to it to prevent unhandled rejection warnings.
