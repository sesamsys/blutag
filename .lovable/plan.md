

## Audit: Codebase vs. Updated Workspace Rules

### Status Summary

| Area | Status |
|------|--------|
| `README.md` | ✅ Clean — uses `bun run test` |
| `CONTRIBUTING.md` | ✅ Clean — uses `bun run test` |
| `docs/testing-implementation.md` | ✅ Clean — uses `bun run test` |
| `docs/production-readiness-plan.md` | ✅ Clean — uses `bun run dev`, `bun.lockb` |
| `.kiro/steering/development-standards.md` | ✅ Clean — documents `bun run test` warning |
| `.gitignore` | ✅ Clean — ignores `package-lock.json`, tracks `bun.lock` |
| No remaining `npm` references | ✅ Confirmed via search |
| No bare `bun test` references | ✅ Confirmed via search |

### Issues Found

**1. `.kiro/steering/testing-deployment.md` — Still references `npm`** (lines 36, 65–67)
- Line 36: `npm run dev` → `bun run dev`
- Line 65: `npm run dev` → `bun run dev`
- Line 66: "Use npm for all package management" → update to Bun
- Line 67: `package-lock.json` → `bun.lockb`

**2. `.kiro/steering/testing-deployment.md` — Mentions "Supabase dashboard"** (line 97)
- Should say "Lovable Cloud" per communication guidelines

**3. `docs/production-readiness-plan.md` — References both lockfiles** (line 458)
- Says "including both `bun.lockb` and `package-lock.json`"
- `.gitignore` ignores `package-lock.json`, so committing it is contradictory
- Should say just `bun.lockb` (or `bun.lock`)

### Plan

1. **`.kiro/steering/testing-deployment.md`** — Replace all `npm` references with `bun` equivalents and change "Supabase dashboard" to "Lovable Cloud" on line 97.

2. **`docs/production-readiness-plan.md` line 458** — Remove `package-lock.json` reference, keep only `bun.lockb`.

3. **`.kiro/steering/development-standards.md`** — Remove the line about committing `package-lock.json` (if present), since `.gitignore` excludes it.

