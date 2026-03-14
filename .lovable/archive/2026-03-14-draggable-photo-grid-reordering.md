# Draggable Photo Grid Reordering

## Approach
Add `@dnd-kit/core` and `@dnd-kit/sortable` — the standard React drag-and-drop library that supports smooth CSS transform-based animations, sortable lists/grids, and visual drag overlays.

## How it works
- Wrap the photo grid in a `DndContext` + `SortableContext` with a grid-based sorting strategy
- Each filled photo slot becomes a `useSortable` item with CSS transform transitions
- During drag: a semi-transparent overlay shows the dragged photo; remaining items animate into their new positions via `transform` transitions
- On drop: fire a reorder callback that updates the `photos` array in Index.tsx
- Empty slots remain static (not draggable)
- The existing file-drop upload continues to work (dnd-kit uses pointer sensors, not native HTML drag events)

## Files

### New dependency
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

### `src/components/PhotoUploader.tsx`
- Import DndContext, SortableContext, useSortable, arrayMove
- Wrap filled photo cells in sortable wrappers with transform/transition styles
- Use `DragOverlay` to show a floating preview of the dragged photo
- On `onDragEnd`, call a new `onReorderPhotos` prop
- **Bug fix**: Added guard clause in `onDropZone` to only process file drops when `e.dataTransfer.files.length > 0`, preventing conflicts between native drag events and dnd-kit reordering

### `src/components/SortablePhotoItem.tsx` (new)
- Extracted sortable photo cell component using `useSortable`
- Applies `transform` and `transition` from dnd-kit for smooth animation
- Reduces opacity while dragging to indicate the source position
- **Bug fix 1**: Added `draggable={false}` and `pointer-events-none` to the `<img>` element to prevent native browser drag behavior from interfering with dnd-kit
- **Bug fix 2**: Moved `attributes` and `listeners` to the container div (instead of a separate handle) so the entire photo is draggable
- **Bug fix 3**: Added `touch-none` class and `onPointerDown={(e) => e.stopPropagation()}` to the remove button to prevent drag initiation when clicking the X button

### `src/pages/Index.tsx`
- Add `handleReorderPhotos` callback using `arrayMove`
- Pass it to `PhotoUploader` as `onReorderPhotos`
- **Bug fix**: Changed the ObjectURL cleanup effect dependency from `[photos]` to `[]` so preview URLs are only revoked on component unmount, preventing thumbnails from disappearing during subsequent drag operations

## Bug Fixes Summary

| Issue | Cause | Solution |
|-------|-------|----------|
| Photo duplicates in next slot when dragging | Native drag event fired alongside dnd-kit | Add `draggable={false}` to images; check `files.length > 0` in drop handler |
| Photos not draggable at all | `attributes`/`listeners` attached to wrong element | Move drag props to container div; add `pointer-events-none` to image |
| Thumbnail missing on second drag | ObjectURLs revoked after every state update | Change effect dependency to `[]` so cleanup only runs on unmount |
