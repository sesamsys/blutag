## Add Clipboard Paste Support for Photos

Enable users to paste images from the clipboard into the photo uploader using keyboard shortcuts (Cmd+V / Ctrl+V) on desktop and via an explicit **Paste** button on mobile (iOS/iPadOS/Android), which triggers the OS-native "Allow Paste" prompt.

### What users will get

- **Desktop**: Press Cmd+V (Mac) or Ctrl+V (Windows/Linux) anywhere on the page to paste copied images — for example, screenshots, images copied from a browser, or files copied from Finder/Explorer.
- **Mobile (iOS/iPadOS/Android)**: Tap the **Paste** pill button in the action bar above the photo grid. iOS shows its native "Allow Paste" / "Don't Allow" prompt, then the clipboard image is added to the next free slot.
- **Multiple images**: If the clipboard contains multiple images (rare but possible), all are added, respecting the 4-photo limit.
- **Same validation as upload**: Pasted images go through the exact same validation as drag-drop and file picker (image type, ≤25MB, supported extensions, slot availability), with the same toast feedback.
- **Helper text**: Empty-state hint reads "Up to 4 photos · 25MB max each · ⌘V / Ctrl+V or tap Paste".

### How it works (technical)

1. **Desktop — global paste listener** in `PhotoUploader.tsx`:
   - Attach a `paste` event listener on `window` via `useEffect`.
   - Read `e.clipboardData.items`, filter for `kind === "file"` and `type.startsWith("image/")`, convert each to a `File` via `item.getAsFile()`.
   - Pass collected files through the existing `handleFiles()` validator so all current rules (size, extension, slot count, error toasts) apply automatically.
   - Skip when focus is in an editable field (`input`, `textarea`, `[contenteditable]`) so paste in the alt-text editor or post composer keeps working normally.

2. **Mobile — explicit Paste button** (the original long-press approach did **not** work on iOS):
   - iOS Safari only fires `paste` events on actually-editable elements (inputs, textareas, contenteditable). Focusing a `tabIndex={0}` `<div>` and long-pressing does **not** surface the OS Paste menu, and even when it appears it does not dispatch a `ClipboardEvent` to a non-editable target.
   - Solution: render a small **Paste** pill button (using `lucide-react`'s `ClipboardPaste` icon) next to **Clear all**. On click it calls `navigator.clipboard.read()` (Async Clipboard API), which iOS 16+ and modern Android Chrome support for images and which triggers the OS-native "Allow Paste" prompt.
   - For each `ClipboardItem`, find the first `image/*` MIME type, call `item.getType(mime)` to get a `Blob`, wrap it in a `File`, and funnel into `handleFiles()`.
   - Graceful fallbacks via `sonner` toasts: "browser doesn't support pasting", "no image found on clipboard", "permission denied", or generic read failure.

3. **Filename handling**: Clipboard images often come without a filename (especially screenshots). Generate one like `pasted-image-{timestamp}.{ext}` based on the MIME type so the existing extension validator accepts them.

4. **No business logic changes**: All state management, EXIF extraction, AI analysis, and session persistence remain untouched. This is purely an additional input path that funnels into `onAddPhotos`.

### Files changed

- `src/components/PhotoUploader.tsx` — added `paste` window listener, `pasteFromClipboard` async handler using `navigator.clipboard.read()`, **Paste** pill button in the action bar, filename generation for unnamed pastes, updated helper text.

### Out of scope

- Pasting non-image content (text, URLs).
- Fetching images from pasted URLs (would require a network request and CORS handling).
- Custom in-app context menu (we use the OS-native permission prompt instead).

### Lessons learned

- `window`-level `paste` listeners are desktop-only in practice. On iOS Safari, the OS Paste menu does not dispatch ClipboardEvents to non-editable elements regardless of `tabIndex` or `aria-label`.
- The Async Clipboard API (`navigator.clipboard.read()`) is the only reliable cross-platform path for reading images on mobile and requires an explicit user gesture (button click) to trigger the permission prompt.
