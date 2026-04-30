## Goal

Let users pick the language used for both AI-generated alt text and the outgoing Bluesky post's language tag (`langs[]`). Default to English on first use, then remember the last chosen language. Signed-in Bluesky users get a hint pulled from their account's post language preferences. The picker shows a curated short list with a searchable "Other" expansion to the full ISO 639-1 set.

## UX

- A new compact language pill button placed in the **PostComposer** card (next to the character counter) and a mirrored small selector in the **upload step** (above the "Generate alt text" button) so the language is visible *before* generation.
  - Both controls are bound to one shared selection — changing in either updates the other.
- Clicking the pill opens a popover containing:
  - A search input
  - A "Recent" section (up to 3 last-used languages) when present
  - A "Common" section (curated ~15 languages, native + English name)
  - When the search query has no curated match, results from the full ISO 639-1 list are shown under "Other".
- Selected language is shown as e.g. `🌐 English` (globe icon, no flag — flags don't map cleanly to languages).
- Empty/uploader hint text gets a trailing fragment: `· Generating in English` (clickable to open the picker).

## Behaviour

### Defaulting
1. First load: language = `en`.
2. After any selection: persist to `localStorage` under `blutag.lang.last` and prepend to `blutag.lang.recent` (deduped, capped at 3).
3. On Bluesky sign-in: call `agent.app.bsky.actor.getPreferences()`, look for the `app.bsky.actor.defs#postLanguagesPref` entry. If present and the user hasn't manually changed the language this session, set the active language to the first entry from that preference (and merge the rest into `recent`). Never overwrite an explicit user choice.
4. On sign-out: keep the local recents but reset active to last local choice (or `en`).

### Alt text generation
- Frontend passes `language` (BCP-47 code, e.g. `en`, `pt-BR` is normalized to `pt`) in the body to the `analyze-photo` edge function.
- Edge function appends a language directive to the user prompt: `Write the alt text in {languageName} ({code}).` It also adds a hard rule to the system prompt: respond ONLY in the requested language, no translation/explanations.
- Validation: code must match `^[a-z]{2,3}(-[A-Z]{2})?$`. Falls back to `en` on invalid input.

### Bluesky posting
- In `PostComposer.handlePost`, set `record.langs = [activeLang]` on the `app.bsky.feed.post` record. AT Proto supports up to 3 codes; we only send one (matches "One language for both" decision).

## Technical notes

### New files
- `src/lib/languages.ts` — exports:
  - `CURATED_LANGUAGES`: array of `{ code, nameEn, nativeName }` (~15 entries: en, es, pt, fr, de, ja, ko, zh, it, nl, tr, pl, ru, ar, hi).
  - `ALL_LANGUAGES`: array sourced from a small ISO 639-1 dataset (inline JSON, ~180 entries — keeps bundle <10KB; no new dep).
  - Helpers: `getLanguageName(code)`, `normalizeLangCode(code)`, `isValidLangCode(code)`.
- `src/lib/language-preference.ts` — small module wrapping localStorage:
  - `getActiveLanguage()`, `setActiveLanguage(code)`, `getRecentLanguages()`, `addRecentLanguage(code)`.
- `src/contexts/LanguageContext.tsx` — provider exposing `{ language, setLanguage, recent }`. Hydrates from localStorage on mount; subscribes to a custom `bluesky:preferences-loaded` event (or accepts `useBlueskyAuth` agent and reads preferences in an effect when `agent` becomes available and the user hasn't touched the picker yet).
- `src/components/LanguagePicker.tsx` — popover-based combobox using existing shadcn `Popover` + `Command` components. Two visual variants: `"pill"` (used in composer) and `"compact"` (used in uploader hint).

### Edited files
- `src/App.tsx` — wrap tree with `<LanguageProvider>` (inside `<BlueskyAuthProvider>` so it can read the agent).
- `src/pages/Index.tsx`:
  - Read `language` from context, pass it as `body.language` in the `supabase.functions.invoke("analyze-photo", ...)` call.
  - Render `<LanguagePicker variant="compact" />` near the "Generate alt text" button.
- `src/components/PostComposer.tsx`:
  - Render `<LanguagePicker variant="pill" />` in the meta row.
  - Add `record.langs = [language]` when building the post record.
- `src/components/PhotoUploader.tsx` — append `· Generating in {language}` to the helper hint (clickable, opens the picker).
- `supabase/functions/analyze-photo/index.ts`:
  - Accept and validate optional `language` field on the request body (regex above, default `en`).
  - Pass it to the prompt builders.
- `supabase/functions/analyze-photo/prompts.ts`:
  - Add a small `LANGUAGE_NAMES` map for the curated codes (so the model gets a human-readable name) with a generic fallback.
  - Update `SYSTEM_PROMPT` with a clause: "Always respond in the requested output language. Do not translate, explain, or add notes in other languages."
  - Update `USER_PROMPT_DEFAULT` and `USER_PROMPT_WITH_CONTEXT` to take a language argument and append `Write the alt text in {nativeName} ({code}).`.

### Backwards compatibility
- The edge function still works when `language` is omitted (defaults to `en`).
- Existing in-flight sessions in IndexedDB are unaffected — language is not stored on `PhotoFile`, only globally.

### Out of scope (call out)
- Translating UI strings (i18n of the app chrome). Only the *generated* alt text language changes.
- Persisting the selection back to the user's Bluesky `postLanguagesPref` preference (read-only for now).
- Multi-language post tagging.

## QA checklist

- Default load shows `English` with no recents.
- Pick `Japanese` → reload → still `Japanese`; recents shows `[Japanese]`.
- Pick `Spanish`, then `French` → recents = `[French, Spanish]`, active = `French`.
- Generate alt text in non-English language returns text in that language.
- Posted skeet on Bluesky shows correct language indicator (visible in app.bsky.feed.post `langs` field via the public API).
- Sign in with a Bluesky account that has post languages set → first sign-in of the session pre-selects the first one.
- Search "swa" finds Swahili (sw) under "Other".
- Picker is keyboard accessible and meets the 44px touch target rule on the pill trigger.
