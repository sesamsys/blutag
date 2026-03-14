
# Add .env to .gitignore and Create .env.example

## Changes

### 1. `.gitignore` — Add environment file rules
Append after line 28:
```text
# Environment files
.env
.env.*
!.env.example
```

### 2. Create `.env.example` — Template for contributors
With dummy values matching the required keys:
```text
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
```

## Files
- `.gitignore` — Append environment file rules
- `.env.example` — Create new file
