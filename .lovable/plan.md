
Change the "Drag photos here" text and arrow from grey (`text-muted-foreground`) to Bluesky blue (`text-primary`).

**Changes needed in `src/components/PhotoUploader.tsx`:**
- Line 127: Change `text-muted-foreground` to `text-primary` on the span
- Line 138: Change `text-muted-foreground` to `text-primary` on the SVG
