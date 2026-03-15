
## Update Documentation for Bun as Primary Package Manager

### Context
The project now uses Bun internally within Lovable. Documentation currently instructs contributors to use npm exclusively. All package manager references need to be updated to Bun while maintaining compatibility notes about the dual-lockfile setup.

### Files to Update

1. **README.md** (lines 19-48)
   - Prerequisites: `npm` → `[Bun](https://bun.sh/)`
   - Setup: `npm install` → `bun install`
   - Dev server: `npm run dev` → `bun run dev`
   - Tests: `npm test` → `bun test`

2. **CONTRIBUTING.md** (lines 10-72)
   - Prerequisites: `npm` → `[Bun](https://bun.sh/)`
   - Setup commands: `npm install`, `npm run dev` → `bun install`, `bun run dev`
   - Test commands (3 occurrences): `npm test` → `bun test`

3. **.kiro/steering/development-standards.md** (lines 86-90)
   - Rewrite Package Manager section to:
     - State Bun is the primary package manager
     - Note that both `bun.lockb` and `package-lock.json` are committed for compatibility
     - List standard commands: `bun install`, `bun run <script>`, `bun test`
     - Mention Lovable's CD pipeline uses Bun internally

4. **docs/testing-implementation.md** (lines 116-135)
   - `npm test` → `bun test`
   - `npm run test:watch` → `bun run test:watch`
   - `npm run test:coverage` → `bun run test:coverage`
   - Pre-commit hook: `npm test` → `bun test`

5. **docs/production-readiness-plan.md** (lines 454-459)
   - `npm run dev` → `bun run dev`
   - Add `bun.lockb` to files to commit alongside `package-lock.json`
