# Contributing to Blutag

Thanks for your interest in contributing to Blutag! This guide will help you get started.

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Bun](https://bun.sh/)

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/<your-username>/blutag.git
cd blutag

# Install dependencies
bun install

# Copy the environment template
cp .env.example .env
# Fill in the values — see .env.example for details

# Start the dev server
bun run dev
```

Open `http://127.0.0.1:8080` — Bluesky sign-in requires a loopback IP, so `localhost` redirects there.

### Running Checks

```bash
bun run test        # unit tests
bun run typecheck   # strict TypeScript
bun run lint        # ESLint + Prettier rules
bun run format      # auto-format with Prettier
bun run build       # production build
```

## How to Contribute

### Reporting Bugs

Open an [issue](https://github.com/sesamsys/blutag/issues) with:

- A clear, descriptive title
- Steps to reproduce the problem
- Expected vs. actual behavior
- Browser/OS information
- Screenshots if applicable

### Suggesting Features

Open an issue tagged **enhancement** describing:

- The problem the feature would solve
- Your proposed solution
- Any alternatives you've considered

### Submitting Changes

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
3. **Make your changes** — keep commits focused and atomic
4. **Run the checks** CI will run:
   ```bash
   bun run typecheck && bun run test && bun run lint && bun run format:check && bun run build
   ```
5. **Push** your branch and open a **Pull Request**

## Pull Request Guidelines

### PR Title

Use a clear, descriptive title. Prefix with a type:

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `test:` — adding or updating tests
- `chore:` — tooling, config, dependencies

Example: `feat: add keyboard shortcuts for alt text editing`

### PR Description

Include:

- **What** the PR does and **why**
- **How** to test the changes
- Screenshots for UI changes
- Link to the related issue (e.g., `Closes #42`)

### Review Process

- PRs require at least one approving review before merge
- Address review feedback by pushing new commits (don't force-push during review)
- Keep PRs small and focused — one logical change per PR

## Code Style

- **TypeScript** — strict mode, no `any` unless absolutely necessary
- **React** — functional components with hooks
- **Tailwind CSS** — use semantic design tokens from the design system; avoid hardcoded color values
- **Formatting** — Prettier (`.prettierrc.json`, 100 columns); run `bun run format` before committing
- **Routing** — TanStack Router file routes in `src/routes/`; use its `Link` / `useNavigate`
- **Tests** — follow the three test phases in `AGENTS.md`; bug fixes include a regression test

## Project Structure

```
src/
├── components/     # React components
│   ├── ui/         # shadcn/ui primitives
│   └── icons/      # Custom icon components
├── contexts/       # React context providers
├── hooks/          # Custom React hooks
├── lib/            # Utilities, helpers, constants
├── pages/          # Page components rendered by routes
├── routes/         # TanStack Router file routes (__root.tsx = shell, providers, <head>)
├── test/           # Shared test setup, mocks and render helpers
└── types/          # TypeScript type definitions
supabase/
└── functions/      # Edge functions (Deno runtime)
```

## Questions?

Feel free to open an issue or reach out on [Bluesky](https://bsky.app/profile/sesam.hu).

Thank you for helping make Blutag better! 🦋
