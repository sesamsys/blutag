

# Accessibility Improvements: PhotoUploader & AltTextResult

## Changes

### PhotoUploader
1. **Drop zone**: Add `role="region"`, `aria-label="Photo upload area"`, and `aria-live="polite"` for drag state announcements
2. **Empty slot buttons**: Add `aria-label="Add photo, slot N of 4"` for context
3. **Remove buttons**: Improve label to `"Remove photo N"` (currently just "Remove photo")
4. **Clear all button**: Add `aria-label="Clear all photos"`
5. **Focus indicators**: Add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` to all interactive elements (empty slots, remove buttons, clear all)
6. **Hidden file input**: Add `aria-hidden="true"` and `tabIndex={-1}`
7. **Live region**: Add a visually hidden `aria-live="polite"` span announcing photo count changes (e.g., "3 of 4 photos added")
8. **Decorative SVG**: Add `aria-hidden="true"` to the arrow SVG

### AltTextResult
1. **Card container**: Add `role="article"` and `aria-label="Alt text for photo N"` (requires passing an index prop)
2. **Thumbnail img**: Change alt from generic "Thumbnail" to `"Preview of uploaded photo"`
3. **Textarea**: Add `aria-label="Alt text description"` and `id` for label association
4. **Character count**: Add `aria-live="polite"` so screen readers announce count changes (debounced via CSS)
5. **Copy button**: Add `aria-live="polite"` feedback — announce "Copied to clipboard" state
6. **Spinner**: Add `role="status"` and `aria-label="Analyzing photo"` to the loading state
7. **Focus indicators**: Add `focus-visible:ring-2 focus-visible:ring-ring` to the copy button

### Index.tsx (minor)
- Pass `index` prop to `AltTextResult` for contextual ARIA labels

## Technical Notes
- Focus ring styles follow the existing pattern from `input.tsx`: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Use `sr-only` utility class for visually hidden live regions
- No new dependencies needed

