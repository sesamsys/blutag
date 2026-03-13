# Add AI Transparency & Privacy Disclosure

## What & Why

The app uses AI to analyze user-uploaded photos but currently only says "Photos are only kept temporarily for analysis and deleted after your session." Users deserve to know:
- That AI (specifically Google Gemini) generates the alt text
- How their photos are processed (sent to an AI model, not stored permanently)
- That EXIF metadata may be used for context
- That no data is used to train models

## Changes

### 1. New `AboutDialog` component
A modal dialog (using the existing `dialog.tsx` UI component) triggered by an "About & Privacy" link in the footer. Contents:

**How it works**
- Photos are sent to Google Gemini (an AI model) to generate descriptive alt text
- EXIF metadata (date, location) may be used to improve descriptions but raw values are never included in the output
- Photos are processed in-memory and not stored permanently — they are deleted when your session ends

**Privacy**
- Photos are not used to train AI models
- No account is required to generate alt text
- No personal data is collected or shared with third parties
- Bluesky login (optional, for posting) uses the AT Protocol OAuth flow — Blutag never sees your password

**Open source**
- Link to GitHub repo

### 2. Footer update (`Index.tsx`)
- Replace the existing privacy line with a shorter version plus an "About & Privacy" button that opens the dialog
- Keep the existing footer links

### 3. Constants
- Add the AI model display name to `constants.ts` for single-source-of-truth

## Technical Notes
- Uses existing `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger` from `src/components/ui/dialog.tsx`
- No new dependencies
- ~1 new file, ~2 edited files
