# Adopt Code-Review Steering Rules

Capture the code-review rules you pasted as durable project standards, and clear the two build errors currently blocking the project.

## Fix build errors first

1. `src/components/ui/sidebar.tsx` imports `@/hooks/use-mobile`, which doesn't exist. The sidebar component is unused anywhere in `src/` — delete the file (this is exactly the "remove template scaffold" rule).
2. `src/lib/exif.test.ts:17` casts a plain object straight to `ReturnType<typeof ExifReader.load>`. Change the cast to go through `unknown` so the test helper type-checks under strict mode.

## What gets added

1. **New steering file** `.kiro/steering/code-review-rules.md` containing the rules grouped as you wrote them: Cleanup, Environment & Configuration, TypeScript, React, Security, Testing.
2. **Cross-reference** from `.kiro/steering/development-standards.md` pointing to the new file, so the existing standards doc doesn't duplicate content.
3. **Project memory** entries so the rules are applied without needing to be re-pasted:
   - A `preference` memory holding the full rule set.
   - Two one-line Core rules in the memory index: no `as any` / no non-null assertions across `await`; Vite `import.meta.env.DEV` over `process.env.NODE_ENV`.
4. **CHANGELOG.md** entry under `Changed` (standards) and `Fixed` (build errors).

## Optional follow-up (say the word and I'll include it)

A one-pass audit of the current code against these rules, reporting (not fixing) any violations: placeholder tests, `as any`, `!` across async boundaries, `process.env.NODE_ENV`, inline literals that duplicate constants, `useMemo([])` identity misuse, and untested conditional branches. Known-good already: `cf-connecting-ip` priority in `analyze-photo`, env validation and `persistSession: false` in the Supabase client.

## Technical notes

- Steering files are documentation only — no runtime or build impact.
- No lint/tsconfig changes in this plan; if you'd rather enforce some rules mechanically (e.g. `@typescript-eslint/no-non-null-assertion`, `no-explicit-any`), that's a separate change and will likely surface existing errors.
