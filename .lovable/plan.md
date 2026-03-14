

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

### `src/components/SortablePhotoItem.tsx` (new)
- Extracted sortable photo cell component using `useSortable`
- Applies `transform` and `transition` from dnd-kit for smooth animation
- Reduces opacity while dragging to indicate the source position

### `src/pages/Index.tsx`
- Add `handleReorderPhotos` callback using `arrayMove`
- Pass it to `PhotoUploader` as `onReorderPhotos`

