## Add Clipboard Paste Support for Photos

Enable users to paste images from the clipboard into the photo uploader using keyboard shortcuts (Cmd+V / Ctrl+V) on desktop and via the native context menu paste action on mobile (iOS/iPadOS/Android).

### What users will get

- **Desktop**: Press Cmd+V (Mac) or Ctrl+V (Windows/Linux) anywhere on the page to paste copied images — for example, screenshots, images copied from a browser, or files copied from Finder/Explorer.
- **Mobile (iOS/iPadOS/Android)**: Long-press inside the upload area to bring up the native "Paste" option from the OS context menu. Tapping Paste inserts any image currently on the clipboard.
- **Multiple images**: If the clipboard contains multiple images (rare but possible), all are added, respecting the 4-photo limit.
- **Same validation as upload**: Pasted images go through the exact same validation as drag-drop and file picker (image type, ≤10MB, supported extensions, slot availability), with the same toast feedback.
- **Subtle hint**: Update the empty-state helper text to mention paste, e.g. "Up to 4 photos · 10MB max each · Paste with ⌘V / Ctrl+V".

### How it works (technical)

1. **Global paste listener** in `PhotoUploader.tsx`:
   - Attach a `paste` event listener on `window` via `useEffect`.
   - Read `e.clipboardData.items`, filter for `kind === "file"` and `type.startsWith("image/")`, convert each to a `File` via `item.getAsFile()`.
   - Pass collected files through the existing `handleFiles()` validator so all current rules (size, extension, slot count, error toasts) apply automatically.
   - Skip when focus is in an editable field (`input`, `textarea`, `[contenteditable]`) so paste in the alt-text editor or post composer keeps working normally.
   - Skip when no images are present in the clipboard (let normal text paste pass through).

2. **Mobile context-menu paste**:
   - Make the upload grid container focusable (`tabIndex={0}`) and add an invisible/hidden `contentEditable` strategy is **not** needed — modern iOS Safari and Android Chrome surface the OS Paste menu on long-press over a focused region and fire a standard `paste` event with `clipboardData.items` containing image files. The same global listener handles it.
   - Add `aria-label` clarifying the paste affordance.

3. **Filename handling**: Clipboard images often come without a filename (especially screenshots). Generate one like `pasted-image-{timestamp}.png` based on the MIME type so the existing extension validator accepts them.

4. **No business logic changes**: All state management, EXIF extraction, AI analysis, and session persistence remain untouched. This is purely an additional input path that funnels into `onAddPhotos`.

### Files to change

- `src/components/PhotoUploader.tsx` — add paste effect, helper to convert clipboard items to files, generate filenames for unnamed pastes, update helper text.

### Out of scope

- Pasting non-image content (text, URLs).
- Fetching images from pasted URLs (would require a network request and CORS handling).
- Custom in-app context menu (we rely on the OS-native one for best mobile UX).
